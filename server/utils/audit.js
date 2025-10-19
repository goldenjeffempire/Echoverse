import { db } from '../db';
import { auditLogs } from '../../shared/schema';
import { logger } from '../logger';
export async function createAuditLog(entry) {
    try {
        await db.insert(auditLogs).values({
            userId: entry.userId || null,
            action: entry.action,
            resource: entry.resource,
            resourceId: entry.resourceId || null,
            details: entry.changes || entry.metadata || null,
            ipAddress: entry.ipAddress || null,
            userAgent: entry.userAgent || null,
            createdAt: new Date()
        });
        logger.debug('Audit log created', {
            action: entry.action,
            resource: entry.resource,
            resourceId: entry.resourceId
        });
    }
    catch (error) {
        logger.error('Failed to create audit log', error instanceof Error ? error : undefined, entry);
    }
}
export async function auditUserAction(userId, action, metadata, ipAddress, userAgent) {
    await createAuditLog({
        userId,
        action,
        resource: 'users',
        resourceId: userId,
        metadata,
        ipAddress,
        userAgent
    });
}
export async function auditResourceChange(userId, action, resource, resourceId, changes, metadata) {
    await createAuditLog({
        userId,
        action,
        resource,
        resourceId,
        changes,
        metadata
    });
}
export async function auditPaymentAction(userId, action, resourceId, metadata) {
    await createAuditLog({
        userId,
        action,
        resource: 'payments',
        resourceId,
        metadata
    });
}
