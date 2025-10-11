import { Router } from 'express';
import { db } from '../db';
import { users, orders, products, subscriptions, auditLogs, analytics, webhookRetries } from '../../shared/schema';
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';
import { authenticateToken } from '../auth';
import { adminRoleUpdateRateLimiter, adminUserManagementRateLimiter } from '../middleware/rate-limit-enhanced';
import { invalidateAllUserSessions, logSecurityEvent } from '../utils/session-security';
import { AuditLogger, AuditAction } from '../utils/audit-logger';
import { storage } from '../storage';
// CRIT-005 FIX: Import CSRF protection for webhook retry endpoint
import { csrfProtection } from '../middleware/security';
export const adminRouter = Router();
// Admin middleware - require admin role
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
// Dashboard overview
adminRouter.get('/dashboard/overview', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [totalUsers, totalOrders, totalRevenue, activeSubscriptions] = await Promise.all([
            db.select({ count: sql `count(*)` }).from(users),
            db.select({ count: sql `count(*)` }).from(orders),
            db.select({ total: sql `sum(total)` }).from(orders).where(eq(orders.paymentStatus, 'paid')),
            db.select({ count: sql `count(*)` }).from(subscriptions).where(eq(subscriptions.status, 'active'))
        ]);
        res.json({
            users: totalUsers[0].count,
            orders: totalOrders[0].count,
            revenue: totalRevenue[0].total || 0,
            subscriptions: activeSubscriptions[0].count
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});
// User management
adminRouter.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const userList = await db
            .select({
            id: users.id,
            username: users.username,
            email: users.email,
            role: users.role,
            subscriptionTier: users.subscriptionTier,
            createdAt: users.createdAt
        })
            .from(users)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(users.createdAt));
        const [{ count }] = await db.select({ count: sql `count(*)` }).from(users);
        res.json({
            users: userList,
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// Update user role - PHASE 1 CRITICAL SECURITY: Added rate limiting & session regeneration
adminRouter.patch('/users/:id/role', authenticateToken, adminRoleUpdateRateLimiter, requireAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        const targetUserId = req.params.id;
        if (!['user', 'admin', 'moderator'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        // Get target user to check current role
        const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId));
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        const oldRole = targetUser.role;
        // Update role
        await db.update(users).set({ role }).where(eq(users.id, targetUserId));
        // SECURITY FIX: Invalidate all user sessions on privilege change to prevent session fixation
        // This forces the user to re-login with their new privileges
        await invalidateAllUserSessions(targetUserId, `Role changed from ${oldRole} to ${role} by admin ${req.user.id}`);
        // Log security event for audit trail
        await logSecurityEvent(req.sessionId || 'unknown', req.user.id, 'privilege_change', {
            targetUserId,
            oldRole,
            newRole: role,
            adminId: req.user.id,
            adminUsername: req.user.username
        });
        // Audit log the action
        await AuditLogger.log({
            userId: req.user.id,
            action: AuditAction.PERMISSION_CHANGE,
            resource: 'users',
            resourceId: targetUserId,
            details: {
                oldRole,
                newRole: role,
                targetUserId
            },
            success: true
        });
        res.json({
            success: true,
            message: 'Role updated successfully. User must re-login with new privileges.'
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update user role' });
    }
});
// Analytics
adminRouter.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        const analyticsData = await db
            .select({
            date: sql `DATE(${analytics.createdAt})`,
            eventType: analytics.eventType,
            count: sql `count(*)`,
            totalValue: sql `sum(${analytics.value})`
        })
            .from(analytics)
            .where(and(gte(analytics.createdAt, startDate), lte(analytics.createdAt, endDate)))
            .groupBy(sql `DATE(${analytics.createdAt})`, analytics.eventType)
            .orderBy(sql `DATE(${analytics.createdAt})`);
        res.json({ analytics: analyticsData });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});
// Audit logs
adminRouter.get('/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const offset = (page - 1) * limit;
        const logs = await db
            .select()
            .from(auditLogs)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(auditLogs.createdAt));
        res.json({ logs });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});
