/**
 * Application-wide constants and configuration values
 * Centralized location for magic numbers and strings
 */
// Time constants (milliseconds)
export const TIME_CONSTANTS = {
    ONE_SECOND: 1000,
    ONE_MINUTE: 60 * 1000,
    ONE_HOUR: 60 * 60 * 1000,
    ONE_DAY: 24 * 60 * 60 * 1000,
    ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
    // Specific intervals
    SESSION_TTL: 7 * 24 * 60 * 60 * 1000, // 7 days
    CSRF_TOKEN_TTL: 60 * 60 * 1000, // 1 hour
    WEBSOCKET_HEARTBEAT: 25 * 1000, // 25 seconds
    WEBHOOK_RETRY_INTERVAL: 30 * 1000, // 30 seconds
    CONNECTION_POOL_MONITOR_INTERVAL: 30 * 1000, // 30 seconds
    IDEMPOTENCY_CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
    REPLICATION_LAG_CHECK_INTERVAL: 60 * 1000, // 1 minute
};
// Port numbers
export const PORTS = {
    DEV_SERVER: 5000,
    WEBSOCKET: 5000,
    MOCK_OLLAMA: 11434,
};
// File size limits (bytes)
export const FILE_SIZE_LIMITS = {
    MAX_UPLOAD: 10 * 1024 * 1024, // 10MB
    MAX_IMAGE: 5 * 1024 * 1024, // 5MB
    MAX_AVATAR: 2 * 1024 * 1024, // 2MB
    WEBSOCKET_MESSAGE: 64 * 1024, // 64KB
};
// Pagination
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    MIN_PAGE_SIZE: 1,
};
// Rate limiting
export const RATE_LIMITS = {
    API_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    API_MAX_REQUESTS: 100,
    AUTH_WINDOW_MS: 15 * 60 * 1000,
    AUTH_MAX_REQUESTS: 5,
    UPLOAD_WINDOW_MS: 60 * 60 * 1000, // 1 hour
    UPLOAD_MAX_REQUESTS: 10,
};
// Database
export const DATABASE = {
    DEFAULT_POOL_SIZE: 20,
    CONNECTION_TIMEOUT_MS: 5000,
    STATEMENT_TIMEOUT_MS: 30000,
    IDLE_TIMEOUT_MS: 10000,
    MAX_RETRIES: 3,
    RETRY_BASE_DELAY_MS: 1000,
    BACKUP_RETENTION_DAYS: 30,
};
// Monitoring thresholds
export const MONITORING = {
    POOL_THRESHOLD_PERCENT: 80,
    SLOW_QUERY_MS: 1000,
    ALERT_ERROR_RATE: 0.05, // 5%
    MEMORY_THRESHOLD_MB: 500,
};
// Security
export const SECURITY = {
    BCRYPT_ROUNDS: 12,
    JWT_EXPIRY: '7d',
    REFRESH_TOKEN_EXPIRY: '30d',
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
    MFA_CODE_LENGTH: 6,
    BACKUP_CODES_COUNT: 10,
};
// Cache TTLs
export const CACHE_TTL = {
    SESSION: 5 * 60 * 1000, // 5 minutes
    USER_PROFILE: 10 * 60 * 1000, // 10 minutes
    PRODUCT_LIST: 15 * 60 * 1000, // 15 minutes
    STATIC_CONTENT: 60 * 60 * 1000, // 1 hour
};
// API versions
export const API_VERSIONS = {
    CURRENT: 'v1',
    SUPPORTED: ['v1'],
    DEFAULT: 'v1',
};
// Feature flags
export const FEATURE_FLAGS = {
    ENABLE_AI_FEATURES: true,
    ENABLE_WEBSOCKETS: true,
    ENABLE_PUSH_NOTIFICATIONS: true,
    ENABLE_ANALYTICS: true,
    ENABLE_MONITORING: true,
};
// HTTP status codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};
// Content types
export const MIME_TYPES = {
    JSON: 'application/json',
    HTML: 'text/html',
    TEXT: 'text/plain',
    XML: 'application/xml',
    PDF: 'application/pdf',
    CSV: 'text/csv',
    JPEG: 'image/jpeg',
    PNG: 'image/png',
    SVG: 'image/svg+xml',
    WEBP: 'image/webp',
};
// Error messages
export const ERROR_MESSAGES = {
    GENERIC: 'An unexpected error occurred',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'You do not have permission to perform this action',
    NOT_FOUND: 'The requested resource was not found',
    VALIDATION_FAILED: 'Validation failed',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
    DATABASE_ERROR: 'Database operation failed',
    NETWORK_ERROR: 'Network connection error',
};
// Regex patterns
export const PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    PHONE: /^\+?[\d\s\-()]+$/,
    URL: /^https?:\/\/.+/,
    SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};
// Environment
export const ENVIRONMENTS = {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production',
    TEST: 'test',
};
// Webhook configuration
export const WEBHOOK_CONFIG = {
    MAX_ATTEMPTS: 3,
    RETRY_DELAYS_MS: [1000, 5000, 15000], // 1s, 5s, 15s
    TIMEOUT_MS: 10000,
    RETENTION_DAYS: 30,
};
// AI Provider Configuration
export const AI_CONFIG = {
    MAX_TOKENS: 2000,
    TEMPERATURE: 0.7,
    TIMEOUT_MS: 30000,
    MAX_RETRIES: 3,
    COOLDOWN_MS: 60000,
};
// Export all as a single object for convenience
export const CONSTANTS = {
    TIME: TIME_CONSTANTS,
    PORTS,
    FILE_SIZES: FILE_SIZE_LIMITS,
    PAGINATION,
    RATE_LIMITS,
    DATABASE,
    MONITORING,
    SECURITY,
    CACHE_TTL,
    API_VERSIONS,
    FEATURE_FLAGS,
    HTTP_STATUS,
    MIME_TYPES,
    ERROR_MESSAGES,
    PATTERNS,
    ENVIRONMENTS,
    WEBHOOK_CONFIG,
    AI_CONFIG,
};
export default CONSTANTS;
