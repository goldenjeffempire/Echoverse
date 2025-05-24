// server/db/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { drizzle } from 'drizzle-orm/node-postgres';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { PrismaClient } from '@prisma/client';

// Enums
type UserRole = 'work' | 'personal' | 'school' | 'general';
type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'family' | 'student' | 'enterprise';
type ProjectStatus = 'on_track' | 'at_risk' | 'delayed' | 'completed';
type TaskPriority = 'high' | 'medium' | 'normal' | 'low';

export const userRoleEnum = pgEnum('user_role', ['work', 'personal', 'school', 'general']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['free', 'basic', 'pro', 'family', 'student', 'enterprise']);
export const projectStatusEnum = pgEnum('project_status', ['on_track', 'at_risk', 'delayed', 'completed']);
export const taskPriorityEnum = pgEnum('task_priority', ['high', 'medium', 'normal', 'low']);

// Tables
export const schema = {
  users: pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    email: text("email").notNull().unique(),
    displayName: text("display_name"),
    avatar: text("avatar"),
    currentRole: userRoleEnum("current_role").default('general'),
    subscriptionPlan: subscriptionPlanEnum("subscription_plan").default('free'),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    aiCredits: integer("ai_credits").default(100),
    createdAt: timestamp("created_at").defaultNow(),
  }),

  posts: pgTable("posts", {
    id: serial("id").primaryKey(),
    authorId: integer("author_id").notNull(),
    content: text("content").notNull(),
    attachedImage: text("attached_image"),
    visibility: text("visibility").notNull().default('public'),
    likes: integer("likes").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }),

  comments: pgTable("comments", {
    id: serial("id").primaryKey(),
    postId: integer("post_id").notNull(),
    authorId: integer("author_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  }),

  likes: pgTable("likes", {
    id: serial("id").primaryKey(),
    postId: integer("post_id").notNull(),
    userId: integer("user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  }),

  follows: pgTable("follows", {
    id: serial("id").primaryKey(),
    followerId: integer("follower_id").notNull(),
    followeeId: integer("followee_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  }),
};

// Drizzle insert schemas (for type safety and validation)
export const insertUserSchema = createInsertSchema(schema.users);
export const InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof insertUserSchema>;

// Prisma seeding script (optional for production bootstrapping)
const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        password: '$2b$10$hashpasswordhere', // replace with real bcrypt hash
      },
    });
    console.log('Database seeded');
  } catch (e) {
    console.error('Error seeding database:', e);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedDatabase();
}
