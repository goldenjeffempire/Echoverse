/**
 * Centralized Configuration Management
 * Provides defaults and validation for all environment variables
 */

import { TIME_CONSTANTS, PORTS, FILE_SIZE_LIMITS, DATABASE, WEBHOOK_CONFIG } from '@shared/constants';

// P0 FIX #23: Environment variable sanitization to prevent injection
function sanitizeEnvVar(value: string | undefined): string | undefined {
  if (!value) return value;
  
  // Remove potentially dangerous characters
  return value
    .replace(/[`${}]/g, '') // Remove shell injection chars
    .replace(/[\r\n]/g, '') // Remove newlines
    .trim();
}

export interface AppConfig {
  // Core
  nodeEnv: 'development' | 'production' | 'staging';
  port: number;
  appUrl: string;
  
  // Database
  databaseUrl: string;
  dbPoolSize: number;
  dbConnectionTimeout: number;
  
  // Security & Auth
  sessionSecret: string;
  jwtSecret: string;
  twoFactorEncryptionKey: string;
  passwordResetTokenExpiry: number;
  maxSessionsPerUser: number;
  sessionExpiryMs: number;
  
  // AI Providers
  aiProviderPrimary: 'local' | 'openai';
  aiProviderFallback: 'openai' | 'none';
  localAiEndpoint: string;
  localAiModel: string;
  openaiApiKey?: string;
  
  // Stripe
  stripeSecretKey: string;
  stripePublishableKey?: string;
  stripePriceId?: string;
  stripeWebhookSecret?: string;
  
  // Email
  emailProvider: 'smtp' | 'sendgrid' | 'ses' | 'mailgun';
  mockEmail: boolean;
  emailFrom: string;
  emailFromName: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  sendgridApiKey?: string;
  awsSesRegion?: string;
  awsSesAccessKeyId?: string;
  awsSesSecretAccessKey?: string;
  
  // File Upload
  uploadProvider: 'local' | 's3' | 'cloudinary' | 'gcs';
  uploadDir: string;
  maxFileSize: number;
  allowedFileTypes: string;
  enableVirusScan: boolean;
  clamavHost?: string;
  clamavPort?: number;
  
  // Request Payload
  maxPayloadSize: string; // Express body parser limit (e.g., '2mb')
  
  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  authRateLimitWindowMs: number;
  authRateLimitMaxRequests: number;
  
  // WebSocket
  wsHeartbeatInterval: number;
  wsConnectionTimeout: number;
  maxWsConnectionsPerUser: number;
  
  // Features
  enable2FA: boolean;
  enableEmailVerification: boolean;
  enableSocialLogin: boolean;
  enableApiDocs: boolean;
  enableGdprFeatures: boolean;
  
  // CORS & Security
  allowedOrigins: string[];
  trustProxy: number;
  hstsMaxAge: number;
  forceHttps: boolean;
  
  // Logging & Monitoring
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  enableQueryLogging: boolean;
  sentryDsn?: string;
  sentryEnvironment?: string;
  
  // Redis Cache
  redisUrl?: string;
  redisTtl: number;
  enableRedisCache: boolean;
  
  // Webhooks
  webhookMaxRetries: number;
  webhookRetryDelay: number;
  webhookTimeout: number;
  webhookSignatureSecret: string;
  webhookRetentionDays: number;
  
  // API
  requestIdHeader: string;
  apiVersion: string;
  enableGraphql: boolean;
  
  // GDPR
  dataRetentionDays: number;
  requireCookieConsent: boolean;
  
  // Monitoring & Observability
  enableMetrics: boolean;
  metricsPort: number;
  tracingEnabled: boolean;
  tracingSampleRate: number;
  healthCheckPath: string;
  metricsPath: string;
}

// P0 FIX #23: Apply sanitization to all environment variable reads
function getEnv(key: string, defaultValue?: string): string {
  const rawValue = process.env[key] ?? defaultValue ?? '';
  return sanitizeEnvVar(rawValue) ?? '';
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = sanitizeEnvVar(process.env[key]);
  return value ? parseInt(value, 10) : defaultValue;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = sanitizeEnvVar(process.env[key]);
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

export function loadConfig(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'staging';
  
  // Generate secure defaults for secrets if not provided (development only)
  const isDev = nodeEnv === 'development';
  
  const config: AppConfig = {
    // Core
    nodeEnv,
    port: getEnvNumber('PORT', PORTS.DEV_SERVER),
    appUrl: getEnv('APP_URL', `http://localhost:${PORTS.DEV_SERVER}`),
    
    // Database
    databaseUrl: getEnv('DATABASE_URL'),
    dbPoolSize: (() => {
      const poolSize = getEnvNumber('DB_POOL_SIZE', 10);
      const poolMax = getEnvNumber('DB_POOL_MAX', 20);
      if (poolSize > poolMax) {
        throw new Error(`DB_POOL_SIZE (${poolSize}) cannot exceed DB_POOL_MAX (${poolMax})`);
      }
      if (poolSize < 1) {
        throw new Error(`DB_POOL_SIZE must be at least 1`);
      }
      if (poolMax > 100) {
        throw new Error(`DB_POOL_MAX (${poolMax}) cannot exceed 100 for safety`);
      }
      return poolSize;
    })(),
    dbConnectionTimeout: getEnvNumber('DB_CONNECTION_TIMEOUT', DATABASE.CONNECTION_TIMEOUT_MS),
    
    // Security & Auth
    sessionSecret: getEnv('SESSION_SECRET'),
    // PHASE 1.2: SECURITY FIX - No dev fallback for JWT secret, always require explicit secret
    // This prevents accidental leakage of predictable dev secrets to production
    jwtSecret: getEnv('JWT_SECRET'),
    twoFactorEncryptionKey: getEnv('TWO_FACTOR_BACKUP_ENCRYPTION_KEY', ''),
    passwordResetTokenExpiry: getEnvNumber('PASSWORD_RESET_TOKEN_EXPIRY', TIME_CONSTANTS.ONE_HOUR),
    maxSessionsPerUser: getEnvNumber('MAX_SESSIONS_PER_USER', 5),
    sessionExpiryMs: getEnvNumber('SESSION_EXPIRY_MS', TIME_CONSTANTS.ONE_DAY),
    
    // AI Providers
    aiProviderPrimary: (getEnv('AI_PROVIDER_PRIMARY', 'local') as 'local' | 'openai'),
    aiProviderFallback: (getEnv('AI_PROVIDER_FALLBACK', 'openai') as 'openai' | 'none'),
    localAiEndpoint: getEnv('LOCAL_AI_ENDPOINT', `http://localhost:${PORTS.MOCK_OLLAMA}`),
    localAiModel: getEnv('LOCAL_AI_MODEL', 'llama3.2:latest'),
    openaiApiKey: getEnv('OPENAI_API_KEY'),
    
    // Stripe
    stripeSecretKey: getEnv('STRIPE_SECRET_KEY'),
    stripePublishableKey: getEnv('STRIPE_PUBLISHABLE_KEY'),
    stripePriceId: getEnv('STRIPE_PRICE_ID'),
    // PHASE 1.4: SECURITY FIX - Stripe webhook secret now required to prevent unauthorized webhook processing
    stripeWebhookSecret: getEnv('STRIPE_WEBHOOK_SECRET'),
    
    // Email
    emailProvider: (getEnv('EMAIL_PROVIDER', 'smtp') as 'smtp' | 'sendgrid' | 'ses' | 'mailgun'),
    mockEmail: getEnvBoolean('MOCK_EMAIL', isDev),
    emailFrom: getEnv('EMAIL_FROM', 'noreply@echoverse.com'),
    emailFromName: getEnv('EMAIL_FROM_NAME', 'EchoVerse Platform'),
    smtpHost: getEnv('SMTP_HOST'),
    smtpPort: getEnvNumber('SMTP_PORT', 587),
    smtpSecure: getEnvBoolean('SMTP_SECURE', false),
    smtpUser: getEnv('SMTP_USER'),
    smtpPass: getEnv('SMTP_PASS'),
    sendgridApiKey: getEnv('SENDGRID_API_KEY'),
    awsSesRegion: getEnv('AWS_SES_REGION'),
    awsSesAccessKeyId: getEnv('AWS_SES_ACCESS_KEY_ID'),
    awsSesSecretAccessKey: getEnv('AWS_SES_SECRET_ACCESS_KEY'),
    
    // File Upload
    uploadProvider: (getEnv('UPLOAD_PROVIDER', 'local') as 'local' | 's3' | 'cloudinary' | 'gcs'),
    uploadDir: getEnv('UPLOAD_DIR', './uploads'),
    maxFileSize: getEnvNumber('MAX_FILE_SIZE', FILE_SIZE_LIMITS.MAX_UPLOAD),
    allowedFileTypes: getEnv('ALLOWED_FILE_TYPES', 'image/jpeg,image/png,image/gif,image/webp,application/pdf,video/mp4'),
    // CRITICAL FIX #8: Enable virus scanning by default in production for security
    enableVirusScan: getEnvBoolean('ENABLE_VIRUS_SCAN', nodeEnv === 'production'), // Enable by default in production
    clamavHost: getEnv('CLAMAV_HOST'),
    clamavPort: getEnvNumber('CLAMAV_PORT', 3310),
    
    // Request Payload
    maxPayloadSize: getEnv('MAX_PAYLOAD_SIZE', '2mb'), // Reduced from 10mb to 2mb for security
    
    // Rate Limiting
    rateLimitWindowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 15 * TIME_CONSTANTS.ONE_MINUTE),
    rateLimitMaxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    authRateLimitWindowMs: getEnvNumber('AUTH_RATE_LIMIT_WINDOW_MS', 15 * TIME_CONSTANTS.ONE_MINUTE),
    authRateLimitMaxRequests: getEnvNumber('AUTH_RATE_LIMIT_MAX_REQUESTS', 5),
    
    // WebSocket
    wsHeartbeatInterval: getEnvNumber('WS_HEARTBEAT_INTERVAL', 30 * TIME_CONSTANTS.ONE_SECOND),
    wsConnectionTimeout: getEnvNumber('WS_CONNECTION_TIMEOUT', TIME_CONSTANTS.ONE_MINUTE),
    maxWsConnectionsPerUser: getEnvNumber('MAX_WS_CONNECTIONS_PER_USER', 3),
    
    // Features
    enable2FA: getEnvBoolean('ENABLE_2FA', true),
    enableEmailVerification: getEnvBoolean('ENABLE_EMAIL_VERIFICATION', true),
    enableSocialLogin: getEnvBoolean('ENABLE_SOCIAL_LOGIN', false),
    enableApiDocs: getEnvBoolean('ENABLE_API_DOCS', true),
    enableGdprFeatures: getEnvBoolean('ENABLE_GDPR_FEATURES', true),
    
    // CORS & Security
    allowedOrigins: getEnv('ALLOWED_ORIGINS', '').split(',').filter(Boolean),
    trustProxy: getEnvNumber('TRUST_PROXY', 1),
    hstsMaxAge: getEnvNumber('HSTS_MAX_AGE', 365 * 24 * 60 * 60),
    forceHttps: getEnvBoolean('FORCE_HTTPS', false),
    
    // Logging & Monitoring
    logLevel: (getEnv('LOG_LEVEL', 'info') as 'error' | 'warn' | 'info' | 'debug'),
    enableQueryLogging: getEnvBoolean('ENABLE_QUERY_LOGGING', false),
    sentryDsn: getEnv('SENTRY_DSN'),
    sentryEnvironment: getEnv('SENTRY_ENVIRONMENT'),
    
    // Redis Cache
    redisUrl: getEnv('REDIS_URL'),
    redisTtl: getEnvNumber('REDIS_TTL', Math.floor(TIME_CONSTANTS.ONE_HOUR / 1000)),
    enableRedisCache: getEnvBoolean('ENABLE_REDIS_CACHE', false),
    
    // Webhooks
    webhookMaxRetries: getEnvNumber('WEBHOOK_MAX_RETRIES', WEBHOOK_CONFIG.MAX_ATTEMPTS),
    webhookRetryDelay: getEnvNumber('WEBHOOK_RETRY_DELAY', TIME_CONSTANTS.ONE_SECOND),
    webhookTimeout: getEnvNumber('WEBHOOK_TIMEOUT', WEBHOOK_CONFIG.TIMEOUT_MS),
    // PHASE 1.2: SECURITY FIX - No dev fallback for webhook secret
    webhookSignatureSecret: getEnv('WEBHOOK_SIGNATURE_SECRET'),
    webhookRetentionDays: getEnvNumber('WEBHOOK_RETENTION_DAYS', 30), // 30 days default, configurable for regulatory compliance
    
    // API
    requestIdHeader: getEnv('REQUEST_ID_HEADER', 'X-Request-ID'),
    apiVersion: getEnv('API_VERSION', 'v1'),
    enableGraphql: getEnvBoolean('ENABLE_GRAPHQL', false),
    
    // GDPR
    dataRetentionDays: getEnvNumber('DATA_RETENTION_DAYS', 365),
    requireCookieConsent: getEnvBoolean('REQUIRE_COOKIE_CONSENT', true),
    
    // Monitoring & Observability
    enableMetrics: getEnvBoolean('ENABLE_METRICS', true),
    metricsPort: getEnvNumber('METRICS_PORT', 9090),
    tracingEnabled: getEnvBoolean('TRACING_ENABLED', false),
    tracingSampleRate: getEnvNumber('TRACING_SAMPLE_RATE', 0.1),
    healthCheckPath: getEnv('HEALTH_CHECK_PATH', '/health'),
    metricsPath: getEnv('METRICS_PATH', '/metrics'),
  };
  
  // Validate critical environment variables
  validateConfig(config);
  
  return config;
}

