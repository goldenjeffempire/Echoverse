/**
 * SECURITY FIX (CRIT-021): Standardized Rate Limit Headers
 * Implements RFC 6585 and draft-ietf-httpapi-ratelimit-headers
 */
/**
 * Add standardized rate limit headers to response
 * Follows RateLimit Header Fields for HTTP (draft-ietf-httpapi-ratelimit-headers)
 */
export function setRateLimitHeaders(res, info) {
    // Standard headers (IETF draft)
    res.setHeader('RateLimit-Limit', info.limit.toString());
    res.setHeader('RateLimit-Remaining', info.remaining.toString());
    res.setHeader('RateLimit-Reset', info.reset.toString());
    // Legacy headers for backward compatibility
    res.setHeader('X-RateLimit-Limit', info.limit.toString());
    res.setHeader('X-RateLimit-Remaining', info.remaining.toString());
    res.setHeader('X-RateLimit-Reset', info.reset.toString());
    // Add Retry-After when rate limited
    if (info.remaining === 0) {
        const retryAfter = Math.ceil((info.reset - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter.toString());
    }
}
/**
 * Enhanced rate limit response
 * Returns 429 with detailed information
 */
export function rateLimitExceeded(req, res, info) {
    setRateLimitHeaders(res, info);
    const retryAfter = Math.ceil((info.reset - Date.now()) / 1000);
    res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        limit: info.limit,
        remaining: info.remaining,
        reset: info.reset,
        resetTime: new Date(info.reset).toISOString(),
        retryAfter,
    });
}
/**
 * Rate limit middleware wrapper
 * Adds headers to all responses
 */
export function rateLimitHeaderMiddleware(info) {
    return (req, res, next) => {
        setRateLimitHeaders(res, info);
        next();
    };
}
/**
 * Calculate rate limit window reset time
 */
export function calculateResetTime(windowMs) {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    return windowStart + windowMs;
}
/**
 * Get rate limit info from request
 * Compatible with express-rate-limit
 */
export function getRateLimitInfo(req) {
    const limit = req.rateLimit?.limit;
    const remaining = req.rateLimit?.remaining;
    const reset = req.rateLimit?.resetTime;
    if (limit !== undefined && remaining !== undefined && reset !== undefined) {
        return {
            limit,
            remaining,
            reset: reset.getTime ? reset.getTime() : reset,
            resetTime: reset.getTime ? reset : new Date(reset)
        };
    }
    return null;
}
