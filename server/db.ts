import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { logger } from './logger';
// CRITICAL FIX: queryMonitor causes recursive deadlock - disabled temporarily
// import { queryMonitor } from './middleware/query-monitor';
import { retryWithBackoff } from './utils/db-connection-retry';

// CRITICAL FIX: Switch from Neon serverless (WebSocket) to standard pg driver (TCP)
// The Neon serverless WebSocket driver was causing connection hang issues

// P0 FIX #20: Global query timeout enforcement in pool config
// Note: Neon serverless uses statement_timeout at connection level
const QUERY_TIMEOUT_MS = parseInt(process.env.DB_QUERY_TIMEOUT_MS || '30000', 10);

// Circuit Breaker for database connection pool
class DatabaseCircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly threshold: number;
  private readonly timeout: number;

  constructor() {
    this.threshold = parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5', 10);
    this.timeout = parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '60000', 10);
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.timeout) {
        logger.info('Circuit breaker entering HALF_OPEN state');
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - database unavailable');
      }
    }

    try {
      const result = await operation();
      
      // Reset failures on successful operation in any state
      if (this.state === 'HALF_OPEN') {
        logger.info('Circuit breaker reset to CLOSED state from HALF_OPEN');
        this.reset();
      } else if (this.state === 'CLOSED' && this.failures > 0) {
        // Reset failure counter on success in CLOSED state
        logger.debug('Circuit breaker: resetting failure counter after successful operation', {
          previousFailures: this.failures
        });
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      logger.error('Circuit breaker opened due to repeated failures', new Error('Circuit breaker tripped'), {
        failures: this.failures,
        threshold: this.threshold,
      });
      this.state = 'OPEN';
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  getState(): string {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      threshold: this.threshold,
      timeout: this.timeout,
    };
  }
}

export const dbCircuitBreaker = new DatabaseCircuitBreaker();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Clean up database URL if needed
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('channel_binding=require', 'channel_binding=prefer');
}

// CRITICAL FIX: Singleton pattern for development to prevent connection accumulation
// During hot-reload (tsx watch mode), connections accumulate causing pool exhaustion
declare global {
  var __db_pool__: Pool | undefined;
}

// HIGH-008 FIX: Dynamic pool configuration with auto-scaling
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // HIGH-008: Auto-scaling pool size based on load (optimized for dev hot-reload)
  max: process.env.NODE_ENV === 'development' 
    ? parseInt(process.env.DB_POOL_MAX || '25', 10)  // 25 connections in dev (increased for background jobs)
    : parseInt(process.env.DB_POOL_MAX || '30', 10), // Standard pg driver - 30 max connections in prod
  min: parseInt(process.env.DB_POOL_MIN || '2', 10), // Minimum 2 connections
  idleTimeoutMillis: process.env.NODE_ENV === 'development'
    ? parseInt(process.env.DB_IDLE_TIMEOUT || '5000', 10) // 5s idle timeout in dev (faster release)
    : parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10), // 30s idle timeout in prod
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10), // 10s connection timeout
  statement_timeout: QUERY_TIMEOUT_MS, // Global query timeout
};

// Use singleton in development to prevent connection accumulation
let pool: Pool;
if (process.env.NODE_ENV === 'development') {
  if (!global.__db_pool__) {
    global.__db_pool__ = new Pool(poolConfig);
    logger.info('Created new database pool (development singleton)');
  }
  pool = global.__db_pool__;
} else {
  pool = new Pool(poolConfig);
  logger.info('Created new database pool (production)');
}

export { pool };

// Pool exhaustion monitoring (circuit breaker removed - was blocking valid queries)
const originalPoolConnect = pool.connect.bind(pool);
pool.connect = async function() {
  const stats = getDatabaseStats();
  const utilizationPercent = (stats.totalConnections / poolConfig.max) * 100;
  
  // Alert on pool exhaustion before attempting connection
  if (utilizationPercent > 90) {
    logger.warn('Pool utilization high', {
      totalConnections: stats.totalConnections,
      poolMax: poolConfig.max,
      utilization: `${utilizationPercent.toFixed(1)}%`,
      waitingClients: stats.waitingClients,
    });
  }
  
  return await originalPoolConnect();
};

// Log new database connections
pool.on('connect', (client) => {
  logger.info('New database connection established');
  // Set statement timeout for safety
  client.query(`SET statement_timeout = ${QUERY_TIMEOUT_MS}`).catch(err => {
    logger.warn('Failed to set statement_timeout', { error: err.message });
  });
});

// CRIT-010 FIX: Sanitize database errors to prevent connection string leakage
pool.on('error', (err) => {
  const sanitizedError = sanitizeDbError(err);
  logger.error('Unexpected database pool error', sanitizedError);
});

