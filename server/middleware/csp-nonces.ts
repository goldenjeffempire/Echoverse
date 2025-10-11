/**
 * Content Security Policy with Nonces
 * PHASE A: Critical Security - CSP nonces for inline scripts/styles
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface NonceRequest extends Request {
  nonce?: string;
}

export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

export function cspNonceMiddleware(
  req: NonceRequest,
  res: Response,
  next: NextFunction
): void {
  const nonce = generateNonce();
  req.nonce = nonce;
  
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://cdn.jsdelivr.net;
    style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob:;
    connect-src 'self' https://api.stripe.com https://api.openai.com;
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim();
  
  res.setHeader('Content-Security-Policy', cspHeader);
  
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(self)'
  );
  
  next();
}

export function strictCSP(additionalSources?: {
  scriptSrc?: string[];
  styleSrc?: string[];
  connectSrc?: string[];
}) {
  return (req: NonceRequest, res: Response, next: NextFunction) => {
    const nonce = generateNonce();
    req.nonce = nonce;
    
    const scriptSrc = [
      "'self'",
      `'nonce-${nonce}'`,
      ...(additionalSources?.scriptSrc || [])
    ].join(' ');
    
    const styleSrc = [
      "'self'",
      `'nonce-${nonce}'`,
      ...(additionalSources?.styleSrc || [])
    ].join(' ');
    
    const connectSrc = [
      "'self'",
      ...(additionalSources?.connectSrc || [])
    ].join(' ');
    
    const cspHeader = `
      default-src 'self';
      script-src ${scriptSrc};
      style-src ${styleSrc};
      connect-src ${connectSrc};
      img-src 'self' data: https: blob:;
      font-src 'self' https://fonts.gstatic.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim();
    
    res.setHeader('Content-Security-Policy', cspHeader);
    next();
  };
}

export function reportOnlyCSP(reportUri: string) {
  return (req: NonceRequest, res: Response, next: NextFunction) => {
    const nonce = generateNonce();
    req.nonce = nonce;
    
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}';
      style-src 'self' 'nonce-${nonce}';
      report-uri ${reportUri};
    `.replace(/\s+/g, ' ').trim();
    
    res.setHeader('Content-Security-Policy-Report-Only', cspHeader);
    next();
  };
}
