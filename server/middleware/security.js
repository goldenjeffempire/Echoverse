import { body, validationResult } from 'express-validator';
import { isValidUriScheme, sanitizeEventHandlers, verifyCsrfToken, generateCsrfToken, generateBoundCsrfToken, verifyBoundCsrfToken } from '../utils/security';
/**
 * Deep sanitization with cycle detection and depth limiting
 * Prevents prototype pollution and handles deeply nested objects safely
 */
export function sanitizeInput(req, res, next) {
    const MAX_DEPTH = 5; // Reduced from 10 to prevent deeply nested attacks
    const seen = new WeakSet(); // Cycle detection
    const sanitizeValue = (value, depth = 0) => {
        // Depth limit to prevent stack overflow attacks
        if (depth > MAX_DEPTH) {
            return undefined;
        }
        // Handle strings
        if (typeof value === 'string') {
            let sanitized = value.trim();
            // Length limit to prevent DoS
            if (sanitized.length > 10000) {
                sanitized = sanitized.substring(0, 10000);
            }
            // Enhanced XSS protection - remove dangerous tags
            sanitized = sanitized
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                .replace(/<embed\b[^>]*>/gi, '')
                .replace(/<object\b[^>]*>/gi, '')
                .replace(/<applet\b[^>]*>/gi, '')
                .replace(/<meta\b[^>]*>/gi, '')
                .replace(/<link\b[^>]*>/gi, '')
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
            // Remove all event handlers (onerror, onload, onclick, etc.)
            sanitized = sanitizeEventHandlers(sanitized);
            // Validate and sanitize URIs in common attributes
            const uriPattern = /(href|src|action|formaction|data|codebase)\s*=\s*["']([^"']*)["']/gi;
            sanitized = sanitized.replace(uriPattern, (match, attr, uri) => {
                if (!isValidUriScheme(uri)) {
                    return ''; // Remove dangerous URI
                }
                return match;
            });
            // Remove dangerous URI schemes even without quotes
            sanitized = sanitized
                .replace(/javascript:/gi, '')
                .replace(/data:text\/html/gi, '')
                .replace(/vbscript:/gi, '');
            return sanitized;
        }
        // Handle objects (including arrays)
        if (typeof value === 'object' && value !== null) {
            // Cycle detection
            if (seen.has(value)) {
                return undefined; // Break circular reference
            }
            seen.add(value);
            // Handle arrays
            if (Array.isArray(value)) {
                // Limit array size to prevent DoS
                const limitedArray = value.slice(0, 1000);
                return limitedArray.map(item => sanitizeValue(item, depth + 1));
            }
            // Handle objects
            const sanitized = {};
            let keyCount = 0;
            for (const key in value) {
                // Prevent prototype pollution
                if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                    continue;
                }
                // Only process own properties
                if (!Object.prototype.hasOwnProperty.call(value, key)) {
                    continue;
                }
                // Limit object size to prevent DoS
                if (keyCount >= 100) {
                    break;
                }
                sanitized[key] = sanitizeValue(value[key], depth + 1);
                keyCount++;
            }
            return sanitized;
        }
        // Handle other types (numbers, booleans, etc.)
        return value;
    };
    if (req.body) {
        req.body = sanitizeValue(req.body);
        // CRITICAL FIX #6: Enhanced GraphQL introspection blocking with comprehensive patterns
        if (process.env.ENABLE_GRAPHQL === 'true' && req.body.query) {
            // Block introspection queries in production with case-insensitive comprehensive patterns
            const query = String(req.body.query).toLowerCase().replace(/\s+/g, '');
            const introspectionPatterns = [
                '__schema',
                '__type',
                '__typename',
                'introspectionquery',
                '__directive',
                '__field',
                '__inputvalue',
                '__enumvalue',
                '__directivelocation',
                '__typekind',
                'introspection',
                'query{__schema',
                '{__schema',
                '__introspection'
            ];
            if (process.env.NODE_ENV === 'production' &&
                introspectionPatterns.some(pattern => query.includes(pattern))) {
                throw new Error('GraphQL introspection is disabled in production');
            }
            req.body = sanitizeGraphQLQuery(req.body);
        }
    }
    if (req.query) {
        req.query = sanitizeValue(req.query);
    }
    if (req.params) {
        req.params = sanitizeValue(req.params);
    }
    next();
}
/**
 * GraphQL query sanitization
 * Sanitizes GraphQL queries and variables to prevent injection attacks
 */
