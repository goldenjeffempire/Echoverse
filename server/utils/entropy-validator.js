/**
 * SECURITY FIX (CRIT-003): Session Secret Entropy Validation
 * Validates cryptographic entropy of secrets to prevent weak secrets
 */
/**
 * Calculate Shannon entropy of a string
 * Returns bits of entropy per character
 */
function calculateEntropy(str) {
    const len = str.length;
    const frequencies = {};
    // Count character frequencies
    for (const char of str) {
        frequencies[char] = (frequencies[char] || 0) + 1;
    }
    // Calculate Shannon entropy
    let entropy = 0;
    for (const freq of Object.values(frequencies)) {
        const probability = freq / len;
        entropy -= probability * Math.log2(probability);
    }
    return entropy;
}
/**
 * Validate secret has sufficient entropy
 * @param secret - The secret string to validate
 * @param minEntropy - Minimum bits of entropy per character (default 3.0)
 * @param minLength - Minimum length (default 32)
 * @returns Object with isValid flag and issues array
 */
export function validateSecretEntropy(secret, minEntropy = 3.0, minLength = 32) {
    const issues = [];
    // Check length
    if (secret.length < minLength) {
        issues.push(`Secret must be at least ${minLength} characters long`);
    }
    // Calculate entropy
    const entropy = calculateEntropy(secret);
    if (entropy < minEntropy) {
        issues.push(`Secret has insufficient entropy (${entropy.toFixed(2)} bits/char, minimum ${minEntropy})`);
    }
    // Check for repeated patterns
    if (/(.)\1{5,}/.test(secret)) {
        issues.push('Secret contains repeated character patterns');
    }
    // Check for sequential patterns
    if (/012345|23456|34567|45678|56789|abcdef|bcdefg|cdefgh|defghi|efghij/.test(secret.toLowerCase())) {
        issues.push('Secret contains sequential patterns');
    }
    // Check for character diversity
    const hasLower = /[a-z]/.test(secret);
    const hasUpper = /[A-Z]/.test(secret);
    const hasDigit = /\d/.test(secret);
    const hasSpecial = /[^a-zA-Z0-9]/.test(secret);
    const charTypes = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
    if (charTypes < 3) {
        issues.push(`Secret should contain at least 3 types of characters (lowercase, uppercase, numbers, special)`);
    }
    // Check for common weak patterns
    const weakPatterns = [
        'password', 'secret', 'admin', '12345', 'qwerty', 'abc123',
        'letmein', 'welcome', 'monkey', 'dragon', 'master', 'sunshine'
    ];
    const lowerSecret = secret.toLowerCase();
    for (const pattern of weakPatterns) {
        if (lowerSecret.includes(pattern)) {
            issues.push(`Secret contains common weak pattern: ${pattern}`);
            break;
        }
    }
    return {
        isValid: issues.length === 0,
        issues
    };
}
/**
 * Validate all critical secrets for production readiness
 */
export function validateAllCriticalSecrets(secrets) {
    const errors = [];
    const toValidate = [
        { name: 'JWT_SECRET', value: secrets.JWT_SECRET },
        { name: 'SESSION_SECRET', value: secrets.SESSION_SECRET },
        { name: 'TWO_FACTOR_BACKUP_ENCRYPTION_KEY', value: secrets.TWO_FACTOR_BACKUP_ENCRYPTION_KEY },
        { name: 'WEBHOOK_SIGNATURE_SECRET', value: secrets.WEBHOOK_SIGNATURE_SECRET },
    ];
    for (const { name, value } of toValidate) {
        if (!value) {
            errors.push(`${name} is not set`);
            continue;
        }
        const result = validateSecretEntropy(value);
        if (!result.isValid) {
            errors.push(`${name} is weak: ${result.issues.join(', ')}`);
        }
    }
    // Special validation for FILE_ENCRYPTION_KEY (must be 64 hex chars)
    if (secrets.FILE_ENCRYPTION_KEY) {
        if (!/^[0-9a-f]{64}$/i.test(secrets.FILE_ENCRYPTION_KEY)) {
            errors.push('FILE_ENCRYPTION_KEY must be exactly 64 hexadecimal characters');
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
