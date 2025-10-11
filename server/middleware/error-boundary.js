import { logger } from '../logger';
import { errorResponse } from '../utils/apiResponse';
import { ZodError } from 'zod';
/**
 * Global Error Boundary Middleware
 *
 * Catches all unhandled errors and returns standardized error responses
 */
export class AppError extends Error {
    constructor(statusCode, message, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
export function errorBoundary(err, req, res, next) {
    // Log error with request context
    logger.error('Request error', err, {
        requestId: req.id,
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined,
        user: req.user?.id,
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
    if (err.name === 'QueryFailedError' || err.code?.startsWith('23')) {
        return errorResponse(res, 'Database operation failed', 500, err.code);
    }
    // Handle timeout errors
    if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
        return errorResponse(res, 'Request timeout', 408);
    }
    // Default to 500 for unknown errors
    errorResponse(res, process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message, 500, 'INTERNAL_ERROR', process.env.NODE_ENV === 'production'
        ? undefined
        : err.stack);
}
/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
/**
 * Not found handler
 */
export function notFoundHandler(req, res) {
    errorResponse(res, `Route not found: ${req.method} ${req.path}`, 404);
}
