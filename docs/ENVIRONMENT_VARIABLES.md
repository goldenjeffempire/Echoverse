# Environment Variables Documentation

## Overview

Complete reference for all environment variables used in EchoVerse platform.

## Critical Security Variables

### JWT & Session Secrets
```bash
# JWT Secret - REQUIRED in production/staging
# Minimum: 64 characters with 3+ character types (uppercase, lowercase, numbers/symbols)
JWT_SECRET=your-super-secure-jwt-secret-with-64-chars-minimum-and-mixed-case-123!

# Session Secret - REQUIRED in production/staging
# Minimum: 32 characters with 3+ character types
SESSION_SECRET=your-secure-session-secret-32-chars-minimum-ABC123!

# Refresh Token Lock Timeout (milliseconds)
# Default: 10000 (10 seconds)
REFRESH_LOCK_TIMEOUT=10000
```

### Encryption Keys
```bash
# File Encryption Key - REQUIRED in production/staging
# Must be exactly 64 hexadecimal characters
FILE_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Two-Factor Authentication Backup Encryption - REQUIRED in production/staging
# Minimum: 32 characters with 3+ character types
TWO_FACTOR_BACKUP_ENCRYPTION_KEY=your-2fa-backup-encryption-key-32-chars-min-ABC123!

# General Encryption Key (legacy)
ENCRYPTION_KEY=your-encryption-key-minimum-32-characters
```

### Webhook & Payment Secrets
```bash
# Stripe Webhook Secret - REQUIRED in production/staging
# Minimum: 64 characters
WEBHOOK_SIGNATURE_SECRET=whsec_your-webhook-secret-minimum-64-characters-required-for-production

# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_... # Production
# STRIPE_SECRET_KEY=sk_test_... # Development
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_... # For frontend
```

## Database Configuration

```bash
# PostgreSQL Connection
DATABASE_URL=postgresql://user:password@host:5432/database

# Test Database (for automated testing)
DATABASE_URL_TEST=postgresql://user:password@host:5432/test_database

# Connection Pool Settings
DB_POOL_MAX=30 # Maximum connections (production: 20-50)
DB_POOL_MIN=3  # Minimum connections
DB_POOL_IDLE_TIMEOUT=30000 # ms before idle connection closes
DB_POOL_CONNECTION_TIMEOUT=30000 # ms for connection establishment

# Circuit Breaker Configuration
POOL_CIRCUIT_BREAKER_THRESHOLD=90 # Percentage before triggering
POOL_DEGRADATION_THRESHOLD=80     # Percentage before read-only mode
POOL_ALERT_THRESHOLD=75           # Percentage for alerting
```

## Redis Cache

```bash
# Redis Connection
REDIS_URL=redis://localhost:6379
# REDIS_URL=redis://:password@host:6379 # With auth

# Cache Configuration
ENABLE_REDIS_CACHE=true  # Enable Redis caching
REDIS_TTL=3600          # Default TTL in seconds
REDIS_KEY_PREFIX=echoverse: # Namespace for keys
```

## AI Provider Configuration

```bash
# OpenAI (Fallback Provider)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2048

# Ollama (Primary Provider)
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=llama2

# AI Provider Settings
AI_PROVIDER_TIMEOUT=30000        # Request timeout (ms)
AI_CIRCUIT_BREAKER_THRESHOLD=5   # Failures before circuit opens
AI_CIRCUIT_BREAKER_TIMEOUT=60000 # Circuit open duration (ms)
AI_RATE_LIMIT_TIER_FREE=10       # Requests per day
AI_RATE_LIMIT_TIER_PRO=100       # Requests per day
AI_RATE_LIMIT_TIER_ENTERPRISE=1000 # Requests per day
```

## File Storage

