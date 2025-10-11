/**
 * Session Fingerprinting Middleware
 * PHASE 1: CRITICAL SECURITY - Device tracking and session binding
 *
 * Creates a unique fingerprint for each session based on:
 * - IP address
 * - User-Agent string
 * - Accept-Language header
 * - Device characteristics
 *
 * Detects session hijacking by validating fingerprint on each request
 */
import { createHash } from 'crypto';
import { logger } from '../logger';
/**
 * Generate a unique fingerprint hash from request characteristics
 * Enhanced with multiple browser and network characteristics
 */
export function generateFingerprint(req) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.ip ||
        req.socket.remoteAddress ||
        'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const acceptLanguage = req.headers['accept-language'] || 'unknown';
    const acceptEncoding = req.headers['accept-encoding'] || 'unknown';
    const accept = req.headers['accept'] || 'unknown';
    // TLS/HTTP2 fingerprinting characteristics
    const httpVersion = req.httpVersion || 'unknown';
    const connection = req.headers['connection'] || 'unknown';
    const upgradeInsecureRequests = req.headers['upgrade-insecure-requests'] || 'unknown';
    const secFetchSite = req.headers['sec-fetch-site'] || 'unknown';
    const secFetchMode = req.headers['sec-fetch-mode'] || 'unknown';
    const secFetchDest = req.headers['sec-fetch-dest'] || 'unknown';
    const secChUa = req.headers['sec-ch-ua'] || 'unknown';
    const secChUaMobile = req.headers['sec-ch-ua-mobile'] || 'unknown';
    const secChUaPlatform = req.headers['sec-ch-ua-platform'] || 'unknown';
    // DNT (Do Not Track) and other privacy headers
    const dnt = req.headers['dnt'] || 'unknown';
    // Create a comprehensive hash from all characteristics
    // Order matters for consistency
    const fingerprintData = [
        ip,
        userAgent,
        acceptLanguage,
        acceptEncoding,
        accept,
        httpVersion,
        connection,
        upgradeInsecureRequests,
        secFetchSite,
        secFetchMode,
        secFetchDest,
        secChUa,
        secChUaMobile,
        secChUaPlatform,
        dnt
    ].join('|');
    const hash = createHash('sha256').update(fingerprintData).digest('hex');
    return {
        hash,
        ip,
        userAgent,
        acceptLanguage
    };
}
/**
 * Middleware to attach fingerprint to request
 */
export function attachFingerprint(req, res, next) {
    req.fingerprint = generateFingerprint(req);
    next();
}
/**
 * Validate session fingerprint against stored value
 * Detects session hijacking attempts
 */
export function validateFingerprint(storedFingerprint, currentFingerprint, strict = false) {
    // In strict mode, fingerprint must match exactly
    if (strict) {
        if (storedFingerprint !== currentFingerprint.hash) {
            return {
                valid: false,
                reason: 'Fingerprint mismatch - possible session hijacking'
            };
        }
        return { valid: true };
    }
    // In non-strict mode, allow some flexibility for legitimate changes
    // (e.g., mobile network IP changes, browser updates)
    // But still flag major discrepancies
    if (storedFingerprint !== currentFingerprint.hash) {
        logger.warn('Session fingerprint changed', {
            stored: storedFingerprint.substring(0, 16),
            current: currentFingerprint.hash.substring(0, 16),
            ip: currentFingerprint.ip
        });
        // This is a warning but we allow it in non-strict mode
        // The session is still valid, but we log it for monitoring
    }
    return { valid: true };
}
/**
 * Session fingerprint validation middleware
 * Checks if the current request fingerprint matches the session
 */
export function sessionFingerprintValidation(req, res, next) {
    // Only validate if user is authenticated and has a session
    if (!req.user || !req.session) {
        return next();
    }
    const session = req.session;
    // If no stored fingerprint, this is first request - store it
    if (!session.fingerprint) {
        const fingerprint = req.fingerprint || generateFingerprint(req);
        session.fingerprint = fingerprint.hash;
        session.deviceInfo = {
            ip: fingerprint.ip,
            userAgent: fingerprint.userAgent,
            acceptLanguage: fingerprint.acceptLanguage,
            firstSeen: new Date().toISOString()
        };
        return next();
    }
    // Validate fingerprint
    const currentFingerprint = req.fingerprint || generateFingerprint(req);
    // CRIT-007 FIX: Configurable strict mode via SESSION_STRICT_MODE env var
    // Defaults to true in production, false in development
    const strictMode = process.env.SESSION_STRICT_MODE === 'true' ||
        (process.env.SESSION_STRICT_MODE !== 'false' && process.env.NODE_ENV === 'production');
    const validation = validateFingerprint(session.fingerprint, currentFingerprint, strictMode);
    if (!validation.valid) {
        logger.error('Session hijacking attempt detected', new Error(validation.reason || 'Fingerprint mismatch'), {
            userId: req.user.id,
            storedFingerprint: session.fingerprint?.substring(0, 16),
            currentFingerprint: currentFingerprint.hash.substring(0, 16),
            reason: validation.reason
        });
        // Destroy the potentially compromised session
        req.session.destroy((err) => {
            if (err) {
                logger.error('Error destroying compromised session', err instanceof Error ? err : new Error(String(err)));
            }
        });
        res.status(401).json({
            error: 'Session security violation detected',
            code: 'SESSION_HIJACKING_DETECTED',
            message: 'Your session has been terminated for security reasons. Please log in again.'
        });
        return;
    }
    next();
}
