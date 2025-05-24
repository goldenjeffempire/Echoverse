// server/db.ts

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@shared/schema';
import ws from 'ws';
import { PrismaClient } from '@prisma/client';

// --- Neon + Drizzle Setup ---

// Use `ws` for Neon WebSocket connections
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// --- Prisma Setup & Utilities ---

const prisma = new PrismaClient();

// Prisma Utility Functions

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } });
}

export async function findUserById(id: string | number) {
  return prisma.user.findUnique({ where: { id: Number(id) } });
}

export async function createUser(data: { username: string; email: string; password: string }) {
  return prisma.user.create({ data });
}

export async function updateUser(id: number, data: any) {
  return prisma.user.update({ where: { id }, data });
}

export async function getUserSubscription(userId: number) {
  return prisma.subscription.findFirst({ where: { userId } });
}

export async function cancelSubscription(userId: number) {
  return prisma.user.update({ 
    where: { id: userId }, 
    data: { stripeSubscriptionId: null } 
  });
}

export default prisma;
