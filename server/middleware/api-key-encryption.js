/**
 * SECURITY FIX (CRIT-013): API Key Encryption at Rest
 * Encrypts API keys in database using AES-256-GCM
 */
import crypto from 'crypto';
import { logger } from '../logger';
// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
/**
 * Derive encryption key from master key using PBKDF2
 */
function deriveKey(masterKey, salt) {
    return crypto.pbkdf2Sync(masterKey, salt, 100000, // iterations
    32, // key length (256 bits)
    'sha256');
}
/**
 * Get or generate master encryption key
 */
function getMasterKey() {
    const masterKey = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (!masterKey) {
        logger.error('ENCRYPTION_KEY or JWT_SECRET not set');
        throw new Error('Encryption key not configured');
    }
    if (masterKey.length < 32) {
        const error = new Error('Encryption key must be at least 32 characters');
        logger.error('Encryption key too short', error);
        throw error;
    }
    return masterKey;
}
/**
 * Encrypt API key for storage
 */
export function encryptApiKey(apiKey) {
    try {
        const masterKey = getMasterKey();
        // Generate random salt and IV
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);
        // Derive encryption key
        const key = deriveKey(masterKey, salt);
        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        // Encrypt
        let encrypted = cipher.update(apiKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Get authentication tag
        const authTag = cipher.getAuthTag();
        // Combine salt + iv + authTag + encrypted data
        const combined = Buffer.concat([
            salt,
            iv,
            authTag,
            Buffer.from(encrypted, 'hex')
        ]);
        // Return base64 encoded
        return combined.toString('base64');
    }
    catch (err) {
        logger.error('API key encryption failed', err instanceof Error ? err : new Error('Unknown error'));
        throw new Error('Failed to encrypt API key');
    }
}
/**
 * Decrypt API key from storage
 */
export function decryptApiKey(encryptedData) {
    try {
        const masterKey = getMasterKey();
        // Decode from base64
        const combined = Buffer.from(encryptedData, 'base64');
        // Extract components
        const salt = combined.subarray(0, SALT_LENGTH);
        const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
        const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
        // Derive encryption key
        const key = deriveKey(masterKey, salt);
        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        // Decrypt
        let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (err) {
        logger.error('API key decryption failed', err instanceof Error ? err : new Error('Unknown error'));
        throw new Error('Failed to decrypt API key');
    }
}
/**
 * Hash API key for lookup (one-way)
 * Used for validating API keys without storing them plaintext
 */
export function hashApiKey(apiKey) {
    return crypto
        .createHash('sha256')
        .update(apiKey)
        .digest('hex');
}
/**
 * Generate secure random API key
 */
export function generateApiKey(prefix = 'sk') {
    const randomBytes = crypto.randomBytes(32);
    const key = randomBytes.toString('base64')
        .replace(/\+/g, '')
        .replace(/\//g, '')
        .replace(/=/g, '')
        .substring(0, 48);
    return `${prefix}_${key}`;
}
/**
 * Validate API key format
 */
export function validateApiKeyFormat(apiKey) {
    // Check for valid prefix and length
    const prefixPattern = /^(sk|pk|test)_[A-Za-z0-9]{48}$/;
    return prefixPattern.test(apiKey);
}
/**
 * Rotate encryption key (re-encrypt all API keys)
 * Should be run periodically or after key compromise
 */
export async function rotateEncryptionKey(oldMasterKey, newMasterKey, encryptedKeys) {
    logger.info('Starting API key re-encryption', {
        count: encryptedKeys.length
    });
    const reencrypted = [];
    for (const encryptedKey of encryptedKeys) {
        try {
            // Decrypt with old key
            const plainKey = decryptApiKey(encryptedKey);
            // Temporarily override master key
            process.env.ENCRYPTION_KEY = newMasterKey;
            // Re-encrypt with new key
            const newEncrypted = encryptApiKey(plainKey);
            reencrypted.push(newEncrypted);
        }
        catch (err) {
            logger.error('Failed to re-encrypt API key', err instanceof Error ? err : new Error('Unknown error'));
            throw err;
        }
    }
    logger.info('API key re-encryption completed', {
        count: reencrypted.length
    });
    return reencrypted;
}
