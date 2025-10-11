#!/usr/bin/env bash

#
# CRIT-003: Database Migration Script with Advisory Locks
# 
# This script ensures safe, idempotent database migrations in production
# Uses PostgreSQL advisory locks to prevent concurrent migration runs
#
# Usage:
#   ./scripts/run-migrations.sh           # Run pending migrations
#   ./scripts/run-migrations.sh --verify  # Verify migrations only
#   ./scripts/run-migrations.sh --status  # Show migration status
#

set -euo pipefail  # Exit on error, undefined vars, and pipe failures

# Configuration
LOCK_ID=123456789  # Unique advisory lock ID for migrations
MIGRATION_TIMEOUT=300  # 5 minutes timeout for migration lock
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ SUCCESS:${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}❌ ERROR:${NC} $1"
}

# Check required environment variables
check_environment() {
    if [ -z "${DATABASE_URL:-}" ]; then
        log_error "DATABASE_URL environment variable is required"
        exit 1
    fi
    
    if [ -z "${NODE_ENV:-}" ]; then
        log_warn "NODE_ENV not set, defaulting to 'development'"
        export NODE_ENV=development
    fi
    
    log_info "Environment: $NODE_ENV"
}

# Acquire PostgreSQL advisory lock
acquire_lock() {
    log_info "Attempting to acquire migration lock (ID: $LOCK_ID)..."
    
    # Try to acquire lock with timeout
    local lock_acquired=false
    local attempts=0
    local max_attempts=$((MIGRATION_TIMEOUT / 5))  # Try every 5 seconds
    
    while [ $attempts -lt $max_attempts ]; do
        # Attempt to acquire advisory lock (non-blocking)
        local result=$(psql "$DATABASE_URL" -tAc "SELECT pg_try_advisory_lock($LOCK_ID);")
        
        if [ "$result" = "t" ]; then
            lock_acquired=true
            log_success "Migration lock acquired"
            break
        fi
        
        log_warn "Migration lock held by another process, waiting... (attempt $((attempts + 1))/$max_attempts)"
        sleep 5
        ((attempts++))
    done
    
    if [ "$lock_acquired" = false ]; then
        log_error "Failed to acquire migration lock after ${MIGRATION_TIMEOUT}s timeout"
        log_error "Another migration process may be running. Please try again later."
        exit 1
    fi
}

# Release PostgreSQL advisory lock
release_lock() {
    log_info "Releasing migration lock..."
    psql "$DATABASE_URL" -tAc "SELECT pg_advisory_unlock($LOCK_ID);" > /dev/null
    log_success "Migration lock released"
}

# Trap to ensure lock is always released
cleanup() {
    local exit_code=$?
    if [ "$exit_code" -ne 0 ]; then
        log_error "Migration failed with exit code $exit_code"
    fi
    
    # Release lock if we acquired it
    if psql "$DATABASE_URL" -tAc "SELECT pg_advisory_unlock($LOCK_ID);" > /dev/null 2>&1; then
        log_info "Lock cleanup completed"
    fi
    
    exit $exit_code
}

trap cleanup EXIT INT TERM

# Run migrations
run_migrations() {
    log_info "Starting database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Check if migration CLI exists
    if [ ! -f "$SCRIPT_DIR/migrate.ts" ]; then
        log_error "Migration script not found: $SCRIPT_DIR/migrate.ts"
        exit 1
    fi
    
    # Run migrations using the TypeScript CLI
    if npm run migrate:up; then
        log_success "All migrations applied successfully"
        return 0
    else
        log_error "Migration execution failed"
        return 1
    fi
}

# Verify migrations
verify_migrations() {
    log_info "Verifying migrations..."
    
    cd "$PROJECT_ROOT"
    
    if npm run migrate:verify; then
        log_success "Migration verification passed"
        return 0
    else
        log_error "Migration verification failed"
        return 1
    fi
}

# Show migration status
show_status() {
    log_info "Checking migration status..."
    
    cd "$PROJECT_ROOT"
    npm run migrate:status
}

# Main execution
main() {
    local command="${1:-migrate}"
    
    # Check environment
    check_environment
    
    case "$command" in
        --verify)
            # Verify only, no lock needed
            verify_migrations
            ;;
        --status)
            # Status check, no lock needed
            show_status
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  (no args)    Run pending database migrations (default)"
            echo "  --verify     Verify migrations without running"
            echo "  --status     Show migration status"
            echo "  --help       Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  DATABASE_URL    Required: PostgreSQL connection string"
            echo "  NODE_ENV        Optional: Environment (development/staging/production)"
            exit 0
            ;;
        migrate|*)
            # Acquire lock before running migrations
            acquire_lock
            
            # Run migrations (lock will be released by trap on exit)
            if run_migrations; then
                log_success "Migration process completed successfully"
                exit 0
            else
                log_error "Migration process failed"
                exit 1
            fi
            ;;
    esac
}

# Execute main function with all arguments
main "$@"
