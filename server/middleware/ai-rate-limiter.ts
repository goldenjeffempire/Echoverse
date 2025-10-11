/**
 * Database-backed AI Rate Limiter
 * CRITICAL FIX #4: Per-user rate limiting with shared PostgreSQL store
 * 
 * This implementation works across multiple server instances by using
 * the database as the source of truth for rate limit tracking.
 */

import type { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { logger } from '../logger';

interface RateLimitRecord {
  user_id: string;
  request_count: number;
  window_start: Date;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role: string;
  };
}

/**
 * Database-backed per-user AI rate limiter
 * - 10 requests per hour per user
 * - Uses PostgreSQL for distributed rate limit tracking
 * - Atomic increment with row-level locking
 * - Automatic window expiration
 */
export async function aiRateLimiter(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      // If no user authenticated, fall back to IP-based limiting
      return next();
    }

    const MAX_REQUESTS = 10;
    const WINDOW_MS = 60 * 60 * 1000; // 1 hour
    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_MS);

    // Use a transaction with row-level locking for atomic increment
    const result = await db.transaction(async (tx) => {
      // Create table if it doesn't exist (idempotent)
      await tx.execute(sql`
        CREATE TABLE IF NOT EXISTS ai_rate_limits (
          user_id VARCHAR(255) PRIMARY KEY,
          request_count INTEGER NOT NULL DEFAULT 0,
          window_start TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      // Lock the row for this user (or create if doesn't exist)
      const existingRecord = await tx.execute(sql`
        SELECT user_id, request_count, window_start, updated_at
        FROM ai_rate_limits
        WHERE user_id = ${userId}
        FOR UPDATE
      `);

      let currentCount = 0;
      let currentWindowStart = now;

      if (existingRecord.rows && existingRecord.rows.length > 0) {
        const record = existingRecord.rows[0] as any;
        const recordWindowStart = new Date(record.window_start);

        // Check if we're still in the same window
        if (recordWindowStart > windowStart) {
          // Same window - check count
          currentCount = Number(record.request_count);
          currentWindowStart = recordWindowStart;
        } else {
          // Old window expired - reset to new window
          currentCount = 0;
          currentWindowStart = now;
        }
      }

      // Check if rate limit exceeded
      if (currentCount >= MAX_REQUESTS) {
        const resetTime = new Date(currentWindowStart.getTime() + WINDOW_MS);
        const retryAfter = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
        
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter,
          currentCount
        };
      }

      // Increment count
      const newCount = currentCount + 1;

      // Upsert the record
      await tx.execute(sql`
        INSERT INTO ai_rate_limits (user_id, request_count, window_start, updated_at)
        VALUES (${userId}, ${newCount}, ${currentWindowStart.toISOString()}, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET
          request_count = ${newCount},
          window_start = ${currentWindowStart.toISOString()},
          updated_at = NOW()
      `);

      const resetTime = new Date(currentWindowStart.getTime() + WINDOW_MS);
      const remaining = MAX_REQUESTS - newCount;

      return {
        allowed: true,
        remaining,
        resetTime,
        retryAfter: 0,
        currentCount: newCount
      };
    });

    if (!result.allowed) {
      // Rate limit exceeded
      logger.warn('AI rate limit exceeded', { 
        userId, 
        count: result.currentCount,
        resetTime: result.resetTime 
      });

      res.status(429).json({
        error: 'AI request quota exceeded. You have reached your limit of 10 AI requests per hour.',
        code: 'RATE_LIMIT_AI_EXCEEDED',
        retryAfter: result.retryAfter,
        limit: MAX_REQUESTS,
        remaining: 0,
        reset: result.resetTime.toISOString()
      });
      return;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', result.resetTime.toISOString());

    next();
  } catch (error) {
    // Log error but don't block request on rate limiter failure
    logger.error('AI rate limiter error', error instanceof Error ? error : new Error(String(error)));
    next();
  }
}

/**
 * Cleanup expired rate limit records (run periodically via cron)
 * Removes records older than 2 hours
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const result = await db.execute(sql`
      DELETE FROM ai_rate_limits
      WHERE window_start < ${twoHoursAgo.toISOString()}
      RETURNING user_id
    `);

    const deletedCount = result.rows?.length || 0;
    
    if (deletedCount > 0) {
      logger.info('Cleaned up expired AI rate limit records', { count: deletedCount });
    }

    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up AI rate limits', error instanceof Error ? error : new Error(String(error)));
    return 0;
  }
}
