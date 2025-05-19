import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { drizzle } from 'drizzle-orm/node-postgres';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
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

  // NEW: follows table for follower/followee relationship
  follows: pgTable("follows", {
    id: serial("id").primaryKey(),
    followerId: integer("follower_id").notNull(),  // user who follows
    followeeId: integer("followee_id").notNull(),  // user being followed
    createdAt: timestamp("created_at").defaultNow(),
  }),
};

export * from '../../shared/schema';
