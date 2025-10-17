import { db } from '../db';
import { products, inventoryReservations } from '../../shared/schema';
import { eq, sql, and, lte } from 'drizzle-orm';
import { logger } from '../logger';

class InventoryManager {

  async checkAvailability(productId: string, quantity: number): Promise<boolean> {
    try {
      const [product] = await db
        .select({ inventory: products.inventory })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!product) return false;
      return (product.inventory || 0) >= quantity;
    } catch (error) {
      logger.error('Failed to check inventory availability', error as Error);
      return false;
    }
  }

  async reserveInventory(productId: string, quantity: number, orderId: string): Promise<boolean> {
    try {
      // Use pessimistic locking (FOR UPDATE) to prevent race conditions
      await db.execute(sql`BEGIN`);

      const result = await db.execute(
        sql`SELECT inventory FROM products WHERE id = ${productId} FOR UPDATE`
      );

      const product = result.rows?.[0] as { inventory?: number } | undefined;
      const currentInventory = product?.inventory ?? 0;

      if (currentInventory < quantity) {
        await db.execute(sql`ROLLBACK`);
        logger.warn('Insufficient inventory for reservation', { productId, quantity, available: currentInventory });
        return false;
      }

      // Deduct inventory
      await db
        .update(products)
        .set({
          inventory: sql`inventory - ${quantity}`
        })
        .where(eq(products.id, productId));

      await db.execute(sql`COMMIT`);

      // Create persistent reservation record in database (expires in 15 minutes)
      await db.insert(inventoryReservations).values({
        productId,
        orderId,
        quantity,
        status: 'active',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      });

      logger.info('Inventory reserved in database', { productId, quantity, orderId });
      return true;

    } catch (error) {
      await db.execute(sql`ROLLBACK`);
      logger.error('Failed to reserve inventory', error as Error);
      return false;
    }
  }

  async confirmReservation(orderId: string): Promise<void> {
    try {
      // Update reservation status to confirmed in database
      await db
        .update(inventoryReservations)
        .set({ status: 'confirmed', updatedAt: new Date() })
        .where(eq(inventoryReservations.orderId, orderId));
      
      logger.info('Inventory reservation confirmed in database', { orderId });
    } catch (error) {
      logger.error('Failed to confirm reservation', error as Error);
    }
  }

  async releaseReservation(orderId: string): Promise<void> {
    try {
      // Get reservation from database
      const [reservation] = await db
        .select()
        .from(inventoryReservations)
        .where(and(
          eq(inventoryReservations.orderId, orderId),
          eq(inventoryReservations.status, 'active')
        ))
        .limit(1);

      if (!reservation) return;

      // Return inventory
      await db
        .update(products)
        .set({
          inventory: sql`inventory + ${reservation.quantity}`
        })
        .where(eq(products.id, reservation.productId));

      // Mark reservation as released
      await db
        .update(inventoryReservations)
        .set({ status: 'released', updatedAt: new Date() })
        .where(eq(inventoryReservations.id, reservation.id));

      logger.info('Inventory reservation released from database', { orderId });
    } catch (error) {
      logger.error('Failed to release inventory reservation', error as Error);
    }
  }

  async cleanupExpiredReservations(): Promise<void> {
    try {
      const now = new Date();
      
      // Find all expired active reservations from database
      const expiredReservations = await db
        .select()
        .from(inventoryReservations)
        .where(and(
          eq(inventoryReservations.status, 'active'),
          lte(inventoryReservations.expiresAt, now)
        ));

      // Release each expired reservation
      for (const reservation of expiredReservations) {
        await this.releaseReservation(reservation.orderId);
      }

      if (expiredReservations.length > 0) {
        logger.info('Cleaned up expired inventory reservations from database', { count: expiredReservations.length });
      }
    } catch (error) {
      logger.error('Failed to cleanup expired reservations', error as Error);
    }
  }

  startCleanupSchedule(): void {
    // Clean up every 5 minutes
    setInterval(() => {
      this.cleanupExpiredReservations();
    }, 5 * 60 * 1000);
  }
}

export const inventoryManager = new InventoryManager();

// Start cleanup schedule
inventoryManager.startCleanupSchedule();