function validateConfig(config: AppConfig): void {
  const errors: string[] = [];
  const isProd = config.nodeEnv === 'production';

  // Critical security keys
  if (!config.sessionSecret) {
    errors.push('SESSION_SECRET is required');
  }
  
  if (!config.jwtSecret) {
    errors.push('JWT_SECRET is required');
  }

  // CRITICAL FIX #6: TWO_FACTOR_BACKUP_ENCRYPTION_KEY is mandatory when 2FA is enabled
  if (config.enable2FA && !config.twoFactorEncryptionKey) {
    errors.push('TWO_FACTOR_BACKUP_ENCRYPTION_KEY is required when 2FA is enabled for secure backup code encryption');
  }

  // Database is always required
  if (!config.databaseUrl) {
    errors.push('DATABASE_URL is required');
  }

  // PHASE 1.4: SECURITY FIX - Stripe webhook secret is mandatory in production
  if (config.stripeSecretKey && !config.stripeWebhookSecret) {
    if (isProd) {
      errors.push('STRIPE_WEBHOOK_SECRET is required when STRIPE_SECRET_KEY is set (prevents unauthorized webhook processing)');
    } else {
      console.warn('⚠️  WARNING: STRIPE_WEBHOOK_SECRET not set - webhooks will not be verified in development');
    }
  }
  
  // Webhook signature secret required for webhook security
  if (!config.webhookSignatureSecret) {
    errors.push('WEBHOOK_SIGNATURE_SECRET is required for webhook signature verification');
  }

  // OpenAI key required if OpenAI is the fallback provider
  if (config.aiProviderFallback === 'openai' && !config.openaiApiKey) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not set - AI fallback will not work');
  }

  // Email configuration warnings
  if (config.enableEmailVerification && !config.mockEmail) {
    if (config.emailProvider === 'smtp' && (!config.smtpHost || !config.smtpUser)) {
      console.warn('⚠️  WARNING: SMTP credentials not configured - email verification will fail');
    }
    if (config.emailProvider === 'sendgrid' && !config.sendgridApiKey) {
      console.warn('⚠️  WARNING: SENDGRID_API_KEY not set - email verification will fail');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}

export const config = loadConfig();
