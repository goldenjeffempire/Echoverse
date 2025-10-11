/**
 * PII Masking Utilities for Logging
 * PHASE A: Critical Security - Prevent sensitive data leakage in logs
 *
 * Masks:
 * - Email addresses
 * - Phone numbers
 * - SSN
 * - Credit card numbers
 * - API keys/tokens
 * - IP addresses (partial)
 */
const DEFAULT_MASK_OPTIONS = {
    maskEmail: true,
    maskPhone: true,
    maskSSN: true,
    maskCreditCard: true,
    maskToken: true,
    maskIP: true,
};
export function maskEmail(email) {
    if (!email || !email.includes('@'))
        return email;
    const [local, domain] = email.split('@');
    if (local.length <= 2)
        return `${local}@${domain}`;
    return `${local.slice(0, 2)}***@${domain}`;
}
export function maskPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10)
        return '***-***-****';
    const last4 = cleaned.slice(-4);
    return `***-***-${last4}`;
}
export function maskSSN(ssn) {
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length !== 9)
        return '***-**-****';
    const last4 = cleaned.slice(-4);
    return `***-**-${last4}`;
}
export function maskCreditCard(card) {
    const cleaned = card.replace(/\D/g, '');
    if (cleaned.length < 13)
        return '****-****-****-****';
    const last4 = cleaned.slice(-4);
    return `****-****-****-${last4}`;
}
export function maskToken(token) {
    if (!token || token.length < 8)
        return '***';
    return `${token.slice(0, 4)}...${token.slice(-4)}`;
}
export function maskIP(ip) {
    if (!ip)
        return '***';
    const parts = ip.split('.');
    if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.*.*`;
    }
    return ip.slice(0, 8) + '***';
}
export function maskPII(data, options = DEFAULT_MASK_OPTIONS) {
    if (data === null || data === undefined)
        return data;
    if (typeof data === 'string') {
        let masked = data;
        if (options.maskEmail) {
            masked = masked.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (match) => maskEmail(match));
        }
        if (options.maskPhone) {
            masked = masked.replace(/\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/g, (match) => maskPhone(match));
        }
        if (options.maskSSN) {
            masked = masked.replace(/\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, (match) => {
                const cleaned = match.replace(/\D/g, '');
                if (cleaned.length === 9)
                    return maskSSN(match);
                return match;
            });
        }
        if (options.maskCreditCard) {
            masked = masked.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, (match) => maskCreditCard(match));
        }
        if (options.maskToken) {
            if (masked.match(/^(Bearer |Token )?[A-Za-z0-9_-]{20,}$/)) {
                const token = masked.replace(/^(Bearer |Token )/, '');
                masked = masked.replace(token, maskToken(token));
            }
        }
        if (options.maskIP) {
            masked = masked.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, (match) => maskIP(match));
        }
        return masked;
    }
    if (Array.isArray(data)) {
        return data.map(item => maskPII(item, options));
    }
    if (typeof data === 'object') {
        const masked = {};
        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('password') ||
                lowerKey.includes('secret') ||
                lowerKey.includes('token') ||
                lowerKey.includes('key')) {
                masked[key] = '***REDACTED***';
            }
            else if (lowerKey.includes('email') && typeof value === 'string') {
                masked[key] = maskEmail(value);
            }
            else if ((lowerKey.includes('phone') || lowerKey.includes('tel')) && typeof value === 'string') {
                masked[key] = maskPhone(value);
            }
            else if (lowerKey.includes('ssn') && typeof value === 'string') {
                masked[key] = maskSSN(value);
            }
            else if ((lowerKey.includes('card') || lowerKey.includes('credit')) && typeof value === 'string') {
                masked[key] = maskCreditCard(value);
            }
            else if (lowerKey.includes('ip') && typeof value === 'string') {
                masked[key] = maskIP(value);
            }
            else {
                masked[key] = maskPII(value, options);
            }
        }
        return masked;
    }
    return data;
}
export function createMaskedLogger(logger) {
    return {
        info: (message, data) => {
            logger.info(message, data ? maskPII(data) : undefined);
        },
        warn: (message, data) => {
            logger.warn(message, data ? maskPII(data) : undefined);
        },
        error: (message, error) => {
            logger.error(message, error ? maskPII(error) : undefined);
        },
        debug: (message, data) => {
            logger.debug(message, data ? maskPII(data) : undefined);
        },
    };
}
