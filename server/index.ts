import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { sanitizeInput, csrfProtection, setCsrfTokenCookie } from "./middleware/security";
import { enforceHttps, additionalSecurityHeaders } from "./middleware/https-enforcement";
import { healthCheckRateLimiter, staticAssetRateLimiter } from "./middleware/rate-limit-enhanced";
import { initializeSessionCleanup } from "./utils/session-manager";
import { logger } from "./logger";
import { storage } from "./storage";
import { validateEnvironmentVariables } from "./env.validation";
import { requestIdMiddleware } from "./middleware/request-id";
import { errorBoundary, notFoundHandler } from "./middleware/error-boundary";
import { preValidateFileSize } from "./middleware/upload-enhanced";
import { metricsMiddleware } from "./middleware/metrics";
import { initializeTracing } from "./monitoring/tracing";
import { setupSwagger } from "./swagger";
import { attachFingerprint, sessionFingerprintValidation } from "./middleware/session-fingerprint";
import { apiTimeoutMiddleware } from "./middleware/api-timeout";
import { sessionRotationMiddleware } from "./middleware/session-rotation";
import { trackRequest } from "./utils/graceful-shutdown";
import { connectionPoolCircuitBreaker } from "./middleware/connection-pool-circuit-breaker";
import { startMockOllama } from "./mock-ollama";
import { cspNonceMiddleware } from './middleware/csp-nonce';
import { validateCriticalEnvVars, strictBodySizeLimits, fileUploadRateLimit, contentTypeValidation, enforcePagination } from './middleware/critical-security';
import { enforceQueryTimeout } from './middleware/auth-security';
import { compressionMiddleware, poolMetricsMiddleware, preloadMiddleware, memoryMonitorMiddleware } from './middleware/performance';

validateEnvironmentVariables();
validateCriticalEnvVars();
log('Environment variables validated successfully');

// CRITICAL FIX #1: Explicitly validate JWT_SECRET before starting server
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('\n❌ CRITICAL: JWT_SECRET must be set and at least 32 characters');
  console.error('Generate a secure JWT_SECRET with: openssl rand -base64 32');
  process.exit(1);
}

// CRITICAL FIX #1: Validate SESSION_SECRET before starting server  
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  console.error('\n❌ CRITICAL: SESSION_SECRET must be set and at least 32 characters');
  console.error('Generate a secure SESSION_SECRET with: openssl rand -base64 32');
  process.exit(1);
}

logger.info('Critical security secrets validated', {
  jwtSecretLength: process.env.JWT_SECRET.length,
  sessionSecretLength: process.env.SESSION_SECRET.length
});

