/**
 * Centralized Configuration Management
 * Provides defaults and validation for all environment variables
 */

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
}

function getEnv(key: string, defaultValue?: string): string {
  return process.env[key] || defaultValue || '';
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

export function loadConfig(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'staging';
  
  // Generate secure defaults for secrets if not provided (development only)
  const isDev = nodeEnv === 'development';
  
  const config: AppConfig = {
    // Core
    nodeEnv,
    port: getEnvNumber('PORT', 5000),
    appUrl: getEnv('APP_URL', 'http://localhost:5000'),
    
    // Database
    databaseUrl: getEnv('DATABASE_URL'),
    dbPoolSize: getEnvNumber('DB_POOL_SIZE', 10),
    dbConnectionTimeout: getEnvNumber('DB_CONNECTION_TIMEOUT', 10000),
    
    // Security & Auth
    sessionSecret: getEnv('SESSION_SECRET'),
    jwtSecret: getEnv('JWT_SECRET', isDev ? 'dev-jwt-secret-not-for-production' : ''),
    twoFactorEncryptionKey: getEnv('TWO_FACTOR_BACKUP_ENCRYPTION_KEY', ''),
    passwordResetTokenExpiry: getEnvNumber('PASSWORD_RESET_TOKEN_EXPIRY', 3600000), // 1 hour
    maxSessionsPerUser: getEnvNumber('MAX_SESSIONS_PER_USER', 5),
    sessionExpiryMs: getEnvNumber('SESSION_EXPIRY_MS', 86400000), // 24 hours
    
    // AI Providers
    aiProviderPrimary: (getEnv('AI_PROVIDER_PRIMARY', 'local') as 'local' | 'openai'),
    aiProviderFallback: (getEnv('AI_PROVIDER_FALLBACK', 'openai') as 'openai' | 'none'),
    localAiEndpoint: getEnv('LOCAL_AI_ENDPOINT', 'http://localhost:11434'),
    localAiModel: getEnv('LOCAL_AI_MODEL', 'llama3.2:latest'),
    openaiApiKey: getEnv('OPENAI_API_KEY'),
    
    // Stripe
    stripeSecretKey: getEnv('STRIPE_SECRET_KEY'),
    stripePublishableKey: getEnv('STRIPE_PUBLISHABLE_KEY'),
    stripePriceId: getEnv('STRIPE_PRICE_ID'),
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
    maxFileSize: getEnvNumber('MAX_FILE_SIZE', 10485760), // 10MB
    allowedFileTypes: getEnv('ALLOWED_FILE_TYPES', 'image/jpeg,image/png,image/gif,image/webp,application/pdf,video/mp4'),
    enableVirusScan: getEnvBoolean('ENABLE_VIRUS_SCAN', false),
    clamavHost: getEnv('CLAMAV_HOST'),
    clamavPort: getEnvNumber('CLAMAV_PORT', 3310),
    
    // Rate Limiting
    rateLimitWindowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
    rateLimitMaxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    authRateLimitWindowMs: getEnvNumber('AUTH_RATE_LIMIT_WINDOW_MS', 900000),
    authRateLimitMaxRequests: getEnvNumber('AUTH_RATE_LIMIT_MAX_REQUESTS', 5),
    
    // WebSocket
    wsHeartbeatInterval: getEnvNumber('WS_HEARTBEAT_INTERVAL', 30000),
    wsConnectionTimeout: getEnvNumber('WS_CONNECTION_TIMEOUT', 60000),
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
    hstsMaxAge: getEnvNumber('HSTS_MAX_AGE', 31536000),
    forceHttps: getEnvBoolean('FORCE_HTTPS', false),
    
    // Logging & Monitoring
    logLevel: (getEnv('LOG_LEVEL', 'info') as 'error' | 'warn' | 'info' | 'debug'),
    enableQueryLogging: getEnvBoolean('ENABLE_QUERY_LOGGING', false),
    sentryDsn: getEnv('SENTRY_DSN'),
    sentryEnvironment: getEnv('SENTRY_ENVIRONMENT'),
    
    // Redis Cache
    redisUrl: getEnv('REDIS_URL'),
    redisTtl: getEnvNumber('REDIS_TTL', 3600),
    enableRedisCache: getEnvBoolean('ENABLE_REDIS_CACHE', false),
    
    // Webhooks
    webhookMaxRetries: getEnvNumber('WEBHOOK_MAX_RETRIES', 3),
    webhookRetryDelay: getEnvNumber('WEBHOOK_RETRY_DELAY', 1000),
    webhookTimeout: getEnvNumber('WEBHOOK_TIMEOUT', 30000),
    webhookSignatureSecret: getEnv('WEBHOOK_SIGNATURE_SECRET', isDev ? 'dev-webhook-secret' : ''),
    webhookRetentionDays: getEnvNumber('WEBHOOK_RETENTION_DAYS', 30), // 30 days default, configurable for regulatory compliance
    
    // API
    requestIdHeader: getEnv('REQUEST_ID_HEADER', 'X-Request-ID'),
    apiVersion: getEnv('API_VERSION', 'v1'),
    enableGraphql: getEnvBoolean('ENABLE_GRAPHQL', false),
    
    // GDPR
    dataRetentionDays: getEnvNumber('DATA_RETENTION_DAYS', 365),
    requireCookieConsent: getEnvBoolean('REQUIRE_COOKIE_CONSENT', true),
  };
  
  return config;
}

export const config = loadConfig();
