import { pool } from '../db';
import { logger } from '../logger';
import { replicationLagSeconds, replicationLagBytes } from '../monitoring/metrics';
const LAG_WARNING_THRESHOLD_SECONDS = 5;
const LAG_CRITICAL_THRESHOLD_SECONDS = 30;
export async function checkReplicationLag() {
    try {
        const result = await pool.query(`
      SELECT 
        COALESCE(pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn), 0) AS lag_bytes,
        COALESCE(EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())), 0) AS lag_seconds
      FROM pg_stat_replication
      LIMIT 1;
    `);
        if (result.rows.length === 0) {
            return null;
        }
        const lagBytes = parseInt(result.rows[0].lag_bytes, 10);
        const lagSeconds = parseFloat(result.rows[0].lag_seconds);
        const isHealthy = lagSeconds < LAG_WARNING_THRESHOLD_SECONDS;
        // PHASE 2.4: Export replication lag metrics to Prometheus
        replicationLagSeconds.set(lagSeconds);
        replicationLagBytes.set(lagBytes);
        if (lagSeconds >= LAG_CRITICAL_THRESHOLD_SECONDS) {
            logger.error('CRITICAL: Database replication lag exceeded threshold', new Error('Replication lag critical'), {
                lagSeconds,
                lagBytes,
                threshold: LAG_CRITICAL_THRESHOLD_SECONDS,
            });
        }
        else if (lagSeconds >= LAG_WARNING_THRESHOLD_SECONDS) {
            logger.warn('WARNING: Database replication lag detected', {
                lagSeconds,
                lagBytes,
                threshold: LAG_WARNING_THRESHOLD_SECONDS,
            });
        }
        return { lagBytes, lagSeconds, isHealthy };
    }
    catch (error) {
        logger.error('Failed to check replication lag', error instanceof Error ? error : undefined);
        return null;
    }
}
export function startReplicationLagMonitoring(intervalMs = 60000) {
    setInterval(async () => {
        await checkReplicationLag();
    }, intervalMs);
    logger.info('Replication lag monitoring started', { intervalMs });
}
