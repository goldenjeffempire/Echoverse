/**
 * Request Signing for Critical Operations
 * PHASE A: Critical Security - Sign and verify critical requests
 */
import crypto from 'crypto';
const SIGNATURE_ALGORITHM = 'sha256';
const SIGNATURE_HEADER = 'X-Request-Signature';
const TIMESTAMP_HEADER = 'X-Request-Timestamp';
const MAX_TIMESTAMP_DIFF = 5 * 60 * 1000; // 5 minutes
export function signRequest(payload, secret) {
    const timestamp = Date.now();
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const message = `${timestamp}.${payloadString}`;
    const signature = crypto
        .createHmac(SIGNATURE_ALGORITHM, secret)
        .update(message)
        .digest('hex');
    return {
        signature,
        timestamp,
        payload: payloadString
    };
}
export function verifyRequestSignature(req, secret, payloadExtractor) {
    const signature = req.get(SIGNATURE_HEADER);
    const timestampHeader = req.get(TIMESTAMP_HEADER);
    if (!signature) {
        return { valid: false, error: 'Missing signature' };
    }
    if (!timestampHeader) {
        return { valid: false, error: 'Missing timestamp' };
    }
    const timestamp = parseInt(timestampHeader, 10);
    if (isNaN(timestamp)) {
        return { valid: false, error: 'Invalid timestamp' };
    }
    const now = Date.now();
    if (Math.abs(now - timestamp) > MAX_TIMESTAMP_DIFF) {
        return { valid: false, error: 'Request expired' };
    }
    const payload = payloadExtractor ? payloadExtractor(req) : req.body;
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const message = `${timestamp}.${payloadString}`;
    const expectedSignature = crypto
        .createHmac(SIGNATURE_ALGORITHM, secret)
        .update(message)
        .digest('hex');
    try {
        const signatureBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);
        if (signatureBuffer.length !== expectedBuffer.length) {
            return { valid: false, error: 'Invalid signature length' };
        }
        const validSignature = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
        if (!validSignature) {
            return { valid: false, error: 'Invalid signature' };
        }
        return { valid: true };
    }
    catch (error) {
        return { valid: false, error: 'Signature verification failed' };
    }
}
export function createSignedRequestMiddleware(secret, payloadExtractor) {
    return (req, res, next) => {
        const result = verifyRequestSignature(req, secret, payloadExtractor);
        if (!result.valid) {
            return res.status(401).json({
                error: 'Request signature verification failed',
                code: 'INVALID_SIGNATURE',
                details: result.error
            });
        }
        next();
    };
}
export function signWebhookPayload(payload, secret) {
    const signed = signRequest(payload, secret);
    return {
        payload: signed.payload,
        signature: signed.signature,
        timestamp: signed.timestamp
    };
}
export function verifyWebhookSignature(payload, signature, timestamp, secret) {
    const now = Date.now();
    if (Math.abs(now - timestamp) > MAX_TIMESTAMP_DIFF) {
        return false;
    }
    const message = `${timestamp}.${payload}`;
    const expectedSignature = crypto
        .createHmac(SIGNATURE_ALGORITHM, secret)
        .update(message)
        .digest('hex');
    try {
        const signatureBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);
        if (signatureBuffer.length !== expectedBuffer.length) {
            return false;
        }
        return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    }
    catch {
        return false;
    }
}
