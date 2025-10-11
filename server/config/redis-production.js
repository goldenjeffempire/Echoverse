/**
 * Redis Production Configuration
 * FIX: HIGH-004 - Complete Redis integration with fallback
 */
import { createClient } from 'redis';
import { logger } from '../logger';
let redisClient = null;
let isRedisAvailable = false;
function validateRedisUrl(url) {
    try {
        const parsed = new URL(url);
        if (!['redis:', 'rediss:'].includes(parsed.protocol)) {
            return { valid: false, error: `Invalid Redis protocol: ${parsed.protocol}. Must be redis:// or rediss://` };
        }
        if (!parsed.hostname) {
            return { valid: false, error: 'Redis URL missing hostname' };
        }
        return { valid: true };
    }
    catch (error) {
        return { valid: false, error: `Invalid Redis URL format: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
}
export async function initializeRedis() {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
    if (!redisUrl) {
        const isProd = process.env.NODE_ENV === 'production';
        if (isProd) {
            // CRIT-004 FIX: Warn but don't crash - allow graceful fallback to in-memory cache
            logger.warn('CRITICAL: Redis URL not configured in production - falling back to in-memory cache');
            logger.warn('Multi-instance deployments may have data inconsistency. Configure REDIS_URL for production use.');
        }
        else {
            logger.warn('Redis URL not configured, using in-memory cache fallback (development only)');
        }
        return;
    }
    const validation = validateRedisUrl(redisUrl);
    if (!validation.valid) {
        const isProd = process.env.NODE_ENV === 'production';
        const errorMsg = `Redis URL validation failed: ${validation.error}`;
        logger.error(errorMsg, { isProd });
        if (isProd) {
            // CRIT-004 FIX: Warn but don't crash - allow graceful fallback
            logger.warn('Falling back to in-memory cache due to invalid Redis URL');
        }
        else {
            logger.warn('Continuing with in-memory cache fallback (development only)');
        }
        return;
    }
    try {
        redisClient = createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error('Redis reconnection failed after 10 attempts');
                        return new Error('Redis reconnection limit reached');
                    }
                    return Math.min(retries * 100, 3000);
                },
                connectTimeout: 10000,
            },
        });
        redisClient.on('error', (err) => {
            logger.error('Redis client error', err);
            isRedisAvailable = false;
        });
        redisClient.on('connect', () => {
            logger.info('Redis client connected');
            isRedisAvailable = true;
        });
        redisClient.on('ready', () => {
            logger.info('Redis client ready');
            isRedisAvailable = true;
        });
        redisClient.on('reconnecting', () => {
            logger.warn('Redis client reconnecting');
        });
        await redisClient.connect();
        // Test connection
        await redisClient.ping();
        logger.info('Redis connection successful');
    }
    catch (error) {
        logger.error('Failed to initialize Redis', error instanceof Error ? error : undefined);
        redisClient = null;
        isRedisAvailable = false;
    }
}
export function getRedisClient() {
    return redisClient;
}
export function isRedisConnected() {
    return isRedisAvailable && redisClient !== null;
}
export async function closeRedis() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        isRedisAvailable = false;
        logger.info('Redis connection closed');
    }
}
// Cache utilities with fallback
const memoryCache = new Map();
export async function cacheGet(key) {
    if (isRedisConnected() && redisClient) {
        try {
            const value = await redisClient.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            logger.error('Redis GET error, falling back to memory', error instanceof Error ? error : undefined);
        }
    }
    // Memory cache fallback
    const cached = memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
        return cached.value;
    }
    memoryCache.delete(key);
    return null;
}
export async function cacheSet(key, value, ttlSeconds = 3600) {
    if (isRedisConnected() && redisClient) {
        try {
            await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
            return;
        }
        catch (error) {
            logger.error('Redis SET error, falling back to memory', error instanceof Error ? error : undefined);
        }
    }
    // Memory cache fallback
    memoryCache.set(key, {
        value,
        expiry: Date.now() + ttlSeconds * 1000
    });
}
export async function cacheDel(key) {
    if (isRedisConnected() && redisClient) {
        try {
            await redisClient.del(key);
            return;
        }
        catch (error) {
            logger.error('Redis DEL error', error instanceof Error ? error : undefined);
        }
    }
    memoryCache.delete(key);
}
export async function cacheFlush() {
    if (isRedisConnected() && redisClient) {
        try {
            await redisClient.flushAll();
        }
        catch (error) {
            logger.error('Redis FLUSH error', error instanceof Error ? error : undefined);
        }
    }
    memoryCache.clear();
}
// Cleanup old memory cache entries
setInterval(() => {
    const now = Date.now();
    for (const [key, { expiry }] of memoryCache.entries()) {
        if (expiry < now) {
            memoryCache.delete(key);
        }
    }
}, 60000); // Every minute
