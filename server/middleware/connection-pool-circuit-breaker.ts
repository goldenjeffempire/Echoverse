import { Request, Response, NextFunction } from 'express';
import { getConnectionPoolStats } from '../monitoring/connection-pool';
import { logger } from '../logger';
import { getDatabaseStats } from '../db';

// CRITICAL FIX: Environment-aware configuration
const CIRCUIT_BREAKER_THRESHOLD = parseInt(process.env.POOL_CIRCUIT_BREAKER_THRESHOLD || '90', 10);
const GRACEFUL_DEGRADATION_THRESHOLD = 80; // Allow read-only at 80%
let lastPoolCheck = 0;
const CHECK_INTERVAL_MS = 1000;
let cachedPoolUtilization = 0;
let tripCount = 0;
let lastTripTime = 0;
const TRIP_ALERT_THRESHOLD = 5; // Alert after 5 trips in 5 minutes
const TRIP_WINDOW_MS = 300000; // 5 minutes

// OPTIMIZATION FIX: Initialize pool stats on module load to ensure circuit breaker is active from first request
function initializePoolStats() {
  const dbStats = getDatabaseStats();
  const total = dbStats.totalConnections || 0;
  const maxConnections = dbStats.poolMax || 10;
  cachedPoolUtilization = maxConnections > 0 ? (total / maxConnections) * 100 : 0;
  logger.debug('Connection pool circuit breaker initialized', {
    totalConnections: total,
    maxConnections,
    utilizationPercent: cachedPoolUtilization
  });
}

// Initialize stats immediately
initializePoolStats();

export async function connectionPoolCircuitBreaker(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const now = Date.now();
    
    // OPTIMIZATION FIX: Only check pool stats periodically, use lightweight cached metrics
    if (now - lastPoolCheck > CHECK_INTERVAL_MS) {
      // Use lightweight getDatabaseStats() which doesn't query database
      const dbStats = getDatabaseStats();
      // Calculate utilization from pool stats, not from database query
      const total = dbStats.totalConnections || 0;
      const maxConnections = dbStats.poolMax || 10;
      cachedPoolUtilization = maxConnections > 0 ? (total / maxConnections) * 100 : 0;
      lastPoolCheck = now;
      
      // CRITICAL FIX: Monitor connection queue
      if (dbStats.waitingClients > 0) {
        logger.warn('Connection queue building up', {
          waitingClients: dbStats.waitingClients,
          utilizationPercent: cachedPoolUtilization,
          activeConnections: dbStats.totalConnections,
          poolMax: dbStats.poolMax
        });
      }
    }
    
    // CRITICAL FIX: Graceful degradation - allow read-only operations between 80-90%
    if (cachedPoolUtilization > GRACEFUL_DEGRADATION_THRESHOLD && cachedPoolUtilization <= CIRCUIT_BREAKER_THRESHOLD) {
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
        logger.warn('Graceful degradation - write operations blocked', {
          utilizationPercent: cachedPoolUtilization,
          method: req.method,
          path: req.path
        });
        
        res.status(503).json({
          error: 'Service Degraded',
          message: 'Database under high load. Only read operations allowed.',
          retryAfter: 10
        });
        return;
      }
    }
    
    if (cachedPoolUtilization > CIRCUIT_BREAKER_THRESHOLD) {
      tripCount++;
      lastTripTime = now;
      
      // CRITICAL FIX: Alert on repeated circuit breaker trips
      if (tripCount >= TRIP_ALERT_THRESHOLD) {
        const windowStart = now - TRIP_WINDOW_MS;
        if (lastTripTime > windowStart) {
          logger.error('ALERT: Circuit breaker tripped repeatedly', undefined, {
            trips: tripCount,
            windowMs: TRIP_WINDOW_MS,
            utilizationPercent: cachedPoolUtilization,
            threshold: CIRCUIT_BREAKER_THRESHOLD
          });
          // Reset counter after alerting
          tripCount = 0;
        }
      }
      
      logger.warn('Circuit breaker triggered - pool exhausted', {
        utilizationPercent: cachedPoolUtilization,
        threshold: CIRCUIT_BREAKER_THRESHOLD,
        path: req.path,
        method: req.method,
        requestId: res.locals.requestId,
        tripCount
      });
      
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database connection pool exhausted. Please try again later.',
        retryAfter: 30
      });
      return;
    }
    
    // Reset trip count after successful request when utilization is normal
    if (cachedPoolUtilization < GRACEFUL_DEGRADATION_THRESHOLD && tripCount > 0) {
      tripCount = 0;
    }
    
    next();
  } catch (error) {
    logger.error('Circuit breaker error', error instanceof Error ? error : undefined, {
      requestId: res.locals.requestId
    });
    next();
  }
}
