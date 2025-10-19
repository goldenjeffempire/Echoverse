/**
 * SECURITY FIX (CRIT-020): CORS Preflight Cache Poisoning Prevention
 * Implements secure CORS configuration with cache control
 */
import cors from 'cors';
import { logger } from '../logger';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5000',
    'http://localhost:5173',
];
// Add production domain if available
if (process.env.PRODUCTION_URL) {
    ALLOWED_ORIGINS.push(process.env.PRODUCTION_URL);
}
/**
 * CORS configuration with security hardening
 * - Prevents cache poisoning via dynamic origin validation
 * - Implements strict preflight caching limits
 * - Validates origin on every request
 */
export const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) {
            return callback(null, true);
        }
        // SECURITY: Validate origin dynamically to prevent cache poisoning
        // Never cache the origin decision
        if (ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        }
        else {
            logger.warn('CORS request blocked', {
                origin,
                allowedOrigins: ALLOWED_ORIGINS
            });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    // SECURITY FIX (CRIT-020): Limit preflight cache to prevent poisoning
    // Short maxAge prevents cached preflight from being exploited
    maxAge: 600, // 10 minutes (down from default 86400)
    // Expose only necessary headers
    exposedHeaders: [
        'X-API-Version',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset'
    ],
    // Allow necessary headers
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-API-Key',
        'X-CSRF-Token',
        'api-version'
    ],
    // Allow common methods
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // Preflight success status
    optionsSuccessStatus: 204,
    // Continue to next middleware on OPTIONS
    preflightContinue: false,
};
/**
 * Additional CORS security middleware
 * Validates Vary header to prevent caching issues
 * CRIT-007: Validates Access-Control-Max-Age header
 */
export function corsSecurityHeaders(req, res, next) {
    // SECURITY: Set Vary header to prevent cache poisoning
    // Forces caches to consider Origin header when caching responses
    res.setHeader('Vary', 'Origin');
    // SECURITY: Prevent CORS bypass via null origin
    const origin = req.headers.origin;
    if (origin === 'null') {
        logger.warn('Null origin CORS request blocked', {
            ip: req.ip,
            path: req.path
        });
        res.status(403).json({ error: 'Invalid origin' });
        return;
    }
    // CRIT-007 FIX: Validate Access-Control-Max-Age header on OPTIONS responses
    if (req.method === 'OPTIONS') {
        const originalSend = res.send;
        res.send = function (data) {
            const maxAgeHeader = res.getHeader('Access-Control-Max-Age');
            const expectedMaxAge = '600'; // 10 minutes as configured in corsOptions
            // Verify the header is set and matches our expected value
            if (!maxAgeHeader || maxAgeHeader.toString() !== expectedMaxAge) {
                logger.warn('CORS preflight maxAge mismatch - possible CDN override', {
                    expected: expectedMaxAge,
                    actual: maxAgeHeader,
                    origin: origin || 'none'
                });
                // Force set the correct value to prevent cache poisoning
                res.setHeader('Access-Control-Max-Age', expectedMaxAge);
            }
            return originalSend.call(this, data);
        };
    }
    next();
}
export const secureCors = cors(corsOptions);
