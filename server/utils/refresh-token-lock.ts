import { logger } from '../logger';

/**
 * Refresh Token Concurrency Lock
 * 
 * Prevents concurrent refresh token attacks by ensuring only one refresh
 * operation can occur per session at a time.
 * 
 * Attack scenario this prevents:
 * - Attacker intercepts a valid refresh token
 * - Attacker and legitimate user both try to use it simultaneously
 * - Without locking, both might succeed and get new tokens
 * - With locking, only one succeeds, the other is blocked and flagged
 */

interface RefreshLock {
  sessionId: string;
  acquiredAt: number;
  expiresAt: number;
}

// In-memory lock store (in production, use Redis for distributed locking)
const refreshLocks = new Map<string, RefreshLock>();

// CRITICAL FIX: Environment-aware timeout to handle database lag
const LOCK_TIMEOUT = parseInt(process.env.REFRESH_LOCK_TIMEOUT || '10000', 10); // 10 seconds default
const CLEANUP_INTERVAL = 60000; // Clean up expired locks every 60 seconds
const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY = 200; // milliseconds

/**
 * Acquire a lock for refresh token operation with exponential backoff retry
 */
export async function acquireRefreshLock(
  sessionId: string, 
  attempt: number = 1
): Promise<boolean> {
  const now = Date.now();
  const existingLock = refreshLocks.get(sessionId);

  // Check if there's an existing valid lock
  if (existingLock && existingLock.expiresAt > now) {
    if (attempt >= MAX_RETRY_ATTEMPTS) {
      logger.warn('Concurrent refresh token attempt detected - max retries exceeded', {
        sessionId: sessionId.substring(0, 8) + '...',
        lockAge: now - existingLock.acquiredAt,
        attempts: attempt
      });
      return false; // Lock is held by another operation, max retries reached
    }

    // CRITICAL FIX: Exponential backoff with jitter
    const delay = BASE_RETRY_DELAY * Math.pow(2, attempt - 1) + Math.random() * 100;
    const cappedDelay = Math.min(delay, 2000); // Cap at 2 seconds
    
    logger.debug('Retrying lock acquisition with exponential backoff', {
      sessionId: sessionId.substring(0, 8) + '...',
      attempt,
      delay: cappedDelay
    });
    
    await new Promise(resolve => setTimeout(resolve, cappedDelay));
    return acquireRefreshLock(sessionId, attempt + 1);
  }

  // Acquire the lock
  const lock: RefreshLock = {
    sessionId,
    acquiredAt: now,
    expiresAt: now + LOCK_TIMEOUT,
  };

  refreshLocks.set(sessionId, lock);

  logger.debug('Refresh lock acquired', {
    sessionId: sessionId.substring(0, 8) + '...',
    attempts: attempt
  });

  return true;
}

/**
 * Release a lock for refresh token operation
 */
export function releaseRefreshLock(sessionId: string): void {
  const deleted = refreshLocks.delete(sessionId);
  
  if (deleted) {
    logger.debug('Refresh lock released', {
      sessionId: sessionId.substring(0, 8) + '...',
    });
  }
}

/**
 * Clean up expired locks
 */
function cleanupExpiredLocks(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [sessionId, lock] of refreshLocks.entries()) {
    if (lock.expiresAt <= now) {
      refreshLocks.delete(sessionId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug('Cleaned up expired refresh locks', { count: cleaned });
  }
}

/**
 * Check if a session has an active lock
 */
export function hasActiveLock(sessionId: string): boolean {
  const lock = refreshLocks.get(sessionId);
  return lock !== undefined && lock.expiresAt > Date.now();
}

/**
 * Get lock statistics (for monitoring)
 */
export function getRefreshLockStats(): {
  total: number;
  active: number;
  expired: number;
} {
  const now = Date.now();
  let active = 0;
  let expired = 0;

  for (const lock of refreshLocks.values()) {
    if (lock.expiresAt > now) {
      active++;
    } else {
      expired++;
    }
  }

  return {
    total: refreshLocks.size,
    active,
    expired,
  };
}

/**
 * Clear all locks (for testing)
 */
export function clearAllRefreshLocks(): void {
  const count = refreshLocks.size;
  refreshLocks.clear();
  logger.info('All refresh locks cleared', { count });
}

// Start automatic cleanup
const cleanupInterval = setInterval(cleanupExpiredLocks, CLEANUP_INTERVAL);

// CRITICAL FIX: Ensure cleanup on process crash/shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received - cleaning up refresh locks');
  clearInterval(cleanupInterval);
  refreshLocks.clear();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received - cleaning up refresh locks');
  clearInterval(cleanupInterval);
  refreshLocks.clear();
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception - cleaning up refresh locks', error);
  clearInterval(cleanupInterval);
  refreshLocks.clear();
});

logger.info('Refresh token lock system initialized', {
  lockTimeout: LOCK_TIMEOUT,
  cleanupInterval: CLEANUP_INTERVAL,
  maxRetryAttempts: MAX_RETRY_ATTEMPTS,
  baseRetryDelay: BASE_RETRY_DELAY
});
