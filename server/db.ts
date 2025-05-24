// server/db.ts

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@shared/schema';
import ws from 'ws';
import { PrismaClient, User } from '@prisma/client';

// --- Neon + Drizzle Setup ---

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });

// --- Prisma Setup ---

const prisma = new PrismaClient();

// --- User Management Utilities ---

export async function findUserById(id: string | number) {
  return prisma.user.findUnique({
    where: { id: Number(id) },
  });
}

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function createUser(data: {
  username: string;
  email: string;
  password: string;
}) {
  return prisma.user.create({
    data,
  });
}

export async function updateUser(
  id: number,
  data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

export async function updateUserVerification(id: number, isVerified: boolean) {
  return prisma.user.update({
    where: { id },
    data: { isVerified },
  });
}

export async function updatePassword(id: number, hashedPassword: string) {
  return prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });
}

// --- Subscription Utilities ---

export async function getUserSubscription(userId: number) {
  return prisma.subscription.findFirst({
    where: { userId },
  });
}

export async function cancelSubscription(userId: number) {
  return prisma.user.update({
    where: { id: userId },
    data: { stripeSubscriptionId: null },
  });
}

// --- Optional: Seed Helper (if you want to seed easily later) ---

export async function seedAdminUser() {
  const existing = await findUserByEmail("admin@example.com");
  if (existing) return;

  await createUser({
    username: "admin",
    email: "admin@example.com",
    password: "hashed-password-here",
  });
}

export default prisma;
