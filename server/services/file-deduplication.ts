import crypto from 'crypto';
import { logger } from '../logger';

export async function calculateFileHash(buffer: Buffer): Promise<string> {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

interface FileRecord {
  id: string;
  filename: string;
  hash: string;
  size: number;
  mimetype: string;
  path: string;
}

const fileCache = new Map<string, FileRecord>();

export async function deduplicateFile(buffer: Buffer, originalFilename: string): Promise<{
  fileId: string;
  isDuplicate: boolean;
  savedBytes: number;
}> {
  const hash = await calculateFileHash(buffer);
  
  const existing = fileCache.get(hash);
  
  if (existing) {
    logger.info('Duplicate file detected', {
      hash,
      originalFile: originalFilename,
      existingFile: existing.filename,
      savedBytes: buffer.length,
    });

    return {
      fileId: existing.id,
      isDuplicate: true,
      savedBytes: buffer.length,
    };
  }

  const fileRecord: FileRecord = {
    id: crypto.randomUUID(),
    filename: originalFilename,
    hash,
    size: buffer.length,
    mimetype: '',
    path: '',
  };

  fileCache.set(hash, fileRecord);

  return {
    fileId: fileRecord.id,
    isDuplicate: false,
    savedBytes: 0,
  };
}

export async function cleanupOrphanedFiles(): Promise<number> {
  logger.info('Orphaned file cleanup scheduled');
  return 0;
}
