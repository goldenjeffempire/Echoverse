import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define user roles
export const UserRole = {
  ADMIN: "admin",
  USER: "user",
  PREMIUM: "premium",
  BUSINESS: "business",
  ENTERPRISE: "enterprise",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Stripe-related fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePlanId: text("stripe_plan_id"),
  subscriptionStatus: text("subscription_status"),
  planTier: text("plan_tier").default("free"),
});

// Insert schema
export const insertUserSchema = createInsertSchema(users)
  .omit({ 
    id: true, 
    createdAt: true, 
    role: true,
    stripeCustomerId: true,
    stripeSubscriptionId: true,
    stripePlanId: true,
    subscriptionStatus: true,
    planTier: true
  });
  
// Make email optional for backward compatibility  
export const insertUserSchema2 = insertUserSchema.extend({
  email: z.string().email().optional(),
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define potential plan tiers
export const PlanTier = {
  FREE: "free",
  STARTER: "starter",
  PRO: "pro",
  BUSINESS: "business",
  PREMIUM: "premium",
  ENTERPRISE: "enterprise",
} as const;

export type PlanTierType = (typeof PlanTier)[keyof typeof PlanTier];