```bash
# Local Storage (Development)
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760 # 10MB in bytes

# Cloud Storage (Production)
USE_CLOUD_STORAGE=true
STORAGE_PROVIDER=s3 # Options: s3, gcs, azure

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=echoverse-uploads
AWS_REGION=us-east-1
AWS_S3_ACCELERATE=true # Enable transfer acceleration

# Google Cloud Storage
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
GCS_BUCKET=echoverse-uploads

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=...
AZURE_STORAGE_CONTAINER=uploads
```

## Virus Scanning

```bash
# ClamAV Configuration
ENABLE_VIRUS_SCAN=true
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
VIRUS_SCAN_FALLBACK=reject # Options: reject, quarantine, allow
```

## CDN & Performance

```bash
# CDN Configuration
CDN_URL=https://cdn.yourdomain.com
CDN_ENABLED=true

# Cache Control
STATIC_CACHE_MAX_AGE=31536000 # 1 year for static assets
API_CACHE_MAX_AGE=300         # 5 minutes for API responses
```

## Rate Limiting

```bash
# Rate Limit Configuration
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # Requests per window
RATE_LIMIT_SKIP_SUCCESSFUL=false

# IP-based limits
RATE_LIMIT_IP_WINDOW=900000
RATE_LIMIT_IP_MAX=100

# User-based limits
RATE_LIMIT_USER_WINDOW=900000
RATE_LIMIT_USER_MAX=1000
```

## Email Service

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false # true for 465, false for other ports
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# Email Settings
EMAIL_FROM=noreply@echoverse.com
EMAIL_FROM_NAME=EchoVerse Platform

# SendGrid Alternative
SENDGRID_API_KEY=SG...
USE_SENDGRID=true
```

## Push Notifications

```bash
# Firebase Cloud Messaging
FCM_SERVER_KEY=your-fcm-server-key
FCM_SENDER_ID=your-sender-id

# Apple Push Notification Service (APNs)
APNS_KEY_ID=your-key-id
APNS_TEAM_ID=your-team-id
APNS_PRIVATE_KEY_PATH=/path/to/key.p8
APNS_PRODUCTION=true
```

## Monitoring & Logging

```bash
# Sentry Error Tracking
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Log Level
LOG_LEVEL=info # Options: debug, info, warn, error, critical
LOG_TO_FILE=true
LOG_ROTATION_SIZE=10485760 # 10MB
LOG_MAX_FILES=7

# Prometheus Metrics
METRICS_ENABLED=true
METRICS_PORT=9090
```

## WebSocket Configuration

```bash
# WebSocket Settings
WS_HEARTBEAT_INTERVAL=30000  # Ping interval (ms)
WS_HEARTBEAT_TIMEOUT=5000    # Pong timeout (ms)
WS_MAX_CONNECTIONS=10000     # Per server
WS_MESSAGE_MAX_SIZE=1048576  # 1MB
```

## Application Settings

```bash
# Environment
NODE_ENV=production # Options: development, test, staging, production

# Server
PORT=5000
HOST=0.0.0.0

# Session
SESSION_MAX_AGE=86400000 # 24 hours in ms
SESSION_COOKIE_SECURE=true # HTTPS only in production
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=strict

# CORS
CORS_ORIGIN=https://yourdomain.com
CORS_CREDENTIALS=true
```

## Mobile App Configuration

```bash
# Capacitor
CAPACITOR_APP_ID=com.echoverse.platform
CAPACITOR_APP_NAME=EchoVerse
CAPACITOR_SERVER_URL=https://api.echoverse.com

# Android Build
ANDROID_KEYSTORE_PATH=/path/to/keystore.jks
ANDROID_KEYSTORE_PASSWORD=your-keystore-password
ANDROID_KEY_ALIAS=your-key-alias
ANDROID_KEY_PASSWORD=your-key-password

