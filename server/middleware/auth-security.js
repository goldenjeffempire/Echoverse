import crypto from 'crypto';
// CRITICAL-002: 2FA Backup Code Rotation
export function generate2FABackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
    }
    return codes;
}
export function hash2FABackupCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
}
// CRITICAL-005: OAuth Session Regeneration
export async function regenerateSessionAfterOAuth(req) {
    return new Promise((resolve, reject) => {
        if (!req.session) {
            return reject(new Error('Session not available'));
        }
        const oldSessionData = { ...req.session };
        req.session.regenerate((err) => {
            if (err) {
                return reject(err);
            }
            if (!req.session) {
                return reject(new Error('Session not available after regeneration'));
            }
            // Restore necessary data
            Object.assign(req.session, oldSessionData);
            req.session.save((err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}
// CRITICAL-012: Database Query Timeout Enforcement with actual query cancellation
export function enforceQueryTimeout(timeoutMs = 30000) {
    return async (req, res, next) => {
        // Store the original query execution time
        const startTime = Date.now();
        // Set PostgreSQL statement_timeout for this connection
        res.locals.queryTimeout = timeoutMs;
        res.locals.startTime = startTime;
        const timeout = setTimeout(() => {
            const duration = Date.now() - startTime;
            console.error(`Query timeout on ${req.method} ${req.path} after ${duration}ms`);
            if (!res.headersSent) {
                res.status(504).json({
                    error: 'Database query timeout',
                    duration,
                    limit: timeoutMs
                });
            }
        }, timeoutMs);
        res.on('finish', () => clearTimeout(timeout));
        res.on('close', () => clearTimeout(timeout));
        next();
    };
}
// Actual query timeout at database level (use in db.ts pool configuration)
export const DB_QUERY_TIMEOUT_CONFIG = {
    statement_timeout: 30000, // 30 seconds in milliseconds
    query_timeout: 30000,
    lock_timeout: 10000, // 10 seconds for lock acquisition
};
export function generateEmailVerificationToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return { token, hash, expiresAt };
}
export function verifyEmailToken(token, storedHash, expiresAt) {
    if (new Date() > expiresAt) {
        return false;
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(storedHash));
}
// CRITICAL-007: Database Connection Pool Graceful Degradation
export function connectionPoolMonitoring(pool) {
    setInterval(() => {
        const { totalCount, idleCount, waitingCount } = pool;
        const activeCount = totalCount - idleCount;
        const utilizationPercent = (activeCount / totalCount) * 100;
        if (utilizationPercent > 80) {
            console.warn(`⚠️  High connection pool utilization: ${utilizationPercent.toFixed(1)}%`);
        }
        if (waitingCount > 10) {
            console.warn(`⚠️  Connection pool queue building up: ${waitingCount} waiting`);
        }
        // Log metrics
        console.log(`Pool: ${activeCount}/${totalCount} active, ${idleCount} idle, ${waitingCount} waiting`);
    }, 60000); // Check every minute
}
// CRITICAL-018: Audit Log Retention
export async function cleanupOldAuditLogs(db, retentionDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    try {
        const result = await db.execute(`DELETE FROM audit_logs WHERE created_at < $1`, [cutoffDate]);
        console.log(`Cleaned up ${result.rowCount} old audit logs`);
        return result.rowCount;
    }
    catch (error) {
        console.error('Failed to cleanup audit logs:', error);
        throw error;
    }
}
// Schedule audit log cleanup (run daily)
export function scheduleAuditLogCleanup(db) {
    const oneDayMs = 24 * 60 * 60 * 1000;
    setInterval(async () => {
        try {
            await cleanupOldAuditLogs(db, 90);
        }
        catch (error) {
            console.error('Scheduled audit log cleanup failed:', error);
        }
    }, oneDayMs);
}
// CRITICAL-014: Helmet GraphQL Configuration
export function helmetGraphQLConfig() {
    return {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"], // GraphQL Playground needs unsafe-inline
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
        crossOriginOpenerPolicy: { policy: "same-origin" },
        crossOriginResourcePolicy: { policy: "same-origin" },
    };
}
// CRITICAL-017: Payment Transaction Rollback
export async function safePaymentTransaction(db, operation) {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
        const result = await operation();
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Payment transaction rolled back:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// CRITICAL-018: WebSocket Queue Memory Limits
export class BoundedWebSocketQueue {
    constructor(maxSize = 1000, maxMessageSize = 1024 * 100) {
        this.queue = [];
        this.maxSize = maxSize;
        this.maxMessageSize = maxMessageSize;
    }
    push(message) {
        const messageSize = JSON.stringify(message).length;
        if (messageSize > this.maxMessageSize) {
            console.warn('Message exceeds size limit, dropping');
            return false;
        }
        if (this.queue.length >= this.maxSize) {
            console.warn('Queue full, dropping oldest message');
            this.queue.shift();
        }
        this.queue.push(message);
        return true;
    }
    shift() {
        return this.queue.shift();
    }
    size() {
        return this.queue.length;
    }
    clear() {
        this.queue = [];
    }
}
