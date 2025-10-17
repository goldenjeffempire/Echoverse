/**
 * Timing-safe string comparison
 * Prevents timing attacks by ensuring comparison time is constant
 */

import crypto from 'crypto';

/**
 * Compare two strings in constant time to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns true if strings match, false otherwise
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    throw new TypeError('Arguments must be strings');
  }

  // Convert to buffers for constant-time comparison
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');

  // If lengths differ, use dummy comparison to maintain constant time
  if (bufferA.length !== bufferB.length) {
    // Still compare to prevent timing leaks
    crypto.timingSafeEqual(
      crypto.createHash('sha256').update(bufferA).digest(),
      crypto.createHash('sha256').update(bufferB).digest()
    );
    return false;
  }

  try {
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}
