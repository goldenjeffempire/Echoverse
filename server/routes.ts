import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { 
  register, 
  login, 
  logout, 
  getCurrentUser, 
  authenticateToken, 
  optionalAuth, 
  requireRole,
  refreshTokens,
  hashPassword,
  verifyPassword,
  invalidateAllUserSessions,
  generate2FASecret,
  verify2FAToken,
  generateQRCode,
  generate2FABackupCodes,
  hashBackupCodes,
  createSession,
  type AuthenticatedRequest 
} from "./auth";
import { type User } from "@shared/schema";
import {
  generateWebsiteContent,
  generateBlogPost,
  generateMarketingContent,
  optimizeForSEO,
  generateChatbotResponse,
  analyzeContent,
  generateCompleteWebsite,
  generateWebComponent,
  generateWebsiteTemplate,
  enhanceWebsiteContent
} from "./ai";
import { setupWebSocket } from "./websocket";
import { slugify } from "./utils/slugify";
import { AIServiceError } from "./utils/errors";
import { logger } from "./logger";
import multer from 'multer';
import express from 'express';
import { uploadSingle, uploadMultiple, uploadImage, UPLOAD_DIR, verifyFileType } from "./middleware/upload";
import { basicVirusScan } from "./middleware/virus-scan";
import { 
  successResponse, 
  paginatedResponse, 
  errorResponse, 
  notFoundResponse, 
  unauthorizedResponse, 
  forbiddenResponse, 
  validationErrorResponse,
  calculatePagination 
} from "./utils/apiResponse";
import { 
  passwordResetRateLimiter,
  twoFactorVerifyRateLimiter,
  twoFactorSetupRateLimiter,
  loginRateLimiter,
  registrationRateLimiter,
  emailVerificationRateLimiter,
  accountDeletionRateLimiter,
  passwordChangeRateLimiter,
  fileUploadRateLimiter,
  tokenRefreshRateLimiter,
  webhookRateLimiter,
  healthCheckRateLimiter,
  staticAssetRateLimiter
} from "./middleware/rate-limit-enhanced";
import { 
  isPasswordReused, 
  addPasswordToHistory 
} from "./auth-enhanced";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint (with permissive rate limiting for monitoring)
  app.get("/api/health", healthCheckRateLimiter, async (req, res) => {
    const { checkDatabaseHealth, getDatabaseStats } = await import("./db");
    const { queryMonitor } = await import("./middleware/query-monitor");
    const dbHealth = await checkDatabaseHealth();
    const dbStats = getDatabaseStats();
    const queryMetrics = queryMonitor.getMetrics();
    
    const health = {
      status: dbHealth.healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        healthy: dbHealth.healthy,
        latency: dbHealth.latency,
        error: dbHealth.error,
        pool: {
          total: dbStats.totalConnections,
          idle: dbStats.idleConnections,
          waiting: dbStats.waitingClients,
          max: dbStats.poolMax,
        },
        queries: {
          total: queryMetrics.totalQueries,
          slow: queryMetrics.slowQueries,
          failed: queryMetrics.failedQueries,
          averageTime: Math.round(queryMetrics.averageQueryTime),
        }
      }
    };
    
    res.status(dbHealth.healthy ? 200 : 503).json(health);
  });

  // CSRF token bootstrap endpoint - ensures cookie is set before SPA makes state-changing requests
  app.get("/api/csrf-token", (req, res) => {
    const csrfToken = req.cookies?.['XSRF-TOKEN'];
    res.json({ token: csrfToken || 'Cookie will be set on next request' });
  });

  // Query monitoring endpoint (admin only)
  app.get("/api/admin/query-metrics", authenticateToken, async (req: AuthenticatedRequest, res) => {
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

  // Authentication routes with rate limiting
  app.post("/api/auth/register", registrationRateLimiter, register);
  app.post("/api/auth/login", loginRateLimiter, login);
  app.post("/api/auth/logout", authenticateToken, logout);
  app.post("/api/auth/refresh", tokenRefreshRateLimiter, refreshTokens); // CRITICAL: Rate limit token refresh
  app.get("/api/auth/me", authenticateToken, getCurrentUser);
  
  // Logout from all devices (invalidate all sessions except current)
  app.post("/api/auth/logout-all", authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { terminateAllUserSessions } = await import("./utils/session-manager");
    try {
      const keepCurrent = req.body.keepCurrent !== false; // Default to keeping current session
      const sessionId = req.sessionId;
      const count = await terminateAllUserSessions(req.user!.id, keepCurrent ? sessionId : undefined);
      return successResponse(res, { 
        message: keepCurrent ? 'Logged out of all other devices' : 'Logged out of all devices',
        sessionsTerminated: count 
      });
    } catch (error) {
      logger.error('Logout all devices failed', error instanceof Error ? error : undefined);
      return errorResponse(res, 'Failed to logout from all devices', 500);
    }
  });
  
  // User Profile Management
  app.put("/api/users/profile", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { firstName, lastName, avatar } = req.body;
      const updates: Partial<User> = {};
      
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (avatar !== undefined) updates.avatar = avatar;
      
      const updatedUser = await storage.updateUser(req.user!.id, updates);
      
      if (!updatedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Error updating profile" });
    }
  });

  // Password Reset Request with rate limiting
  app.post("/api/auth/request-password-reset", passwordResetRateLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (user) {
        // Store token in database with expiry and get the generated token
        const { createPasswordResetToken } = await import('./auth-enhanced');
        const ipAddress = req.ip || 'unknown';
        const userAgent = req.get('user-agent') || 'unknown';
        const resetToken = await createPasswordResetToken(user.id, ipAddress, userAgent);
        
        // Send password reset email
        const { sendPasswordResetEmail } = await import('./services/email');
        await sendPasswordResetEmail(email, resetToken);
        
        logger.info('Password reset requested', { userId: user.id, email });
      }
      
      // Always return same message for security (prevents user enumeration)
      res.json({ 
        message: "If an account exists with this email, a password reset link will be sent to your email address." 
      });
    } catch (error) {
      logger.error('Password reset request failed', error instanceof Error ? error : undefined);
      res.status(500).json({ message: "Error processing request" });
    }
  });
  
  // Change Password (authenticated) with password history check
  app.post("/api/auth/change-password", authenticateToken, passwordChangeRateLimiter, async (req: AuthenticatedRequest, res) => {
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
      
      const user = await storage.getUser(req.user!.id);
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
      
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashedPassword });
      
      // Add old password to history
      await addPasswordToHistory(user.id, user.password);
      
      await invalidateAllUserSessions(user.id);
      
      logger.info('Password changed successfully', { userId: user.id });
      res.json({ message: "Password changed successfully. Please log in again." });
    } catch (error) {
      logger.error('Password change failed', error instanceof Error ? error : undefined);
      res.status(500).json({ message: "Error changing password" });
    }
  });

  // Reset Password (with token from email) with password history check
  app.post("/api/auth/reset-password", passwordResetRateLimiter, async (req, res) => {
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
      
      // Validate password reset token
      const { validatePasswordResetToken, markTokenAsUsed } = await import('./auth-enhanced');
      const validation = await validatePasswordResetToken(token);
      
      if (!validation.valid) {
        res.status(400).json({ message: validation.error || "Invalid or expired token" });
        return;
      }
      
      // Check if password was used recently
      const isReused = await isPasswordReused(validation.userId!, newPassword);
      if (isReused) {
        res.status(400).json({ message: "Cannot reuse a recent password. Please choose a different password." });
        return;
      }
      
      // Get current password for history
      const user = await storage.getUser(validation.userId!);
      if (user) {
        // Add current password to history before changing
        await addPasswordToHistory(user.id, user.password);
      }
      
      // Update user password
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(validation.userId!, { password: hashedPassword });
      
      // Mark token as used
      await markTokenAsUsed(token);
      
      // Invalidate all user sessions for security
      await invalidateAllUserSessions(validation.userId!);
      
      logger.info('Password reset successful', { userId: validation.userId });
      res.json({ message: "Password reset successfully. Please log in with your new password." });
    } catch (error) {
      logger.error('Password reset failed', error instanceof Error ? error : undefined);
      res.status(500).json({ message: "Error resetting password" });
    }
  });

  // 2FA Setup - Generate secret and QR code with rate limiting
  app.post("/api/auth/2fa/setup", authenticateToken, twoFactorSetupRateLimiter, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      
      if (user.twoFactorEnabled) {
        res.status(400).json({ message: "2FA is already enabled" });
        return;
      }
      
      const { secret, otpauthUrl } = generate2FASecret(user.username);
      const qrCode = await generateQRCode(otpauthUrl);
      
      res.json({ secret, qrCode, otpauthUrl });
    } catch (error) {
      res.status(500).json({ message: "Error setting up 2FA" });
    }
  });

  // 2FA Enable - Verify token and save secret with rate limiting
  app.post("/api/auth/2fa/enable", authenticateToken, twoFactorVerifyRateLimiter, async (req: AuthenticatedRequest, res) => {
    try {
      const { secret, token } = req.body;
      
      if (!secret || !token) {
        res.status(400).json({ message: "Secret and token are required" });
        return;
      }
      
      const isValid = verify2FAToken(secret, token);
      if (!isValid) {
        res.status(401).json({ message: "Invalid verification token" });
        return;
      }
      
      const backupCodes = generate2FABackupCodes(8);
      const hashedBackupCodes = await hashBackupCodes(backupCodes);
      
      await storage.updateUser(req.user!.id, {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: hashedBackupCodes
      });
      
      res.json({ 
        message: "2FA enabled successfully",
        backupCodes: backupCodes
      });
    } catch (error) {
      res.status(500).json({ message: "Error enabling 2FA" });
    }
  });

  // 2FA Disable - Verify token and disable with rate limiting
  app.post("/api/auth/2fa/disable", authenticateToken, twoFactorVerifyRateLimiter, async (req: AuthenticatedRequest, res) => {
    try {
      const { token } = req.body;
      const user = req.user!;
      
      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        res.status(400).json({ message: "2FA is not enabled" });
        return;
      }
      
      if (!token) {
        res.status(400).json({ message: "Verification token is required" });
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
    } catch (error) {
      res.status(500).json({ message: "Error disabling 2FA" });
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
      } else {
        res.status(400).json({ message: result.error || "Email verification failed" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error verifying email" });
    }
  });

  // Email Verification - Resend verification email with rate limiting
  app.post("/api/auth/resend-verification", authenticateToken, emailVerificationRateLimiter, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;

      if (user.isEmailVerified) {
        res.status(400).json({ message: "Email is already verified" });
        return;
      }

      const { resendVerificationEmail } = await import("./services/email-verification");
      const result = await resendVerificationEmail(user.id, user.email, req.ip, req.get('user-agent'));

      if (result.success) {
        res.json({ message: "Verification email sent successfully" });
      } else {
        res.status(400).json({ message: result.error || "Failed to send verification email" });
      }
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: "OAuth authentication failed" });
    }
  });

  // GDPR - Data Export
  app.get("/api/gdpr/export", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      const { password: _, twoFactorSecret: __, ...safeUser } = req.user!;
      
      const [
        userWebsites,
        userProducts,
        userOrdersResult,
        userPostsResult,
        userCommunitiesResult,
        userCampaigns
      ] = await Promise.all([
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
    } catch (error) {
      res.status(500).json({ message: "Error exporting data" });
    }
  });

  // GDPR - Account Deletion with rate limiting
  app.delete("/api/gdpr/delete-account", authenticateToken, accountDeletionRateLimiter, async (req: AuthenticatedRequest, res) => {
    try {
      const { password, confirmation } = req.body;
      
      if (!password || confirmation !== "DELETE") {
        res.status(400).json({ 
          message: "Password and confirmation (type 'DELETE') are required" 
        });
        return;
      }
      
      const user = await storage.getUser(req.user!.id);
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
    } catch (error) {
      res.status(500).json({ message: "Error deleting account" });
    }
  });

  // Stripe payment route for one-time payments
  app.post("/api/create-payment-intent", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: req.user!.id,
        },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Subscription endpoint
  app.post('/api/get-or-create-subscription', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const user = req.user!;

    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        try {
          res.send({
            subscriptionId: subscription.id,
            status: subscription.status,
          });
        } catch (error) {
          console.error('Error retrieving subscription:', error);
          res.status(500).json({ message: 'Error retrieving subscription details' });
          return;
        }
        return;
      } catch (error) {
        console.error('Error retrieving subscription:', error);
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
      } else {
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
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  // Stripe webhook handler - uses raw body parser configured in server/index.ts
  app.post('/api/webhooks/stripe', webhookRateLimiter, async (req, res) => {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logger.error('STRIPE_WEBHOOK_SECRET is not configured. Rejecting webhook.');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    const sig = req.headers['stripe-signature'];
    if (!sig) {
      logger.error('Missing stripe-signature header');
      return res.status(400).json({ error: 'Missing signature' });
    }

    let event;
    try {
      // req.body is a raw Buffer because of express.raw middleware
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      logger.error('Webhook signature verification failed', err instanceof Error ? err : undefined);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const { checkWebhookReplayProtection, markWebhookProcessed } = await import('./utils/webhook');
    const { auditPaymentAction } = await import('./utils/audit');
    
    const isUnique = await checkWebhookReplayProtection(event.id, event.type, event);
    if (!isUnique) {
      logger.warn('Duplicate webhook event - already processed', { eventId: event.id, type: event.type });
      return res.json({ received: true, status: 'duplicate' });
    }

    let processingError: string | undefined;
    
    try {
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.created':
          const subscription = event.data.object as Stripe.Subscription;
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
              
              await auditPaymentAction(
                user.id,
                event.type === 'customer.subscription.created' ? 'payment_succeeded' : 'payment_succeeded',
                subscription.id,
                { status: subscription.status, tier: subscription.status === 'active' ? 'pro' : 'free' }
              );
              
              logger.info('Subscription updated', { userId: user.id, status: subscription.status, subscriptionId: subscription.id });
            }
          }
          break;
          
        case 'customer.subscription.deleted':
          const deletedSub = event.data.object as Stripe.Subscription;
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
          const invoice = event.data.object as Stripe.Invoice;
          logger.info('Invoice payment succeeded', { invoiceId: invoice.id, amount: invoice.amount_paid });
          break;
          
        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as Stripe.Invoice;
          logger.error('Invoice payment failed', new Error('Payment failed'), { invoiceId: failedInvoice.id });
          break;

        case 'payment_intent.succeeded':
          const succeededIntent = event.data.object as Stripe.PaymentIntent;
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
          const failedIntent = event.data.object as Stripe.PaymentIntent;
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
          const refundedCharge = event.data.object as Stripe.Charge;
          logger.info('Charge refunded', { chargeId: refundedCharge.id, amount: refundedCharge.amount_refunded });
          break;
          
        default:
          logger.debug('Unhandled webhook event type', { type: event.type });
      }
      
      await markWebhookProcessed(event.id);
    } catch (error: any) {
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

  // AI Content Generation Endpoints
  app.post("/api/ai/generate-website", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { prompt, type = 'landing' } = req.body;
      const content = await generateWebsiteContent(prompt, type);
      res.json(content);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/generate-blog", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { topic, tone = 'professional', length = 'medium' } = req.body;
      const content = await generateBlogPost(topic, tone, length);
      res.json(content);
    } catch (error: any) {
      if (error instanceof AIServiceError) {
        res.status(error.statusCode).json({ message: error.message, code: error.code });
        return;
      }
      res.status(500).json({ message: "Failed to generate blog post" });
    }
  });

  app.post("/api/ai/generate-marketing", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { campaign, type } = req.body;
      const content = await generateMarketingContent(campaign, type);
      res.json(content);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/optimize-seo", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { content, keywords } = req.body;
      const optimized = await optimizeForSEO(content, keywords);
      res.json(optimized);
    } catch (error: any) {
      if (error instanceof AIServiceError) {
        res.status(error.statusCode).json({ message: error.message, code: error.code });
        return;
      }
      res.status(500).json({ message: "Failed to optimize content for SEO" });
    }
  });

  app.post("/api/ai/chatbot", async (req, res) => {
    try {
      const { message, context = '' } = req.body;
      const response = await generateChatbotResponse(message, context);
      res.json({ response });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/analyze-content", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { content } = req.body;
      const analysis = await analyzeContent(content);
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // AI Website Builder - Complete Website Generation
  app.post("/api/ai/generate-complete-website", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { description, businessType, style = 'modern', pages = ['home', 'about', 'contact'], colorScheme, features } = req.body;
      
      if (!description || !businessType) {
        res.status(400).json({ message: "Description and business type are required" });
        return;
      }
      
      const website = await generateCompleteWebsite({
        description,
        businessType,
        style,
        pages,
        colorScheme,
        features
      });
      
      res.json({ website });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/generate-component", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { type, description, style = 'modern', content } = req.body;
      
      if (!type || !description) {
        res.status(400).json({ message: "Component type and description are required" });
        return;
      }
      
      const component = await generateWebComponent({
        type,
        description,
        style,
        content
      });
      
      res.json({ component });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/generate-template", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { industry, style = 'modern', features = [] } = req.body;
      
      if (!industry) {
        res.status(400).json({ message: "Industry is required" });
        return;
      }
      
      const template = await generateWebsiteTemplate({
        industry,
        style,
        features
      });
      
      res.json({ template });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/enhance-content", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { content, enhancement = 'readability', target = 'general audience' } = req.body;
      
      if (!content) {
        res.status(400).json({ message: "Content is required" });
        return;
      }
      
      const enhanced = await enhanceWebsiteContent({
        content,
        enhancement,
        target
      });
      
      res.json(enhanced);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // RBAC Protected Routes
  app.get("/api/admin/users", authenticateToken, requireRole(["admin"]), async (req, res) => {
    // Get all users (admin only)
    try {
      const users = await storage.getAllUsers();
      res.json({ users: users.map(u => ({ ...u, password: undefined })) });
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  app.delete("/api/admin/users/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
    // Delete user (admin only)
    try {
      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: "Error updating user role" });
    }
  });
  
  // Moderator routes
  app.get("/api/moderate/content", authenticateToken, requireRole(["admin", "moderator"]), async (req, res) => {
    res.json({ message: "Content moderation access granted" });
  });
  
  // Pro subscription required routes
  app.post("/api/ai/advanced-generation", authenticateToken, async (req: AuthenticatedRequest, res) => {
    if (!['pro', 'enterprise'].includes(req.user!.subscriptionTier || 'free')) {
      res.status(403).json({ message: "Pro subscription required" });
      return;
    }
    // Advanced AI generation logic here
    res.json({ message: "Advanced AI generation available" });
  });

  // E-Commerce Product Management
  app.get("/api/products", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { category, search, limit = 20, offset = 0 } = req.query;
      const pagination = calculatePagination(
        parseInt(limit as string),
        parseInt(offset as string)
      );

      const result = await storage.getProducts({
        category: category as string,
        search: search as string,
        limit: pagination.limit,
        offset: pagination.offset
      });

      paginatedResponse(res, result.data, {
        limit: pagination.limit,
        offset: pagination.offset,
        totalCount: result.totalCount
      });
    } catch (error) {
      errorResponse(res, "Error fetching products");
    }
  });

  app.get("/api/products/:id", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      res.json({ product });
    } catch (error) {
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  app.post("/api/products", authenticateToken, requireRole(["admin", "moderator"]), async (req: AuthenticatedRequest, res) => {
    try {
      const productData = req.body;
      const product = await storage.createProduct({
        ...productData,
        userId: req.user!.id
      });
      res.status(201).json({ product });
    } catch (error: any) {
      res.status(400).json({ message: `Error creating product: ${error.message}` });
    }
  });

  app.put("/api/products/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      
      // Check ownership or admin role
      if (product.userId !== req.user!.id && !['admin', 'moderator'].includes(req.user!.role)) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      
      const updatedProduct = await storage.updateProduct(req.params.id, req.body);
      res.json({ product: updatedProduct });
    } catch (error: any) {
      res.status(400).json({ message: `Error updating product: ${error.message}` });
    }
  });

  app.delete("/api/products/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      
      // Check ownership or admin role
      if (product.userId !== req.user!.id && !['admin', 'moderator'].includes(req.user!.role)) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      
      await storage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting product" });
    }
  });

  // File Upload Endpoints
  app.post("/api/upload/image", authenticateToken, (req: AuthenticatedRequest, res) => {
    uploadImage(req, res, (err) => {
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

  app.post("/api/upload/file", authenticateToken, (req: AuthenticatedRequest, res) => {
    uploadSingle(req, res, (err) => {
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

  app.post("/api/upload/multiple", authenticateToken, (req: AuthenticatedRequest, res) => {
    uploadMultiple(req, res, (err) => {
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

      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return errorResponse(res, 'No files uploaded', 400, 'NO_FILES');
      }

      const files = (req.files as Express.Multer.File[]).map(file => ({
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
  app.get("/api/orders", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { status, limit, offset } = req.query;
      const pagination = calculatePagination(
        parseInt(limit as string) || 20, 
        parseInt(offset as string) || 0
      );
      
      const { data, totalCount } = await storage.getOrders(req.user!.id, {
        status: status as string,
        limit: pagination.limit,
        offset: pagination.offset
      });
      
      paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
    } catch (error) {
      errorResponse(res, "Error fetching orders");
    }
  });

  app.get("/api/orders/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      
      // Check ownership or admin role
      if (order.userId !== req.user!.id && !['admin', 'moderator'].includes(req.user!.role)) {
        res.status(403).json({ message: "Unauthorized" });
        return;
      }
      
      res.json({ order });
    } catch (error) {
      res.status(500).json({ message: "Error fetching order" });
    }
  });

  app.post("/api/orders", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { items, shippingAddress, paymentMethodId } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        validationErrorResponse(res, [{ field: 'items', message: 'Order items are required' }]);
        return;
      }
      
      let totalAmount = 0;
      const orderItems = [];
      
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          errorResponse(res, `Product not found: ${item.productId}`, 400, 'PRODUCT_NOT_FOUND');
          return;
        }
        
        const itemTotal = parseFloat(product.price) * item.quantity;
        totalAmount += itemTotal;
        
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: parseFloat(product.price),
          total: itemTotal
        });
      }
      
      const userEmail = req.user!.email || 'user@example.com';
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: "usd",
        payment_method: paymentMethodId,
        confirm: false,
        capture_method: 'automatic',
        return_url: `${process.env.REPLIT_DEV_DOMAIN}/orders`,
        metadata: {
          userId: req.user!.id,
        },
      });

      let order;
      try {
        order = await storage.createOrderWithInventoryCheck({
          userId: req.user!.id,
          customerEmail: userEmail,
          items: orderItems,
          total: totalAmount,
          shippingAddress,
          stripePaymentIntentId: paymentIntent.id,
          status: 'pending'
        });

        let confirmedIntent;
        try {
          confirmedIntent = await stripe.paymentIntents.confirm(paymentIntent.id);
        } catch (paymentError) {
          await storage.restoreInventory(order.id);
          await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => {});
          throw paymentError;
        }

        if (confirmedIntent.status === 'succeeded') {
          await storage.updateOrderStatus(order.id, 'confirmed');
          order.status = 'confirmed';
        } else if (confirmedIntent.status === 'requires_action') {
          order.status = 'pending';
        } else {
          await storage.restoreInventory(order.id);
          await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => {});
          errorResponse(
            res, 
            `Payment failed with status: ${confirmedIntent.status}`, 
            400, 
            'PAYMENT_FAILED',
            { status: confirmedIntent.status }
          );
          return;
        }

      } catch (inventoryError: any) {
        try {
          await stripe.paymentIntents.cancel(paymentIntent.id);
        } catch (cancelError) {
          console.error('Failed to cancel payment intent:', cancelError);
        }
        
        throw inventoryError;
      }
      
      successResponse(res, { order, clientSecret: paymentIntent.client_secret }, 'Order created successfully', 201);
    } catch (error: any) {
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

  app.put("/api/orders/:id/status", authenticateToken, requireRole(["admin", "moderator"]), async (req: AuthenticatedRequest, res) => {
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
    } catch (error: any) {
      console.error('Error updating order status:', error);
      errorResponse(res, `Failed to update order status: ${error.message}`, 400, 'ORDER_UPDATE_FAILED');
    }
  });

  // Website Builder CRUD
  app.get("/api/websites", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.query;
      const websites = await storage.getWebsites(req.user!.id, { status });
      res.json({ websites });
    } catch (error) {
      res.status(500).json({ message: "Error fetching websites" });
    }
  });

  app.get("/api/websites/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const website = await storage.getWebsite(req.params.id);
      if (!website || website.userId !== req.user!.id) {
        res.status(404).json({ message: "Website not found" });
        return;
      }
      res.json({ website });
    } catch (error) {
      res.status(500).json({ message: "Error fetching website" });
    }
  });

  app.post("/api/websites", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const website = await storage.createWebsite({ ...req.body, userId: req.user!.id });
      res.status(201).json({ website });
    } catch (error: any) {
      res.status(400).json({ message: `Error creating website: ${error.message}` });
    }
  });

  app.put("/api/websites/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const website = await storage.getWebsite(req.params.id);
      if (!website || website.userId !== req.user!.id) {
        res.status(404).json({ message: "Website not found" });
        return;
      }
      const updated = await storage.updateWebsite(req.params.id, req.body);
      res.json({ website: updated });
    } catch (error: any) {
      res.status(400).json({ message: `Error updating website: ${error.message}` });
    }
  });

  app.delete("/api/websites/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const website = await storage.getWebsite(req.params.id);
      if (!website || website.userId !== req.user!.id) {
        res.status(404).json({ message: "Website not found" });
        return;
      }
      await storage.deleteWebsite(req.params.id);
      res.json({ message: "Website deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting website" });
    }
  });

  app.post("/api/websites/:id/publish", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const website = await storage.getWebsite(req.params.id);
      if (!website || website.userId !== req.user!.id) {
        res.status(404).json({ message: "Website not found" });
        return;
      }
      const published = await storage.publishWebsite(req.params.id);
      res.json({ website: published });
    } catch (error: any) {
      res.status(400).json({ message: `Error publishing website: ${error.message}` });
    }
  });

  app.get("/api/websites/:id/versions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const website = await storage.getWebsite(req.params.id);
      if (!website || website.userId !== req.user!.id) {
        res.status(404).json({ message: "Website not found" });
        return;
      }
      const versions = await storage.getWebsiteVersions(req.params.id);
      res.json({ versions });
    } catch (error) {
      res.status(500).json({ message: "Error fetching versions" });
    }
  });

  // Blog/CMS Posts CRUD
  app.get("/api/posts", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, status, type, search, limit, offset } = req.query;
      const pagination = calculatePagination(
        parseInt(limit as string) || 20, 
        parseInt(offset as string) || 0
      );
      
      const { data, totalCount } = await storage.getPosts({
        userId: userId as string,
        status: status as string,
        type: type as string,
        search: search as string,
        limit: pagination.limit,
        offset: pagination.offset
      });
      
      paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
    } catch (error) {
      errorResponse(res, "Error fetching posts");
    }
  });

  app.get("/api/posts/:id", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        res.status(404).json({ message: "Post not found" });
        return;
      }
      res.json({ post });
    } catch (error) {
      res.status(500).json({ message: "Error fetching post" });
    }
  });

  app.get("/api/posts/slug/:slug", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const post = await storage.getPostBySlug(req.params.slug);
      if (!post) {
        res.status(404).json({ message: "Post not found" });
        return;
      }
      res.json({ post });
    } catch (error) {
      res.status(500).json({ message: "Error fetching post" });
    }
  });

  app.post("/api/posts", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const postData = { ...req.body, userId: req.user!.id };
      
      if (!postData.slug && postData.title) {
        const baseSlug = slugify(postData.title);
        postData.slug = `${baseSlug}-${Date.now()}`;
      }
      
      const post = await storage.createPost(postData);
      res.status(201).json({ post });
    } catch (error: any) {
      res.status(400).json({ message: `Error creating post: ${error.message}` });
    }
  });

  app.put("/api/posts/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post || post.userId !== req.user!.id) {
        res.status(404).json({ message: "Post not found" });
        return;
      }
      const updated = await storage.updatePost(req.params.id, req.body);
      res.json({ post: updated });
    } catch (error: any) {
      res.status(400).json({ message: `Error updating post: ${error.message}` });
    }
  });

  app.delete("/api/posts/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post || post.userId !== req.user!.id) {
        res.status(404).json({ message: "Post not found" });
        return;
      }
      await storage.deletePost(req.params.id);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting post" });
    }
  });

  app.post("/api/posts/:id/publish", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post || post.userId !== req.user!.id) {
        res.status(404).json({ message: "Post not found" });
        return;
      }
      const published = await storage.publishPost(req.params.id);
      res.json({ post: published });
    } catch (error: any) {
      res.status(400).json({ message: `Error publishing post: ${error.message}` });
    }
  });

  // Comments
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const comments = await storage.getComments(req.params.postId);
      res.json({ comments });
    } catch (error) {
      res.status(500).json({ message: "Error fetching comments" });
    }
  });

  app.post("/api/posts/:postId/comments", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const comment = await storage.createComment({
        postId: req.params.postId,
        userId: req.user?.id,
        ...req.body
      });
      res.status(201).json({ comment });
    } catch (error: any) {
      res.status(400).json({ message: `Error creating comment: ${error.message}` });
    }
  });

  app.put("/api/comments/:id/status", authenticateToken, requireRole(["admin", "moderator"]), async (req, res) => {
    try {
      const { status } = req.body;
      const comment = await storage.updateCommentStatus(req.params.id, status);
      res.json({ comment });
    } catch (error: any) {
      res.status(400).json({ message: `Error updating comment: ${error.message}` });
    }
  });

  // Communities
  app.get("/api/communities", optionalAuth, async (req, res) => {
    try {
      const { search, limit, offset, includePrivate = false } = req.query;
      const pagination = calculatePagination(
        parseInt(limit as string) || 20, 
        parseInt(offset as string) || 0
      );
      
      const { data, totalCount } = await storage.getCommunities({
        search: search as string,
        limit: pagination.limit,
        offset: pagination.offset,
        includePrivate: includePrivate === 'true'
      });
      
      paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: "Error fetching community" });
    }
  });

  app.post("/api/communities", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const communityData = { ...req.body, ownerId: req.user!.id };
      
      if (!communityData.slug && communityData.name) {
        const baseSlug = slugify(communityData.name);
        communityData.slug = `${baseSlug}-${Date.now()}`;
      }
      
      const community = await storage.createCommunity(communityData);
      res.status(201).json({ community });
    } catch (error: any) {
      res.status(400).json({ message: `Error creating community: ${error.message}` });
    }
  });

  app.put("/api/communities/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const community = await storage.getCommunity(req.params.id);
      if (!community || community.ownerId !== req.user!.id) {
        res.status(404).json({ message: "Community not found or unauthorized" });
        return;
      }
      const updated = await storage.updateCommunity(req.params.id, req.body);
      res.json({ community: updated });
    } catch (error: any) {
      res.status(400).json({ message: `Error updating community: ${error.message}` });
    }
  });

  app.post("/api/communities/:id/join", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const member = await storage.joinCommunity(req.params.id, req.user!.id);
      res.status(201).json({ member });
    } catch (error: any) {
      res.status(400).json({ message: `Error joining community: ${error.message}` });
    }
  });

  app.post("/api/communities/:id/leave", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.leaveCommunity(req.params.id, req.user!.id);
      res.json({ message: "Left community successfully" });
    } catch (error: any) {
      res.status(400).json({ message: `Error leaving community: ${error.message}` });
    }
  });

  app.get("/api/communities/:id/members", async (req, res) => {
    try {
      const members = await storage.getCommunityMembers(req.params.id);
      res.json({ members });
    } catch (error) {
      res.status(500).json({ message: "Error fetching members" });
    }
  });

  // Messages
  app.get("/api/messages", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { communityId, limit, offset } = req.query;
      const pagination = calculatePagination(
        parseInt(limit as string) || 50, 
        parseInt(offset as string) || 0
      );
      
      const { data, totalCount } = await storage.getMessages({
        userId: req.user!.id,
        communityId: communityId as string,
        limit: pagination.limit,
        offset: pagination.offset
      });
      
      paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
    } catch (error) {
      errorResponse(res, "Error fetching messages");
    }
  });

  app.post("/api/messages", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const message = await storage.createMessage({ ...req.body, senderId: req.user!.id });
      res.status(201).json({ message });
    } catch (error: any) {
      res.status(400).json({ message: `Error creating message: ${error.message}` });
    }
  });

  // Marketing Campaigns
  app.get("/api/campaigns", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.query;
      const campaigns = await storage.getCampaigns(req.user!.id, { status });
      res.json({ campaigns });
    } catch (error) {
      res.status(500).json({ message: "Error fetching campaigns" });
    }
  });

  app.get("/api/campaigns/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        res.status(404).json({ message: "Campaign not found" });
        return;
      }
      res.json({ campaign });
    } catch (error) {
      res.status(500).json({ message: "Error fetching campaign" });
    }
  });

  app.post("/api/campaigns", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const campaign = await storage.createCampaign({ ...req.body, userId: req.user!.id });
      res.status(201).json({ campaign });
    } catch (error: any) {
      res.status(400).json({ message: `Error creating campaign: ${error.message}` });
    }
  });

  app.put("/api/campaigns/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const updated = await storage.updateCampaign(req.params.id, req.body);
      res.json({ campaign: updated });
    } catch (error: any) {
      res.status(400).json({ message: `Error updating campaign: ${error.message}` });
    }
  });

  // Leads/CRM
  app.get("/api/leads", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { status, source, limit, offset } = req.query;
      const pagination = calculatePagination(
        parseInt(limit as string) || 50, 
        parseInt(offset as string) || 0
      );
      
      const { data, totalCount } = await storage.getLeads(req.user!.id, {
        status, 
        source,
        limit: pagination.limit,
        offset: pagination.offset
      });
      
      paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
    } catch (error) {
      errorResponse(res, "Error fetching leads");
    }
  });

  app.post("/api/leads", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const lead = await storage.createLead({ ...req.body, userId: req.user!.id });
      res.status(201).json({ lead });
    } catch (error: any) {
      res.status(400).json({ message: `Error creating lead: ${error.message}` });
    }
  });

  app.put("/api/leads/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const updated = await storage.updateLead(req.params.id, req.body);
      res.json({ lead: updated });
    } catch (error: any) {
      res.status(400).json({ message: `Error updating lead: ${error.message}` });
    }
  });

  // Plugin Marketplace
  app.get("/api/plugins", optionalAuth, async (req, res) => {
    try {
      const { category, search, limit, offset } = req.query;
      const pagination = calculatePagination(
        parseInt(limit as string) || 20, 
        parseInt(offset as string) || 0
      );
      
      const { data, totalCount } = await storage.getPlugins({
        category: category as string,
        search: search as string,
        limit: pagination.limit,
        offset: pagination.offset
      });
      
      paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: "Error fetching plugin" });
    }
  });

  app.post("/api/plugins", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const plugin = await storage.createPlugin({ ...req.body, developerId: req.user!.id });
      res.status(201).json({ plugin });
    } catch (error: any) {
      res.status(400).json({ message: `Error creating plugin: ${error.message}` });
    }
  });

  app.post("/api/plugins/:id/install", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const plugin = await storage.getPlugin(req.params.id);
      if (!plugin) {
        res.status(404).json({ message: "Plugin not found" });
        return;
      }
      const installation = await storage.installPlugin(req.user!.id, req.params.id, plugin.version);
      res.status(201).json({ installation });
    } catch (error: any) {
      res.status(400).json({ message: `Error installing plugin: ${error.message}` });
    }
  });

  app.get("/api/plugins/installed/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const installations = await storage.getInstalledPlugins(req.user!.id);
      res.json({ installations });
    } catch (error) {
      res.status(500).json({ message: "Error fetching installed plugins" });
    }
  });

  app.delete("/api/plugins/:id/uninstall", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.uninstallPlugin(req.user!.id, req.params.id);
      res.json({ message: "Plugin uninstalled successfully" });
    } catch (error: any) {
      res.status(400).json({ message: `Error uninstalling plugin: ${error.message}` });
    }
  });

  // Notifications
  app.get("/api/notifications", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { type, isRead, limit, offset } = req.query;
      const pagination = calculatePagination(
        parseInt(limit as string) || 50, 
        parseInt(offset as string) || 0
      );
      
      const { data, totalCount } = await storage.getNotifications(req.user!.id, {
        type: type as string,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        limit: pagination.limit,
        offset: pagination.offset
      });
      
      paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
    } catch (error) {
      errorResponse(res, "Error fetching notifications");
    }
  });

  app.post("/api/notifications", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const notification = await storage.createNotification({ ...req.body, userId: req.user!.id });
      res.status(201).json({ notification });
    } catch (error: any) {
      res.status(400).json({ message: `Error creating notification: ${error.message}` });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const notification = await storage.markNotificationRead(req.params.id);
      res.json({ notification });
    } catch (error: any) {
      res.status(400).json({ message: `Error marking notification as read: ${error.message}` });
    }
  });

  app.put("/api/notifications/read-all", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.markAllNotificationsRead(req.user!.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      res.status(400).json({ message: `Error marking notifications as read: ${error.message}` });
    }
  });

  // Media Library
  app.get("/api/media", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { mimeType, limit, offset } = req.query;
      const pagination = calculatePagination(
        parseInt(limit as string) || 50, 
        parseInt(offset as string) || 0
      );
      
      const { data, totalCount } = await storage.getMedia(req.user!.id, {
        mimeType: mimeType as string,
        limit: pagination.limit,
        offset: pagination.offset
      });
      
      paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
    } catch (error) {
      errorResponse(res, "Error fetching media");
    }
  });

  app.post("/api/media", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const media = await storage.createMedia({ ...req.body, userId: req.user!.id });
      res.status(201).json({ media });
    } catch (error: any) {
      res.status(400).json({ message: `Error creating media: ${error.message}` });
    }
  });

  app.put("/api/media/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const updated = await storage.updateMedia(req.params.id, req.body);
      res.json({ media: updated });
    } catch (error: any) {
      res.status(400).json({ message: `Error updating media: ${error.message}` });
    }
  });

  app.delete("/api/media/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteMedia(req.params.id);
      res.json({ message: "Media deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting media" });
    }
  });

  // Audit Logs
  app.get("/api/audit-logs", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const { userId, action, resource, limit, offset } = req.query;
      const pagination = calculatePagination(
        parseInt(limit as string) || 100, 
        parseInt(offset as string) || 0
      );
      
      const { data, totalCount } = await storage.getAuditLogs({
        userId: userId as string,
        action: action as string,
        resource: resource as string,
        limit: pagination.limit,
        offset: pagination.offset
      });
      
      paginatedResponse(res, data, { limit: pagination.limit, offset: pagination.offset, totalCount });
    } catch (error) {
      errorResponse(res, "Error fetching audit logs");
    }
  });

  // Analytics Endpoints
  app.get("/api/analytics/stats", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
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
        pages: websites.length.toString(),
        growth: "+0%",
        activeUsers: Math.floor(activeUsers * 0.3).toString()
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching analytics" });
    }
  });

  app.get("/api/analytics/activity", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const activities = await storage.getRecentActivity(userId, { limit: 10 });
      res.json({ activities });
    } catch (error) {
      res.status(500).json({ message: "Error fetching activity" });
    }
  });

  const httpServer = createServer(app);

  setupWebSocket(httpServer);

  return httpServer;
}
