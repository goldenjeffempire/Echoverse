import { logger } from '../logger';
class StripeWebhookHandler {
    constructor() {
        this.retryQueue = new Map();
        this.MAX_RETRIES = 5;
        this.INITIAL_BACKOFF_MS = 1000;
        this.MAX_BACKOFF_MS = 300000; // 5 minutes
        this.POISON_MESSAGE_THRESHOLD = 10;
    }
    async handleEvent(event) {
        const eventId = event.id;
        try {
            // Handle different event types
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handlePaymentSuccess(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await this.handlePaymentFailure(event.data.object);
                    break;
                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionChange(event.data.object);
                    break;
                case 'invoice.payment_succeeded':
                    await this.handleInvoicePayment(event.data.object);
                    break;
                case 'charge.refunded':
                    await this.handleRefund(event.data.object);
                    break;
                default:
                    logger.info('Unhandled webhook event type', { type: event.type, eventId });
            }
            // Remove from retry queue on success
            this.retryQueue.delete(eventId);
        }
        catch (error) {
            logger.error('Webhook event processing failed', error, { eventId, type: event.type });
            await this.scheduleRetry(eventId, error);
        }
    }
    async scheduleRetry(eventId, error) {
        const retry = this.retryQueue.get(eventId) || {
            eventId,
            attempts: 0,
            nextRetry: new Date()
        };
        retry.attempts++;
        retry.lastError = error.message;
        // Check for poison messages
        if (retry.attempts >= this.POISON_MESSAGE_THRESHOLD) {
            logger.error('Poison message detected - moving to dead letter queue', new Error('Poison message'), {
                eventId,
                attempts: retry.attempts,
                lastError: retry.lastError
            });
            try {
                logger.warn('Dead letter queue storage placeholder', {
                    eventId,
                    attempts: retry.attempts,
                    lastError: retry.lastError
                });
            }
            catch (dlqError) {
                logger.error('Failed to log dead letter event', dlqError, { eventId });
            }
            this.retryQueue.delete(eventId);
            return;
        }
        // Calculate exponential backoff with jitter and cap
        const backoffMs = Math.min(this.INITIAL_BACKOFF_MS * Math.pow(2, retry.attempts - 1), this.MAX_BACKOFF_MS);
        const jitter = Math.random() * backoffMs * 0.1; // 10% jitter
        const nextRetryMs = backoffMs + jitter;
        retry.nextRetry = new Date(Date.now() + nextRetryMs);
        this.retryQueue.set(eventId, retry);
        logger.info('Webhook retry scheduled', {
            eventId,
            attempt: retry.attempts,
            nextRetry: retry.nextRetry.toISOString(),
            backoffMs: nextRetryMs
        });
    }
    async processRetries() {
        const now = new Date();
        for (const [eventId, retry] of this.retryQueue.entries()) {
            if (retry.nextRetry <= now) {
                if (retry.attempts >= this.MAX_RETRIES) {
                    logger.error('Max retries exceeded for webhook event', new Error('Max retries'), { eventId });
                    this.retryQueue.delete(eventId);
                    continue;
                }
                try {
                    const stripe = (await import('stripe')).default;
                    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' });
                    const event = await stripeClient.events.retrieve(eventId);
                    logger.info('Retrying webhook event', { eventId, attempt: retry.attempts });
                    await this.handleEvent(event);
                }
                catch (error) {
                    logger.error('Retry failed for webhook event', error, { eventId, attempt: retry.attempts });
                }
            }
        }
    }
    async handlePaymentSuccess(paymentIntent) {
        const idempotencyKey = paymentIntent.id;
        const { storage } = await import('../storage');
        try {
            const orderId = paymentIntent.metadata?.orderId;
            if (!orderId) {
                logger.warn('Payment succeeded but no orderId in metadata', { paymentIntentId: paymentIntent.id });
                return;
            }
            const order = await storage.getOrder(orderId);
            if (!order) {
                logger.error('Order not found for payment', { orderId, paymentIntentId: paymentIntent.id });
                return;
            }
            if (order.paymentStatus === 'paid') {
                logger.info('Payment already processed (idempotency)', { orderId, paymentIntentId: paymentIntent.id });
                return;
            }
            await storage.updateOrder(orderId, {
                paymentStatus: 'paid',
                stripePaymentIntentId: paymentIntent.id,
                updatedAt: new Date()
            });
            const emailService = (await import('./email')).emailService;
            await emailService.sendEmail({
                to: order.customerEmail || '',
                subject: 'Order Confirmation - Payment Successful',
                html: `
          <h1>Thank you for your order!</h1>
          <p>Your payment has been successfully processed.</p>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Amount:</strong> ${paymentIntent.currency.toUpperCase()} ${(paymentIntent.amount / 100).toFixed(2)}</p>
          <p>We'll notify you when your order ships.</p>
        `
            });
            logger.info('Payment succeeded and order updated', {
                orderId,
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency
            });
        }
        catch (error) {
            logger.error('Failed to process payment success', error, { paymentIntentId: paymentIntent.id });
            throw error;
        }
    }
    async handlePaymentFailure(paymentIntent) {
        const { storage } = await import('../storage');
        const orderId = paymentIntent.metadata?.orderId;
        try {
            if (orderId) {
                await storage.updateOrder(orderId, {
                    paymentStatus: 'failed',
                    metadata: {
                        ...((await storage.getOrder(orderId))?.metadata || {}),
                        paymentError: paymentIntent.last_payment_error?.message
                    },
                    updatedAt: new Date()
                });
                const order = await storage.getOrder(orderId);
                if (order?.customerEmail) {
                    const emailService = (await import('./email')).emailService;
                    await emailService.sendEmail({
                        to: order.customerEmail,
                        subject: 'Payment Failed - Action Required',
                        html: `
              <h1>Payment Failed</h1>
              <p>Unfortunately, your payment could not be processed.</p>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Error:</strong> ${paymentIntent.last_payment_error?.message || 'Unknown error'}</p>
              <p>Please try again or contact support if the issue persists.</p>
            `
                    });
                }
            }
            logger.warn('Payment failed and notifications sent', {
                orderId,
                paymentIntentId: paymentIntent.id,
                error: paymentIntent.last_payment_error?.message
            });
        }
        catch (error) {
            logger.error('Failed to handle payment failure', error, { paymentIntentId: paymentIntent.id });
            throw error;
        }
    }
    async handleSubscriptionChange(subscription) {
        const { storage } = await import('../storage');
        try {
            const userId = subscription.metadata?.userId;
            if (!userId) {
                logger.warn('Subscription change but no userId in metadata', { subscriptionId: subscription.id });
                return;
            }
            const tierMap = {
                'prod_starter': 'free',
                'prod_pro': 'pro',
                'prod_enterprise': 'enterprise'
            };
            const priceId = subscription.items.data[0]?.price.id;
            const tier = tierMap[priceId] || 'free';
            await storage.updateUser(userId, {
                subscriptionTier: tier,
                stripeSubscriptionId: subscription.id,
                subscriptionStatus: subscription.status,
                updatedAt: new Date()
            });
            logger.info('Subscription updated in database', {
                userId,
                subscriptionId: subscription.id,
                status: subscription.status,
                tier,
                customerId: subscription.customer
            });
        }
        catch (error) {
            logger.error('Failed to update subscription', error, { subscriptionId: subscription.id });
            throw error;
        }
    }
    async handleInvoicePayment(invoice) {
        const { storage } = await import('../storage');
        try {
            const userId = invoice.metadata?.userId;
            if (userId) {
                const user = await storage.getUser(userId);
                if (user?.email) {
                    const emailService = (await import('./email')).emailService;
                    await emailService.sendEmail({
                        to: user.email,
                        subject: 'Payment Receipt',
                        html: `
              <h1>Payment Receipt</h1>
              <p>Thank you for your payment!</p>
              <p><strong>Invoice ID:</strong> ${invoice.id}</p>
              <p><strong>Amount Paid:</strong> ${invoice.currency?.toUpperCase()} ${((invoice.amount_paid || 0) / 100).toFixed(2)}</p>
              <p><strong>Date:</strong> ${new Date(invoice.created * 1000).toLocaleDateString()}</p>
              ${invoice.hosted_invoice_url ? `<p><a href="${invoice.hosted_invoice_url}">View Invoice</a></p>` : ''}
            `
                    });
                }
            }
            logger.info('Invoice payment recorded and receipt sent', {
                invoiceId: invoice.id,
                amount: invoice.amount_paid,
                userId,
                customerId: invoice.customer
            });
        }
        catch (error) {
            logger.error('Failed to handle invoice payment', error, { invoiceId: invoice.id });
            throw error;
        }
    }
    async handleRefund(charge) {
        const { storage } = await import('../storage');
        try {
            const orderId = charge.metadata?.orderId;
            if (orderId) {
                const order = await storage.getOrder(orderId);
                if (order) {
                    await storage.updateOrder(orderId, {
                        paymentStatus: charge.amount_refunded === charge.amount ? 'refunded' : 'partially_refunded',
                        metadata: {
                            ...(order.metadata || {}),
                            refundedAmount: charge.amount_refunded,
                            refundedAt: new Date().toISOString()
                        },
                        updatedAt: new Date()
                    });
                    if (order.customerEmail) {
                        const emailService = (await import('./email')).emailService;
                        await emailService.sendEmail({
                            to: order.customerEmail,
                            subject: 'Refund Processed',
                            html: `
                <h1>Refund Processed</h1>
                <p>Your refund has been processed successfully.</p>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Refund Amount:</strong> ${charge.currency.toUpperCase()} ${(charge.amount_refunded / 100).toFixed(2)}</p>
                <p>The refund should appear in your account within 5-10 business days.</p>
              `
                        });
                    }
                }
            }
            logger.info('Refund processed and order updated', {
                orderId,
                chargeId: charge.id,
                amount: charge.amount_refunded,
                customerId: charge.customer
            });
        }
        catch (error) {
            logger.error('Failed to handle refund', error, { chargeId: charge.id });
            throw error;
        }
    }
    getRetryQueueSize() {
        return this.retryQueue.size;
    }
    clearRetryQueue() {
        this.retryQueue.clear();
    }
}
export const stripeWebhookHandler = new StripeWebhookHandler();
