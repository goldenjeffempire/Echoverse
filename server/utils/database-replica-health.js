/**
 * Database Replica Health Checks
 * FIX #10: Monitor read replica health and lag
 */
import { Pool } from 'pg';
import { logger } from '../logger';
const REPLICA_LAG_WARNING_THRESHOLD = 10; // 10 seconds
const REPLICA_LAG_CRITICAL_THRESHOLD = 60; // 60 seconds
let replicaPool = null;
/**
 * Get or create replica connection pool
 */
function getReplicaPool(replicaUrl) {
    if (!replicaPool) {
        replicaPool = new Pool({
            connectionString: replicaUrl,
            max: 5, // Small pool for health checks
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000
        });
        logger.info('Replica connection pool created');
    }
    return replicaPool;
}
/**
 * Check read replica health and replication lag
 */
export async function checkReplicaHealth(replicaUrl) {
    const startTime = Date.now();
    try {
        if (!replicaUrl) {
            logger.warn('No replica configured - treating as unhealthy');
            return {
                isHealthy: false,
                lagSeconds: -1,
                lastCheck: new Date(),
                error: 'No replica configured'
            };
        }
        // Connect to replica and check lag
        const pool = getReplicaPool(replicaUrl);
        const result = await pool.query(`
      SELECT 
        EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::int AS lag_seconds,
        pg_is_in_recovery() AS is_replica
    `);
        const { lag_seconds, is_replica } = result.rows[0];
        if (!is_replica) {
            logger.error('Replica URL points to primary database', undefined, { replicaUrl: replicaUrl.split('@')[1] });
            return {
                isHealthy: false,
                lagSeconds: 0,
                lastCheck: new Date(),
                error: 'Not a replica - points to primary'
            };
        }
        const isHealthy = lag_seconds < REPLICA_LAG_CRITICAL_THRESHOLD;
        if (lag_seconds >= REPLICA_LAG_WARNING_THRESHOLD) {
            logger.warn('Replica lag detected', {
                lagSeconds: lag_seconds,
                threshold: REPLICA_LAG_WARNING_THRESHOLD
            });
        }
        return {
            isHealthy,
            lagSeconds: lag_seconds || 0,
            lastCheck: new Date()
        };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Replica health check failed', error instanceof Error ? error : undefined);
        return {
            isHealthy: false,
            lagSeconds: -1,
            lastCheck: new Date(),
            error: errorMsg
        };
    }
}
/**
 * Monitor replica health continuously
 */
export function startReplicaHealthMonitoring(intervalMs = 30000) {
    // Use documented env var name
    const replicaUrl = process.env.DB_READ_REPLICA_URL || process.env.DATABASE_REPLICA_URL;
    if (!replicaUrl) {
        logger.warn('No read replica configured (DB_READ_REPLICA_URL) - skipping replica monitoring');
        return setTimeout(() => { }, 0); // Return dummy timeout
    }
    logger.info('Starting replica health monitoring', {
        intervalMs,
        replicaConfigured: true
    });
    return setInterval(async () => {
        const health = await checkReplicaHealth(replicaUrl);
        if (!health.isHealthy) {
            logger.error('Replica unhealthy', undefined, {
                lagSeconds: health.lagSeconds,
                error: health.error
            });
        }
        else if (health.lagSeconds >= REPLICA_LAG_WARNING_THRESHOLD) {
            logger.warn('Replica lag warning', {
                lagSeconds: health.lagSeconds
            });
        }
    }, intervalMs);
}
/**
 * Get replica health status for monitoring endpoints
 */
export async function getReplicaStatus() {
    const replicaUrl = process.env.DB_READ_REPLICA_URL || process.env.DATABASE_REPLICA_URL;
    if (!replicaUrl) {
        return {
            configured: false,
            health: {
                isHealthy: false,
                lagSeconds: -1,
                lastCheck: new Date(),
                error: 'No replica configured'
            }
        };
    }
    const health = await checkReplicaHealth(replicaUrl);
    return {
        configured: true,
        health
    };
}
/**
 * Cleanup replica pool on shutdown
 */
export async function closeReplicaPool() {
    if (replicaPool) {
        await replicaPool.end();
        replicaPool = null;
        logger.info('Replica connection pool closed');
    }
}
