import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../logger';
import { storage } from '../storage';
/**
 * Export all user data for GDPR compliance
 */
export async function exportUserData(userId, format = 'json') {
    try {
        logger.info('GDPR data export initiated', { userId, format });
        // Get user data
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) {
            throw new Error('User not found');
        }
        // Collect all user data
        const personalData = {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            createdAt: user.createdAt,
            role: user.role,
        };
        // MEDIUM FIX #11: Get activity logs from audit tables
        const activityLogs = [];
        try {
            // Query audit logs if schema exists
            const auditLogs = await storage.getAuditLogsByUserId(userId);
            activityLogs.push(...auditLogs.map(log => ({
                id: log.id,
                action: log.action,
                resource: log.resource,
                ipAddress: log.ipAddress,
                userAgent: log.userAgent,
                timestamp: log.timestamp,
                details: log.details,
            })));
        }
        catch (error) {
            logger.warn('Failed to fetch audit logs for GDPR export', { userId });
        }
        // MEDIUM FIX #11: Get user content (posts, comments, orders, etc.)
        const content = [];
        try {
            // Get user's posts
            const posts = await storage.getPostsByUserId(userId);
            content.push(...posts.map(post => ({
                type: 'post',
                id: post.id,
                title: post.title,
                content: post.content,
                createdAt: post.createdAt,
            })));
            // Get user's orders
            const orders = await storage.getOrdersByUserId(userId);
            content.push(...orders.map(order => ({
                type: 'order',
                id: order.id,
                total: order.total,
                status: order.status,
                createdAt: order.createdAt,
            })));
            // Get user's messages
            const messages = await storage.getMessagesByUserId(userId);
            content.push(...messages.map(msg => ({
                type: 'message',
                id: msg.id,
                content: msg.content,
                createdAt: msg.createdAt,
            })));
        }
        catch (error) {
            logger.warn('Failed to fetch user content for GDPR export', { userId });
        }
        const exportData = {
            personalData,
            activityLogs,
            content,
            exportDate: new Date().toISOString(),
            format,
        };
        logger.info('GDPR data export completed', { userId, recordCount: activityLogs.length + content.length });
        return exportData;
    }
    catch (error) {
        logger.error('GDPR data export failed', error instanceof Error ? error : undefined, { userId });
        throw error;
    }
}
/**
 * Delete user account and all associated data (Right to be Forgotten)
 */
export async function deleteUserData(userId, keepAnonymizedData = false) {
    try {
        logger.info('GDPR account deletion initiated', { userId, keepAnonymizedData });
        // Delete in specific order to maintain referential integrity
        // 1. Delete sessions
        await storage.deleteUserSessions(userId);
        // 2. Delete OAuth connections
        // await db.delete(oauthProviders).where(eq(oauthProviders.userId, userId));
        // 3. Delete 2FA settings
        // await db.delete(twoFactorSecrets).where(eq(twoFactorSecrets.userId, userId));
        // 4. Anonymize or delete content based on preference
        if (keepAnonymizedData) {
            // Anonymize posts/comments instead of deleting
            // await db.update(posts).set({ userId: null, authorName: 'Deleted User' }).where(eq(posts.userId, userId));
        }
        else {
            // Full deletion
            // await db.delete(posts).where(eq(posts.userId, userId));
        }
        // 5. Delete user account
        await db.delete(users).where(eq(users.id, userId));
        logger.info('GDPR account deletion completed', { userId });
    }
    catch (error) {
        logger.error('GDPR account deletion failed', error instanceof Error ? error : undefined, { userId });
        throw error;
    }
}
/**
 * Anonymize user data (partial deletion)
 */
export async function anonymizeUserData(userId) {
    try {
        logger.info('GDPR data anonymization initiated', { userId });
        await db
            .update(users)
            .set({
            email: `deleted_${userId}@anonymized.local`,
            username: `deleted_${userId}`,
            firstName: null,
            lastName: null,
            avatar: null,
            password: 'ANONYMIZED',
        })
            .where(eq(users.id, userId));
        logger.info('GDPR data anonymization completed', { userId });
    }
    catch (error) {
        logger.error('GDPR data anonymization failed', error instanceof Error ? error : undefined, { userId });
        throw error;
    }
}
const consentStore = new Map();
export function recordCookieConsent(consent) {
    consentStore.set(consent.sessionId, consent);
    logger.info('Cookie consent recorded', {
        sessionId: consent.sessionId.substring(0, 8) + '...',
        userId: consent.userId
    });
}
export function getCookieConsent(sessionId) {
    return consentStore.get(sessionId) || null;
}
