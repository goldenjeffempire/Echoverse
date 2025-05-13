import { users, type User, type InsertUser } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { pool } from "./db";

// PostgreSQL session store
const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, stripeInfo: { customerId: string; subscriptionId: string; planId?: string; status?: string }): Promise<User>;
  cancelSubscription(userId: number): Promise<User>;
  sessionStore: any; // Using any for session store type
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: any; // SessionStore type

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: "user"
      })
      .returning();
    return user;
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserStripeInfo(
    userId: number, 
    stripeInfo: { 
      customerId: string; 
      subscriptionId: string; 
      planId?: string; 
      status?: string 
    }
  ): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        stripeCustomerId: stripeInfo.customerId,
        stripeSubscriptionId: stripeInfo.subscriptionId,
        stripePlanId: stripeInfo.planId || null,
        subscriptionStatus: stripeInfo.status || 'active'
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async cancelSubscription(userId: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        stripeSubscriptionId: null,
        stripePlanId: null,
        subscriptionStatus: 'canceled',
        planTier: 'free'
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
}

// Export database storage instance
export const storage = new DatabaseStorage();