# iOS Build
IOS_CERTIFICATE_PATH=/path/to/certificate.p12
IOS_CERTIFICATE_PASSWORD=your-cert-password
IOS_PROVISIONING_PROFILE=/path/to/profile.mobileprovision
```

## Feature Flags

```bash
# Feature Toggles
ENABLE_AI_BUILDER=true
ENABLE_MARKETPLACE=true
ENABLE_COMMUNITIES=true
ENABLE_E_COMMERCE=true
ENABLE_MARKETING=true
ENABLE_CMS=true
ENABLE_ANALYTICS=true
ENABLE_TWO_FACTOR_AUTH=true
```

## Third-Party Integrations

```bash
# Google Services
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_MAPS_API_KEY=your-maps-key
GOOGLE_ANALYTICS_ID=UA-...

# Social OAuth
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
TWITTER_API_KEY=your-api-key
TWITTER_API_SECRET=your-api-secret
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

## Development & Testing

```bash
# Development
VITE_DEV_SERVER_PORT=5173
VITE_HMR_PORT=5173
API_MOCK_ENABLED=false

# Testing
CI=true
SKIP_ENV_VALIDATION=false # For testing
TEST_TIMEOUT=30000
COVERAGE_ENABLED=true
```

## Environment-Specific Examples

### .env.development
```bash
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/echoverse_dev
REDIS_URL=redis://localhost:6379
ENABLE_REDIS_CACHE=false
LOG_LEVEL=debug
USE_CLOUD_STORAGE=false
ENABLE_VIRUS_SCAN=false
```

### .env.staging
```bash
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db:5432/echoverse
REDIS_URL=redis://staging-redis:6379
ENABLE_REDIS_CACHE=true
USE_CLOUD_STORAGE=true
STORAGE_PROVIDER=s3
LOG_LEVEL=info
```

### .env.production
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/echoverse
REDIS_URL=redis://prod-redis:6379
ENABLE_REDIS_CACHE=true
USE_CLOUD_STORAGE=true
STORAGE_PROVIDER=s3
CDN_ENABLED=true
LOG_LEVEL=warn
SENTRY_DSN=https://...
```

## Validation Rules

### Production/Staging Requirements

The following variables are **mandatory** in production/staging and must meet minimum requirements:

1. **JWT_SECRET**: ≥64 chars, 3+ types
2. **SESSION_SECRET**: ≥32 chars, 3+ types
3. **FILE_ENCRYPTION_KEY**: Exactly 64 hex chars
4. **TWO_FACTOR_BACKUP_ENCRYPTION_KEY**: ≥32 chars, 3+ types
5. **WEBHOOK_SIGNATURE_SECRET**: ≥64 chars (production/staging)

Application will **refuse to start** if these requirements are not met.

## Security Best Practices

1. **Never commit secrets to git** - Use `.env.local` (gitignored)
2. **Use different secrets per environment** - Dev ≠ Staging ≠ Production
3. **Rotate secrets regularly** - Every 90 days minimum
4. **Use secret managers in production** - AWS Secrets Manager, Vault, etc.
5. **Validate on startup** - App validates all critical secrets
6. **Monitor secret access** - Audit logs for secret usage

## Troubleshooting

### Secret Validation Errors

```bash
# Error: JWT_SECRET must be at least 64 characters
# Solution: Generate a secure random string
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Error: FILE_ENCRYPTION_KEY must be 64 hex characters
# Solution: Generate hex string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check pool stats
curl http://localhost:5000/api/health
```

### Redis Connection Issues

```bash
# Test Redis
redis-cli -u $REDIS_URL ping
```

## Production-Specific Requirements

### ⚠️  CRITICAL PRODUCTION ENVIRONMENT CONFIGURATION

This section outlines MANDATORY configuration for production deployments.

### 1. Secret Generation (PRODUCTION)

**CRITICAL**: All production secrets MUST be generated using cryptographically secure methods:

```bash
# Generate 64-character base64 secrets (REQUIRED for production)
openssl rand -base64 64

# Generate 32-byte hex secrets (for encryption keys)
openssl rand -hex 32

