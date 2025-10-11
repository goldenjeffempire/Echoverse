import { logger } from '../logger';
const DEFAULT_OPTIONS = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'],
};
export async function retryRequest(operation, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError;
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            const isRetryable = opts.retryableErrors.some(code => lastError?.message.includes(code) || lastError.code === code);
            if (attempt >= opts.maxAttempts || !isRetryable) {
                throw lastError;
            }
            const delay = Math.min(opts.baseDelay * Math.pow(opts.backoffFactor, attempt - 1), opts.maxDelay);
            logger.warn('Request failed, retrying', {
                attempt,
                maxAttempts: opts.maxAttempts,
                delay,
                error: lastError.message,
            });
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}
export function createRetryMiddleware(options = {}) {
    return async (req, res, next) => {
        const originalSend = res.send;
        res.send = function (data) {
            res.send = originalSend;
            return res.send(data);
        };
        next();
    };
}
