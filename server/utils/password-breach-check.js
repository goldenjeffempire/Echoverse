/**
 * Have I Been Pwned (HIBP) Password Breach Checking
 * HIGH PRIORITY #14: Integration with HIBP API
 *
 * Uses k-anonymity model - only sends first 5 chars of SHA-1 hash
 * Never sends actual password or full hash over the network
 */
import { createHash } from 'crypto';
import { logger } from '../logger';
const HIBP_API_URL = 'https://api.pwnedpasswords.com/range/';
/**
 * Check if a password has been compromised in known data breaches
 * Uses HIBP Pwned Passwords API with k-anonymity
 *
 * @param password - The password to check
 * @returns Object containing breach status and count
 */
export async function checkPasswordBreach(password) {
    try {
        // 1. Hash the password with SHA-1 (HIBP requirement)
        const sha1Hash = createHash('sha1')
            .update(password)
            .digest('hex')
            .toUpperCase();
        // 2. Take first 5 characters (k-anonymity - don't send full hash)
        const hashPrefix = sha1Hash.substring(0, 5);
        const hashSuffix = sha1Hash.substring(5);
        // 3. Query HIBP API with just the prefix
        const response = await fetch(`${HIBP_API_URL}${hashPrefix}`, {
            headers: {
                'User-Agent': 'EchoVerse-Platform-Security-Check',
                'Add-Padding': 'true' // Request padding for additional privacy
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        if (!response.ok) {
            logger.warn('HIBP API request failed', {
                status: response.status,
                statusText: response.statusText
            });
            // Don't block registration on API failure
            return {
                isBreached: false,
                breachCount: 0,
                recommendation: 'Unable to verify password security. Please use a strong, unique password.'
            };
        }
        // 4. Parse response - format is "SUFFIX:COUNT\n"
        const text = await response.text();
        const hashes = text.split('\n');
        // 5. Check if our hash suffix appears in the results
        for (const line of hashes) {
            const [suffix, countStr] = line.split(':');
            if (suffix.trim() === hashSuffix) {
                const breachCount = parseInt(countStr.trim(), 10);
                logger.info('Password breach detected', {
                    breachCount,
                    severity: breachCount > 100 ? 'critical' : breachCount > 10 ? 'high' : 'medium'
                });
                return {
                    isBreached: true,
                    breachCount,
                    recommendation: getBreachRecommendation(breachCount)
                };
            }
        }
        // Password not found in breaches
        return {
            isBreached: false,
            breachCount: 0
        };
    }
    catch (error) {
        logger.error('Password breach check error', error instanceof Error ? error : new Error(String(error)));
        // Don't block user operations on API errors
        return {
            isBreached: false,
            breachCount: 0,
            recommendation: 'Unable to verify password security. Please use a strong, unique password.'
        };
    }
}
/**
 * Get recommendation based on breach severity
 */
function getBreachRecommendation(breachCount) {
    if (breachCount > 100) {
        return `This password has appeared in ${breachCount.toLocaleString()} data breaches and is extremely insecure. Please choose a different password immediately.`;
    }
    else if (breachCount > 10) {
        return `This password has appeared in ${breachCount} data breaches. We strongly recommend choosing a different password.`;
    }
    else {
        return `This password has appeared in ${breachCount} data breaches. Consider using a more unique password.`;
    }
}
/**
 * Middleware to check password breaches during registration
 * Can be used as Express middleware
 */
export async function enforcePasswordBreachCheck(password, options = {}) {
    const { blockBreachedPasswords = false, minBreachThreshold = 1 } = options;
    const result = await checkPasswordBreach(password);
    // If password is breached
    if (result.isBreached && result.breachCount >= minBreachThreshold) {
        if (blockBreachedPasswords) {
            // Hard block
            return {
                allowed: false,
                error: result.recommendation || 'This password has been compromised in data breaches. Please choose a different password.'
            };
        }
        else {
            // Soft warning (allow but warn user)
            return {
                allowed: true,
                warning: result.recommendation
            };
        }
    }
    // Password is safe (or API check failed - fail open for usability)
    return {
        allowed: true
    };
}
/**
 * Get password strength score including breach check
 *
 * @param password - Password to evaluate
 * @returns Score from 0-100 and detailed feedback
 */
export async function getPasswordSecurityScore(password) {
    const feedback = [];
    let score = 100;
    // Check password breach
    const breachResult = await checkPasswordBreach(password);
    if (breachResult.isBreached) {
        // Severe penalty for breached passwords
        const breachPenalty = Math.min(breachResult.breachCount, 50);
        score -= breachPenalty;
        feedback.push(breachResult.recommendation || 'Password has been compromised');
    }
    // Check length - SECURITY: 12+ chars required per NIST guidelines
    if (password.length < 12) {
        score -= 30;
        feedback.push('Password must be at least 12 characters long');
    }
    else if (password.length < 16) {
        score -= 10;
        feedback.push('Consider using a longer password (16+ characters) for better security');
    }
    // Check complexity
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasLower) {
        score -= 10;
        feedback.push('Add lowercase letters');
    }
    if (!hasUpper) {
        score -= 10;
        feedback.push('Add uppercase letters');
    }
    if (!hasNumber) {
        score -= 10;
        feedback.push('Add numbers');
    }
    if (!hasSpecial) {
        score -= 10;
        feedback.push('Add special characters (!@#$%^&*)');
    }
    // Check for common patterns
    if (/^(.)\1+$/.test(password)) {
        score -= 30;
        feedback.push('Avoid repeated characters');
    }
    if (/^(123|abc|qwerty)/i.test(password)) {
        score -= 25;
        feedback.push('Avoid sequential or keyboard patterns');
    }
    return {
        score: Math.max(0, score),
        isBreached: breachResult.isBreached,
        breachCount: breachResult.breachCount,
        feedback
    };
}
