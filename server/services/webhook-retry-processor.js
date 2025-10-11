/**
 * Webhook Retry Processor - HIGH PRIORITY #20
 *
 * Implements webhook retry logic with exponential backoff for reliable webhook delivery
 * Processes failed webhooks automatically in the background
 */
import { storage } from '../storage';
import { logger } from '../logger';
const DEFAULT_CONFIG = {
    maxAttempts: 3, // PHASE 3.3: Reduced from 5 to 3 retries before DLQ
    initialBackoffSeconds: 60, // 1 minute
    maxBackoffSeconds: 3600, // 1 hour
    backoffMultiplier: 2, // Exponential backoff (60s, 120s, 240s)
};
export class WebhookRetryProcessor {
    constructor(config = {}) {
        this.processing = false;
        this.intervalId = null;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Start the webhook retry processor
     * Runs periodically to process pending retries
     */
    start(intervalMs = 30000) {
        if (this.intervalId) {
            logger.warn('Webhook retry processor already running');
            return;
        }
        logger.info('Starting webhook retry processor', {
            intervalMs,
            maxAttempts: this.config.maxAttempts,
        });
        this.intervalId = setInterval(() => {
            this.processRetries().catch(error => {
                logger.error('Error processing webhook retries', error instanceof Error ? error : new Error(String(error)));
            });
        }, intervalMs);
        // Process immediately on start
        this.processRetries().catch(error => {
            logger.error('Error in initial webhook retry process', error instanceof Error ? error : new Error(String(error)));
        });
    }
    /**
     * Stop the webhook retry processor
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger.info('Stopped webhook retry processor');
        }
    }
    /**
     * Process all pending webhook retries
     */
    async processRetries() {
        if (this.processing) {
            logger.debug('Webhook retry processing already in progress, skipping');
            return;
        }
        this.processing = true;
        try {
            const retries = await storage.getWebhookRetriesToProcess(50);
            if (retries.length === 0) {
                logger.debug('No webhook retries to process');
                return;
            }
            logger.info('Processing webhook retries', { count: retries.length });
            await Promise.allSettled(retries.map(retry => this.processRetry(retry)));
        }
        catch (error) {
            logger.error('Failed to fetch webhook retries', error instanceof Error ? error : new Error(String(error)));
        }
        finally {
            this.processing = false;
        }
    }
    /**
     * Detect and handle poison messages that repeatedly fail
     * PHASE 2 - ISSUE #13: Poison message handling
     */
    async handlePoisonMessage(retry) {
        logger.warn('Poison message detected - moving to dead letter queue', {
            webhookId: retry.id,
            attempts: retry.attempts,
            lastError: retry.lastError,
        });
        // Mark retry as permanently failed (DLQ concept)
        logger.error('Webhook permanently failed after max retries', undefined, {
            reason: 'max_retries_exceeded',
            attempts: retry.attempts,
            lastError: retry.lastError,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Process a single webhook retry
     */
    async processRetry(retry) {
        try {
            // Mark as in progress
            await storage.updateWebhookRetry(retry.id, {
                status: 'in_progress',
                lastAttemptAt: new Date(),
            });
            // Attempt webhook delivery
            const result = await this.deliverWebhook(retry.webhookEventId);
            if (result.success) {
                // Success! Mark as succeeded and clean up
                await storage.updateWebhookRetry(retry.id, {
                    status: 'succeeded',
                });
                logger.info('Webhook retry succeeded', {
                    retryId: retry.id,
                    webhookEventId: retry.webhookEventId,
                    attempt: retry.attempt,
                });
            }
            else {
                // Failed - determine next action
                await this.handleFailedRetry(retry, result.error || 'Unknown error', result.statusCode);
            }
        }
        catch (error) {
            logger.error('Error processing webhook retry', error instanceof Error ? error : new Error(String(error)), {
                retryId: retry.id,
            });
            // Handle unexpected errors
            await this.handleFailedRetry(retry, error instanceof Error ? error.message : String(error), undefined);
        }
    }
    /**
     * Handle a failed webhook retry attempt
     */
    async handleFailedRetry(retry, errorMessage, statusCode) {
        const nextAttempt = retry.attempt + 1;
        if (nextAttempt > retry.maxAttempts) {
            // PHASE 3.3: Max attempts reached - move to Dead Letter Queue (DLQ)
            await this.handlePoisonMessage(retry);
            await storage.updateWebhookRetry(retry.id, {
                status: 'dead_letter_queue', // DLQ status instead of abandoned
                lastError: errorMessage,
                lastStatusCode: statusCode,
            });
            logger.warn('Webhook moved to Dead Letter Queue after max attempts', {
                retryId: retry.id,
                webhookEventId: retry.webhookEventId,
                attempts: retry.attempt,
                maxAttempts: retry.maxAttempts,
                lastError: errorMessage,
            });
        }
        else {
            // Schedule next retry with exponential backoff
            const backoffSeconds = this.calculateBackoff(nextAttempt);
            const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);
            await storage.updateWebhookRetry(retry.id, {
                attempt: nextAttempt,
                nextRetryAt,
                backoffSeconds,
                lastError: errorMessage,
                lastStatusCode: statusCode,
                status: 'pending',
            });
            logger.info('Webhook retry scheduled', {
                retryId: retry.id,
                webhookEventId: retry.webhookEventId,
                attempt: nextAttempt,
                nextRetryAt,
                backoffSeconds,
            });
        }
    }
    /**
     * Calculate exponential backoff delay
     */
    calculateBackoff(attempt) {
        const backoff = this.config.initialBackoffSeconds * Math.pow(this.config.backoffMultiplier, attempt - 1);
        return Math.min(backoff, this.config.maxBackoffSeconds);
    }
    /**
     * Attempt to deliver a webhook
     * HIGH PRIORITY FIX #6: Implement actual webhook delivery
     */
    async deliverWebhook(webhookEventId) {
        try {
            // Fetch webhook event details from database
            const webhookEvent = await storage.getWebhookEvent(webhookEventId);
            if (!webhookEvent) {
                return {
                    success: false,
                    error: 'Webhook event not found',
                    statusCode: 404,
                };
            }
            const { url, payload, signature } = webhookEvent;
            if (!url) {
                return {
                    success: false,
                    error: 'Webhook URL not configured',
                    statusCode: 400,
                };
            }
            // Make HTTP POST request to webhook URL
            const timeout = parseInt(process.env.WEBHOOK_TIMEOUT || '30000', 10);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Webhook-Signature': signature || '',
                        'User-Agent': 'EchoVerse-Webhook/1.0',
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                // Success: 2xx status codes
                if (response.ok) {
                    logger.info('Webhook delivered successfully', {
                        webhookEventId,
                        url,
                        statusCode: response.status,
                    });
                    return {
                        success: true,
                        statusCode: response.status,
                    };
                }
                // Failure: non-2xx status codes
                const errorText = await response.text().catch(() => 'Unknown error');
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${errorText}`,
                    statusCode: response.status,
                };
            }
            catch (fetchError) {
                clearTimeout(timeoutId);
                // Handle abort (timeout)
                if (fetchError.name === 'AbortError') {
                    return {
                        success: false,
                        error: `Webhook request timed out after ${timeout}ms`,
                        statusCode: 504, // Gateway Timeout
                    };
                }
                // Network or other fetch errors
                return {
                    success: false,
                    error: fetchError.message || 'Network request failed',
                    statusCode: 503, // Service Unavailable
                };
            }
        }
        catch (error) {
            logger.error('Webhook delivery error', error instanceof Error ? error : new Error(String(error)), {
                webhookEventId,
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Schedule a new webhook retry
     */
    async scheduleRetry(webhookEventId, config) {
        const retryConfig = { ...this.config, ...config };
        const nextRetryAt = new Date(Date.now() + retryConfig.initialBackoffSeconds * 1000);
        await storage.createWebhookRetry({
            webhookEventId,
            attempt: 1,
            maxAttempts: retryConfig.maxAttempts,
            nextRetryAt,
            backoffSeconds: retryConfig.initialBackoffSeconds,
        });
        logger.info('Webhook retry scheduled', {
            webhookEventId,
            nextRetryAt,
            maxAttempts: retryConfig.maxAttempts,
        });
    }
    /**
     * Get retry statistics
     */
    async getRetryStats() {
        // This would require additional database queries
        // For now, returning placeholder values
        return {
            pending: 0,
            inProgress: 0,
            succeeded: 0,
            failed: 0,
            abandoned: 0,
        };
    }
}
// Export singleton instance
export const webhookRetryProcessor = new WebhookRetryProcessor();
