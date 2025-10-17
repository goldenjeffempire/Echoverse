/**
 * SECURITY FIX (CRIT-019): Bcrypt Configuration
 * Increase bcrypt rounds to 14+ for enhanced security
 */

import bcrypt from 'bcrypt';
import { logger } from '../logger';

// OWASP recommends 12-14 rounds minimum for 2024+
// 14 rounds = ~1.5 seconds per hash on modern hardware
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '14', 10);

// Validate rounds in acceptable range (10-16)
if (BCRYPT_ROUNDS < 10 || BCRYPT_ROUNDS > 16) {
  const error = new Error(`BCRYPT_ROUNDS must be between 10 and 16 (current: ${BCRYPT_ROUNDS})`);
  logger.error(error.message, error);
  process.exit(1);
}

// Production requires minimum 14 rounds
if (process.env.NODE_ENV === 'production' && BCRYPT_ROUNDS < 14) {
  const error = new Error(`BCRYPT_ROUNDS must be at least 14 in production (current: ${BCRYPT_ROUNDS})`);
  logger.error(error.message, error);
  process.exit(1);
}

logger.info('Bcrypt configuration initialized', {
  rounds: BCRYPT_ROUNDS,
  environment: process.env.NODE_ENV
});

/**
 * Hash password with configured bcrypt rounds
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare password with hash using timing-safe comparison
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Get current bcrypt rounds from hash
 */
export function getHashRounds(hash: string): number {
  const rounds = bcrypt.getRounds(hash);
  return rounds;
}

/**
 * Check if hash needs re-hashing due to outdated rounds
 */
export function needsRehash(hash: string): boolean {
  const currentRounds = getHashRounds(hash);
  return currentRounds < BCRYPT_ROUNDS;
}

/**
 * Rehash password if rounds are outdated
 * Use during login to gradually upgrade old hashes
 */
export async function rehashIfNeeded(
  password: string,
  currentHash: string
): Promise<string | null> {
  if (needsRehash(currentHash)) {
    logger.info('Rehashing password with updated rounds', {
      oldRounds: getHashRounds(currentHash),
      newRounds: BCRYPT_ROUNDS
    });
    return hashPassword(password);
  }
  return null;
}

export { BCRYPT_ROUNDS };
