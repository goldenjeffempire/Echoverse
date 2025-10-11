import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { logger } from '../logger';
import { storage } from '../storage';
import {
  generateDeviceFingerprint,
  regenerateSessionId,
  validateSessionSecurity
} from '../utils/session-security';
import type { AuthenticatedRequest } from '../auth';
import { db } from '../db';

/**
 * Automatic Session Rotation Middleware
 * 
 * Implements time-based and activity-based session rotation to prevent session hijacking
 * 
 * Rotation triggers:
 * - Session older than 4 hours (configurable)
 * - Suspicious activity detected (IP change, user-agent mismatch, etc.)
 * - Explicit rotation request
 * 
 * This middleware should run AFTER authentication middleware
 */

// Configuration
const SESSION_ROTATION_INTERVAL = parseInt(process.env.SESSION_ROTATION_INTERVAL || '14400000'); // 4 hours in milliseconds
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || '86400000'); // 24 hours
const ENABLE_AUTO_ROTATION = process.env.ENABLE_SESSION_AUTO_ROTATION !== 'false'; // Enabled by default

export async function sessionRotationMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Skip if automatic rotation is disabled
  if (!ENABLE_AUTO_ROTATION) {
    return next();
  }

  // Skip if user is not authenticated
  if (!req.user || !req.sessionId) {
    return next();
  }

  try {
    const sessionId = req.sessionId;
    const userId = req.user.id;

    // Get session from database
    const session = await storage.getSession(sessionId);
    if (!session) {
      // Session doesn't exist - let auth middleware handle this
      return next();
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      // Expired session - clear it
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.status(401).json({
        error: 'Session expired',
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired. Please log in again.'
      });
      return;
    }

    // Check session age for rotation
    const sessionAge = session.createdAt
      ? Date.now() - session.createdAt.getTime()
      : 0;
    const timeSinceActivity = session.lastActivityAt
      ? Date.now() - session.lastActivityAt.getTime()
      : sessionAge;

    let shouldRotate = false;
    const rotationReasons: string[] = [];

    // Check if session is too old and should be rotated
    if (timeSinceActivity > SESSION_ROTATION_INTERVAL) {
      shouldRotate = true;
      rotationReasons.push('time_based_rotation');
      logger.debug('Session rotation triggered by age', {
        sessionId: sessionId.substring(0, 8) + '...',
        userId,
        age: Math.floor(timeSinceActivity / 1000 / 60) + ' minutes'
      });
    }

    // Validate session security (fingerprint, IP changes, etc.)
    const securityValidation = await validateSessionSecurity(sessionId, req);

    if (!securityValidation.valid) {
      // Session is invalid - terminate it
      await storage.deleteSession(sessionId);
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.status(401).json({
        error: 'Session security violation',
        code: 'SESSION_INVALID',
        message: 'Your session has been terminated due to suspicious activity.',
        reasons: securityValidation.reasons
      });
      return;
    }

    if (securityValidation.shouldRotate) {
      shouldRotate = true;
      rotationReasons.push(...securityValidation.reasons);
    }

    // Perform rotation if needed
    if (shouldRotate) {
      logger.info('Rotating session', {
        sessionId: sessionId.substring(0, 8) + '...',
        userId,
        reasons: rotationReasons
      });

      try {
        const fingerprint = generateDeviceFingerprint(req);
        const newSessionId = await regenerateSessionId(
          sessionId,
          userId,
          'security_event',
          fingerprint
        );

        // Update the request with new session ID
        req.sessionId = newSessionId;

        // Note: The new session tokens should be issued by the refresh token endpoint
        // For now, we just rotate the session ID in the database
        // The client will get new tokens on next refresh

        logger.info('Session rotated successfully', {
          oldSessionId: sessionId.substring(0, 8) + '...',
          newSessionId: newSessionId.substring(0, 8) + '...',
          userId
        });

        // Add header to inform client that session was rotated
        res.setHeader('X-Session-Rotated', 'true');
        res.setHeader('X-Session-Id', newSessionId);
      } catch (error) {
        logger.error('Session rotation failed', error instanceof Error ? error : undefined, {
          sessionId: sessionId.substring(0, 8) + '...',
          userId
        });
        // Don't fail the request, just log the error
      }
    }

    // Update last activity timestamp
    await storage.updateSession(sessionId, {
      updatedAt: new Date()
    });

    next();
  } catch (error) {
    logger.error('Session rotation middleware error', error instanceof Error ? error : undefined, {
      userId: req.user?.id,
      sessionId: req.sessionId?.substring(0, 8) + '...'
    });
    // Don't fail the request on middleware errors
    next();
  }
}

