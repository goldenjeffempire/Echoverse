import { z } from 'zod';
import { logger } from './logger';
import { validateCriticalSecrets } from './utils/secret-validation';
import { validateAllCriticalSecrets } from './utils/entropy-validator';

// Environment-aware validation helper
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const isProduction = process.env.NODE_ENV === 'production';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'staging']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('5000'),

  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  DB_POOL_SIZE: z.string().transform(Number).pipe(z.number().int().positive()).default('10'),
  DB_CONNECTION_TIMEOUT: z.string().transform(Number).pipe(z.number().int().positive()).default('10000'),

  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters for cryptographic security'),
  // PHASE 1.1: SECURITY FIX - NO dev fallbacks for critical secrets to prevent accidental production leakage
  // All secrets must be explicitly set, even in development
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for cryptographic security'),
  TWO_FACTOR_BACKUP_ENCRYPTION_KEY: z.string().min(32, 'TWO_FACTOR_BACKUP_ENCRYPTION_KEY must be at least 32 characters'),
  // CRITICAL FIX #14: File encryption key MANDATORY in production AND staging for encrypting uploaded files at rest
  FILE_ENCRYPTION_KEY: (isProduction || process.env.NODE_ENV === 'staging')
    ? z.string().length(64, 'FILE_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes) in production/staging').regex(/^[0-9a-f]{64}$/i, 'FILE_ENCRYPTION_KEY must be hex characters only')
    : z.string().optional().refine((val) => {
        if (!val) return true; // Optional in development
        return val.length === 64 && /^[0-9a-f]{64}$/i.test(val);
      }, { message: 'FILE_ENCRYPTION_KEY must be 64 hex characters (32 bytes) if provided' }),
  WEBHOOK_SIGNATURE_SECRET: (isProduction || process.env.NODE_ENV === 'staging')
    ? z.string().min(64, 'WEBHOOK_SIGNATURE_SECRET must be at least 64 characters in production/staging for webhook security')
    : z.string().min(32, 'WEBHOOK_SIGNATURE_SECRET must be at least 32 characters for webhook security'),
  PASSWORD_RESET_TOKEN_EXPIRY: z.string().transform(Number).pipe(z.number().int().positive()).default('3600000'),
  MAX_SESSIONS_PER_USER: z.string().transform(Number).pipe(z.number().int().positive()).default('5'),
  SESSION_EXPIRY_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('86400000'),

  // OPENAI_API_KEY: Required for AI features in production, optional in development
  OPENAI_API_KEY: isDevelopment
    ? z.string().optional().default('')
    : z.string().min(1, 'OPENAI_API_KEY is required for AI features in production'),
  AI_PROVIDER_PRIMARY: z.enum(['local', 'openai']).default('local'),
  AI_PROVIDER_FALLBACK: z.enum(['openai', 'none']).default('openai'),
  LOCAL_AI_ENDPOINT: z.string().url().default('http://localhost:11434'),
  LOCAL_AI_MODEL: z.string().default('llama3.2:latest'),

  // STRIPE: Required in production, optional in development
  STRIPE_SECRET_KEY: isDevelopment
    ? z.string().optional().default('')
    : z.string().min(1, 'STRIPE_SECRET_KEY is required for payment processing'),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_PRICE_ID: z.string().optional(),
  // CRIT-002 FIX: Remove hardcoded dev fallback for webhook secret
  STRIPE_WEBHOOK_SECRET: isDevelopment
    ? z.string().optional()
    : z.string().min(1, 'STRIPE_WEBHOOK_SECRET required for webhook verification'),

  EMAIL_PROVIDER: z.enum(['smtp', 'sendgrid', 'ses', 'mailgun']).default('smtp'),
  MOCK_EMAIL: z.string().transform(val => val === 'true' || val === '1').default('false'),
  EMAIL_FROM: z.string().email().default('noreply@echoverse.com'),
  EMAIL_FROM_NAME: z.string().default('EchoVerse Platform'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('587'),
  SMTP_SECURE: z.string().transform(val => val === 'true' || val === '1').default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  AWS_SES_REGION: z.string().optional(),
  AWS_SES_ACCESS_KEY_ID: z.string().optional(),
  AWS_SES_SECRET_ACCESS_KEY: z.string().optional(),

  UPLOAD_PROVIDER: z.enum(['local', 's3', 'cloudinary', 'gcs']).default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number().int().positive()).default('10485760'),
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/gif,image/webp,application/pdf,video/mp4'),
  // CRITICAL FIX #8: Virus scanning ENABLED by default in production, disabled in development
  ENABLE_VIRUS_SCAN: z.string().transform(val => val === 'true' || val === '1').default(
    process.env.NODE_ENV === 'production' ? 'true' : 'false'
  ),
  CLAMAV_HOST: z.string().optional(),
  CLAMAV_PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('3310'),

  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).default('100'),
  AUTH_RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('900000'),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).default('5'),

  WS_HEARTBEAT_INTERVAL: z.string().transform(Number).pipe(z.number().int().positive()).default('30000'),
  WS_CONNECTION_TIMEOUT: z.string().transform(Number).pipe(z.number().int().positive()).default('60000'),
  MAX_WS_CONNECTIONS_PER_USER: z.string().transform(Number).pipe(z.number().int().positive()).default('3'),

  ENABLE_2FA: z.string().transform(val => val === 'true' || val === '1').default('true'),
  ENABLE_EMAIL_VERIFICATION: z.string().transform(val => val === 'true' || val === '1').default('true'),
  ENABLE_SOCIAL_LOGIN: z.string().transform(val => val === 'true' || val === '1').default('false'),
  ENABLE_API_DOCS: z.string().transform(val => val === 'true' || val === '1').default('true'),
  ENABLE_GDPR_FEATURES: z.string().transform(val => val === 'true' || val === '1').default('true'),

  // CRITICAL FIX #7: Validate CORS allowed origins are valid URLs
  ALLOWED_ORIGINS: z.string().default('').refine((val) => {
    if (!val) return true; // Empty is valid (will use defaults)
    const origins = val.split(',').map(o => o.trim());
    return origins.every(origin => {
      try {
        new URL(origin);
        return true;
      } catch {
        return false;
      }
    });
  }, { message: 'ALLOWED_ORIGINS must be comma-separated valid URLs' }),
  TRUST_PROXY: z.string().transform(Number).pipe(z.number().int().min(0)).default('1'),
  HSTS_MAX_AGE: z.string().transform(Number).pipe(z.number().int().positive()).default('31536000'),
  FORCE_HTTPS: z.string().transform(val => val === 'true' || val === '1').default('false'),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_QUERY_LOGGING: z.string().transform(val => val === 'true' || val === '1').default('false'),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),

  REDIS_URL: z.string().optional(),
  REDIS_TTL: z.string().transform(Number).pipe(z.number().int().positive()).default('3600'),
  ENABLE_REDIS_CACHE: z.string().transform(val => val === 'true' || val === '1').default('false'),

  WEBHOOK_MAX_RETRIES: z.string().transform(Number).pipe(z.number().int().min(0)).default('3'),
  WEBHOOK_RETRY_DELAY: z.string().transform(Number).pipe(z.number().int().positive()).default('1000'),
  WEBHOOK_TIMEOUT: z.string().transform(Number).pipe(z.number().int().positive()).default('30000'),
  WEBHOOK_RETENTION_DAYS: z.string().transform(Number).pipe(z.number().int().positive()).default('30'),

  REQUEST_ID_HEADER: z.string().default('X-Request-ID'),
  API_VERSION: z.string().default('v1'),
  ENABLE_GRAPHQL: z.string().transform(val => val === 'true' || val === '1').default('false'),

  DATA_RETENTION_DAYS: z.string().transform(Number).pipe(z.number().int().positive()).default('365'),
  REQUIRE_COOKIE_CONSENT: z.string().transform(val => val === 'true' || val === '1').default('true'),

  APP_URL: z.string().url().optional(),
}).passthrough();

