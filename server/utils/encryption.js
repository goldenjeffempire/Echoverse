/**
 * Encryption utilities for sensitive data
 * Uses AES-256-GCM for authenticated encryption
 */
import crypto from 'crypto';
import { config } from '../config';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
/**
 * Derive encryption key from password using PBKDF2
 */
function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}
/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(text, password) {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    // Combine salt + iv + authTag + encrypted data
    return Buffer.concat([
        salt,
        iv,
        authTag,
        Buffer.from(encrypted, 'hex')
    ]).toString('base64');
}
/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(encryptedData, password) {
    try {
        const buffer = Buffer.from(encryptedData, 'base64');
        const salt = buffer.subarray(0, SALT_LENGTH);
        const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const authTag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
        const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
        const key = deriveKey(password, salt);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Invalid encrypted data or password'}`);
    }
}
/**
 * Encrypt 2FA backup codes for secure storage
 */
export function encrypt2FABackupCodes(codes) {
    if (!config.twoFactorEncryptionKey) {
        throw new Error('TWO_FACTOR_BACKUP_ENCRYPTION_KEY not configured. Backup codes cannot be encrypted.');
    }
    const codesJson = JSON.stringify(codes);
    return encrypt(codesJson, config.twoFactorEncryptionKey);
}
/**
 * Decrypt 2FA backup codes
 */
export function decrypt2FABackupCodes(encryptedCodes) {
    if (!config.twoFactorEncryptionKey) {
        throw new Error('TWO_FACTOR_BACKUP_ENCRYPTION_KEY not configured. Backup codes cannot be decrypted.');
    }
    const codesJson = decrypt(encryptedCodes, config.twoFactorEncryptionKey);
    return JSON.parse(codesJson);
}
/**
 * Generate secure random token for password resets, email verification, etc.
 */
export function generateSecureToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}
/**
 * Hash sensitive data (one-way)
 */
export function hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}
/**
 * Field-Level Encryption for PII (SSN, Credit Cards, etc.)
 * PHASE A: Critical Security - Encrypt sensitive personal data
 */
const FIELD_ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY || process.env.SESSION_SECRET;
export function encryptSensitiveField(data) {
    if (!FIELD_ENCRYPTION_KEY) {
        throw new Error('FIELD_ENCRYPTION_KEY not configured');
    }
    return encrypt(data, FIELD_ENCRYPTION_KEY);
}
export function decryptSensitiveField(encryptedData) {
    if (!FIELD_ENCRYPTION_KEY) {
        throw new Error('FIELD_ENCRYPTION_KEY not configured');
    }
    return decrypt(encryptedData, FIELD_ENCRYPTION_KEY);
}
export function encryptSSN(ssn) {
    const cleaned = ssn.replace(/[^0-9]/g, '');
    if (cleaned.length !== 9) {
        throw new Error('Invalid SSN format');
    }
    return encryptSensitiveField(cleaned);
}
export function decryptSSN(encryptedSSN) {
    const decrypted = decryptSensitiveField(encryptedSSN);
    return `${decrypted.slice(0, 3)}-${decrypted.slice(3, 5)}-${decrypted.slice(5)}`;
}
export function encryptCreditCard(cardNumber) {
    const cleaned = cardNumber.replace(/[^0-9]/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) {
        throw new Error('Invalid credit card format');
    }
    return encryptSensitiveField(cleaned);
}
export function decryptCreditCard(encryptedCard) {
    return decryptSensitiveField(encryptedCard);
}
export function maskCreditCard(encryptedCard) {
    try {
        const decrypted = decryptCreditCard(encryptedCard);
        const last4 = decrypted.slice(-4);
        return `****-****-****-${last4}`;
    }
    catch {
        return '****-****-****-****';
    }
}
