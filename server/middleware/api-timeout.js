import { logger } from '../logger';
/**
 * API request timeout middleware
 * Terminates requests that exceed the configured timeout
 */
export function apiTimeoutMiddleware(timeoutMs = 30000) {
    return (req, res, next) => {
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                logger.warn('API request timeout', {
                    method: req.method,
                    path: req.path,
                    timeout: timeoutMs,
                    ip: req.ip,
                });
                // PHASE 2: Track timeout metrics
                import('../monitoring/metrics').then(({ apiTimeoutsTotal }) => {
                    apiTimeoutsTotal.inc({
                        method: req.method,
                        path: req.path
                    });
                });
                res.status(408).json({
                    error: 'Request timeout',
                    code: 'REQUEST_TIMEOUT',
                    message: `Request exceeded ${timeoutMs}ms timeout`,
                });
            }
        }, timeoutMs);
        // Clear timeout when response finishes
        res.on('finish', () => {
            clearTimeout(timeout);
        });
        // Clear timeout on response close (connection terminated)
        res.on('close', () => {
            clearTimeout(timeout);
        });
        next();
    };
}
