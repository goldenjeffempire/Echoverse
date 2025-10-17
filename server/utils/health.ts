/**
 * Health Check & Monitoring System
 * Provides health endpoints and system monitoring
 */

import type { Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: HealthCheck;
    memory: HealthCheck;
    aiProvider?: HealthCheck;
    redis?: HealthCheck;
    stripe?: HealthCheck;
    disk?: HealthCheck;
  };
}

export interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  responseTime?: number;
  details?: any;
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    const responseTime = Date.now() - start;
    
    return {
      status: responseTime < 100 ? 'pass' : 'warn',
      responseTime,
      details: {
        connected: true,
        latency: `${responseTime}ms`
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      details: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const usage = process.memoryUsage();
  const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
  
  let status: 'pass' | 'warn' | 'fail' = 'pass';
  if (heapUsedPercent > 90) status = 'fail';
  else if (heapUsedPercent > 80) status = 'warn';
  
  return {
    status,
    details: {
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsedPercent: `${heapUsedPercent.toFixed(2)}%`,
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`
    }
  };
}

/**
 * PHASE 1: API RELIABILITY - Check AI Provider Health
 */
async function checkAIProvider(): Promise<HealthCheck> {
  try {
    // Simple health check - verify AI router module is available
    await import('../ai-providers/router');
    
    const ollamaConfigured = !!process.env.OLLAMA_ENDPOINT;
    const openaiConfigured = !!process.env.OPENAI_API_KEY;
    
    return {
      status: openaiConfigured || ollamaConfigured ? 'pass' : 'warn',
      details: {
        ollama: ollamaConfigured ? 'configured' : 'not configured',
        openai: openaiConfigured ? 'configured' : 'not configured'
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      details: {
        error: error instanceof Error ? error.message : 'AI provider check failed'
      }
    };
  }
}

/**
 * PHASE 1: API RELIABILITY - Check Redis Health
 */
async function checkRedis(): Promise<HealthCheck | undefined> {
  if (!process.env.REDIS_URL) {
    return undefined; // Redis not configured
  }
  
  const start = Date.now();
  try {
    const { getRedisClient, isRedisConnected } = await import('../config/redis-production');
    const client = getRedisClient();
    const connected = isRedisConnected();
    
    if (client && connected) {
      // Test Redis with ping
      await client.ping();
      return {
        status: 'pass',
        responseTime: Date.now() - start,
        details: {
          message: 'Redis connected and responsive'
        }
      };
    } else {
      return {
        status: 'warn',
        responseTime: Date.now() - start,
        details: {
          message: 'Redis configured but not connected (using in-memory fallback)'
        }
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      details: {
        error: error instanceof Error ? error.message : 'Redis connection failed'
      }
    };
  }
}

/**
 * PHASE 1: API RELIABILITY - Check Stripe Health
 */
async function checkStripe(): Promise<HealthCheck> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      status: 'warn',
      details: { message: 'Stripe not configured' }
    };
  }
  
  const start = Date.now();
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20' as any,
      typescript: true,
    });
    
    // Simple API call to verify connectivity
    await stripe.balance.retrieve();
    
    return {
      status: 'pass',
      responseTime: Date.now() - start,
      details: {
        connected: true,
        latency: `${Date.now() - start}ms`
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      details: {
        connected: false,
        error: error instanceof Error ? error.message : 'Stripe API error'
      }
    };
  }
}

/**
 * Get overall health status
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const [database, memory, aiProvider, redis, stripe] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkMemory()),
    checkAIProvider(),
    checkRedis(),
    checkStripe()
  ]);
  
  const checks: any = { database, memory };
  if (aiProvider) checks.aiProvider = aiProvider;
  if (redis) checks.redis = redis;
  if (stripe) checks.stripe = stripe;
  
  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  // Critical failures (database is critical)
  if (database.status === 'fail') {
    status = 'unhealthy';
  }
  // Degraded if AI provider fails (but fallback works) or other warnings
  else if (
    database.status === 'warn' || 
    memory.status === 'warn' || 
    aiProvider?.status === 'warn' ||
    stripe?.status === 'warn'
  ) {
    status = 'degraded';
  }
  // Unhealthy if AI provider completely fails or Stripe fails
  else if (aiProvider?.status === 'fail' || stripe?.status === 'fail') {
    status = 'degraded'; // Degraded not unhealthy, since these aren't critical
  }
  
  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    checks
  };
}

/**
 * Health check endpoint handler
 */
export async function healthCheckHandler(req: Request, res: Response): Promise<void> {
  try {
    const health = await getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Ready check (for Kubernetes/container orchestration)
 */
export async function readyCheckHandler(req: Request, res: Response): Promise<void> {
  try {
    const dbCheck = await checkDatabase();
    
    if (dbCheck.status === 'fail') {
      res.status(503).json({
        ready: false,
        reason: 'Database unavailable'
      });
      return;
    }
    
    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      reason: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Liveness check (for Kubernetes/container orchestration)
 */
export function livenessCheckHandler(req: Request, res: Response): void {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}

/**
 * Graceful shutdown handler
 */
let isShuttingDown = false;

export function setupGracefulShutdown(server: any): void {
  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    // Graceful shutdown initiated
    
    // Stop accepting new connections
    server.close(async () => {
      // Server closed, cleaning up resources
      
      try {
        // Add any cleanup logic here (close DB connections, etc.)
        // Cleanup completed successfully
        process.exit(0);
      } catch (error) {
        // Error during cleanup
        process.exit(1);
      }
    });
    
    // Force shutdown after timeout
    setTimeout(() => {
      // Forced shutdown after timeout
      process.exit(1);
    }, 30000); // 30 seconds
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

/**
 * Middleware to reject requests during shutdown
 */
export function shutdownMiddleware(req: Request, res: Response, next: Function): void {
  if (isShuttingDown) {
    res.set('Connection', 'close');
    res.status(503).json({
      error: 'Server is shutting down',
      timestamp: new Date().toISOString()
    });
    return;
  }
  next();
}