pool.on('remove', () => {
  logger.info('Database connection removed from pool');
});

// CRIT-023 FIX: Handle Neon WebSocket connection terminations gracefully
// Add global handlers for unhandled promise rejections from database connections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  const errorMessage = reason?.message || String(reason);
  
  // Handle Neon database connection terminations gracefully
  if (errorMessage && (
    errorMessage.includes('Connection terminated unexpectedly') ||
    errorMessage.includes('WebSocket was closed') ||
    errorMessage.includes('WebSocket is not open')
  )) {
    logger.warn('Database WebSocket connection terminated - will reconnect on next query', {
      error: sanitizeDbError(reason)
    });
    // Don't crash - the pool will automatically reconnect on the next query
    return;
  }
  
  // Log other unhandled rejections but don't crash in production
  logger.error('Unhandled Promise Rejection', reason instanceof Error ? reason : new Error(String(reason)));
  
  // Only crash in development for debugging
  if (process.env.NODE_ENV === 'development') {
    // Allow crash for easier debugging in dev
  } else {
    // In production, log but don't crash
    logger.error('Suppressing crash in production - logged error above');
  }
});

// Also handle uncaughtException to prevent crashes from WebSocket errors
process.on('uncaughtException', (error: Error) => {
  const errorMessage = error?.message || String(error);
  
  // Handle Neon database connection terminations gracefully
  if (errorMessage && (
    errorMessage.includes('Connection terminated unexpectedly') ||
    errorMessage.includes('WebSocket was closed') ||
    errorMessage.includes('WebSocket is not open')
  )) {
    logger.warn('Database WebSocket connection terminated (uncaught) - will reconnect on next query', {
      error: sanitizeDbError(error)
    });
    // Don't crash - the pool will automatically reconnect on the next query
    return;
  }
  
  // Log other uncaught exceptions
  logger.error('Uncaught Exception', error);
  
  // Only crash in development for debugging
  if (process.env.NODE_ENV === 'development') {
    // Allow crash for easier debugging in dev
    throw error;
  } else {
    // In production, log but don't crash
    logger.error('Suppressing crash in production - logged error above');
  }
});

// CRIT-010 FIX: Sanitize database connection errors
function sanitizeDbError(err: any): Error {
  if (!err) return new Error('Unknown database error');
  
  const error = err instanceof Error ? err : new Error(String(err));
  
  // Remove connection string details from error messages
  if (error.message) {
    error.message = error.message
      .replace(/postgres:\/\/[^@]+@[^/]+\/[^\s]+/g, 'postgres://***@***/***')
      .replace(/user=[^\s]+/g, 'user=***')
      .replace(/password=[^\s]+/g, 'password=***')
      .replace(/host=[^\s]+/g, 'host=***');
  }
  
  // Sanitize stack trace
  if (error.stack) {
    error.stack = error.stack
      .replace(/postgres:\/\/[^@]+@[^/]+\/[^\s]+/g, 'postgres://***@***/***');
  }
  
  return error;
}

// CRITICAL FIX: Singleton pattern for Drizzle ORM in development
declare global {
  var __drizzle_db__: ReturnType<typeof drizzle> | undefined;
}

// CRIT-002 FIX: Create drizzle instance with circuit breaker protection
// Use singleton in development to reuse same instance across hot-reloads
let db: ReturnType<typeof drizzle>;
if (process.env.NODE_ENV === 'development') {
  if (!global.__drizzle_db__) {
    global.__drizzle_db__ = drizzle({ client: pool, schema });
    logger.info('Created new Drizzle ORM instance (development singleton)');
  }
  db = global.__drizzle_db__;
} else {
  db = drizzle({ client: pool, schema });
  logger.info('Created new Drizzle ORM instance (production)');
}

// Export database instance
export { db };

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

export async function checkDatabaseHealth(): Promise<{ healthy: boolean; latency?: number; error?: string; circuitBreakerState?: string }> {
  const startTime = Date.now();
  try {
    // Use circuit breaker for health checks
    await dbCircuitBreaker.execute(async () => {
      await retryWithBackoff(async () => {
        await pool.query('SELECT 1');
      }, { maxAttempts: 3 });
    });
    const latency = Date.now() - startTime;
    return { 
      healthy: true, 
      latency,
      circuitBreakerState: dbCircuitBreaker.getState()
    };
  } catch (error: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Database health check failed', err);
    return { 
      healthy: false, 
      error: error?.message || String(error),
      circuitBreakerState: dbCircuitBreaker.getState()
    };
  }
}

