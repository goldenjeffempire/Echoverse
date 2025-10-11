/**
 * MED-006 FIX: API Versioning Enforcement
 * Enforce API version headers and route to correct handlers
 */
import { logger } from '../logger';
const CURRENT_VERSION = 'v1';
const SUPPORTED_VERSIONS = ['v1'];
const DEPRECATED_VERSIONS = [];
export function apiVersioningMiddleware(req, res, next) {
    // Skip non-API routes
    if (!req.path.startsWith('/api/')) {
        return next();
    }
    // Extract version from header or path
    const headerVersion = req.headers['api-version'];
    const pathMatch = req.path.match(/^\/api\/(v\d+)\//);
    const pathVersion = pathMatch ? pathMatch[1] : null;
    const requestedVersion = headerVersion || pathVersion || CURRENT_VERSION;
    // Check if version is supported
    if (!SUPPORTED_VERSIONS.includes(requestedVersion)) {
        logger.warn('Unsupported API version requested', {
            requestedVersion,
            supportedVersions: SUPPORTED_VERSIONS,
            path: req.path,
            ip: req.ip
        });
        res.status(400).json({
            error: 'Unsupported API version',
            requestedVersion,
            supportedVersions: SUPPORTED_VERSIONS,
            currentVersion: CURRENT_VERSION
        });
        return;
    }
    // Warn about deprecated versions
    if (DEPRECATED_VERSIONS.includes(requestedVersion)) {
        logger.warn('Deprecated API version in use', {
            version: requestedVersion,
            path: req.path,
            ip: req.ip
        });
        res.setHeader('X-API-Deprecation-Warning', `API ${requestedVersion} is deprecated. Please migrate to ${CURRENT_VERSION}`);
        res.setHeader('X-API-Sunset-Date', '2025-12-31'); // Set actual sunset date
    }
    // Set version headers
    res.setHeader('X-API-Version', requestedVersion);
    res.setHeader('X-API-Current-Version', CURRENT_VERSION);
    // Attach version to request for routing
    req.apiVersion = requestedVersion;
    next();
}
// Helper to create version-specific routes
export function versionedRoute(version, handler) {
    return (req, res, next) => {
        const requestVersion = req.apiVersion || CURRENT_VERSION;
        if (requestVersion === version) {
            return handler(req, res, next);
        }
        next();
    };
}
