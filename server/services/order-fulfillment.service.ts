/**
 * Order Fulfillment Automation Service
 * 
 * Handles automated order processing, inventory updates, and notifications
 */

import { db } from '../storage';
import { orders, products, productVariants, users } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../logger';
import { sendEmail } from './email-production.service';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface FulfillmentOptions {
  orderId: string;
  autoNotify?: boolean;
  updateInventory?: boolean;
}

export interface ShippingProvider {
  name: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
}

class OrderFulfillmentService {
  /**
   * Process order fulfillment
   */
  async fulfillOrder(options: FulfillmentOptions): Promise<void> {
    const { orderId, autoNotify = true, updateInventory = true } = options;

    try {
      logger.info('Starting order fulfillment', { orderId });

      // Get order details
      const order = await this.getOrderDetails(orderId);
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      // Update inventory
      if (updateInventory) {
        await this.updateInventory(orderId);
      }

      // Update order status
      await this.updateOrderStatus(orderId, 'processing');

      // Send notifications
      if (autoNotify) {
        await this.sendOrderConfirmation(order);
      }

      logger.info('Order fulfillment completed', { orderId });
    } catch (error) {
      logger.error('Order fulfillment failed', error as Error, { orderId });
      throw error;
    }
  }

  /**
   * Get order details with items
   */
  private async getOrderDetails(orderId: string): Promise<unknown> {
    const orderDetails = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: {
          with: {
            product: true,
            variant: true
          }
        },
        user: true
      }
    });

    return orderDetails;
  }

  /**
   * Update inventory after order
   */
  private async updateInventory(orderId: string): Promise<void> {
    const order = await this.getOrderDetails(orderId);
    if (!order || typeof order !== 'object' || !('items' in order)) {
      throw new Error('Invalid order structure');
    }

    const items = (order as { items: unknown[] }).items;

    for (const item of items) {
      if (typeof item !== 'object' || !item) continue;

      const typedItem = item as {
        productId?: string;
        variantId?: string | null;
        quantity?: number;
        product?: { id: string; stock?: number };
        variant?: { id: string; stock?: number } | null;
      };

      const productId = typedItem.productId;
      const variantId = typedItem.variantId;
      const quantity = typedItem.quantity || 0;

      if (!productId) continue;

      try {
        if (variantId) {
          // Update variant stock
          const variant = await db.query.productVariants.findFirst({
            where: eq(productVariants.id, variantId)
          });

          if (variant) {
            const newStock = Math.max(0, (variant.stock || 0) - quantity);
            await db.update(productVariants)
              .set({ stock: newStock })
              .where(eq(productVariants.id, variantId));

            logger.info('Variant stock updated', { variantId, oldStock: variant.stock, newStock });
          }
        } else {
          // Update product stock
          const product = await db.query.products.findFirst({
            where: eq(products.id, productId)
          });

          if (product) {
            const newStock = Math.max(0, (product.stock || 0) - quantity);
            await db.update(products)
              .set({ stock: newStock })
              .where(eq(products.id, productId));

            logger.info('Product stock updated', { productId, oldStock: product.stock, newStock });
          }
        }
      } catch (error) {
        logger.error('Failed to update inventory', error as Error, { productId, variantId });
      }
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    await db.update(orders)
      .set({ status })
      .where(eq(orders.id, orderId));

    logger.info('Order status updated', { orderId, status });

    // Trigger status-specific actions
    switch (status) {
      case 'processing':
        await this.onProcessing(orderId);
        break;
      case 'shipped':
        await this.onShipped(orderId);
        break;
      case 'delivered':
        await this.onDelivered(orderId);
        break;
      case 'cancelled':
        await this.onCancelled(orderId);
        break;
    }
  }

  /**
   * Handle order processing
   */
  private async onProcessing(orderId: string): Promise<void> {
    const order = await this.getOrderDetails(orderId);
    if (order && typeof order === 'object' && 'user' in order) {
      const user = (order as { user: { email?: string; name?: string } }).user;
      
      await sendEmail({
        to: user.email || '',
        subject: 'Your order is being processed',
        html: `
          <h2>Order Processing</h2>
          <p>Hi ${user.name},</p>
          <p>Your order #${orderId} is now being processed.</p>
          <p>We'll notify you when it ships!</p>
        `
      });
    }
  }

  /**
   * Handle order shipped
   */
  private async onShipped(orderId: string): Promise<void> {
    const order = await this.getOrderDetails(orderId);
    if (order && typeof order === 'object' && 'user' in order) {
      const user = (order as { user: { email?: string; name?: string } }).user;
      
      await sendEmail({
        to: user.email || '',
        subject: 'Your order has shipped!',
        html: `
          <h2>Order Shipped</h2>
          <p>Hi ${user.name},</p>
          <p>Great news! Your order #${orderId} has shipped.</p>
          <p>Track your shipment for delivery updates.</p>
        `
      });
    }
  }

  /**
   * Handle order delivered
   */
  private async onDelivered(orderId: string): Promise<void> {
    const order = await this.getOrderDetails(orderId);
    if (order && typeof order === 'object' && 'user' in order) {
      const user = (order as { user: { email?: string; name?: string } }).user;
      
      await sendEmail({
        to: user.email || '',
        subject: 'Your order has been delivered',
        html: `
          <h2>Order Delivered</h2>
          <p>Hi ${user.name},</p>
          <p>Your order #${orderId} has been delivered!</p>
          <p>We hope you enjoy your purchase. Please leave a review!</p>
        `
      });
    }
  }

  /**
   * Handle order cancelled
   */
  private async onCancelled(orderId: string): Promise<void> {
    const order = await this.getOrderDetails(orderId);
    if (order && typeof order === 'object' && 'user' in order) {
      const user = (order as { user: { email?: string; name?: string } }).user;
      
      // Restore inventory
      await this.restoreInventory(orderId);

      await sendEmail({
        to: user.email || '',
        subject: 'Order cancelled',
        html: `
          <h2>Order Cancelled</h2>
          <p>Hi ${user.name},</p>
          <p>Your order #${orderId} has been cancelled.</p>
          <p>If you didn't request this, please contact support.</p>
        `
      });
    }
  }

  /**
   * Restore inventory when order is cancelled
   */
  private async restoreInventory(orderId: string): Promise<void> {
    const order = await this.getOrderDetails(orderId);
    if (!order || typeof order !== 'object' || !('items' in order)) {
      return;
    }

    const items = (order as { items: unknown[] }).items;

    for (const item of items) {
      if (typeof item !== 'object' || !item) continue;

      const typedItem = item as {
        productId?: string;
        variantId?: string | null;
        quantity?: number;
      };

      const productId = typedItem.productId;
      const variantId = typedItem.variantId;
      const quantity = typedItem.quantity || 0;

      if (!productId) continue;

      try {
        if (variantId) {
          // Restore variant stock
          const variant = await db.query.productVariants.findFirst({
            where: eq(productVariants.id, variantId)
          });

          if (variant) {
            await db.update(productVariants)
              .set({ stock: (variant.stock || 0) + quantity })
              .where(eq(productVariants.id, variantId));
          }
        } else {
          // Restore product stock
          const product = await db.query.products.findFirst({
            where: eq(products.id, productId)
          });

          if (product) {
            await db.update(products)
              .set({ stock: (product.stock || 0) + quantity })
              .where(eq(products.id, productId));
          }
        }
      } catch (error) {
        logger.error('Failed to restore inventory', error as Error, { productId, variantId });
      }
    }

    logger.info('Inventory restored for cancelled order', { orderId });
  }

  /**
   * Send order confirmation email
   */
  private async sendOrderConfirmation(order: unknown): Promise<void> {
    if (!order || typeof order !== 'object') return;

    const typedOrder = order as {
      id: string;
      user: { email?: string; name?: string };
      total?: number;
      items?: unknown[];
    };

    await sendEmail({
      to: typedOrder.user.email || '',
      subject: 'Order Confirmation',
      html: `
        <h2>Thank you for your order!</h2>
        <p>Hi ${typedOrder.user.name},</p>
        <p>Your order #${typedOrder.id} has been confirmed.</p>
        <p>Total: $${(typedOrder.total || 0).toFixed(2)}</p>
        <p>We'll send you updates as we process your order.</p>
      `
    });
  }

  /**
   * Batch fulfill multiple orders
   */
  async batchFulfill(orderIds: string[]): Promise<{ succeeded: string[]; failed: string[] }> {
    const succeeded: string[] = [];
    const failed: string[] = [];

    for (const orderId of orderIds) {
      try {
        await this.fulfillOrder({ orderId });
        succeeded.push(orderId);
      } catch (error) {
        logger.error('Batch fulfillment failed for order', error as Error, { orderId });
        failed.push(orderId);
      }
    }

    logger.info('Batch fulfillment completed', { 
      total: orderIds.length, 
      succeeded: succeeded.length, 
      failed: failed.length 
    });

    return { succeeded, failed };
  }
}

export const orderFulfillmentService = new OrderFulfillmentService();
