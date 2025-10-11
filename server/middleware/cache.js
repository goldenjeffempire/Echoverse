import { logger } from '../logger';
class MemoryCache {
    constructor() {
        this.cache = new Map();
        // Cleanup expired entries every minute
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
    set(key, value, ttlSeconds = 300) {
        this.cache.set(key, {
            data: value,
            expiresAt: Date.now() + (ttlSeconds * 1000)
        });
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
        let cleaned = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            logger.debug('Cache cleanup completed', { entriesRemoved: cleaned });
        }
    }
    getStats() {
        return {
            size: this.cache.size,
            entries: this.cache.size
        };
    }
    destroy() {
        clearInterval(this.cleanupInterval);
        this.clear();
    }
}
export const cache = new MemoryCache();
/**
 * Generate cache key from request
 */
function getCacheKey(req) {
    const userId = req.user?.id || 'anonymous';
    const query = JSON.stringify(req.query);
    const path = req.path;
    return `${path}:${userId}:${query}`;
}
/**
 * Cache middleware for GET requests
 */
export function cacheMiddleware(ttlSeconds = 300) {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            next();
            return;
        }
        const key = getCacheKey(req);
        const cached = cache.get(key);
        if (cached) {
            logger.debug('Cache hit', { key, path: req.path });
            res.setHeader('X-Cache', 'HIT');
            res.json(cached);
            return;
        }
        logger.debug('Cache miss', { key, path: req.path });
        res.setHeader('X-Cache', 'MISS');
        // Override res.json to cache the response
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cache.set(key, body, ttlSeconds);
                logger.debug('Response cached', { key, ttl: ttlSeconds });
            }
            return originalJson(body);
        };
        next();
    };
}
/**
 * Invalidate cache for a specific pattern
 */
export function invalidateCache(pattern) {
    // In production with Redis, use SCAN or KEYS to find matching keys
    // For now, we'll clear all cache on invalidation
    cache.clear();
    logger.info('Cache invalidated', { pattern });
}
/**
 * Invalidate cache middleware for write operations
 */
export function invalidateCacheMiddleware(req, res, next) {
    // Invalidate cache after successful write operations
    const originalJson = res.json.bind(res);
    res.json = function (body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            invalidateCache(req.path);
        }
        return originalJson(body);
    };
    next();
}
/**
 * Cache helper for manual caching
 */
export async function cachedQuery(key, queryFn, ttlSeconds = 300) {
    const cached = cache.get(key);
    if (cached) {
        logger.debug('Cache hit', { key });
        return cached;
    }
    logger.debug('Cache miss, executing query', { key });
    const result = await queryFn();
    cache.set(key, result, ttlSeconds);
    return result;
}