// P0 ISSUE #1 FIX: Missing Production Environment Variables (COMPREHENSIVE)
if (process.env.NODE_ENV === 'production') {
  const requiredProductionVars = [
    'REDIS_URL',
    'CDN_URL', 
    'SENTRY_DSN',
    'CLOUDFRONT_DISTRIBUTION_ID',
    'DATABASE_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'OPENAI_API_KEY',  // P0 #1: Required for AI features
    'TWO_FACTOR_BACKUP_ENCRYPTION_KEY',  // P0 #1: Required for 2FA backup code encryption
    'WEBHOOK_SIGNATURE_SECRET',  // P0 #1: Required for webhook security
    'FILE_ENCRYPTION_KEY'  // P0 #1: Required for file upload encryption
  ];
  
  // Email provider validation (at least one required)
  const hasEmailProvider = process.env.SENDGRID_API_KEY || 
    (process.env.AWS_SES_REGION && process.env.AWS_SES_ACCESS_KEY_ID && process.env.AWS_SES_SECRET_ACCESS_KEY);
  
  if (!hasEmailProvider) {
    console.error('\n❌ CRITICAL: No email provider configured in production.');
    console.error('   Required: Either SENDGRID_API_KEY or AWS SES credentials');
    console.error('   (AWS_SES_REGION, AWS_SES_ACCESS_KEY_ID, AWS_SES_SECRET_ACCESS_KEY)');
    console.error('\nApplication cannot send transactional emails without email provider.\n');
    process.exit(1);
  }
  
  // File storage validation (S3 required for production)
  const hasFileStorage = process.env.AWS_S3_BUCKET && 
    process.env.AWS_ACCESS_KEY_ID && 
    process.env.AWS_SECRET_ACCESS_KEY;
  
  if (!hasFileStorage) {
    console.error('\n❌ CRITICAL: File storage (S3) not configured in production.');
    console.error('   Required: AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
    console.error('\nApplication cannot store uploaded files without S3 configuration.\n');
    process.exit(1);
  }
  
  const missingVars = requiredProductionVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error('\n❌ CRITICAL: Missing required production environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error('\nApplication cannot start in production without these variables.\n');
    process.exit(1);
  }
  
  logger.info('Production environment variables validated', {
    redisConfigured: !!process.env.REDIS_URL,
    cdnConfigured: !!process.env.CDN_URL,
    sentryConfigured: !!process.env.SENTRY_DSN,
    cloudfrontConfigured: !!process.env.CLOUDFRONT_DISTRIBUTION_ID,
    emailProvider: process.env.SENDGRID_API_KEY ? 'SendGrid' : 'AWS SES',
    fileStorage: 'AWS S3'
  });
}

if (process.env.NODE_ENV === 'development') {
  startMockOllama();
}

// P0 FIX #6: Redis health check on startup when configured
if (process.env.REDIS_URL) {
  (async () => {
    try {
      const { createClient } = await import('redis');
      const redisClient = createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();
      await redisClient.ping();
      logger.info('Redis connection validated successfully');
      await redisClient.disconnect();
    } catch (error) {
      logger.error('Redis health check failed', error instanceof Error ? error : undefined);
      if (process.env.NODE_ENV === 'production') {
        console.error('\n❌ CRITICAL: Redis connection failed. Cache unavailable.\n');
        process.exit(1);
      }
    }
  })();
}

// Initialize OpenTelemetry tracing
initializeTracing();

// HIGH-012 FIX: Schedule daily backup verification at 3 AM (non-blocking)
if (process.env.NODE_ENV === 'production') {
  import('./utils/backup-verification').then(({ BackupVerifier }) => {
    // Run verification daily at 3 AM
    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 3 && now.getMinutes() < 15) {
        logger.info('Starting scheduled backup verification');
        const result = await BackupVerifier.verifyLatestBackup();
        
        if (!result.valid) {
          logger.error('ALERT: Backup verification failed', undefined, {
            issues: result.issues,
            backupDate: result.backupDate
          });
        } else {
          logger.info('Backup verification passed', {
            backupDate: result.backupDate,
            size: result.size,
            records: result.records
          });
        }
      }
    }, 15 * 60 * 1000); // Check every 15 minutes
    
    logger.info('Backup verification scheduled for daily execution at 3 AM');
  }).catch(err => {
    logger.error('Failed to initialize backup verification', err);
  });
}

// Run pending database migrations on startup (non-blocking for development)
// In production, run migrations as a separate deployment step
if (process.env.RUN_MIGRATIONS_ON_STARTUP === 'true') {
  import('./utils/database-migrations').then(async ({ runPendingMigrations }) => {
    try {
      await runPendingMigrations();
      logger.info('Database migrations completed successfully');
    } catch (error) {
      logger.error('Database migration failed', error instanceof Error ? error : undefined);
      if (process.env.NODE_ENV === 'production') {
        console.error('\n❌ CRITICAL: Database migrations failed. Cannot start server.\n');
        process.exit(1);
      }
    }
  }).catch(err => {
    logger.error('Failed to import migrations module', err);
  });
} else {
  logger.info('Skipping automatic migrations - use npm run migrate:up to run manually');
}

const app = express();

app.set('trust proxy', 1);

// Request ID tracking for distributed tracing
app.use(requestIdMiddleware);

