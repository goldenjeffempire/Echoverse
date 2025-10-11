import { logger } from '../logger';
/**
 * Redis health check utility
 * Validates Redis connection when ENABLE_REDIS_CACHE=true
 */
export async function checkRedisHealth() {
    // Only check if Redis is enabled
    if (process.env.ENABLE_REDIS_CACHE !== 'true') {
        return { healthy: true }; // Not using Redis, so it's "healthy"
    }
    const startTime = Date.now();
    try {
        // Dynamic import to avoid loading Redis if not needed
        const redis = await import('ioredis');
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const client = new redis.default(redisUrl, {
            connectTimeout: 5000,
            maxRetriesPerRequest: 1,
        });
        try {
            await client.ping();
            const latency = Date.now() - startTime;
            await client.quit();
            logger.debug('Redis health check passed', { latency });
            return { healthy: true, latency };
        }
        catch (error) {
            await client.quit();
            throw error;
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Redis health check failed', error instanceof Error ? error : undefined);
        return {
            healthy: false,
            error: errorMessage,
        };
    }
}
/**
 * Initialize Redis client if enabled
 */
export async function initializeRedis() {
    if (process.env.ENABLE_REDIS_CACHE !== 'true') {
        logger.info('Redis cache disabled');
        return null;
    }
    try {
        const redis = await import('ioredis');
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const client = new redis.default(redisUrl, {
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });
        client.on('error', (err) => {
            logger.error('Redis client error', err);
        });
        client.on('connect', () => {
            logger.info('Redis client connected');
        });
        logger.info('Redis cache initialized');
        return client;
    }
    catch (error) {
        logger.error('Failed to initialize Redis', error instanceof Error ? error : undefined);
        return null;
    }
}