// System health
adminRouter.get('/system/health', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const dbHealth = await db.execute(sql `SELECT 1`);
        const memUsage = process.memoryUsage();
        res.json({
            status: 'healthy',
            database: 'connected',
            memory: {
                used: Math.round(memUsage.heapUsed / 1024 / 1024),
                total: Math.round(memUsage.heapTotal / 1024 / 1024)
            },
            uptime: process.uptime()
        });
    }
    catch (error) {
        res.status(500).json({ error: 'System health check failed' });
    }
});
// Get user details - PHASE 1 CRITICAL SECURITY: Added rate limiting
adminRouter.get('/users/:id', authenticateToken, adminUserManagementRateLimiter, requireAdmin, async (req, res) => {
    try {
        const [user] = await db
            .select({
            id: users.id,
            username: users.username,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role,
            subscriptionTier: users.subscriptionTier,
            isEmailVerified: users.isEmailVerified,
            twoFactorEnabled: users.twoFactorEnabled,
            stripeCustomerId: users.stripeCustomerId,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
        })
            .from(users)
            .where(eq(users.id, req.params.id))
            .limit(1);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});
// Update user details - PHASE 1 CRITICAL SECURITY: Added rate limiting
adminRouter.patch('/users/:id', authenticateToken, adminUserManagementRateLimiter, requireAdmin, async (req, res) => {
    try {
        const { username, email, firstName, lastName, subscriptionTier } = req.body;
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        if (username && username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }
        if (subscriptionTier && !['free', 'basic', 'pro', 'enterprise'].includes(subscriptionTier)) {
            return res.status(400).json({ error: 'Invalid subscription tier' });
        }
        if (email) {
            const [existingUser] = await db.select().from(users).where(and(eq(users.email, email), sql `${users.id} != ${req.params.id}`)).limit(1);
            if (existingUser) {
                return res.status(400).json({ error: 'Email already in use by another user' });
            }
        }
        if (username) {
            const [existingUser] = await db.select().from(users).where(and(eq(users.username, username), sql `${users.id} != ${req.params.id}`)).limit(1);
            if (existingUser) {
                return res.status(400).json({ error: 'Username already in use by another user' });
            }
        }
        await db.update(users).set({
            ...(username && { username }),
            ...(email && { email }),
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(subscriptionTier && { subscriptionTier }),
            updatedAt: new Date()
        }).where(eq(users.id, req.params.id));
        res.json({ success: true, message: 'User updated successfully' });
    }
    catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Email or username already exists' });
        }
        res.status(500).json({ error: 'Failed to update user' });
    }
});
// Delete user (admin)
adminRouter.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own admin account' });
        }
        await db.delete(users).where(eq(users.id, req.params.id));
        res.json({ success: true, message: 'User deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
// Product management
adminRouter.get('/products', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const productList = await db
            .select()
            .from(products)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(products.createdAt));
        const [{ count }] = await db.select({ count: sql `count(*)` }).from(products);
        res.json({
            products: productList,
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
// Order management
adminRouter.get('/orders', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const conditions = status ? [eq(orders.status, status)] : [];
        const [orderList, countResult] = await Promise.all([
            db
                .select()
                .from(orders)
                .where(conditions.length > 0 ? and(...conditions) : undefined)
                .limit(limit)
                .offset(offset)
                .orderBy(desc(orders.createdAt)),
            db
                .select({ count: sql `count(*)` })
                .from(orders)
                .where(conditions.length > 0 ? and(...conditions) : undefined)
        ]);
        res.json({
            orders: orderList,
            pagination: {
                page,
                limit,
                total: countResult[0].count,
                pages: Math.ceil(countResult[0].count / limit)
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});
// System configuration (read-only for now)
adminRouter.get('/system/config', authenticateToken, requireAdmin, async (req, res) => {
    try {
        res.json({
            environment: process.env.NODE_ENV,
            features: {
                twoFactor: process.env.ENABLE_2FA === 'true',
                emailVerification: process.env.ENABLE_EMAIL_VERIFICATION !== 'false',
                socialLogin: process.env.ENABLE_SOCIAL_LOGIN === 'true',
                apiDocs: process.env.ENABLE_API_DOCS === 'true',
                gdpr: process.env.ENABLE_GDPR_FEATURES === 'true'
            },
            limits: {
                maxSessionsPerUser: parseInt(process.env.MAX_SESSIONS_PER_USER || '5'),
                maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
                sessionExpiryMs: parseInt(process.env.SESSION_EXPIRY_MS || '86400000')
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch system configuration' });
    }
});
// FIX #11: Webhook Management - Get failed webhooks
adminRouter.get('/webhooks/failed', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const failedWebhooks = await db
            .select()
            .from(webhookRetries)
            .where(eq(webhookRetries.status, 'failed'))
            .orderBy(desc(webhookRetries.updatedAt))
            .limit(limit)
            .offset(offset);
        const [{ count }] = await db
            .select({ count: sql `count(*)` })
            .from(webhookRetries)
            .where(eq(webhookRetries.status, 'failed'));
        res.json({
            webhooks: failedWebhooks,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch failed webhooks' });
    }
});
// FIX #11: Manual webhook retry
// CRIT-005 FIX: Add CSRF protection to webhook retry endpoint
adminRouter.post('/webhooks/:webhookId/retry', authenticateToken, requireAdmin, csrfProtection, async (req, res) => {
    try {
        const { webhookId } = req.params;
        await storage.updateWebhookRetry(webhookId, {
            status: 'pending',
            attempt: 1,
            nextRetryAt: new Date(),
            lastError: undefined
        });
        AuditLogger.log({
            userId: req.user?.id || '',
            action: AuditAction.ADMIN_ACCESS,
            resource: 'webhook_retry',
            resourceId: webhookId,
            details: { webhookId, action: 'manual_retry' },
            success: true
        });
        res.json({
            message: 'Webhook scheduled for retry',
            webhookId,
            nextRetryAt: new Date()
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retry webhook' });
    }
});
// FIX #11: Get webhook statistics
adminRouter.get('/webhooks/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [{ totalRetries }, { pendingRetries }, { failedRetries }] = await Promise.all([
            db.select({ totalRetries: sql `count(*)` }).from(webhookRetries).then((r) => r[0]),
            db.select({ pendingRetries: sql `count(*)` }).from(webhookRetries).where(eq(webhookRetries.status, 'pending')).then((r) => r[0]),
            db.select({ failedRetries: sql `count(*)` }).from(webhookRetries).where(eq(webhookRetries.status, 'failed')).then((r) => r[0])
        ]);
        res.json({
            total: totalRetries || 0,
            pending: pendingRetries || 0,
            failed: failedRetries || 0
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch webhook stats' });
    }
});