// PHASE 2: Connection pool circuit breaker - return 503 when pool >90% utilized
// OPTIMIZED: Now uses lightweight cached metrics instead of database query on every request
app.use(connectionPoolCircuitBreaker);

// PHASE 1: Attach session fingerprint to all requests for security tracking
app.use(attachFingerprint);

// PHASE 1: Global API timeout middleware (30s default)
app.use(apiTimeoutMiddleware(30000));

// PHASE 2: Track in-flight requests for graceful shutdown
app.use(trackRequest);

// FIXED AUDIT #7: CSP Nonce Generation for inline scripts
app.use(cspNonceMiddleware);

// CRITICAL: Content-Type validation for all mutations
app.use(contentTypeValidation());

// CRITICAL: Strict body size limits
app.use(strictBodySizeLimits());

// CRITICAL: File upload rate limiting
app.use(fileUploadRateLimit());

// CRITICAL: Database query timeout enforcement
app.use(enforceQueryTimeout(30000));

// CRITICAL: API pagination enforcement
app.use(enforcePagination());

// MEDIUM: Performance optimizations - Brotli/Gzip compression
app.use(compressionMiddleware());
app.use(memoryMonitorMiddleware());
app.use(poolMetricsMiddleware());
app.use(preloadMiddleware());

app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      // FIXED AUDIT #7: Removed unsafe-inline/unsafe-eval, use nonces instead
      scriptSrc: ["'self'", "https://js.stripe.com", "https://maps.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], // CSS nonces less critical
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "wss:", "ws:", "https://api.stripe.com", "https://*.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:", "data:"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  } : false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
}));

// Permissions-Policy header for enhanced privacy and security
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 
    'geolocation=(), ' +
    'microphone=(), ' +
    'camera=(), ' +
    'payment=(self "https://js.stripe.com"), ' +
    'usb=(), ' +
    'magnetometer=(), ' +
    'gyroscope=(), ' +
    'accelerometer=(), ' +
    'ambient-light-sensor=(), ' +
    'autoplay=(self), ' +
    'encrypted-media=(self), ' +
    'fullscreen=(self), ' +
    'picture-in-picture=(self)'
  );
  next();
});

// BUG FIX #27: CORS Configuration - Don't allow all origins in development
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : (process.env.DEV_ALLOWED_ORIGINS?.split(',') || ['http://localhost:5000', 'http://localhost:5173', 'http://127.0.0.1:5000', 'http://127.0.0.1:5173']),
  credentials: true,
}));

// HTTPS enforcement in production
app.use(enforceHttps);

// Additional security headers
app.use(additionalSecurityHeaders);

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Cookie parser for CSRF double-submit pattern
app.use(cookieParser());

// Set CSRF token cookie for all requests
app.use(setCsrfTokenCookie);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// Pre-validate file size before upload
app.use('/api/upload', preValidateFileSize);

// Stripe webhook needs raw body for signature verification
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// Import config for payload size limit
const { config } = await import("./config");

// Parse size string with units (e.g., "2mb", "512kb", "1024b") to bytes
function parseSizeToBytes(size: string): number {
  const units: Record<string, number> = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) {
    throw new Error(`Invalid size format: ${size}. Use format like "2mb", "512kb", "1024b"`);
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * units[unit]);
}

// Enforce max payload size before parsing (default 2MB, configurable)
const maxPayloadBytes = parseSizeToBytes(config.maxPayloadSize);

// CRITICAL FIX #10: Validate Content-Length BEFORE parsing to prevent memory exhaustion
app.use((req, res, next) => {
  const contentLength = req.headers['content-length'];
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxPayloadBytes) {
      logger.warn('Request rejected: Content-Length exceeds limit', {
        size,
        limit: maxPayloadBytes,
        path: req.path
      });
      return res.status(413).json({ 
        error: 'Payload too large',
        size,
        limit: config.maxPayloadSize
      });
    }
  }
  next();
});

