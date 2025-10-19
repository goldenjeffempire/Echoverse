import { createHash } from 'crypto';
import { logger } from '../logger';
/**
 * HaveIBeenPwned (HIBP) Password Breach Detection Service
 *
 * Uses the k-Anonymity model to securely check passwords against known data breaches
 * without sending the full password to the HIBP API.
 *
 * How it works:
 * 1. Hash the password with SHA-1
 * 2. Send only the first 5 characters of the hash to HIBP
 * 3. HIBP returns all hashes starting with those 5 characters
 * 4. Check if the full hash exists in the returned list
 */
const HIBP_API_URL = 'https://api.pwnedpasswords.com/range';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const REQUEST_TIMEOUT = 5000; // 5 seconds
// Simple in-memory cache for breach check results
const breachCache = new Map();
/**
 * Check if a password has been exposed in known data breaches
 */
export async function checkPasswordBreach(password) {
    try {
        // Hash the password with SHA-1 (HIBP uses SHA-1)
        const sha1Hash = createHash('sha1').update(password).digest('hex').toUpperCase();
        const hashPrefix = sha1Hash.substring(0, 5);
        const hashSuffix = sha1Hash.substring(5);
        // Check cache first
        const cached = breachCache.get(sha1Hash);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            logger.debug('HIBP cache hit', { hashPrefix });
            return { breached: cached.breached };
        }
        // Make request to HIBP API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
        try {
            const response = await fetch(`${HIBP_API_URL}/${hashPrefix}`, {
                method: 'GET',
                headers: {
                    'User-Agent': 'EchoVerse-Platform',
                    'Add-Padding': 'true', // Request padding for additional privacy
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HIBP API returned ${response.status}`);
            }
            const text = await response.text();
            const hashes = text.split('\r\n');
            // Check if our hash suffix exists in the response
            for (const line of hashes) {
                const [suffix, countStr] = line.split(':');
                if (suffix === hashSuffix) {
                    const count = parseInt(countStr, 10);
                    // Cache the result
                    breachCache.set(sha1Hash, { breached: true, timestamp: Date.now() });
                    logger.warn('Password found in breach database', {
                        hashPrefix,
                        occurrences: count
                    });
                    return { breached: true, count };
                }
            }
            // Password not found in breaches
            breachCache.set(sha1Hash, { breached: false, timestamp: Date.now() });
            logger.debug('Password not found in breach database', { hashPrefix });
            return { breached: false };
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    catch (error) {
        // If HIBP is down or network error, don't block user but log the error
        logger.error('HIBP breach check failed', error instanceof Error ? error : undefined, {
            errorMessage: error?.message || String(error)
        });
        return {
            breached: false,
            error: 'Unable to verify password against breach database. Please choose a strong password.'
        };
    }
}
/**
 * Validate password strength and check for breaches
 */
export async function validatePasswordSecurity(password) {
    const errors = [];
    const warnings = [];
    // Basic strength checks
    if (password.length < 12) {
        errors.push('Password must be at least 12 characters long');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};:'",.<>?/\\|`~]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    // Common password patterns
    const commonPatterns = [
        /^(.)\1+$/, // All same character
        /^(012|123|234|345|456|567|678|789|890)+/, // Sequential numbers
        /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+/i, // Sequential letters
    ];
    for (const pattern of commonPatterns) {
        if (pattern.test(password)) {
            errors.push('Password contains predictable patterns');
            break;
        }
    }
    // Check against breach database
    if (errors.length === 0) {
        const breachCheck = await checkPasswordBreach(password);
        if (breachCheck.error) {
            warnings.push(breachCheck.error);
        }
        else if (breachCheck.breached) {
            errors.push(`This password has been exposed in ${breachCheck.count} data ${breachCheck.count === 1 ? 'breach' : 'breaches'}. Please choose a different password.`);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
/**
 * Clear the breach cache (useful for testing or memory management)
 */
export function clearBreachCache() {
    breachCache.clear();
    logger.info('HIBP breach cache cleared');
}
/**
 * Get cache statistics
 */
export function getBreachCacheStats() {
    return {
        size: breachCache.size,
        entries: breachCache.size,
    };
}
