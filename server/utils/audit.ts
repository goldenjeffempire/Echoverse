import { db } from '../db';
import { auditLogs } from '../../shared/schema';
import { logger } from '../logger';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
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
  } catch (error) {
    logger.error('Failed to create audit log', error instanceof Error ? error : undefined, entry);
  }
}

export async function auditUserAction(
  userId: string,
  action: 'login' | 'logout' | 'password_change' | 'email_change' | 'profile_update' | '2fa_enabled' | '2fa_disabled',
  metadata?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
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

export async function auditResourceChange(
  userId: string | undefined,
  action: 'create' | 'update' | 'delete',
  resource: string,
  resourceId: string,
  changes?: { before?: any; after?: any },
  metadata?: any
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    resource,
    resourceId,
    changes,
    metadata
  });
}

export async function auditPaymentAction(
  userId: string | undefined,
  action: 'payment_initiated' | 'payment_succeeded' | 'payment_failed' | 'refund_initiated' | 'refund_completed',
  resourceId: string,
  metadata?: any
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    resource: 'payments',
    resourceId,
    metadata
  });
}
