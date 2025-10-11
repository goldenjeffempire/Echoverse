/**
 * Idempotency Key Retention Policy
 * FIX #15: Define and enforce retention policy for idempotency keys
 * 
 * Note: Idempotency is tracked via idempotencyKey fields in orders and paymentIntents.
 * This module manages cleanup of old idempotency data.
 */

import { db } from '../db';
import { orders, paymentIntents } from '../../shared/schema';
import { lte, sql, and, isNotNull } from 'drizzle-orm';
import { logger } from '../logger';

// Retention policy configuration
const RETENTION_CONFIG = {
  // Keep paid orders for 90 days
  paidOrdersRetentionDays: 90,
  
  // Keep failed/cancelled orders for 30 days
  failedOrdersRetentionDays: 30,
  
  // Keep payment intents for 30 days
  paymentIntentsRetentionDays: 30
};

export interface RetentionStats {
  ordersCleared: number;
  paymentIntentsCleared: number;
  totalCleared: number;
}

/**
 * Clear old idempotency keys by nullifying them after retention period
 */
export async function cleanupIdempotencyKeys(): Promise<RetentionStats> {
  const now = new Date();
  const stats: RetentionStats = {
    ordersCleared: 0,
    paymentIntentsCleared: 0,
    totalCleared: 0
  };

  try {
    // Calculate cutoff dates
    const paidCutoff = new Date(now.getTime() - RETENTION_CONFIG.paidOrdersRetentionDays * 24 * 60 * 60 * 1000);
    const failedCutoff = new Date(now.getTime() - RETENTION_CONFIG.failedOrdersRetentionDays * 24 * 60 * 60 * 1000);
    const paymentIntentCutoff = new Date(now.getTime() - RETENTION_CONFIG.paymentIntentsRetentionDays * 24 * 60 * 60 * 1000);

    // Clear idempotency keys from old paid orders
    const paidResult = await db
      .update(orders)
      .set({ idempotencyKey: null })
      .where(
        and(
          lte(orders.createdAt, paidCutoff),
          sql`${orders.paymentStatus} = 'paid'`,
          isNotNull(orders.idempotencyKey)
        )
      );

    // Clear idempotency keys from old failed/cancelled orders
    const failedResult = await db
      .update(orders)
      .set({ idempotencyKey: null })
      .where(
        and(
          lte(orders.createdAt, failedCutoff),
          sql`${orders.paymentStatus} IN ('failed', 'cancelled')`,
          isNotNull(orders.idempotencyKey)
        )
      );

    // Clear idempotency keys from old payment intents
    const paymentIntentResult = await db
      .update(paymentIntents)
      .set({ idempotencyKey: null })
      .where(
        and(
          lte(paymentIntents.createdAt, paymentIntentCutoff),
          isNotNull(paymentIntents.idempotencyKey)
        )
      );

    stats.ordersCleared = (paidResult.rowCount || 0) + (failedResult.rowCount || 0);
    stats.paymentIntentsCleared = paymentIntentResult.rowCount || 0;
    stats.totalCleared = stats.ordersCleared + stats.paymentIntentsCleared;

    logger.info('Idempotency key cleanup completed', stats);

    return stats;
  } catch (error) {
    logger.error('Idempotency key cleanup failed', error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Get idempotency key statistics
 */
export async function getIdempotencyStats(): Promise<{
  ordersWithKeys: number;
  paymentIntentsWithKeys: number;
  total: number;
  retentionPolicy: typeof RETENTION_CONFIG;
}> {
  try {
    const [ordersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(isNotNull(orders.idempotencyKey));

    const [paymentIntentsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(paymentIntents)
      .where(isNotNull(paymentIntents.idempotencyKey));

    return {
      ordersWithKeys: ordersCount?.count || 0,
      paymentIntentsWithKeys: paymentIntentsCount?.count || 0,
      total: (ordersCount?.count || 0) + (paymentIntentsCount?.count || 0),
      retentionPolicy: RETENTION_CONFIG
    };
  } catch (error) {
    logger.error('Failed to get idempotency stats', error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Start automated cleanup process
 */
export function startIdempotencyCleanup(intervalMs = 3600000): NodeJS.Timeout {
  logger.info('Starting idempotency key cleanup', {
    intervalMs,
    policy: RETENTION_CONFIG
  });

  // Run immediately on start
  cleanupIdempotencyKeys().catch(error => {
    logger.error('Initial idempotency cleanup failed', error);
  });

  // Then run on interval
  return setInterval(async () => {
    try {
      await cleanupIdempotencyKeys();
    } catch (error) {
      logger.error('Scheduled idempotency cleanup failed', error instanceof Error ? error : undefined);
    }
  }, intervalMs);
}
