import { logger } from '../logger';
const DEFAULT_CONFIG = {
    maxRetries: 5,
    initialDelayMs: 100,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
};
/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Execute a database operation with exponential backoff retry
 */
export async function withRetry(operation, config = {}, operationName = 'Database operation') {
    const { maxRetries, initialDelayMs, maxDelayMs, backoffMultiplier } = {
        ...DEFAULT_CONFIG,
        ...config,
    };
    let lastError;
    let delay = initialDelayMs;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // Check if error is retryable
            const isRetryable = isRetryableError(lastError);
            if (!isRetryable || attempt === maxRetries) {
                logger.error(`${operationName} failed after ${attempt} attempts`, lastError, {
                    attempt,
                    maxRetries,
                    retryable: isRetryable,
                });
                throw lastError;
            }
            // Calculate delay with exponential backoff
            const jitter = Math.random() * 0.3 * delay; // Add 0-30% jitter
            const waitTime = Math.min(delay + jitter, maxDelayMs);
            logger.warn(`${operationName} failed, retrying in ${Math.round(waitTime)}ms`, {
                attempt,
                maxRetries,
                error: lastError.message,
                nextDelay: Math.round(waitTime),
            });
            await sleep(waitTime);
            delay *= backoffMultiplier;
        }
    }
    throw lastError || new Error(`${operationName} failed after retries`);
}
/**
 * Determine if an error is retryable
 */
function isRetryableError(error) {
    const message = error.message.toLowerCase();
    // Network errors
    if (message.includes('econnrefused') ||
        message.includes('econnreset') ||
        message.includes('etimedout') ||
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('socket')) {
        return true;
    }
    // PostgreSQL specific errors
    if (message.includes('too many connections') ||
        message.includes('connection pool exhausted') ||
        message.includes('deadlock detected') ||
        message.includes('could not serialize access') ||
        message.includes('connection lost')) {
        return true;
    }
    // Neon specific errors
    if (message.includes('compute not available') ||
        message.includes('database is starting') ||
        message.includes('connection refused')) {
        return true;
    }
    return false;
}
/**
 * Wrapper for database queries with automatic retry
 */
export async function queryWithRetry(queryFn, operationName) {
    return withRetry(queryFn, {
        maxRetries: 3,
        initialDelayMs: 200,
        maxDelayMs: 5000,
    }, operationName);
}
