/**
 * SECURITY FIX (CRIT-014): Content-Type Validation
 * Prevents MIME-type confusion attacks
 */
import { AppError } from './error-boundary';
import { logger } from '../logger';
const ALLOWED_CONTENT_TYPES = {
    // JSON endpoints
    'application/json': [
        'application/json',
        'application/json; charset=utf-8',
        'application/json;charset=utf-8'
    ],
    // Form data
    'application/x-www-form-urlencoded': [
        'application/x-www-form-urlencoded',
        'application/x-www-form-urlencoded; charset=utf-8'
    ],
    // Multipart form data (file uploads)
    'multipart/form-data': [
        /^multipart\/form-data/
    ],
    // Plain text
    'text/plain': [
        'text/plain',
        'text/plain; charset=utf-8'
    ],
};
const IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff'
];
const DOCUMENT_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
];
/**
 * Validate Content-Type header matches expected type
 */
export function validateContentType(allowed) {
    return (req, res, next) => {
        // Skip for GET, HEAD, OPTIONS requests (no body)
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            return next();
        }
        const contentType = req.headers['content-type'];
        // Content-Type is required for requests with body
        if (!contentType) {
            logger.warn('Missing Content-Type header', {
                method: req.method,
                path: req.path,
                ip: req.ip
            });
            throw new AppError(400, 'Content-Type header is required', 'MISSING_CONTENT_TYPE');
        }
        const allowedTypes = Array.isArray(allowed) ? allowed : [allowed];
        const isValid = allowedTypes.some(type => {
            if (typeof type === 'object' && type instanceof RegExp) {
                return type.test(contentType);
            }
            if (typeof type === 'string') {
                return contentType.toLowerCase().startsWith(type.toLowerCase());
            }
            return false;
        });
        if (!isValid) {
            logger.warn('Invalid Content-Type', {
                received: contentType,
                allowed: allowedTypes,
                method: req.method,
                path: req.path,
                ip: req.ip
            });
            throw new AppError(415, `Unsupported Media Type. Expected: ${allowedTypes.join(' or ')}`, 'INVALID_CONTENT_TYPE');
        }
        next();
    };
}
/**
 * Validate uploaded file MIME type
 */
export function validateFileMimeType(file, allowedTypes) {
    const mimeType = file.mimetype.toLowerCase();
    return allowedTypes.includes(mimeType);
}
/**
 * Middleware to validate JSON requests
 */
export const requireJSON = validateContentType('application/json');
/**
 * Middleware to validate form data
 */
export const requireFormData = validateContentType([
    'application/x-www-form-urlencoded',
    'multipart/form-data'
]);
/**
 * Middleware to validate image uploads
 */
export function requireImageUpload(req, res, next) {
    if (!req.file) {
        throw new AppError(400, 'Image file is required', 'MISSING_FILE');
    }
    if (!validateFileMimeType(req.file, IMAGE_MIME_TYPES)) {
        logger.warn('Invalid image MIME type', {
            received: req.file.mimetype,
            allowed: IMAGE_MIME_TYPES
        });
        throw new AppError(415, 'Invalid file type. Only images are allowed.', 'INVALID_FILE_TYPE');
    }
    next();
}
/**
 * Prevent MIME sniffing attacks
 * Forces browsers to respect declared Content-Type
 */
export function preventMimeSniffing(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
}
/**
 * SECURITY: Validate file extension matches MIME type
 * Prevents disguised malicious files
 */
export function validateFileExtension(file) {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const mime = file.mimetype.toLowerCase();
    const extensionMap = {
        'jpg': ['image/jpeg'],
        'jpeg': ['image/jpeg'],
        'png': ['image/png'],
        'gif': ['image/gif'],
        'webp': ['image/webp'],
        'svg': ['image/svg+xml'],
        'pdf': ['application/pdf'],
        'doc': ['application/msword'],
        'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'xls': ['application/vnd.ms-excel'],
        'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        'csv': ['text/csv']
    };
    if (!ext || !extensionMap[ext]) {
        return false;
    }
    return extensionMap[ext].includes(mime);
}
export { IMAGE_MIME_TYPES, DOCUMENT_MIME_TYPES };
