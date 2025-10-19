import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../logger';
import { config } from '../config';
import * as fs from 'fs/promises';
import * as path from 'path';
const execAsync = promisify(exec);
export async function createDatabaseBackup(options = {}) {
    const { outputDir = './backups', includeSchema = true, includeData = true, compress = true, } = options;
    if (!config.databaseUrl) {
        throw new Error('DATABASE_URL is not configured');
    }
    // P0 FIX #3: Validate backup encryption key in production/staging
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
        if (!process.env.BACKUP_ENCRYPTION_KEY || process.env.BACKUP_ENCRYPTION_KEY.length < 64) {
            throw new Error('BACKUP_ENCRYPTION_KEY must be set and at least 64 characters in production/staging');
        }
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}${compress ? '.sql.gz' : '.sql'}`;
    const filePath = path.join(outputDir, fileName);
    try {
        await fs.mkdir(outputDir, { recursive: true });
        const pgDumpArgs = [];
        if (!includeSchema && includeData) {
            pgDumpArgs.push('--data-only');
        }
        else if (includeSchema && !includeData) {
            pgDumpArgs.push('--schema-only');
        }
        const pgDumpCommand = `pg_dump "${config.databaseUrl}" ${pgDumpArgs.join(' ')}`;
        const fullCommand = compress
            ? `${pgDumpCommand} | gzip > "${filePath}"`
            : `${pgDumpCommand} > "${filePath}"`;
        logger.info('Starting database backup', { filePath, includeSchema, includeData, compress });
        await execAsync(fullCommand);
        const stats = await fs.stat(filePath);
        logger.info('Database backup completed', {
            filePath,
            sizeBytes: stats.size,
            sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
        });
        // ISSUE #16 FIX: Automatically verify backup after creation
        const verification = await verifyBackup(filePath);
        if (!verification.valid) {
            logger.error('Backup verification failed immediately after creation', undefined, {
                filePath,
                issues: verification.issues
            });
            throw new Error(`Backup created but verification failed: ${verification.issues.join(', ')}`);
        }
        return filePath;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Database backup failed', error instanceof Error ? error : undefined, { errorMessage, filePath });
        throw new Error(`Database backup failed: ${errorMessage}`);
    }
}
export async function restoreDatabaseBackup(backupFilePath) {
    if (!config.databaseUrl) {
        throw new Error('DATABASE_URL is not configured');
    }
    try {
        const isCompressed = backupFilePath.endsWith('.gz');
        const restoreCommand = isCompressed
            ? `gunzip -c "${backupFilePath}" | psql "${config.databaseUrl}"`
            : `psql "${config.databaseUrl}" < "${backupFilePath}"`;
        logger.info('Starting database restore', { backupFilePath });
        await execAsync(restoreCommand);
        logger.info('Database restore completed', { backupFilePath });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Database restore failed', error instanceof Error ? error : undefined, { errorMessage, backupFilePath });
        throw new Error(`Database restore failed: ${errorMessage}`);
    }
}
export async function listBackups(backupDir = './backups') {
    try {
        const files = await fs.readdir(backupDir);
        const backups = await Promise.all(files
            .filter(file => file.startsWith('backup-') && (file.endsWith('.sql') || file.endsWith('.sql.gz')))
            .map(async (file) => {
            const filePath = path.join(backupDir, file);
            const stats = await fs.stat(filePath);
            return {
                name: file,
                path: filePath,
                size: stats.size,
                created: stats.birthtime,
            };
        }));
        return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}
/**
 * Verify backup integrity
 * ISSUE #16 FIX: Add automatic backup verification
 *
 * Performs the following checks:
 * 1. File exists and is readable
 * 2. File is not empty (minimum size check)
 * 3. For compressed files, verify gzip integrity using gzip -t
 * 4. For SQL files, verify valid SQL headers
 */
export async function verifyBackup(backupFilePath) {
    const issues = [];
    try {
        // Check file exists
        const stats = await fs.stat(backupFilePath);
        // Check minimum size (should be at least 1KB for a valid backup)
        if (stats.size < 1024) {
            issues.push(`Backup file is suspiciously small: ${stats.size} bytes`);
        }
        const isCompressed = backupFilePath.endsWith('.gz');
        if (isCompressed) {
            // Verify gzip integrity using gzip -t (test integrity without decompressing)
            try {
                await execAsync(`gzip -t "${backupFilePath}"`);
                logger.debug('gzip integrity check passed', { backupFile: backupFilePath });
            }
            catch (error) {
                issues.push(`gzip integrity check failed: ${error instanceof Error ? error.message : 'unknown'}`);
            }
            // Read first chunk of decompressed data to verify SQL content
            try {
                const { stdout } = await execAsync(`gunzip -c "${backupFilePath}" | head -c 1024`);
                if (!stdout.includes('PostgreSQL') && !stdout.includes('--') && !stdout.includes('CREATE')) {
                    issues.push('Decompressed content does not appear to be valid SQL');
                }
            }
            catch (error) {
                issues.push(`Failed to read decompressed content: ${error instanceof Error ? error.message : 'unknown'}`);
            }
        }
        else {
            // For uncompressed SQL, read first chunk to check for SQL headers
            const handle = await fs.open(backupFilePath, 'r');
            const buffer = Buffer.alloc(1024);
            await handle.read(buffer, 0, 1024, 0);
            await handle.close();
            const content = buffer.toString('utf8');
            if (!content.includes('PostgreSQL') && !content.includes('--') && !content.includes('CREATE') && !content.includes('INSERT')) {
                issues.push('File does not appear to contain valid SQL content');
            }
        }
        const valid = issues.length === 0;
        if (valid) {
            logger.info('Backup verification passed', {
                backupFile: backupFilePath,
                size: stats.size,
                compressed: isCompressed
            });
        }
        else {
            logger.warn('Backup verification failed', {
                backupFile: backupFilePath,
                issues
            });
        }
        return {
            valid,
            issues,
            size: stats.size,
            compressed: isCompressed
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Backup verification error', error instanceof Error ? error : undefined, {
            backupFile: backupFilePath,
            errorMessage
        });
        return {
            valid: false,
            issues: [`Verification error: ${errorMessage}`],
            size: 0,
            compressed: backupFilePath.endsWith('.gz')
        };
    }
}
export async function deleteOldBackups(backupDir = './backups', retentionDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const backups = await listBackups(backupDir);
    const oldBackups = backups.filter(backup => backup.created < cutoffDate);
    let deletedCount = 0;
    for (const backup of oldBackups) {
        try {
            await fs.unlink(backup.path);
            logger.info('Deleted old backup', { backupPath: backup.path, age: Math.floor((Date.now() - backup.created.getTime()) / (1000 * 60 * 60 * 24)) });
            deletedCount++;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('Failed to delete backup', error instanceof Error ? error : undefined, { backupPath: backup.path, errorMessage });
        }
    }
    if (deletedCount > 0) {
        logger.info(`Deleted ${deletedCount} old backup(s)`);
    }
    return deletedCount;
}
export async function scheduledBackup() {
    try {
        const backupPath = await createDatabaseBackup({ compress: true });
        logger.info('Scheduled backup completed', { backupPath });
        const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
        await deleteOldBackups('./backups', retentionDays);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Scheduled backup failed', error instanceof Error ? error : undefined, { errorMessage });
    }
}
