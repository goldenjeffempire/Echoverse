import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs';
import { logger } from '../logger';
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
// File size limits per type (in bytes)
const FILE_SIZE_LIMITS = {
    'image/jpeg': 5 * 1024 * 1024, // 5MB for JPEG
    'image/png': 5 * 1024 * 1024, // 5MB for PNG
    'image/gif': 2 * 1024 * 1024, // 2MB for GIF
    'image/webp': 5 * 1024 * 1024, // 5MB for WebP
    'application/pdf': 10 * 1024 * 1024, // 10MB for PDF
    'application/msword': 10 * 1024 * 1024,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 10 * 1024 * 1024,
    'application/vnd.ms-excel': 10 * 1024 * 1024,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 10 * 1024 * 1024,
};
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB default
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
const ALLOWED_MIME_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
const ALLOWED_FILE_TYPE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];
// Magic numbers (file signatures) for validation
const FILE_SIGNATURES = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]], // GIF87a or GIF89a
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP container)
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
};
const sanitizeFilename = (filename) => {
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    const sanitized = name
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 50);
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    return `${sanitized}_${randomSuffix}${ext}`;
};
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const sanitized = sanitizeFilename(file.originalname);
        cb(null, sanitized);
    }
});
const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error(`File type not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
    }
    cb(null, true);
};
/**
 * Validate file signature (magic numbers) from buffer
 */
function validateMagicNumbers(buffer, mimeType) {
    const signatures = FILE_SIGNATURES[mimeType];
    if (!signatures) {
        return true; // Unknown type, skip validation
    }
    return signatures.some(sig => sig.every((byte, index) => buffer[index] === byte));
}
/**
 * Enhanced file type verification with magic number validation
 */
export const verifyFileType = async (req, res, next) => {
    if (!req.file && !req.files) {
        return next();
    }
    try {
        const files = req.file ? [req.file] : req.files;
        for (const file of files) {
            // Step 1: Verify file exists and is readable
            if (!fs.existsSync(file.path)) {
                logger.error('File not found after upload', undefined, { path: file.path });
                return res.status(500).json({
                    error: 'File upload failed',
                    code: 'FILE_NOT_FOUND'
                });
            }
            // Step 2: Check file size against type-specific limits
            const sizeLimit = FILE_SIZE_LIMITS[file.mimetype] || MAX_FILE_SIZE;
            if (file.size > sizeLimit) {
                fs.unlinkSync(file.path);
                logger.warn('File size exceeded limit', {
                    size: file.size,
                    limit: sizeLimit,
                    mimetype: file.mimetype
                });
                return res.status(400).json({
                    error: `File size (${Math.round(file.size / 1024)}KB) exceeds limit of ${Math.round(sizeLimit / 1024)}KB for ${file.mimetype}`,
                    code: 'FILE_SIZE_EXCEEDED'
                });
            }
            // Step 3: Read file header for magic number validation
            const fileHandle = fs.openSync(file.path, 'r');
            const buffer = Buffer.alloc(12); // Read first 12 bytes
            fs.readSync(fileHandle, buffer, 0, 12, 0);
            fs.closeSync(fileHandle);
            // Step 4: Validate magic numbers
            if (!validateMagicNumbers(buffer, file.mimetype)) {
                fs.unlinkSync(file.path);
                logger.warn('Magic number validation failed', {
                    mimetype: file.mimetype,
                    filename: file.originalname
                });
                return res.status(400).json({
                    error: 'File signature validation failed. The file may be corrupted or the type may be incorrect.',
                    code: 'INVALID_FILE_SIGNATURE'
                });
            }
            // Step 5: Use file-type library for deep inspection
            const detectedType = await fileTypeFromFile(file.path);
            if (!detectedType) {
                fs.unlinkSync(file.path);
                logger.warn('Could not detect file type', { filename: file.originalname });
                return res.status(400).json({
                    error: 'Could not determine file type',
                    code: 'UNKNOWN_FILE_TYPE'
                });
            }
            if (!ALLOWED_FILE_TYPE_EXTS.includes(detectedType.ext)) {
                fs.unlinkSync(file.path);
                logger.warn('File extension not allowed', {
                    detectedExt: detectedType.ext,
                    filename: file.originalname
                });
                return res.status(400).json({
                    error: `File type not allowed. Detected type: ${detectedType.ext}`,
                    code: 'INVALID_FILE_TYPE'
                });
            }
            // Step 6: Check for MIME type spoofing
            if (detectedType.mime !== file.mimetype) {
                fs.unlinkSync(file.path);
                logger.warn('MIME type spoofing detected', {
                    claimed: file.mimetype,
                    actual: detectedType.mime,
                    filename: file.originalname
                });
                return res.status(400).json({
                    error: `MIME type mismatch: claimed ${file.mimetype}, detected ${detectedType.mime}`,
                    code: 'MIME_TYPE_MISMATCH'
                });
            }
            logger.info('File validation successful', {
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            });
        }
        next();
    }
    catch (error) {
        logger.error('File type verification error', error instanceof Error ? error : undefined);
        // Clean up files on error
        const files = req.file ? [req.file] : (req.files || []);
        files.forEach(file => {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        });
        return res.status(500).json({ error: 'File verification failed' });
    }
};
export const uploadSingle = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    },
    fileFilter
}).single('file');
export const uploadMultiple = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 10
    },
    fileFilter
}).array('files', 10);
export const uploadImage = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB for images
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
            return cb(new Error(`Only image files are allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`));
        }
        cb(null, true);
    }
}).single('image');
export { UPLOAD_DIR, MAX_FILE_SIZE, ALLOWED_MIME_TYPES };
