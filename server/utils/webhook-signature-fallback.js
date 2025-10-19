/**
 * Webhook Signature Fallback Verification
 * Provides alternative signature validation when primary method fails
 */
import crypto from 'crypto';
import { logger } from '../logger';
/**
 * Verify webhook signature using HMAC-SHA256
 * @param payload - Raw webhook payload
 * @param signature - Signature from webhook headers
 * @param secret - Webhook secret key
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(payload, signature, secret) {
    try {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(payload);
        const expectedSignature = hmac.digest('hex');
        // Timing-safe comparison
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    catch (error) {
        logger.error('Webhook signature verification failed', error instanceof Error ? error : new Error('Verification failed'));
        return false;
    }
}
/**
 * Extract signature from webhook header
 * Supports multiple signature formats
 */
export function extractSignature(signatureHeader) {
    if (!signatureHeader) {
        return null;
    }
    // Format: "sha256=abc123" or "t=timestamp,v1=signature"
    if (signatureHeader.includes('=')) {
        const parts = signatureHeader.split(',');
        for (const part of parts) {
            const [key, value] = part.split('=');
            if (key === 'v1' || key === 'sha256') {
                return value;
            }
        }
    }
    return signatureHeader;
}
/**
 * Validate webhook timestamp to prevent replay attacks
 * @param timestamp - Timestamp from webhook header
 * @param toleranceSeconds - Maximum age of webhook (default 5 minutes)
 */
export function validateWebhookTimestamp(timestamp, toleranceSeconds = 300) {
    const now = Math.floor(Date.now() / 1000);
    const age = now - timestamp;
    if (age > toleranceSeconds) {
        logger.warn('Webhook timestamp too old', {
            age,
            tolerance: toleranceSeconds
        });
        return false;
    }
    if (age < -30) {
        logger.warn('Webhook timestamp in future', {
            age
        });
        return false;
    }
    return true;
}
