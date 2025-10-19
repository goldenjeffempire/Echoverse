import { createHmac, timingSafeEqual } from 'crypto';
import { config } from '../config';
export function generateWebhookSignature(payload, secret) {
    const webhookSecret = secret || config.webhookSignatureSecret;
    if (!webhookSecret) {
        throw new Error('Webhook signature secret is not configured');
    }
    const hmac = createHmac('sha256', webhookSecret);
    hmac.update(payload);
    return hmac.digest('hex');
}
export function verifyWebhookSignature(payload, signature, secret) {
    try {
        const webhookSecret = secret || config.webhookSignatureSecret;
        if (!webhookSecret) {
            throw new Error('Webhook signature secret is not configured');
        }
        const expectedSignature = generateWebhookSignature(payload, webhookSecret);
        const signatureBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);
        if (signatureBuffer.length !== expectedBuffer.length) {
            return false;
        }
        return timingSafeEqual(signatureBuffer, expectedBuffer);
    }
    catch (error) {
        return false;
    }
}
export function createWebhookPayload(event, data) {
    return {
        event,
        data,
        timestamp: Date.now(),
        version: '1.0',
    };
}
export function signWebhookPayload(payload, secret) {
    const payloadString = JSON.stringify(payload);
    const signature = generateWebhookSignature(payloadString, secret);
    return {
        payload: payloadString,
        signature,
        headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Timestamp': payload.timestamp.toString(),
            'X-Webhook-Event': payload.event,
        },
    };
}
export async function sendWebhook(url, event, data, options) {
    const timeout = options?.timeout || config.webhookTimeout;
    const maxRetries = options?.retries || config.webhookMaxRetries;
    const retryDelay = config.webhookRetryDelay;
    const payload = createWebhookPayload(event, data);
    const { payload: payloadString, signature, headers } = signWebhookPayload(payload, options?.secret);
    let lastError = '';
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: payloadString,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (response.ok) {
                return { success: true, statusCode: response.status };
            }
            lastError = `HTTP ${response.status}: ${response.statusText}`;
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                return { success: false, statusCode: response.status, error: lastError };
            }
        }
        catch (error) {
            lastError = error.message || 'Unknown error';
            if (error.name === 'AbortError') {
                lastError = 'Request timeout';
            }
        }
        if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
    }
    return { success: false, error: lastError };
}
import { db } from '../db';
import { webhookEvents } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../logger';
export async function checkWebhookReplayProtection(eventId, eventType, payload) {
    try {
        const existingEvent = await db
            .select()
            .from(webhookEvents)
            .where(eq(webhookEvents.id, eventId))
            .limit(1);
        if (existingEvent.length > 0) {
            logger.warn('Duplicate webhook event detected - replay protection triggered', {
                eventId,
                eventType,
                previouslyProcessedAt: existingEvent[0].processedAt,
                wasProcessed: existingEvent[0].processed
            });
            return false;
        }
        await db.insert(webhookEvents).values({
            id: eventId,
            type: eventType,
            processed: false,
            payload,
            createdAt: new Date()
        });
        logger.info('Webhook event registered for processing', {
            eventId,
            eventType
        });
        return true;
    }
    catch (error) {
        logger.error('Webhook replay protection check failed', error instanceof Error ? error : undefined, {
            eventId,
            eventType
        });
        return false;
    }
}
export async function markWebhookProcessed(eventId, error) {
    try {
        await db
            .update(webhookEvents)
            .set({
            processed: !error,
            processedAt: new Date(),
            error: error || null
        })
            .where(eq(webhookEvents.id, eventId));
        if (error) {
            logger.error('Webhook processing failed', new Error(error), { eventId });
        }
        else {
            logger.info('Webhook successfully processed', { eventId });
        }
    }
    catch (err) {
        logger.error('Failed to mark webhook as processed', err instanceof Error ? err : undefined, { eventId });
    }
}
export async function incrementWebhookRetry(eventId) {
    try {
        const event = await db
            .select()
            .from(webhookEvents)
            .where(eq(webhookEvents.id, eventId))
            .limit(1);
        if (event.length > 0) {
            await db
                .update(webhookEvents)
                .set({
                retryCount: (event[0].retryCount || 0) + 1
            })
                .where(eq(webhookEvents.id, eventId));
        }
    }
    catch (error) {
        logger.error('Failed to increment webhook retry count', error instanceof Error ? error : undefined);
    }
}
/**
 * Clean up old webhook events (replay protection TTL cleanup)
 * Removes processed webhook events older than specified days (configurable via WEBHOOK_RETENTION_DAYS)
 * This prevents the webhook_events table from growing indefinitely
 * Only removes PROCESSED events to maintain audit trail for unprocessed ones
 */
export async function cleanupOldWebhookEvents(daysToKeep) {
    const { config } = await import('../config');
    const retentionDays = daysToKeep ?? config.webhookRetentionDays;
    logger.debug('Webhook cleanup initiated', {
        retentionDays,
        source: daysToKeep ? 'parameter' : 'config'
    });
    try {
        const { sql: drizzleSql, lt } = await import('drizzle-orm');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const result = await db
            .delete(webhookEvents)
            .where(drizzleSql `${webhookEvents.createdAt} < ${cutoffDate} AND ${webhookEvents.processed} = true`)
            .returning({ id: webhookEvents.id });
        const count = result.length;
        if (count > 0) {
            logger.info('Old webhook events cleaned up', {
                count,
                cutoffDate: cutoffDate.toISOString(),
                retentionDays
            });
        }
        return count;
    }
    catch (error) {
        logger.error('Webhook event cleanup failed', error instanceof Error ? error : undefined, {
            retentionDays
        });
        return 0;
    }
}
