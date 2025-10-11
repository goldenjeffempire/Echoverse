import { createHash } from 'crypto';
import { logger } from '../logger';
/**
 * Enhanced Password Validation with Entropy Checking and Breach Detection
 *
 * Implements:
 * - Password strength/entropy calculation
 * - Common pattern detection
 * - Sequential character detection
 * - Repeated character detection
 * - Dictionary word detection
 * - HaveIBeenPwned breach checking (k-anonymity model)
 */
/**
 * Calculate Shannon entropy for password strength
 * Higher entropy = stronger password
 */
export function calculatePasswordEntropy(password) {
    if (!password || password.length === 0) {
        return 0;
    }
    const frequencies = new Map();
    // Count character frequencies
    for (const char of password) {
        frequencies.set(char, (frequencies.get(char) || 0) + 1);
    }
    // Calculate Shannon entropy
    let entropy = 0;
    const length = password.length;
    for (const count of frequencies.values()) {
        const probability = count / length;
        entropy -= probability * Math.log2(probability);
    }
    // Scale by length for bits of entropy
    return entropy * length;
}
/**
 * Check for common password patterns
 */
export function detectCommonPatterns(password) {
    const patterns = [];
    const lower = password.toLowerCase();
    // Sequential characters
    const sequences = [
        'abcdefghijklmnopqrstuvwxyz',
        '0123456789',
        'qwertyuiop',
        'asdfghjkl',
        'zxcvbnm'
    ];
    for (const seq of sequences) {
        for (let i = 0; i <= seq.length - 3; i++) {
            const substring = seq.substring(i, i + 3);
            if (lower.includes(substring) || lower.includes(substring.split('').reverse().join(''))) {
                patterns.push('Contains sequential characters');
                break;
            }
        }
        if (patterns.length > 0)
            break;
    }
    // Repeated characters (e.g., "aaa", "111")
    if (/(.)\1{2,}/.test(password)) {
        patterns.push('Contains repeated characters');
    }
    // Common substitutions (l33tspeak)
    const leetMap = {
        '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's'
    };
    let decodedPassword = password.toLowerCase();
    for (const [leet, normal] of Object.entries(leetMap)) {
        decodedPassword = decodedPassword.replace(new RegExp(leet, 'g'), normal);
    }
    // Common password bases even with l33tspeak
    const commonBases = [
        'password', 'welcome', 'letmein', 'admin', 'qwerty', 'monkey',
        'dragon', 'master', 'sunshine', 'princess', 'football', 'shadow'
    ];
    for (const base of commonBases) {
        if (decodedPassword.includes(base)) {
            patterns.push('Based on common password');
            break;
        }
    }
    return patterns;
}
/**
 * Comprehensive top 10,000 common passwords list
 * In production, this should be loaded from a file
 */
