/**
 * Cloud Storage Migration Service
 * FIX: HIGH-018 - Migrate from local to cloud storage (S3/GCS)
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Storage } from '@google-cloud/storage';
import { readFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { logger } from '../logger';
const STORAGE_CONFIG = {
    provider: (process.env.STORAGE_PROVIDER || 'local'),
    bucket: process.env.STORAGE_BUCKET || '',
    region: process.env.STORAGE_REGION || 'us-east-1',
    localPath: join(process.cwd(), 'uploads'),
};
// AWS S3 Client
const s3Client = STORAGE_CONFIG.provider === 's3' ? new S3Client({
    region: STORAGE_CONFIG.region,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || ''
    }
}) : null;
// Google Cloud Storage Client
const gcsClient = STORAGE_CONFIG.provider === 'gcs' && process.env.GCS_CREDENTIALS ?
    new Storage({
        projectId: process.env.GCS_PROJECT_ID,
        credentials: JSON.parse(process.env.GCS_CREDENTIALS)
    }) : null;
/**
 * Upload file to configured storage provider
 */
export async function uploadFile(options) {
    const key = options.folder ? `${options.folder}/${options.filename}` : options.filename;
    try {
        if (STORAGE_CONFIG.provider === 's3' && s3Client) {
            return await uploadToS3(key, options);
        }
        else if (STORAGE_CONFIG.provider === 'gcs' && gcsClient) {
            return await uploadToGCS(key, options);
        }
        else {
            return uploadToLocal(key, options);
        }
    }
    catch (error) {
        logger.error('File upload failed', error instanceof Error ? error : undefined);
        throw error;
    }
}
/**
 * Upload to AWS S3
 */
async function uploadToS3(key, options) {
    if (!s3Client || !STORAGE_CONFIG.bucket) {
        throw new Error('S3 not configured');
    }
    const command = new PutObjectCommand({
        Bucket: STORAGE_CONFIG.bucket,
        Key: key,
        Body: options.buffer,
        ContentType: options.mimetype,
        CacheControl: 'public, max-age=31536000',
    });
    await s3Client.send(command);
    const url = `https://${STORAGE_CONFIG.bucket}.s3.${STORAGE_CONFIG.region}.amazonaws.com/${key}`;
    logger.info('File uploaded to S3', { key, url });
    return url;
}
/**
 * Upload to Google Cloud Storage
 */
async function uploadToGCS(key, options) {
    if (!gcsClient || !STORAGE_CONFIG.bucket) {
        throw new Error('GCS not configured');
    }
    const bucket = gcsClient.bucket(STORAGE_CONFIG.bucket);
    const file = bucket.file(key);
    await file.save(options.buffer, {
        contentType: options.mimetype,
        metadata: {
            cacheControl: 'public, max-age=31536000',
        },
    });
    const url = `https://storage.googleapis.com/${STORAGE_CONFIG.bucket}/${key}`;
    logger.info('File uploaded to GCS', { key, url });
    return url;
}
/**
 * Upload to local filesystem (fallback)
 */
function uploadToLocal(key, options) {
    const fs = require('fs');
    const path = require('path');
    const fullPath = path.join(STORAGE_CONFIG.localPath, key);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, options.buffer);
    const url = `/uploads/${key}`;
    logger.info('File uploaded to local storage', { key, url });
    return url;
}
/**
 * Delete file from storage
 */
export async function deleteFile(key) {
    try {
        if (STORAGE_CONFIG.provider === 's3' && s3Client) {
            const command = new DeleteObjectCommand({
                Bucket: STORAGE_CONFIG.bucket,
                Key: key
            });
            await s3Client.send(command);
        }
        else if (STORAGE_CONFIG.provider === 'gcs' && gcsClient) {
            const bucket = gcsClient.bucket(STORAGE_CONFIG.bucket);
            await bucket.file(key).delete();
        }
        else {
            const fullPath = join(STORAGE_CONFIG.localPath, key);
            if (existsSync(fullPath)) {
                unlinkSync(fullPath);
            }
        }
        logger.info('File deleted from storage', { key });
    }
    catch (error) {
        logger.error('File deletion failed', error instanceof Error ? error : undefined);
        throw error;
    }
}
/**
 * Get file URL
 */
export function getFileUrl(key) {
    if (STORAGE_CONFIG.provider === 's3') {
        return `https://${STORAGE_CONFIG.bucket}.s3.${STORAGE_CONFIG.region}.amazonaws.com/${key}`;
    }
    else if (STORAGE_CONFIG.provider === 'gcs') {
        return `https://storage.googleapis.com/${STORAGE_CONFIG.bucket}/${key}`;
    }
    else {
        return `/uploads/${key}`;
    }
}
/**
 * Migrate local files to cloud storage
 */
export async function migrateLocalToCloud() {
    if (STORAGE_CONFIG.provider === 'local') {
        throw new Error('Cannot migrate - cloud storage not configured');
    }
    const stats = { migrated: 0, failed: 0, errors: [] };
    const fs = require('fs');
    const path = require('path');
    async function migrateDirectory(dir, prefix = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await migrateDirectory(fullPath, path.join(prefix, entry.name));
            }
            else {
                try {
                    const buffer = readFileSync(fullPath);
                    const key = path.join(prefix, entry.name).replace(/\\/g, '/');
                    const mimetype = getMimeType(entry.name);
                    await uploadFile({
                        buffer,
                        filename: entry.name,
                        mimetype,
                        folder: prefix
                    });
                    stats.migrated++;
                    logger.info('Migrated file', { path: fullPath, key });
                }
                catch (error) {
                    stats.failed++;
                    const errMsg = error instanceof Error ? error.message : 'Unknown error';
                    stats.errors.push(`${fullPath}: ${errMsg}`);
                    logger.error('Migration failed for file', error instanceof Error ? error : undefined);
                }
            }
        }
    }
    if (existsSync(STORAGE_CONFIG.localPath)) {
        await migrateDirectory(STORAGE_CONFIG.localPath);
    }
    return stats;
}
function getMimeType(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return types[ext || ''] || 'application/octet-stream';
}
/**
 * Validate storage configuration
 */
export function validateStorageConfig() {
    const errors = [];
    if (STORAGE_CONFIG.provider === 's3') {
        if (!STORAGE_CONFIG.bucket)
            errors.push('AWS_S3_BUCKET not configured');
        if (!process.env.AWS_S3_ACCESS_KEY_ID)
            errors.push('AWS_S3_ACCESS_KEY_ID not configured');
        if (!process.env.AWS_S3_SECRET_ACCESS_KEY)
            errors.push('AWS_S3_SECRET_ACCESS_KEY not configured');
    }
    if (STORAGE_CONFIG.provider === 'gcs') {
        if (!STORAGE_CONFIG.bucket)
            errors.push('GCS_BUCKET not configured');
        if (!process.env.GCS_PROJECT_ID)
            errors.push('GCS_PROJECT_ID not configured');
        if (!process.env.GCS_CREDENTIALS)
            errors.push('GCS_CREDENTIALS not configured');
    }
    return {
        valid: errors.length === 0,
        provider: STORAGE_CONFIG.provider,
        errors
    };
}
