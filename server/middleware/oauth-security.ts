/**
 * SECURITY FIX (CRIT-015): OAuth Redirect URL Whitelist
 * Prevents open redirect vulnerabilities in OAuth flow
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-boundary';
import { logger } from '../logger';

// Whitelist of allowed redirect URLs
const ALLOWED_REDIRECT_URLS = [
  'http://localhost:5000/auth/callback',
  'http://localhost:5173/auth/callback',
];

// Add production domain from environment
if (process.env.PRODUCTION_URL) {
  ALLOWED_REDIRECT_URLS.push(`${process.env.PRODUCTION_URL}/auth/callback`);
}

// Custom redirect URLs from environment (comma-separated)
if (process.env.OAUTH_ALLOWED_REDIRECTS) {
  const customRedirects = process.env.OAUTH_ALLOWED_REDIRECTS.split(',');
  ALLOWED_REDIRECT_URLS.push(...customRedirects);
}

/**
 * Validate OAuth redirect URL against whitelist
 */
export function validateRedirectUrl(redirectUrl: string): boolean {
  try {
    const url = new URL(redirectUrl);
    
    // SECURITY: Prevent protocol-based attacks
    if (!['http:', 'https:'].includes(url.protocol)) {
      logger.warn('Invalid redirect URL protocol', {
        url: redirectUrl,
        protocol: url.protocol
      });
      return false;
    }
    
    // SECURITY: Prevent open redirects via allowed URLs
    const isWhitelisted = ALLOWED_REDIRECT_URLS.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        
        // Exact match required (including path)
        return url.origin === allowedUrl.origin && 
               url.pathname === allowedUrl.pathname;
      } catch {
        return false;
      }
    });
    
    if (!isWhitelisted) {
      logger.warn('Redirect URL not whitelisted', {
        url: redirectUrl,
        whitelisted: ALLOWED_REDIRECT_URLS
      });
      return false;
    }
    
    // SECURITY: Prevent URL manipulation attacks
    const dangerousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /@/,              // Prevents user:pass@evil.com
      /\\/,             // Prevents backslash tricks
      /%2f/i,           // Encoded slash
      /%5c/i,           // Encoded backslash
    ];
    
    const hasDangerousPattern = dangerousPatterns.some(pattern => 
      pattern.test(redirectUrl)
    );
    
    if (hasDangerousPattern) {
      logger.warn('Dangerous pattern in redirect URL', {
        url: redirectUrl
      });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Invalid redirect URL format', error instanceof Error ? error : new Error('Invalid redirect URL format'));
    return false;
  }
}

/**
 * OAuth redirect URL validation middleware
 */
export function validateOAuthRedirect(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const redirectUrl = req.query.redirect_uri as string || 
                      req.body.redirect_uri as string;
  
  if (!redirectUrl) {
    throw new AppError(400, 'redirect_uri is required', 'MISSING_REDIRECT_URI');
  }
  
  if (!validateRedirectUrl(redirectUrl)) {
    logger.warn('OAuth redirect validation failed', {
      redirectUrl,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    throw new AppError(
      400,
      'Invalid redirect_uri. URL must be pre-registered.',
      'INVALID_REDIRECT_URI'
    );
  }
  
  // Store validated redirect URL for use in OAuth flow
  (req as any).validatedRedirectUrl = redirectUrl;
  
  next();
}

/**
 * Generate OAuth state parameter with CSRF protection
 */
export function generateOAuthState(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(randomBytes, byte => 
    byte.toString(16).padStart(2, '0')
  ).join('');
}

/**
 * Validate OAuth state parameter
 */
export function validateOAuthState(
  receivedState: string,
  sessionState: string
): boolean {
  if (!receivedState || !sessionState) {
    return false;
  }
  
  // Timing-safe comparison
  if (receivedState.length !== sessionState.length) {
    return false;
  }
  
  let mismatch = 0;
  for (let i = 0; i < receivedState.length; i++) {
    mismatch |= receivedState.charCodeAt(i) ^ sessionState.charCodeAt(i);
  }
  
  return mismatch === 0;
}

/**
 * Add allowed redirect URL programmatically (for testing)
 */
export function addAllowedRedirectUrl(url: string): void {
  if (validateRedirectUrl(url)) {
    ALLOWED_REDIRECT_URLS.push(url);
    logger.info('Added allowed redirect URL', { url });
  }
}

export { ALLOWED_REDIRECT_URLS };
