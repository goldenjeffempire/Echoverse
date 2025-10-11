/**
 * CRITICAL FIX #14: File Encryption at Rest
 * Encrypts uploaded files before storing them to disk
 * Uses AES-256-GCM for secure file storage
 */
import crypto from 'crypto';
import fs from 'fs/promises';
import { logger } from '../logger';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
/**
 * Get the file encryption key from environment or generate one
 */
function getFileEncryptionKey() {
    const keyHex = process.env.FILE_ENCRYPTION_KEY;
    if (!keyHex) {
        logger.warn('FILE_ENCRYPTION_KEY not set - files will not be encrypted at rest');
        throw new Error('FILE_ENCRYPTION_KEY environment variable is required for file encryption');
    }
    // Expect 64 hex characters (32 bytes = 256 bits)
    if (keyHex.length !== 64) {
        throw new Error('FILE_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
    return Buffer.from(keyHex, 'hex');
}
/**
 * Encrypt a file and save to disk
 * Returns the path to the encrypted file and metadata needed for decryption
 */
export async function encryptFile(inputPath, outputPath) {
    try {
        const key = getFileEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        // Read the original file
        const plaintext = await fs.readFile(inputPath);
        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        // Encrypt the file
        const encrypted = Buffer.concat([
            cipher.update(plaintext),
            cipher.final()
        ]);
        // Get the authentication tag
        const authTag = cipher.getAuthTag();
        // Determine output path (add .enc extension if not specified)
        const encryptedPath = outputPath || `${inputPath}.enc`;
        // Write encrypted file to disk
        await fs.writeFile(encryptedPath, encrypted);
        // Delete original unencrypted file
        await fs.unlink(inputPath);
        logger.info('File encrypted successfully', {
            originalPath: inputPath,
            encryptedPath,
            size: encrypted.length
        });
        return {
            encryptedPath,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }
    catch (error) {
        logger.error('File encryption failed', error instanceof Error ? error : undefined);
        throw new Error(`File encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Decrypt a file and return the plaintext buffer
 * This is used when serving files to users
 */
export async function decryptFile(encryptedPath, iv, authTag) {
    try {
        const key = getFileEncryptionKey();
        const ivBuffer = Buffer.from(iv, 'hex');
        const authTagBuffer = Buffer.from(authTag, 'hex');
        // Read encrypted file
        const encrypted = await fs.readFile(encryptedPath);
        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
        decipher.setAuthTag(authTagBuffer);
        // Decrypt the file
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);
        return decrypted;
    }
    catch (error) {
        logger.error('File decryption failed', error instanceof Error ? error : undefined);
        throw new Error(`File decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Decrypt a file and save to disk (temporary access)
 */
export async function decryptFileToPath(encryptedPath, iv, authTag, outputPath) {
    const decrypted = await decryptFile(encryptedPath, iv, authTag);
    await fs.writeFile(outputPath, decrypted);
}
/**
 * Stream decrypt a file for efficient serving to clients
 */
export function createDecryptStream(encryptedPath, iv, authTag) {
    const key = getFileEncryptionKey();
    const ivBuffer = Buffer.from(iv, 'hex');
    const authTagBuffer = Buffer.from(authTag, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(authTagBuffer);
    return decipher;
}
/**
 * Check if file encryption is enabled
 */
export function isFileEncryptionEnabled() {
    return !!process.env.FILE_ENCRYPTION_KEY;
}
