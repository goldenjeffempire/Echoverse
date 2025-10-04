import { db } from '../db';
import { sessions } from '@shared/schema';
import { lte, eq } from 'drizzle-orm';
import { logger } from '../logger';

// Promise-based mutex locks to prevent race conditions
let cleanupExpiredPromise: Promise<number> | null = null;
let cleanupOldPromise: Promise<number> | null = null;

/**
 * Clean up expired sessions from the database
 * Uses promise-based mutex to prevent race conditions from concurrent executions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  // If cleanup is already running, await the existing promise
  if (cleanupExpiredPromise) {
    logger.debug('Session cleanup already in progress, awaiting completion');
    return cleanupExpiredPromise;
  }
  
  // Create new cleanup promise and store it
  cleanupExpiredPromise = (async () => {
    try {
      const result = await db
        .delete(sessions)
        .where(lte(sessions.expiresAt, new Date()))
        .returning({ id: sessions.id });
      
      const count = result.length;
      if (count > 0) {
        logger.info('Cleaned up expired sessions', { count });
      }
      return count;
    } catch (error) {
      logger.error('Failed to cleanup expired sessions', error instanceof Error ? error : undefined);
      return 0;
    } finally {
      // Always release the lock
      cleanupExpiredPromise = null;
    }
  })();
  
  return cleanupExpiredPromise;
}

/**
 * Clean up old sessions (keep only most recent N per user)
 * Uses promise-based mutex to prevent race conditions from concurrent executions
 */
export async function cleanupOldSessions(keepPerUser: number = 5): Promise<number> {
  // If cleanup is already running, await the existing promise
  if (cleanupOldPromise) {
    logger.debug('Old session cleanup already in progress, awaiting completion');
    return cleanupOldPromise;
  }
  
  // Create new cleanup promise and store it
  cleanupOldPromise = (async () => {
    try {
      const { inArray } = await import('drizzle-orm');
      
      const allSessions = await db.query.sessions.findMany({
        orderBy: (sessions, { desc }) => [desc(sessions.lastActivityAt)]
      });
      
      const sessionsToDelete: string[] = [];
      const userSessions = new Map<string, number>();
      
      for (const session of allSessions) {
        const count = userSessions.get(session.userId) || 0;
        if (count >= keepPerUser) {
          sessionsToDelete.push(session.id);
        } else {
          userSessions.set(session.userId, count + 1);
        }
      }
      
      if (sessionsToDelete.length > 0) {
        await db.delete(sessions).where(
          inArray(sessions.id, sessionsToDelete)
        );
        logger.info('Cleaned up old sessions', { count: sessionsToDelete.length });
      }
      
      return sessionsToDelete.length;
    } catch (error) {
      logger.error('Failed to cleanup old sessions', error instanceof Error ? error : undefined);
      return 0;
    } finally {
      // Always release the lock
      cleanupOldPromise = null;
    }
  })();
  
  return cleanupOldPromise;
}

/**
 * Terminate all sessions for a user (logout all devices)
 */
export async function terminateAllUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
  try {
    const { ne, and } = await import('drizzle-orm');
    
    const conditions = exceptSessionId
      ? and(eq(sessions.userId, userId), ne(sessions.id, exceptSessionId))
      : eq(sessions.userId, userId);
    
    const result = await db
      .delete(sessions)
      .where(conditions)
      .returning({ id: sessions.id });
    
    logger.info('Terminated user sessions', { userId, count: result.length, exceptSessionId });
    return result.length;
  } catch (error) {
    logger.error('Failed to terminate user sessions', error instanceof Error ? error : undefined);
    return 0;
  }
}

/**
 * Initialize session cleanup tasks
 */
export function initializeSessionCleanup() {
  // Clean up expired sessions at startup
  cleanupExpiredSessions().then(count => {
    if (count > 0) {
      logger.info('Startup session cleanup complete', { expiredCount: count });
    }
  });
  
  // Schedule periodic cleanup every hour
  setInterval(async () => {
    await cleanupExpiredSessions();
  }, 60 * 60 * 1000); // 1 hour
  
  // Schedule old session cleanup every 6 hours
  setInterval(async () => {
    await cleanupOldSessions(5);
  }, 6 * 60 * 60 * 1000); // 6 hours
}
