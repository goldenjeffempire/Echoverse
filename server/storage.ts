import { 
  type User, type InsertUser, type Session, type Website, type Post, type Product, type Order,
  type Community, type Plugin,
  sessions, products, orders, users, websites, websiteVersions, posts, comments, 
  communities, communityMembers, messages, campaigns, leads, plugins, pluginInstallations,
  auditLogs, notifications, media, analytics, abTests, abTestParticipants, funnels, 
  funnelEntries, affiliates, referrals, permissions, rolePermissions, userPermissions, subscriptions,
  passwordResetTokens, loginAttempts, accountLockouts, coupons, giftCards, giftCardTransactions
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, sql, lt, and, like, desc, or, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User Management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  updateStripeCustomerId(userId: string, customerId: string): Promise<User | undefined>;
  updateUserStripeInfo(userId: string, info: { customerId: string; subscriptionId: string }): Promise<User | undefined>;
  
  // Session Management
  createSession(session: { id: string; userId: string; refreshTokenHash: string; expiresAt: Date }): Promise<Session>;
  createSessionWithLimit(userId: string, session: { id: string; userId: string; refreshTokenHash: string; expiresAt: Date }, maxSessions: number): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  updateSession(id: string, updates: { refreshTokenHash?: string; updatedAt?: Date }): Promise<Session | undefined>;
  deleteSession(id: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;
  getUserSessions(userId: string): Promise<Session[]>;
  getUserSessionCount(userId: string): Promise<number>;
  deleteOldestUserSession(userId: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;
  
  // Website Builder
  getWebsites(userId: string, filters?: any): Promise<Website[]>;
  getWebsite(id: string): Promise<Website | undefined>;
  createWebsite(website: any): Promise<Website>;
  updateWebsite(id: string, updates: any): Promise<Website | undefined>;
  deleteWebsite(id: string): Promise<void>;
  publishWebsite(id: string): Promise<Website | undefined>;
  createWebsiteVersion(version: any): Promise<any>;
  getWebsiteVersions(websiteId: string): Promise<any[]>;
  
  // E-Commerce Product Management
  getProducts(filters: { category?: string; search?: string; limit: number; offset: number }): Promise<{ data: any[]; totalCount: number }>;
  getProduct(id: string): Promise<any | undefined>;
  createProduct(product: any): Promise<any>;
  updateProduct(id: string, updates: any): Promise<any | undefined>;
  deleteProduct(id: string): Promise<void>;
  updateInventory(id: string, quantity: number): Promise<any | undefined>;
  
  // E-Commerce Order Management
  getOrders(userId: string, filters: { status?: string; limit: number; offset: number }): Promise<{ data: any[]; totalCount: number }>;
  getOrder(id: string): Promise<any | undefined>;
  createOrder(order: any): Promise<any>;
  createOrderWithInventoryCheck(order: any): Promise<any>;
  restoreInventory(orderId: string): Promise<void>;
  updateOrderStatus(id: string, status: string): Promise<any | undefined>;
  getAllOrders(filters: any): Promise<{ data: any[]; totalCount: number }>;
  
  // CMS & Blog Posts
  getPosts(filters: any): Promise<{ data: Post[]; totalCount: number }>;
  getPost(id: string): Promise<Post | undefined>;
  getPostBySlug(slug: string): Promise<Post | undefined>;
  createPost(post: any): Promise<Post>;
  updatePost(id: string, updates: any): Promise<Post | undefined>;
  deletePost(id: string): Promise<void>;
  publishPost(id: string): Promise<Post | undefined>;
  
  // Comments
  getComments(postId: string): Promise<any[]>;
  createComment(comment: any): Promise<any>;
  updateCommentStatus(id: string, status: string): Promise<any | undefined>;
  deleteComment(id: string): Promise<void>;
  
  // Communities
  getCommunities(filters: any): Promise<{ data: Community[]; totalCount: number }>;
  getCommunity(id: string): Promise<Community | undefined>;
  getCommunityBySlug(slug: string): Promise<Community | undefined>;
  createCommunity(community: any): Promise<Community>;
  updateCommunity(id: string, updates: any): Promise<Community | undefined>;
  deleteCommunity(id: string): Promise<void>;
  joinCommunity(communityId: string, userId: string): Promise<any>;
  leaveCommunity(communityId: string, userId: string): Promise<void>;
  getCommunityMembers(communityId: string): Promise<any[]>;
  
  // Messages
  getMessages(filters: any): Promise<{ data: any[]; totalCount: number }>;
  createMessage(message: any): Promise<any>;
  markMessageRead(id: string): Promise<any | undefined>;
  deleteMessage(id: string): Promise<void>;
  
  // Marketing Campaigns
  getCampaigns(userId: string, filters?: any): Promise<any[]>;
  getCampaign(id: string): Promise<any | undefined>;
  createCampaign(campaign: any): Promise<any>;
  updateCampaign(id: string, updates: any): Promise<any | undefined>;
  deleteCampaign(id: string): Promise<void>;
  
  // Leads
  getLeads(userId: string, filters?: any): Promise<{ data: any[]; totalCount: number }>;
  createLead(lead: any): Promise<any>;
  updateLead(id: string, updates: any): Promise<any | undefined>;
  deleteLead(id: string): Promise<void>;
  
  // Plugins
  getPlugins(filters?: any): Promise<{ data: Plugin[]; totalCount: number }>;
  getPlugin(id: string): Promise<Plugin | undefined>;
  createPlugin(plugin: any): Promise<Plugin>;
  updatePlugin(id: string, updates: any): Promise<Plugin | undefined>;
  deletePlugin(id: string): Promise<void>;
  installPlugin(userId: string, pluginId: string, version: string): Promise<any>;
  getInstalledPlugins(userId: string): Promise<any[]>;
  uninstallPlugin(userId: string, pluginId: string): Promise<void>;
  
  // Notifications
  getNotifications(userId: string, filters?: any): Promise<{ data: any[]; totalCount: number }>;
  createNotification(notification: any): Promise<any>;
  markNotificationRead(id: string): Promise<any | undefined>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  
  // Media Library
  getMedia(userId: string, filters?: any): Promise<{ data: any[]; totalCount: number }>;
  createMedia(media: any): Promise<any>;
  updateMedia(id: string, updates: any): Promise<any | undefined>;
  deleteMedia(id: string): Promise<void>;
  
  // Audit Logs
  createAuditLog(log: any): Promise<any>;
  getAuditLogs(filters?: any): Promise<{ data: any[]; totalCount: number }>;
  
  // Analytics
  getUsersCount(): Promise<number>;
  getRecentActivity(userId: string, filters?: any): Promise<any[]>;
}

export class PostgresStorage implements IStorage {
  // User Management
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateStripeCustomerId(userId: string, customerId: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserStripeInfo(userId: string, info: { customerId: string; subscriptionId: string }): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ 
        stripeCustomerId: info.customerId,
        stripeSubscriptionId: info.subscriptionId 
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Session Management
  async createSession(session: { id: string; userId: string; refreshTokenHash: string; expiresAt: Date }): Promise<Session> {
    const result = await db.insert(sessions).values(session).returning();
    return result[0];
  }

  async createSessionWithLimit(userId: string, session: { id: string; userId: string; refreshTokenHash: string; expiresAt: Date }, maxSessions: number): Promise<Session> {
    return await db.transaction(async (tx) => {
      const now = new Date();
      
      // Lock the user row itself using SELECT ... FOR UPDATE to prevent concurrent race conditions
      // This ensures only one transaction can create sessions for this user at a time
      // Works even when user has zero sessions (unlike locking session rows)
      await tx.execute(sql`SELECT 1 FROM ${users} WHERE ${users.id} = ${userId} FOR UPDATE`);
      
      // Cleanup expired sessions for this user first (within transaction)
      await tx.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, now)));
      
      // Count active sessions (now protected by user row lock)
      const countResult = await tx.select({ count: sql<number>`count(*)` })
        .from(sessions)
        .where(and(eq(sessions.userId, userId), gte(sessions.expiresAt, now)));
      
      const activeCount = Number(countResult[0]?.count || 0);
      
      // If at limit, delete oldest active session
      if (activeCount >= maxSessions) {
        const oldestSession = await tx.select().from(sessions)
          .where(and(eq(sessions.userId, userId), gte(sessions.expiresAt, now)))
          .orderBy(sessions.createdAt)
          .limit(1);
        
        if (oldestSession[0]) {
          await tx.delete(sessions).where(eq(sessions.id, oldestSession[0].id));
        }
      }
      
      // Create new session
      const result = await tx.insert(sessions).values(session).returning();
      return result[0];
    });
  }

  async getSession(id: string): Promise<Session | undefined> {
    const result = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
    return result[0];
  }

  async updateSession(id: string, updates: { refreshTokenHash?: string; updatedAt?: Date }): Promise<Session | undefined> {
    const result = await db.update(sessions).set(updates).where(eq(sessions.id, id)).returning();
    return result[0];
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  async deleteUserSessions(userId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    return db.select().from(sessions).where(eq(sessions.userId, userId)).orderBy(desc(sessions.createdAt));
  }

  async getUserSessionCount(userId: string): Promise<number> {
    const now = new Date();
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), gte(sessions.expiresAt, now)));
    return Number(result[0]?.count || 0);
  }

  async deleteOldestUserSession(userId: string): Promise<void> {
    const now = new Date();
    const oldestSession = await db.select().from(sessions)
      .where(and(eq(sessions.userId, userId), gte(sessions.expiresAt, now)))
      .orderBy(sessions.createdAt)
      .limit(1);
    
    if (oldestSession[0]) {
      await db.delete(sessions).where(eq(sessions.id, oldestSession[0].id));
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    await db.delete(sessions).where(lt(sessions.expiresAt, now));
  }

  // Website Builder
  async getWebsites(userId: string, filters?: any): Promise<Website[]> {
    const conditions = [eq(websites.userId, userId)];
    if (filters?.status) {
      conditions.push(eq(websites.status, filters.status));
    }
    return await db.select().from(websites).where(and(...conditions)).orderBy(desc(websites.updatedAt));
  }

  async getWebsite(id: string): Promise<Website | undefined> {
    const result = await db.select().from(websites).where(eq(websites.id, id)).limit(1);
    return result[0];
  }

  async createWebsite(website: any): Promise<Website> {
    const result = await db.insert(websites).values({
      userId: website.userId,
      name: website.name,
      description: website.description,
      domain: website.domain,
      template: website.template,
      content: website.content || {},
      settings: website.settings || {},
      status: website.status || 'draft',
      version: 1,
      isPublic: website.isPublic || false,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateWebsite(id: string, updates: any): Promise<Website | undefined> {
    const result = await db.update(websites).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(websites.id, id)).returning();
    return result[0];
  }

  async deleteWebsite(id: string): Promise<void> {
    await db.delete(websites).where(eq(websites.id, id));
  }

  async publishWebsite(id: string): Promise<Website | undefined> {
    const website = await this.getWebsite(id);
    if (!website) return undefined;
    
    const currentVersion = website.version || 1;
    
    await this.createWebsiteVersion({
      websiteId: id,
      version: currentVersion,
      content: website.content,
      settings: website.settings
    });
    
    const result = await db.update(websites).set({
      status: 'published',
      version: currentVersion + 1,
      updatedAt: new Date()
    }).where(eq(websites.id, id)).returning();
    return result[0];
  }

  async createWebsiteVersion(version: any): Promise<any> {
    const result = await db.insert(websiteVersions).values(version).returning();
    return result[0];
  }

  async getWebsiteVersions(websiteId: string): Promise<any[]> {
    return await db.select().from(websiteVersions)
      .where(eq(websiteVersions.websiteId, websiteId))
      .orderBy(desc(websiteVersions.version));
  }

  // E-Commerce Products
  async getProducts(filters: { category?: string; search?: string; limit: number; offset: number }): Promise<{ data: any[]; totalCount: number }> {
    const conditions = [eq(products.isActive, true)];
    
    if (filters.category) {
      conditions.push(eq(products.category, filters.category));
    }
    
    if (filters.search) {
      conditions.push(
        sql`(
          ${products.name} ILIKE ${`%${filters.search}%`} OR 
          ${products.description} ILIKE ${`%${filters.search}%`}
        )`
      );
    }
    
    const [data, countResult] = await Promise.all([
      db.select()
        .from(products)
        .where(and(...conditions))
        .limit(filters.limit)
        .offset(filters.offset)
        .orderBy(desc(products.createdAt)),
      db.select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(...conditions))
    ]);

    return {
      data,
      totalCount: Number(countResult[0]?.count || 0)
    };
  }
  
  async getProduct(id: string): Promise<any | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }
  
  async createProduct(product: any): Promise<any> {
    const result = await db.insert(products).values({
      ...product,
      userId: product.userId,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }
  
  async updateProduct(id: string, updates: any): Promise<any | undefined> {
    const result = await db.update(products).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(products.id, id)).returning();
    return result[0];
  }
  
  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async updateInventory(id: string, quantity: number): Promise<any | undefined> {
    const result = await db.update(products).set({
      inventory: quantity,
      updatedAt: new Date()
    }).where(eq(products.id, id)).returning();
    return result[0];
  }

  async getUserProducts(userId: string): Promise<any[]> {
    return await db.select()
      .from(products)
      .where(eq(products.userId, userId))
      .orderBy(desc(products.createdAt));
  }

  // E-Commerce Orders
  async getOrders(userId: string, filters: { status?: string; limit: number; offset: number }): Promise<{ data: any[]; totalCount: number }> {
    const conditions = [eq(orders.userId, userId)];
    
    if (filters.status) {
      conditions.push(eq(orders.status, filters.status));
    }
    
    const [data, countResult] = await Promise.all([
      db.select()
        .from(orders)
        .where(and(...conditions))
        .limit(filters.limit)
        .offset(filters.offset)
        .orderBy(desc(orders.createdAt)),
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(...conditions))
    ]);

    return {
      data,
      totalCount: Number(countResult[0]?.count || 0)
    };
  }
  
  async getOrder(id: string): Promise<any | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }
  
  async createOrder(order: any): Promise<any> {
    const subtotal = order.subtotal || order.total;
    const taxTotal = order.taxTotal || order.tax_total || '0';
    const shippingTotal = order.shippingTotal || order.shipping_total || '0';
    const discountTotal = order.discountTotal || order.discount_total || '0';
    
    const result = await db.insert(orders).values({
      userId: order.userId,
      customerEmail: order.customerEmail || '',
      customerPhone: order.customerPhone,
      status: order.status || 'pending',
      fulfillmentStatus: order.fulfillmentStatus || 'unfulfilled',
      paymentStatus: order.paymentStatus || 'pending',
      subtotal: subtotal.toString(),
      taxTotal: taxTotal.toString(),
      shippingTotal: shippingTotal.toString(),
      discountTotal: discountTotal.toString(),
      total: order.total.toString(),
      currency: order.currency || 'usd',
      stripePaymentIntentId: order.stripePaymentIntentId,
      idempotencyKey: order.idempotencyKey,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      items: order.items,
      discountCodes: order.discountCodes,
      notes: order.notes,
      internalNotes: order.internalNotes,
      metadata: order.metadata || {},
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async createOrderWithInventoryCheck(order: any): Promise<any> {
    return await db.transaction(async (tx) => {
      const validatedItems = [];
      
      for (const item of order.items) {
        const productId = item.productId;
        const quantityOrdered = item.quantity;
        
        const lockedProduct = await tx.execute(
          sql`SELECT * FROM ${products} WHERE ${products.id} = ${productId} FOR UPDATE`
        );
        
        if (!lockedProduct.rows || lockedProduct.rows.length === 0) {
          throw new Error(`Product not found: ${productId}`);
        }
        
        const product = lockedProduct.rows[0] as any;
        
        if (!product.is_active) {
          throw new Error(`Product is no longer available: ${product.name}`);
        }
        
        const currentInventory = product.inventory || 0;
        
        if (currentInventory < quantityOrdered) {
          throw new Error(`Insufficient inventory for product: ${product.name}. Available: ${currentInventory}, Requested: ${quantityOrdered}`);
        }
        
        const newInventory = currentInventory - quantityOrdered;
        await tx.update(products)
          .set({ 
            inventory: newInventory,
            updatedAt: new Date()
          })
          .where(eq(products.id, productId));
        
        validatedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          productName: product.name
        });
      }
      
      const subtotal = order.subtotal || order.total;
      const taxTotal = order.taxTotal || order.tax_total || '0';
      const shippingTotal = order.shippingTotal || order.shipping_total || '0';
      const discountTotal = order.discountTotal || order.discount_total || '0';
      
      const result = await tx.insert(orders).values({
        userId: order.userId,
        customerEmail: order.customerEmail || '',
        customerPhone: order.customerPhone,
        status: order.status || 'pending',
        fulfillmentStatus: order.fulfillmentStatus || 'unfulfilled',
        paymentStatus: order.paymentStatus || 'pending',
        subtotal: subtotal.toString(),
        taxTotal: taxTotal.toString(),
        shippingTotal: shippingTotal.toString(),
        discountTotal: discountTotal.toString(),
        total: order.total.toString(),
        currency: order.currency || 'usd',
        stripePaymentIntentId: order.stripePaymentIntentId,
        idempotencyKey: order.idempotencyKey,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        items: validatedItems,
        discountCodes: order.discountCodes,
        notes: order.notes,
        internalNotes: order.internalNotes,
        metadata: order.metadata || {},
        updatedAt: new Date()
      }).returning();
      
      return result[0];
    });
  }

  async restoreInventory(orderId: string): Promise<void> {
    await db.transaction(async (tx) => {
      const orderResult = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      
      if (!orderResult || orderResult.length === 0) {
        throw new Error(`Order not found: ${orderId}`);
      }
      
      const order = orderResult[0];
      const items = order.items as any[];
      
      if (!items || !Array.isArray(items)) {
        return;
      }
      
      for (const item of items) {
        const productId = item.productId;
        const quantity = item.quantity;
        
        await tx.execute(
          sql`SELECT * FROM ${products} WHERE ${products.id} = ${productId} FOR UPDATE`
        );
        
        await tx.execute(
          sql`UPDATE ${products} 
              SET inventory = inventory + ${quantity}, 
                  updated_at = NOW() 
              WHERE ${products.id} = ${productId}`
        );
      }
    });
  }
  
  async updateOrderStatus(id: string, status: string): Promise<any | undefined> {
    const result = await db.update(orders).set({
      status,
      updatedAt: new Date()
    }).where(eq(orders.id, id)).returning();
    return result[0];
  }

  async getAllOrders(filters: any): Promise<{ data: any[]; totalCount: number }> {
    const conditions = [];
    if (filters.status) {
      conditions.push(eq(orders.status, filters.status));
    }
    if (filters.stripePaymentIntentId) {
      conditions.push(eq(orders.stripePaymentIntentId, filters.stripePaymentIntentId));
    }
    
    const whereClause = conditions.length ? and(...conditions) : undefined;
    
    const [data, countResult] = await Promise.all([
      db.select()
        .from(orders)
        .where(whereClause)
        .limit(filters.limit || 50)
        .offset(filters.offset || 0)
        .orderBy(desc(orders.createdAt)),
      db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause)
    ]);

    return {
      data,
      totalCount: Number(countResult[0]?.count || 0)
    };
  }

  // CMS & Blog Posts
  async getPosts(filters: any): Promise<{ data: Post[]; totalCount: number }> {
    const conditions = [];
    if (filters.userId) {
      conditions.push(eq(posts.userId, filters.userId));
    }
    if (filters.status) {
      conditions.push(eq(posts.status, filters.status));
    }
    if (filters.type) {
      conditions.push(eq(posts.type, filters.type));
    }
    if (filters.search) {
      conditions.push(
        sql`(${posts.title} ILIKE ${`%${filters.search}%`} OR ${posts.content} ILIKE ${`%${filters.search}%`})`
      );
    }
    
    const whereClause = conditions.length ? and(...conditions) : undefined;
    
    const [data, countResult] = await Promise.all([
      db.select()
        .from(posts)
        .where(whereClause)
        .limit(filters.limit || 20)
        .offset(filters.offset || 0)
        .orderBy(desc(posts.createdAt)),
      db.select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(whereClause)
    ]);

    return {
      data,
      totalCount: Number(countResult[0]?.count || 0)
    };
  }

  async getPost(id: string): Promise<Post | undefined> {
    const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    return result[0];
  }

  async getPostBySlug(slug: string): Promise<Post | undefined> {
    const result = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
    return result[0];
  }

  async createPost(post: any): Promise<Post> {
    const result = await db.insert(posts).values({
      ...post,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updatePost(id: string, updates: any): Promise<Post | undefined> {
    const result = await db.update(posts).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(posts.id, id)).returning();
    return result[0];
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async publishPost(id: string): Promise<Post | undefined> {
    const result = await db.update(posts).set({
      status: 'published',
      publishedAt: new Date(),
      updatedAt: new Date()
    }).where(eq(posts.id, id)).returning();
    return result[0];
  }

  // Comments
  async getComments(postId: string): Promise<any[]> {
    return await db.select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));
  }

  async createComment(comment: any): Promise<any> {
    const result = await db.insert(comments).values(comment).returning();
    return result[0];
  }

  async updateCommentStatus(id: string, status: string): Promise<any | undefined> {
    const result = await db.update(comments).set({ status }).where(eq(comments.id, id)).returning();
    return result[0];
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  // Communities
  async getCommunities(filters: any): Promise<{ data: Community[]; totalCount: number }> {
    const conditions = [];
    if (filters.search) {
      conditions.push(
        sql`(${communities.name} ILIKE ${`%${filters.search}%`} OR ${communities.description} ILIKE ${`%${filters.search}%`})`
      );
    }
    if (!filters.includePrivate) {
      conditions.push(eq(communities.isPrivate, false));
    }
    
    const whereClause = conditions.length ? and(...conditions) : undefined;
    
    const [data, countResult] = await Promise.all([
      db.select()
        .from(communities)
        .where(whereClause)
        .limit(filters.limit || 20)
        .offset(filters.offset || 0)
        .orderBy(desc(communities.memberCount)),
      db.select({ count: sql<number>`count(*)` })
        .from(communities)
        .where(whereClause)
    ]);

    return {
      data,
      totalCount: Number(countResult[0]?.count || 0)
    };
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    const result = await db.select().from(communities).where(eq(communities.id, id)).limit(1);
    return result[0];
  }

  async getCommunityBySlug(slug: string): Promise<Community | undefined> {
    const result = await db.select().from(communities).where(eq(communities.slug, slug)).limit(1);
    return result[0];
  }

  async createCommunity(community: any): Promise<Community> {
    const result = await db.insert(communities).values({
      ...community,
      memberCount: 1,
      updatedAt: new Date()
    }).returning();
    
    await this.joinCommunity(result[0].id, community.ownerId);
    return result[0];
  }

  async updateCommunity(id: string, updates: any): Promise<Community | undefined> {
    const result = await db.update(communities).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(communities.id, id)).returning();
    return result[0];
  }

  async deleteCommunity(id: string): Promise<void> {
    await db.delete(communities).where(eq(communities.id, id));
  }

  async joinCommunity(communityId: string, userId: string): Promise<any> {
    const result = await db.insert(communityMembers).values({
      communityId,
      userId,
      role: 'member'
    }).returning();
    
    await db.update(communities)
      .set({ memberCount: sql`${communities.memberCount} + 1` })
      .where(eq(communities.id, communityId));
    
    return result[0];
  }

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    await db.delete(communityMembers)
      .where(and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      ));
    
    await db.update(communities)
      .set({ memberCount: sql`${communities.memberCount} - 1` })
      .where(eq(communities.id, communityId));
  }

  async getCommunityMembers(communityId: string): Promise<any[]> {
    return await db.select()
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId))
      .orderBy(desc(communityMembers.joinedAt));
  }

  // Messages
  async getMessages(filters: any): Promise<{ data: any[]; totalCount: number }> {
    const conditions = [];
    if (filters.userId) {
      conditions.push(
        or(
          eq(messages.senderId, filters.userId),
          eq(messages.receiverId, filters.userId)
        )!
      );
    }
    if (filters.communityId) {
      conditions.push(eq(messages.communityId, filters.communityId));
    }
    
    const whereClause = conditions.length ? and(...conditions) : undefined;
    
    const [data, countResult] = await Promise.all([
      db.select()
        .from(messages)
        .where(whereClause)
        .limit(filters.limit || 50)
        .offset(filters.offset || 0)
        .orderBy(desc(messages.createdAt)),
      db.select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(whereClause)
    ]);

    return {
      data,
      totalCount: Number(countResult[0]?.count || 0)
    };
  }

  async createMessage(message: any): Promise<any> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async markMessageRead(id: string): Promise<any | undefined> {
    const result = await db.update(messages).set({ isRead: true }).where(eq(messages.id, id)).returning();
    return result[0];
  }

  async deleteMessage(id: string): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  // Marketing Campaigns
  async getCampaigns(userId: string, filters?: any): Promise<any[]> {
    const conditions = [eq(campaigns.userId, userId)];
    if (filters?.status) {
      conditions.push(eq(campaigns.status, filters.status));
    }
    return await db.select()
      .from(campaigns)
      .where(and(...conditions))
      .orderBy(desc(campaigns.updatedAt));
  }

  async getCampaign(id: string): Promise<any | undefined> {
    const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    return result[0];
  }

  async createCampaign(campaign: any): Promise<any> {
    const result = await db.insert(campaigns).values({
      ...campaign,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateCampaign(id: string, updates: any): Promise<any | undefined> {
    const result = await db.update(campaigns).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(campaigns.id, id)).returning();
    return result[0];
  }

  async deleteCampaign(id: string): Promise<void> {
    await db.delete(campaigns).where(eq(campaigns.id, id));
  }

  // Leads
  async getLeads(userId: string, filters?: any): Promise<{ data: any[]; totalCount: number }> {
    const conditions = [eq(leads.userId, userId)];
    if (filters?.status) {
      conditions.push(eq(leads.status, filters.status));
    }
    if (filters?.source) {
      conditions.push(eq(leads.source, filters.source));
    }
    
    const [data, countResult] = await Promise.all([
      db.select()
        .from(leads)
        .where(and(...conditions))
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0)
        .orderBy(desc(leads.createdAt)),
      db.select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(and(...conditions))
    ]);

    return {
      data,
      totalCount: Number(countResult[0]?.count || 0)
    };
  }

  async createLead(lead: any): Promise<any> {
    const result = await db.insert(leads).values({
      ...lead,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateLead(id: string, updates: any): Promise<any | undefined> {
    const result = await db.update(leads).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(leads.id, id)).returning();
    return result[0];
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  // Plugins
  async getPlugins(filters?: any): Promise<{ data: Plugin[]; totalCount: number }> {
    const conditions = [eq(plugins.isActive, true)];
    if (filters?.category) {
      conditions.push(eq(plugins.category, filters.category));
    }
    if (filters?.search) {
      conditions.push(
        sql`(${plugins.name} ILIKE ${`%${filters.search}%`} OR ${plugins.description} ILIKE ${`%${filters.search}%`})`
      );
    }
    
    const [data, countResult] = await Promise.all([
      db.select()
        .from(plugins)
        .where(and(...conditions))
        .limit(filters?.limit || 20)
        .offset(filters?.offset || 0)
        .orderBy(desc(plugins.downloadCount)),
      db.select({ count: sql<number>`count(*)` })
        .from(plugins)
        .where(and(...conditions))
    ]);

    return {
      data,
      totalCount: Number(countResult[0]?.count || 0)
    };
  }

  async getPlugin(id: string): Promise<Plugin | undefined> {
    const result = await db.select().from(plugins).where(eq(plugins.id, id)).limit(1);
    return result[0];
  }

  async createPlugin(plugin: any): Promise<Plugin> {
    const result = await db.insert(plugins).values({
      ...plugin,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updatePlugin(id: string, updates: any): Promise<Plugin | undefined> {
    const result = await db.update(plugins).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(plugins.id, id)).returning();
    return result[0];
  }

  async deletePlugin(id: string): Promise<void> {
    await db.delete(plugins).where(eq(plugins.id, id));
  }

  async installPlugin(userId: string, pluginId: string, version: string): Promise<any> {
    const result = await db.insert(pluginInstallations).values({
      userId,
      pluginId,
      version,
      isActive: true,
      settings: {}
    }).returning();
    
    await db.update(plugins)
      .set({ downloadCount: sql`${plugins.downloadCount} + 1` })
      .where(eq(plugins.id, pluginId));
    
    return result[0];
  }

  async getInstalledPlugins(userId: string): Promise<any[]> {
    return await db.select()
      .from(pluginInstallations)
      .where(eq(pluginInstallations.userId, userId))
      .orderBy(desc(pluginInstallations.installedAt));
  }

  async uninstallPlugin(userId: string, pluginId: string): Promise<void> {
    await db.delete(pluginInstallations)
      .where(and(
        eq(pluginInstallations.userId, userId),
        eq(pluginInstallations.pluginId, pluginId)
      ));
  }

  // Notifications
  async getNotifications(userId: string, filters?: any): Promise<{ data: any[]; totalCount: number }> {
    const conditions = [eq(notifications.userId, userId)];
    if (filters?.type) {
      conditions.push(eq(notifications.type, filters.type));
    }
    if (filters?.isRead !== undefined) {
      conditions.push(eq(notifications.isRead, filters.isRead));
    }
    
    const [data, countResult] = await Promise.all([
      db.select()
        .from(notifications)
        .where(and(...conditions))
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0)
        .orderBy(desc(notifications.createdAt)),
      db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(...conditions))
    ]);

    return {
      data,
      totalCount: Number(countResult[0]?.count || 0)
    };
  }

  async createNotification(notification: any): Promise<any> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationRead(id: string): Promise<any | undefined> {
    const result = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
    return result[0];
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // Media Library
  async getMedia(userId: string, filters?: any): Promise<{ data: any[]; totalCount: number }> {
    const conditions = [eq(media.userId, userId)];
    if (filters?.mimeType) {
      conditions.push(like(media.mimeType, `${filters.mimeType}%`));
    }
    
    const [data, countResult] = await Promise.all([
      db.select()
        .from(media)
        .where(and(...conditions))
        .limit(filters?.limit || 50)
        .offset(filters?.offset || 0)
        .orderBy(desc(media.createdAt)),
      db.select({ count: sql<number>`count(*)` })
        .from(media)
        .where(and(...conditions))
    ]);

    return {
      data,
      totalCount: Number(countResult[0]?.count || 0)
    };
  }

  async createMedia(mediaItem: any): Promise<any> {
    const result = await db.insert(media).values(mediaItem).returning();
    return result[0];
  }

  async updateMedia(id: string, updates: any): Promise<any | undefined> {
    const result = await db.update(media).set(updates).where(eq(media.id, id)).returning();
    return result[0];
  }

  async deleteMedia(id: string): Promise<void> {
    await db.delete(media).where(eq(media.id, id));
  }

  // Audit Logs
  async createAuditLog(log: any): Promise<any> {
    const result = await db.insert(auditLogs).values(log).returning();
    return result[0];
  }

  async getAuditLogs(filters?: any): Promise<{ data: any[]; totalCount: number }> {
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    if (filters?.resource) {
      conditions.push(eq(auditLogs.resource, filters.resource));
    }
    
    const whereClause = conditions.length ? and(...conditions) : undefined;
    
    const [data, countResult] = await Promise.all([
      db.select()
        .from(auditLogs)
        .where(whereClause)
        .limit(filters?.limit || 100)
        .offset(filters?.offset || 0)
        .orderBy(desc(auditLogs.createdAt)),
      db.select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(whereClause)
    ]);

    return {
      data,
      totalCount: Number(countResult[0]?.count || 0)
    };
  }

  // Analytics
  async getUsersCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return Number(result[0]?.count || 0);
  }

  async getRecentActivity(userId: string, filters?: any): Promise<any[]> {
    const recentOrders = await db.select({
      type: sql<string>`'order'`,
      content: sql<string>`'New order placed'`,
      time: sql<string>`
        CASE
          WHEN created_at > NOW() - INTERVAL '1 hour' THEN CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/60 AS INTEGER) || ' minutes ago'
          WHEN created_at > NOW() - INTERVAL '1 day' THEN CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS INTEGER) || ' hours ago'
          ELSE CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/86400 AS INTEGER) || ' days ago'
        END`
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(3);

    const recentWebsites = await db.select({
      type: sql<string>`'ai-generated'`,
      content: sql<string>`name || ' created with AI'`,
      time: sql<string>`
        CASE
          WHEN created_at > NOW() - INTERVAL '1 hour' THEN CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/60 AS INTEGER) || ' minutes ago'
          WHEN created_at > NOW() - INTERVAL '1 day' THEN CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS INTEGER) || ' hours ago'
          ELSE CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/86400 AS INTEGER) || ' days ago'
        END`
    })
    .from(websites)
    .where(eq(websites.userId, userId))
    .orderBy(desc(websites.createdAt))
    .limit(2);

    const recentPosts = await db.select({
      type: sql<string>`'content'`,
      content: sql<string>`title || ' published'`,
      time: sql<string>`
        CASE
          WHEN created_at > NOW() - INTERVAL '1 hour' THEN CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/60 AS INTEGER) || ' minutes ago'
          WHEN created_at > NOW() - INTERVAL '1 day' THEN CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS INTEGER) || ' hours ago'
          ELSE CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/86400 AS INTEGER) || ' days ago'
        END`
    })
    .from(posts)
    .where(and(eq(posts.userId, userId), eq(posts.status, 'published')))
    .orderBy(desc(posts.createdAt))
    .limit(2);

    return [...recentOrders, ...recentWebsites, ...recentPosts].slice(0, filters?.limit || 10);
  }
}

export const storage = new PostgresStorage();