# Generate UUID-based secrets
node -e "console.log(require('crypto').randomUUID())"
```

**Minimum Requirements:**
- `SESSION_SECRET`: 64+ characters, base64 encoded
- `JWT_SECRET`: 64+ characters, base64 encoded  
- `WEBHOOK_SIGNATURE_SECRET`: 64+ characters, base64 encoded
- `TWO_FACTOR_BACKUP_ENCRYPTION_KEY`: 64+ characters, base64 encoded
- `FIELD_ENCRYPTION_KEY`: 64+ characters, base64 encoded
- `GDPR_EXPORT_ENCRYPTION_KEY`: 64+ characters, base64 encoded

### 2. Database Configuration (PRODUCTION)

```bash
# REQUIRED: SSL/TLS enabled connection
DATABASE_URL=postgresql://user:password@prod-db.example.com:5432/echoverse?sslmode=require

# REQUIRED: Connection pool sizing for production load
DB_POOL_SIZE=20
DB_POOL_MAX=50
DB_POOL_MIN=5

# REQUIRED: Read replica for scaling (HIGH-023)
DB_READ_REPLICA_URL=postgresql://user:password@replica-db.example.com:5432/echoverse?sslmode=require
ENABLE_READ_REPLICAS=true

# REQUIRED: Backup configuration (CRIT-007)
ENABLE_AUTO_BACKUP=true
BACKUP_SCHEDULE_CRON=0 2 * * *
BACKUP_S3_BUCKET=echoverse-prod-backups
BACKUP_ENCRYPTION_KEY=<64-char-base64-secret>
BACKUP_RETENTION_DAYS=90
```

### 3. Security Configuration (PRODUCTION)

```bash
# REQUIRED: Force HTTPS in production (CRIT-008)
FORCE_HTTPS=true
HSTS_MAX_AGE=31536000

# REQUIRED: Strict CORS origins (CONFIG-004)
ALLOWED_ORIGINS=https://echoverse.com,https://www.echoverse.com,https://app.echoverse.com

# REQUIRED: SSL/TLS certificate management (CRIT-008)
SSL_CERT_PATH=/etc/ssl/certs/echoverse.crt
SSL_KEY_PATH=/etc/ssl/private/echoverse.key
SSL_RENEWAL_DAYS_BEFORE=30
ENABLE_SSL_AUTO_RENEWAL=true

# REQUIRED: Rate limiting for production (CRIT-005)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=3

# REQUIRED: Per-tier rate limits (HIGH-015)
RATE_LIMIT_FREE_TIER=100
RATE_LIMIT_PRO_TIER=1000
RATE_LIMIT_ENTERPRISE_TIER=10000

# REQUIRED: Virus scanning (CRIT-006)
ENABLE_VIRUS_SCAN=true
CLAMAV_HOST=clamav-service
CLAMAV_PORT=3310
VIRUSTOTAL_API_KEY=<your-virustotal-api-key>

# REQUIRED: Key rotation (CRIT-009)
ENABLE_KEY_ROTATION=true
KEY_ROTATION_SCHEDULE_DAYS=90
KEY_ROTATION_ALERT_DAYS=7
KEY_ROTATION_SLACK_WEBHOOK=<slack-webhook-url>
```

### 4. Payment Processing (PRODUCTION)

```bash
# ⚠️  CRITICAL: Use LIVE Stripe keys only in production
STRIPE_SECRET_KEY=sk_live_<your-production-key>
STRIPE_PUBLISHABLE_KEY=pk_live_<your-production-key>
STRIPE_PRICE_ID=price_<your-production-price-id>
STRIPE_WEBHOOK_SECRET=whsec_<your-webhook-secret>

# REQUIRED: Stripe webhook IP whitelist (CRIT-010)
STRIPE_WEBHOOK_IPS=3.18.12.63,3.130.192.231,13.235.14.237,13.235.122.149,35.154.171.200,52.15.183.38,54.88.130.119,54.88.130.237,54.187.174.169,54.187.205.235,54.187.216.72

