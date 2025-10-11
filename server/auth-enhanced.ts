/**
 * Enhanced Authentication Module
 * 
 * Implements advanced security features:
 * - Account lockout mechanism
 * - Login attempt tracking
 * - Password reset flow with secure tokens
 * - Session tracking with IP/device information
 * - Brute force protection
 */

import { db } from "./db";
import { loginAttempts, accountLockouts, passwordResetTokens, users, passwordHistory, sessions } from "@shared/schema";
import { eq, and, gte, desc, sql, lte } from "drizzle-orm";
import { randomBytes, createHash, createHmac } from "crypto";
import type { Request } from "express";
import bcrypt from "bcrypt";
import { 
  detectIpChange, 
  detectUserAgentChange, 
  generateDeviceFingerprint as genFingerprint 
} from "./utils/security";
import { logger } from "./logger";

// Configuration constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15; // PHASE 1: Set to 15 minutes as per security requirements
const PROGRESSIVE_LOCKOUT_THRESHOLD = 10; // Second threshold for 24hr lockout
const EXTENDED_LOCKOUT_DURATION_HOURS = 24;
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;
const LOGIN_ATTEMPT_WINDOW_MINUTES = 15;
const PASSWORD_HISTORY_COUNT = 12; // Industry standard 12-24, using 12 for balance

/**
 * Extract client information from request
 */
export function getClientInfo(req: Request) {
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
                   (req.headers['x-real-ip'] as string) ||
                   req.socket.remoteAddress ||
                   'unknown';
  
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Simple device type detection
  const ua = userAgent.toLowerCase();
  let deviceType = 'desktop';
  if (ua.includes('mobile')) deviceType = 'mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'tablet';
  
  // Generate device fingerprint (simple version)
  const fingerprintData = `${ipAddress}-${userAgent}`;
  const deviceFingerprint = createHash('sha256').update(fingerprintData).digest('hex');
  
  return {
    ipAddress,
    userAgent,
    deviceType,
    deviceFingerprint
  };
}

/**
 * Record a login attempt
 */
export async function recordLoginAttempt(
  identifier: string,
  ipAddress: string,
  userAgent: string,
  successful: boolean,
  failureReason?: string
): Promise<void> {
  await db.insert(loginAttempts).values({
    identifier,
    ipAddress,
    userAgent,
    successful,
    failureReason,
    attemptedAt: new Date()
  });
}

/**
 * Get recent failed login attempts for an identifier
 */
export async function getRecentFailedAttempts(
  identifier: string,
  ipAddress: string
): Promise<number> {
  const windowStart = new Date(Date.now() - LOGIN_ATTEMPT_WINDOW_MINUTES * 60 * 1000);
  
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.identifier, identifier),
        eq(loginAttempts.ipAddress, ipAddress),
        eq(loginAttempts.successful, false),
        gte(loginAttempts.attemptedAt, windowStart)
      )
    );
  
  return Number(result[0]?.count || 0);
}

/**
 * Check if an account is currently locked
 */
export async function isAccountLocked(userId: string): Promise<{ locked: boolean; until?: Date; reason?: string }> {
  const lockout = await db
    .select()
    .from(accountLockouts)
    .where(
      and(
        eq(accountLockouts.userId, userId),
        eq(accountLockouts.unlocked, false),
        gte(accountLockouts.lockedUntil, new Date())
      )
    )
    .limit(1);
  
  if (lockout.length === 0) {
    return { locked: false };
  }
  
  return {
    locked: true,
    until: lockout[0].lockedUntil,
    reason: lockout[0].lockReason || undefined
  };
}

/**
 * Lock an account due to too many failed attempts
 */
