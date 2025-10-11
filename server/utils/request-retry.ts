import { logger } from '../logger';

export interface RequestRetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableStatuses?: number[];
}

const DEFAULT_OPTIONS: Required<RequestRetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Retry HTTP requests with exponential backoff
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  options: RequestRetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if this is the last attempt
      if (attempt === config.maxAttempts) {
        logger.error('Request failed after all retry attempts', lastError, {
          attempts: attempt,
        });
        throw lastError;
      }

      // Check if error is retryable
      const isRetryable = isRetryableError(error, config.retryableStatuses);
      if (!isRetryable) {
        logger.warn('Non-retryable error encountered', {
          attempt,
          error: lastError.message,
          status: error?.response?.status,
        });
        throw lastError;
      }

      // Log retry attempt
      logger.warn('Request failed, retrying...', {
        attempt,
        nextRetryIn: delay,
        error: lastError.message,
        status: error?.response?.status,
      });

      // Wait before retrying
      await sleep(delay);
      delay = Math.min(delay * config.backoffFactor, config.maxDelay);
    }
  }

  throw lastError || new Error('Request failed without error');
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableStatuses: number[]): boolean {
  // Network errors are retryable
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
    return true;
  }

  // HTTP status codes
  const status = error?.response?.status;
  if (status && retryableStatuses.includes(status)) {
    return true;
  }

  return false;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with jitter to prevent thundering herd
 */
export async function retryWithJitter<T>(
  requestFn: () => Promise<T>,
  options: RequestRetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === config.maxAttempts) {
        throw lastError;
      }

      const isRetryable = isRetryableError(error, config.retryableStatuses);
      if (!isRetryable) {
        throw lastError;
      }

      // Add jitter (±25% random variation)
      const jitter = delay * (0.75 + Math.random() * 0.5);
      await sleep(jitter);
      delay = Math.min(delay * config.backoffFactor, config.maxDelay);
    }
  }

  throw lastError || new Error('Request failed without error');
}