function sanitizeGraphQLQuery(body) {
    if (!body || typeof body !== 'object') {
        return body;
    }
    const sanitized = { ...body };
    // Sanitize query string
    if (typeof sanitized.query === 'string') {
        // Remove dangerous introspection queries in production
        if (process.env.NODE_ENV === 'production') {
            const dangerousPatterns = [
                /__schema/i,
                /__type/i,
                /IntrospectionQuery/i
            ];
            for (const pattern of dangerousPatterns) {
                if (pattern.test(sanitized.query)) {
                    sanitized.query = sanitized.query.replace(pattern, '');
                }
            }
        }
        // Limit query length to prevent DoS
        if (sanitized.query.length > 10000) {
            sanitized.query = sanitized.query.substring(0, 10000);
        }
        // Remove potential injection patterns
        sanitized.query = sanitized.query
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '');
    }
    // Sanitize variables
    if (sanitized.variables && typeof sanitized.variables === 'object') {
        sanitized.variables = JSON.parse(JSON.stringify(sanitized.variables, (key, value) => {
            if (typeof value === 'string') {
                return value
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .substring(0, 1000); // Limit variable length
            }
            return value;
        }));
    }
    return sanitized;
}
/**
 * PHASE 1.1: ENHANCED Detect if GraphQL operation is a mutation
 * Mutations require CSRF protection, queries do not (read-only)
 *
 * This function now properly detects ALL valid GraphQL mutation syntaxes:
 * - Named mutations: mutation CreateUser { ... }
 * - Anonymous mutations: mutation { ... }
 * - Mixed operations: mutation M1 { ... } query Q1 { ... }
 * - Aliases and fragments
 */
