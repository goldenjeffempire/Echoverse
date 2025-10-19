/**
 * Idempotency Key Cleanup - PHASE 3.5
 *
 * Automatically purges idempotency keys older than 24 hours to prevent unbounded growth
 * Runs as a cron job to maintain database hygiene
 */
import { db } from '../db';
import { orders, paymentIntents } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { logger } from '../logger';
const IDEMPOTENCY_KEY_TTL_HOURS = 24;
export class IdempotencyCleanup {
    constructor() {
        this.intervalId = null;
    }
    /**
     * Start the idempotency key cleanup cron job
     * Runs every hour by default
     */
    start(intervalMs = 3600000) {
        if (this.intervalId) {
            logger.warn('Idempotency cleanup already running');
            return;
        }
        logger.info('Starting idempotency key cleanup cron job', {
            intervalMs,
            ttlHours: IDEMPOTENCY_KEY_TTL_HOURS,
        });
        this.intervalId = setInterval(() => {
            this.cleanup().catch(error => {
                logger.error('Error in idempotency cleanup', error instanceof Error ? error : new Error(String(error)));
            });
        }, intervalMs);
        // Run immediately on start
        this.cleanup().catch(error => {
            logger.error('Error in initial idempotency cleanup', error instanceof Error ? error : new Error(String(error)));
        });
    }
    /**
     * Stop the cleanup cron job
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger.info('Stopped idempotency cleanup cron job');
        }
    }
    /**
     * Purge idempotency keys older than 24 hours
     * Sets keys to NULL to free storage while preserving records
     */
    async cleanup() {
        try {
            const cutoffTime = new Date(Date.now() - IDEMPOTENCY_KEY_TTL_HOURS * 60 * 60 * 1000);
            // Clean up orders idempotency keys
            const ordersResult = await db
                .update(orders)
                .set({ idempotencyKey: sql `NULL` })
                .where(sql `${orders.idempotencyKey} IS NOT NULL AND ${orders.createdAt} < ${cutoffTime}`);
            // Clean up payment intents idempotency keys  
            const paymentIntentsResult = await db
                .update(paymentIntents)
                .set({ idempotencyKey: sql `NULL` })
                .where(sql `${paymentIntents.idempotencyKey} IS NOT NULL AND ${paymentIntents.createdAt} < ${cutoffTime}`);
            const totalCleaned = (ordersResult.rowCount || 0) + (paymentIntentsResult.rowCount || 0);
            if (totalCleaned > 0) {
                logger.info('Idempotency keys purged successfully', {
                    ordersCount: ordersResult.rowCount || 0,
                    paymentIntentsCount: paymentIntentsResult.rowCount || 0,
                    totalCount: totalCleaned,
                    cutoffTime,
                    ttlHours: IDEMPOTENCY_KEY_TTL_HOURS,
                });
            }
            else {
                logger.debug('No idempotency keys to purge');
            }
        }
        catch (error) {
            logger.error('Failed to purge idempotency keys', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }
    /**
     * Get cleanup statistics
     */
    async getStats() {
        try {
            const ordersCount = await db
                .select({ count: sql `COUNT(*)` })
                .from(orders)
                .where(sql `${orders.idempotencyKey} IS NOT NULL`);
            const paymentIntentsCount = await db
                .select({ count: sql `COUNT(*)` })
                .from(paymentIntents)
                .where(sql `${paymentIntents.idempotencyKey} IS NOT NULL`);
            return {
                ordersActive: Number(ordersCount[0]?.count || 0),
                paymentIntentsActive: Number(paymentIntentsCount[0]?.count || 0),
                totalActive: Number(ordersCount[0]?.count || 0) + Number(paymentIntentsCount[0]?.count || 0),
            };
        }
        catch (error) {
            logger.error('Failed to get idempotency cleanup stats', error instanceof Error ? error : new Error(String(error)));
            return {
                totalActive: 0,
                ordersActive: 0,
                paymentIntentsActive: 0,
            };
        }
    }
}
// Export singleton instance
export const idempotencyCleanup = new IdempotencyCleanup();
