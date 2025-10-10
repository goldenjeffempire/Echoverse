# Production Environment Variables

**FIX: CONFIG-001 - Complete production environment variable documentation**

## Required Production Variables

### Core Application
```bash
# Application
NODE_ENV=production
PORT=5000
APP_VERSION=1.0.0

# Domain Configuration
REPLIT_DOMAINS=your-app.replit.app
PUBLIC_URL=https://your-app.replit.app
```

### Database
```bash
# PostgreSQL (Required)
DATABASE_URL=postgresql://user:password@host:5432/database
DB_READ_REPLICA_URL=postgresql://user:password@replica-host:5432/database  # Optional

# Connection Pool
DB_POOL_MAX=30
DB_POOL_MIN=5
DB_IDLE_TIMEOUT=60000
DB_CONNECTION_TIMEOUT=30000
DB_STATEMENT_TIMEOUT=30000
```

### Authentication & Security
```bash
# Session (Required)
SESSION_SECRET=<256-bit-secure-random-string>

# JWT (Required)
JWT_SECRET=<256-bit-secure-random-string>
JWT_EXPIRES_IN=7d

# Encryption (Required)
ENCRYPTION_KEY=<256-bit-secure-random-string>
```

### Payment Processing
```bash
# Stripe (Required for payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Email Service
```bash
# SendGrid (Recommended) OR SES
SENDGRID_API_KEY=SG.xxx
# OR
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=AKIA...
AWS_SES_SECRET_ACCESS_KEY=...

# Email Configuration
FROM_EMAIL=noreply@yourapp.com
SUPPORT_EMAIL=support@yourapp.com
```

### Cloud Storage (Required for file uploads)
```bash
# AWS S3
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY_ID=AKIA...
AWS_S3_SECRET_ACCESS_KEY=...

# OR Google Cloud Storage
GCS_BUCKET=your-bucket-name
GCS_PROJECT_ID=your-project-id
GCS_CREDENTIALS=<json-service-account-key>
```

### CDN (Recommended)
```bash
CDN_URL=https://cdn.yourapp.com
CLOUDFLARE_ZONE_ID=...
CLOUDFLARE_API_TOKEN=...
```

### Redis (Recommended for caching)
```bash
REDIS_URL=redis://:password@host:6379
REDIS_TLS_URL=rediss://:password@host:6380  # If TLS required
```

### Monitoring & Error Tracking
```bash
# Sentry (Required)
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# OpenTelemetry (Optional)
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp.example.com
```

### External Services
```bash
# OpenAI (Required for AI features)
OPENAI_API_KEY=sk-...

# TaxJar (Required for US sales)
TAXJAR_API_KEY=...

# Virus Scanning
VIRUSTOTAL_API_KEY=...
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
```

### OAuth Providers (Optional)
```bash
# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# GitHub OAuth
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Facebook OAuth  
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
```

### Push Notifications (Optional)
```bash
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@yourapp.com
```

### Rate Limiting & Security
```bash
# Rate Limit Configuration
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Security
ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com
TRUST_PROXY=true
```

### Feature Flags
```bash
ENABLE_AI_FEATURES=true
ENABLE_WEBSOCKETS=true
ENABLE_PUSH_NOTIFICATIONS=false
ENABLE_BETA_FEATURES=false
```

## Variable Validation

Run this command to validate all required environment variables:
```bash
npm run env:validate
```

## Security Best Practices

1. **Never commit secrets to git**
2. **Use strong random values** - minimum 256-bit entropy
3. **Rotate secrets regularly** - every 90 days minimum
4. **Use different secrets per environment**
5. **Store in secure secret management** (Replit Secrets, AWS Secrets Manager, etc.)

## Generation Commands

Generate secure secrets:
```bash
# Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Environment-Specific Overrides

### Staging
```bash
NODE_ENV=staging
SENTRY_ENVIRONMENT=staging
SENTRY_TRACES_SAMPLE_RATE=1.0  # Higher sampling in staging
```

### Development
```bash
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_MOCK_SERVICES=true
```

## Troubleshooting

### Missing Variables
If you see errors about missing environment variables:
1. Check `.env.production.template` for the complete list
2. Verify all required variables are set
3. Run `npm run env:validate` to identify missing vars

### Invalid Values
- Database URLs must be valid PostgreSQL connection strings
- API keys must be from the correct environment (test vs production)
- URLs must include protocol (https://)

## Migration from Development

When promoting to production:
1. Copy `.env.production.template` to `.env.production`
2. Replace all placeholder values with production credentials
3. Validate with `npm run env:validate`
4. Test in staging environment first
5. Deploy to production

## Monitoring

Monitor environment variable usage:
- Check logs for missing variable warnings
- Set up alerts for configuration errors
- Document any new variables added

## Support

For questions about environment configuration:
- See: `docs/DEPLOYMENT_GUIDE.md`
- Contact: DevOps team
- Wiki: Internal configuration documentation
