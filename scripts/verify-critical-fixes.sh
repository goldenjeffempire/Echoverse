#!/bin/bash
set -e

echo "========================================="
echo "EchoVerse CRITICAL Fixes Verification"
echo "========================================="
echo ""

PASS=0
FAIL=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

check_pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASS++))
}

check_fail() {
  echo -e "${RED}✗${NC} $1"
  ((FAIL++))
}

echo "CRIT-001: Production Environment Variables"
echo "-------------------------------------------"
if [ -f ".env.production.example" ]; then
  check_pass ".env.production.example file exists"
  
  # Check for required variables
  required_vars=(
    "NODE_ENV"
    "DATABASE_URL"
    "SESSION_SECRET"
    "OPENAI_API_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
  )
  
  for var in "${required_vars[@]}"; do
    if grep -q "^$var=" .env.production.example; then
      check_pass "$var is defined"
    else
      check_fail "$var is missing"
    fi
  done
else
  check_fail ".env.production.example file missing"
fi
echo ""

echo "CRIT-002: Hardcoded API Keys Removed"
echo "-------------------------------------------"
if [ -f "server/env.validation.ts" ]; then
  if grep -q "OPENAI_API_KEY.*required" server/env.validation.ts; then
    check_pass "OPENAI_API_KEY required in production"
  else
    check_fail "OPENAI_API_KEY not properly validated"
  fi
  
  if grep -q "STRIPE_WEBHOOK_SECRET.*required\|STRIPE_WEBHOOK_SECRET.*z\.string()" server/env.validation.ts; then
    check_pass "STRIPE_WEBHOOK_SECRET validation exists"
  else
    check_fail "STRIPE_WEBHOOK_SECRET not validated"
  fi
else
  check_fail "env.validation.ts missing"
fi
echo ""

echo "CRIT-003: Database Migration Automation"
echo "-------------------------------------------"
if [ -f "scripts/run-migrations.sh" ]; then
  check_pass "Migration script exists"
  
  if grep -q "advisory lock\|pg_advisory_lock" scripts/run-migrations.sh; then
    check_pass "Advisory locks implemented"
  else
    check_fail "Advisory locks missing"
  fi
  
  if [ -x "scripts/run-migrations.sh" ]; then
    check_pass "Migration script is executable"
  else
    check_fail "Migration script not executable"
  fi
else
  check_fail "run-migrations.sh missing"
fi
echo ""

echo "CRIT-004: Redis Fallback Handling"
echo "-------------------------------------------"
if [ -f "server/config/redis-production.ts" ]; then
  if grep -q "memory.*fallback\|in-memory" server/config/redis-production.ts; then
    check_pass "In-memory fallback implemented"
  else
    check_fail "In-memory fallback missing"
  fi
  
  if grep -q "cacheGet\|cacheSet" server/config/redis-production.ts; then
    check_pass "Cache utility functions exist"
  else
    check_fail "Cache utilities missing"
  fi
else
  check_fail "redis-production.ts missing"
fi
echo ""

echo "CRIT-005: Stripe Webhook Secret Validation"
echo "-------------------------------------------"
if grep -q "STRIPE_WEBHOOK_SECRET" server/env.validation.ts 2>/dev/null; then
  check_pass "Webhook secret in env validation"
else
  check_fail "Webhook secret not in env validation"
fi

if grep -q "constructEvent\|webhook.*signature" server/routes.ts 2>/dev/null || \
   grep -q "constructEvent\|webhook.*signature" server/utils/webhook-signature-fallback.ts 2>/dev/null; then
  check_pass "Signature verification implemented"
else
  check_fail "Signature verification missing"
fi
echo ""

echo "CRIT-006: Global File Upload Size Limit"
echo "-------------------------------------------"
if [ -f "server/middleware/upload-enhanced.ts" ]; then
  if grep -q "preValidateFileSize" server/middleware/upload-enhanced.ts; then
    check_pass "preValidateFileSize middleware exists"
  else
    check_fail "preValidateFileSize middleware missing"
  fi
  
  if grep -q "app.use.*preValidateFileSize" server/index.ts; then
    check_pass "Global middleware applied"
  else
    check_fail "Global middleware not applied"
  fi
else
  check_fail "upload-enhanced.ts missing"
fi
echo ""

echo "CRIT-007: Session Fingerprint Enforcement"
echo "-------------------------------------------"
if [ -f "server/middleware/session-fingerprint.ts" ]; then
  if grep -q "SESSION_STRICT_MODE" server/middleware/session-fingerprint.ts; then
    check_pass "SESSION_STRICT_MODE implemented"
  else
    check_fail "SESSION_STRICT_MODE missing"
  fi
  
  if grep -q "session\.destroy\|destroy.*session" server/middleware/session-fingerprint.ts; then
    check_pass "Session termination on mismatch"
  else
    check_fail "Session termination missing"
  fi
else
  check_fail "session-fingerprint.ts missing"
fi
echo ""

echo "CRIT-008: WebSocket Token Expiration"
echo "-------------------------------------------"
if grep -q "expiresIn.*15m\|expiresIn.*'15m'" server/auth.ts 2>/dev/null; then
  check_pass "JWT token expiration set (15min)"
else
  check_fail "JWT token expiration missing"
fi

if grep -q "invalidateSession\|closeSessionConnections" server/websocket.ts 2>/dev/null; then
  check_pass "Token blacklisting on logout"
else
  check_fail "Token blacklisting missing"
fi
echo ""

echo "========================================="
echo "Summary"
echo "========================================="
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ All CRITICAL fixes verified successfully!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some CRITICAL fixes failed verification${NC}"
  exit 1
fi
