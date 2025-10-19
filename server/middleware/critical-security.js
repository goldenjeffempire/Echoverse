import crypto from 'crypto';
// CRITICAL-001: FILE_ENCRYPTION_KEY Validation
export function validateCriticalEnvVars() {
    const requiredSecrets = [
        'SESSION_SECRET',
        'DATABASE_URL',
    ];
    const missing = requiredSecrets.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing critical environment variables: ${missing.join(', ')}`);
    }
    // Validate minimum entropy
    const sessionSecret = process.env.SESSION_SECRET || '';
    if (sessionSecret.length < 32) {
        throw new Error('SESSION_SECRET must be at least 32 characters');
    }
    // FILE_ENCRYPTION_KEY is required in production
    if (process.env.NODE_ENV === 'production') {
        if (!process.env.FILE_ENCRYPTION_KEY) {
            throw new Error('FILE_ENCRYPTION_KEY is required in production');
        }
        const fileKey = process.env.FILE_ENCRYPTION_KEY || '';
        if (fileKey.length < 32) {
            throw new Error('FILE_ENCRYPTION_KEY must be at least 32 characters');
        }
    }
    else if (!process.env.FILE_ENCRYPTION_KEY) {
        console.warn('⚠️  FILE_ENCRYPTION_KEY not set - using development default (not secure for production)');
        process.env.FILE_ENCRYPTION_KEY = 'dev-encryption-key-not-for-production-use-only-32chars-minimum';
    }
}
// CRITICAL-003: CSRF Validation on DELETE Operations
export function csrfProtection() {
    return (req, res, next) => {
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            const token = req.headers['x-csrf-token'] || req.body._csrf;
            const sessionToken = req.session?.csrfToken;
            if (!token || !sessionToken || token !== sessionToken) {
                return res.status(403).json({ error: 'Invalid CSRF token' });
            }
        }
        next();
    };
}
// CRITICAL-004: WebSocket Null Origin Protection
export function websocketOriginValidation(origin) {
    if (!origin) {
        console.warn('WebSocket connection attempted with null origin');
        return false;
    }
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment && origin.includes('localhost')) {
        return true;
    }
    return allowedOrigins.includes(origin);
}
// CRITICAL-008: Request Body Size Limits
export function strictBodySizeLimits() {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        const maxSize = req.path.includes('/upload') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (contentLength > maxSize) {
            return res.status(413).json({
                error: 'Request body too large',
                maxSize: maxSize / 1024 / 1024 + 'MB'
            });
        }
        next();
    };
}
// CRITICAL-011: File Upload Rate Limiting
const uploadRateLimits = new Map();
export function fileUploadRateLimit() {
    return (req, res, next) => {
        if (!req.path.includes('/upload')) {
            return next();
        }
        const userId = req.user?.id || req.ip;
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minute
        const maxUploads = 10;
        const userLimit = uploadRateLimits.get(userId);
        if (!userLimit || now > userLimit.resetTime) {
            uploadRateLimits.set(userId, {
                count: 1,
                resetTime: now + windowMs,
            });
            return next();
        }
        if (userLimit.count >= maxUploads) {
            return res.status(429).json({
                error: 'Too many upload requests',
                retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
            });
        }
        userLimit.count++;
        next();
    };
}
// CRITICAL-013: Password Reset Token Entropy
export function generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}
export function generatePasswordResetToken() {
    const token = generateSecureToken(32); // 256 bits of entropy
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour
    return { token, hash, expiresAt };
}
// CRITICAL-017: Content-Type Validation
export function contentTypeValidation() {
    return (req, res, next) => {
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            const contentType = req.headers['content-type'];
            if (!contentType) {
                return res.status(400).json({ error: 'Content-Type header required' });
            }
            const allowedTypes = [
                'application/json',
                'multipart/form-data',
                'application/x-www-form-urlencoded',
            ];
            const isAllowed = allowedTypes.some(type => contentType.includes(type));
            if (!isAllowed) {
                return res.status(415).json({
                    error: 'Unsupported Media Type',
                    allowedTypes
                });
            }
        }
        next();
    };
}
// CRIT-005 FIX: Nonce tracking to prevent replay attacks within time window
const webhookNonceCache = new Map();
const NONCE_CLEANUP_INTERVAL = 600000; // 10 minutes
// Cleanup old nonces periodically
setInterval(() => {
    const now = Date.now() / 1000;
    const tolerance = 300; // 5 minutes
    for (const [nonce, timestamp] of webhookNonceCache.entries()) {
        if (now - timestamp > tolerance * 2) { // Keep for 2x tolerance to be safe
            webhookNonceCache.delete(nonce);
        }
    }
}, NONCE_CLEANUP_INTERVAL);
// CRITICAL-006: Stripe Webhook Timestamp Validation with CRIT-005 nonce tracking
export function validateStripeWebhook(req) {
    const signature = req.headers['stripe-signature'];
    const timestamp = signature?.split(',').find(s => s.startsWith('t='))?.split('=')[1];
    if (!timestamp) {
        return false;
    }
    const requestTime = parseInt(timestamp);
    const now = Math.floor(Date.now() / 1000);
    const tolerance = 300; // 5 minutes
    if (Math.abs(now - requestTime) > tolerance) {
        console.warn('Stripe webhook timestamp outside tolerance window');
        return false;
    }
    // CRIT-005 FIX: Check nonce to prevent replay attacks within time window
    // Extract signature components to create a unique nonce
    const signatureParts = signature.split(',');
    const v1Signature = signatureParts.find(s => s.startsWith('v1='))?.split('=')[1];
    if (!v1Signature) {
        return false;
    }
    // Create nonce from timestamp + signature
    const nonce = `${timestamp}:${v1Signature}`;
    // Check if we've seen this exact webhook before (replay attack detection)
    if (webhookNonceCache.has(nonce)) {
        console.warn('Stripe webhook replay attack detected - duplicate nonce', { nonce: nonce.substring(0, 20) + '...' });
        return false;
    }
    // Store nonce to prevent future replays
    webhookNonceCache.set(nonce, requestTime);
    return true;
}
// CRITICAL-020: API Response Pagination Enforcement
export function enforcePagination() {
    return (req, res, next) => {
        const isListEndpoint = req.method === 'GET' && (req.path.includes('/api/users') ||
            req.path.includes('/api/products') ||
            req.path.includes('/api/orders') ||
            req.path.includes('/api/posts'));
        if (isListEndpoint && req.path.split('/').pop()) {
            const limit = parseInt(req.query.limit) || 20;
            const maxLimit = 100;
            if (limit > maxLimit) {
                req.query.limit = maxLimit.toString();
            }
            if (!req.query.page && !req.query.cursor) {
                req.query.page = '1';
            }
        }
        next();
    };
}
// CRITICAL-009: API Key Encryption
export function encryptAPIKey(apiKey) {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.FILE_ENCRYPTION_KEY || '', 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
export function decryptAPIKey(encryptedKey) {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.FILE_ENCRYPTION_KEY || '', 'hex');
    const parts = encryptedKey.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
