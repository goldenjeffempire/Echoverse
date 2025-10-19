/**
 * FIXED AUDIT #7: CSP Nonce Generation Middleware
 * Generates unique nonces for inline scripts to eliminate 'unsafe-inline'
 */
import crypto from 'crypto';
/**
 * Generate and attach CSP nonce to response locals
 * This nonce should be added to all inline <script> tags
 */
export function cspNonceMiddleware(req, res, next) {
    // Generate cryptographically secure random nonce
    const nonce = crypto.randomBytes(16).toString('base64');
    // Attach nonce to response locals for use in templates
    res.locals.cspNonce = nonce;
    // Set nonce in response header for CSP
    const existingCSP = res.getHeader('Content-Security-Policy');
    if (existingCSP) {
        // Add nonce to existing CSP
        const updatedCSP = existingCSP.replace(/script-src ([^;]+)/, `script-src $1 'nonce-${nonce}'`);
        res.setHeader('Content-Security-Policy', updatedCSP);
    }
    next();
}
/**
 * Get current nonce from response locals
 */
export function getNonce(res) {
    return res.locals.cspNonce || '';
}
