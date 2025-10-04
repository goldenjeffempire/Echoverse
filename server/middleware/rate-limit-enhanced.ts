/**
 * Enhanced Rate Limiting Middleware
 * 
 * Provides specific rate limiters for sensitive endpoints:
 * - Password reset requests
 * - 2FA verification attempts
 * - Email verification
 * - Account operations
 */

import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

/**
 * Get client identifier (IP address)
 * Safely extracts the client IP from various headers with fallbacks
 */
function getClientIdentifier(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  
  return (
    typeof forwarded === 'string' ? forwarded.split(',')[0].trim() :
    typeof realIp === 'string' ? realIp :
    req.socket.remoteAddress
  ) || 'unknown';
}

/**
 * Password reset rate limiter
 * 3 requests per hour per IP address
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Too many password reset attempts. Please try again in an hour.',
    code: 'RATE_LIMIT_PASSWORD_RESET'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    const ip = getClientIdentifier(req);
    return `pwd-reset:${ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many password reset attempts from this IP address. Please try again later.',
      retryAfter: Math.ceil(60 * 60), // seconds
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * 2FA verification rate limiter
 * 5 attempts per 15 minutes per IP + user combination
 */
export const twoFactorVerifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: 'Too many 2FA verification attempts. Please try again in 15 minutes.',
    code: 'RATE_LIMIT_2FA_VERIFY'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Reset on successful verification
  keyGenerator: (req) => {
    const ip = getClientIdentifier(req);
    const userId = (req as any).user?.id || 'anonymous';
    return `2fa-verify:${userId}:${ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many 2FA verification attempts. Please wait 15 minutes before trying again.',
      retryAfter: Math.ceil(15 * 60),
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * 2FA setup/enable rate limiter
 * 3 attempts per hour per IP
 */
export const twoFactorSetupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Too many 2FA setup attempts.',
    code: 'RATE_LIMIT_2FA_SETUP'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIdentifier(req);
    const userId = (req as any).user?.id || 'anonymous';
    return `2fa-setup:${userId}:${ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many 2FA setup attempts. Please wait before trying again.',
      retryAfter: Math.ceil(60 * 60),
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Login rate limiter
 * 10 attempts per 15 minutes per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error: 'Too many login attempts. Please try again later.',
    code: 'RATE_LIMIT_LOGIN'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Reset counter on successful login
  keyGenerator: (req) => {
    const ip = getClientIdentifier(req);
    return `login:${ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts from this IP address. Please try again in 15 minutes.',
      retryAfter: Math.ceil(15 * 60),
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Registration rate limiter
 * 3 registrations per hour per IP
 */
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Too many registration attempts.',
    code: 'RATE_LIMIT_REGISTRATION'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIdentifier(req);
    return `register:${ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many registration attempts from this IP address. Please try again later.',
      retryAfter: Math.ceil(60 * 60),
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Email verification rate limiter
 * 5 requests per hour per user
 */
export const emailVerificationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    error: 'Too many email verification requests.',
    code: 'RATE_LIMIT_EMAIL_VERIFY'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || getClientIdentifier(req);
    return `email-verify:${userId}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many email verification requests. Please check your email or wait before requesting again.',
      retryAfter: Math.ceil(60 * 60),
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Account deletion rate limiter
 * 1 attempt per day per IP
 */
export const accountDeletionRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1,
  message: {
    error: 'Account deletion attempt limit reached.',
    code: 'RATE_LIMIT_ACCOUNT_DELETION'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIdentifier(req);
    const userId = (req as any).user?.id || 'anonymous';
    return `account-delete:${userId}:${ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Account deletion attempt limit reached. Please contact support if you need assistance.',
      retryAfter: Math.ceil(24 * 60 * 60),
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Password change rate limiter
 * 5 changes per day per user
 */
export const passwordChangeRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  message: {
    error: 'Too many password changes.',
    code: 'RATE_LIMIT_PASSWORD_CHANGE'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || 'anonymous';
    return `pwd-change:${userId}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many password changes. Please wait 24 hours before changing your password again.',
      retryAfter: Math.ceil(24 * 60 * 60),
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * File upload rate limiter
 * 20 uploads per hour per user
 */
export const fileUploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    error: 'Too many file uploads.',
    code: 'RATE_LIMIT_FILE_UPLOAD'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || getClientIdentifier(req);
    return `file-upload:${userId}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many file uploads. Please wait before uploading more files.',
      retryAfter: Math.ceil(60 * 60),
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * API endpoint rate limiter (stricter for sensitive operations)
 * 50 requests per 15 minutes per IP
 */
export const sensitiveApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: {
    error: 'Too many API requests.',
    code: 'RATE_LIMIT_API'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIdentifier(req);
    return `api-sensitive:${ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded for sensitive operations. Please slow down.',
      retryAfter: Math.ceil(15 * 60),
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Global IP-based rate limiter (very permissive, catches abuse)
 * 1000 requests per 15 minutes per IP
 */
export const globalIpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    error: 'Global rate limit exceeded.',
    code: 'RATE_LIMIT_GLOBAL'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIdentifier(req);
    return `global:${ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'You have exceeded the global rate limit. Please wait before making more requests.',
      retryAfter: Math.ceil(15 * 60),
      code: 'RATE_LIMIT_GLOBAL_EXCEEDED'
    });
  }
});

/**
 * Token refresh rate limiter
 * 20 refresh requests per 15 minutes per IP
 * CRITICAL: Prevents token refresh abuse
 */
export const tokenRefreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    error: 'Too many token refresh attempts.',
    code: 'RATE_LIMIT_TOKEN_REFRESH'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIdentifier(req);
    return `token-refresh:${ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many token refresh attempts. Please wait before trying again.',
      retryAfter: Math.ceil(15 * 60),
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Webhook rate limiter
 * 100 webhook requests per minute per IP
 * Prevents webhook flooding attacks
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: 'Too many webhook requests.',
    code: 'RATE_LIMIT_WEBHOOK'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIdentifier(req);
    return `webhook:${ip}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Webhook rate limit exceeded. Please slow down.',
      retryAfter: Math.ceil(60),
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Health check rate limiter
 * 10 requests per minute per IP (strict limit to prevent abuse)
 * Infrastructure monitoring should be allowlisted at network layer
 */
export const healthCheckRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: 'Health check rate limit exceeded.',
    code: 'RATE_LIMIT_HEALTH'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    const ip = getClientIdentifier(req);
    const path = req.path;
    return `health:${ip}:${path}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Health check rate limit exceeded. Infrastructure monitoring should be allowlisted.',
      retryAfter: Math.ceil(60),
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Static asset/uploads rate limiter
 * 30 requests per 15 minutes per IP+path
 * Strict limits to prevent abuse of static file serving
 */
export const staticAssetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: {
    error: 'Too many requests to static assets.',
    code: 'RATE_LIMIT_STATIC'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    const ip = getClientIdentifier(req);
    const userId = (req as any).user?.id || 'anonymous';
    return `static:${ip}:${userId}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded for static assets. Please slow down.',
      retryAfter: Math.ceil(15 * 60),
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});
