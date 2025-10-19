import { randomUUID } from 'crypto';
import { db } from '../db';
import { emailVerificationTokens, users } from '@shared/schema';
import { eq, and, lt } from 'drizzle-orm';
import { sendEmailVerificationEmail } from './email';
import { logger } from '../logger';
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
export async function createEmailVerificationToken(userId, email, ipAddress, userAgent) {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY);
    await db.insert(emailVerificationTokens).values({
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
    });
    await sendEmailVerificationEmail(email, token);
    logger.info('Email verification token created', { userId, email: email.substring(0, 3) + '***' });
    return token;
}
export async function verifyEmailToken(token, ipAddress, userAgent) {
    try {
        const [tokenRecord] = await db
            .select()
            .from(emailVerificationTokens)
            .where(eq(emailVerificationTokens.token, token))
            .limit(1);
        if (!tokenRecord) {
            return { success: false, error: 'Invalid or expired verification token' };
        }
        if (tokenRecord.used) {
            return { success: false, error: 'This verification token has already been used' };
        }
        if (new Date() > tokenRecord.expiresAt) {
            return { success: false, error: 'This verification token has expired' };
        }
        await db
            .update(emailVerificationTokens)
            .set({
            used: true,
            usedAt: new Date(),
            ipAddress: ipAddress || tokenRecord.ipAddress,
            userAgent: userAgent || tokenRecord.userAgent,
        })
            .where(eq(emailVerificationTokens.id, tokenRecord.id));
        await db
            .update(users)
            .set({ isEmailVerified: true })
            .where(eq(users.id, tokenRecord.userId));
        logger.info('Email verified successfully', { userId: tokenRecord.userId });
        return { success: true, userId: tokenRecord.userId };
    }
    catch (error) {
        logger.error('Email verification failed', error instanceof Error ? error : undefined, { errorMessage: error?.message || String(error) });
        return { success: false, error: 'Failed to verify email' };
    }
}
export async function resendVerificationEmail(userId, email, ipAddress, userAgent) {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) {
            return { success: false, error: 'User not found' };
        }
        if (user.isEmailVerified) {
            return { success: false, error: 'Email is already verified' };
        }
        await db
            .delete(emailVerificationTokens)
            .where(and(eq(emailVerificationTokens.userId, userId), eq(emailVerificationTokens.used, false)));
        await createEmailVerificationToken(userId, email, ipAddress, userAgent);
        return { success: true };
    }
    catch (error) {
        logger.error('Failed to resend verification email', error instanceof Error ? error : undefined, {
            userId,
            errorMessage: error?.message || String(error)
        });
        return { success: false, error: 'Failed to resend verification email' };
    }
}
export async function cleanupExpiredTokens() {
    try {
        const result = await db
            .delete(emailVerificationTokens)
            .where(lt(emailVerificationTokens.expiresAt, new Date()));
        logger.info('Cleaned up expired email verification tokens');
        return result.rowCount || 0;
    }
    catch (error) {
        logger.error('Failed to cleanup expired tokens', error instanceof Error ? error : undefined, { errorMessage: error?.message || String(error) });
        return 0;
    }
}