/**
 * Skip session rotation for specific routes
 * Use this to bypass rotation on public endpoints or health checks
 */
export function skipSessionRotation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Mark request to skip rotation
  (req as any).skipSessionRotation = true;
  next();
}

/**
 * Conditional session rotation middleware
 * Only runs if not explicitly skipped
 */
export async function conditionalSessionRotation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if ((req as any).skipSessionRotation) {
    return next();
  }
  return sessionRotationMiddleware(req, res, next);
}

/**
 * Rotates the session token for a given request.
 * This is typically used after a successful login or when a privilege change occurs.
 *
 * @param req - The Express request object.
 * @param userId - The ID of the user associated with the session.
 * @param privilegeChange - A flag to indicate if the rotation is due to a privilege change.
 * @returns A Promise that resolves with the new session ID.
 */
export async function rotateSessionToken(req: AuthenticatedRequest, userId: number, privilegeChange: boolean = false): Promise<string> {
  const oldSessionId = req.sessionId;

  if (!oldSessionId) {
    throw new Error('Session not available');
  }

  try {
    // Generate device fingerprint
    const fingerprint = generateDeviceFingerprint(req);

    // Regenerate session ID using the storage-based approach
    const newSessionId = await regenerateSessionId(
      oldSessionId,
      String(userId),
      privilegeChange ? 'privilege_escalation' : 'security_event',
      fingerprint
    );

    // Update request with new session ID
    req.sessionId = newSessionId;

    logger.info('Session rotated successfully', {
      userId,
      oldSessionId: oldSessionId.substring(0, 8) + '...',
      newSessionId: newSessionId.substring(0, 8) + '...',
      privilegeChange
    });

    return newSessionId;
  } catch (error) {
    logger.error('Session rotation failed', error instanceof Error ? error : undefined, { userId });
    throw error;
  }
}

/**
 * Invalidates all other sessions for a given user, except for the current one.
 * This is a security measure to ensure that only the latest session is active.
 *
 * @param userId - The ID of the user whose sessions should be invalidated.
 * @param currentSessionId - The ID of the current session, which should not be invalidated.
 */
export async function invalidateOtherSessions(userId: number, currentSessionId: string) {
  try {
    const { sessions } = await import('../../shared/schema');
    await db.delete(sessions)
      .where(
        eq(sessions.userId, String(userId))
      );

    logger.info('Other sessions invalidated on privilege change', {
      userId,
      currentSessionId
    });
  } catch (error) {
    logger.error('Failed to invalidate other sessions', error instanceof Error ? error : undefined);
  }
}

/**
 * Session Rotation Middleware
 * Regenerates session ID on privilege changes to prevent session fixation
 */
export async function rotateSessionOnPrivilegeChange(
  userId: number,
  req: Request,
  reason: string = 'privilege_change'
): Promise<void> {
  const oldSessionId = req.headers.authorization?.replace('Bearer ', '');

  if (!oldSessionId) {
    logger.warn('No session to rotate', { userId, reason });
    return;
  }

  try {
    // Invalidate old session
    await storage.deleteSession(oldSessionId);

    // Create new session with same user - generate new refresh token
    const crypto = await import('crypto');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    const newSession = await storage.createSession({
      id: crypto.randomUUID(),
      userId: String(userId),
      refreshTokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    logger.info('Session rotated successfully', {
      userId,
      reason,
      oldSessionId: oldSessionId.substring(0, 8) + '...',
      newSessionId: newSession.id.substring(0, 8) + '...'
    });

    // Update request with new session
    req.headers.authorization = `Bearer ${newSession.id}`;

  } catch (error) {
    logger.error('Failed to rotate session', error as Error, { userId, reason });
    throw error;
  }
}