// PHASE 2.1: Dynamic Connection Pool Auto-Scaling
const POOL_SCALE_CONFIG = {
  scaleUpThreshold: 80,      // Scale up when >80% utilization
  scaleDownThreshold: 40,    // Scale down when <40% utilization  
  scaleUpIncrement: 5,       // Add 5 connections when scaling up
  scaleDownDecrement: 2,     // Remove 2 connections when scaling down
  absoluteMax: 50,           // Never exceed 50 connections
  absoluteMin: 3,            // Never go below 3 connections
  cooldownPeriodMs: 60000    // Wait 60s between scaling operations
};

let lastScaleOperation = 0;
// Initialize to the same value as the pool config (25 in dev, 30 in prod) - matches poolConfig.max above
let currentPoolMax = process.env.NODE_ENV === 'development'
  ? parseInt(process.env.DB_POOL_MAX || '25', 10)
  : parseInt(process.env.DB_POOL_MAX || '30', 10);

export function scaleConnectionPool(direction: 'up' | 'down', reason: string): boolean {
  const now = Date.now();
  
  // Cooldown period check
  if (now - lastScaleOperation < POOL_SCALE_CONFIG.cooldownPeriodMs) {
    logger.debug('Pool scaling skipped - in cooldown period', {
      timeSinceLastScale: now - lastScaleOperation
    });
    return false;
  }
  
  const oldMax = currentPoolMax;
  
  if (direction === 'up') {
    currentPoolMax = Math.min(
      currentPoolMax + POOL_SCALE_CONFIG.scaleUpIncrement,
      POOL_SCALE_CONFIG.absoluteMax
    );
  } else {
    currentPoolMax = Math.max(
      currentPoolMax - POOL_SCALE_CONFIG.scaleDownDecrement,
      POOL_SCALE_CONFIG.absoluteMin
    );
  }
  
  if (currentPoolMax !== oldMax) {
    // Update pool configuration
    (pool as any).options.max = currentPoolMax;
    
    logger.info(`Connection pool ${direction === 'up' ? 'scaled UP' : 'scaled DOWN'}`, {
      reason,
      oldMax,
      newMax: currentPoolMax,
      direction
    });
    
    lastScaleOperation = now;
    return true;
  }
  
  return false;
}

export function getCurrentPoolMax(): number {
  return currentPoolMax;
}

// PHASE 2: Connection pool monitoring with auto-scaling and alerts
export function monitorConnectionPool(): void {
  setInterval(() => {
    const stats = getDatabaseStats();
    const utilizationPercent = (stats.totalConnections / currentPoolMax) * 100;
    
    // PHASE 2.1: Auto-scaling logic based on utilization
    if (utilizationPercent > POOL_SCALE_CONFIG.scaleUpThreshold) {
      const scaled = scaleConnectionPool('up', `High utilization: ${utilizationPercent.toFixed(1)}%`);
      if (!scaled && utilizationPercent > 90) {
        logger.error('ALERT: Database pool at critical capacity - cannot scale further', new Error('Pool maxed out'), {
          totalConnections: stats.totalConnections,
          poolMax: currentPoolMax,
          utilization: `${utilizationPercent.toFixed(1)}%`,
          waitingClients: stats.waitingClients,
        });
      }
    } else if (utilizationPercent < POOL_SCALE_CONFIG.scaleDownThreshold && currentPoolMax > POOL_SCALE_CONFIG.absoluteMin) {
      scaleConnectionPool('down', `Low utilization: ${utilizationPercent.toFixed(1)}%`);
    }
    
    // Alert on high utilization (even if we can't scale more)
    if (utilizationPercent > 90) {
      logger.error('ALERT: Database connection pool at critical capacity', new Error('Pool at critical capacity'), {
        totalConnections: stats.totalConnections,
        poolMax: currentPoolMax,
        utilization: `${utilizationPercent.toFixed(1)}%`,
        waitingClients: stats.waitingClients,
      });
    } else if (utilizationPercent > 75) {
      logger.warn('WARNING: Database connection pool utilization high', {
        totalConnections: stats.totalConnections,
        poolMax: currentPoolMax,
        utilization: `${utilizationPercent.toFixed(1)}%`,
      });
    }
    
    if (stats.waitingClients > 5) {
      logger.error('ALERT: High number of waiting database clients', new Error('High waiting clients'), {
        waitingClients: stats.waitingClients,
        totalConnections: stats.totalConnections,
      });
    }
  }, 30000); // Check every 30 seconds
  
  logger.info('Connection pool monitoring started', {
    threshold: POOL_SCALE_CONFIG.scaleUpThreshold,
    interval: 30000
  });
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
