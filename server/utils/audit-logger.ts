/**
 * Comprehensive Audit Logging System
 * Tracks all critical user actions for compliance and security
 */

import { db } from '../db';
import { auditLogs } from '../../shared/schema';
import { logger } from '../logger';

export enum AuditAction {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_CHANGE = 'EMAIL_CHANGE',
  TWO_FACTOR_ENABLE = 'TWO_FACTOR_ENABLE',
  TWO_FACTOR_DISABLE = 'TWO_FACTOR_DISABLE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_DELETE = 'DATA_DELETE',
  PAYMENT_MADE = 'PAYMENT_MADE',
  SUBSCRIPTION_CHANGE = 'SUBSCRIPTION_CHANGE',
  API_KEY_CREATE = 'API_KEY_CREATE',
  API_KEY_DELETE = 'API_KEY_DELETE',
  WEBHOOK_CREATE = 'WEBHOOK_CREATE',
  WEBHOOK_DELETE = 'WEBHOOK_DELETE',
  ADMIN_ACCESS = 'ADMIN_ACCESS',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION'
}

export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

// CRIT-007 FIX: Mask PII data in audit logs for privacy compliance
function maskPII(data: any): any {
  if (!data) return data;
  
  // Mask email addresses (show first 2 chars + @domain)
  const maskEmail = (email: string): string => {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  };
  
  // Mask IP addresses (show first 2 octets only)
  const maskIP = (ip: string): string => {
    if (!ip) return ip;
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
    // IPv6 - show first 2 segments
    const ipv6Parts = ip.split(':');
    if (ipv6Parts.length > 2) {
      return `${ipv6Parts[0]}:${ipv6Parts[1]}::***`;
    }
    return ip;
  };
  
  if (typeof data === 'string') {
    // Mask email patterns in strings
    if (data.includes('@')) return maskEmail(data);
    return data;
  }
  
  if (typeof data === 'object') {
    const masked: any = Array.isArray(data) ? [] : {};
    for (const key in data) {
      const lowerKey = key.toLowerCase();
      
      // Mask email fields
      if (lowerKey.includes('email') && typeof data[key] === 'string') {
        masked[key] = maskEmail(data[key]);
      }
      // Mask IP address fields
      else if ((lowerKey.includes('ip') || lowerKey.includes('address')) && typeof data[key] === 'string') {
        masked[key] = maskIP(data[key]);
      }
      // Mask sensitive fields
      else if (lowerKey.includes('password') || lowerKey.includes('secret') || lowerKey.includes('token')) {
        masked[key] = '***REDACTED***';
      }
      // Recursively mask nested objects
      else if (typeof data[key] === 'object' && data[key] !== null) {
        masked[key] = maskPII(data[key]);
      }
      else {
        masked[key] = data[key];
      }
    }
    return masked;
  }
  
  return data;
}

export class AuditLogger {
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      // CRIT-007 FIX: Mask PII before storing in database
      const maskedIP = entry.ipAddress ? entry.ipAddress.split('.').slice(0, 2).join('.') + '.***.***' : null;
      const maskedDetails = entry.details ? maskPII(entry.details) : {};
      
      await db.insert(auditLogs).values({
        userId: entry.userId || null,
        action: entry.action,
        resource: entry.resource || null,
        resourceId: entry.resourceId || null,
        ipAddress: maskedIP, // Store masked IP
        userAgent: entry.userAgent || null,
        details: maskedDetails, // Store masked details
        success: entry.success,
        errorMessage: entry.errorMessage || null,
        timestamp: new Date()
      });

      // CRIT-007 FIX: Mask PII in application logs too
      logger.info('Audit log recorded', {
        action: entry.action,
        userId: entry.userId?.substring(0, 8) + '***', // Mask user ID
        resource: entry.resource,
        success: entry.success
      });
    } catch (err) {
      logger.error('Failed to record audit log', err instanceof Error ? err : undefined, {
        errorMessage: err instanceof Error ? err.message : String(err)
        // CRIT-007 FIX: Don't log the full entry which may contain PII
      });
    }
  }

  static async logSuccess(
    action: AuditAction,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      details,
      success: true
    });
  }

  static async logFailure(
    action: AuditAction,
    error: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      details,
      success: false,
      errorMessage: error
    });
  }

  static async getAuditTrail(
    userId: string,
    limit: number = 100
  ): Promise<any[]> {
    const { eq, desc } = await import('drizzle-orm');
    const logs = await db.select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
    return logs;
  }

  static async getSecurityEvents(hours: number = 24): Promise<any[]> {
    const { and, eq, gte, desc } = await import('drizzle-orm');
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const logs = await db.select()
      .from(auditLogs)
      .where(and(
        eq(auditLogs.action, AuditAction.SECURITY_VIOLATION),
        gte(auditLogs.timestamp, cutoff)
      ))
      .orderBy(desc(auditLogs.timestamp));
    return logs;
  }
}
