import { logger } from '../logger';
class QueryCache {
    constructor() {
        this.cache = new Map();
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
    set(key, data, ttl = 300000) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
        logger.debug('Query result cached', { key, ttl });
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            logger.debug('Cache entry expired', { key });
            return null;
        }
        logger.debug('Cache hit', { key });
        return entry.data;
    }
    invalidate(pattern) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
        logger.info('Cache invalidated', { pattern, count: keysToDelete.length });
    }
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        logger.info('Cache cleared', { entriesRemoved: size });
    }
    cleanup() {
        const now = Date.now();
        let removed = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
                removed++;
            }
        }
        if (removed > 0) {
            logger.debug('Cache cleanup completed', { entriesRemoved: removed });
        }
    }
    getStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys()),
        };
    }
    shutdown() {
        clearInterval(this.cleanupInterval);
        this.clear();
    }
}
export const queryCache = new QueryCache();
export async function cachedQuery(key, queryFn, ttl = 300000) {
    const cached = queryCache.get(key);
    if (cached !== null) {
        return cached;
    }
    const result = await queryFn();
    queryCache.set(key, result, ttl);
    return result;
}