# REQUIRED: Payment retry and dunning (HIGH-016)
PAYMENT_RETRY_ENABLED=true
PAYMENT_RETRY_MAX_ATTEMPTS=3
DUNNING_MANAGEMENT_ENABLED=true
```

### 5. Monitoring & Observability (PRODUCTION)

```bash
# REQUIRED: Error tracking (CRIT-004)
SENTRY_DSN=https://<key>@sentry.io/<project-id>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# REQUIRED: Log aggregation (MED-010)
DATADOG_API_KEY=<datadog-api-key>
DATADOG_APP_KEY=<datadog-app-key>
DATADOG_SITE=datadoghq.com

# OR use ELK Stack
# ELASTICSEARCH_URL=https://elasticsearch.example.com:9200
# ELASTICSEARCH_USERNAME=elastic
# ELASTICSEARCH_PASSWORD=<password>

# REQUIRED: Security header validation (SEC-001)
ENABLE_SECURITY_HEADERS_VALIDATION=true

# REQUIRED: CSP violation reporting (SEC-002)
CSP_REPORT_URI=https://echoverse.report-uri.com/r/d/csp/enforce
CSP_REPORT_ONLY=false
```

### 6. Caching & Session Management (PRODUCTION)

```bash
# REQUIRED: Redis for production (HIGH-004, HIGH-008, HIGH-014)
REDIS_URL=redis://:password@prod-redis.example.com:6379
ENABLE_REDIS_CACHE=true
REDIS_TTL=3600

# REQUIRED: Redis session store (HIGH-008)
REDIS_SESSION_PREFIX=sess:
REDIS_SESSION_TTL=43200

# REQUIRED: Distributed session management (HIGH-008)
SESSION_STORE=redis
ENABLE_SESSION_AUTO_ROTATION=true
```

### 7. File Storage & CDN (PRODUCTION)

```bash
# REQUIRED: Cloud storage (HIGH-018)
UPLOAD_PROVIDER=s3
AWS_S3_BUCKET=echoverse-prod-uploads
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY_ID=<access-key>
AWS_S3_SECRET_ACCESS_KEY=<secret-key>

# REQUIRED: CDN configuration (HIGH-005)
CDN_URL=https://cdn.echoverse.com
CDN_ENABLED=true

# REQUIRED: Image optimization (HIGH-009)
IMAGE_OPTIMIZATION_ENABLED=true
IMAGE_FORMATS=webp,avif,jpeg
IMAGE_QUALITY=85
```

### 8. Email Service (PRODUCTION)

```bash
# REQUIRED: Production email provider (HIGH-006)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.<your-production-key>
MOCK_EMAIL=false

# Backup: AWS SES
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=<access-key>
AWS_SES_SECRET_ACCESS_KEY=<secret-key>
```

### 9. GDPR & Compliance (PRODUCTION)

```bash
# REQUIRED: GDPR features (CRIT-011)
ENABLE_GDPR_FEATURES=true
DATA_RETENTION_DAYS=365
GDPR_EXPORT_ENCRYPTION_KEY=<64-char-secret>
GDPR_EXPORT_RETENTION_DAYS=7

# REQUIRED: Audit logging (HIGH-012)
ENABLE_AUDIT_LOGGING=true
AUDIT_LOG_RETENTION_DAYS=365
```

### 10. Mobile App Configuration (PRODUCTION)

```bash
# REQUIRED: iOS App Store (HIGH-010)
IOS_APP_ID=com.echoverse.app
IOS_TEAM_ID=<apple-team-id>
IOS_BUNDLE_ID=com.echoverse.app

# REQUIRED: Android Play Store
ANDROID_PACKAGE_NAME=com.echoverse.app
ANDROID_SHA256_CERT_FINGERPRINT=<fingerprint>

# REQUIRED: Deep linking (MED-028)
DEEP_LINK_DOMAIN=echoverse.app
UNIVERSAL_LINK_DOMAIN=echoverse.com

