/**
 * Comprehensive Audit Logging System
 * Tracks all critical user actions for compliance and security
 */
import { db } from '../db';
import { auditLogs } from '../../shared/schema';
import { logger } from '../logger';
export var AuditAction;
(function (AuditAction) {
    AuditAction["USER_LOGIN"] = "USER_LOGIN";
    AuditAction["USER_LOGOUT"] = "USER_LOGOUT";
    AuditAction["USER_REGISTER"] = "USER_REGISTER";
    AuditAction["USER_UPDATE"] = "USER_UPDATE";
    AuditAction["USER_DELETE"] = "USER_DELETE";
    AuditAction["PASSWORD_CHANGE"] = "PASSWORD_CHANGE";
    AuditAction["PASSWORD_RESET"] = "PASSWORD_RESET";
    AuditAction["EMAIL_CHANGE"] = "EMAIL_CHANGE";
    AuditAction["TWO_FACTOR_ENABLE"] = "TWO_FACTOR_ENABLE";
    AuditAction["TWO_FACTOR_DISABLE"] = "TWO_FACTOR_DISABLE";
    AuditAction["PERMISSION_CHANGE"] = "PERMISSION_CHANGE";
    AuditAction["DATA_EXPORT"] = "DATA_EXPORT";
    AuditAction["DATA_DELETE"] = "DATA_DELETE";
    AuditAction["PAYMENT_MADE"] = "PAYMENT_MADE";
    AuditAction["SUBSCRIPTION_CHANGE"] = "SUBSCRIPTION_CHANGE";
    AuditAction["API_KEY_CREATE"] = "API_KEY_CREATE";
    AuditAction["API_KEY_DELETE"] = "API_KEY_DELETE";
    AuditAction["WEBHOOK_CREATE"] = "WEBHOOK_CREATE";
    AuditAction["WEBHOOK_DELETE"] = "WEBHOOK_DELETE";
    AuditAction["ADMIN_ACCESS"] = "ADMIN_ACCESS";
    AuditAction["SECURITY_VIOLATION"] = "SECURITY_VIOLATION";
})(AuditAction || (AuditAction = {}));
// CRIT-007 FIX: Mask PII data in audit logs for privacy compliance
function maskPII(data) {
    if (!data)
        return data;
    // Mask email addresses (show first 2 chars + @domain)
    const maskEmail = (email) => {
        if (!email || !email.includes('@'))
            return email;
        const [local, domain] = email.split('@');
        return `${local.substring(0, 2)}***@${domain}`;
    };
    // Mask IP addresses (show first 2 octets only)
    const maskIP = (ip) => {
        if (!ip)
            return ip;
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
        if (data.includes('@'))
            return maskEmail(data);
        return data;
    }
    if (typeof data === 'object') {
        const masked = Array.isArray(data) ? [] : {};
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
    static async log(entry) {
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
        }
        catch (err) {
            logger.error('Failed to record audit log', err instanceof Error ? err : undefined, {
                errorMessage: err instanceof Error ? err.message : String(err)
                // CRIT-007 FIX: Don't log the full entry which may contain PII
            });
        }
    }
    static async logSuccess(action, userId, details) {
        await this.log({
            userId,
            action,
            details,
            success: true
        });
    }
    static async logFailure(action, error, userId, details) {
        await this.log({
            userId,
            action,
            details,
            success: false,
            errorMessage: error
        });
    }
    static async getAuditTrail(userId, limit = 100) {
        const logs = await db.query.auditLogs.findMany({
            where: (auditLogs, { eq }) => eq(auditLogs.userId, userId),
            orderBy: (auditLogs, { desc }) => [desc(auditLogs.timestamp)],
            limit
        });
        return logs;
    }
    static async getSecurityEvents(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        const logs = await db.query.auditLogs.findMany({
            where: (auditLogs, { and, eq, gte }) => and(eq(auditLogs.action, AuditAction.SECURITY_VIOLATION), gte(auditLogs.timestamp, cutoff)),
            orderBy: (auditLogs, { desc }) => [desc(auditLogs.timestamp)]
        });
        return logs;
    }
}
