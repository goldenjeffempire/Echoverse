import { logger } from '../logger';
import ipaddr from 'ipaddr.js';
// Stripe webhook IP ranges (as of 2025)
// Source: https://stripe.com/docs/ips
const STRIPE_WEBHOOK_IP_RANGES = [
    '3.18.12.63/32',
    '3.130.192.231/32',
    '13.235.14.237/32',
    '13.235.122.149/32',
    '18.211.135.69/32',
    '35.154.171.200/32',
    '52.15.183.38/32',
    '54.187.174.169/32',
    '54.187.205.235/32',
    '54.187.216.72/32',
];
const parsedRanges = STRIPE_WEBHOOK_IP_RANGES.map(cidr => {
    const [range, prefixStr] = cidr.split('/');
    const addr = ipaddr.process(range);
    return {
        range: addr,
        prefix: parseInt(prefixStr, 10)
    };
});
function isStripeIP(ip) {
    try {
        const addr = ipaddr.process(ip);
        // Check if IP matches any of Stripe's ranges
        for (const { range, prefix } of parsedRanges) {
            if (addr.kind() === range.kind()) {
                if (addr.kind() === 'ipv4') {
                    if (addr.match(range, prefix)) {
                        return true;
                    }
                }
                else if (addr.kind() === 'ipv6') {
                    if (addr.match(range, prefix)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    catch (error) {
        logger.error('IP address parsing error', error, { ip });
        return false;
    }
}
export function stripeIPWhitelistMiddleware(req, res, next) {
    // Skip IP validation in development
    if (process.env.NODE_ENV === 'development') {
        logger.debug('Stripe IP whitelist skipped in development');
        return next();
    }
    // Get client IP (considering proxy headers)
    const clientIP = req.ip ||
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress ||
        '';
    if (!clientIP) {
        logger.error('Unable to determine client IP for Stripe webhook', undefined, {
            headers: req.headers,
            path: req.path
        });
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Unable to verify request origin'
        });
    }
    // Validate IP against Stripe's whitelist
    if (!isStripeIP(clientIP)) {
        logger.error('Stripe webhook from unauthorized IP', new Error('Unauthorized IP'), {
            clientIP,
            path: req.path,
            headers: req.headers,
            requestId: res.locals.requestId
        });
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Request must originate from Stripe servers'
        });
    }
    logger.debug('Stripe IP whitelist validation passed', {
        clientIP,
        requestId: res.locals.requestId
    });
    next();
}
