import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { 
  isValidUriScheme, 
  encodeHtmlEntities, 
  sanitizeEventHandlers,
  verifyCsrfToken,
  generateCsrfToken
} from '../utils/security';

export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      let sanitized = value.trim();
      
      // Enhanced XSS protection - remove dangerous tags
      sanitized = sanitized
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<embed\b[^>]*>/gi, '')
        .replace(/<object\b[^>]*>/gi, '')
        .replace(/<applet\b[^>]*>/gi, '')
        .replace(/<meta\b[^>]*>/gi, '')
        .replace(/<link\b[^>]*>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
      
      // Remove all event handlers (onerror, onload, onclick, etc.)
      sanitized = sanitizeEventHandlers(sanitized);
      
      // Validate and sanitize URIs in common attributes
      const uriPattern = /(href|src|action|formaction|data|codebase)\s*=\s*["']([^"']*)["']/gi;
      sanitized = sanitized.replace(uriPattern, (match, attr, uri) => {
        if (!isValidUriScheme(uri)) {
          return ''; // Remove dangerous URI
        }
        return match;
      });
      
      // Remove dangerous URI schemes even without quotes
      sanitized = sanitized
        .replace(/javascript:/gi, '')
        .replace(/data:text\/html/gi, '')
        .replace(/vbscript:/gi, '');
      
      return sanitized;
    }
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      }
      const sanitized: any = {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  next();
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    // Skip CSRF for initial auth (login/register need to establish session first) and webhooks (they use signature verification)
    const authExemptions = ['/api/auth/login', '/api/auth/register'];
    if (authExemptions.includes(req.path) || req.path.startsWith('/api/webhooks/')) {
      return next();
    }

    // Double-submit cookie pattern: validate token from both header and cookie
    const csrfTokenHeader = req.get('X-CSRF-Token') || req.get('X-XSRF-Token');
    const csrfTokenCookie = req.cookies?.['XSRF-TOKEN'];
    
    if (csrfTokenHeader && csrfTokenCookie) {
      if (!verifyCsrfToken(csrfTokenHeader, csrfTokenCookie)) {
        return res.status(403).json({ message: 'CSRF validation failed: invalid token' });
      }
    } else if (process.env.NODE_ENV === 'production') {
      // In production, require CSRF tokens for all state-changing operations
      return res.status(403).json({ message: 'CSRF validation failed: missing token' });
    }

    // Additional origin validation
    const origin = req.get('origin') || req.get('referer');
    const host = req.get('host');
    
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
        const isAllowedOrigin = allowedOrigins.includes(originUrl.origin) || 
          (process.env.NODE_ENV === 'development' && (originUrl.hostname === 'localhost' || originUrl.hostname === host));
        
        if (!isAllowedOrigin && originUrl.host !== host) {
          return res.status(403).json({ message: 'CSRF validation failed: invalid origin' });
        }
      } catch (error) {
        return res.status(403).json({ message: 'CSRF validation failed: invalid origin format' });
      }
    }
  }
  next();
}

// Middleware to set CSRF token cookie for client-side retrieval
export function setCsrfTokenCookie(req: Request, res: Response, next: NextFunction) {
  if (!req.cookies?.['XSRF-TOKEN']) {
    const token = generateCsrfToken();
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Must be accessible to JavaScript for double-submit pattern
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' to support OAuth flows
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }
  next();
}

export const emailValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address')
];

export const passwordValidator = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    .withMessage('Password must contain at least one special character')
];

export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

export function fileUploadValidator(allowedTypes: string[], maxSize: number = 10 * 1024 * 1024) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body.file) {
      return next();
    }

    const file = req.body.file;
    
    if (file.size > maxSize) {
      return res.status(400).json({ message: `File size must be less than ${maxSize / (1024 * 1024)}MB` });
    }

    const fileType = file.mimeType || file.type;
    if (!allowedTypes.some(type => fileType.startsWith(type))) {
      return res.status(400).json({ message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` });
    }

    next();
  };
}
