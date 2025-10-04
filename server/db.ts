import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { logger } from './logger';
import { queryMonitor } from './middleware/query-monitor';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  min: parseInt(process.env.DB_POOL_MIN || '2', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
};

export const pool = new Pool(poolConfig);

pool.on('connect', () => {
  logger.info('New database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error', err);
});

pool.on('remove', () => {
  logger.info('Database connection removed from pool');
});

export const db = drizzle({ client: pool, schema });

export interface DatabaseStats {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
  poolMax: number;
}

export function getDatabaseStats(): DatabaseStats {
  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingClients: pool.waitingCount,
    poolMax: poolConfig.max,
  };
}

export async function checkDatabaseHealth(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
  const startTime = Date.now();
  try {
    await pool.query('SELECT 1');
    const latency = Date.now() - startTime;
    return { healthy: true, latency };
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Database health check failed', err);
    return { healthy: false, error: error?.message || String(error) };
  }
}

export async function closeDatabase(): Promise<void> {
  try {
    await pool.end();
    logger.info('Database connection pool closed');
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error closing database connection pool', err);
    throw error;
  }
}
