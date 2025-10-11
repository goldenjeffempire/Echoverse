import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../logger';

/**
 * Request ID Middleware
 * 
 * Generates or extracts a unique request ID for distributed tracing
 * and propagates it through headers and logs
 */

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Extract request ID from header or generate new one
  const requestId = 
    req.get('X-Request-ID') || 
    req.get('X-Correlation-ID') || 
    randomUUID();
  
  // Attach to request object
  req.id = requestId;
  
  // Set response headers for client-side tracing
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Correlation-ID', requestId);
  
  // Add to logger context
  const originalLog = logger.info.bind(logger);
  const originalError = logger.error.bind(logger);
  const originalWarn = logger.warn.bind(logger);
  
  // Override logger methods to include request ID
  (logger as any).info = (message: string, meta?: any) => {
    originalLog(message, { ...meta, requestId });
  };
  
  (logger as any).error = (message: string, error?: Error, meta?: any) => {
    originalError(message, error, { ...meta, requestId });
  };
  
  (logger as any).warn = (message: string, meta?: any) => {
    originalWarn(message, { ...meta, requestId });
  };
  
  next();
}

/**
 * Extract request ID from request
 */
export function getRequestId(req: Request): string {
  return req.id || 'unknown';
}

/**
 * Propagate request ID to external service calls
 */
export function getRequestHeaders(req: Request): Record<string, string> {
  return {
    'X-Request-ID': getRequestId(req),
    'X-Correlation-ID': getRequestId(req)
  };
}
