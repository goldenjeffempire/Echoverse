/**
 * Compression Middleware
 * Issue #40: Enable Gzip/Brotli compression for all API responses
 */
import compression from 'compression';
export const compressionMiddleware = compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    level: 6, // Balance between speed and compression ratio
    threshold: 1024, // Only compress responses larger than 1KB
    memLevel: 8
});
