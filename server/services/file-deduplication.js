import crypto from 'crypto';
import { logger } from '../logger';
export async function calculateFileHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}
const fileCache = new Map();
export async function deduplicateFile(buffer, originalFilename) {
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
    const fileRecord = {
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
export async function cleanupOrphanedFiles() {
    logger.info('Orphaned file cleanup scheduled');
    return 0;
}
