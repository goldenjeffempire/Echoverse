import { logger } from '../logger';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  factor: 2, // Exponential backoff factor
};

/**
 * Retry a database operation with exponential backoff
 * @param operation The async operation to retry
 * @param options Retry configuration options
 * @returns The result of the operation
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === config.maxAttempts) {
        logger.error('Database operation failed after all retries', lastError, {
          attempts: attempt,
        });
        throw lastError;
      }

      // Check if error is retryable
      const isRetryable = isRetryableError(lastError);
      if (!isRetryable) {
        logger.warn('Non-retryable database error encountered', {
          attempt,
          error: lastError.message,
        });
        throw lastError;
      }

      logger.warn('Database operation failed, retrying...', {
        attempt,
        nextRetryIn: delay,
        error: lastError.message,
      });

      await sleep(delay);
      delay = Math.min(delay * config.factor, config.maxDelay);
    }
  }

  throw lastError || new Error('Retry failed without error');
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  const retryablePatterns = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'connection timeout',
    'connection refused',
    'connection reset',
    'pool exhausted',
    'too many connections',
    'database is starting',
    'server is shutting down',
  ];

  const errorMessage = error.message.toLowerCase();
  return retryablePatterns.some(pattern => 
    errorMessage.includes(pattern.toLowerCase())
  );
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrap a database pool query with retry logic
 */
export async function queryWithRetry<T = any>(
  queryFn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return retryWithBackoff(queryFn, options);
}