export function validateEnvironmentVariables() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    logger.error('Environment variable validation failed', undefined, {
      errors
    });

    // Critical secrets that prevent startup
    const criticalSecrets = ['DATABASE_URL', 'SESSION_SECRET'];
    const missingCritical = criticalSecrets.filter(key => 
      errors[key] && errors[key].length > 0
    );

    if (missingCritical.length > 0) {
      console.error('\n❌ CRITICAL: Missing required environment variables:', missingCritical.join(', '));
      console.error('Application cannot start without these secrets. Please check .env file.\n');
      process.exit(1);
    }

    // Production AND staging specific critical secrets (FIXED: staging must also enforce all security requirements)
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
      const productionSecrets = [
        'JWT_SECRET', 
        'WEBHOOK_SIGNATURE_SECRET', 
        'TWO_FACTOR_BACKUP_ENCRYPTION_KEY', 
        'FILE_ENCRYPTION_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'STRIPE_SECRET_KEY'
      ];
      const missingProduction = productionSecrets.filter(key => 
        !process.env[key] || (errors[key] && errors[key].length > 0)
      );

      if (missingProduction.length > 0) {
        console.error(`\n❌ CRITICAL: Missing required ${process.env.NODE_ENV} secrets:`, missingProduction.join(', '));
        console.error('These secrets are required in production/staging. Generate with: openssl rand -base64 32\n');
        process.exit(1);
      }
      
      // CRIT-002 FIX: Enforce OPENAI_API_KEY in production (no dev fallbacks allowed)
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
        console.error('\n❌ CRITICAL: OPENAI_API_KEY is required in production for AI features');
        console.error('Set OPENAI_API_KEY environment variable with your OpenAI API key\n');
        process.exit(1);
      }
    }

    // In development, only fail on critical secrets, warn about others
    if (isDevelopment) {
      const nonCriticalErrors = Object.keys(errors).filter(key => !criticalSecrets.includes(key));
      if (nonCriticalErrors.length > 0) {
        logger.warn('Some environment variables have validation issues but application will continue in development', {
          nonCriticalErrors: nonCriticalErrors.map(key => ({ key, errors: errors[key] }))
        });
      }
      // CRITICAL FIX: Even in development, if validation failed we should not continue
      // Return undefined to signal validation failed (caller should handle this)
      // But since we already warned about non-critical errors, we can continue
    } else {
      // In production/staging, fail on any validation error - FAIL FAST
      console.error('\n❌ CRITICAL: Environment validation failed in production');
      process.exit(1);
    }
  }

  // CRITICAL FIX: Ensure we have valid data before proceeding
  if (!result.success || !result.data) {
    // This should never happen as we exit above, but defensive check
    throw new Error('Environment validation failed - cannot start application');
  }

  // Validate session secret strength in production
  if (process.env.NODE_ENV === 'production') {
    const sessionSecret = result.data.SESSION_SECRET;
    if (sessionSecret.length < 32) {
      console.error('\n❌ CRITICAL: SESSION_SECRET must be at least 32 characters in production');
      console.error('Current length:', sessionSecret.length);
      process.exit(1);
    }
    if (sessionSecret === 'your-secret-key-min-32-chars-long!!' || 
        sessionSecret.includes('example') || 
        sessionSecret.includes('changeme')) {
      console.error('\n❌ CRITICAL: SESSION_SECRET cannot use default/example values in production');
      process.exit(1);
    }
  }

  logger.info('Environment variables validated successfully');
  
  // CRITICAL FIX #2: Comprehensive secret validation with proper enforcement
  const secretValidation = validateCriticalSecrets();
  if (!secretValidation.valid) {
    if (process.env.NODE_ENV === 'production') {
      console.error('\n❌ CRITICAL: Weak secrets detected in production');
      console.error(secretValidation.errors.join('\n'));
      console.error('All secrets must have high entropy in production');
      process.exit(1);
    } else {
      // In development, log warning but include validation errors
      logger.warn('Secret validation warnings - ' + secretValidation.errors.join(', '));
    }
  }
  
  // Additional validation for SESSION_SECRET entropy in production
  if (process.env.NODE_ENV === 'production' && result.data.SESSION_SECRET) {
    const hasUppercase = /[A-Z]/.test(result.data.SESSION_SECRET);
    const hasLowercase = /[a-z]/.test(result.data.SESSION_SECRET);
    const hasNumbers = /[0-9]/.test(result.data.SESSION_SECRET);
    const hasSpecial = /[^A-Za-z0-9]/.test(result.data.SESSION_SECRET);
    
    const charTypesCount = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length;
    
    if (charTypesCount < 3) {
      console.error('\n❌ CRITICAL: SESSION_SECRET must contain at least 3 character types (uppercase, lowercase, numbers, special)');
      process.exit(1);
    }
  }
  
  // SECURITY FIX (CRIT-006): JWT secret environment-specific validation
  if (process.env.NODE_ENV === 'production' && result.data.JWT_SECRET) {
    const hasUppercase = /[A-Z]/.test(result.data.JWT_SECRET);
    const hasLowercase = /[a-z]/.test(result.data.JWT_SECRET);
    const hasNumbers = /[0-9]/.test(result.data.JWT_SECRET);
    const hasSpecial = /[^A-Za-z0-9]/.test(result.data.JWT_SECRET);
    
    const charTypesCount = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length;
    
    if (charTypesCount < 3) {
      console.error('\n❌ CRITICAL: JWT_SECRET must contain at least 3 character types (uppercase, lowercase, numbers, special) in production');
      console.error('Current JWT_SECRET does not meet security requirements');
      process.exit(1);
    }
    
    if (result.data.JWT_SECRET.length < 64) {
      console.error('\n❌ CRITICAL: JWT_SECRET must be at least 64 characters in production');
      console.error('Current length:', result.data.JWT_SECRET.length);
      process.exit(1);
    }
    
    // Check for weak patterns
    if (/(.)\1{5,}/.test(result.data.JWT_SECRET)) {
      console.error('\n❌ CRITICAL: JWT_SECRET contains repeated character patterns');
      process.exit(1);
    }
  }
  
  // CRITICAL FIX: Spread proxy into plain object to ensure mutability
  // This prevents issues where z.parse returns an immutable proxy
  return { ...result.data };
}

export type ValidatedEnv = z.infer<typeof envSchema>;