import { logger } from '../logger';
/**
 * Simple in-memory query cache
 * In production, use Redis for distributed caching
 */
class QueryCache {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 300000; // 5 minutes
    }
    /**
     * Get cached query result
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            logger.debug('Cache entry expired', { key });
            return null;
        }
        logger.debug('Cache hit', { key });
        return entry.data;
    }
    /**
     * Set cache entry
     */
    set(key, data, ttlMs) {
        const ttl = ttlMs || this.defaultTTL;
        const expiresAt = Date.now() + ttl;
        this.cache.set(key, { data, expiresAt });
        logger.debug('Cache set', { key, ttl });
    }
    /**
     * Delete cache entry
     */
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            logger.debug('Cache entry deleted', { key });
        }
        return deleted;
    }
    /**
     * Delete entries matching pattern
     */
    deletePattern(pattern) {
        let count = 0;
        for (const key of this.cache.keys()) {
            if (pattern.test(key)) {
                this.cache.delete(key);
                count++;
            }
        }
        if (count > 0) {
            logger.debug('Cache entries deleted by pattern', { pattern: pattern.toString(), count });
        }
        return count;
    }
    /**
     * Clear all cache entries
     */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        logger.info('Cache cleared', { entriesRemoved: size });
    }
    /**
     * Get cache statistics
     */
    stats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys()),
        };
    }
    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            logger.debug('Expired cache entries cleaned', { count: cleaned });
        }
        return cleaned;
    }
    /**
     * Wrap a query function with caching
     */
    async cached(key, queryFn, ttlMs) {
        // Try to get from cache
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }
        // Execute query
        const result = await queryFn();
        // Store in cache
        this.set(key, result, ttlMs);
        return result;
    }
}
// Global instance
export const queryCache = new QueryCache();
// Cleanup expired entries every minute
setInterval(() => {
    queryCache.cleanup();
}, 60000);
