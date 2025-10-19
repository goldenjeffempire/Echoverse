/**
 * Simple In-Memory Cache with TTL
 * Used for caching static data like products, posts, etc.
 */
export class InMemoryCache {
    constructor(defaultTTL = 300000) {
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
        // Cleanup expired entries every minute
        setInterval(() => this.cleanup(), 60000);
    }
    set(key, data, ttl) {
        const expiresAt = Date.now() + (ttl || this.defaultTTL);
        this.cache.set(key, { data, expiresAt });
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    delete(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
        // Cache cleanup completed - expired entries removed
    }
    getStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
                key,
                expiresIn: Math.max(0, entry.expiresAt - Date.now())
            }))
        };
    }
}
// Global cache instance
export const cache = new InMemoryCache(300000); // 5 minutes TTL
// Cache key generators
export const cacheKeys = {
    products: (filters) => `products:${JSON.stringify(filters)}`,
    product: (id) => `product:${id}`,
    posts: (filters) => `posts:${JSON.stringify(filters)}`,
    post: (id) => `post:${id}`,
    communities: (filters) => `communities:${JSON.stringify(filters)}`,
    plugins: (filters) => `plugins:${JSON.stringify(filters)}`
};
