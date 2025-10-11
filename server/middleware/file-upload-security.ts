import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-boundary';
import { logger } from '../logger';
import fs from 'fs/promises';
import path from 'path';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Enhanced File Upload Security
 * 
 * Features:
 * - SVG sanitization to prevent XSS attacks
 * - Content-Disposition headers for download security
 * - File quarantine system for virus scanning integration
 * - Malicious file pattern detection
 */

const QUARANTINE_DIR = process.env.QUARANTINE_DIR || './quarantine';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

/**
 * SVG Sanitization Configuration
 * Removes scripts, event handlers, and dangerous elements from SVG files
 */
const SVG_SANITIZE_CONFIG = {
  USE_PROFILES: { svg: true, svgFilters: true },
  ADD_TAGS: ['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'g', 'text', 'defs', 'linearGradient', 'radialGradient', 'stop', 'pattern', 'clipPath', 'mask', 'image', 'use'],
  ADD_ATTR: ['viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'transform', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'points', 'offset', 'stop-color', 'stop-opacity', 'fill-opacity', 'stroke-opacity', 'id', 'class', 'style', 'gradientUnits', 'gradientTransform', 'patternUnits', 'patternTransform', 'clip-path', 'mask', 'xlink:href', 'href'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'foreignObject', 'input', 'textarea', 'form', 'base', 'link', 'meta'],
  FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onmousemove', 'onmousedown', 'onmouseup', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeypress', 'onkeydown', 'onkeyup'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: true,
  WHOLE_DOCUMENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  FORCE_BODY: false,
  SANITIZE_DOM: true,
  KEEP_CONTENT: false,
  IN_PLACE: false,
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
};

/**
 * Sanitize SVG file content to prevent XSS attacks
 */
export async function sanitizeSvgFile(filePath: string): Promise<void> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Check if file is actually SVG
    if (!content.trim().toLowerCase().includes('<svg')) {
      throw new AppError(400, 'File is not a valid SVG', 'INVALID_SVG');
    }
    
    // Sanitize SVG content with DOMPurify
    const sanitized = DOMPurify.sanitize(content, SVG_SANITIZE_CONFIG);
    
    // Additional security checks
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<foreignObject/i,
      /data:text\/html/i,
      /vbscript:/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitized)) {
        logger.warn('Dangerous pattern detected in SVG after sanitization', {
          filePath,
          pattern: pattern.toString()
        });
        throw new AppError(400, 'SVG contains potentially dangerous content', 'DANGEROUS_SVG');
      }
    }
    
    // Write sanitized content back to file
    await fs.writeFile(filePath, sanitized, 'utf-8');
    
    logger.info('SVG file sanitized successfully', { filePath });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('SVG sanitization failed', error instanceof Error ? error : undefined);
    throw new AppError(500, 'Failed to sanitize SVG file', 'SVG_SANITIZATION_FAILED');
  }
}

/**
 * SECURITY FIX (CRIT-007): Validate file path to prevent path traversal attacks
 * Ensures file paths don't escape intended directories
 */
export function validateFilePath(filePath: string, allowedDir: string): boolean {
  try {
    // Resolve both paths to absolute paths
    const resolvedPath = path.resolve(filePath);
    const resolvedAllowedDir = path.resolve(allowedDir);
    
    // Check if resolved path starts with allowed directory
    const isWithinAllowed = resolvedPath.startsWith(resolvedAllowedDir);
    
    // Additional checks for path traversal patterns
    const dangerousPatterns = [
      /\.\./,           // Parent directory references
      /~\//,            // Home directory
      /\/\//,           // Double slashes
      /\0/,             // Null bytes
      /%00/,            // Encoded null bytes
      /%2e%2e/i,        // Encoded ..
      /%2f/i,           // Encoded /
      /%5c/i,           // Encoded \
    ];
    
    const hasDangerousPattern = dangerousPatterns.some(pattern => pattern.test(filePath));
    
    if (hasDangerousPattern) {
      logger.warn('Path traversal attempt detected', {
        filePath,
        resolvedPath,
        allowedDir: resolvedAllowedDir
      });
      return false;
    }
    
    return isWithinAllowed;
  } catch (error) {
    logger.error('Path validation error', error instanceof Error ? error : undefined);
    return false;
  }
}

/**
 * Quarantine file for virus scanning
 * In production, integrate with ClamAV, VirusTotal API, or similar
 */
export async function quarantineFile(filePath: string): Promise<string> {
  try {
    // SECURITY: Validate path to prevent traversal
    if (!validateFilePath(filePath, UPLOAD_DIR)) {
      throw new AppError(400, 'Invalid file path', 'PATH_TRAVERSAL_ATTEMPT');
    }
    
    // Ensure quarantine directory exists
    await fs.mkdir(QUARANTINE_DIR, { recursive: true });
    
    const filename = path.basename(filePath);
    const quarantinePath = path.join(QUARANTINE_DIR, `${Date.now()}_${filename}`);
    
    // Validate quarantine path as well
    if (!validateFilePath(quarantinePath, QUARANTINE_DIR)) {
      throw new AppError(400, 'Invalid quarantine path', 'INVALID_QUARANTINE_PATH');
    }
    
    // Move file to quarantine
    await fs.rename(filePath, quarantinePath);
    
    logger.info('File moved to quarantine', { 
      originalPath: filePath, 
      quarantinePath 
    });
    
    return quarantinePath;
  } catch (error) {
    logger.error('Failed to quarantine file', error instanceof Error ? error : undefined);
    throw new AppError(500, 'Failed to quarantine file', 'QUARANTINE_FAILED');
  }
}

/**
 * FIXED AUDIT #3: Production-ready virus scanning
 * Uses ClamAV, cloud service, or enhanced pattern matching
 */
