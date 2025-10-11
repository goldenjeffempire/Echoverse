import { db } from '../db';
import { passwordHistory } from '@shared/schema';
import { sql, lte } from 'drizzle-orm';
import { logger } from '../logger';
import { config } from '../config';

/**
 * Clean up old password history entries
 * Keeps only the most recent N passwords per user (default 12 per industry standard)
 * 
 * Industry best practices recommend keeping 12-24 password history entries
 * to prevent password cycling and enforce meaningful password changes
 */
export async function cleanupPasswordHistory(keepPerUser: number = 12): Promise<number> {
  try {
    // Delete old password history entries, keeping only the most recent N per user
    const result = await db.execute(sql`
      DELETE FROM ${passwordHistory}
      WHERE ${passwordHistory.id} IN (
        SELECT ${passwordHistory.id}
        FROM (
          SELECT 
            ${passwordHistory.id},
            ROW_NUMBER() OVER (
              PARTITION BY ${passwordHistory.userId} 
              ORDER BY ${passwordHistory.createdAt} DESC
            ) as row_num
          FROM ${passwordHistory}
        ) ranked
        WHERE row_num > ${keepPerUser}
      )
    `);
    
    const count = result.rowCount || 0;
    if (count > 0) {
      logger.info('Cleaned up password history', { count, keepPerUser });
    }
    return count;
  } catch (error) {
    logger.error('Failed to cleanup password history', error instanceof Error ? error : undefined);
    return 0;
  }
}

/**
 * Clean up expired password reset tokens
 */
export async function cleanupExpiredResetTokens(): Promise<number> {
  try {
    const { passwordResetTokens } = await import('@shared/schema');
    
    const result = await db
      .delete(passwordResetTokens)
      .where(lte(passwordResetTokens.expiresAt, new Date()))
      .returning({ id: passwordResetTokens.id });
    
    const count = result.length;
    if (count > 0) {
      logger.info('Cleaned up expired reset tokens', { count });
    }
    return count;
  } catch (error) {
    logger.error('Failed to cleanup expired reset tokens', error instanceof Error ? error : undefined);
    return 0;
  }
}

/**
 * Clean up old login attempts (keep last 30 days)
 */
export async function cleanupOldLoginAttempts(daysToKeep: number = 30): Promise<number> {
  try {
    const { loginAttempts } = await import('@shared/schema');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await db
      .delete(loginAttempts)
      .where(lte(loginAttempts.attemptedAt, cutoffDate))
      .returning({ id: loginAttempts.id });
    
    const count = result.length;
    if (count > 0) {
      logger.info('Cleaned up old login attempts', { count, daysToKeep });
    }
    return count;
  } catch (error) {
    logger.error('Failed to cleanup old login attempts', error instanceof Error ? error : undefined);
    return 0;
  }
}

/**
 * Initialize database cleanup jobs
 */
export function initializeDatabaseCleanup() {
  // Clean up password history at startup (keep 12 per industry standard)
  cleanupPasswordHistory(12).then(count => {
    if (count > 0) {
      logger.info('Startup password history cleanup complete', { count, kept: 12 });
    }
  });
  
  // Clean up expired reset tokens at startup
  cleanupExpiredResetTokens().then(count => {
    if (count > 0) {
      logger.info('Startup reset token cleanup complete', { count });
    }
  });
  
  // Schedule password history cleanup every 24 hours (keep 12)
  setInterval(async () => {
    await cleanupPasswordHistory(12);
  }, 24 * 60 * 60 * 1000);
  
  // Schedule reset token cleanup every hour
  setInterval(async () => {
    await cleanupExpiredResetTokens();
  }, 60 * 60 * 1000);
  
  // Schedule login attempts cleanup every 7 days
  setInterval(async () => {
    await cleanupOldLoginAttempts();
  }, 7 * 24 * 60 * 60 * 1000);
  
  // Schedule webhook events cleanup every 24 hours (uses WEBHOOK_RETENTION_DAYS from config)
  import('./webhook').then(({ cleanupOldWebhookEvents }) => {
    // Run initial cleanup at startup (uses configured retention days)
    cleanupOldWebhookEvents().catch(err => {
      logger.error('Initial webhook cleanup failed', err instanceof Error ? err : undefined);
    });
    
    // Schedule periodic cleanup (uses configured retention days)
    setInterval(async () => {
      await cleanupOldWebhookEvents();
    }, 24 * 60 * 60 * 1000);
  });
  
  logger.info('Database cleanup jobs initialized');
}