app.use(express.json({ 
  limit: config.maxPayloadSize,
  verify: (req, res, buf) => {
    // Additional size check before parsing (defense in depth)
    const size = buf.length;
    if (size > maxPayloadBytes) {
      throw new Error(`Payload too large: ${size} bytes exceeds limit of ${config.maxPayloadSize} (${maxPayloadBytes} bytes)`);
    }
  }
}));
app.use(express.urlencoded({ 
  extended: false, 
  limit: config.maxPayloadSize 
}));

// Exempt webhook routes from CSRF and sanitization (they use signature verification instead)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/webhooks/')) {
    return next();
  }
  sanitizeInput(req, res, next);
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/webhooks/')) {
    return next();
  }
  csrfProtection(req, res, next);
});

app.use(logger.requestLogger.bind(logger));

// Metrics collection
app.use(metricsMiddleware);

// Setup API documentation (Swagger)
if (app.get("env") === "development") {
  setupSwagger(app);
}

// Initialize session cleanup on startup
initializeSessionCleanup();

// Initialize database cleanup jobs
// TEMPORARILY DISABLED - drizzle queries hanging, holding all pool connections
// const { initializeDatabaseCleanup } = await import("./utils/password-history-cleanup");
// initializeDatabaseCleanup();

// Initialize connection pool monitoring
// TEMPORARILY DISABLED - monitoring queries may be causing deadlock
// const { startConnectionPoolMonitoring } = await import("./monitoring/connection-pool");
// startConnectionPoolMonitoring();

// Preload CSRF tokens to prevent bootstrap race condition
const csrfTokenCache = new Map<string, { token: string; expires: number }>();
app.set('csrfTokenCache', csrfTokenCache);

(async () => {
  const server = await registerRoutes(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    log('Initializing Vite development server...');
    await setupVite(app, server);
    log('Vite development server ready');
  } else {
    serveStatic(app);
  }

  // 404 handler for undefined API routes only (check originalUrl to avoid blocking static assets)
  app.use((req, res, next) => {
    // Only handle actual API routes that weren't matched
    if (req.originalUrl.startsWith('/api/')) {
      return notFoundHandler(req, res);
    }
    // All other routes are handled by Vite/static middleware above
    next();
  });

  // Global error boundary - must be last
  app.use(errorBoundary);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Non-blocking initialization of background services
    // Delay startup by 10 seconds to allow server to stabilize and handle initial requests
    setTimeout(async () => {
      try {
        // Schedule session cleanup every hour
        const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
        setInterval(async () => {
          try {
            await storage.cleanupExpiredSessions();
            log('Expired sessions cleaned up');
          } catch (error) {
            console.error('Error cleaning up sessions:', error);
          }
        }, SESSION_CLEANUP_INTERVAL);
        
        // Run initial cleanup
        storage.cleanupExpiredSessions().catch((error) => {
          console.error('Initial session cleanup error:', error);
        });
        
        // TEMPORARILY DISABLED ALL BACKGROUND JOBS - Testing core API functionality
        // Will re-enable incrementally after verifying core application works
        
        // const { monitorConnectionPool } = await import('./db');
        // monitorConnectionPool();
        log('Background jobs temporarily disabled for testing');
        
        // CRITICAL FIX #3: Start 2FA encryption key rotation (90 day rotation)
        const { scheduleKeyRotation } = await import('./utils/key-rotation');
        scheduleKeyRotation();
        log('2FA encryption key rotation scheduler started');
        
        // PHASE 1 - ISSUE #15: Register graceful shutdown handler with 30s drain
        const { setupGracefulShutdown } = await import('./utils/graceful-shutdown');
        setupGracefulShutdown(server);
        log('Graceful shutdown handlers registered');
        
        // SECURITY: Initialize quarantine directory for file upload security
        const { initializeQuarantineDirectory } = await import('./middleware/file-upload-security');
        await initializeQuarantineDirectory();
        log('File upload security initialized (quarantine directory ready)');
      } catch (error) {
        logger.error('Error during post-startup initialization', error instanceof Error ? error : undefined);
      }
    }, 10000); // Delay background jobs by 10 seconds
  });
})();
