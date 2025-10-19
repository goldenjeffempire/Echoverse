/**
 * Client-side caching system
 * Provides request deduplication and cache invalidation
 */
/**
 * Simple in-memory cache
 */
export class Cache {
    constructor(defaultTTL = 5 * 60 * 1000) {
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
    }
    set(key, data, ttl) {
        const expiresAt = Date.now() + (ttl || this.defaultTTL);
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiresAt
        });
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    has(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    invalidate(key) {
        this.cache.delete(key);
    }
    invalidatePattern(pattern) {
        for (const key of this.cache.keys()) {
            if (pattern.test(key)) {
                this.cache.delete(key);
            }
        }
    }
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
}
/**
 * Request deduplication
 * Prevents multiple identical requests from being made simultaneously
 */
export class RequestDeduplicator {
    constructor() {
        this.pending = new Map();
    }
    async deduplicate(key, fn) {
        // If request is already in progress, return existing promise
        if (this.pending.has(key)) {
            return this.pending.get(key);
        }
        // Create new request
        const promise = fn().finally(() => {
            // Clean up after request completes
            this.pending.delete(key);
        });
        this.pending.set(key, promise);
        return promise;
    }
    clear(key) {
        if (key) {
            this.pending.delete(key);
        }
        else {
            this.pending.clear();
        }
    }
}
/**
 * Global instances
 */
export const globalCache = new Cache();
export const requestDeduplicator = new RequestDeduplicator();
/**
 * Cache key builders
 */
export const cacheKeys = {
    user: (id) => `user:${id}`,
    website: (id) => `website:${id}`,
    websites: (userId) => `websites:user:${userId}`,
    product: (id) => `product:${id}`,
    products: (websiteId) => `products:website:${websiteId}`,
    order: (id) => `order:${id}`,
    orders: (userId) => `orders:user:${userId}`,
    post: (id) => `post:${id}`,
    posts: (websiteId) => `posts:website:${websiteId}`,
    analytics: (websiteId, period) => `analytics:${websiteId}:${period}`
};
