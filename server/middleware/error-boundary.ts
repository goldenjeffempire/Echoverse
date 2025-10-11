import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { errorResponse } from '../utils/apiResponse';
import { ZodError } from 'zod';

/**
 * Global Error Boundary Middleware
 * 
 * Catches all unhandled errors and returns standardized error responses
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorBoundary(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error with request context
  logger.error('Request error', err, {
    requestId: req.id,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    user: (req as any).user?.id,
    ip: req.ip
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    
    return errorResponse(res, 'Validation failed', 400, 'VALIDATION_ERROR', validationErrors);
  }

  // Handle custom app errors
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.code, err.details);
  }

  // Handle known error types
  if (err.name === 'UnauthorizedError') {
    return errorResponse(res, 'Unauthorized', 401);
  }

  if (err.name === 'ForbiddenError') {
    return errorResponse(res, 'Forbidden', 403);
  }

  if (err.name === 'NotFoundError') {
    return errorResponse(res, 'Resource not found', 404);
  }

  // Handle database errors
  if (err.name === 'QueryFailedError' || (err as any).code?.startsWith('23')) {
    return errorResponse(res, 'Database operation failed', 500, (err as any).code);
  }

  // Handle timeout errors
  if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
    return errorResponse(res, 'Request timeout', 408);
  }

  // Default to 500 for unknown errors
  errorResponse(res, 
    process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    500,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'production' 
      ? undefined 
      : err.stack
  );
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  errorResponse(res, `Route not found: ${req.method} ${req.path}`, 404);
}
