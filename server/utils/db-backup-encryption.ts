/**
 * CRITICAL FIX #18: Database Backup Encryption
 * 
 * This module provides utilities for encrypting database backups
 * to ensure data at rest security for backup files.
 * 
 * IMPORTANT: Replit/Neon automatically encrypts backups at rest using AES-256.
 * This utility provides additional application-level encryption for extra security.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../logger';

const execAsync = promisify(exec);

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * CRIT-008 FIX: Backup encryption key versioning and rotation support
 */
interface BackupKeyVersion {
  version: number;
  key: Buffer;
  created: Date;
  rotationScheduled?: Date;
}

// Key version registry (in production, this would be in secure key management service)
const keyRegistry = new Map<number, BackupKeyVersion>();

/**
 * Get backup encryption key with version support
 */
function getBackupEncryptionKey(version?: number): { key: Buffer; version: number } {
  // CRIT-008 FIX: Support multiple key versions for rotation
  const currentVersion = parseInt(process.env.BACKUP_ENCRYPTION_KEY_VERSION || '1', 10);
  const requestedVersion = version || currentVersion;
  
  // Check registry first
  if (keyRegistry.has(requestedVersion)) {
    const keyData = keyRegistry.get(requestedVersion)!;
    return { key: keyData.key, version: requestedVersion };
  }
  
  // Generate key from environment
  const keyEnvVar = version 
    ? `BACKUP_ENCRYPTION_KEY_V${version}`
    : 'BACKUP_ENCRYPTION_KEY';
  
  const keyHex = process.env[keyEnvVar] || process.env.SESSION_SECRET;
  
  if (!keyHex) {
    logger.error('Backup encryption key not found', undefined, { version: requestedVersion });
    throw new Error(`${keyEnvVar} or SESSION_SECRET required for backup encryption`);
  }
  
  // Create SHA-256 hash to ensure 32 bytes
  const key = crypto.createHash('sha256').update(keyHex).digest();
  
  // Register key
  keyRegistry.set(requestedVersion, {
    version: requestedVersion,
    key,
    created: new Date(),
    rotationScheduled: process.env.KEY_ROTATION_SCHEDULE_DAYS 
      ? new Date(Date.now() + parseInt(process.env.KEY_ROTATION_SCHEDULE_DAYS) * 24 * 60 * 60 * 1000)
      : undefined
  });
  
  logger.info('Backup encryption key loaded', { version: requestedVersion });
  
  return { key, version: requestedVersion };
}

/**
 * Encrypt a backup file
 */
export async function encryptBackupFile(inputPath: string, outputPath?: string): Promise<{
  encryptedPath: string;
  iv: string;
  authTag: string;
  keyVersion: number;
}> {
  try {
    const { key, version: keyVersion } = getBackupEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Read backup file
    const plaintext = await fs.readFile(inputPath);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt
    const encrypted = Buffer.concat([
      cipher.update(plaintext),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Combine salt + iv + authTag + encrypted data
    const combined = Buffer.concat([salt, iv, authTag, encrypted]);
    
    // Determine output path
    const encryptedPath = outputPath || `${inputPath}.enc`;
    
    // Write encrypted file
    await fs.writeFile(encryptedPath, combined);
    
    logger.info('Backup encrypted successfully', {
      inputPath,
      encryptedPath,
      size: combined.length
    });
    
    return {
      encryptedPath,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      keyVersion
    };
  } catch (error) {
    logger.error('Backup encryption failed', error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Decrypt a backup file
 */
export async function decryptBackupFile(encryptedPath: string, outputPath?: string, keyVersion?: number): Promise<string> {
  try {
    const { key } = getBackupEncryptionKey(keyVersion);
    
    // Read encrypted file
    const combined = await fs.readFile(encryptedPath);
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    // Write decrypted file
    const decryptedPath = outputPath || encryptedPath.replace('.enc', '');
    await fs.writeFile(decryptedPath, decrypted);
    
    logger.info('Backup decrypted successfully', {
      encryptedPath,
      decryptedPath
    });
    
    return decryptedPath;
  } catch (error) {
    logger.error('Backup decryption failed', error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Create encrypted database backup
 * 
 * NOTE: This requires pg_dump to be installed in the environment.
 * For Replit deployments, backups are already encrypted by Neon.
 */
export async function createEncryptedBackup(outputDir: string = './backups'): Promise<string> {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL not configured');
  }
  
  try {
    // Ensure backup directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(outputDir, `backup-${timestamp}.sql`);
    const encryptedPath = `${backupPath}.enc`;
    
    // Create backup using pg_dump
    logger.info('Creating database backup...');
    
    // Use --no-password and rely on DATABASE_URL for authentication
    const { stdout, stderr } = await execAsync(
      `pg_dump "${DATABASE_URL}" --no-password --clean --if-exists > "${backupPath}"`,
      { maxBuffer: 50 * 1024 * 1024 } // 50MB buffer
    );
    
    if (stderr && !stderr.includes('notice')) {
      logger.warn('pg_dump warnings', { stderr });
    }
    
    logger.info('Database backup created', { backupPath });
    
    // Encrypt the backup
    await encryptBackupFile(backupPath, encryptedPath);
    
    // Delete unencrypted backup
    await fs.unlink(backupPath);
    
    logger.info('Encrypted backup created successfully', { encryptedPath });
    
    return encryptedPath;
  } catch (error) {
    logger.error('Encrypted backup creation failed', error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Check if backups are encrypted (verify encryption status)
 */
export function isBackupEncryptionEnabled(): boolean {
  return !!(process.env.BACKUP_ENCRYPTION_KEY || process.env.SESSION_SECRET);
}

/**
 * Get backup encryption info
 */
export function getBackupEncryptionInfo() {
  return {
    enabled: isBackupEncryptionEnabled(),
    algorithm: ALGORITHM,
    keySource: process.env.BACKUP_ENCRYPTION_KEY ? 'BACKUP_ENCRYPTION_KEY' : 'SESSION_SECRET',
    neonEncryption: 'Replit/Neon provides automatic AES-256 encryption for all backups',
    additionalEncryption: 'This module provides optional application-level encryption for extra security'
  };
}
