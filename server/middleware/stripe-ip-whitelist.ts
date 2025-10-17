import { Request, Response, NextFunction } from 'express';
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

interface IPRange {
  range: ipaddr.IPv4 | ipaddr.IPv6;
  prefix: number;
}

const parsedRanges: IPRange[] = STRIPE_WEBHOOK_IP_RANGES.map(cidr => {
  const [range, prefixStr] = cidr.split('/');
  const addr = ipaddr.process(range);
  return {
    range: addr,
    prefix: parseInt(prefixStr, 10)
  };
});

function isStripeIP(ip: string): boolean {
  try {
    const addr = ipaddr.process(ip);
    
    // Check if IP matches any of Stripe's ranges
    for (const { range, prefix } of parsedRanges) {
      if (addr.kind() === range.kind()) {
        if (addr.kind() === 'ipv4') {
          if ((addr as ipaddr.IPv4).match(range as ipaddr.IPv4, prefix)) {
            return true;
          }
        } else if (addr.kind() === 'ipv6') {
          if ((addr as ipaddr.IPv6).match(range as ipaddr.IPv6, prefix)) {
            return true;
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    logger.error('IP address parsing error', error as Error, { ip });
    return false;
  }
}

export function stripeIPWhitelistMiddleware(req: Request, res: Response, next: NextFunction): Response | void {
  // Skip IP validation in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Stripe IP whitelist skipped in development');
    return next();
  }

  // Get client IP (considering proxy headers)
  const clientIP = req.ip || 
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    '';

  if (!clientIP) {
    logger.error('Unable to determine client IP for Stripe webhook', new Error('Unable to determine client IP'));
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Unable to verify request origin'
    }) as any;
  }

  // Validate IP against Stripe's whitelist
  if (!isStripeIP(clientIP)) {
    logger.error('Stripe webhook from unauthorized IP', new Error('Unauthorized IP'));
    
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Request must originate from Stripe servers'
    }) as any;
  }

  logger.debug('Stripe IP whitelist validation passed', {
    clientIP,
    requestId: res.locals.requestId
  });

  next();
}
