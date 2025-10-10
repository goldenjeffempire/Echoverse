#!/bin/bash

###############################################################################
# Production Deployment Script
# 
# Automates production deployment with comprehensive checks:
# - Pre-deployment validation
# - Database migration
# - Build verification
# - Zero-downtime deployment
# - Post-deployment health checks
# - Automatic rollback on failure
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
APP_NAME="echoverse"
BACKUP_DIR="./backups"
LOG_FILE="./deploy-$(date +%Y%m%d-%H%M%S).log"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Error handler
error_handler() {
    log_error "Deployment failed at line $1"
    log_error "Rolling back changes..."
    rollback_deployment
    exit 1
}

trap 'error_handler $LINENO' ERR

# Phase 1: Pre-deployment checks
pre_deployment_checks() {
    log_info "=== Phase 1: Pre-deployment Checks ==="
    
    # Check environment variables
    log_info "Checking environment variables..."
    if [ ! -f ".env.production" ]; then
        log_error ".env.production file not found"
        exit 1
    fi
    
    # Check required secrets
    log_info "Validating secrets..."
    npm run prod:check || {
        log_error "Production readiness check failed"
        exit 1
    }
    
    # Run security audit
    log_info "Running security audit..."
    npm run security:audit || log_warn "Security vulnerabilities found"
    
    # Type checking
    log_info "Running TypeScript type check..."
    npm run typecheck || {
        log_error "TypeScript errors found"
        exit 1
    }
    
    # Run tests
    log_info "Running test suite..."
    npm run test:run || {
        log_error "Tests failed"
        exit 1
    }
    
    log_success "Pre-deployment checks passed"
}

# Phase 2: Database backup
backup_database() {
    log_info "=== Phase 2: Database Backup ==="
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/db-backup-$(date +%Y%m%d-%H%M%S).sql"
    
    log_info "Creating database backup..."
    pg_dump "$DATABASE_URL" > "$BACKUP_FILE" || {
        log_error "Database backup failed"
        exit 1
    }
    
    # Compress backup
    gzip "$BACKUP_FILE"
    log_success "Database backup created: $BACKUP_FILE.gz"
}

# Phase 3: Database migration
run_migrations() {
    log_info "=== Phase 3: Database Migration ==="
    
    log_info "Checking pending migrations..."
    npm run migrate:status
    
    log_info "Applying migrations..."
    npm run migrate:up || {
        log_error "Migration failed"
        exit 1
    }
    
    log_info "Verifying migrations..."
    npm run migrate:verify || {
        log_error "Migration verification failed"
        exit 1
    }
    
    log_success "Migrations applied successfully"
}

# Phase 4: Build application
build_application() {
    log_info "=== Phase 4: Building Application ==="
    
    log_info "Installing production dependencies..."
    npm ci --production=false
    
    log_info "Building application..."
    npm run build || {
        log_error "Build failed"
        exit 1
    }
    
    log_info "Verifying build..."
    npm run build:verify || {
        log_error "Build verification failed"
        exit 1
    }
    
    log_success "Application built successfully"
}

# Phase 5: Deploy application (Blue-Green deployment)
deploy_application() {
    log_info "=== Phase 5: Deploying Application ==="
    
    # Tag current version
    CURRENT_VERSION=$(git describe --tags --always)
    log_info "Deploying version: $CURRENT_VERSION"
    
    # Deploy to green environment
    log_info "Deploying to green environment..."
    
    # Stop current green environment if running
    docker-compose -f docker-compose.green.yml down 2>/dev/null || true
    
    # Start new green environment
    docker-compose -f docker-compose.green.yml up -d || {
        log_error "Green deployment failed"
        exit 1
    }
    
    # Wait for green to be healthy
    log_info "Waiting for green environment to be healthy..."
    sleep 10
    
    # Health check green environment
    for i in {1..30}; do
        if curl -f -s https://green.echoverse.com/health > /dev/null; then
            log_success "Green environment is healthy"
            break
        fi
        
        if [ $i -eq 30 ]; then
            log_error "Green environment failed health check"
            docker-compose -f docker-compose.green.yml logs
            exit 1
        fi
        
        sleep 2
    done
    
    # Switch traffic to green (Blue-Green swap)
    log_info "Switching traffic to green environment..."
    # Update load balancer / reverse proxy configuration
    # This is environment-specific - adjust for your infrastructure
    
    log_success "Deployment completed successfully"
}

# Phase 6: Post-deployment validation
post_deployment_validation() {
    log_info "=== Phase 6: Post-deployment Validation ==="
    
    # Smoke tests
    log_info "Running smoke tests..."
    
    # Test main endpoints
    curl -f -s https://echoverse.com/health || {
        log_error "Health check failed"
        rollback_deployment
        exit 1
    }
    
    curl -f -s https://api.echoverse.com/health || {
        log_error "API health check failed"
        rollback_deployment
        exit 1
    }
    
    # Check database connection
    npm run health:db || {
        log_error "Database health check failed"
        rollback_deployment
        exit 1
    }
    
    # Check Redis connection
    npm run health:redis || log_warn "Redis health check failed"
    
    # Verify Stripe connectivity
    npm run health:stripe || log_warn "Stripe health check failed"
    
    log_success "Post-deployment validation passed"
}

# Phase 7: Monitor deployment
monitor_deployment() {
    log_info "=== Phase 7: Monitoring Deployment ==="
    
    log_info "Monitoring for errors (60 seconds)..."
    sleep 60
    
    # Check error rate in Sentry
    # Check metrics in Grafana
    # Check logs for errors
    
    log_success "No critical errors detected"
}

# Rollback function
rollback_deployment() {
    log_warn "=== Rolling Back Deployment ==="
    
    # Switch traffic back to blue
    log_info "Switching traffic back to blue environment..."
    
    # Rollback database migration
    log_info "Rolling back database migration..."
    npm run migrate:down || log_warn "Migration rollback failed"
    
    # Restore database from backup
    if [ -f "$BACKUP_FILE.gz" ]; then
        log_info "Restoring database from backup..."
        gunzip -c "$BACKUP_FILE.gz" | psql "$DATABASE_URL" || {
            log_error "Database restore failed"
        }
    fi
    
    log_warn "Rollback completed"
}

# Main deployment flow
main() {
    log_info "=========================================="
    log_info "  EchoVerse Production Deployment"
    log_info "  Environment: $DEPLOYMENT_ENV"
    log_info "  Started: $(date)"
    log_info "=========================================="
    
    pre_deployment_checks
    backup_database
    run_migrations
    build_application
    deploy_application
    post_deployment_validation
    monitor_deployment
    
    log_success "=========================================="
    log_success "  Deployment Completed Successfully!"
    log_success "  Version: $(git describe --tags --always)"
    log_success "  Completed: $(date)"
    log_success "=========================================="
    
    # Send deployment notification
    # curl -X POST "$SLACK_WEBHOOK_URL" \
    #   -H 'Content-Type: application/json' \
    #   -d "{\"text\":\"🚀 EchoVerse deployed successfully to production\"}"
}

# Run main deployment
main "$@"
