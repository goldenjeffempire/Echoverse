/**
 * SECURITY FIX (CRIT-011): 2FA Backup Code Rate Limiting
 * Prevents brute force attacks on backup codes
 */
import rateLimit from 'express-rate-limit';
import { AppError } from './error-boundary';
import { logger } from '../logger';
/**
 * Strict rate limiting for 2FA backup code attempts
 * Max 3 attempts per hour per user
 */
export const backupCodeRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    // Use user ID + IP for rate limiting key
    keyGenerator: (req) => {
        const userId = req.user?.id || req.session?.userId || 'anonymous';
        const ip = req.ip || 'unknown';
        return `2fa-backup:${userId}:${ip}`;
    },
    // Custom error response
    handler: (req, res) => {
        logger.warn('2FA backup code rate limit exceeded', {
            userId: req.user?.id,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        throw new AppError(429, 'Too many backup code attempts. Try again in 1 hour.', 'BACKUP_CODE_RATE_LIMIT');
    },
    // Skip successful requests (don't count toward limit)
    skipSuccessfulRequests: true,
    // Skip failed requests that aren't related to auth
    skipFailedRequests: false,
    // Standard headers
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Rate limiting for regular 2FA code verification
 * More lenient than backup codes
 */
export const twoFACodeRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 minutes
    keyGenerator: (req) => {
        const userId = req.user?.id || req.session?.userId || 'anonymous';
        const ip = req.ip || 'unknown';
        return `2fa-code:${userId}:${ip}`;
    },
    handler: (req, res) => {
        logger.warn('2FA code rate limit exceeded', {
            userId: req.user?.id,
            ip: req.ip
        });
        throw new AppError(429, 'Too many 2FA attempts. Try again in 15 minutes.', 'TWO_FA_RATE_LIMIT');
    },
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
    standardHeaders: true,
    legacyHeaders: false,
});
/**
 * Track failed 2FA attempts in database
 * For persistent tracking across server restarts
 */
export async function trackFailedTwoFAAttempt(userId, attemptType) {
    logger.warn('Failed 2FA attempt', {
        userId,
        attemptType,
        timestamp: new Date().toISOString()
    });
    // TODO: Store in database for long-term tracking
    // await db.insert(twoFAAttempts).values({
    //   userId,
    //   attemptType,
    //   timestamp: new Date(),
    //   success: false
    // });
}
/**
 * Check if user is locked out due to too many failed attempts
 */
export async function checkTwoFALockout(userId) {
    // TODO: Query database for failed attempts in last hour
    // const recentAttempts = await db.select()
    //   .from(twoFAAttempts)
    //   .where(
    //     and(
    //       eq(twoFAAttempts.userId, userId),
    //       eq(twoFAAttempts.success, false),
    //       gte(twoFAAttempts.timestamp, new Date(Date.now() - 60 * 60 * 1000))
    //     )
    //   );
    // if (recentAttempts.length >= 10) {
    //   logger.warn('User locked out due to failed 2FA attempts', { userId });
    //   return true;
    // }
    return false;
}
/**
 * Reset 2FA lockout for user (e.g., after successful verification)
 */
export async function resetTwoFALockout(userId) {
    logger.info('Resetting 2FA lockout', { userId });
    // TODO: Clear failed attempts from database
    // await db.delete(twoFAAttempts)
    //   .where(eq(twoFAAttempts.userId, userId));
}
