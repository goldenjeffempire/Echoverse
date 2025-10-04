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

function validateEnvironmentVariables() {
  const requiredVars = ['DATABASE_URL', 'SESSION_SECRET', 'STRIPE_SECRET_KEY', 'OPENAI_API_KEY'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error(`ERROR: Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please set these environment variables before starting the server.');
    process.exit(1);
  }
  
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      console.error('ERROR: JWT_SECRET is required in production and must be different from SESSION_SECRET');
      process.exit(1);
    }
    if (process.env.JWT_SECRET === process.env.SESSION_SECRET) {
      console.error('ERROR: JWT_SECRET must be different from SESSION_SECRET in production');
      process.exit(1);
    }
    if (!process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY) {
      console.error('ERROR: TWO_FACTOR_BACKUP_ENCRYPTION_KEY is required in production for encrypting 2FA backup codes');
      console.error('Generate with: openssl rand -hex 32');
      process.exit(1);
    }
    if (process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY.length < 32) {
      console.error('ERROR: TWO_FACTOR_BACKUP_ENCRYPTION_KEY must be at least 32 characters long');
      process.exit(1);
    }
    if (!process.env.WEBHOOK_SIGNATURE_SECRET) {
      console.error('ERROR: WEBHOOK_SIGNATURE_SECRET is required in production for webhook signature verification');
      console.error('Generate with: openssl rand -hex 32');
      process.exit(1);
    }
    if (process.env.WEBHOOK_SIGNATURE_SECRET.length < 32) {
      console.error('ERROR: WEBHOOK_SIGNATURE_SECRET must be at least 32 characters long');
      process.exit(1);
    }
    if (!process.env.ALLOWED_ORIGINS) {
      console.warn('WARNING: ALLOWED_ORIGINS not set in production. CORS will block all cross-origin requests.');
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.warn('WARNING: STRIPE_WEBHOOK_SECRET not set. Webhook signature verification will fail.');
    }
    if (!process.env.STRIPE_PRICE_ID) {
      console.warn('WARNING: STRIPE_PRICE_ID not set. Subscription creation will fail.');
    }
    if (!process.env.APP_URL) {
      console.warn('WARNING: APP_URL not set. Email links and webhooks may not work correctly.');
    }
  } else {
    if (!process.env.JWT_SECRET) {
      console.warn('WARNING: JWT_SECRET not set. For production, set a separate JWT_SECRET different from SESSION_SECRET');
    } else if (process.env.JWT_SECRET === process.env.SESSION_SECRET) {
      console.warn('WARNING: JWT_SECRET equals SESSION_SECRET. For production, use different secrets.');
    }
    if (!process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY) {
      console.warn('WARNING: TWO_FACTOR_BACKUP_ENCRYPTION_KEY not set. Generate with: openssl rand -hex 32');
    } else if (process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY.length < 32) {
      console.warn('WARNING: TWO_FACTOR_BACKUP_ENCRYPTION_KEY should be at least 32 characters (64+ recommended for production)');
    }
  }
  
  log('Environment variables validated successfully');
}

validateEnvironmentVariables();

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://maps.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
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

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : true,
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

// Stripe webhook needs raw body for signature verification
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

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

// Initialize session cleanup on startup
initializeSessionCleanup();

// Initialize database cleanup jobs
const { initializeDatabaseCleanup } = await import("./utils/password-history-cleanup");
initializeDatabaseCleanup();

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

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
  });
})();
