import { randomUUID } from 'crypto';
import { logger } from '../logger';
export function requestIdMiddleware(req, res, next) {
    // Extract request ID from header or generate new one
    const requestId = req.get('X-Request-ID') ||
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
    logger.info = (message, meta) => {
        originalLog(message, { ...meta, requestId });
    };
    logger.error = (message, error, meta) => {
        originalError(message, error, { ...meta, requestId });
    };
    logger.warn = (message, meta) => {
        originalWarn(message, { ...meta, requestId });
    };
    next();
}
/**
 * Extract request ID from request
 */
export function getRequestId(req) {
    return req.id || 'unknown';
}
/**
 * Propagate request ID to external service calls
 */
export function getRequestHeaders(req) {
    return {
        'X-Request-ID': getRequestId(req),
        'X-Correlation-ID': getRequestId(req)
    };
}
