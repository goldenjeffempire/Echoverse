import { type User, type InsertUser, type Session, sessions, products, orders } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq, sql, lt, and, like, desc } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  updateStripeCustomerId(userId: string, customerId: string): Promise<User | undefined>;
  updateUserStripeInfo(userId: string, info: { customerId: string; subscriptionId: string }): Promise<User | undefined>;
  
  // Session management
  createSession(session: { id: string; userId: string; refreshTokenHash: string; expiresAt: Date }): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  updateSession(id: string, updates: { refreshTokenHash?: string; updatedAt?: Date }): Promise<Session | undefined>;
  deleteSession(id: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;
  
  // E-commerce Product Management
  getProducts(filters: { category?: string; search?: string; limit: number; offset: number }): Promise<any[]>;
  getProduct(id: string): Promise<any | undefined>;
  createProduct(product: any): Promise<any>;
  updateProduct(id: string, updates: any): Promise<any | undefined>;
  deleteProduct(id: string): Promise<void>;
  
  // E-commerce Order Management
  getOrders(userId: string, filters: { status?: string; limit: number; offset: number }): Promise<any[]>;
  getOrder(id: string): Promise<any | undefined>;
  createOrder(order: any): Promise<any>;
  updateOrderStatus(id: string, status: string): Promise<any | undefined>;
}

export class PostgresStorage implements IStorage {
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

  // Session management implementation
  async createSession(session: { id: string; userId: string; refreshTokenHash: string; expiresAt: Date }): Promise<Session> {
    const result = await db.insert(sessions).values(session).returning();
    return result[0];
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

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    await db.delete(sessions).where(lt(sessions.expiresAt, now));
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
  
  // E-commerce Product Management Implementation
  async getProducts(filters: { category?: string; search?: string; limit: number; offset: number }): Promise<any[]> {
    let query = db.select().from(products).where(eq(products.isActive, true));
    
    if (filters.category) {
      query = query.where(and(eq(products.isActive, true), eq(products.category, filters.category)));
    }
    
    if (filters.search) {
      query = query.where(
        and(
          eq(products.isActive, true),
          sql`(
            ${products.name} ILIKE ${`%${filters.search}%`} OR 
            ${products.description} ILIKE ${`%${filters.search}%`}
          )`
        )
      );
    }
    
    return await query.limit(filters.limit).offset(filters.offset).orderBy(desc(products.createdAt));
  }
  
  async getProduct(id: string): Promise<any | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
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
  
  // E-commerce Order Management Implementation
  async getOrders(userId: string, filters: { status?: string; limit: number; offset: number }): Promise<any[]> {
    let query = db.select().from(orders).where(eq(orders.userId, userId));
    
    if (filters.status) {
      query = query.where(and(eq(orders.userId, userId), eq(orders.status, filters.status)));
    }
    
    return await query.limit(filters.limit).offset(filters.offset).orderBy(desc(orders.createdAt));
  }
  
  async getOrder(id: string): Promise<any | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }
  
  async createOrder(order: any): Promise<any> {
    const result = await db.insert(orders).values({
      userId: order.userId,
      customerEmail: order.customerEmail || '',
      status: order.status || 'pending',
      total: order.total.toString(),
      currency: order.currency || 'usd',
      stripePaymentIntentId: order.stripePaymentIntentId,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      items: order.items,
      metadata: order.metadata || {},
      updatedAt: new Date()
    }).returning();
    return result[0];
  }
  
  async updateOrderStatus(id: string, status: string): Promise<any | undefined> {
    const result = await db.update(orders).set({
      status,
      updatedAt: new Date()
    }).where(eq(orders.id, id)).returning();
    return result[0];
  }
}

export const storage = new PostgresStorage();
