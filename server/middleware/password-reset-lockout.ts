/**
 * Password Reset Lockout Mechanism
 * PHASE 1: CRITICAL SECURITY - Account lockout for password reset attempts
 * 
 * Prevents brute force attacks on password reset flow:
 * - Tracks failed password reset attempts per email/IP
 * - Implements progressive lockout (5 attempts = 15 min lockout, 10 attempts = 1 hour)
 * - Validates redirect URLs against whitelist
 */

import type { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { logger } from '../logger';

interface PasswordResetAttempt {
  email: string;
  ip: string;
  attempt_count: number;
  locked_until: Date | null;
  last_attempt: Date;
}

const MAX_ATTEMPTS_TIER_1 = 5;
const MAX_ATTEMPTS_TIER_2 = 10;
const LOCKOUT_DURATION_TIER_1 = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION_TIER_2 = 60 * 60 * 1000; // 1 hour
const LOCKOUT_DURATION_TIER_3 = 24 * 60 * 60 * 1000; // 24 hours

// Whitelist of allowed redirect URLs for password reset
const REDIRECT_URL_WHITELIST = [
  process.env.APP_URL || 'http://localhost:5000',
  'http://localhost:5000',
  'http://localhost:3000',
  // Add production domains here
];

/**
 * Validate redirect URL against whitelist
 */
export function validateRedirectUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsedUrl = new URL(url);
    
    // Check if the origin is in the whitelist
    return REDIRECT_URL_WHITELIST.some(allowed => {
      const allowedUrl = new URL(allowed);
      return parsedUrl.origin === allowedUrl.origin;
    });
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Check if email/IP is locked out from password reset
 */
export async function checkPasswordResetLockout(
  email: string,
  ip: string
): Promise<{ locked: boolean; lockedUntil?: Date; remainingAttempts?: number }> {
  
  try {
    // Create table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS password_reset_attempts (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        ip VARCHAR(45) NOT NULL,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        locked_until TIMESTAMP,
        last_attempt TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(email, ip)
      )
    `);
    
    const now = new Date();
    
    // Get current attempt record
    const result = await db.execute(sql`
      SELECT email, ip, attempt_count, locked_until, last_attempt
      FROM password_reset_attempts
      WHERE email = ${email} AND ip = ${ip}
    `);
    
    if (!result.rows || result.rows.length === 0) {
      return { locked: false, remainingAttempts: MAX_ATTEMPTS_TIER_1 };
    }
    
    const record = result.rows[0] as any;
    const lockedUntil = record.locked_until ? new Date(record.locked_until) : null;
    
    // Check if currently locked
    if (lockedUntil && lockedUntil > now) {
      return {
        locked: true,
        lockedUntil,
        remainingAttempts: 0
      };
    }
    
    // If lockout expired, reset the counter
    if (lockedUntil && lockedUntil <= now) {
      await db.execute(sql`
        UPDATE password_reset_attempts
        SET attempt_count = 0, locked_until = NULL
        WHERE email = ${email} AND ip = ${ip}
      `);
      return { locked: false, remainingAttempts: MAX_ATTEMPTS_TIER_1 };
    }
    
    const attemptCount = Number(record.attempt_count);
    const remaining = Math.max(0, MAX_ATTEMPTS_TIER_1 - attemptCount);
    
    return {
      locked: false,
      remainingAttempts: remaining
    };
    
  } catch (error) {
    logger.error('Error checking password reset lockout', error instanceof Error ? error : new Error(String(error)));
    // Fail open - don't block legitimate users on error
    return { locked: false };
  }
}

/**
 * Record password reset attempt and apply lockout if needed
 */
export async function recordPasswordResetAttempt(
  email: string,
  ip: string,
  success: boolean = false
): Promise<void> {
  
  try {
    const now = new Date();
    
    // Get current attempt count
    const result = await db.execute(sql`
      SELECT attempt_count FROM password_reset_attempts
      WHERE email = ${email} AND ip = ${ip}
    `);
    
    let attemptCount = result.rows && result.rows.length > 0 
      ? Number((result.rows[0] as any).attempt_count) 
      : 0;
    
    if (success) {
      // Reset on success
      await db.execute(sql`
        DELETE FROM password_reset_attempts
        WHERE email = ${email} AND ip = ${ip}
      `);
      return;
    }
    
    // Increment failure count
    attemptCount += 1;
    
    // Determine lockout duration based on attempt count
    let lockedUntil: Date | null = null;
    
    if (attemptCount >= MAX_ATTEMPTS_TIER_2 + 5) {
      // 15+ attempts = 24 hour lockout
      lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_TIER_3);
    } else if (attemptCount >= MAX_ATTEMPTS_TIER_2) {
      // 10+ attempts = 1 hour lockout
      lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_TIER_2);
    } else if (attemptCount >= MAX_ATTEMPTS_TIER_1) {
      // 5+ attempts = 15 minute lockout
      lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_TIER_1);
    }
    
    // Upsert attempt record
    await db.execute(sql`
      INSERT INTO password_reset_attempts (email, ip, attempt_count, locked_until, last_attempt)
      VALUES (${email}, ${ip}, ${attemptCount}, ${lockedUntil?.toISOString() || null}, NOW())
      ON CONFLICT (email, ip)
      DO UPDATE SET
        attempt_count = ${attemptCount},
        locked_until = ${lockedUntil?.toISOString() || null},
        last_attempt = NOW()
    `);
    
    if (lockedUntil) {
      logger.warn('Password reset lockout applied', {
        email,
        ip,
        attemptCount,
        lockedUntil: lockedUntil.toISOString()
      });
    }
    
  } catch (error) {
    logger.error('Error recording password reset attempt', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Middleware to check password reset lockout
 */
export async function passwordResetLockoutMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  
  const { email } = req.body;
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
             req.ip || 
             req.socket.remoteAddress || 
             'unknown';
  
  if (!email) {
    return next();
  }
  
  const lockoutStatus = await checkPasswordResetLockout(email, ip);
  
  if (lockoutStatus.locked) {
    const retryAfter = lockoutStatus.lockedUntil 
      ? Math.ceil((lockoutStatus.lockedUntil.getTime() - Date.now()) / 1000)
      : 900; // Default 15 minutes
    
    res.status(429).json({
      error: 'Too many password reset attempts',
      code: 'PASSWORD_RESET_LOCKED',
      message: `Account temporarily locked due to too many password reset attempts. Please try again later.`,
      retryAfter,
      lockedUntil: lockoutStatus.lockedUntil?.toISOString()
    });
    return;
  }
  
  next();
}

/**
 * Middleware to validate redirect URL
 */
export function validateRedirectUrlMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  
  const redirectUrl = req.body.redirectUrl || req.query.redirectUrl as string;
  
  if (redirectUrl && !validateRedirectUrl(redirectUrl)) {
    logger.warn('Invalid redirect URL in password reset', {
      url: redirectUrl,
      ip: req.ip
    });
    
    res.status(400).json({
      error: 'Invalid redirect URL',
      code: 'INVALID_REDIRECT_URL',
      message: 'The provided redirect URL is not allowed'
    });
    return;
  }
  
  next();
}

/**
 * Cleanup expired lockout records (run periodically)
 */
export async function cleanupExpiredLockouts(): Promise<number> {
  try {
    const result = await db.execute(sql`
      DELETE FROM password_reset_attempts
      WHERE locked_until IS NOT NULL AND locked_until < NOW()
      RETURNING id
    `);
    
    const deletedCount = result.rows?.length || 0;
    
    if (deletedCount > 0) {
      logger.info('Cleaned up expired password reset lockouts', { count: deletedCount });
    }
    
    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up lockouts', error instanceof Error ? error : new Error(String(error)));
    return 0;
  }
}
