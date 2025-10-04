import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../logger';
import { config } from '../config';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface BackupOptions {
  outputDir?: string;
  includeSchema?: boolean;
  includeData?: boolean;
  compress?: boolean;
}

export async function createDatabaseBackup(options: BackupOptions = {}): Promise<string> {
  const {
    outputDir = './backups',
    includeSchema = true,
    includeData = true,
    compress = true,
  } = options;

  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `backup-${timestamp}${compress ? '.sql.gz' : '.sql'}`;
  const filePath = path.join(outputDir, fileName);

  try {
    await fs.mkdir(outputDir, { recursive: true });

    const pgDumpArgs: string[] = [];
    
    if (!includeSchema && includeData) {
      pgDumpArgs.push('--data-only');
    } else if (includeSchema && !includeData) {
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

    return filePath;
  } catch (error: any) {
    logger.error('Database backup failed', error instanceof Error ? error : undefined, { errorMessage: error?.message || String(error), filePath });
    throw new Error(`Database backup failed: ${error.message}`);
  }
}

export async function restoreDatabaseBackup(backupFilePath: string): Promise<void> {
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
  } catch (error: any) {
    logger.error('Database restore failed', error instanceof Error ? error : undefined, { errorMessage: error?.message || String(error), backupFilePath });
    throw new Error(`Database restore failed: ${error.message}`);
  }
}

export async function listBackups(backupDir: string = './backups'): Promise<Array<{ name: string; path: string; size: number; created: Date }>> {
  try {
    const files = await fs.readdir(backupDir);
    const backups = await Promise.all(
      files
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
        })
    );
    
    return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function deleteOldBackups(
  backupDir: string = './backups',
  retentionDays: number = 30
): Promise<number> {
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
    } catch (error: any) {
      logger.error('Failed to delete backup', error instanceof Error ? error : undefined, { backupPath: backup.path, errorMessage: error?.message || String(error) });
    }
  }

  if (deletedCount > 0) {
    logger.info(`Deleted ${deletedCount} old backup(s)`);
  }

  return deletedCount;
}

export async function scheduledBackup(): Promise<void> {
  try {
    const backupPath = await createDatabaseBackup({ compress: true });
    logger.info('Scheduled backup completed', { backupPath });
    
    const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
    await deleteOldBackups('./backups', retentionDays);
  } catch (error: any) {
    logger.error('Scheduled backup failed', error instanceof Error ? error : undefined, { errorMessage: error?.message || String(error) });
  }
}
