/**
 * ISSUE #33 FIX: Request Deduplication
 *
 * Prevents duplicate API requests for the same resource
 * Uses in-flight request tracking to deduplicate concurrent requests
 */
class RequestDeduplicator {
    constructor() {
        this.pendingRequests = new Map();
        this.REQUEST_TIMEOUT_MS = 30000; // 30 seconds
    }
    /**
     * Get unique key for a request
     */
    getRequestKey(url, method, body) {
        const bodyHash = body ? JSON.stringify(body) : '';
        return `${method}:${url}:${bodyHash}`;
    }
    /**
     * Check if request is already in flight
     */
    isRequestPending(key) {
        const pending = this.pendingRequests.get(key);
        if (!pending)
            return false;
        // Clean up stale requests
        if (Date.now() - pending.timestamp > this.REQUEST_TIMEOUT_MS) {
            this.pendingRequests.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Deduplicate a request
     * If the same request is already in flight, return the existing promise
     * Otherwise, execute the request and cache the promise
     */
    async deduplicate(url, method, requestFn, body) {
        const key = this.getRequestKey(url, method, body);
        // If request is already pending, return existing promise
        if (this.isRequestPending(key)) {
            const pending = this.pendingRequests.get(key);
            return pending.promise;
        }
        // Execute new request
        const promise = requestFn()
            .then((result) => {
            this.pendingRequests.delete(key);
            return result;
        })
            .catch((error) => {
            this.pendingRequests.delete(key);
            throw error;
        });
        // Cache the pending request
        this.pendingRequests.set(key, {
            promise,
            timestamp: Date.now(),
        });
        return promise;
    }
    /**
     * Clear all pending requests
     */
    clear() {
        this.pendingRequests.clear();
    }
    /**
     * Clear specific request
     */
    clearRequest(url, method, body) {
        const key = this.getRequestKey(url, method, body);
        this.pendingRequests.delete(key);
    }
    /**
     * Get count of pending requests
     */
    getPendingCount() {
        return this.pendingRequests.size;
    }
}
export const requestDeduplicator = new RequestDeduplicator();
/**
 * Hook for request deduplication in React components
 */
export function useRequestDeduplication() {
    return {
        deduplicate: requestDeduplicator.deduplicate.bind(requestDeduplicator),
        clear: requestDeduplicator.clear.bind(requestDeduplicator),
        clearRequest: requestDeduplicator.clearRequest.bind(requestDeduplicator),
        pendingCount: requestDeduplicator.getPendingCount(),
    };
}
