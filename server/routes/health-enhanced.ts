/**
 * Enhanced Health Check Endpoints
 * 
 * Comprehensive health monitoring for all system components
 */

import { Router } from 'express';
import { db, pool } from '../db';
import { logger } from '../logger';
import { getRedisClient, checkRedisAvailability } from '../config/redis-production';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
    ai: ComponentHealth;
    stripe: ComponentHealth;
    disk: ComponentHealth;
    memory: ComponentHealth;
  };
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<ComponentHealth> {
  const startTime = Date.now();
  
  try {
    // Use raw pool query instead of Drizzle ORM to avoid timeout issues
    await pool.query('SELECT 1');
    const responseTime = Date.now() - startTime;
    
    return {
      status: responseTime < 100 ? 'healthy' : 'degraded',
      responseTime,
      message: responseTime < 100 ? 'Database responsive' : 'Database slow',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Database connection failed',
      details: { error: (error as Error).message }
    };
  }
}

/**
 * Check Redis health
 */
async function checkRedis(): Promise<ComponentHealth> {
  const startTime = Date.now();
  
  try {
    if (!checkRedisAvailability()) {
      return {
        status: 'degraded',
        message: 'Redis not configured (using in-memory fallback)'
      };
    }

    const client = getRedisClient();
    if (!client) {
      return {
        status: 'degraded',
        message: 'Redis client not available'
      };
    }

    await client.ping();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      message: 'Redis responsive'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Redis connection failed',
      details: { error: (error as Error).message }
    };
  }
}

/**
 * Check AI providers health
 * ISSUE #18 FIX: Integrate AI provider health checks with main health endpoint
 */
async function checkAI(): Promise<ComponentHealth> {
  const startTime = Date.now();
  
  try {
    // Import AI health check function
    const { checkAIHealth } = await import('../ai');
    const health = await checkAIHealth();
    
    const responseTime = Date.now() - startTime;
    
    if (health.available && health.provider && health.fallback) {
      return {
        status: 'healthy',
        responseTime,
        message: 'All AI providers available',
        details: {
          primary: health.provider,
          fallback: health.fallback
        }
      };
    } else if (health.available) {
      return {
        status: 'degraded',
        responseTime,
        message: health.fallback ? 'Only fallback AI provider available' : 'Only primary AI provider available',
        details: {
          primary: health.provider,
          fallback: health.fallback
        }
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'No AI providers available',
        details: health
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'AI health check failed',
      details: { error: (error as Error).message }
    };
  }
}

/**
 * Check Stripe integration health
 */
async function checkStripe(): Promise<ComponentHealth> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        status: 'degraded',
        message: 'Stripe not configured'
      };
    }

    const stripe = (await import('stripe')).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil' as any,
      timeout: 3000 // 3 second timeout
    });

    const startTime = Date.now();
    await stripeClient.balance.retrieve();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      message: 'Stripe API responsive'
    };
  } catch (error) {
    return {
      status: 'degraded',
      message: 'Stripe check timeout or failed',
      details: { error: (error as Error).message }
    };
  }
}

/**
 * Check disk space
 */
async function checkDisk(): Promise<ComponentHealth> {
  try {
    const { statfs } = await import('fs/promises');
    const stats = await statfs('/');
    
    const totalGB = (stats.blocks * stats.bsize) / (1024 ** 3);
    const freeGB = (stats.bfree * stats.bsize) / (1024 ** 3);
    const usedPercent = ((totalGB - freeGB) / totalGB) * 100;
    
    return {
      status: usedPercent < 80 ? 'healthy' : usedPercent < 90 ? 'degraded' : 'unhealthy',
      message: `Disk ${usedPercent.toFixed(1)}% used`,
      details: { totalGB: totalGB.toFixed(2), freeGB: freeGB.toFixed(2), usedPercent: usedPercent.toFixed(1) }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Disk check failed',
      details: { error: (error as Error).message }
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): ComponentHealth {
  const usage = process.memoryUsage();
  const totalMB = (usage.heapTotal / 1024 / 1024).toFixed(2);
  const usedMB = (usage.heapUsed / 1024 / 1024).toFixed(2);
  const usedPercent = (usage.heapUsed / usage.heapTotal) * 100;
  
  return {
    status: usedPercent < 80 ? 'healthy' : usedPercent < 90 ? 'degraded' : 'unhealthy',
    message: `Memory ${usedPercent.toFixed(1)}% used`,
    details: { totalMB, usedMB, usedPercent: usedPercent.toFixed(1) }
  };
}

/**
 * GET /api/health - Comprehensive health check
 */
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Wrap each check with timeout to prevent hanging
    const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error(`Check timeout after ${ms}ms`)), ms)
        )
      ]);
    };

    const [database, redis, ai, stripe, disk, memory] = await Promise.all([
      withTimeout(checkDatabase(), 15000).catch((e): ComponentHealth => ({ 
        status: 'unhealthy', message: 'Database check timeout', details: { error: e.message } 
      })),
      withTimeout(checkRedis(), 5000).catch((e): ComponentHealth => ({ 
        status: 'degraded', message: 'Redis check timeout', details: { error: e.message } 
      })),
      withTimeout(checkAI(), 5000).catch((e): ComponentHealth => ({ 
        status: 'degraded', message: 'AI check timeout', details: { error: e.message } 
      })),
      withTimeout(checkStripe(), 5000).catch((e): ComponentHealth => ({ 
        status: 'degraded', message: 'Stripe check timeout', details: { error: e.message } 
      })),
      withTimeout(checkDisk(), 5000).catch((e): ComponentHealth => ({ 
        status: 'degraded', message: 'Disk check timeout', details: { error: e.message } 
      })),
      Promise.resolve(checkMemory())
    ]);

    const checks = { database, redis, ai, stripe, disk, memory };
    
    // Determine overall status
    const hasUnhealthy = Object.values(checks).some(check => check.status === 'unhealthy');
    const hasDegraded = Object.values(checks).some(check => check.status === 'degraded');
    
    const status: HealthStatus['status'] = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';
    
    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks
    };

    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    
    logger.info('Health check completed', {
      status,
      duration: Date.now() - startTime,
      httpStatus
    });

    res.status(httpStatus).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed', error as Error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
});

/**
 * GET /api/ready - Readiness probe for Kubernetes
 */
router.get('/ready', async (req, res) => {
  try {
    // Timeout helper
    const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error(`Check timeout after ${ms}ms`)), ms)
        )
      ]);
    };

    // Check critical components only
    const [database, ai] = await Promise.all([
      withTimeout(checkDatabase(), 15000).catch((e): ComponentHealth => ({ 
        status: 'unhealthy', message: 'Database check timeout', details: { error: e.message } 
      })),
      withTimeout(checkAI(), 5000).catch((e): ComponentHealth => ({ 
        status: 'degraded', message: 'AI check timeout', details: { error: e.message } 
      }))
    ]);

    const isReady = database.status !== 'unhealthy' && 
                   (ai.status === 'healthy' || ai.status === 'degraded');

    if (isReady) {
      res.status(200).json({ ready: true, timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ 
        ready: false, 
        timestamp: new Date().toISOString(),
        checks: { database, ai }
      });
    }
  } catch (error) {
    logger.error('Readiness check failed', error as Error);
    res.status(503).json({ ready: false, error: (error as Error).message });
  }
});

/**
 * GET /api/live - Liveness probe for Kubernetes
 */
router.get('/live', (req, res) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

export default router;