function isGraphQLMutation(query) {
    if (!query || typeof query !== 'string') {
        return false;
    }
    // Normalize query string: remove comments, strings, and extra whitespace
    let normalized = query
        .replace(/#[^\n]*(\n|$)/g, ' ') // Remove line comments
        .replace(/"""[\s\S]*?"""/g, ' ') // Remove block strings
        .replace(/"(?:[^"\\]|\\.)*"/g, ' ') // Remove regular strings  
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    // Check for explicit mutation operation type
    // GraphQL spec: Operations can be query, mutation, or subscription
    // Default is query if no operation type specified
    // Pattern 1: Explicit mutation keyword (most reliable)
    if (/^mutation(\s+\w+)?(\s*\([^)]*\))?\s*{/i.test(normalized)) {
        return true;
    }
    // Pattern 2: Multiple operations with at least one mutation
    // Example: mutation M1 { ... } query Q1 { ... }
    const operationRegex = /(query|mutation|subscription)\s+(\w+)?/gi;
    const operations = normalized.match(operationRegex) || [];
    if (operations.some(op => /^mutation/i.test(op))) {
        return true;
    }
    // Pattern 3: Shorthand syntax (no operation type)
    // In GraphQL, if no operation type is specified, it's treated as a query
    // So we return false for shorthand syntax (default = query = read-only)
    // This is SAFER: we only require CSRF for explicit mutations
    if (/^{/.test(normalized)) {
        return false; // Shorthand = query (no CSRF needed)
    }
    // Pattern 4: Detect mutation by operation name patterns (heuristic fallback)
    // Common mutation naming: create*, update*, delete*, add*, remove*, set*
    // This is a fallback for malformed/non-standard queries
    const commonMutationPrefixes = /\b(create|update|delete|remove|add|set|insert|upsert|modify|change)\w*\s*[\({]/i;
    if (commonMutationPrefixes.test(normalized) && !(/^query/i.test(normalized))) {
        return true; // Likely a mutation based on operation naming
    }
    return false; // Default to query (no CSRF required)
}
/**
 * PHASE 1.1: Enhanced GraphQL-specific CSRF Protection
 * Only enforces CSRF for GraphQL mutations (state-changing operations)
 * GraphQL queries (read-only) do not require CSRF tokens
 */
export function graphqlCsrfProtection(req, res, next) {
    // Only apply to GraphQL endpoints when GraphQL is enabled
    if (process.env.ENABLE_GRAPHQL !== 'true' || !req.path.includes('/graphql')) {
        return next();
    }
    // Only check mutations (state-changing operations)
    if (req.body && req.body.query && isGraphQLMutation(req.body.query)) {
        const csrfTokenHeader = req.get('X-CSRF-Token') || req.get('X-XSRF-Token');
        const sessionId = req.sessionId;
        if (!csrfTokenHeader) {
            return res.status(403).json({
                error: 'CSRF validation failed',
                code: 'CSRF_TOKEN_MISSING',
                message: 'CSRF token required for GraphQL mutations. Get token from /api/csrf-token endpoint.'
            });
        }
        // For authenticated requests, use cryptographically bound tokens
        if (sessionId && process.env.SESSION_SECRET) {
            const isValid = verifyBoundCsrfToken(csrfTokenHeader, sessionId, process.env.SESSION_SECRET);
            if (!isValid) {
                return res.status(403).json({
                    error: 'CSRF validation failed',
                    code: 'CSRF_TOKEN_INVALID',
                    message: 'Invalid or expired CSRF token for GraphQL mutation'
                });
            }
        }
        else {
            // Fallback to double-submit cookie pattern
            const csrfTokenCookie = req.cookies?.['XSRF-TOKEN'];
            if (!csrfTokenCookie || !verifyCsrfToken(csrfTokenHeader, csrfTokenCookie)) {
                return res.status(403).json({
                    error: 'CSRF validation failed',
                    code: 'CSRF_TOKEN_MISMATCH',
                    message: 'CSRF token mismatch for GraphQL mutation'
                });
            }
        }
    }
    next();
}
/**
 * Enhanced CSRF Protection with Cryptographic Binding
 *
 * Uses HMAC-bound tokens instead of simple double-submit cookies
 * This prevents token theft/reuse across different sessions
 */
export function csrfProtection(req, res, next) {
    // CRITICAL: Exempt GET requests from CSRF validation (GET should be idempotent and safe)
    if (req.method === 'GET') {
        return next();
    }
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        // Skip CSRF for initial auth (login/register need to establish session first), 
        // CSRF token endpoint (bootstrap), and webhooks (they use signature verification)
        const authExemptions = ['/api/auth/login', '/api/auth/register', '/api/csrf-token'];
        if (authExemptions.includes(req.path) || req.path.startsWith('/api/webhooks/')) {
            return next();
        }
        const csrfTokenHeader = req.get('X-CSRF-Token') || req.get('X-XSRF-Token');
        const sessionId = req.sessionId;
        // CRITICAL FIX #3: Always enforce CSRF token presence (no dev bypass)
        // Development bypass was a security vulnerability that could hide bugs
        if (!csrfTokenHeader) {
            return res.status(403).json({
                error: 'CSRF validation failed',
                code: 'CSRF_TOKEN_MISSING',
                message: 'CSRF token required for state-changing operations. Get token from /api/csrf-token endpoint.'
            });
        }
        // For authenticated requests, use cryptographically bound tokens
        if (sessionId && process.env.SESSION_SECRET) {
            const isValid = verifyBoundCsrfToken(csrfTokenHeader, sessionId, process.env.SESSION_SECRET);
            if (!isValid) {
                return res.status(403).json({
                    error: 'CSRF validation failed',
                    code: 'CSRF_TOKEN_INVALID',
                    message: 'Invalid or expired CSRF token'
                });
            }
        }
        else {
            // Fallback to double-submit cookie pattern for unauthenticated requests
            const csrfTokenCookie = req.cookies?.['XSRF-TOKEN'];
            // SECURITY FIX: Require CSRF cookie to be present for unauthenticated requests
            if (!csrfTokenCookie) {
                return res.status(403).json({
                    error: 'CSRF validation failed',
                    code: 'CSRF_COOKIE_MISSING',
                    message: 'CSRF cookie required for unauthenticated requests. Visit /api/csrf-token first.'
                });
            }
            // Verify cookie matches header (double-submit pattern)
            if (!verifyCsrfToken(csrfTokenHeader, csrfTokenCookie)) {
                return res.status(403).json({
                    error: 'CSRF validation failed',
                    code: 'CSRF_TOKEN_MISMATCH',
                    message: 'CSRF token mismatch'
                });
            }
        }
        // Additional origin validation for defense in depth
        const origin = req.get('origin') || req.get('referer');
        const host = req.get('host');
        if (origin && host) {
            try {
                const originUrl = new URL(origin);
                const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
                const isAllowedOrigin = allowedOrigins.includes(originUrl.origin) ||
                    (process.env.NODE_ENV === 'development' && (originUrl.hostname === 'localhost' || originUrl.hostname === host));
                if (!isAllowedOrigin && originUrl.host !== host) {
                    return res.status(403).json({
                        error: 'CSRF validation failed',
                        code: 'CSRF_ORIGIN_INVALID',
                        message: 'Request origin not allowed'
                    });
                }
            }
            catch (error) {
                return res.status(403).json({
                    error: 'CSRF validation failed',
                    code: 'CSRF_ORIGIN_FORMAT',
                    message: 'Invalid origin format'
                });
            }
        }
    }
    next();
}
/**
 * Set CSRF token for authenticated users (bound to session)
 * For unauthenticated users, sets a simple token cookie
 */
export function setCsrfTokenCookie(req, res, next) {
    const sessionId = req.sessionId;
    // CRITICAL FIX: Replit runs frontend in iframe, requiring sameSite='none' with secure=true
    // Replit domains are HTTPS, so we can use secure=true in development
    const isReplit = !!process.env.REPLIT_DOMAINS;
    const useSecure = process.env.NODE_ENV === 'production' || isReplit;
    const sameSitePolicy = isReplit ? 'none' : 'lax'; // 'none' for iframe, 'lax' otherwise
    // For authenticated users, generate a session-bound token
    if (sessionId && process.env.SESSION_SECRET) {
        const boundToken = generateBoundCsrfToken(sessionId, process.env.SESSION_SECRET);
        // Set token in response header for client to use
        res.setHeader('X-CSRF-Token', boundToken);
        // Use __Host- prefix only in production with secure=true (spec requirement)
        const cookieName = process.env.NODE_ENV === 'production' && !isReplit ? '__Host-CSRF-TOKEN' : 'CSRF-TOKEN';
        // CRITICAL FIX: Add Partitioned attribute for CHIPS (Cookies Having Independent Partitioned State)
        // Required for SameSite=None cookies in iframes to work in modern browsers
        const cookieOptions = {
            httpOnly: false, // MUST be false so client can validate token exists
            secure: useSecure,
            sameSite: sameSitePolicy,
            path: '/',
            maxAge: 4 * 60 * 60 * 1000 // 4 hours (shorter than session)
        };
        if (isReplit && sameSitePolicy === 'none') {
            cookieOptions.partitioned = true; // Enable CHIPS for iframe contexts
        }
        res.cookie(cookieName, boundToken, cookieOptions);
    }
    else {
        // Fallback for unauthenticated users - simple double-submit cookie
        const token = generateCsrfToken();
        const cookieOptions = {
            httpOnly: false, // Must be accessible to JavaScript for double-submit pattern
            secure: useSecure,
            sameSite: sameSitePolicy,
            path: '/',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        };
        if (isReplit && sameSitePolicy === 'none') {
            cookieOptions.partitioned = true; // Enable CHIPS for iframe contexts
        }
        res.cookie('XSRF-TOKEN', token, cookieOptions);
        res.setHeader('X-CSRF-Token', token);
    }
    next();
}
export const emailValidator = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address')
];
export const passwordValidator = [
    body('password')
        .isLength({ min: 12 })
        .withMessage('Password must be at least 12 characters long')
        .matches(/[a-z]/)
        .withMessage('Password must contain a lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('Password must contain an uppercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain a number')
        .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
        .withMessage('Password must contain at least one special character')
];
export function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}
export function fileUploadValidator(allowedTypes, maxSize = 10 * 1024 * 1024) {
    return (req, res, next) => {
        if (!req.body.file) {
            return next();
        }
        const file = req.body.file;
        if (file.size > maxSize) {
            return res.status(400).json({ message: `File size must be less than ${maxSize / (1024 * 1024)}MB` });
        }
        const fileType = file.mimeType || file.type;
        if (!allowedTypes.some(type => fileType.startsWith(type))) {
            return res.status(400).json({ message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` });
        }
        next();
    };
}
