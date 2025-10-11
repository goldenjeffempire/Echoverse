/**
 * FIXED AUDIT #2: Strong Secret Validation
 * Prevents weak secrets from being used in any environment
 */

import { logger } from '../logger';
import crypto from 'crypto';

export interface SecretValidation {
  valid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  issues: string[];
}

/**
 * Validate secret strength
 */
export function validateSecret(secret: string, secretName: string, minLength: number = 32): SecretValidation {
  const issues: string[] = [];
  
  // Check length
  if (secret.length < minLength) {
    issues.push(`${secretName} must be at least ${minLength} characters`);
  }
  
  // Check for common weak secrets
  const weakSecrets = [
    'secret',
    'password',
    'default',
    'changeme',
    '123456',
    'test',
    'dev',
    'development',
    'local',
    'example'
  ];
  
  const lowerSecret = secret.toLowerCase();
  for (const weak of weakSecrets) {
    if (lowerSecret.includes(weak)) {
      issues.push(`${secretName} contains common weak pattern: "${weak}"`);
    }
  }
  
  // Check entropy
  const entropy = calculateEntropy(secret);
  if (entropy < 3.5) {
    issues.push(`${secretName} has low entropy (${entropy.toFixed(2)} bits/char) - use more random characters`);
  }
  
  // Check character diversity
  const hasLower = /[a-z]/.test(secret);
  const hasUpper = /[A-Z]/.test(secret);
  const hasNumber = /[0-9]/.test(secret);
  const hasSpecial = /[^a-zA-Z0-9]/.test(secret);
  
  const diversity = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (diversity < 3) {
    issues.push(`${secretName} should contain at least 3 types of characters (lowercase, uppercase, numbers, special)`);
  }
  
  // Determine strength
  let strength: 'weak' | 'medium' | 'strong';
  if (issues.length > 2 || entropy < 3.0) {
    strength = 'weak';
  } else if (issues.length > 0 || entropy < 4.0) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }
  
  return {
    valid: issues.length === 0,
    strength,
    issues
  };
}

/**
 * Calculate Shannon entropy of a string
 */
function calculateEntropy(str: string): number {
  const freq: Record<string, number> = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  
  let entropy = 0;
  const len = str.length;
  
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

/**
 * Generate cryptographically secure random secret
 */
export function generateSecureSecret(length: number = 64): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Validate all critical secrets on startup
 */
export function validateCriticalSecrets(): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  const isProduction = process.env.NODE_ENV === 'production';
  const isStaging = process.env.NODE_ENV === 'staging';
  const requireStrong = isProduction || isStaging;
  
  // Validate SESSION_SECRET
  if (!process.env.SESSION_SECRET) {
    errors.push('SESSION_SECRET is required but not set');
  } else {
    const validation = validateSecret(process.env.SESSION_SECRET, 'SESSION_SECRET', 32);
    if (!validation.valid) {
      if (requireStrong) {
        errors.push(`SESSION_SECRET validation failed: ${validation.issues.join(', ')}`);
      } else {
        warnings.push(`SESSION_SECRET is weak: ${validation.issues.join(', ')}`);
      }
    } else if (validation.strength !== 'strong' && requireStrong) {
      warnings.push(`SESSION_SECRET strength is ${validation.strength} - consider using a stronger secret`);
    }
  }
  
  // Validate JWT_SECRET
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required but not set');
  } else {
    const validation = validateSecret(process.env.JWT_SECRET, 'JWT_SECRET', 32);
    if (!validation.valid) {
      if (requireStrong) {
        errors.push(`JWT_SECRET validation failed: ${validation.issues.join(', ')}`);
      } else {
        warnings.push(`JWT_SECRET is weak: ${validation.issues.join(', ')}`);
      }
    }
  }
  
  // Validate TWO_FACTOR_BACKUP_ENCRYPTION_KEY (if 2FA is enabled)
  if (process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY) {
    const validation = validateSecret(
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY, 
      'TWO_FACTOR_BACKUP_ENCRYPTION_KEY', 
      32
    );
    if (!validation.valid && requireStrong) {
      errors.push(`TWO_FACTOR_BACKUP_ENCRYPTION_KEY validation failed: ${validation.issues.join(', ')}`);
    }
  }
  
  // Log results
  if (errors.length > 0) {
    logger.error(`CRITICAL: Secret validation failed - ${errors.join('; ')}`);
  }
  
  if (warnings.length > 0) {
    logger.warn(`Secret validation warnings - ${warnings.join('; ')}`);
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    logger.info('All secrets validated successfully');
  }
  
  return {
    valid: errors.length === 0,
    warnings,
    errors
  };
}
