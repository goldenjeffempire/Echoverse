// ISSUE #109 FIX: Centralize magic numbers and repeated constants

// ===== API & Network =====
export const API_TIMEOUT_MS = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY_MS = 1000;
export const WEBSOCKET_RECONNECT_DELAY_MS = 3000;
export const WEBSOCKET_MAX_RECONNECT_ATTEMPTS = 5;

// ===== Pagination =====
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const INFINITE_SCROLL_THRESHOLD = 0.8; // Load more at 80% scroll

// ===== File Upload =====
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] as const;

// ===== Validation =====
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 30;
export const MIN_POST_LENGTH = 1;
export const MAX_POST_LENGTH = 5000;
export const MAX_COMMENT_LENGTH = 1000;

// ===== Session & Auth =====
export const SESSION_CHECK_INTERVAL_MS = 60000; // 1 minute
export const CSRF_TOKEN_REFRESH_INTERVAL_MS = 300000; // 5 minutes
export const IDLE_TIMEOUT_MS = 900000; // 15 minutes
export const SESSION_WARNING_MS = 120000; // 2 minutes before timeout

// ===== UI & UX =====
export const TOAST_DURATION_MS = 5000;
export const TOAST_ERROR_DURATION_MS = 7000;
export const DEBOUNCE_DELAY_MS = 300;
export const ANIMATION_DURATION_MS = 200;
export const SKELETON_SHIMMER_DURATION_MS = 1500;

// ===== Cache & Storage =====
export const CACHE_STALE_TIME_MS = 300000; // 5 minutes
export const CACHE_GC_TIME_MS = 600000; // 10 minutes
export const LOCAL_STORAGE_KEY_PREFIX = 'app_';
export const SESSION_STORAGE_KEY_PREFIX = 'session_';

// ===== Rate Limiting (Client-side) =====
export const CLIENT_RATE_LIMIT_REQUESTS = 5;
export const CLIENT_RATE_LIMIT_WINDOW_MS = 1000;

// ===== Search & Filtering =====
export const SEARCH_MIN_CHARS = 2;
export const SEARCH_DEBOUNCE_MS = 500;
export const SEARCH_MAX_RESULTS = 50;

// ===== Media & Images =====
export const IMAGE_THUMBNAIL_SIZE = 200;
export const IMAGE_PREVIEW_SIZE = 800;
export const IMAGE_QUALITY = 0.85;
export const LAZY_LOAD_ROOT_MARGIN = '50px';

// ===== Notifications =====
export const NOTIFICATION_POLLING_INTERVAL_MS = 30000; // 30 seconds
export const MAX_NOTIFICATIONS_DISPLAY = 99;

// ===== Comments & Posts =====
export const COMMENTS_PER_PAGE = 10;
export const POSTS_PER_PAGE = 20;
export const TRENDING_WINDOW_HOURS = 24;

// ===== Feature Flags =====
export const FEATURES = {
  ENABLE_ANALYTICS: true,
  ENABLE_DARK_MODE: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_WEBSOCKET: true,
  ENABLE_PWA: false, // Issue #29 - Enable when PWA complete
  ENABLE_OFFLINE_MODE: false,
} as const;

// ===== Routes =====
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/reset-password',
  '/terms',
  '/privacy',
  '/about',
  '/contact',
  '/pricing',
  '/blog',
] as const;

export const ADMIN_ROUTES = [
  '/admin',
  '/admin/users',
  '/admin/settings',
  '/admin/audit-logs',
] as const;

// ===== HTTP Status Codes =====
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ===== Environment =====
export const IS_PRODUCTION = import.meta.env.MODE === 'production';
export const IS_DEVELOPMENT = import.meta.env.MODE === 'development';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
