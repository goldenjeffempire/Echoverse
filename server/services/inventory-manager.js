import { db } from '../db';
import { products } from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { logger } from '../logger';
class InventoryManager {
    constructor() {
        this.reservations = new Map();
    }
    async checkAvailability(productId, quantity) {
        try {
            const [product] = await db
                .select({ inventory: products.inventory })
                .from(products)
                .where(eq(products.id, productId))
                .limit(1);
            if (!product)
                return false;
            return (product.inventory || 0) >= quantity;
        }
        catch (error) {
            logger.error('Failed to check inventory availability', error);
            return false;
        }
    }
    async reserveInventory(productId, quantity, orderId) {
        try {
            // Use pessimistic locking (FOR UPDATE) to prevent race conditions
            await db.execute(sql `BEGIN`);
            const [product] = await db.execute(sql `SELECT inventory FROM products WHERE id = ${productId} FOR UPDATE`);
            const currentInventory = product?.inventory || 0;
            if (currentInventory < quantity) {
                await db.execute(sql `ROLLBACK`);
                logger.warn('Insufficient inventory for reservation', { productId, quantity, available: currentInventory });
                return false;
            }
            // Deduct inventory
            await db
                .update(products)
                .set({
                inventory: sql `inventory - ${quantity}`
            })
                .where(eq(products.id, productId));
            await db.execute(sql `COMMIT`);
            // Create reservation record (expires in 15 minutes)
            const reservation = {
                productId,
                quantity,
                reservationId: orderId,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000)
            };
            this.reservations.set(orderId, reservation);
            logger.info('Inventory reserved', { productId, quantity, orderId });
            return true;
        }
        catch (error) {
            await db.execute(sql `ROLLBACK`);
            logger.error('Failed to reserve inventory', error);
            return false;
        }
    }
    async confirmReservation(orderId) {
        const reservation = this.reservations.get(orderId);
        if (reservation) {
            this.reservations.delete(orderId);
            logger.info('Inventory reservation confirmed', { orderId });
        }
    }
    async releaseReservation(orderId) {
        const reservation = this.reservations.get(orderId);
        if (!reservation)
            return;
        try {
            // Return inventory
            await db
                .update(products)
                .set({
                inventory: sql `inventory + ${reservation.quantity}`
            })
                .where(eq(products.id, reservation.productId));
            this.reservations.delete(orderId);
            logger.info('Inventory reservation released', { orderId });
        }
        catch (error) {
            logger.error('Failed to release inventory reservation', error);
        }
    }
    async cleanupExpiredReservations() {
        const now = new Date();
        const expired = [];
        for (const [orderId, reservation] of this.reservations.entries()) {
            if (reservation.expiresAt <= now) {
                expired.push(orderId);
            }
        }
        for (const orderId of expired) {
            await this.releaseReservation(orderId);
        }
        if (expired.length > 0) {
            logger.info('Cleaned up expired inventory reservations', { count: expired.length });
        }
    }
    startCleanupSchedule() {
        // Clean up every 5 minutes
        setInterval(() => {
            this.cleanupExpiredReservations();
        }, 5 * 60 * 1000);
    }
}
export const inventoryManager = new InventoryManager();
// Start cleanup schedule
inventoryManager.startCleanupSchedule();
