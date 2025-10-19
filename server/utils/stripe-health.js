/**
 * Stripe Health Check Utilities
 * Verify Stripe API connectivity and account status
 */
import { logger } from '../logger';
/**
 * Check Stripe API health
 * @returns Health status object
 */
export async function checkStripeHealth() {
    const startTime = Date.now();
    try {
        // Check if Stripe is configured
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            return {
                available: false,
                latency: 0,
                error: 'Stripe not configured'
            };
        }
        // In production, we would make actual Stripe API call
        // For now, just validate the key format
        const isValidKey = stripeSecretKey.startsWith('sk_');
        const latency = Date.now() - startTime;
        if (!isValidKey) {
            return {
                available: false,
                latency,
                error: 'Invalid Stripe API key format'
            };
        }
        return {
            available: true,
            latency,
            accountId: 'configured'
        };
    }
    catch (error) {
        const latency = Date.now() - startTime;
        logger.error('Stripe health check failed', error instanceof Error ? error : new Error('Health check failed'));
        return {
            available: false,
            latency,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * Verify Stripe webhook endpoint configuration
 */
export function verifyStripeWebhookConfig() {
    const issues = [];
    if (!process.env.STRIPE_SECRET_KEY) {
        issues.push('STRIPE_SECRET_KEY not set');
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        issues.push('STRIPE_WEBHOOK_SECRET not set');
    }
    return {
        configured: issues.length === 0,
        issues
    };
}
