/**
 * LOW-015: Request retry logic for failed API calls
 */
const DEFAULT_OPTIONS = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
    onRetry: () => { },
};
/**
 * Retry a fetch request with exponential backoff
 */
export async function fetchWithRetry(url, options = {}, retryOptions = {}) {
    const config = { ...DEFAULT_OPTIONS, ...retryOptions };
    let lastError = null;
    let delay = config.initialDelay;
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            // If response is ok or not retryable, return it
            if (response.ok || !config.retryableStatuses.includes(response.status)) {
                return response;
            }
            // Clone response for error handling
            const errorBody = await response.clone().text();
            lastError = new Error(`HTTP ${response.status}: ${errorBody}`);
            // Don't retry on last attempt
            if (attempt === config.maxRetries) {
                throw lastError;
            }
            // Call retry callback
            config.onRetry(attempt + 1, lastError);
            // Wait before retrying
            await sleep(Math.min(delay, config.maxDelay));
            delay *= config.backoffMultiplier;
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // Network errors are always retryable
            if (attempt === config.maxRetries) {
                throw lastError;
            }
            config.onRetry(attempt + 1, lastError);
            await sleep(Math.min(delay, config.maxDelay));
            delay *= config.backoffMultiplier;
        }
    }
    throw lastError || new Error('Request failed after retries');
}
/**
 * Retry any async function
 */
export async function retryAsync(fn, options = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };
    let lastError = null;
    let delay = config.initialDelay;
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt === config.maxRetries) {
                throw lastError;
            }
            config.onRetry(attempt + 1, lastError);
            await sleep(Math.min(delay, config.maxDelay));
            delay *= config.backoffMultiplier;
        }
    }
    throw lastError || new Error('Operation failed after retries');
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Usage example:
// const response = await fetchWithRetry('/api/data', {
//   method: 'GET',
//   headers: { 'Authorization': 'Bearer token' }
// }, {
//   maxRetries: 3,
//   onRetry: (attempt, error) => console.log(`Retry ${attempt}:`, error.message)
// });
