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
import ipaddr from 'ipaddr.js';
/**
 * Get client identifier (IP address)
 * SECURITY FIX (CRIT-001): Validate X-Forwarded-For to prevent spoofing
 * CRITICAL FIX: Properly integrate with Express trust proxy configuration
 * Safely extracts the client IP using Express's trust proxy logic
 */
function getClientIdentifier(req) {
    // Get immediate client IP (most reliable)
    const directIP = req.socket.remoteAddress || 'unknown';
    // Parse and normalize the direct IP to handle IPv6/IPv4 mixed formats
    let normalizedDirectIP = directIP;
    try {
        const parsed = ipaddr.process(directIP);
        normalizedDirectIP = parsed.toString();
    }
    catch (e) {
        // If parsing fails, use original
        normalizedDirectIP = directIP;
    }
    // CRITICAL FIX: Use Express's trust proxy configuration properly
    // When trust proxy is enabled, Express already validates and sets req.ip
    const trustProxySetting = req.app?.get('trust proxy');
    // If trust proxy is enabled (any truthy value), use Express-validated req.ip
    if (trustProxySetting) {
        // Express has already evaluated the proxy chain and set req.ip
        // This respects the trust proxy configuration (number, boolean, string, function, etc.)
        if (req.ip) {
            try {
                const parsed = ipaddr.process(req.ip);
                return parsed.toString();
            }
            catch {
                // Fall back to direct IP if parsing fails
                return normalizedDirectIP;
            }
        }
    }
    // If trust proxy is NOT configured, default to direct socket IP
    // We don't use TRUSTED_PROXY_IPS when trust proxy is disabled to avoid drift
    return normalizedDirectIP;
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
    standardHeaders: 'draft-7', // CRITICAL FIX: Use draft-7 to include headers on all responses
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
        const userId = req.user?.id || 'anonymous';
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
        const userId = req.user?.id || 'anonymous';
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
        const userId = req.user?.id || getClientIdentifier(req);
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
        const userId = req.user?.id || 'anonymous';
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
        const userId = req.user?.id || 'anonymous';
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
        const userId = req.user?.id || getClientIdentifier(req);
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
        const userId = req.user?.id || 'anonymous';
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
/**
 * AI endpoint rate limiter - CRITICAL FIX #4
 * 10 requests per hour per user
 * Strict per-user quota to prevent API abuse and control costs
 */
export const aiEndpointRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour (CRITICAL FIX #4)
    max: 10,
    message: {
        error: 'AI request rate limit exceeded. You have reached your limit of 10 AI requests per hour.',
        code: 'RATE_LIMIT_AI'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        const userId = req.user?.id || getClientIdentifier(req);
        return `ai:${userId}`;
    },
    handler: (req, res) => {
        const retryAfter = 60 * 60; // 1 hour in seconds
        res.status(429).json({
            error: 'AI request quota exceeded. You have reached your limit of 10 AI requests per hour. Please upgrade your plan for higher limits.',
            retryAfter,
            code: 'RATE_LIMIT_AI_EXCEEDED',
            headers: {
                'X-RateLimit-Limit': '10',
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(Date.now() + 60 * 60 * 1000).toISOString()
            }
        });
    }
});
/**
 * Product creation rate limiter
 * 20 products per hour per user, 50 per hour per IP
 * Prevents spam and abuse while allowing legitimate bulk operations
 */
export const productCreationRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: {
        error: 'Product creation rate limit exceeded.',
        code: 'RATE_LIMIT_PRODUCT_CREATE'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        const userId = req.user?.id || getClientIdentifier(req);
        return `product-create:${userId}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            error: 'Product creation limit reached. Please wait before creating more products.',
            retryAfter: Math.ceil(60 * 60),
            code: 'RATE_LIMIT_PRODUCT_CREATE_EXCEEDED'
        });
    }
});
/**
 * Media upload rate limiter (stricter than general file upload)
 * 10 uploads per hour per user
 * Lower RPS for media to prevent storage abuse
 */
export const mediaUploadRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: {
        error: 'Media upload rate limit exceeded.',
        code: 'RATE_LIMIT_MEDIA_UPLOAD'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        const userId = req.user?.id || getClientIdentifier(req);
        return `media-upload:${userId}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            error: 'Media upload quota exceeded. Please wait before uploading more media files.',
            retryAfter: Math.ceil(60 * 60),
            code: 'RATE_LIMIT_MEDIA_EXCEEDED'
        });
    }
});
/**
 * CSRF token rate limiter - FIXED AUDIT #5
 * 10 requests per minute per IP (reduced from 30)
 * Prevents CSRF token enumeration attacks
 */
export const csrfTokenRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // FIXED AUDIT #5: Stricter limit
    message: {
        error: 'Too many CSRF token requests.',
        code: 'RATE_LIMIT_CSRF_TOKEN'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        const ip = getClientIdentifier(req);
        return `csrf-token:${ip}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            error: 'CSRF token request rate limit exceeded. Please slow down.',
            retryAfter: Math.ceil(60),
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
});
/**
 * 2FA Backup Codes rate limiter - CRITICAL FIX #5: DAILY LIMIT
 * 3 requests per 24 hours per user to prevent abuse
 * Prevents abuse of backup code generation
 */
export const backupCodesRateLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours (CRITICAL FIX #5)
    max: 3, // Only 3 regenerations per day
    message: {
        error: 'Too many backup code requests. You can only regenerate backup codes 3 times per day.',
        code: 'RATE_LIMIT_BACKUP_CODES'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        // CRITICAL FIX #5: Key ONLY by userId to prevent IP rotation bypass
        // Users cannot circumvent the daily limit by changing their IP address
        const userId = req.user?.id || 'anonymous';
        return `backup-codes-daily:${userId}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            error: 'Daily backup code regeneration limit reached (3 per 24 hours). Please wait before requesting again.',
            retryAfter: Math.ceil(24 * 60 * 60), // 24 hours
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
});
/**
 * Admin role update rate limiter - PHASE 1 CRITICAL SECURITY
 * 10 requests per hour per admin user
 * Prevents role manipulation abuse
 */
export const adminRoleUpdateRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: {
        error: 'Too many role update requests.',
        code: 'RATE_LIMIT_ADMIN_ROLE_UPDATE'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        const userId = req.user?.id || getClientIdentifier(req);
        return `admin-role-update:${userId}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many role update attempts. Please wait before trying again.',
            retryAfter: Math.ceil(60 * 60),
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
});
/**
 * Admin user management rate limiter - PHASE 1 CRITICAL SECURITY
 * 50 requests per 15 minutes per admin user
 * Prevents user management endpoint abuse
 */
export const adminUserManagementRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    message: {
        error: 'Too many admin user management requests.',
        code: 'RATE_LIMIT_ADMIN_USER_MGMT'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        const userId = req.user?.id || getClientIdentifier(req);
        return `admin-user-mgmt:${userId}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many user management requests. Please wait before trying again.',
            retryAfter: Math.ceil(15 * 60),
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
});
/**
 * Admin query operations rate limiter - CRIT-002 FIX
 * 30 requests per 5 minutes per admin user
 * Prevents DoS on expensive query endpoints like query-metrics, db-stats
 */
export const adminQueryOperationsRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 30,
    message: {
        error: 'Too many admin query requests.',
        code: 'RATE_LIMIT_ADMIN_QUERY'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        const userId = req.user?.id || getClientIdentifier(req);
        return `admin-query-ops:${userId}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many query requests. Please wait before trying again.',
            retryAfter: Math.ceil(5 * 60),
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
});