# REQUIRED: Push notifications (MED-027)
VAPID_PUBLIC_KEY=<vapid-public-key>
VAPID_PRIVATE_KEY=<vapid-private-key>
FCM_SERVER_KEY=<fcm-server-key>
```

### 11. Search & Analytics (PRODUCTION)

```bash
# REQUIRED: Search functionality (HIGH-017)
SEARCH_PROVIDER=elasticsearch
ELASTICSEARCH_URL=https://elasticsearch.example.com:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=<password>
ELASTICSEARCH_INDEX_PREFIX=echoverse_prod

# Analytics
GOOGLE_ANALYTICS_ID=G-<tracking-id>
MIXPANEL_TOKEN=<token>
```

### 12. OAuth Providers (PRODUCTION)

```bash
# Google OAuth (HIGH-026)
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_CALLBACK_URL=https://app.echoverse.com/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=<client-id>
GITHUB_CLIENT_SECRET=<client-secret>
GITHUB_CALLBACK_URL=https://app.echoverse.com/auth/github/callback

# Facebook OAuth
FACEBOOK_APP_ID=<app-id>
FACEBOOK_APP_SECRET=<app-secret>
FACEBOOK_CALLBACK_URL=https://app.echoverse.com/auth/facebook/callback
```

### 13. Tax Calculation (PRODUCTION)

```bash
# REQUIRED: Tax service (HIGH-028)
TAX_PROVIDER=taxjar
TAXJAR_API_KEY=<api-key>

# Alternative: Avalara
# AVALARA_ACCOUNT_ID=<account-id>
# AVALARA_LICENSE_KEY=<license-key>
# AVALARA_ENVIRONMENT=production
```

### Production Deployment Checklist

Before deploying to production, ensure ALL of the following are configured:

- [ ] ✅ All secrets generated with `openssl rand -base64 64`
- [ ] ✅ Database SSL enabled with read replicas
- [ ] ✅ Automated backups configured and tested
- [ ] ✅ Redis cache and session store configured
- [ ] ✅ SSL/TLS certificates installed with auto-renewal
- [ ] ✅ HTTPS enforcement enabled
- [ ] ✅ CORS restricted to production domains
- [ ] ✅ Stripe webhook IP whitelist configured
- [ ] ✅ Virus scanning enabled (ClamAV + VirusTotal)
- [ ] ✅ Error tracking (Sentry) configured
- [ ] ✅ Log aggregation (Datadog/ELK) configured
- [ ] ✅ CDN configured for static assets
- [ ] ✅ Cloud storage (S3/GCS) configured
- [ ] ✅ Email service configured (SendGrid/SES)
- [ ] ✅ OAuth providers configured
- [ ] ✅ Mobile app settings configured
- [ ] ✅ GDPR compliance features enabled
- [ ] ✅ Key rotation scheduled
- [ ] ✅ Rate limiting configured per tier
- [ ] ✅ Security headers validation enabled
- [ ] ✅ CSP violation reporting enabled

### Environment-Specific Files

**Development**: `.env` or `.env.local`
**Staging**: `.env.staging` (use secrets manager)
**Production**: DO NOT use `.env` files - use secrets management service

**Recommended Secrets Managers:**
- AWS Secrets Manager
- HashiCorp Vault
- Google Cloud Secret Manager
- Azure Key Vault
- Doppler
- Infisical

### Secrets Management Best Practices

1. **Never commit secrets to git** - Use `.gitignore` for `.env*` files
2. **Use different secrets per environment** - Dev ≠ Staging ≠ Production
3. **Rotate secrets every 90 days** - Automated rotation preferred
4. **Use IAM roles when possible** - Avoid long-lived credentials
5. **Audit secret access** - Monitor who accesses what and when
6. **Encrypt secrets at rest** - Use secrets management service encryption
7. **Limit secret scope** - Give minimum required permissions
8. **Test secret rotation** - Ensure applications handle rotation gracefully

## References

- [.env.production.template](../.env.production.template) - Production configuration template
- [Secret Generation Guide](./SECRET_GENERATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Security Hardening](./SECURITY_HARDENING.md)
