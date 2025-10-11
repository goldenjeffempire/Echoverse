import { logger } from '../logger';
/**
 * Email Verification Enforcement Middleware
 *
 * Ensures that users have verified their email before accessing protected routes.
 * This middleware should be applied AFTER authentication middleware.
 *
 * Usage:
 *   app.get('/api/protected-route', authenticateToken, requireEmailVerification, handler);
 */
export function requireEmailVerification(req, res, next) {
    // Skip if user is not authenticated (auth middleware will handle)
    if (!req.user) {
        return next();
    }
    // Check if email is verified
    if (!req.user.isEmailVerified) {
        logger.warn('Unauthorized access attempt - email not verified', {
            userId: req.user.id,
            email: req.user.email,
            path: req.path
        });
        res.status(403).json({
            error: 'Email verification required',
            code: 'EMAIL_NOT_VERIFIED',
            message: 'You must verify your email address before accessing this resource. Please check your email for the verification link.',
            action: 'verify_email'
        });
        return;
    }
    next();
}
/**
 * Optional email verification middleware
 * Adds a warning header but doesn't block access
 */
export function warnEmailVerification(req, res, next) {
    if (req.user && !req.user.isEmailVerified) {
        res.setHeader('X-Email-Verification-Status', 'unverified');
        res.setHeader('X-Email-Verification-Warning', 'Email verification recommended');
    }
    next();
}
