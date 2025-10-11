/**
 * GDPR Compliance Utilities
 * Handles data export, deletion, and user rights
 */

import { db } from '../db';
import { users, websites, posts, orders, communities, messages } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { AuditLogger, AuditAction } from './audit-logger';
import { logger } from './logger';

export interface GDPRExportData {
  user: any;
  websites: any[];
  posts: any[];
  orders: any[];
  communities: any[];
  messages: any[];
  exportDate: string;
  dataCategories: string[];
}

export class GDPRService {
  static async exportUserData(userId: string, requesterIp?: string): Promise<GDPRExportData> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        throw new Error('User not found');
      }

      const [
        userWebsites,
        userPosts,
        userOrders,
        userCommunities,
        userMessages
      ] = await Promise.all([
        db.select().from(websites).where(eq(websites.userId, userId)),
        db.select().from(posts).where(eq(posts.authorId, userId)),
        db.select().from(orders).where(eq(orders.userId, userId)),
        db.select().from(communities).where(eq(communities.ownerId, userId)),
        db.select().from(messages).where(eq(messages.userId, userId))
      ]);

      const sanitizedUser = { ...user };
      delete (sanitizedUser as any).passwordHash;
      delete (sanitizedUser as any).twoFactorSecret;

      await AuditLogger.log({
        userId,
        action: AuditAction.DATA_EXPORT,
        success: true,
        ipAddress: requesterIp,
        details: {
          categories: ['profile', 'websites', 'posts', 'orders', 'communities', 'messages']
        }
      });

      return {
        user: sanitizedUser,
        websites: userWebsites,
        posts: userPosts,
        orders: userOrders,
        communities: userCommunities,
        messages: userMessages,
        exportDate: new Date().toISOString(),
        dataCategories: ['profile', 'content', 'transactions', 'communications']
      };
    } catch (error) {
      logger.error('GDPR data export failed', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  static async deleteUserData(userId: string, requesterIp?: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        await tx.update(users)
          .set({
            email: `deleted-${userId}@deleted.local`,
            username: `deleted-${userId}`,
            passwordHash: '',
            deletedAt: new Date(),
            emailVerified: false,
            twoFactorEnabled: false,
            twoFactorSecret: null
          })
          .where(eq(users.id, userId));

        await tx.update(websites)
          .set({ deletedAt: new Date() })
          .where(eq(websites.userId, userId));

        await tx.update(posts)
          .set({ deletedAt: new Date() })
          .where(eq(posts.authorId, userId));

        await tx.update(communities)
          .set({ deletedAt: new Date() })
          .where(eq(communities.ownerId, userId));
      });

      await AuditLogger.log({
        userId,
        action: AuditAction.DATA_DELETE,
        success: true,
        ipAddress: requesterIp,
        details: { reason: 'GDPR right to erasure' }
      });

      logger.info('User data deleted per GDPR request', { userId });
    } catch (error) {
      await AuditLogger.log({
        userId,
        action: AuditAction.DATA_DELETE,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
        ipAddress: requesterIp
      });
      throw error;
    }
  }

  static async getDataRetentionInfo(userId: string): Promise<any> {
    return {
      userId,
      retentionPeriods: {
        activeAccount: 'Indefinite',
        deletedAccount: '90 days',
        auditLogs: '7 years (legal requirement)',
        transactionHistory: '10 years (tax compliance)',
        backups: '30 days'
      },
      yourRights: [
        'Right to access your data',
        'Right to rectification',
        'Right to erasure (right to be forgotten)',
        'Right to data portability',
        'Right to object to processing',
        'Right to restrict processing'
      ]
    };
  }

  static async anonymizeUserData(userId: string): Promise<void> {
    await db.update(users)
      .set({
        email: `anon-${userId}@anonymous.local`,
        username: `anonymous-${userId}`,
        passwordHash: '',
        profilePicture: null,
        bio: null,
        emailVerified: false,
        twoFactorEnabled: false,
        twoFactorSecret: null
      })
      .where(eq(users.id, userId));

    logger.info('User data anonymized', { userId });
  }
}
