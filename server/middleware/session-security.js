/**
 * SECURITY FIX (CRIT-016): Enhanced Session Fixation Prevention
 * Regenerates session IDs at critical points
 */
import { logger } from '../logger';
/**
 * Regenerate session ID to prevent session fixation
 * Call after login, privilege escalation, or sensitive operations
 */
export async function regenerateSession(req) {
    return new Promise((resolve, reject) => {
        if (!req.session) {
            return resolve();
        }
        const oldSessionId = req.sessionID;
        const sessionData = { ...req.session };
        req.session.regenerate((err) => {
            if (err) {
                logger.error('Session regeneration failed', err instanceof Error ? err : new Error(String(err)));
                return reject(err);
            }
            // Restore session data after regeneration
            if (req.session) {
                Object.assign(req.session, sessionData);
            }
            logger.info('Session regenerated successfully', {
                oldSessionId,
                newSessionId: req.sessionID,
                userId: req.session.userId
            });
            resolve();
        });
    });
}
/**
 * Middleware: Regenerate session after successful login
 */
export async function regenerateAfterLogin(req, res, next) {
    try {
        await regenerateSession(req);
        next();
    }
    catch (error) {
        next(error);
    }
}
/**
 * Middleware: Regenerate session before privilege escalation
 */
export async function regenerateBeforeElevation(req, res, next) {
    try {
        if (req.session && req.session.userId) {
            await regenerateSession(req);
        }
        next();
    }
    catch (error) {
        next(error);
    }
}
/**
 * Destroy session completely (for logout)
 */
export async function destroySession(req) {
    return new Promise((resolve, reject) => {
        if (!req.session) {
            return resolve();
        }
        const sessionId = req.sessionID;
        req.session.destroy((err) => {
            if (err) {
                logger.error('Session destruction failed', err instanceof Error ? err : new Error(String(err)));
                return reject(err);
            }
            logger.info('Session destroyed successfully', { sessionId });
            resolve();
        });
    });
}
/**
 * SECURITY: Clear session cookie securely
 */
export function clearSessionCookie(res) {
    res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
}
/**
 * Complete logout: destroy session and clear cookie
 */
export async function completeLogout(req, res) {
    await destroySession(req);
    clearSessionCookie(res);
}
/**
 * SECURITY: Validate session freshness
 * Reject sessions older than max age
 */
export function validateSessionFreshness(maxAgeMs = 24 * 60 * 60 * 1000) {
    return (req, res, next) => {
        if (!req.session || !req.session.createdAt) {
            return next();
        }
        const sessionAge = Date.now() - req.session.createdAt;
        if (sessionAge > maxAgeMs) {
            logger.warn('Session expired due to age', {
                sessionId: req.sessionID,
                age: sessionAge,
                maxAge: maxAgeMs
            });
            destroySession(req).then(() => {
                res.status(401).json({
                    error: 'Session expired',
                    message: 'Please log in again'
                });
            });
            return;
        }
        next();
    };
}
/**
 * Track session creation time
 */
export function trackSessionCreation(req, res, next) {
    if (req.session && !req.session.createdAt) {
        req.session.createdAt = Date.now();
    }
    next();
}
/**
 * SECURITY: Bind session to IP address
 * Prevents session hijacking from different IP
 */
export function bindSessionToIP(req, res, next) {
    if (!req.session) {
        return next();
    }
    const currentIP = req.ip;
    const sessionIP = req.session.boundIP;
    if (!sessionIP) {
        // First request: bind IP
        req.session.boundIP = currentIP;
        return next();
    }
    if (sessionIP !== currentIP) {
        logger.warn('Session IP mismatch - possible hijacking', {
            sessionId: req.sessionID,
            sessionIP,
            currentIP,
            userId: req.session.userId
        });
        destroySession(req).then(() => {
            res.status(401).json({
                error: 'Session invalid',
                message: 'Security violation detected. Please log in again.'
            });
        });
        return;
    }
    next();
}