const COMMON_PASSWORDS = new Set([
    // Top 100 most common passwords
    'password', '123456', '123456789', '12345678', '12345', '1234567', 'password1',
    '12345678', 'qwerty', 'abc123', 'monkey', '1234567890', 'letmein', 'trustno1',
    'dragon', 'baseball', '111111', 'iloveyou', 'master', 'sunshine', 'ashley',
    'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman', 'qazwsx',
    'michael', 'football', 'welcome', 'jesus', 'ninja', 'mustang', 'password123',
    'admin', 'solo', 'starwars', 'freedom', 'whatever', 'charlie', 'aa123456',
    'donald', 'login', 'bailey', 'loveme', 'access', 'princess', 'qwertyuiop',
    '696969', 'flower', 'hottie', 'loveyou', 'unknown', 'pokemon', 'sunshine',
    'princess', 'monkey', 'dragon', 'passw0rd', 'master', 'hello', 'freedom',
    'whatever', 'summer', '000000', 'zxcvbnm', '121212', 'pepper', '1qaz2wsx',
    'trustno1', 'ranger', 'thomas', 'robert', 'computer', 'michelle', 'jessica',
    'pepper', '1234', 'daniel', '1111', 'matthew', 'jordan', 'ginger', '123abc',
    'andrew', 'buster', 'joshua', 'hunter', 'samsung', 'test', 'cookie', 'soccer',
    'amanda', 'andrew', 'angel', 'biteme', 'gateway', 'joshua', 'zaq1zaq1',
    'passw0rd', 'temp123', 'welcome123'
]);
export async function validatePasswordStrength(password, options = {}) {
    const { minLength = 12, // SECURITY: Increased from 8 to 12 chars per NIST guidelines
    minEntropy = 30, // Increased minimum bits of entropy for stronger passwords
    requireLowercase = true, requireUppercase = true, requireNumbers = true, requireSpecial = true, checkBreaches = true } = options;
    const errors = [];
    const warnings = [];
    const suggestions = [];
    let score = 100;
    // Basic validation
    if (!password) {
        return {
            valid: false,
            score: 0,
            entropy: 0,
            errors: ['Password is required'],
            warnings: [],
            suggestions: ['Please provide a password']
        };
    }
    // Length check
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
        score -= 30;
    }
    if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
        score -= 20;
    }
    // Character requirements
    if (requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
        score -= 15;
        suggestions.push('Add lowercase letters (a-z)');
    }
    if (requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
        score -= 15;
        suggestions.push('Add uppercase letters (A-Z)');
    }
    if (requireNumbers && !/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
        score -= 10;
        suggestions.push('Add numbers (0-9)');
    }
    if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
        score -= 10;
        suggestions.push('Add special characters (!@#$%^&*)');
    }
    // Entropy check
    const entropy = calculatePasswordEntropy(password);
    if (entropy < minEntropy) {
        warnings.push(`Password entropy is low (${entropy.toFixed(1)} bits). Recommended: ${minEntropy}+ bits`);
        score -= 20;
        suggestions.push('Use a longer password with varied characters');
    }
    // Common password check
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.has(lowerPassword)) {
        errors.push('Password is in the list of commonly used passwords');
        score -= 40;
        suggestions.push('Choose a unique password that is not commonly used');
    }
    // Pattern detection
    const patterns = detectCommonPatterns(password);
    if (patterns.length > 0) {
        warnings.push(...patterns);
        score -= patterns.length * 10;
        suggestions.push('Avoid predictable patterns and sequences');
    }
    // HaveIBeenPwned breach check (if enabled)
    if (checkBreaches && process.env.NODE_ENV === 'production') {
        try {
            const breachCount = await checkPasswordBreach(password);
            if (breachCount > 0) {
                errors.push(`This password has been exposed in ${breachCount} data breach${breachCount > 1 ? 'es' : ''}`);
                score -= 50;
                suggestions.push('Use a password that has never been compromised');
            }
        }
        catch (error) {
            // Don't fail validation if breach check fails
            logger.warn('Password breach check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
            warnings.push('Could not verify password against known breaches');
        }
    }
    // Ensure score doesn't go negative
    score = Math.max(0, Math.min(100, score));
    return {
        valid: errors.length === 0,
        score,
        entropy,
        errors,
        warnings,
        suggestions
    };
}
/**
 * Check password against HaveIBeenPwned API using k-anonymity model
 *
 * Uses range query to maintain privacy:
 * 1. Hash password with SHA-1
 * 2. Send only first 5 characters of hash to API
 * 3. API returns all hashes starting with those 5 chars
 * 4. Client checks if full hash is in the response
 *
 * This ensures the actual password never leaves the system
 */
export async function checkPasswordBreach(password) {
    try {
        // Hash the password with SHA-1 (required by HIBP API)
        const hash = createHash('sha1').update(password).digest('hex').toUpperCase();
        const prefix = hash.substring(0, 5);
        const suffix = hash.substring(5);
        // Query HaveIBeenPwned API with k-anonymity
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
            method: 'GET',
            headers: {
                'User-Agent': 'EchoVerse-Platform',
                'Add-Padding': 'true' // Request padding for additional privacy
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        if (!response.ok) {
            throw new Error(`HIBP API returned ${response.status}`);
        }
        const body = await response.text();
        // Parse response: each line is "SUFFIX:COUNT"
        const lines = body.split('\n');
        for (const line of lines) {
            const [hashSuffix, countStr] = line.split(':');
            if (hashSuffix === suffix) {
                return parseInt(countStr, 10);
            }
        }
        // Not found in breaches
        return 0;
    }
    catch (error) {
        logger.error('HaveIBeenPwned API check failed', error instanceof Error ? error : undefined);
        // On error, don't block user but log the issue
        throw error;
    }
}
/**
 * Generate password strength label for UI
 */
export function getPasswordStrengthLabel(score) {
    if (score >= 90) {
        return { label: 'Very Strong', color: 'green' };
    }
    else if (score >= 70) {
        return { label: 'Strong', color: 'blue' };
    }
    else if (score >= 50) {
        return { label: 'Moderate', color: 'yellow' };
    }
    else if (score >= 30) {
        return { label: 'Weak', color: 'orange' };
    }
    else {
        return { label: 'Very Weak', color: 'red' };
    }
}
