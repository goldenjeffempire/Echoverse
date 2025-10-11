import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError } from './error-boundary';
import { logger } from '../logger';
import path from 'path';
import crypto from 'crypto';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs/promises';

/**
 * Enhanced Upload Security Middleware
 * 
 * - Pre-validates file size before upload
 * - Prevents path traversal attacks
 * - Enforces strict file type validation
 * - Generates secure random filenames
 */

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10); // 10MB default
const MAX_FILES = parseInt(process.env.MAX_FILES_PER_REQUEST || '10', 10);

// Allowed MIME types for uploads
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv'
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg', // CRIT-003 FIX: Added missing video/mpeg type
  'video/webm'
];

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
  ...ALLOWED_VIDEO_TYPES
];

/**
 * Pre-validate file size from Content-Length header
 */
export function preValidateFileSize(req: Request, res: Response, next: NextFunction): void {
  const contentLength = req.get('Content-Length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    
    if (size > MAX_FILE_SIZE) {
      throw new AppError(
        413,
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`,
        'FILE_TOO_LARGE',
        { maxSize: MAX_FILE_SIZE, providedSize: size }
      );
    }
  }
  
  next();
}

/**
 * Generate secure random filename
 */
function generateSecureFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const randomName = crypto.randomBytes(16).toString('hex');
  return `${randomName}${ext}`;
}

/**
 * Validate filename for path traversal
 */
function validateFilename(filename: string): void {
  // Prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new AppError(
      400,
      'Invalid filename: path traversal detected',
      'INVALID_FILENAME'
    );
  }
  
  // Prevent hidden files
  if (filename.startsWith('.')) {
    throw new AppError(
      400,
      'Invalid filename: hidden files not allowed',
      'INVALID_FILENAME'
    );
  }
}

/**
 * File filter for multer
 */
function fileFilter(allowedTypes: string[]) {
  return (req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
    try {
      // Validate filename
      validateFilename(file.originalname);
      
      // Validate MIME type
      if (!allowedTypes.includes(file.mimetype)) {
        logger.warn('Rejected file upload: invalid MIME type', {
          filename: file.originalname,
          mimetype: file.mimetype,
          allowedTypes
        });
        
        return callback(new AppError(
          400,
          `File type not allowed: ${file.mimetype}`,
          'INVALID_FILE_TYPE',
          { allowedTypes }
        ));
      }
      
      callback(null, true);
    } catch (error) {
      callback(error as Error);
    }
  };
}

/**
 * Multer storage configuration with secure filename generation
 */
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, UPLOAD_DIR);
  },
  filename: (req, file, callback) => {
    try {
      const secureName = generateSecureFilename(file.originalname);
      logger.debug('Generated secure filename', {
        original: file.originalname,
        secure: secureName
      });
      callback(null, secureName);
    } catch (error) {
      callback(error as Error, '');
    }
  }
});

/**
 * Enhanced image upload middleware
 */
export const uploadImage = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  },
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES)
});

/**
 * Enhanced document upload middleware
 */
export const uploadDocument = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE * 5, // Allow larger documents (50MB)
    files: MAX_FILES
  },
  fileFilter: fileFilter(ALLOWED_DOCUMENT_TYPES)
});

/**
 * Enhanced video upload middleware
 */
export const uploadVideo = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE * 50, // Allow larger videos (500MB)
    files: 1
  },
  fileFilter: fileFilter(ALLOWED_VIDEO_TYPES)
});

/**
 * General file upload middleware
 */
export const uploadAny = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  },
  fileFilter: fileFilter(ALL_ALLOWED_TYPES)
});

/**
 * CRIT-003 FIX (CORRECTED): Verify file type using magic bytes with exact MIME matching
 * Prevents malicious file uploads with spoofed extensions/MIME types
 * Requires detected MIME to exactly match the client-declared MIME type
 */
async function verifyFileMagicBytes(file: Express.Multer.File): Promise<void> {
  try {
    const fileType = await fileTypeFromFile(file.path);
    
    // If file-type can't detect it, might be a text file - allow only specific text types
    if (!fileType) {
      const allowedTextTypes = ['text/plain', 'text/csv', 'application/json'];
      if (!allowedTextTypes.includes(file.mimetype)) {
        await fs.unlink(file.path).catch(err => 
          logger.error('Failed to delete rejected file', err)
        );
        throw new AppError(
          400,
          'Could not verify file type - file may be corrupted or invalid',
          'INVALID_FILE_TYPE'
        );
      }
      return; // Allow verified text files
    }
    
    // Map of client MIME types to their exact magic byte MIME equivalents
    // Each client MIME must map to specific allowed actual MIME types (no category-level matching)
    const exactMimeMap: Record<string, string[]> = {
      'image/jpeg': ['image/jpeg'],
      'image/jpg': ['image/jpeg'], // jpg is alias for jpeg
      'image/png': ['image/png'],
      'image/gif': ['image/gif'],
      'image/webp': ['image/webp'],
      'image/svg+xml': ['image/svg+xml'],
      'application/pdf': ['application/pdf'],
      'video/mp4': ['video/mp4'],
      'video/mpeg': ['video/mpeg'], // Added missing type
      'video/webm': ['video/webm'],
      'application/msword': ['application/msword', 'application/x-msword'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip' // DOCX files are zips, file-type may detect as zip
      ]
    };
    
    // Get allowed actual MIME types for the client-declared MIME
    const allowedActualMimes = exactMimeMap[file.mimetype];
    
    if (!allowedActualMimes) {
      logger.warn('Client MIME type not in exact map', {
        filename: file.filename,
        clientMimeType: file.mimetype
      });
      await fs.unlink(file.path).catch(err => 
        logger.error('Failed to delete rejected file', err)
      );
      throw new AppError(
        400,
        `File type ${file.mimetype} not supported`,
        'UNSUPPORTED_FILE_TYPE'
      );
    }
    
    // Verify detected MIME exactly matches one of the allowed actual MIMEs for declared type
    if (!allowedActualMimes.includes(fileType.mime)) {
      logger.warn('File rejected: detected MIME does not match declared MIME', {
        filename: file.filename,
        clientDeclaredMime: file.mimetype,
        actualDetectedMime: fileType.mime,
        allowedForDeclared: allowedActualMimes,
        detectedExtension: fileType.ext
      });
      
      // Delete the uploaded file
      await fs.unlink(file.path).catch(err => 
        logger.error('Failed to delete rejected file', err)
      );
      
      throw new AppError(
        400,
        `File type validation failed: detected type (${fileType.mime}) does not match declared type (${file.mimetype})`,
        'FILE_TYPE_MISMATCH',
        { 
          declared: file.mimetype, 
          detected: fileType.mime,
          allowedForDeclared: allowedActualMimes
        }
      );
    }
    
    logger.debug('File magic bytes verified successfully', {
      filename: file.filename,
      clientMime: file.mimetype,
      detectedMime: fileType.mime
    });
    
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Magic byte verification failed', error as Error);
    throw new AppError(
      500,
      'File validation failed',
      'FILE_VALIDATION_ERROR'
    );
  }
}

/**
 * Post-upload validation middleware with magic byte verification - CRIT-003 FIX
 */
export async function postUploadValidation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const file = req.file as Express.Multer.File | undefined;
    
    if (files && files.length > MAX_FILES) {
      throw new AppError(
        400,
        `Too many files: maximum ${MAX_FILES} files allowed`,
        'TOO_MANY_FILES'
      );
    }
    
    // Verify magic bytes for all uploaded files
    if (file) {
      await verifyFileMagicBytes(file);
      logger.info('File uploaded and verified successfully', {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });
    } else if (files) {
      await Promise.all(files.map(f => verifyFileMagicBytes(f)));
      logger.info('Files uploaded and verified successfully', {
        count: files.length,
        files: files.map(f => ({
          filename: f.filename,
          size: f.size
        }))
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Sanitize uploaded file metadata
 */
export function sanitizeFileMetadata(file: Express.Multer.File): {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  path: string;
} {
  return {
    filename: file.filename,
    originalName: path.basename(file.originalname), // Remove any directory info
    size: file.size,
    mimetype: file.mimetype,
    path: file.path
  };
}
