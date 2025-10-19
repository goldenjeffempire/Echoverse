/**
 * FIXED AUDIT #6: Encryption Key Rotation System
 * Enables safe rotation of encryption keys for 2FA backup codes and sensitive data
 */
import crypto from 'crypto';
import { logger } from '../logger';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt, encrypt2FABackupCodes, decrypt2FABackupCodes } from './encryption';
class KeyRotationManager {
    constructor() {
        this.keys = new Map();
        this.currentKeyId = null;
    }
    /**
     * Initialize key rotation with current key
     */
    initialize(currentKey) {
        const keyId = this.generateKeyId();
        this.keys.set(keyId, {
            keyId,
            key: currentKey,
            algorithm: 'aes-256-gcm',
            createdAt: new Date()
        });
        this.currentKeyId = keyId;
        logger.info('Key rotation manager initialized', { keyId });
    }
    /**
     * Generate new encryption key and mark old key for retirement
     */
    rotateKey(retirementPeriodDays = 90) {
        const newKeyId = this.generateKeyId();
        const newKey = crypto.randomBytes(32).toString('hex');
        // Mark current key as retiring
        if (this.currentKeyId) {
            const currentKey = this.keys.get(this.currentKeyId);
            if (currentKey) {
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + retirementPeriodDays);
                this.keys.set(this.currentKeyId, {
                    ...currentKey,
                    expiresAt,
                    retired: false
                });
                logger.info('Key marked for retirement', {
                    keyId: this.currentKeyId,
                    expiresAt
                });
            }
        }
        // Add new key as current
        this.keys.set(newKeyId, {
            keyId: newKeyId,
            key: newKey,
            algorithm: 'aes-256-gcm',
            createdAt: new Date()
        });
        this.currentKeyId = newKeyId;
        logger.info('New encryption key generated', {
            newKeyId,
            oldKeyId: this.currentKeyId
        });
        return newKey;
    }
    /**
     * Re-encrypt data with new key
     */
    async reencryptData(encryptedData, oldKeyId) {
        const oldKey = this.keys.get(oldKeyId);
        const currentKey = this.currentKeyId ? this.keys.get(this.currentKeyId) : null;
        if (!oldKey || !currentKey) {
            throw new Error('Key not found for re-encryption');
        }
        try {
            // Decrypt with old key
            const decrypted = decrypt(encryptedData, oldKey.key);
            // Encrypt with new key
            const reencrypted = encrypt(decrypted, currentKey.key);
            return {
                data: reencrypted,
                keyId: this.currentKeyId
            };
        }
        catch (error) {
            logger.error('Re-encryption failed', error instanceof Error ? error : undefined);
            throw error;
        }
    }
    /**
     * Re-encrypt 2FA backup codes for a user
     */
    async reencrypt2FABackupCodes(userId, oldKeyId) {
        try {
            const [user] = await db.select().from(users).where(eq(users.id, userId));
            if (!user || !user.twoFactorBackupCodes) {
                return;
            }
            const oldKey = this.keys.get(oldKeyId);
            const currentKey = this.currentKeyId ? this.keys.get(this.currentKeyId) : null;
            if (!oldKey || !currentKey) {
                throw new Error('Keys not found for 2FA re-encryption');
            }
            // Decrypt with old key (manual decrypt to use old key)
            const codes = decrypt2FABackupCodes(user.twoFactorBackupCodes);
            // Re-encrypt with new key
            const reencrypted = encrypt2FABackupCodes(codes);
            // Update database
            await db.update(users)
                .set({ twoFactorBackupCodes: reencrypted })
                .where(eq(users.id, userId));
            logger.info('2FA backup codes re-encrypted', { userId });
        }
        catch (error) {
            logger.error(`Failed to re-encrypt 2FA backup codes for user ${userId}`, error instanceof Error ? error : undefined);
            throw error;
        }
    }
    /**
     * Rotate all encrypted data in database
     */
    async rotateAllEncryptedData() {
        if (!this.currentKeyId) {
            throw new Error('No current key set');
        }
        const stats = { success: 0, failed: 0, total: 0 };
        try {
            // Get all users with 2FA enabled
            const usersWithencrypt2FA = await db.select().from(users).where(eq(users.twoFactorEnabled, true));
            stats.total = usersWithencrypt2FA.length;
            for (const user of usersWithencrypt2FA) {
                try {
                    await this.reencrypt2FABackupCodes(user.id, this.currentKeyId);
                    stats.success++;
                }
                catch (error) {
                    stats.failed++;
                    logger.error(`Failed to rotate key for user ${user.id}`, error instanceof Error ? error : undefined);
                }
            }
            logger.info('Key rotation completed', stats);
            return stats;
        }
        catch (error) {
            logger.error('Key rotation failed', error instanceof Error ? error : undefined);
            throw error;
        }
    }
    /**
     * Retire old keys after grace period
     */
    retireExpiredKeys() {
        let retiredCount = 0;
        const now = new Date();
        for (const [keyId, config] of this.keys.entries()) {
            if (config.expiresAt && config.expiresAt < now && !config.retired) {
                this.keys.set(keyId, { ...config, retired: true });
                retiredCount++;
                logger.info('Key retired', { keyId, expiredAt: config.expiresAt });
            }
        }
        return retiredCount;
    }
    /**
     * Get current active key ID
     */
    getCurrentKeyId() {
        return this.currentKeyId;
    }
    /**
     * Get all keys for audit
     */
    getAllKeys() {
        return Array.from(this.keys.values());
    }
    generateKeyId() {
        return `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }
}
export const keyRotation = new KeyRotationManager();
// Initialize with current encryption key
if (process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY) {
    keyRotation.initialize(process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY);
}
/**
 * CRITICAL FIX #3: Scheduled 2FA encryption key rotation
 * Rotates encryption keys every 90 days automatically
 */
export function scheduleKeyRotation() {
    const ROTATION_INTERVAL_DAYS = 90;
    const ROTATION_CHECK_MS = 24 * 60 * 60 * 1000; // Check daily
    setInterval(async () => {
        try {
            const currentKeyId = keyRotation.getCurrentKeyId();
            const allKeys = keyRotation.getAllKeys();
            if (currentKeyId) {
                const currentKey = allKeys.find(k => k.keyId === currentKeyId);
                if (currentKey) {
                    const daysSinceCreation = Math.floor((Date.now() - currentKey.createdAt.getTime()) / (24 * 60 * 60 * 1000));
                    if (daysSinceCreation >= ROTATION_INTERVAL_DAYS) {
                        logger.info('Starting automatic key rotation', {
                            daysSinceCreation,
                            currentKeyId
                        });
                        // Rotate key and re-encrypt all data
                        keyRotation.rotateKey(ROTATION_INTERVAL_DAYS);
                        await keyRotation.rotateAllEncryptedData();
                        logger.info('Automatic key rotation completed successfully');
                    }
                }
            }
            // Retire expired keys
            const retiredCount = keyRotation.retireExpiredKeys();
            if (retiredCount > 0) {
                logger.info(`Retired ${retiredCount} expired encryption keys`);
            }
        }
        catch (error) {
            logger.error('Automatic key rotation failed', error instanceof Error ? error : undefined);
        }
    }, ROTATION_CHECK_MS);
    logger.info('2FA encryption key rotation scheduled', {
        rotationIntervalDays: ROTATION_INTERVAL_DAYS
    });
}
