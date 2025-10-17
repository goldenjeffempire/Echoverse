/**
 * P0 FIX #22: Stripe Payment Idempotency Middleware
 * Ensures payment requests are idempotent to prevent duplicate charges
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../logger';

// In-memory store for idempotency (use Redis in production for distributed systems)
const idempotencyStore = new Map<string, {
  response: any;
  timestamp: number;
}>();

// Clean up old idempotency keys every hour
setInterval(() => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();
  
  for (const [key, value] of idempotencyStore.entries()) {
    if (now - value.timestamp > ONE_DAY_MS) {
      idempotencyStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

export interface IdempotentRequest extends Request {
  idempotencyKey?: string;
}

/**
 * Stripe payment idempotency middleware
 * Prevents duplicate payments by tracking idempotency keys
 */
export function stripeIdempotencyMiddleware(
  req: IdempotentRequest,
  res: Response,
  next: NextFunction
): Response | void {
  // Get idempotency key from header (client should provide, or we generate one)
  let idempotencyKey = req.get('Idempotency-Key') || req.get('X-Idempotency-Key');
  
  // For Stripe payments, idempotency key is critical
  if (!idempotencyKey) {
    // In production, we should reject requests without idempotency key
    if (process.env.NODE_ENV === 'production') {
      return res.status(400).json({
        error: 'Idempotency-Key header required for payment requests',
        code: 'IDEMPOTENCY_KEY_REQUIRED'
      }) as any;
    }
    
    // In development, generate one automatically (with warning)
    idempotencyKey = randomUUID();
    logger.warn('Auto-generated idempotency key for development', {
      path: req.path,
      method: req.method,
      generatedKey: idempotencyKey
    });
  }
  
  // Check if we've seen this idempotency key before
  const cached = idempotencyStore.get(idempotencyKey);
  
  if (cached) {
    // Return cached response for duplicate request
    logger.info('Returning cached response for idempotent request', {
      idempotencyKey: idempotencyKey.substring(0, 8) + '...',
      path: req.path,
      age: Date.now() - cached.timestamp
    });
    
    return res.status(200).json(cached.response) as any;
  }
  
  // Store the idempotency key on the request for the handler to use
  req.idempotencyKey = idempotencyKey;
  
  // Intercept the response to cache it
  const originalJson = res.json.bind(res);
  res.json = function(body: any) {
    // Only cache successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyStore.set(idempotencyKey!, {
        response: body,
        timestamp: Date.now()
      });
      
      logger.debug('Cached idempotent response', {
        idempotencyKey: idempotencyKey!.substring(0, 8) + '...',
        statusCode: res.statusCode
      });
    }
    
    return originalJson(body);
  };
  
  next();
}

/**
 * Get Stripe idempotency key for outgoing Stripe API requests
 * This ensures our requests to Stripe are also idempotent
 */
export function getStripeIdempotencyKey(req: IdempotentRequest): string {
  return req.idempotencyKey || randomUUID();
}
