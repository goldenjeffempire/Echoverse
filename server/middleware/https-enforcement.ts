import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * HTTPS Enforcement Middleware
 * Redirects HTTP requests to HTTPS in production and sets HSTS headers.
 */
export function enforceHttps(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'production') {
    // Check multiple headers for HTTPS
    const isHttps = 
      req.headers['x-forwarded-proto'] === 'https' ||
      req.secure ||
      (req.socket && 'encrypted' in req.socket && req.socket.encrypted);

    if (!isHttps) {
      // Set HSTS header
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }

    // Always set HSTS on HTTPS connections
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
}

/**
 * Security Headers Middleware
 * Adds additional security headers beyond Helmet
 */
export function additionalSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent browsers from MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Clickjacking protection
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Clear site data on logout
  if (req.path === '/api/auth/logout' || req.path === '/api/auth/logout-all') {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
  }

  next();
}