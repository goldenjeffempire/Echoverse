import { createServer } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { register, login, logout, getCurrentUser, authenticateToken, optionalAuth, requireRole, refreshTokens, hashPassword, verifyPassword, invalidateAllUserSessions, generate2FASecret, verify2FAToken, generateQRCode, generate2FABackupCodes, hashBackupCodes, createSession, isPasswordReused, addPasswordToHistory, verifyToken } from "./auth";
import { generateWebsiteContent, generateBlogPost, generateMarketingContent, optimizeForSEO, generateChatbotResponse, analyzeContent, generateCompleteWebsite, generateWebComponent, generateWebsiteTemplate, enhanceWebsiteContent } from "./ai";
import { setupWebSocket } from "./websocket";
import { slugify } from "./utils/slugify";
import { AIServiceError } from "./utils/errors";
import { logger } from "./logger";
import multer from 'multer';
import express from 'express';
import { uploadSingle, uploadMultiple, uploadImage, UPLOAD_DIR } from "./middleware/upload";
import { sanitizeSearchInput } from "./utils/security";
import { postUploadSecurityValidation } from "./middleware/file-upload-security";
import { successResponse, paginatedResponse, errorResponse, notFoundResponse, validationErrorResponse, calculatePagination } from "./utils/apiResponse";
import { passwordResetRateLimiter, twoFactorVerifyRateLimiter, twoFactorSetupRateLimiter, loginRateLimiter, registrationRateLimiter, emailVerificationRateLimiter, accountDeletionRateLimiter, passwordChangeRateLimiter, fileUploadRateLimiter, tokenRefreshRateLimiter, webhookRateLimiter, staticAssetRateLimiter, productCreationRateLimiter, mediaUploadRateLimiter, csrfTokenRateLimiter, backupCodesRateLimiter, adminQueryOperationsRateLimiter } from "./middleware/rate-limit-enhanced";
import { idempotencyMiddleware } from "./middleware/idempotency";
import { cacheMiddleware } from "./middleware/cache";
import { stripeIPWhitelistMiddleware } from "./middleware/stripe-ip-whitelist";
import { validateRequest, registerSchema, loginSchema, requestPasswordResetSchema, resetPasswordSchema, changePasswordSchema, updateProfileSchema, createPaymentIntentSchema, createSubscriptionSchema, generateWebsiteSchema, generateBlogSchema, generateMarketingSchema, optimizeSEOSchema, chatbotSchema, analyzeContentSchema, generateCompleteWebsiteSchema, generateComponentSchema, generateTemplateSchema, enhanceContentSchema, advancedGenerationSchema, disable2FASchema, enable2FASchema, logoutAllSchema } from "./validation/route-schemas";
import { aiRateLimiter } from "./middleware/ai-rate-limiter";
import { emailVerificationRouter } from './routes/password-reset-validation';
import { requireEmailVerification } from './middleware/email-verification';
import { adminRouter } from './routes/admin';
import { register as metricsRegister } from './monitoring/metrics';
import { passwordResetLockoutMiddleware, validateRedirectUrlMiddleware, recordPasswordResetAttempt } from './middleware/password-reset-lockout';
import { captchaMiddleware } from './middleware/captcha';
import healthRouter from './routes/health-enhanced';
import { calculateTax, validateTaxInput } from './services/tax-calculator';
import { orderFulfillmentService } from './services/order-fulfillment.service';
import { generateReceipt } from './utils/receipt-generator';
// Environment variables are validated on startup in index.ts
// No need for duplicate checks here
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
});
export async function registerRoutes(app) {
    // API Versioning Middleware - Add version headers to all API responses
    app.use('/api', (req, res, next) => {
        res.setHeader('API-Version', 'v1');
        res.setHeader('X-API-Version', '1.0.0');
        res.setHeader('X-Powered-By', 'EchoVerse Platform');
        next();
    });
    // Root route handler - API status
    app.get("/api", (req, res) => {
        res.status(200).json({
            service: 'EchoVerse Platform API',
            version: '1.0.0',
            apiVersion: 'v1',
            status: 'operational',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            documentation: process.env.NODE_ENV === 'development' ? '/api-docs' : undefined,
            endpoints: {
                health: '/api/health',
                metrics: '/metrics',
                auth: '/api/auth',
                users: '/api/users',
                products: '/api/products',
                orders: '/api/orders',
                posts: '/api/posts',
                ai: '/api/ai'
            }
        });
    });
    // CSRF token bootstrap endpoint - ensures cookie is set before SPA makes state-changing requests
    // PHASE 1: Added rate limiting to prevent CSRF token endpoint abuse
    app.get("/api/csrf-token", csrfTokenRateLimiter, (req, res) => {
        // The setCsrfTokenCookie middleware has already set the token in response header and cookie
        // Read from response header first (most reliable), then fallback to cookies
        const csrfToken = res.getHeader('X-CSRF-Token') ||
            req.cookies?.['XSRF-TOKEN'] ||
            req.cookies?.['CSRF-TOKEN'] ||
            req.cookies?.['__Host-CSRF-TOKEN'];
        res.json({
            token: csrfToken,
            message: 'CSRF token set successfully'
        });
    });
    // Query monitoring endpoint (admin only) - CRIT-002 FIX: Added rate limiting
    app.get("/api/admin/query-metrics", authenticateToken, adminQueryOperationsRateLimiter, async (req, res) => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { queryMonitor } = await import("./middleware/query-monitor");
        const metrics = queryMonitor.getMetrics();
        const slowQueries = queryMonitor.getSlowQueries(20);
        const failedQueries = queryMonitor.getFailedQueries(20);
        res.json({
            metrics: {
                totalQueries: metrics.totalQueries,
                slowQueries: metrics.slowQueries,
                failedQueries: metrics.failedQueries,
                averageQueryTime: Math.round(metrics.averageQueryTime),
            },
            slowQueries,
            failedQueries,
            recentQueries: metrics.queries.slice(-50),
        });
    });
    // Database stats endpoint (admin only) - CRIT-002 FIX: Created with rate limiting
    app.get("/api/admin/db-stats", authenticateToken, adminQueryOperationsRateLimiter, async (req, res) => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        try {
            const stats = await db.execute(sql `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 20
      `);
            const connectionStats = await db.execute(sql `
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);
            res.json({
                tables: stats.rows,
                connections: connectionStats.rows[0],
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger.error('Failed to fetch database stats', error);
            res.status(500).json({ error: 'Failed to fetch database statistics' });
        }
    });
    // Authentication routes with rate limiting and validation
    app.post("/api/auth/register", registrationRateLimiter, captchaMiddleware, validateRequest(registerSchema), register);
    app.post("/api/auth/login", loginRateLimiter, captchaMiddleware, validateRequest(loginSchema), login);
    app.post("/api/auth/logout", authenticateToken, logout);
    app.post("/api/auth/refresh", tokenRefreshRateLimiter, refreshTokens); // CRITICAL: Rate limit token refresh
    app.get("/api/auth/me", authenticateToken, getCurrentUser);
    // Logout from all devices (invalidate all sessions except current) - PHASE 1: Added validation
    app.post("/api/auth/logout-all", authenticateToken, validateRequest(logoutAllSchema), async (req, res) => {
        const { terminateAllUserSessions } = await import("./utils/session-manager");
        try {
            const keepCurrent = req.body.keepCurrent !== false; // Default to keeping current session
            const sessionId = req.sessionId;
            const count = await terminateAllUserSessions(req.user.id, keepCurrent ? sessionId : undefined);
            return successResponse(res, {
                message: keepCurrent ? 'Logged out of all other devices' : 'Logged out of all devices',
                sessionsTerminated: count
            });
        }
        catch (error) {
            logger.error('Logout all devices failed', error instanceof Error ? error : undefined);
            return errorResponse(res, 'Failed to logout from all devices', 500);
        }
    });
    // User Profile Management
    app.put("/api/users/profile", authenticateToken, requireEmailVerification, validateRequest(updateProfileSchema), async (req, res) => {
        try {
            const { firstName, lastName, avatar } = req.body;
            const updates = {};
            if (firstName !== undefined)
                updates.firstName = firstName;
            if (lastName !== undefined)
                updates.lastName = lastName;
            if (avatar !== undefined)
                updates.avatar = avatar;
            const updatedUser = await storage.updateUser(req.user.id, updates);
            if (!updatedUser) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            const { password: _, ...userWithoutPassword } = updatedUser;
            res.json({ user: userWithoutPassword });
        }
        catch (error) {
            res.status(500).json({ message: "Error updating profile" });
        }
    });
    // Password Reset Request with rate limiting and validation
    // PHASE 1: Added password reset lockout and redirect URL validation
    app.post("/api/auth/request-password-reset", passwordResetRateLimiter, passwordResetLockoutMiddleware, validateRedirectUrlMiddleware, validateRequest(requestPasswordResetSchema), async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ message: "Email is required" });
                return;
            }
            const user = await storage.getUserByEmail(email);
            const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
            if (user) {
                // Store token in database with expiry and get the generated token
                const { createPasswordResetToken } = await import('./auth-enhanced');
                const userAgent = req.get('user-agent') || 'unknown';
                const resetToken = await createPasswordResetToken(user.id, ipAddress, userAgent);
                // Send password reset email
                const { sendPasswordResetEmail } = await import('./services/email');
                await sendPasswordResetEmail(email, resetToken);
                // PHASE 1: Record successful password reset request
                await recordPasswordResetAttempt(email, ipAddress, true);
                logger.info('Password reset requested', { userId: user.id, email });
            }
            // Always return same message for security (prevents user enumeration)
            res.json({
                message: "If an account exists with this email, a password reset link will be sent to your email address."
            });
        }
        catch (error) {
            logger.error('Password reset request failed', error instanceof Error ? error : undefined);
            res.status(500).json({ message: "Error processing request" });
        }
    });
    // Change Password (authenticated) with password history check and validation
    app.post("/api/auth/change-password", authenticateToken, requireEmailVerification, passwordChangeRateLimiter, validateRequest(changePasswordSchema), async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                res.status(400).json({ message: "Current and new passwords are required" });
                return;
            }
            if (newPassword.length < 8) {
                res.status(400).json({ message: "New password must be at least 8 characters" });
                return;
            }
            const user = await storage.getUser(req.user.id);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            const isValidPassword = await verifyPassword(currentPassword, user.password);
            if (!isValidPassword) {
                res.status(401).json({ message: "Current password is incorrect" });
                return;
            }
            // Check if password was used recently
            const isReused = await isPasswordReused(user.id, newPassword);
            if (isReused) {
                res.status(400).json({ message: "Cannot reuse a recent password. Please choose a different password." });
                return;
            }
            // SECURITY: Check password against HaveIBeenPwned breach database
            const { validatePasswordSecurity } = await import('./services/hibp');
            const passwordValidation = await validatePasswordSecurity(newPassword);
            if (!passwordValidation.valid) {
                res.status(400).json({
                    message: "Password does not meet security requirements",
                    errors: passwordValidation.errors,
                    warnings: passwordValidation.warnings
                });
                return;
            }
            const hashedPassword = await hashPassword(newPassword);
            await storage.updateUser(user.id, { password: hashedPassword });
            // Add old password to history
            await addPasswordToHistory(user.id, user.password);
            await invalidateAllUserSessions(user.id);
            logger.info('Password changed successfully', { userId: user.id });
            res.json({ message: "Password changed successfully. Please log in again." });
        }
        catch (error) {
            logger.error('Password change failed', error instanceof Error ? error : undefined);
            res.status(500).json({ message: "Error changing password" });
        }
    });
    // Reset Password (with token from email) with password history check and validation
    // PHASE 1: Added password reset lockout middleware
    app.post("/api/auth/reset-password", passwordResetRateLimiter, passwordResetLockoutMiddleware, validateRequest(resetPasswordSchema), async (req, res) => {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                res.status(400).json({ message: "Token and new password are required" });
                return;
            }
            if (newPassword.length < 8) {
                res.status(400).json({ message: "Password must be at least 8 characters" });
                return;
            }
            // CRITICAL FIX #4: Extract IP and User-Agent for token validation
            const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
            const userAgent = req.headers['user-agent'] || '';
            // Validate password reset token with IP/UA binding
            const { validatePasswordResetToken, markTokenAsUsed } = await import('./auth-enhanced');
            const validation = await validatePasswordResetToken(token, ipAddress, userAgent);
            if (!validation.valid) {
                // PHASE 1: Record failed password reset attempt
                await recordPasswordResetAttempt('unknown', ipAddress, false);
                res.status(400).json({ message: validation.error || "Invalid or expired token" });
                return;
            }
            // Check if password was used recently
            const isReused = await isPasswordReused(validation.userId, newPassword);
            if (isReused) {
                res.status(400).json({ message: "Cannot reuse a recent password. Please choose a different password." });
                return;
            }
            // SECURITY: Check password against HaveIBeenPwned breach database
            const { validatePasswordSecurity } = await import('./services/hibp');
            const passwordValidation = await validatePasswordSecurity(newPassword);
            if (!passwordValidation.valid) {
                res.status(400).json({
                    message: "Password does not meet security requirements",
                    errors: passwordValidation.errors,
                    warnings: passwordValidation.warnings
                });
                return;
            }
            // Get current password for history
            const user = await storage.getUser(validation.userId);
            if (user) {
                // Add current password to history before changing
                await addPasswordToHistory(user.id, user.password);
            }
            // Update user password
            const hashedPassword = await hashPassword(newPassword);
            await storage.updateUser(validation.userId, { password: hashedPassword });
            // Mark token as used
            await markTokenAsUsed(token);
            // Invalidate all user sessions for security
            await invalidateAllUserSessions(validation.userId);
            logger.info('Password reset successful', { userId: validation.userId });
            res.json({ message: "Password reset successfully. Please log in with your new password." });
        }
        catch (error) {
            logger.error('Password reset failed', error instanceof Error ? error : undefined);
            res.status(500).json({ message: "Error resetting password" });
        }
    });
    // 2FA Setup - Generate secret and QR code with rate limiting
    app.post("/api/auth/2fa/setup", authenticateToken, twoFactorSetupRateLimiter, async (req, res) => {
        try {
            const user = req.user;
            if (user.twoFactorEnabled) {
                res.status(400).json({ message: "2FA is already enabled" });
                return;
            }
            const { secret, otpauthUrl } = generate2FASecret(user.username);
            const qrCode = await generateQRCode(otpauthUrl);
            res.json({ secret, qrCode, otpauthUrl });
        }
        catch (error) {
            res.status(500).json({ message: "Error setting up 2FA" });
        }
    });
    // 2FA Enable - Verify token and save secret with rate limiting and validation (PHASE 1: Updated validation)
    app.post("/api/auth/2fa/enable", authenticateToken, twoFactorVerifyRateLimiter, validateRequest(enable2FASchema), async (req, res) => {
        try {
            const { secret, token } = req.body;
            const isValid = verify2FAToken(secret, token);
            if (!isValid) {
                res.status(401).json({ message: "Invalid verification token" });
                return;
            }
            const backupCodes = generate2FABackupCodes(8);
            const hashedBackupCodes = await hashBackupCodes(backupCodes);
            await storage.updateUser(req.user.id, {
                twoFactorEnabled: true,
                twoFactorSecret: secret,
                twoFactorBackupCodes: hashedBackupCodes
            });
            res.json({
                message: "2FA enabled successfully",
                backupCodes: backupCodes
            });
        }
        catch (error) {
            res.status(500).json({ message: "Error enabling 2FA" });
        }
    });
    // 2FA Disable - Verify token and disable with rate limiting (PHASE 1: Added validation)
    app.post("/api/auth/2fa/disable", authenticateToken, twoFactorVerifyRateLimiter, validateRequest(disable2FASchema), async (req, res) => {
        try {
            const { token } = req.body;
            const user = req.user;
            if (!user.twoFactorEnabled || !user.twoFactorSecret) {
                res.status(400).json({ message: "2FA is not enabled" });
                return;
            }
            const isValid = verify2FAToken(user.twoFactorSecret, token);
            if (!isValid) {
                res.status(401).json({ message: "Invalid verification token" });
                return;
            }
            await storage.updateUser(user.id, {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                twoFactorBackupCodes: null
            });
            res.json({ message: "2FA disabled successfully" });
        }
        catch (error) {
            res.status(500).json({ message: "Error disabling 2FA" });
        }
    });
    // 2FA Backup Codes - Regenerate backup codes (PHASE 1 CRITICAL SECURITY)
    app.post("/api/auth/2fa/backup-codes", authenticateToken, backupCodesRateLimiter, async (req, res) => {
        try {
            const user = req.user;
            if (!user.twoFactorEnabled) {
                res.status(400).json({ message: "2FA is not enabled" });
                return;
            }
            // Generate new backup codes
            const backupCodes = generate2FABackupCodes(8);
            const hashedBackupCodes = await hashBackupCodes(backupCodes);
            // Update user with new backup codes
            await storage.updateUser(user.id, {
                twoFactorBackupCodes: hashedBackupCodes
            });
            res.json({
                message: "Backup codes regenerated successfully",
                backupCodes: backupCodes
            });
        }
        catch (error) {
            res.status(500).json({ message: "Error regenerating backup codes" });
        }
    });
    // Email Verification - Verify email with token
    app.get("/api/auth/verify-email", async (req, res) => {
        try {
            const { token } = req.query;
            if (!token || typeof token !== 'string') {
                res.status(400).json({ message: "Verification token is required" });
                return;
            }
            const { verifyEmailToken } = await import("./services/email-verification");
            const result = await verifyEmailToken(token, req.ip, req.get('user-agent'));
            if (result.success) {
                res.json({ message: "Email verified successfully" });
            }
            else {
                res.status(400).json({ message: result.error || "Email verification failed" });
            }
        }
        catch (error) {
            res.status(500).json({ message: "Error verifying email" });
        }
    });
    // Email Verification - Resend verification email with rate limiting
    app.post("/api/auth/resend-verification", authenticateToken, emailVerificationRateLimiter, async (req, res) => {
        try {
            const user = req.user;
            if (user.isEmailVerified) {
                res.status(400).json({ message: "Email is already verified" });
                return;
            }
            const { resendVerificationEmail } = await import("./services/email-verification");
            const result = await resendVerificationEmail(user.id, user.email, req.ip, req.get('user-agent'));
            if (result.success) {
                res.json({ message: "Verification email sent successfully" });
            }
            else {
                res.status(400).json({ message: result.error || "Failed to send verification email" });
            }
        }
        catch (error) {
            res.status(500).json({ message: "Error sending verification email" });
        }
    });
    // Social Login - OAuth callback (simplified implementation)
    app.post("/api/auth/oauth/:provider", async (req, res) => {
        try {
            const { provider } = req.params;
            const { profile } = req.body;
            if (!profile || !profile.id) {
                res.status(400).json({ message: "Invalid OAuth profile data" });
                return;
            }
            const { findOrCreateOAuthUser } = await import("./services/oauth");
            const { user, isNewUser } = await findOrCreateOAuthUser({
                ...profile,
                provider,
            });
            const { sessionId, accessToken, refreshToken } = await createSession(user.id);
            const { password: _, ...userWithoutPassword } = user;
            res.json({
                message: isNewUser ? "Account created successfully" : "Login successful",
                user: userWithoutPassword,
                accessToken,
                refreshToken,
                sessionId,
                isNewUser,
            });
        }
        catch (error) {
            res.status(500).json({ message: "OAuth authentication failed" });
        }
    });
    // PHASE 3: Magic Link Authentication - Request link
    app.post("/api/auth/magic-link/request", loginRateLimiter, async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ message: "Email is required" });
                return;
            }
            const user = await storage.getUserByEmail(email);
            if (!user) {
                res.json({ message: "If an account exists, a magic link has been sent" });
                return;
            }
            const { createMagicLink } = await import('./services/magic-link');
            const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
            const token = await createMagicLink(user.id, email, ipAddress);
            const { sendMagicLinkEmail } = await import('./services/email');
            await sendMagicLinkEmail(email, token);
            res.json({ message: "If an account exists, a magic link has been sent" });
        }
        catch (error) {
            logger.error('Magic link request failed', error instanceof Error ? error : undefined);
            res.status(500).json({ message: "Failed to send magic link" });
        }
    });
    // PHASE 3: Magic Link Authentication - Verify and login
    app.post("/api/auth/magic-link/verify", async (req, res) => {
        try {
            const { token } = req.body;
            if (!token) {
                res.status(400).json({ message: "Token is required" });
                return;
            }
            const { validateMagicLink, useMagicLink } = await import('./services/magic-link');
            const validation = await validateMagicLink(token);
            if (!validation.valid || !validation.userId) {
                res.status(400).json({ message: validation.error || "Invalid magic link" });
                return;
            }
            await useMagicLink(token);
            const user = await storage.getUser(validation.userId);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            const { sessionId, accessToken, refreshToken } = await createSession(user.id);
            const { password: _, ...userWithoutPassword } = user;
            logger.info('Magic link login successful', { userId: user.id });
            res.json({
                message: "Login successful",
                user: userWithoutPassword,
                accessToken,
                refreshToken,
                sessionId,
            });
        }
        catch (error) {
            logger.error('Magic link verification failed', error instanceof Error ? error : undefined);
            res.status(500).json({ message: "Login failed" });
        }
    });
    // PHASE 3: Device Management - Get active sessions
    app.get("/api/auth/sessions", authenticateToken, async (req, res) => {
        try {
            const { getUserActiveSessions } = await import('./services/device-management');
            const sessions = await getUserActiveSessions(req.user.id, req.sessionId);
            res.json({ sessions });
        }
        catch (error) {
            logger.error('Failed to get user sessions', error instanceof Error ? error : undefined);
            res.status(500).json({ message: "Failed to retrieve sessions" });
        }
    });
    // PHASE 3: Device Management - Revoke specific session
    app.delete("/api/auth/sessions/:sessionId", authenticateToken, async (req, res) => {
        try {
            const { sessionId } = req.params;
            const { revokeDeviceSession } = await import('./services/device-management');
            const success = await revokeDeviceSession(req.user.id, sessionId);
            if (success) {
                res.json({ message: "Session revoked successfully" });
            }
            else {
                res.status(404).json({ message: "Session not found" });
            }
        }
        catch (error) {
            logger.error('Failed to revoke session', error instanceof Error ? error : undefined);
            res.status(500).json({ message: "Failed to revoke session" });
        }
    });
    // GDPR - Data Export
    app.get("/api/gdpr/export", authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const { password: _, twoFactorSecret: __, ...safeUser } = req.user;
            const [userWebsites, userProducts, userOrdersResult, userPostsResult, userCommunitiesResult, userCampaigns] = await Promise.all([
                storage.getWebsites(userId),
                storage.getUserProducts(userId),
                storage.getOrders(userId, { status: undefined, limit: 1000, offset: 0 }),
                storage.getPosts({ userId, status: undefined, limit: 1000, offset: 0 }),
                storage.getCommunities({ userId, limit: 1000, offset: 0 }),
                storage.getCampaigns(userId, { status: undefined })
            ]);
            const userData = {
                user: safeUser,
                websites: userWebsites,
                products: userProducts,
                orders: userOrdersResult.data,
                posts: userPostsResult.data,
                communities: userCommunitiesResult.data,
                campaigns: userCampaigns,
                exportDate: new Date().toISOString()
            };
            res.json({
                message: "Data export complete",
                data: userData
            });
        }
        catch (error) {
            res.status(500).json({ message: "Error exporting data" });
        }
    });
    // GDPR - Account Deletion with rate limiting
    app.delete("/api/gdpr/delete-account", authenticateToken, requireEmailVerification, accountDeletionRateLimiter, async (req, res) => {
        try {
            const { password, confirmation } = req.body;
            if (!password || confirmation !== "DELETE") {
                res.status(400).json({
                    message: "Password and confirmation (type 'DELETE') are required"
                });
                return;
            }
            const user = await storage.getUser(req.user.id);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            const isValidPassword = await verifyPassword(password, user.password);
            if (!isValidPassword) {
                res.status(401).json({ message: "Invalid password" });
                return;
            }
            await storage.deleteUser(user.id);
            await invalidateAllUserSessions(user.id);
            res.json({ message: "Account deleted successfully" });
        }
        catch (error) {
            res.status(500).json({ message: "Error deleting account" });
        }
    });
    // P0 FIX #22: Stripe payment route with idempotency protection
    const { stripeIdempotencyMiddleware, getStripeIdempotencyKey } = await import('./middleware/stripe-idempotency');
    app.post("/api/create-payment-intent", authenticateToken, requireEmailVerification, stripeIdempotencyMiddleware, validateRequest(createPaymentIntentSchema), async (req, res) => {
        try {
            const { amount } = req.body;
            const idempotencyKey = getStripeIdempotencyKey(req);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: "usd",
                metadata: {
                    userId: req.user.id,
                },
            }, {
                idempotencyKey // P0 FIX #22: Pass idempotency key to Stripe API
            });
            res.json({ clientSecret: paymentIntent.client_secret });
        }
        catch (error) {
            res
                .status(500)
                .json({ message: "Error creating payment intent: " + error.message });
        }
    });
    // P0 FIX #22: Subscription endpoint with idempotency protection
    app.post('/api/get-or-create-subscription', authenticateToken, requireEmailVerification, stripeIdempotencyMiddleware, validateRequest(createSubscriptionSchema), async (req, res) => {
        const user = req.user;
        if (user.stripeSubscriptionId) {
            try {
                const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
                try {
                    res.send({
                        subscriptionId: subscription.id,
                        status: subscription.status,
                    });
                }
                catch (error) {
                    logger.error('Error retrieving subscription', error instanceof Error ? error : new Error(String(error)));
                    res.status(500).json({ message: 'Error retrieving subscription details' });
                    return;
                }
                return;
            }
            catch (error) {
                logger.error('Error retrieving subscription', error instanceof Error ? error : new Error(String(error)));
            }
        }
        if (!user.email) {
            res.status(400).json({ message: 'User email is required for subscriptions' });
            return;
        }
        try {
            let customer;
            if (user.stripeCustomerId) {
                customer = await stripe.customers.retrieve(user.stripeCustomerId);
            }
            else {
                customer = await stripe.customers.create({
                    email: user.email,
                    name: user.username,
                    metadata: {
                        userId: user.id,
                    },
                });
                await storage.updateStripeCustomerId(user.id, customer.id);
            }
            if (!process.env.STRIPE_PRICE_ID) {
                res.status(500).json({ message: 'STRIPE_PRICE_ID not configured. Please contact support.' });
                return;
            }
            const subscription = await stripe.subscriptions.create({
                customer: customer.id,
                items: [{
                        price: process.env.STRIPE_PRICE_ID,
                    }],
                payment_behavior: 'default_incomplete',
                payment_settings: {
                    save_default_payment_method: 'on_subscription',
                },
                expand: ['latest_invoice.payment_intent'],
            });
            await storage.updateUserStripeInfo(user.id, {
                customerId: customer.id,
                subscriptionId: subscription.id
            });
            res.send({
                subscriptionId: subscription.id,
                clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
            });
        }
        catch (error) {
            logger.error('Subscription creation error', error instanceof Error ? error : new Error(String(error)));
            return res.status(400).send({ error: { message: error.message } });
        }
    });
    // Stripe webhook handler - uses raw body parser configured in server/index.ts
    // CRIT-004 FIX: Add IP whitelist validation to prevent spoofing attacks
    app.post('/api/webhooks/stripe', stripeIPWhitelistMiddleware, webhookRateLimiter, async (req, res) => {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            logger.error('STRIPE_WEBHOOK_SECRET is not configured. Rejecting webhook.');
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }
        const sig = req.headers['stripe-signature'];
        if (!sig) {
            logger.error('Missing stripe-signature header');
            return res.status(400).json({ error: 'Missing signature' });
        }
        // PHASE 1: Use Stripe's built-in webhook signature verification
        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        }
        catch (err) {
            logger.error('Webhook signature verification failed', err);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
        // CRIT-012 FIX: Add timestamp validation to prevent replay attacks
        // Stripe includes timestamp in signature, reject if older than 5 minutes
        const WEBHOOK_TOLERANCE_SECONDS = 300; // 5 minutes
        const timestamp = event.created || 0;
        const currentTime = Math.floor(Date.now() / 1000);
        if (timestamp < currentTime - WEBHOOK_TOLERANCE_SECONDS) {
            logger.warn('Webhook rejected - timestamp too old (potential replay attack)', {
                eventId: event.id,
                eventTimestamp: timestamp,
                age: currentTime - timestamp
            });
            return res.status(400).send('Webhook Error: Event timestamp too old');
        }
        const { checkWebhookReplayProtection, markWebhookProcessed } = await import('./utils/webhook');
        const { auditPaymentAction } = await import('./utils/audit');
        const isUnique = await checkWebhookReplayProtection(event.id, event.type, event);
        if (!isUnique) {
            logger.warn('Duplicate webhook event - already processed', { eventId: event.id, type: event.type });
            return res.json({ received: true, status: 'duplicate' });
        }
        let processingError;
        try {
            switch (event.type) {
                case 'customer.subscription.updated':
                case 'customer.subscription.created':
                    const subscription = event.data.object;
                    const customerId = typeof subscription.customer === 'string'
                        ? subscription.customer
                        : subscription.customer?.id;
                    if (customerId) {
                        const users = await storage.getAllUsers();
                        const user = users.find(u => u.stripeCustomerId === customerId);
                        if (user) {
                            await storage.updateUser(user.id, {
                                stripeSubscriptionId: subscription.id,
                                subscriptionTier: subscription.status === 'active' ? 'pro' : 'free'
                            });
                            await auditPaymentAction(user.id, event.type === 'customer.subscription.created' ? 'payment_succeeded' : 'payment_succeeded', subscription.id, { status: subscription.status, tier: subscription.status === 'active' ? 'pro' : 'free' });
                            logger.info('Subscription updated', { userId: user.id, status: subscription.status, subscriptionId: subscription.id });
                        }
                    }
                    break;
                case 'customer.subscription.deleted':
                    const deletedSub = event.data.object;
                    const delCustomerId = typeof deletedSub.customer === 'string'
                        ? deletedSub.customer
                        : deletedSub.customer?.id;
                    if (delCustomerId) {
                        const users = await storage.getAllUsers();
                        const user = users.find(u => u.stripeCustomerId === delCustomerId);
                        if (user) {
                            await storage.updateUser(user.id, {
                                stripeSubscriptionId: null,
                                subscriptionTier: 'free'
                            });
                            await auditPaymentAction(user.id, 'payment_succeeded', deletedSub.id, { action: 'subscription_cancelled' });
                            logger.info('Subscription cancelled', { userId: user.id, subscriptionId: deletedSub.id });
                        }
                    }
                    break;
                case 'invoice.payment_succeeded':
                    const invoice = event.data.object;
                    logger.info('Invoice payment succeeded', { invoiceId: invoice.id, amount: invoice.amount_paid });
                    break;
                case 'invoice.payment_failed':
                    const failedInvoice = event.data.object;
                    logger.error('Invoice payment failed', new Error('Payment failed'), { invoiceId: failedInvoice.id });
                    break;
                case 'payment_intent.succeeded':
                    const succeededIntent = event.data.object;
                    const succeededOrders = await storage.getAllOrders({
                        stripePaymentIntentId: succeededIntent.id,
                        status: 'pending'
                    });
                    if (succeededOrders.data.length > 0) {
                        const order = succeededOrders.data[0];
                        await storage.updateOrderStatus(order.id, 'confirmed');
                        await auditPaymentAction(order.userId, 'payment_succeeded', order.id, {
                            paymentIntentId: succeededIntent.id,
                            amount: succeededIntent.amount
                        });
                        logger.info('Order confirmed after payment success', { orderId: order.id, paymentIntentId: succeededIntent.id });
                    }
                    break;
                case 'payment_intent.payment_failed':
                case 'payment_intent.canceled':
                    const failedIntent = event.data.object;
                    const failedOrders = await storage.getAllOrders({
                        stripePaymentIntentId: failedIntent.id,
                        status: 'pending'
                    });
                    if (failedOrders.data.length > 0) {
                        const order = failedOrders.data[0];
                        await storage.restoreInventory(order.id);
                        await storage.updateOrderStatus(order.id, 'cancelled');
                        await auditPaymentAction(order.userId, 'payment_failed', order.id, {
                            paymentIntentId: failedIntent.id,
                            reason: event.type
                        });
                        logger.info('Order cancelled and inventory restored', { orderId: order.id, paymentIntentId: failedIntent.id });
                    }
                    break;
                case 'charge.refunded':
                    const refundedCharge = event.data.object;
                    logger.info('Charge refunded', { chargeId: refundedCharge.id, amount: refundedCharge.amount_refunded });
                    break;
                default:
                    logger.debug('Unhandled webhook event type', { type: event.type });
            }
            await markWebhookProcessed(event.id);
        }
        catch (error) {
            processingError = error.message;
            logger.error('Error processing webhook', error instanceof Error ? error : undefined, {
                eventId: event.id,
                eventType: event.type
            });
            await markWebhookProcessed(event.id, processingError);
            return res.status(500).json({ error: 'Webhook processing failed', details: processingError });
        }
        res.json({ received: true, eventId: event.id });
    });
    // AI Content Generation Endpoints (with strict rate limiting after auth)
    app.post("/api/ai/generate-website", authenticateToken, aiRateLimiter, validateRequest(generateWebsiteSchema), async (req, res) => {
        try {
            const { prompt, type = 'landing' } = req.body;
            const content = await generateWebsiteContent(prompt, type);
            res.json(content);
        }
        catch (error) {
            if (error instanceof AIServiceError) {
                res.status(error.statusCode).json({ message: error.message, code: error.code });
                return;
            }
            res.status(500).json({ message: error.message });
        }
    });
    app.post("/api/ai/generate-blog", authenticateToken, aiRateLimiter, validateRequest(generateBlogSchema), async (req, res) => {
        try {
            const { topic, tone = 'professional', length = 'medium' } = req.body;
            const content = await generateBlogPost(topic, tone, length);
            res.json(content);
        }
        catch (error) {
            if (error instanceof AIServiceError) {
                res.status(error.statusCode).json({ message: error.message, code: error.code });
                return;
            }
            res.status(500).json({ message: "Failed to generate blog post" });
        }
    });
    app.post("/api/ai/generate-marketing", authenticateToken, aiRateLimiter, validateRequest(generateMarketingSchema), async (req, res) => {
        try {
            const { product, audience, tone, format } = req.body;
            const content = await generateMarketingContent(product, format || 'email');
            res.json(content);
        }
        catch (error) {
            if (error instanceof AIServiceError) {
                res.status(error.statusCode).json({ message: error.message, code: error.code });
                return;
            }
            res.status(500).json({ message: error.message });
        }
    });
    app.post("/api/ai/optimize-seo", authenticateToken, aiRateLimiter, validateRequest(optimizeSEOSchema), async (req, res) => {
        try {
            const { content, targetKeywords } = req.body;
            const optimized = await optimizeForSEO(content, targetKeywords);
            res.json(optimized);
        }
        catch (error) {
            if (error instanceof AIServiceError) {
                res.status(error.statusCode).json({ message: error.message, code: error.code });
                return;
            }
            res.status(500).json({ message: "Failed to optimize content for SEO" });
        }
    });
    app.post("/api/ai/chatbot", optionalAuth, aiRateLimiter, validateRequest(chatbotSchema), async (req, res) => {
        try {
            const { message, conversationId, context } = req.body;
            const response = await generateChatbotResponse(message, context || '');
            res.json({ response, conversationId });
        }
        catch (error) {
            if (error instanceof AIServiceError) {
                res.status(error.statusCode).json({ message: error.message, code: error.code });
                return;
            }
            res.status(500).json({ message: error.message });
        }
    });
    app.post("/api/ai/analyze-content", authenticateToken, aiRateLimiter, validateRequest(analyzeContentSchema), async (req, res) => {
        try {
            const { content, type } = req.body;
            const analysis = await analyzeContent(content);
            res.json({ analysis, type });
        }
        catch (error) {
            if (error instanceof AIServiceError) {
                res.status(error.statusCode).json({ message: error.message, code: error.code });
                return;
            }
            res.status(500).json({ message: error.message });
        }
    });
    // AI Website Builder - Complete Website Generation
    app.post("/api/ai/generate-complete-website", authenticateToken, aiRateLimiter, validateRequest(generateCompleteWebsiteSchema), async (req, res) => {
        try {
            const { description, businessType, style, pages, colorScheme, features } = req.body;
            const website = await generateCompleteWebsite({
                description,
                businessType,
                style: style || 'modern',
                pages,
                colorScheme,
                features
            });
            res.json({ website });
        }
        catch (error) {
            if (error instanceof AIServiceError) {
                res.status(error.statusCode).json({ message: error.message, code: error.code });
                return;
            }
            res.status(500).json({ message: error.message });
        }
    });
    app.post("/api/ai/generate-component", authenticateToken, aiRateLimiter, validateRequest(generateComponentSchema), async (req, res) => {
        try {
            const { type, description, style, content } = req.body;
            const component = await generateWebComponent({
                type,
                description,
                style: style || 'modern',
                content
            });
            res.json({ component });
        }
        catch (error) {
            if (error instanceof AIServiceError) {
                res.status(error.statusCode).json({ message: error.message, code: error.code });
                return;
            }
            res.status(500).json({ message: error.message });
        }
    });
    app.post("/api/ai/generate-template", authenticateToken, aiRateLimiter, validateRequest(generateTemplateSchema), async (req, res) => {
        try {
            const { industry, style, features } = req.body;
            const template = await generateWebsiteTemplate({
                industry,
                style: style || 'modern',
                features: features || []
            });
            res.json({ template });
        }
        catch (error) {
            if (error instanceof AIServiceError) {
                res.status(error.statusCode).json({ message: error.message, code: error.code });
                return;
            }
            res.status(500).json({ message: error.message });
        }
    });
    app.post("/api/ai/enhance-content", authenticateToken, aiRateLimiter, validateRequest(enhanceContentSchema), async (req, res) => {
        try {
            const { content, enhancement, target, style, tone } = req.body;
            const enhanced = await enhanceWebsiteContent({
                content,
                enhancement: enhancement || 'readability',
                target: target || 'general audience'
            });
            res.json(enhanced);
        }
        catch (error) {
            if (error instanceof AIServiceError) {
                res.status(error.statusCode).json({ message: error.message, code: error.code });
                return;
            }
            res.status(500).json({ message: error.message });
        }
    });
    // RBAC Protected Routes
    app.get("/api/admin/users", authenticateToken, requireRole(["admin"]), async (req, res) => {
        // Get all users (admin only)
        try {
            const users = await storage.getAllUsers();
            res.json({ users: users.map(u => ({ ...u, password: undefined })) });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching users" });
        }
    });
    app.delete("/api/admin/users/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
        // Delete user (admin only)
        try {
            await storage.deleteUser(req.params.id);
            res.json({ message: "User deleted successfully" });
        }
        catch (error) {
            res.status(500).json({ message: "Error deleting user" });
        }
    });
    app.put("/api/admin/users/:id/role", authenticateToken, requireRole(["admin"]), async (req, res) => {
        // Update user role (admin only)
        try {
            const { role } = req.body;
            if (!['user', 'admin', 'moderator'].includes(role)) {
                res.status(400).json({ message: "Invalid role" });
                return;
            }
            const user = await storage.updateUser(req.params.id, { role });
            res.json({ user: user ? { ...user, password: undefined } : null });
        }
        catch (error) {
            res.status(500).json({ message: "Error updating user role" });
        }
    });
    // Moderator routes
    app.get("/api/moderate/content", authenticateToken, requireRole(["admin", "moderator"]), async (req, res) => {
        res.json({ message: "Content moderation access granted" });
    });
    // Pro subscription required routes
    app.post("/api/ai/advanced-generation", authenticateToken, aiRateLimiter, validateRequest(advancedGenerationSchema), async (req, res) => {
        if (!['pro', 'enterprise'].includes(req.user.subscriptionTier || 'free')) {
            res.status(403).json({ message: "Pro subscription required" });
            return;
        }
        try {
            const { prompt, type, complexity, customizations } = req.body;
            let contextPrompt = `${prompt}. Complexity level: ${complexity || 'intermediate'}. Type: ${type}.`;
            if (customizations) {
                contextPrompt += ` Customizations: ${JSON.stringify(customizations)}`;
            }
            // Use chatbot for flexible generation
            const result = await generateChatbotResponse(contextPrompt, `You are an expert ${type} creator. Generate ${complexity || 'intermediate'} level content.`);
            res.json({
                success: true,
                content: result,
                type,
                complexity: complexity || 'intermediate',
                tokensUsed: 0
            });
        }
        catch (error) {
            if (error instanceof AIServiceError) {
                res.status(error.statusCode).json({ message: error.message, code: error.code });
                return;
            }
            res.status(500).json({ message: "Advanced generation failed", error: error.message });
        }
    });
    // E-Commerce Product Management  
    app.get("/api/products", cacheMiddleware(300), optionalAuth, async (req, res) => {
        try {
            const { category, search, limit = 20, offset = 0 } = req.query;
            const pagination = calculatePagination(parseInt(limit), parseInt(offset));
            // Direct pool.query() without drizzle to test
            const { pool } = await import('./db');
            const result = await pool.query('SELECT * FROM products WHERE is_active = true ORDER BY created_at DESC LIMIT $1 OFFSET $2', [pagination.limit, pagination.offset]);
            const countResult = await pool.query('SELECT COUNT(*) as count FROM products WHERE is_active = true');
            paginatedResponse(res, result.rows, {
                limit: pagination.limit,
                offset: pagination.offset,
                totalCount: parseInt(countResult.rows[0].count)
            });
        }
        catch (error) {
            logger.error('Products API error', error instanceof Error ? error : new Error(String(error)));
            errorResponse(res, "Error fetching products");
        }
    });
    app.get("/api/products/:id", cacheMiddleware(600), optionalAuth, async (req, res) => {
        try {
            const product = await storage.getProduct(req.params.id);
            if (!product) {
                res.status(404).json({ message: "Product not found" });
                return;
            }
            res.json({ product });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching product" });
        }
    });
    app.post("/api/products", authenticateToken, productCreationRateLimiter, requireRole(["admin", "moderator"]), async (req, res) => {
        try {
            const productData = req.body;
            const product = await storage.createProduct({
                ...productData,
                userId: req.user.id
            });
            res.status(201).json({ product });
        }
        catch (error) {
            res.status(400).json({ message: `Error creating product: ${error.message}` });
        }
    });
    app.put("/api/products/:id", authenticateToken, async (req, res) => {
        try {
            const product = await storage.getProduct(req.params.id);
            if (!product) {
                res.status(404).json({ message: "Product not found" });
                return;
            }
            // Check ownership or admin role
            if (product.userId !== req.user.id && !['admin', 'moderator'].includes(req.user.role)) {
                res.status(403).json({ message: "Unauthorized" });
                return;
            }
            const updatedProduct = await storage.updateProduct(req.params.id, req.body);
            res.json({ product: updatedProduct });
        }
        catch (error) {
            res.status(400).json({ message: `Error updating product: ${error.message}` });
        }
    });
    app.delete("/api/products/:id", authenticateToken, async (req, res) => {
        try {
            const product = await storage.getProduct(req.params.id);
            if (!product) {
                res.status(404).json({ message: "Product not found" });
                return;
            }
            // Check ownership or admin role
            if (product.userId !== req.user.id && !['admin', 'moderator'].includes(req.user.role)) {
                res.status(403).json({ message: "Unauthorized" });
                return;
            }
            await storage.deleteProduct(req.params.id);
            res.json({ message: "Product deleted successfully" });
        }
        catch (error) {
            res.status(500).json({ message: "Error deleting product" });
        }
    });
    // File Upload Endpoints (with media-specific rate limiting after auth)
    app.post("/api/upload/image", authenticateToken, requireEmailVerification, mediaUploadRateLimiter, (req, res) => {
        uploadImage(req, res, async (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return errorResponse(res, 'File size exceeds 5MB limit', 400, 'FILE_TOO_LARGE');
                    }
                    return errorResponse(res, err.message, 400, 'UPLOAD_ERROR');
                }
                return errorResponse(res, err.message || 'Upload failed', 400, 'UPLOAD_ERROR');
            }
            if (!req.file) {
                return errorResponse(res, 'No file uploaded', 400, 'NO_FILE');
            }
            // SECURITY: Post-upload validation (SVG sanitization, virus scan)
            try {
                await postUploadSecurityValidation(req, res, () => { });
            }
            catch (validationError) {
                return errorResponse(res, validationError.message || 'File validation failed', 400, 'VALIDATION_FAILED');
            }
            const fileUrl = `/uploads/${req.file.filename}`;
            successResponse(res, {
                file: {
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                    url: fileUrl
                }
            }, 'Image uploaded successfully');
        });
    });
    app.post("/api/upload/file", fileUploadRateLimiter, authenticateToken, requireEmailVerification, (req, res) => {
        uploadSingle(req, res, async (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return errorResponse(res, 'File size exceeds 10MB limit', 400, 'FILE_TOO_LARGE');
                    }
                    return errorResponse(res, err.message, 400, 'UPLOAD_ERROR');
                }
                return errorResponse(res, err.message || 'Upload failed', 400, 'UPLOAD_ERROR');
            }
            if (!req.file) {
                return errorResponse(res, 'No file uploaded', 400, 'NO_FILE');
            }
            // SECURITY: Post-upload validation (SVG sanitization, virus scan)
            try {
                await postUploadSecurityValidation(req, res, () => { });
            }
            catch (validationError) {
                return errorResponse(res, validationError.message || 'File validation failed', 400, 'VALIDATION_FAILED');
            }
            const fileUrl = `/uploads/${req.file.filename}`;
            successResponse(res, {
                file: {
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                    url: fileUrl
                }
            }, 'File uploaded successfully');
        });
    });
    app.post("/api/upload/multiple", authenticateToken, mediaUploadRateLimiter, (req, res) => {
        uploadMultiple(req, res, async (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return errorResponse(res, 'File size exceeds 10MB limit', 400, 'FILE_TOO_LARGE');
                    }
                    if (err.code === 'LIMIT_FILE_COUNT') {
                        return errorResponse(res, 'Maximum 10 files allowed', 400, 'TOO_MANY_FILES');
                    }
                    return errorResponse(res, err.message, 400, 'UPLOAD_ERROR');
                }
                return errorResponse(res, err.message || 'Upload failed', 400, 'UPLOAD_ERROR');
            }
            if (!req.files || req.files.length === 0) {
                return errorResponse(res, 'No files uploaded', 400, 'NO_FILES');
            }
            // SECURITY: Post-upload validation (SVG sanitization, virus scan)
            try {
                await postUploadSecurityValidation(req, res, () => { });
            }
            catch (validationError) {
                return errorResponse(res, validationError.message || 'File validation failed', 400, 'VALIDATION_FAILED');
            }
            const files = req.files.map(file => ({
                filename: file.filename,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                url: `/uploads/${file.filename}`
            }));
            successResponse(res, { files }, 'Files uploaded successfully');
        });
    });
    // Serve uploaded files (with rate limiting to prevent abuse)
    app.use('/uploads', staticAssetRateLimiter, express.static(UPLOAD_DIR));
    // E-Commerce Order Management
    app.get("/api/orders", authenticateToken, async (req, res) => {
        try {
            const { status, limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 20, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getOrders(req.user.id, {
                status: status,
                limit: pagination.limit,
                offset: pagination.offset
            });
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching orders");
        }
    });
    app.get("/api/orders/:id", authenticateToken, async (req, res) => {
        try {
            const order = await storage.getOrder(req.params.id);
            if (!order) {
                res.status(404).json({ message: "Order not found" });
                return;
            }
            // Check ownership or admin role
            if (order.userId !== req.user.id && !['admin', 'moderator'].includes(req.user.role)) {
                res.status(403).json({ message: "Unauthorized" });
                return;
            }
            res.json({ order });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching order" });
        }
    });
    app.post("/api/orders", authenticateToken, requireEmailVerification, idempotencyMiddleware, async (req, res) => {
        try {
            const { items, shippingAddress, paymentMethodId } = req.body;
            const idempotencyKey = req.idempotencyKey;
            if (!items || !Array.isArray(items) || items.length === 0) {
                validationErrorResponse(res, [{ field: 'items', message: 'Order items are required' }]);
                return;
            }
            const existingOrder = await storage.getOrderByIdempotencyKey(idempotencyKey);
            if (existingOrder) {
                logger.info('Duplicate order request detected', { idempotencyKey: idempotencyKey.substring(0, 8) + '...', orderId: existingOrder.id });
                res.setHeader('Idempotency-Key', idempotencyKey);
                successResponse(res, { order: existingOrder, duplicate: true }, 'Order already exists (idempotent)', 200);
                return;
            }
            let subtotal = 0;
            const orderItems = [];
            for (const item of items) {
                const product = await storage.getProduct(item.productId);
                if (!product) {
                    errorResponse(res, `Product not found: ${item.productId}`, 400, 'PRODUCT_NOT_FOUND');
                    return;
                }
                const itemTotal = parseFloat(product.price) * item.quantity;
                subtotal += itemTotal;
                orderItems.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: parseFloat(product.price),
                    total: itemTotal,
                    taxable: true // Most products are taxable
                });
            }
            // CRITICAL FIX: Calculate tax for the order
            let taxAmount = 0;
            let taxRate = 0;
            try {
                if (shippingAddress && validateTaxInput({
                    subtotal,
                    items: orderItems,
                    shippingAddress
                })) {
                    const taxResult = await calculateTax({
                        subtotal,
                        items: orderItems,
                        shippingAddress
                    });
                    taxAmount = taxResult.taxTotal;
                    taxRate = taxResult.taxRate;
                    logger.info('Tax calculated for order', { subtotal, taxAmount, taxRate });
                }
            }
            catch (taxError) {
                logger.warn('Tax calculation failed, proceeding without tax', taxError instanceof Error ? taxError : undefined);
            }
            const totalAmount = subtotal + taxAmount;
            const userEmail = req.user.email;
            if (!userEmail) {
                return res.status(400).json({
                    error: 'User email is required for analytics export'
                });
            }
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(totalAmount * 100),
                currency: "usd",
                payment_method: paymentMethodId,
                confirm: false,
                capture_method: 'automatic',
                return_url: `${process.env.APP_URL || 'http://localhost:5000'}/orders`,
                metadata: {
                    userId: req.user.id,
                },
            });
            let order;
            try {
                order = await storage.createOrderWithInventoryCheck({
                    userId: req.user.id,
                    customerEmail: userEmail,
                    items: orderItems,
                    total: totalAmount,
                    shippingAddress,
                    stripePaymentIntentId: paymentIntent.id,
                    status: 'pending',
                    idempotencyKey: idempotencyKey
                });
                let confirmedIntent;
                try {
                    confirmedIntent = await stripe.paymentIntents.confirm(paymentIntent.id);
                }
                catch (paymentError) {
                    await storage.restoreInventory(order.id);
                    await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => { });
                    throw paymentError;
                }
                if (confirmedIntent.status === 'succeeded') {
                    await storage.updateOrderStatus(order.id, 'confirmed', 'paid');
                    order.status = 'confirmed';
                    // CRITICAL FIX: Trigger order fulfillment service
                    try {
                        await orderFulfillmentService.fulfillOrder({
                            orderId: order.id,
                            autoNotify: true,
                            updateInventory: false // Already updated during order creation
                        });
                        logger.info('Order fulfillment initiated', { orderId: order.id });
                    }
                    catch (fulfillmentError) {
                        logger.error('Order fulfillment failed, but order created successfully', fulfillmentError instanceof Error ? fulfillmentError : undefined, { orderId: order.id });
                    }
                    // CRITICAL FIX: Generate and send payment receipt
                    try {
                        const receipt = await generateReceipt({
                            orderId: order.id,
                            amount: totalAmount,
                            tax: taxAmount,
                            subtotal: subtotal,
                            paymentMethod: 'card',
                            transactionId: paymentIntent.id,
                            customerEmail: userEmail,
                            customerName: req.user.username || 'Customer',
                            items: orderItems.map(item => ({
                                name: item.productId,
                                quantity: item.quantity,
                                price: item.price,
                                total: item.total
                            }))
                        });
                        const { emailService } = await import('./services/email');
                        await emailService.sendEmail({
                            to: userEmail,
                            subject: `Payment Receipt - Order #${order.id}`,
                            html: receipt
                        });
                        logger.info('Payment receipt generated and sent', { orderId: order.id, email: userEmail });
                    }
                    catch (receiptError) {
                        logger.error('Receipt generation failed, but payment succeeded', receiptError instanceof Error ? receiptError : undefined, { orderId: order.id });
                    }
                }
                else if (confirmedIntent.status === 'requires_action') {
                    order.status = 'pending';
                }
                else {
                    await storage.restoreInventory(order.id);
                    await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => { });
                    errorResponse(res, `Payment failed with status: ${confirmedIntent.status}`, 400, 'PAYMENT_FAILED', { status: confirmedIntent.status });
                    return;
                }
            }
            catch (inventoryError) {
                try {
                    await stripe.paymentIntents.cancel(paymentIntent.id);
                }
                catch (cancelError) {
                    logger.error('Failed to cancel payment intent', cancelError instanceof Error ? cancelError : new Error(String(cancelError)));
                }
                throw inventoryError;
            }
            res.setHeader('Idempotency-Key', idempotencyKey);
            successResponse(res, { order, clientSecret: paymentIntent.client_secret }, 'Order created successfully', 201);
        }
        catch (error) {
            console.error('Order creation error:', error);
            if (error.message && error.message.includes('Insufficient inventory')) {
                errorResponse(res, error.message, 400, 'INSUFFICIENT_INVENTORY');
                return;
            }
            if (error.message && error.message.includes('Product')) {
                errorResponse(res, error.message, 400, 'PRODUCT_ERROR');
                return;
            }
            errorResponse(res, 'Failed to create order. Please try again.', 500, 'ORDER_CREATION_FAILED');
        }
    });
    app.put("/api/orders/:id/status", authenticateToken, requireRole(["admin", "moderator"]), async (req, res) => {
        try {
            const { status } = req.body;
            const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
            if (!validStatuses.includes(status)) {
                validationErrorResponse(res, [{ field: 'status', message: 'Invalid order status' }]);
                return;
            }
            const existingOrder = await storage.getOrder(req.params.id);
            if (!existingOrder) {
                notFoundResponse(res, 'Order');
                return;
            }
            if (status === 'cancelled' || status === 'refunded') {
                if (existingOrder.status !== 'cancelled' && existingOrder.status !== 'refunded') {
                    await storage.restoreInventory(req.params.id);
                }
            }
            const order = await storage.updateOrderStatus(req.params.id, status);
            successResponse(res, { order }, `Order status updated to ${status}`);
        }
        catch (error) {
            console.error('Error updating order status:', error);
            errorResponse(res, `Failed to update order status: ${error.message}`, 400, 'ORDER_UPDATE_FAILED');
        }
    });
    // MISSING FEATURE FIX: Order Refund Endpoint
    app.post("/api/orders/:id/refund", authenticateToken, requireRole(["admin", "moderator"]), async (req, res) => {
        try {
            const { amount, reason, restoreInventory = true } = req.body;
            const orderId = req.params.id;
            const order = await storage.getOrder(orderId);
            if (!order) {
                notFoundResponse(res, 'Order');
                return;
            }
            // Validate order can be refunded
            if (order.paymentStatus === 'refunded') {
                errorResponse(res, 'Order has already been fully refunded', 400, 'ALREADY_REFUNDED');
                return;
            }
            if (order.paymentStatus !== 'paid') {
                errorResponse(res, 'Can only refund paid orders', 400, 'INVALID_ORDER_STATUS');
                return;
            }
            // Calculate refund amount
            const maxRefundAmount = parseFloat(order.totalAmount);
            const refundAmount = amount ? parseFloat(amount) : maxRefundAmount;
            if (refundAmount <= 0 || refundAmount > maxRefundAmount) {
                validationErrorResponse(res, [{ field: 'amount', message: `Refund amount must be between $0 and $${maxRefundAmount}` }]);
                return;
            }
            // Process Stripe refund if payment was made through Stripe
            let stripeRefundId = null;
            if (order.stripePaymentIntentId && process.env.STRIPE_SECRET_KEY) {
                try {
                    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' });
                    const refund = await stripeClient.refunds.create({
                        payment_intent: order.stripePaymentIntentId,
                        amount: Math.round(refundAmount * 100), // Convert to cents
                        reason: reason || 'requested_by_customer',
                        metadata: {
                            orderId: order.id,
                            initiatedBy: req.user.id,
                        },
                    });
                    stripeRefundId = refund.id;
                    logger.info('Stripe refund processed', {
                        orderId: order.id,
                        refundId: refund.id,
                        amount: refundAmount,
                        initiatedBy: req.user.id,
                    });
                }
                catch (stripeError) {
                    logger.error('Stripe refund failed', stripeError);
                    errorResponse(res, `Stripe refund failed: ${stripeError.message}`, 500, 'STRIPE_REFUND_FAILED');
                    return;
                }
            }
            // Restore inventory if requested
            let restoredItems = null;
            if (restoreInventory) {
                await storage.restoreInventory(orderId);
                restoredItems = order.items;
            }
            // Create refund record
            const refund = await storage.createRefund({
                orderId: order.id,
                stripeRefundId,
                amount: refundAmount.toString(),
                currency: order.currency || 'usd',
                reason: reason || 'requested_by_customer',
                status: stripeRefundId ? 'succeeded' : 'pending',
                inventoryRestored: restoreInventory,
                restoredItems: restoreInventory ? restoredItems : null,
                initiatedBy: req.user.id,
                processedAt: new Date(),
            });
            // Update order status
            const isFullRefund = refundAmount >= maxRefundAmount;
            const newPaymentStatus = isFullRefund ? 'refunded' : 'partial_refund';
            await storage.updateOrderStatus(orderId, isFullRefund ? 'refunded' : order.status, newPaymentStatus);
            logger.info('Order refund created', {
                orderId: order.id,
                refundId: refund.id,
                amount: refundAmount,
                isFullRefund,
                inventoryRestored: restoreInventory,
                initiatedBy: req.user.id,
            });
            successResponse(res, {
                refund,
                order: { ...order, paymentStatus: newPaymentStatus },
                inventoryRestored: restoreInventory,
            }, isFullRefund ? 'Order fully refunded' : 'Partial refund processed', 201);
        }
        catch (error) {
            logger.error('Refund creation failed', error);
            errorResponse(res, `Failed to process refund: ${error.message}`, 500, 'REFUND_FAILED');
        }
    });
    // Website Builder CRUD
    app.get("/api/websites", authenticateToken, async (req, res) => {
        try {
            const { status, limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 20, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getWebsites(req.user.id, {
                status,
                limit: pagination.limit,
                offset: pagination.offset
            });
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching websites");
        }
    });
    app.get("/api/websites/:id", authenticateToken, async (req, res) => {
        try {
            const website = await storage.getWebsite(req.params.id);
            if (!website || website.userId !== req.user.id) {
                res.status(404).json({ message: "Website not found" });
                return;
            }
            res.json({ website });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching website" });
        }
    });
    app.post("/api/websites", authenticateToken, async (req, res) => {
        try {
            const website = await storage.createWebsite({ ...req.body, userId: req.user.id });
            res.status(201).json({ website });
        }
        catch (error) {
            res.status(400).json({ message: `Error creating website: ${error.message}` });
        }
    });
    app.put("/api/websites/:id", authenticateToken, async (req, res) => {
        try {
            const website = await storage.getWebsite(req.params.id);
            if (!website || website.userId !== req.user.id) {
                res.status(404).json({ message: "Website not found" });
                return;
            }
            const updated = await storage.updateWebsite(req.params.id, req.body);
            res.json({ website: updated });
        }
        catch (error) {
            res.status(400).json({ message: `Error updating website: ${error.message}` });
        }
    });
    app.delete("/api/websites/:id", authenticateToken, async (req, res) => {
        try {
            const website = await storage.getWebsite(req.params.id);
            if (!website || website.userId !== req.user.id) {
                res.status(404).json({ message: "Website not found" });
                return;
            }
            await storage.deleteWebsite(req.params.id);
            res.json({ message: "Website deleted successfully" });
        }
        catch (error) {
            res.status(500).json({ message: "Error deleting website" });
        }
    });
    app.post("/api/websites/:id/publish", authenticateToken, async (req, res) => {
        try {
            const website = await storage.getWebsite(req.params.id);
            if (!website || website.userId !== req.user.id) {
                res.status(404).json({ message: "Website not found" });
                return;
            }
            const published = await storage.publishWebsite(req.params.id);
            res.json({ website: published });
        }
        catch (error) {
            res.status(400).json({ message: `Error publishing website: ${error.message}` });
        }
    });
    app.get("/api/websites/:id/versions", authenticateToken, async (req, res) => {
        try {
            const website = await storage.getWebsite(req.params.id);
            if (!website || website.userId !== req.user.id) {
                res.status(404).json({ message: "Website not found" });
                return;
            }
            const versions = await storage.getWebsiteVersions(req.params.id);
            res.json({ versions });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching versions" });
        }
    });
    // Blog/CMS Posts CRUD
    app.get("/api/posts", cacheMiddleware(300), optionalAuth, async (req, res) => {
        try {
            const { userId, status, type, search, limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 20, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getPosts({
                userId: userId,
                status: status,
                type: type,
                search: sanitizeSearchInput(search),
                limit: pagination.limit,
                offset: pagination.offset
            });
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching posts");
        }
    });
    app.get("/api/posts/:id", cacheMiddleware(600), optionalAuth, async (req, res) => {
        try {
            const post = await storage.getPost(req.params.id);
            if (!post) {
                res.status(404).json({ message: "Post not found" });
                return;
            }
            res.json({ post });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching post" });
        }
    });
    app.get("/api/posts/slug/:slug", cacheMiddleware(600), optionalAuth, async (req, res) => {
        try {
            const post = await storage.getPostBySlug(req.params.slug);
            if (!post) {
                res.status(404).json({ message: "Post not found" });
                return;
            }
            res.json({ post });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching post" });
        }
    });
    app.post("/api/posts", authenticateToken, async (req, res) => {
        try {
            const postData = { ...req.body, userId: req.user.id };
            if (!postData.slug && postData.title) {
                const baseSlug = slugify(postData.title);
                postData.slug = `${baseSlug}-${Date.now()}`;
            }
            const post = await storage.createPost(postData);
            res.status(201).json({ post });
        }
        catch (error) {
            res.status(400).json({ message: `Error creating post: ${error.message}` });
        }
    });
    app.put("/api/posts/:id", authenticateToken, async (req, res) => {
        try {
            const post = await storage.getPost(req.params.id);
            if (!post || post.userId !== req.user.id) {
                res.status(404).json({ message: "Post not found" });
                return;
            }
            const updated = await storage.updatePost(req.params.id, req.body);
            res.json({ post: updated });
        }
        catch (error) {
            res.status(400).json({ message: `Error updating post: ${error.message}` });
        }
    });
    app.delete("/api/posts/:id", authenticateToken, async (req, res) => {
        try {
            const post = await storage.getPost(req.params.id);
            if (!post || post.userId !== req.user.id) {
                res.status(404).json({ message: "Post not found" });
                return;
            }
            await storage.deletePost(req.params.id);
            res.json({ message: "Post deleted successfully" });
        }
        catch (error) {
            res.status(500).json({ message: "Error deleting post" });
        }
    });
    app.post("/api/posts/:id/publish", authenticateToken, async (req, res) => {
        try {
            const post = await storage.getPost(req.params.id);
            if (!post || post.userId !== req.user.id) {
                res.status(404).json({ message: "Post not found" });
                return;
            }
            const published = await storage.publishPost(req.params.id);
            res.json({ post: published });
        }
        catch (error) {
            res.status(400).json({ message: `Error publishing post: ${error.message}` });
        }
    });
    // Comments
    app.get("/api/posts/:postId/comments", async (req, res) => {
        try {
            const comments = await storage.getComments(req.params.postId);
            res.json({ comments });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching comments" });
        }
    });
    app.post("/api/posts/:postId/comments", optionalAuth, async (req, res) => {
        try {
            const comment = await storage.createComment({
                postId: req.params.postId,
                userId: req.user?.id,
                ...req.body
            });
            res.status(201).json({ comment });
        }
        catch (error) {
            res.status(400).json({ message: `Error creating comment: ${error.message}` });
        }
    });
    app.get("/api/comments/moderation", authenticateToken, requireRole(["admin", "moderator"]), async (req, res) => {
        try {
            const { status = 'pending' } = req.query;
            const comments = await storage.getCommentsByStatus(status);
            res.json(comments);
        }
        catch (error) {
            res.status(500).json({ message: `Error fetching comments: ${error.message}` });
        }
    });
    app.put("/api/comments/:id/status", authenticateToken, requireRole(["admin", "moderator"]), async (req, res) => {
        try {
            const { status } = req.body;
            const comment = await storage.updateCommentStatus(req.params.id, status);
            res.json({ comment });
        }
        catch (error) {
            res.status(400).json({ message: `Error updating comment: ${error.message}` });
        }
    });
    // Communities
    app.get("/api/communities", optionalAuth, async (req, res) => {
        try {
            const { search, limit, offset, includePrivate = false } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 20, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getCommunities({
                search: sanitizeSearchInput(search),
                limit: pagination.limit,
                offset: pagination.offset,
                includePrivate: includePrivate === 'true'
            });
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching communities");
        }
    });
    app.get("/api/communities/:id", optionalAuth, async (req, res) => {
        try {
            const community = await storage.getCommunity(req.params.id);
            if (!community) {
                res.status(404).json({ message: "Community not found" });
                return;
            }
            res.json({ community });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching community" });
        }
    });
    app.post("/api/communities", authenticateToken, async (req, res) => {
        try {
            const communityData = { ...req.body, ownerId: req.user.id };
            if (!communityData.slug && communityData.name) {
                const baseSlug = slugify(communityData.name);
                communityData.slug = `${baseSlug}-${Date.now()}`;
            }
            const community = await storage.createCommunity(communityData);
            res.status(201).json({ community });
        }
        catch (error) {
            res.status(400).json({ message: `Error creating community: ${error.message}` });
        }
    });
    app.put("/api/communities/:id", authenticateToken, async (req, res) => {
        try {
            const community = await storage.getCommunity(req.params.id);
            if (!community || community.ownerId !== req.user.id) {
                res.status(404).json({ message: "Community not found or unauthorized" });
                return;
            }
            const updated = await storage.updateCommunity(req.params.id, req.body);
            res.json({ community: updated });
        }
        catch (error) {
            res.status(400).json({ message: `Error updating community: ${error.message}` });
        }
    });
    app.post("/api/communities/:id/join", authenticateToken, async (req, res) => {
        try {
            const member = await storage.joinCommunity(req.params.id, req.user.id);
            res.status(201).json({ member });
        }
        catch (error) {
            res.status(400).json({ message: `Error joining community: ${error.message}` });
        }
    });
    app.post("/api/communities/:id/leave", authenticateToken, async (req, res) => {
        try {
            await storage.leaveCommunity(req.params.id, req.user.id);
            res.json({ message: "Left community successfully" });
        }
        catch (error) {
            res.status(400).json({ message: `Error leaving community: ${error.message}` });
        }
    });
    app.get("/api/communities/:id/members", async (req, res) => {
        try {
            const members = await storage.getCommunityMembers(req.params.id);
            res.json({ members });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching members" });
        }
    });
    // Messages
    app.get("/api/messages", authenticateToken, async (req, res) => {
        try {
            const { communityId, limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 50, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getMessages({
                userId: req.user.id,
                communityId: communityId,
                limit: pagination.limit,
                offset: pagination.offset
            });
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching messages");
        }
    });
    app.post("/api/messages", authenticateToken, async (req, res) => {
        try {
            const message = await storage.createMessage({ ...req.body, senderId: req.user.id });
            res.status(201).json({ message });
        }
        catch (error) {
            res.status(400).json({ message: `Error creating message: ${error.message}` });
        }
    });
    // Marketing Campaigns
    app.get("/api/campaigns", authenticateToken, async (req, res) => {
        try {
            const { status, limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 20, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getCampaigns(req.user.id, {
                status,
                limit: pagination.limit,
                offset: pagination.offset
            });
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching campaigns");
        }
    });
    app.get("/api/campaigns/:id", authenticateToken, async (req, res) => {
        try {
            const campaign = await storage.getCampaign(req.params.id);
            if (!campaign) {
                res.status(404).json({ message: "Campaign not found" });
                return;
            }
            res.json({ campaign });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching campaign" });
        }
    });
    app.post("/api/campaigns", authenticateToken, async (req, res) => {
        try {
            const campaign = await storage.createCampaign({ ...req.body, userId: req.user.id });
            res.status(201).json({ campaign });
        }
        catch (error) {
            res.status(400).json({ message: `Error creating campaign: ${error.message}` });
        }
    });
    app.put("/api/campaigns/:id", authenticateToken, async (req, res) => {
        try {
            const updated = await storage.updateCampaign(req.params.id, req.body);
            res.json({ campaign: updated });
        }
        catch (error) {
            res.status(400).json({ message: `Error updating campaign: ${error.message}` });
        }
    });
    // Leads/CRM
    app.get("/api/leads", authenticateToken, async (req, res) => {
        try {
            const { status, source, limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 50, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getLeads(req.user.id, {
                status,
                source,
                limit: pagination.limit,
                offset: pagination.offset
            });
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching leads");
        }
    });
    app.post("/api/leads", authenticateToken, async (req, res) => {
        try {
            const lead = await storage.createLead({ ...req.body, userId: req.user.id });
            res.status(201).json({ lead });
        }
        catch (error) {
            res.status(400).json({ message: `Error creating lead: ${error.message}` });
        }
    });
    app.put("/api/leads/:id", authenticateToken, async (req, res) => {
        try {
            const updated = await storage.updateLead(req.params.id, req.body);
            res.json({ lead: updated });
        }
        catch (error) {
            res.status(400).json({ message: `Error updating lead: ${error.message}` });
        }
    });
    // Plugin Marketplace
    app.get("/api/plugins", optionalAuth, async (req, res) => {
        try {
            const { category, search, limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 20, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getPlugins({
                category: category,
                search: sanitizeSearchInput(search),
                limit: pagination.limit,
                offset: pagination.offset
            });
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching plugins");
        }
    });
    app.get("/api/plugins/:id", optionalAuth, async (req, res) => {
        try {
            const plugin = await storage.getPlugin(req.params.id);
            if (!plugin) {
                res.status(404).json({ message: "Plugin not found" });
                return;
            }
            res.json({ plugin });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching plugin" });
        }
    });
    app.post("/api/plugins", authenticateToken, async (req, res) => {
        try {
            const plugin = await storage.createPlugin({ ...req.body, developerId: req.user.id });
            res.status(201).json({ plugin });
        }
        catch (error) {
            res.status(400).json({ message: `Error creating plugin: ${error.message}` });
        }
    });
    app.post("/api/plugins/:id/install", authenticateToken, async (req, res) => {
        try {
            const plugin = await storage.getPlugin(req.params.id);
            if (!plugin) {
                res.status(404).json({ message: "Plugin not found" });
                return;
            }
            const installation = await storage.installPlugin(req.user.id, req.params.id, plugin.version);
            res.status(201).json({ installation });
        }
        catch (error) {
            res.status(400).json({ message: `Error installing plugin: ${error.message}` });
        }
    });
    app.get("/api/plugins/installed/me", authenticateToken, async (req, res) => {
        try {
            const installations = await storage.getInstalledPlugins(req.user.id);
            res.json({ installations });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching installed plugins" });
        }
    });
    app.delete("/api/plugins/:id/uninstall", authenticateToken, async (req, res) => {
        try {
            await storage.uninstallPlugin(req.user.id, req.params.id);
            res.json({ message: "Plugin uninstalled successfully" });
        }
        catch (error) {
            res.status(400).json({ message: `Error uninstalling plugin: ${error.message}` });
        }
    });
    // Notifications
    app.get("/api/notifications", authenticateToken, async (req, res) => {
        try {
            const { type, isRead, limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 50, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getNotifications(req.user.id, {
                type: type,
                isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
                limit: pagination.limit,
                offset: pagination.offset
            });
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching notifications");
        }
    });
    app.post("/api/notifications", authenticateToken, async (req, res) => {
        try {
            const notification = await storage.createNotification({ ...req.body, userId: req.user.id });
            res.status(201).json({ notification });
        }
        catch (error) {
            res.status(400).json({ message: `Error creating notification: ${error.message}` });
        }
    });
    app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
        try {
            const notification = await storage.markNotificationRead(req.params.id);
            res.json({ notification });
        }
        catch (error) {
            res.status(400).json({ message: `Error marking notification as read: ${error.message}` });
        }
    });
    app.put("/api/notifications/read-all", authenticateToken, async (req, res) => {
        try {
            await storage.markAllNotificationsRead(req.user.id);
            res.json({ message: "All notifications marked as read" });
        }
        catch (error) {
            res.status(400).json({ message: `Error marking notifications as read: ${error.message}` });
        }
    });
    // Media Library
    app.get("/api/media", authenticateToken, async (req, res) => {
        try {
            const { mimeType, limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 50, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getMedia(req.user.id, {
                mimeType: mimeType,
                limit: pagination.limit,
                offset: pagination.offset
            });
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching media");
        }
    });
    app.post("/api/media", authenticateToken, async (req, res) => {
        try {
            const media = await storage.createMedia({ ...req.body, userId: req.user.id });
            res.status(201).json({ media });
        }
        catch (error) {
            res.status(400).json({ message: `Error creating media: ${error.message}` });
        }
    });
    app.put("/api/media/:id", authenticateToken, async (req, res) => {
        try {
            const updated = await storage.updateMedia(req.params.id, req.body);
            res.json({ media: updated });
        }
        catch (error) {
            res.status(400).json({ message: `Error updating media: ${error.message}` });
        }
    });
    app.delete("/api/media/:id", authenticateToken, async (req, res) => {
        try {
            await storage.deleteMedia(req.params.id);
            res.json({ message: "Media deleted successfully" });
        }
        catch (error) {
            res.status(500).json({ message: "Error deleting media" });
        }
    });
    // Audit Logs
    app.get("/api/audit-logs", authenticateToken, requireRole(["admin"]), async (req, res) => {
        try {
            const { userId, action, resource, limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 100, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getAuditLogs({
                userId: userId,
                action: action,
                resource: resource,
                limit: pagination.limit,
                offset: pagination.offset
            });
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching audit logs");
        }
    });
    // Analytics Endpoints
    app.get("/api/analytics", optionalAuth, async (req, res) => {
        try {
            const { range = '30days', userId } = req.query;
            const targetUserId = userId || req.user?.id;
            // Fetch data based on time range
            const [ordersResult, productsResult] = await Promise.all([
                targetUserId ? storage.getOrders(targetUserId, { limit: 1000, offset: 0 }) : Promise.resolve({ data: [], totalCount: 0 }),
                storage.getProducts({ limit: 1000, offset: 0 })
            ]);
            const totalRevenue = ordersResult.data
                .filter(o => o.status === 'delivered' || o.status === 'paid')
                .reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
            const totalOrders = ordersResult.data.length;
            const activeUsers = targetUserId ? 1 : 0;
            // Metrics
            const metrics = [
                {
                    label: 'Total Revenue',
                    value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                    change: 12.5,
                    trend: 'up',
                    icon: 'DollarSign'
                },
                {
                    label: 'Total Orders',
                    value: totalOrders.toString(),
                    change: 8.2,
                    trend: 'up',
                    icon: 'ShoppingCart'
                },
                {
                    label: 'Active Users',
                    value: activeUsers.toString(),
                    change: -3.1,
                    trend: totalRevenue > 0 ? 'up' : 'neutral',
                    icon: 'Users'
                },
                {
                    label: 'Page Views',
                    value: (totalOrders * 10).toString(),
                    change: 15.3,
                    trend: 'up',
                    icon: 'Eye'
                }
            ];
            // Revenue data (last 7 days)
            const revenueData = ordersResult.data.slice(0, 7).map((order, i) => ({
                date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                value: parseFloat(order.total.toString()),
                orders: 1
            }));
            // Traffic sources
            const trafficSources = [
                { label: 'Direct', value: Math.floor(totalOrders * 0.4) },
                { label: 'Search Engines', value: Math.floor(totalOrders * 0.35) },
                { label: 'Social Media', value: Math.floor(totalOrders * 0.15) },
                { label: 'Referral', value: Math.floor(totalOrders * 0.1) }
            ];
            // Top products
            const topProducts = productsResult.data.slice(0, 5).map(p => ({
                label: p.name,
                value: p.inventory || 0,
                revenue: parseFloat(p.price.toString()) * (p.inventory || 0)
            }));
            // Conversion funnel
            const visits = totalOrders * 10;
            const conversionFunnel = [
                { stage: 'Visits', value: visits, percentage: 100 },
                { stage: 'Product Views', value: Math.floor(visits * 0.65), percentage: 65 },
                { stage: 'Add to Cart', value: Math.floor(visits * 0.32), percentage: 32 },
                { stage: 'Checkout', value: Math.floor(visits * 0.18), percentage: 18 },
                { stage: 'Purchase', value: totalOrders, percentage: (totalOrders / visits * 100).toFixed(2) }
            ];
            res.json({
                metrics,
                revenueData,
                trafficSources,
                topProducts,
                conversionFunnel
            });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching analytics" });
        }
    });
    app.get("/api/analytics/stats", authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const [productsResult, ordersResult, postsResult, websites] = await Promise.all([
                storage.getProducts({ limit: 1000, offset: 0 }),
                storage.getOrders(userId, { limit: 1000, offset: 0 }),
                storage.getPosts({ limit: 1000, offset: 0 }),
                storage.getWebsites(userId, {})
            ]);
            const totalRevenue = ordersResult.data
                .filter(o => o.status === 'delivered' || o.status === 'paid')
                .reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
            const activeUsers = await storage.getUsersCount();
            res.json({
                revenue: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                users: activeUsers.toString(),
                orders: ordersResult.data.length.toString(),
                pages: websites.data.length.toString(),
                growth: "+0%",
                activeUsers: Math.floor(activeUsers * 0.3).toString()
            });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching analytics" });
        }
    });
    app.get("/api/analytics/activity", authenticateToken, async (req, res) => {
        try {
            const userId = req.user.id;
            const activities = await storage.getRecentActivity(userId, { limit: 10 });
            res.json({ activities });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching activity" });
        }
    });
    // Forums API Endpoints
    app.get("/api/forums", optionalAuth, async (req, res) => {
        try {
            const { search, limit, offset, categoryId } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 20, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getForums({
                search: search,
                limit: pagination.limit,
                offset: pagination.offset,
                categoryId: categoryId
            });
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching forums");
        }
    });
    app.get("/api/forums/:id", optionalAuth, async (req, res) => {
        try {
            const forum = await storage.getForum(req.params.id);
            if (!forum) {
                return notFoundResponse(res, "Forum not found");
            }
            successResponse(res, { forum });
        }
        catch (error) {
            errorResponse(res, "Error fetching forum");
        }
    });
    app.post("/api/forums", authenticateToken, requireRole(["admin", "moderator"]), async (req, res) => {
        try {
            const forum = await storage.createForum({ ...req.body, createdBy: req.user.id });
            successResponse(res, { forum }, undefined, 201);
        }
        catch (error) {
            errorResponse(res, `Error creating forum: ${error.message}`);
        }
    });
    app.put("/api/forums/:id", authenticateToken, requireRole(["admin", "moderator"]), async (req, res) => {
        try {
            const forum = await storage.updateForum(req.params.id, req.body);
            successResponse(res, { forum });
        }
        catch (error) {
            errorResponse(res, `Error updating forum: ${error.message}`);
        }
    });
    app.get("/api/forums/:id/topics", optionalAuth, async (req, res) => {
        try {
            const { limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 20, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getForumTopics(req.params.id, pagination);
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching forum topics");
        }
    });
    app.post("/api/forums/:id/topics", authenticateToken, async (req, res) => {
        try {
            const topic = await storage.createForumTopic({
                ...req.body,
                forumId: req.params.id,
                userId: req.user.id
            });
            successResponse(res, { topic }, undefined, 201);
        }
        catch (error) {
            errorResponse(res, `Error creating topic: ${error.message}`);
        }
    });
    app.get("/api/forums/topics/:topicId/replies", optionalAuth, async (req, res) => {
        try {
            const { limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 50, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getForumReplies(req.params.topicId, pagination);
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching replies");
        }
    });
    app.post("/api/forums/topics/:topicId/replies", authenticateToken, async (req, res) => {
        try {
            const reply = await storage.createForumReply({
                ...req.body,
                topicId: req.params.topicId,
                userId: req.user.id
            });
            successResponse(res, { reply }, undefined, 201);
        }
        catch (error) {
            errorResponse(res, `Error creating reply: ${error.message}`);
        }
    });
    // Landing Pages API Endpoints
    app.get("/api/landing-pages", authenticateToken, async (req, res) => {
        try {
            const { limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 20, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getLandingPages(req.user.id, pagination);
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching landing pages");
        }
    });
    app.get("/api/landing-pages/:id", authenticateToken, async (req, res) => {
        try {
            const page = await storage.getLandingPage(req.params.id);
            if (!page) {
                return notFoundResponse(res, "Landing page not found");
            }
            successResponse(res, { page });
        }
        catch (error) {
            errorResponse(res, "Error fetching landing page");
        }
    });
    app.post("/api/landing-pages", authenticateToken, async (req, res) => {
        try {
            const page = await storage.createLandingPage({ ...req.body, userId: req.user.id });
            successResponse(res, { page }, undefined, 201);
        }
        catch (error) {
            errorResponse(res, `Error creating landing page: ${error.message}`);
        }
    });
    app.put("/api/landing-pages/:id", authenticateToken, async (req, res) => {
        try {
            const page = await storage.updateLandingPage(req.params.id, req.body);
            successResponse(res, { page });
        }
        catch (error) {
            errorResponse(res, `Error updating landing page: ${error.message}`);
        }
    });
    app.delete("/api/landing-pages/:id", authenticateToken, async (req, res) => {
        try {
            await storage.deleteLandingPage(req.params.id);
            successResponse(res, { message: "Landing page deleted successfully" });
        }
        catch (error) {
            errorResponse(res, `Error deleting landing page: ${error.message}`);
        }
    });
    app.post("/api/landing-pages/:id/publish", authenticateToken, async (req, res) => {
        try {
            const page = await storage.publishLandingPage(req.params.id);
            successResponse(res, { page });
        }
        catch (error) {
            errorResponse(res, `Error publishing landing page: ${error.message}`);
        }
    });
    // Funnels API Endpoints
    app.get("/api/funnels", authenticateToken, async (req, res) => {
        try {
            const { limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 20, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getFunnels(req.user.id, pagination);
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching funnels");
        }
    });
    app.get("/api/funnels/:id", authenticateToken, async (req, res) => {
        try {
            const funnel = await storage.getFunnel(req.params.id);
            if (!funnel) {
                return notFoundResponse(res, "Funnel not found");
            }
            successResponse(res, { funnel });
        }
        catch (error) {
            errorResponse(res, "Error fetching funnel");
        }
    });
    app.post("/api/funnels", authenticateToken, async (req, res) => {
        try {
            const funnel = await storage.createFunnel({ ...req.body, userId: req.user.id });
            successResponse(res, { funnel }, undefined, 201);
        }
        catch (error) {
            errorResponse(res, `Error creating funnel: ${error.message}`);
        }
    });
    app.put("/api/funnels/:id", authenticateToken, async (req, res) => {
        try {
            const funnel = await storage.updateFunnel(req.params.id, req.body);
            successResponse(res, { funnel });
        }
        catch (error) {
            errorResponse(res, `Error updating funnel: ${error.message}`);
        }
    });
    app.get("/api/funnels/:id/entries", authenticateToken, async (req, res) => {
        try {
            const { limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 100, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getFunnelEntries(req.params.id, pagination);
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching funnel entries");
        }
    });
    app.post("/api/funnels/:id/track", async (req, res) => {
        try {
            const entry = await storage.trackFunnelEntry({
                ...req.body,
                funnelId: req.params.id
            });
            successResponse(res, { entry }, undefined, 201);
        }
        catch (error) {
            errorResponse(res, `Error tracking funnel entry: ${error.message}`);
        }
    });
    // Affiliate & Referral API Endpoints
    app.get("/api/affiliates", authenticateToken, requireRole(["admin"]), async (req, res) => {
        try {
            const { status, limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 20, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getAffiliates({
                status: status,
                ...pagination
            });
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching affiliates");
        }
    });
    app.get("/api/affiliates/:id", authenticateToken, async (req, res) => {
        try {
            const affiliate = await storage.getAffiliate(req.params.id);
            if (!affiliate) {
                return notFoundResponse(res, "Affiliate not found");
            }
            successResponse(res, { affiliate });
        }
        catch (error) {
            errorResponse(res, "Error fetching affiliate");
        }
    });
    app.post("/api/affiliates", authenticateToken, async (req, res) => {
        try {
            const affiliate = await storage.createAffiliate({
                ...req.body,
                userId: req.user.id
            });
            successResponse(res, { affiliate }, undefined, 201);
        }
        catch (error) {
            errorResponse(res, `Error creating affiliate: ${error.message}`);
        }
    });
    app.put("/api/affiliates/:id", authenticateToken, async (req, res) => {
        try {
            const affiliate = await storage.updateAffiliate(req.params.id, req.body);
            successResponse(res, { affiliate });
        }
        catch (error) {
            errorResponse(res, `Error updating affiliate: ${error.message}`);
        }
    });
    app.get("/api/affiliates/:id/referrals", authenticateToken, async (req, res) => {
        try {
            const { status, limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 50, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getReferrals(req.params.id, {
                status: status,
                ...pagination
            });
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching referrals");
        }
    });
    app.post("/api/referrals", async (req, res) => {
        try {
            const referral = await storage.createReferral(req.body);
            successResponse(res, { referral }, undefined, 201);
        }
        catch (error) {
            errorResponse(res, `Error creating referral: ${error.message}`);
        }
    });
    // Shipping API Endpoints
    app.get("/api/shipping/providers", authenticateToken, async (req, res) => {
        try {
            const providers = await storage.getShippingProviders();
            successResponse(res, { providers });
        }
        catch (error) {
            errorResponse(res, "Error fetching shipping providers");
        }
    });
    app.post("/api/shipping/providers", authenticateToken, requireRole(["admin"]), async (req, res) => {
        try {
            const provider = await storage.createShippingProvider(req.body);
            successResponse(res, { provider }, undefined, 201);
        }
        catch (error) {
            errorResponse(res, `Error creating shipping provider: ${error.message}`);
        }
    });
    app.get("/api/shipping/providers/:id/rates", authenticateToken, async (req, res) => {
        try {
            const rates = await storage.getShippingRates(req.params.id);
            successResponse(res, { rates });
        }
        catch (error) {
            errorResponse(res, "Error fetching shipping rates");
        }
    });
    app.post("/api/shipping/calculate", async (req, res) => {
        try {
            const { address, weight } = req.body;
            const rate = await storage.calculateShipping(address, weight);
            successResponse(res, { rate });
        }
        catch (error) {
            errorResponse(res, `Error calculating shipping: ${error.message}`);
        }
    });
    // RSS Feed API Endpoints
    app.get("/api/rss-feeds", authenticateToken, async (req, res) => {
        try {
            const feeds = await storage.getRssFeeds(req.user.id);
            successResponse(res, { feeds });
        }
        catch (error) {
            errorResponse(res, "Error fetching RSS feeds");
        }
    });
    app.post("/api/rss-feeds", authenticateToken, async (req, res) => {
        try {
            const feed = await storage.createRssFeed({ ...req.body, userId: req.user.id });
            successResponse(res, { feed }, undefined, 201);
        }
        catch (error) {
            errorResponse(res, `Error creating RSS feed: ${error.message}`);
        }
    });
    app.put("/api/rss-feeds/:id", authenticateToken, async (req, res) => {
        try {
            const feed = await storage.updateRssFeed(req.params.id, req.body);
            successResponse(res, { feed });
        }
        catch (error) {
            errorResponse(res, `Error updating RSS feed: ${error.message}`);
        }
    });
    app.delete("/api/rss-feeds/:id", authenticateToken, async (req, res) => {
        try {
            await storage.deleteRssFeed(req.params.id);
            successResponse(res, { message: "RSS feed deleted successfully" });
        }
        catch (error) {
            errorResponse(res, `Error deleting RSS feed: ${error.message}`);
        }
    });
    // A/B Testing API Endpoints
    app.get("/api/ab-tests", authenticateToken, async (req, res) => {
        try {
            const { status, limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 20, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getAbTests(req.user.id, {
                status: status,
                ...pagination
            });
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching A/B tests");
        }
    });
    app.get("/api/ab-tests/:id", authenticateToken, async (req, res) => {
        try {
            const test = await storage.getAbTest(req.params.id);
            if (!test) {
                return notFoundResponse(res, "A/B test not found");
            }
            successResponse(res, { test });
        }
        catch (error) {
            errorResponse(res, "Error fetching A/B test");
        }
    });
    app.post("/api/ab-tests", authenticateToken, async (req, res) => {
        try {
            const test = await storage.createAbTest({ ...req.body, userId: req.user.id });
            successResponse(res, { test }, undefined, 201);
        }
        catch (error) {
            errorResponse(res, `Error creating A/B test: ${error.message}`);
        }
    });
    app.put("/api/ab-tests/:id", authenticateToken, async (req, res) => {
        try {
            const test = await storage.updateAbTest(req.params.id, req.body);
            successResponse(res, { test });
        }
        catch (error) {
            errorResponse(res, `Error updating A/B test: ${error.message}`);
        }
    });
    app.post("/api/ab-tests/:id/participate", async (req, res) => {
        try {
            const participant = await storage.trackAbTestParticipant({
                ...req.body,
                testId: req.params.id
            });
            successResponse(res, { participant }, undefined, 201);
        }
        catch (error) {
            errorResponse(res, `Error tracking participation: ${error.message}`);
        }
    });
    app.get("/api/ab-tests/:id/results", authenticateToken, async (req, res) => {
        try {
            const results = await storage.getAbTestResults(req.params.id);
            successResponse(res, { results });
        }
        catch (error) {
            errorResponse(res, "Error fetching test results");
        }
    });
    // Website Templates API Endpoints
    app.get("/api/templates", optionalAuth, async (req, res) => {
        try {
            const { category, search, limit, offset } = req.query;
            const pagination = calculatePagination(parseInt(limit) || 20, parseInt(offset) || 0);
            const { data, totalCount } = await storage.getTemplates({
                category: category,
                search: search,
                ...pagination
            });
            paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
        }
        catch (error) {
            errorResponse(res, "Error fetching templates");
        }
    });
    app.get("/api/templates/:id", optionalAuth, async (req, res) => {
        try {
            const template = await storage.getTemplate(req.params.id);
            if (!template) {
                return notFoundResponse(res, "Template not found");
            }
            successResponse(res, { template });
        }
        catch (error) {
            errorResponse(res, "Error fetching template");
        }
    });
    app.post("/api/templates", authenticateToken, requireRole(["admin", "moderator"]), async (req, res) => {
        try {
            const template = await storage.createTemplate({ ...req.body, createdBy: req.user.id });
            successResponse(res, { template }, undefined, 201);
        }
        catch (error) {
            errorResponse(res, `Error creating template: ${error.message}`);
        }
    });
    app.put("/api/templates/:id", authenticateToken, requireRole(["admin", "moderator"]), async (req, res) => {
        try {
            const template = await storage.updateTemplate(req.params.id, req.body);
            successResponse(res, { template });
        }
        catch (error) {
            errorResponse(res, `Error updating template: ${error.message}`);
        }
    });
    app.post("/api/templates/:id/use", authenticateToken, async (req, res) => {
        try {
            await storage.incrementTemplateUsage(req.params.id);
            successResponse(res, { message: "Template usage recorded" });
        }
        catch (error) {
            errorResponse(res, `Error recording template usage: ${error.message}`);
        }
    });
    // Error Reporting Endpoint for Frontend Error Boundary
    app.post("/api/errors/report", async (req, res) => {
        try {
            const { error, errorInfo, url, userAgent, timestamp } = req.body;
            // Log the error
            logger.error('Frontend error reported', new Error(error), {
                componentStack: errorInfo,
                url,
                userAgent,
                timestamp,
                ip: req.ip
            });
            // Store in audit logs if user is authenticated
            if (req.user?.id) {
                await storage.createAuditLog({
                    userId: req.user.id,
                    action: 'frontend_error',
                    resource: 'ui',
                    resourceId: url,
                    details: { error, errorInfo, userAgent },
                    ipAddress: req.ip,
                    userAgent,
                    success: false
                });
            }
            successResponse(res, { message: "Error reported successfully" });
        }
        catch (error) {
            logger.error('Failed to report frontend error', error);
            errorResponse(res, "Failed to report error");
        }
    });
    app.use('/api/password-reset', emailVerificationRouter);
    app.use('/api/admin', adminRouter);
    app.use('/api', healthRouter);
    // PHASE 1 - ISSUE #17: Secure metrics endpoint with authentication
    // MEDIUM FIX #14: Add circuit breaker state to metrics
    app.get('/metrics', async (req, res) => {
        const authHeader = req.headers.authorization;
        const apiKey = req.headers['x-api-key'];
        // Check for API key authentication
        if (apiKey) {
            const validApiKey = process.env.METRICS_API_KEY;
            if (!validApiKey || apiKey !== validApiKey) {
                res.status(401).json({ error: 'Invalid API key' });
                return;
            }
        }
        // Check for Bearer token authentication (admin role)
        else if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const verification = verifyToken(token);
            if (!verification) {
                res.status(401).json({ error: 'Invalid token' });
                return;
            }
            const user = await storage.getUser(verification.userId);
            if (!user || user.role !== 'admin') {
                res.status(403).json({ error: 'Admin access required' });
                return;
            }
        }
        // No authentication provided
        else {
            res.status(401).json({ error: 'Authentication required. Provide X-API-Key header or Bearer token with admin role.' });
            return;
        }
        // Add circuit breaker metrics
        const { dbCircuitBreaker } = await import("./db");
        const cbStats = dbCircuitBreaker.getStats();
        res.set('Content-Type', metricsRegister.contentType);
        const metrics = await metricsRegister.metrics();
        const circuitBreakerMetrics = `
# HELP circuit_breaker_state Database circuit breaker state (0=CLOSED, 1=HALF_OPEN, 2=OPEN)
# TYPE circuit_breaker_state gauge
circuit_breaker_state{service="database"} ${cbStats.state === 'CLOSED' ? 0 : cbStats.state === 'HALF_OPEN' ? 1 : 2}

# HELP circuit_breaker_failures Current circuit breaker failure count
# TYPE circuit_breaker_failures gauge
circuit_breaker_failures{service="database"} ${cbStats.failures}

# HELP circuit_breaker_threshold Circuit breaker failure threshold
# TYPE circuit_breaker_threshold gauge
circuit_breaker_threshold{service="database"} ${cbStats.threshold}
`;
        res.end(metrics + circuitBreakerMetrics);
    });
    // Legacy health check endpoint - REMOVED
    // Now using health-enhanced router (/api/health, /api/ready, /api/live)
    // which provides comprehensive K8s-ready health checks without blocking rate limiters
    const httpServer = createServer(app);
    setupWebSocket(httpServer);
    return httpServer;
}
