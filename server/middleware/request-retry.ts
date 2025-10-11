import { logger } from '../logger';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'],
};

export async function retryRequest<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      const isRetryable = opts.retryableErrors.some(code => 
        lastError?.message.includes(code) || (lastError as any).code === code
      );

      if (attempt >= opts.maxAttempts || !isRetryable) {
        throw lastError;
      }

      const delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffFactor, attempt - 1),
        opts.maxDelay
      );

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

export function createRetryMiddleware(options: RetryOptions = {}) {
  return async (req: any, res: any, next: any) => {
    const originalSend = res.send;
    res.send = function(data: any) {
      res.send = originalSend;
      return res.send(data);
    };
    next();
  };
}