export async function lockAccount(
  userId: string,
  reason: string,
  durationMinutes: number = LOCKOUT_DURATION_MINUTES
): Promise<void> {
  const lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
  
  // Check if there's already an active lockout
  const existing = await db
    .select()
    .from(accountLockouts)
    .where(
      and(
        eq(accountLockouts.userId, userId),
        eq(accountLockouts.unlocked, false)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing lockout
    await db
      .update(accountLockouts)
      .set({
        lockedUntil,
        lockReason: reason,
        failedAttempts: sql`${accountLockouts.failedAttempts} + 1`,
        lastAttemptAt: new Date()
      })
      .where(eq(accountLockouts.id, existing[0].id));
  } else {
    // Create new lockout
    await db.insert(accountLockouts).values({
      userId,
      lockedUntil,
      lockReason: reason,
      failedAttempts: 1,
      lastAttemptAt: new Date()
    });
  }
}

/**
 * Unlock an account manually
 */
export async function unlockAccount(userId: string): Promise<void> {
  await db
    .update(accountLockouts)
    .set({
      unlocked: true,
      unlockedAt: new Date()
    })
    .where(
      and(
        eq(accountLockouts.userId, userId),
        eq(accountLockouts.unlocked, false)
      )
    );
}

/**
 * Progressive account lockout based on failed attempts
 * 5 attempts = 30 min lockout
 * 10 attempts = 24 hour lockout
 */
export async function checkAndLockIfNeeded(
  identifier: string,
  ipAddress: string,
  userId?: string
): Promise<void> {
  if (!userId) return;
  
  const failedAttempts = await getRecentFailedAttempts(identifier, ipAddress);
  
  // Progressive lockout implementation
  if (failedAttempts >= PROGRESSIVE_LOCKOUT_THRESHOLD) {
    // 10+ attempts = 24 hour lockout
    await lockAccount(
      userId,
      `Account locked for 24 hours due to ${failedAttempts} failed login attempts from IP ${ipAddress}`,
      EXTENDED_LOCKOUT_DURATION_HOURS * 60
    );
  } else if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
    // 5-9 attempts = 30 minute lockout
    await lockAccount(
      userId,
      `Account locked due to ${failedAttempts} failed login attempts from IP ${ipAddress}`,
      LOCKOUT_DURATION_MINUTES
    );
  }
}

/**
 * Generate a secure password reset token
 */
export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a password reset token
 * SECURITY: Token is HMAC'd with server secret for enhanced security
 */
export async function createPasswordResetToken(
  userId: string,
  ipAddress: string,
  userAgent: string,
  deviceFingerprint?: string
): Promise<string> {
  const token = generateResetToken();
  const hmacSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET!;
  const tokenHmac = createHmac('sha256', hmacSecret)
    .update(token + userId + (deviceFingerprint || ''))
    .digest('hex');
  
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  
  await db.insert(passwordResetTokens).values({
    userId,
    token: tokenHmac, // Store HMAC'd token bound to user and device
    expiresAt,
    ipAddress,
    userAgent,
    used: false
  });
  
  return token; // Return original token to send in email
}

/**
 * Validate and use a password reset token
 * CRITICAL FIX #4: Validate IP and User-Agent to prevent token theft
 * P0 FIX #18: Atomic check-and-mark-as-used to enforce single-use (prevents race conditions)
 * SECURITY: Hash incoming token to compare with stored hash, validate context
 */
export async function validatePasswordResetToken(
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  
  // P0 FIX #18: Use atomic UPDATE with WHERE clause to check and mark as used in one query
  // This prevents race conditions where multiple requests could validate the same token
  const result = await db
    .update(passwordResetTokens)
    .set({ 
      used: true, 
      usedAt: new Date() 
    })
    .where(
      and(
        eq(passwordResetTokens.token, tokenHash),
        eq(passwordResetTokens.used, false), // Only update if not already used
        gte(passwordResetTokens.expiresAt, new Date()) // Only update if not expired
      )
    )
    .returning();
  
  if (result.length === 0) {
    // Token doesn't exist, already used, or expired
    const checkToken = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, tokenHash))
      .limit(1);
    
    if (checkToken.length === 0) {
      return { valid: false, error: 'Invalid token' };
    }
    
    if (checkToken[0].used) {
      return { valid: false, error: 'Token already used' };
    }
    
    if (new Date() > checkToken[0].expiresAt) {
      return { valid: false, error: 'Token expired' };
    }
    
    return { valid: false, error: 'Token validation failed' };
  }
  
  const tokenData = result[0];
  
  // CRITICAL FIX #4: Validate IP and User-Agent match (security against token theft)
  if (ipAddress && tokenData.ipAddress && ipAddress !== tokenData.ipAddress) {
    logger.warn('Password reset token used from different IP', {
      userId: tokenData.userId,
      storedIp: tokenData.ipAddress,
      requestIp: ipAddress
    });
    
    // Rollback the "used" flag since validation failed
    await db
      .update(passwordResetTokens)
      .set({ used: false, usedAt: null })
      .where(eq(passwordResetTokens.token, tokenHash));
    
    return { valid: false, error: 'Token validation failed - security check' };
  }
  
  if (userAgent && tokenData.userAgent && userAgent !== tokenData.userAgent) {
    logger.warn('Password reset token used from different User-Agent', {
      userId: tokenData.userId,
      storedUA: tokenData.userAgent,
      requestUA: userAgent
    });
    
    // Rollback the "used" flag since validation failed
    await db
      .update(passwordResetTokens)
      .set({ used: false, usedAt: null })
      .where(eq(passwordResetTokens.token, tokenHash));
    
    return { valid: false, error: 'Token validation failed - security check' };
  }
  
  return { valid: true, userId: tokenData.userId };
}

