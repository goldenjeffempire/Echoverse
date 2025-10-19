import { db } from '../db';
import { paymentIntents } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../logger';
export async function idempotencyMiddleware(req, res, next) {
    try {
        const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
        if (!idempotencyKey) {
            res.status(400).json({
                error: 'Idempotency-Key header is required',
                code: 'IDEMPOTENCY_KEY_REQUIRED',
                message: 'Please provide an Idempotency-Key header with a unique value (UUID recommended)'
            });
            return;
        }
        if (idempotencyKey.length < 16 || idempotencyKey.length > 255) {
            res.status(400).json({
                error: 'Invalid idempotency key',
                code: 'INVALID_IDEMPOTENCY_KEY',
                message: 'Idempotency key must be between 16 and 255 characters'
            });
            return;
        }
        req.idempotencyKey = idempotencyKey;
        next();
    }
    catch (error) {
        logger.error('Idempotency middleware error', error instanceof Error ? error : undefined);
        next(error);
    }
}
export async function checkPaymentIdempotency(idempotencyKey, userId) {
    try {
        const existing = await db
            .select()
            .from(paymentIntents)
            .where(eq(paymentIntents.idempotencyKey, idempotencyKey))
            .limit(1);
        if (existing.length > 0) {
            logger.info('Duplicate payment intent detected via idempotency key', {
                idempotencyKey: idempotencyKey.substring(0, 8) + '...',
                paymentIntentId: existing[0].id
            });
            return { exists: true, paymentIntent: existing[0] };
        }
        return { exists: false };
    }
    catch (error) {
        logger.error('Payment idempotency check error', error instanceof Error ? error : undefined);
        return { exists: false };
    }
}
