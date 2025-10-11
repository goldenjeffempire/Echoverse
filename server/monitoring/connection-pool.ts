import { db } from '../db';
import { sql } from 'drizzle-orm';
import { logger } from '../logger';

export interface PoolStats {
  total: number;
  idle: number;
  waiting: number;
  active: number;
  utilizationPercent: number;
}

export async function getConnectionPoolStats(): Promise<PoolStats> {
  try {
    const result = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()) as total,
        (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle') as idle,
        (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type IS NOT NULL) as waiting,
        (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') as active
    `);

    const row = result.rows[0] as any;
    const total = parseInt(row.total || '0');
    const idle = parseInt(row.idle || '0');
    const waiting = parseInt(row.waiting || '0');
    const active = parseInt(row.active || '0');
    const maxConnections = parseInt(process.env.DB_POOL_SIZE || '10');

    const utilizationPercent = maxConnections > 0 ? (total / maxConnections) * 100 : 0;

    return {
      total,
      idle,
      waiting,
      active,
      utilizationPercent
    };
  } catch (error) {
    logger.error('Failed to get connection pool stats', error instanceof Error ? error : undefined);
    return {
      total: 0,
      idle: 0,
      waiting: 0,
      active: 0,
      utilizationPercent: 0
    };
  }
}

const POOL_EXHAUSTION_THRESHOLD = 90;
const CHECK_INTERVAL_MS = 30000; // 30 seconds
let monitoringInterval: NodeJS.Timeout | null = null;

export function startConnectionPoolMonitoring(): void {
  if (monitoringInterval) {
    logger.warn('Connection pool monitoring already running');
    return;
  }

  logger.info('Starting connection pool monitoring', {
    threshold: POOL_EXHAUSTION_THRESHOLD,
    interval: CHECK_INTERVAL_MS
  });

  monitoringInterval = setInterval(async () => {
    try {
      const stats = await getConnectionPoolStats();

      if (stats.utilizationPercent >= POOL_EXHAUSTION_THRESHOLD) {
        logger.warn('Database connection pool nearing exhaustion', {
          ...stats,
          threshold: POOL_EXHAUSTION_THRESHOLD,
          severity: stats.utilizationPercent >= 95 ? 'critical' : 'warning'
        });

        if (stats.waiting > 0) {
          logger.error('Connections waiting - possible pool exhaustion', undefined, {
            waiting: stats.waiting,
            active: stats.active,
            total: stats.total
          });
        }
      }

      logger.debug('Connection pool stats', stats);
    } catch (error) {
      logger.error('Connection pool monitoring error', error instanceof Error ? error : undefined);
    }
  }, CHECK_INTERVAL_MS);

  logger.info('Connection pool monitoring started successfully');
}

export function stopConnectionPoolMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    logger.info('Connection pool monitoring stopped');
  }
}

export async function checkPoolHealth(): Promise<{
  healthy: boolean;
  stats: PoolStats;
  warnings: string[];
}> {
  const stats = await getConnectionPoolStats();
  const warnings: string[] = [];

  if (stats.utilizationPercent >= 90) {
    warnings.push('Pool utilization above 90%');
  }

  if (stats.waiting > 0) {
    warnings.push(`${stats.waiting} connections waiting`);
  }

  if (stats.active > stats.total * 0.8) {
    warnings.push('High number of active connections');
  }

  return {
    healthy: warnings.length === 0,
    stats,
    warnings
  };
}

/**
 * PHASE 1: DATABASE INTEGRITY - Replication Lag Monitoring
 * 
 * Monitors database replication lag for read replicas
 * PostgreSQL streaming replication lag detection
 */

export interface ReplicationLagStats {
  isPrimary: boolean;
  replicaCount: number;
  maxLagBytes: number;
  maxLagSeconds: number;
  replicas: Array<{
    application_name: string;
    client_addr: string;
    state: string;
    sent_lsn: string;
    write_lsn: string;
    flush_lsn: string;
    replay_lsn: string;
    lag_bytes: number;
    lag_seconds: number;
  }>;
  warnings: string[];
}

const REPLICATION_LAG_WARNING_BYTES = 10 * 1024 * 1024; // 10MB
const REPLICATION_LAG_CRITICAL_BYTES = 100 * 1024 * 1024; // 100MB
const REPLICATION_LAG_WARNING_SECONDS = 5; // 5 seconds
const REPLICATION_LAG_CRITICAL_SECONDS = 30; // 30 seconds

export async function getReplicationLagStats(): Promise<ReplicationLagStats> {
  try {
    // Check if this is a primary server
    const primaryCheck = await db.execute(sql`SELECT pg_is_in_recovery()`);
    const isPrimary = !primaryCheck.rows[0]?.pg_is_in_recovery;
    
    if (!isPrimary) {
      // This is a replica - check replication delay from primary
      const replicaLag = await db.execute(sql`
        SELECT 
          EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::int as lag_seconds
      `);
      
      const lagSeconds = parseInt(String(replicaLag.rows[0]?.lag_seconds || 0));
      const warnings: string[] = [];
      
      if (lagSeconds >= REPLICATION_LAG_CRITICAL_SECONDS) {
        warnings.push(`CRITICAL: Replica lag ${lagSeconds}s (threshold: ${REPLICATION_LAG_CRITICAL_SECONDS}s)`);
      } else if (lagSeconds >= REPLICATION_LAG_WARNING_SECONDS) {
        warnings.push(`WARNING: Replica lag ${lagSeconds}s (threshold: ${REPLICATION_LAG_WARNING_SECONDS}s)`);
      }
      
      return {
        isPrimary: false,
        replicaCount: 0,
        maxLagBytes: 0,
        maxLagSeconds: lagSeconds,
        replicas: [],
        warnings
      };
    }
    
    // This is a primary - check connected replicas
    const replicationStats = await db.execute(sql`
      SELECT 
        application_name,
        client_addr::text,
        state,
        sent_lsn,
        write_lsn,
        flush_lsn,
        replay_lsn,
        (pg_wal_lsn_diff(sent_lsn, replay_lsn))::bigint as lag_bytes,
        EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::int as lag_seconds
      FROM pg_stat_replication
      WHERE state = 'streaming'
    `);
    
    const replicas = replicationStats.rows.map((row: any) => ({
      application_name: row.application_name || 'unknown',
      client_addr: row.client_addr || 'unknown',
      state: row.state || 'unknown',
      sent_lsn: row.sent_lsn || '0/0',
      write_lsn: row.write_lsn || '0/0',
      flush_lsn: row.flush_lsn || '0/0',
      replay_lsn: row.replay_lsn || '0/0',
      lag_bytes: parseInt(row.lag_bytes || '0'),
      lag_seconds: parseInt(row.lag_seconds || '0')
    }));
    
    const maxLagBytes = Math.max(0, ...replicas.map(r => r.lag_bytes));
    const maxLagSeconds = Math.max(0, ...replicas.map(r => r.lag_seconds));
    
    const warnings: string[] = [];
    
    // Check for critical lag
    if (maxLagBytes >= REPLICATION_LAG_CRITICAL_BYTES) {
      warnings.push(`CRITICAL: Max replication lag ${(maxLagBytes / 1024 / 1024).toFixed(2)}MB`);
    } else if (maxLagBytes >= REPLICATION_LAG_WARNING_BYTES) {
      warnings.push(`WARNING: Max replication lag ${(maxLagBytes / 1024 / 1024).toFixed(2)}MB`);
    }
    
    if (maxLagSeconds >= REPLICATION_LAG_CRITICAL_SECONDS) {
      warnings.push(`CRITICAL: Max replication delay ${maxLagSeconds}s`);
    } else if (maxLagSeconds >= REPLICATION_LAG_WARNING_SECONDS) {
      warnings.push(`WARNING: Max replication delay ${maxLagSeconds}s`);
    }
    
    // Warn about replicas not in streaming state
    replicas.forEach(replica => {
      if (replica.state !== 'streaming') {
        warnings.push(`Replica ${replica.application_name} not in streaming state: ${replica.state}`);
      }
    });
    
    return {
      isPrimary: true,
      replicaCount: replicas.length,
      maxLagBytes,
      maxLagSeconds,
      replicas,
      warnings
    };
    
  } catch (error) {
    logger.error('Failed to get replication lag stats', error instanceof Error ? error : undefined);
    return {
      isPrimary: false,
      replicaCount: 0,
      maxLagBytes: 0,
      maxLagSeconds: 0,
      replicas: [],
      warnings: ['Failed to retrieve replication stats']
    };
  }
}

export async function monitorReplicationLag(): Promise<void> {
  const stats = await getReplicationLagStats();
  
  if (stats.warnings.length > 0) {
    const severity = stats.warnings.some(w => w.startsWith('CRITICAL')) ? 'error' : 'warn';
    
    if (severity === 'error') {
      logger.error('Replication lag detected', new Error('Replication lag exceeded critical threshold'), {
        ...stats,
        isPrimary: stats.isPrimary,
        replicaCount: stats.replicaCount,
        maxLagBytes: stats.maxLagBytes,
        maxLagSeconds: stats.maxLagSeconds
      });
    } else {
      logger.warn('Replication lag warning', {
        ...stats,
        isPrimary: stats.isPrimary,
        replicaCount: stats.replicaCount,
        maxLagBytes: stats.maxLagBytes,
        maxLagSeconds: stats.maxLagSeconds
      });
    }
  } else {
    logger.debug('Replication lag healthy', {
      isPrimary: stats.isPrimary,
      replicaCount: stats.replicaCount,
      maxLagBytes: stats.maxLagBytes,
      maxLagSeconds: stats.maxLagSeconds
    });
  }
}