/**
 * Mark a password reset token as used
 * SECURITY: Hash token before lookup
 */
export async function markTokenAsUsed(token: string): Promise<void> {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  
  await db
    .update(passwordResetTokens)
    .set({
      used: true,
      usedAt: new Date()
    })
    .where(eq(passwordResetTokens.token, tokenHash));
}

/**
 * Clean up expired password reset tokens
 */
export async function cleanupExpiredResetTokens(): Promise<void> {
  const now = new Date();
  await db.delete(passwordResetTokens).where(
    and(
      sql`${passwordResetTokens.expiresAt} < ${now}`,
      eq(passwordResetTokens.used, false)
    )
  );
}

/**
 * Clean up expired account lockouts
 */
export async function cleanupExpiredLockouts(): Promise<void> {
  const now = new Date();
  await db
    .update(accountLockouts)
    .set({
      unlocked: true,
      unlockedAt: now
    })
    .where(
      and(
        sql`${accountLockouts.lockedUntil} < ${now}`,
        eq(accountLockouts.unlocked, false)
      )
    );
}

/**
 * Get security statistics for a user
 */
export async function getUserSecurityStats(userId: string) {
  const [recentAttempts, lockouts, user] = await Promise.all([
    db
      .select()
      .from(loginAttempts)
      .where(
        and(
          sql`${loginAttempts.identifier} IN (SELECT username FROM ${users} WHERE id = ${userId})
              OR ${loginAttempts.identifier} IN (SELECT email FROM ${users} WHERE id = ${userId})`,
          gte(loginAttempts.attemptedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        )
      )
      .orderBy(desc(loginAttempts.attemptedAt))
      .limit(50),
    
    db
      .select()
      .from(accountLockouts)
      .where(eq(accountLockouts.userId, userId))
      .orderBy(desc(accountLockouts.createdAt))
      .limit(10),
    
    db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
  ]);
  
  const successfulAttempts = recentAttempts.filter(a => a.successful).length;
  const failedAttempts = recentAttempts.filter(a => !a.successful).length;
  const activeLockout = lockouts.find(l => !l.unlocked && new Date() < l.lockedUntil);
  
  return {
    userId,
    twoFactorEnabled: user[0]?.twoFactorEnabled || false,
    recentActivity: {
      successfulLogins: successfulAttempts,
      failedLogins: failedAttempts,
      totalAttempts: recentAttempts.length
    },
    lockoutHistory: lockouts.map(l => ({
      lockedAt: l.lockedAt,
      lockedUntil: l.lockedUntil,
      reason: l.lockReason,
      unlocked: l.unlocked,
      unlockedAt: l.unlockedAt
    })),
    currentlyLocked: !!activeLockout,
    lockedUntil: activeLockout?.lockedUntil
  };
}

/**
 * Password History Management
 */

/**
 * Add password to user's password history
 */
export async function addPasswordToHistory(
  userId: string,
  passwordHash: string
): Promise<void> {
  await db.insert(passwordHistory).values({
    userId,
    passwordHash,
    createdAt: new Date()
  });
  
  // Clean up old password history (keep only last N passwords)
  const allHistory = await db
    .select()
    .from(passwordHistory)
    .where(eq(passwordHistory.userId, userId))
    .orderBy(desc(passwordHistory.createdAt));
  
  if (allHistory.length > PASSWORD_HISTORY_COUNT) {
    const toDelete = allHistory.slice(PASSWORD_HISTORY_COUNT);
    for (const old of toDelete) {
      await db.delete(passwordHistory).where(eq(passwordHistory.id, old.id));
    }
  }
}

/**
 * Check if password was used recently (password reuse prevention)
 */
export async function isPasswordReused(
  userId: string,
  newPassword: string
): Promise<boolean> {
  const history = await db
    .select()
    .from(passwordHistory)
    .where(eq(passwordHistory.userId, userId))
    .orderBy(desc(passwordHistory.createdAt))
    .limit(PASSWORD_HISTORY_COUNT);
  
  // Check if new password matches any in history
  for (const record of history) {
    const matches = await bcrypt.compare(newPassword, record.passwordHash);
    if (matches) {
      return true;
    }
  }
  
  return false;
}

/**
 * Session Security
 */

/**
 * Regenerate session ID to prevent session fixation
 * Returns new session ID
 */
export function regenerateSessionId(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validate session security (check for hijacking)
 */
export async function validateSessionSecurity(
  sessionId: string,
  currentIp: string,
  currentUserAgent: string,
  strictIpCheck: boolean = false
): Promise<{
  valid: boolean;
  reason?: string;
  suspiciousActivity?: boolean;
}> {
  const sessionData = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  
  if (sessionData.length === 0) {
    return { valid: false, reason: 'Session not found' };
  }
  
  const session = sessionData[0];
  
  // Check if session is expired
  if (new Date() > session.expiresAt) {
    return { valid: false, reason: 'Session expired' };
  }
  
  // Check for IP address change
  const ipChanged = detectIpChange(session.ipAddress, currentIp, strictIpCheck);
  if (ipChanged) {
    return {
      valid: false,
      reason: 'IP address changed',
      suspiciousActivity: true
    };
  }
  
  // Check for User-Agent change
  const uaChanged = detectUserAgentChange(session.userAgent, currentUserAgent);
  if (uaChanged) {
    return {
      valid: false,
      reason: 'User-Agent changed',
      suspiciousActivity: true
    };
  }
  
  // Validate device fingerprint
  const currentFingerprint = genFingerprint(currentIp, currentUserAgent);
  if (session.deviceFingerprint && session.deviceFingerprint !== currentFingerprint) {
    return {
      valid: false,
      reason: 'Device fingerprint mismatch',
      suspiciousActivity: true
    };
  }
  
  return { valid: true };
}

/**
 * Update session activity timestamp and validate security
 */
export async function updateSessionActivity(
  sessionId: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await db
    .update(sessions)
    .set({
      lastActivityAt: new Date(),
      ipAddress,
      userAgent
    })
    .where(eq(sessions.id, sessionId));
}

/**
 * Create session with security binding
 */
export async function createSecureSession(
  userId: string,
  ipAddress: string,
  userAgent: string,
  deviceType: string,
  expiryMs: number = 24 * 60 * 60 * 1000 // 24 hours default
): Promise<string> {
  const sessionId = regenerateSessionId();
  const deviceFingerprint = genFingerprint(ipAddress, userAgent);
  const expiresAt = new Date(Date.now() + expiryMs);
  
  await db.insert(sessions).values({
    id: sessionId,
    userId,
    ipAddress,
    userAgent,
    deviceType,
    deviceFingerprint,
    expiresAt,
    lastActivityAt: new Date(),
    createdAt: new Date()
  });
  
  return sessionId;
}

/**
 * Invalidate session (for logout or security breach)
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

/**
 * Invalidate all sessions for a user (except optionally one)
 */
export async function invalidateAllUserSessionsExcept(
  userId: string,
  exceptSessionId?: string
): Promise<void> {
  if (exceptSessionId) {
    await db
      .delete(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          sql`${sessions.id} != ${exceptSessionId}`
        )
      );
  } else {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }
}
