// ISSUE #109 FIX: Centralize server-side magic numbers and constants
// ===== Environment =====
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';
export const PORT = parseInt(process.env.PORT || '5000', 10);
// ===== Security =====
export const BCRYPT_ROUNDS = 12;
export const JWT_EXPIRES_IN = '7d';
export const REFRESH_TOKEN_EXPIRES_IN = '30d';
export const PASSWORD_RESET_TOKEN_EXPIRES_HOURS = 1;
export const EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS = 24;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_DURATION_MS = 900000; // 15 minutes
export const PASSWORD_HISTORY_COUNT = 5; // Remember last N passwords
// ===== Session =====
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SESSION_CLEANUP_INTERVAL_MS = 3600000; // 1 hour
export const SESSION_IDLE_TIMEOUT_MS = 900000; // 15 minutes
export const MAX_SESSIONS_PER_USER = 5;
// ===== Rate Limiting =====
export const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 100;
export const RATE_LIMIT_LOGIN_MAX = 5; // Per 15 minutes
export const RATE_LIMIT_API_MAX = 100; // Per minute
export const RATE_LIMIT_STRICT_MAX = 10; // Per minute for sensitive endpoints
// ===== Database =====
export const DB_POOL_MIN = 2;
export const DB_POOL_MAX = 10;
export const DB_IDLE_TIMEOUT_MS = 30000;
export const DB_CONNECTION_TIMEOUT_MS = 5000;
export const DB_QUERY_TIMEOUT_MS = 30000;
export const DB_RETRY_ATTEMPTS = 3;
export const DB_RETRY_DELAY_MS = 1000;
// ===== Circuit Breaker =====
export const CIRCUIT_BREAKER_THRESHOLD = 5; // Failures before opening
export const CIRCUIT_BREAKER_TIMEOUT_MS = 60000; // 1 minute
export const CIRCUIT_BREAKER_RESET_TIMEOUT_MS = 30000; // 30 seconds
// ===== Webhooks =====
export const WEBHOOK_MAX_RETRIES = 5;
export const WEBHOOK_RETRY_DELAYS_MS = [1000, 5000, 30000, 120000, 600000]; // Exponential backoff
export const WEBHOOK_TIMEOUT_MS = 10000;
export const WEBHOOK_BATCH_SIZE = 10;
export const WEBHOOK_PROCESS_INTERVAL_MS = 60000; // 1 minute
// ===== File Upload =====
export const MAX_UPLOAD_SIZE_MB = 50;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
export const UPLOAD_ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
// ===== Email =====
export const EMAIL_RETRY_ATTEMPTS = 3;
export const EMAIL_RETRY_DELAY_MS = 5000;
export const EMAIL_BATCH_SIZE = 50;
export const EMAIL_RATE_LIMIT_PER_HOUR = 100;
// ===== Background Jobs =====
export const JOB_RETRY_ATTEMPTS = 3;
export const JOB_RETRY_DELAY_MS = 5000;
export const JOB_TIMEOUT_MS = 300000; // 5 minutes
export const JOB_CLEANUP_INTERVAL_MS = 3600000; // 1 hour
export const JOB_COMPLETED_RETENTION_DAYS = 7;
// ===== Backup =====
export const BACKUP_RETENTION_DAYS = 30;
export const BACKUP_SCHEDULE_CRON = '0 2 * * *'; // 2 AM daily
export const BACKUP_COMPRESSION_LEVEL = 6; // gzip compression (1-9)
// ===== Cache =====
export const CACHE_TTL_SHORT_MS = 60000; // 1 minute
export const CACHE_TTL_MEDIUM_MS = 300000; // 5 minutes
export const CACHE_TTL_LONG_MS = 3600000; // 1 hour
export const CACHE_MAX_SIZE_MB = 100;
// ===== API Response =====
export const API_MAX_RESPONSE_SIZE_MB = 10;
export const API_TIMEOUT_MS = 30000;
export const API_DEFAULT_PAGE_SIZE = 20;
export const API_MAX_PAGE_SIZE = 100;
// ===== Validation =====
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;
export const PASSWORD_ENTROPY_THRESHOLD = 50;
// ===== Monitoring =====
export const HEALTH_CHECK_INTERVAL_MS = 30000; // 30 seconds
export const METRICS_COLLECTION_INTERVAL_MS = 15000; // 15 seconds
export const LOG_ROTATION_SIZE_MB = 100;
export const LOG_RETENTION_DAYS = 30;
// ===== CDN =====
export const CDN_CACHE_TTL_SECONDS = 86400; // 24 hours
export const CDN_INVALIDATION_BATCH_SIZE = 100;
// ===== Pagination =====
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const DEFAULT_OFFSET = 0;
// ===== HTTP Headers =====
export const CORS_MAX_AGE_SECONDS = 86400; // 24 hours
export const HSTS_MAX_AGE_SECONDS = 31536000; // 1 year
// ===== Feature Flags =====
export const FEATURES = {
    ENABLE_WEBHOOKS: true,
    ENABLE_EMAIL: true,
    ENABLE_SMS: false,
    ENABLE_VIRUS_SCAN: true,
    ENABLE_AI: true,
    ENABLE_ANALYTICS: true,
    ENABLE_AUDIT_LOGS: true,
    ENABLE_RATE_LIMITING: true,
    ENABLE_CSRF_PROTECTION: true,
    ENABLE_2FA: true,
};
// ===== Error Codes =====
export const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
};
