/**
 * CAPTCHA Middleware for Bot Protection
 * PHASE A.3: Implements CAPTCHA verification for registration and login
 * 
 * Supports:
 * - hCaptcha
 * - Google reCAPTCHA v2/v3
 * 
 * Configuration via environment variables:
 * - CAPTCHA_PROVIDER: 'hcaptcha' | 'recaptcha' | 'none'
 * - CAPTCHA_SECRET_KEY: Secret key from CAPTCHA provider
 * - CAPTCHA_ENABLED: Enable/disable CAPTCHA (default: true in production)
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

// Configuration
const CAPTCHA_PROVIDER = (process.env.CAPTCHA_PROVIDER || 'hcaptcha') as 'hcaptcha' | 'recaptcha' | 'none';
const CAPTCHA_SECRET_KEY = process.env.CAPTCHA_SECRET_KEY || '';
const CAPTCHA_ENABLED = process.env.CAPTCHA_ENABLED !== 'false';
const CAPTCHA_SCORE_THRESHOLD = parseFloat(process.env.CAPTCHA_SCORE_THRESHOLD || '0.5');

interface CaptchaVerificationResponse {
  success: boolean;
  score?: number;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify hCaptcha token
 */
async function verifyHCaptcha(token: string, remoteIp?: string): Promise<CaptchaVerificationResponse> {
  const params = new URLSearchParams({
    secret: CAPTCHA_SECRET_KEY,
    response: token,
    ...(remoteIp && { remoteip: remoteIp })
  });

  const response = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  return response.json();
}

/**
 * Verify Google reCAPTCHA token
 */
async function verifyRecaptcha(token: string, remoteIp?: string): Promise<CaptchaVerificationResponse> {
  const params = new URLSearchParams({
    secret: CAPTCHA_SECRET_KEY,
    response: token,
    ...(remoteIp && { remoteip: remoteIp })
  });

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  return response.json();
}

/**
 * Main CAPTCHA verification function
 */
async function verifyCaptcha(
  token: string,
  remoteIp?: string
): Promise<{ valid: boolean; error?: string; score?: number }> {
  
  // If CAPTCHA is disabled or provider is 'none', skip verification
  if (!CAPTCHA_ENABLED || CAPTCHA_PROVIDER === 'none') {
    logger.debug('CAPTCHA verification skipped (disabled or provider=none)');
    return { valid: true };
  }

  // Check if secret key is configured
  if (!CAPTCHA_SECRET_KEY) {
    logger.error('CAPTCHA secret key not configured', undefined, {
      provider: CAPTCHA_PROVIDER,
      enabled: CAPTCHA_ENABLED
    });
    // In development, allow without CAPTCHA if not configured
    if (process.env.NODE_ENV === 'development') {
      logger.warn('CAPTCHA verification skipped in development (no secret key)');
      return { valid: true };
    }
    return { valid: false, error: 'CAPTCHA not configured on server' };
  }

  if (!token) {
    return { valid: false, error: 'CAPTCHA token missing' };
  }

  try {
    let result: CaptchaVerificationResponse;

    // Verify based on provider
    if (CAPTCHA_PROVIDER === 'hcaptcha') {
      result = await verifyHCaptcha(token, remoteIp);
    } else if (CAPTCHA_PROVIDER === 'recaptcha') {
      result = await verifyRecaptcha(token, remoteIp);
    } else {
      return { valid: false, error: `Unknown CAPTCHA provider: ${CAPTCHA_PROVIDER}` };
    }

    // Check verification result
    if (!result.success) {
      const errorCodes = result['error-codes']?.join(', ') || 'unknown error';
      logger.warn('CAPTCHA verification failed', {
        provider: CAPTCHA_PROVIDER,
        errors: errorCodes,
        ip: remoteIp
      });
      return { 
        valid: false, 
        error: `CAPTCHA verification failed: ${errorCodes}` 
      };
    }

    // For reCAPTCHA v3, check score
    if (result.score !== undefined) {
      if (result.score < CAPTCHA_SCORE_THRESHOLD) {
        logger.warn('CAPTCHA score below threshold', {
          provider: CAPTCHA_PROVIDER,
          score: result.score,
          threshold: CAPTCHA_SCORE_THRESHOLD,
          ip: remoteIp
        });
        return {
          valid: false,
          error: 'CAPTCHA score too low (possible bot)',
          score: result.score
        };
      }
    }

    logger.debug('CAPTCHA verification successful', {
      provider: CAPTCHA_PROVIDER,
      score: result.score,
      ip: remoteIp
    });

    return { valid: true, score: result.score };

  } catch (error) {
    logger.error('CAPTCHA verification error', error instanceof Error ? error : undefined, {
      provider: CAPTCHA_PROVIDER,
      ip: remoteIp
    });
    
    // In production, fail closed (reject on error)
    // In development, fail open (allow on error) for easier testing
    const allowOnError = process.env.NODE_ENV === 'development';
    return {
      valid: allowOnError,
      error: allowOnError 
        ? 'CAPTCHA verification error (allowed in development)'
        : 'CAPTCHA verification service unavailable'
    };
  }
}

/**
 * Express middleware for CAPTCHA verification
 * 
 * Expected request body:
 * - captchaToken: The CAPTCHA response token from the client
 * 
 * Usage:
 * app.post('/api/auth/register', captchaMiddleware, registerHandler);
 * app.post('/api/auth/login', captchaMiddleware, loginHandler);
 */
export async function captchaMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  
  // Skip CAPTCHA if disabled
  if (!CAPTCHA_ENABLED || CAPTCHA_PROVIDER === 'none') {
    return next();
  }

  const captchaToken = req.body?.captchaToken || req.headers['x-captcha-token'];
  const remoteIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
                   req.ip || 
                   req.socket.remoteAddress;

  const verification = await verifyCaptcha(captchaToken, remoteIp);

  if (!verification.valid) {
    res.status(400).json({
      error: 'CAPTCHA verification failed',
      code: 'CAPTCHA_VERIFICATION_FAILED',
      message: verification.error || 'Please complete the CAPTCHA challenge',
      ...(verification.score !== undefined && { score: verification.score })
    });
    return;
  }

  // CAPTCHA verified successfully
  next();
}

/**
 * Optional: More lenient CAPTCHA for low-risk operations
 * Uses a lower score threshold
 */
export async function captchaMiddlewareLenient(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  
  if (!CAPTCHA_ENABLED || CAPTCHA_PROVIDER === 'none') {
    return next();
  }

  const captchaToken = req.body?.captchaToken || req.headers['x-captcha-token'];
  const remoteIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
                   req.ip || 
                   req.socket.remoteAddress;

  const verification = await verifyCaptcha(captchaToken, remoteIp);

  // More lenient: only block if clearly a bot (score < 0.3)
  if (!verification.valid && (!verification.score || verification.score < 0.3)) {
    res.status(400).json({
      error: 'CAPTCHA verification failed',
      code: 'CAPTCHA_VERIFICATION_FAILED',
      message: 'Please complete the CAPTCHA challenge'
    });
    return;
  }

  next();
}

/**
 * Skip CAPTCHA for specific routes (e.g., health checks, webhooks)
 */
export function skipCaptcha(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  (req as any).skipCaptcha = true;
  next();
}

/**
 * Conditional CAPTCHA middleware
 * Only runs if not explicitly skipped
 */
export async function conditionalCaptcha(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if ((req as any).skipCaptcha) {
    return next();
  }
  return captchaMiddleware(req, res, next);
}

export { verifyCaptcha };
