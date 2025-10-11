import { db } from '../db';
import { oauthProviders, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../logger';
export async function findOrCreateOAuthUser(profile) {
    try {
        const [existingProvider] = await db
            .select()
            .from(oauthProviders)
            .where(and(eq(oauthProviders.provider, profile.provider), eq(oauthProviders.providerId, profile.id)))
            .limit(1);
        if (existingProvider) {
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, existingProvider.userId))
                .limit(1);
            if (user) {
                logger.info('OAuth user logged in', { provider: profile.provider, userId: user.id });
                return { user, isNewUser: false };
            }
        }
        let user = null;
        if (profile.email) {
            [user] = await db
                .select()
                .from(users)
                .where(eq(users.email, profile.email))
                .limit(1);
        }
        if (!user) {
            const username = profile.email ? profile.email.split('@')[0] : `${profile.provider}_${profile.id}`;
            const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
            const { hashPassword } = await import('../auth');
            const hashedPassword = await hashPassword(randomPassword);
            [user] = await db
                .insert(users)
                .values({
                username: username,
                email: profile.email || `${profile.id}@${profile.provider}.oauth`,
                password: hashedPassword,
                firstName: profile.firstName || profile.name?.split(' ')[0],
                lastName: profile.lastName || profile.name?.split(' ').slice(1).join(' '),
                avatar: profile.avatar,
                isEmailVerified: !!profile.email,
                role: 'user',
            })
                .returning();
            logger.info('New OAuth user created', { provider: profile.provider, userId: user.id });
        }
        await db.insert(oauthProviders).values({
            userId: user.id,
            provider: profile.provider,
            providerId: profile.id,
            profile: profile,
        });
        return { user, isNewUser: true };
    }
    catch (error) {
        logger.error('OAuth user creation failed', error instanceof Error ? error : undefined, {
            provider: profile.provider,
            errorMessage: error?.message || String(error)
        });
        throw error;
    }
}
export async function updateOAuthTokens(userId, provider, accessToken, refreshToken) {
    try {
        const { encrypt } = await import('../utils/encryption');
        const { config } = await import('../config');
        if (!config.twoFactorEncryptionKey) {
            throw new Error('Encryption key not configured for OAuth tokens');
        }
        // Encrypt tokens before storing
        const encryptedAccessToken = encrypt(accessToken, config.twoFactorEncryptionKey);
        const encryptedRefreshToken = refreshToken
            ? encrypt(refreshToken, config.twoFactorEncryptionKey)
            : null;
        await db
            .update(oauthProviders)
            .set({
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            updatedAt: new Date(),
        })
            .where(and(eq(oauthProviders.userId, userId), eq(oauthProviders.provider, provider)));
        logger.info('OAuth tokens updated and encrypted', { userId, provider });
    }
    catch (error) {
        logger.error('Failed to update OAuth tokens', error instanceof Error ? error : undefined, {
            userId,
            provider,
            errorMessage: error?.message || String(error)
        });
        throw error;
    }
}
export async function unlinkOAuthProvider(userId, provider) {
    try {
        const result = await db
            .delete(oauthProviders)
            .where(and(eq(oauthProviders.userId, userId), eq(oauthProviders.provider, provider)));
        if (result.rowCount && result.rowCount > 0) {
            logger.info('OAuth provider unlinked', { userId, provider });
            return true;
        }
        return false;
    }
    catch (error) {
        logger.error('Failed to unlink OAuth provider', error instanceof Error ? error : undefined, {
            userId,
            provider,
            errorMessage: error?.message || String(error)
        });
        return false;
    }
}