export async function scanFileForViruses(filePath: string): Promise<{
  clean: boolean;
  threats: string[];
}> {
  const { virusScanner } = await import('../services/virus-scanner');
  const result = await virusScanner.scanFile(filePath);
  return {
    clean: result.clean,
    threats: result.threats
  };
}

/**
 * Post-upload security validation middleware
 * Sanitizes SVG files and applies security checks
 */
export async function postUploadSecurityValidation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const file = (req as any).file;
    const files = (req as any).files;
    
    const filesToProcess = files ? (Array.isArray(files) ? files : Object.values(files).flat()) : (file ? [file] : []);
    
    for (const uploadedFile of filesToProcess) {
      const filePath = uploadedFile.path;
      const mimeType = uploadedFile.mimetype;
      
      // CRIT-005 FIX: Validate file path to prevent path traversal attacks
      if (!validateFilePath(filePath, UPLOAD_DIR)) {
        logger.error('Path traversal attempt detected in upload', undefined, {
          filePath,
          originalName: uploadedFile.originalname,
          userId: (req as any).user?.id
        });
        // Delete the uploaded file
        try {
          await fs.unlink(filePath);
        } catch (unlinkError) {
          logger.error('Failed to delete suspicious file', unlinkError as Error);
        }
        throw new AppError(400, 'Invalid file path - possible path traversal attempt', 'PATH_TRAVERSAL_DETECTED');
      }
      
      // SVG sanitization
      if (mimeType === 'image/svg+xml') {
        await sanitizeSvgFile(filePath);
      }
      
      // Virus scanning
      const scanResult = await scanFileForViruses(filePath);
      if (!scanResult.clean) {
        // Quarantine suspicious file
        await quarantineFile(filePath);
        
        logger.warn('Suspicious file detected and quarantined', {
          filename: uploadedFile.originalname,
          threats: scanResult.threats,
          userId: (req as any).user?.id
        });
        
        throw new AppError(
          400,
          `File rejected: ${scanResult.threats.join(', ')}`,
          'SUSPICIOUS_FILE',
          { threats: scanResult.threats }
        );
      }
      
      // CRITICAL FIX #14: Encrypt file at rest (MANDATORY in production)
      const { encryptFile, isFileEncryptionEnabled } = await import('../services/file-encryption');
      if (isFileEncryptionEnabled()) {
        try {
          const encryptionResult = await encryptFile(filePath);
          
          // Store encryption metadata on the file object for later persistence
          uploadedFile.encryptionIv = encryptionResult.iv;
          uploadedFile.encryptionAuthTag = encryptionResult.authTag;
          uploadedFile.encryptedPath = encryptionResult.encryptedPath;
          uploadedFile.isEncrypted = true;
          
          logger.info('File encrypted at rest', {
            filename: uploadedFile.originalname,
            encryptedPath: encryptionResult.encryptedPath
          });
        } catch (error) {
          // SECURITY: In production, FAIL the upload if encryption cannot be completed
          // Files must NEVER be stored unencrypted when encryption is enabled
          logger.error('File encryption failed - rejecting upload', error instanceof Error ? error : undefined);
          
          // Clean up the unencrypted file
          try {
            await fs.unlink(filePath);
          } catch (cleanupError) {
            logger.error('Failed to clean up unencrypted file', cleanupError instanceof Error ? cleanupError : undefined);
          }
          
          throw new AppError(
            500,
            'File encryption failed. Upload rejected for security reasons.',
            'ENCRYPTION_FAILED',
            { originalError: error instanceof Error ? error.message : 'Unknown error' }
          );
        }
      }
    }
    
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error('Post-upload validation failed', error instanceof Error ? error : undefined);
      next(new AppError(500, 'File validation failed', 'VALIDATION_FAILED'));
    }
  }
}

/**
 * Set secure Content-Disposition headers for file downloads
 * Prevents XSS via Content-Type sniffing and forces download behavior
 */
export function setSecureDownloadHeaders(
  res: Response,
  filename: string,
  mimeType: string,
  forceDownload: boolean = false
): void {
  // Sanitize filename for Content-Disposition header
  const sanitizedFilename = filename.replace(/[^\w.-]/g, '_');
  
  // Set Content-Disposition header
  const disposition = forceDownload ? 'attachment' : 'inline';
  res.setHeader('Content-Disposition', `${disposition}; filename="${sanitizedFilename}"`);
  
  // Set Content-Type with nosniff
  res.setHeader('Content-Type', mimeType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Additional security headers for downloads
  res.setHeader('X-Download-Options', 'noopen'); // IE-specific
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Cache control for sensitive files
  if (forceDownload) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}

/**
 * Middleware to apply secure download headers to file responses
 */
export function secureFileDownloadMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const originalSend = res.send;
  const originalSendFile = res.sendFile;
  
  // Override sendFile to add security headers
  res.sendFile = function(filePath: string, options?: any, fn?: any) {
    const filename = path.basename(filePath);
    const mimeType = options?.headers?.['Content-Type'] || 'application/octet-stream';
    const forceDownload = options?.forceDownload ?? true;
    
    setSecureDownloadHeaders(res, filename, mimeType, forceDownload);
    
    return originalSendFile.call(this, filePath, options, fn);
  };
  
  next();
}

/**
 * Initialize quarantine directory on startup
 */
export async function initializeQuarantineDirectory(): Promise<void> {
  try {
    await fs.mkdir(QUARANTINE_DIR, { recursive: true });
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    logger.info('Upload and quarantine directories initialized', {
      uploadDir: UPLOAD_DIR,
      quarantineDir: QUARANTINE_DIR
    });
  } catch (error) {
    logger.error('Failed to initialize directories', error instanceof Error ? error : undefined);
    throw error;
  }
}
