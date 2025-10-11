import { randomUUID } from 'crypto';
import { db } from '../db';
import { magicLinkTokens } from '@shared/schema';
import { eq, and, gte } from 'drizzle-orm';
import { logger } from '../logger';

const MAGIC_LINK_EXPIRY_MINUTES = 15;

export async function createMagicLink(userId: string, email: string, ipAddress?: string): Promise<string> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(magicLinkTokens).values({
    token,
    userId,
    email,
    expiresAt,
    ipAddress,
    used: false,
  });

  logger.info('Magic link created', { userId, email });
  return token;
}

export async function validateMagicLink(token: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
  try {
    const result = await db
      .select()
      .from(magicLinkTokens)
      .where(and(
        eq(magicLinkTokens.token, token),
        eq(magicLinkTokens.used, false),
        gte(magicLinkTokens.expiresAt, new Date())
      ))
      .limit(1);

    if (result.length === 0) {
      return { valid: false, error: 'Invalid or expired magic link' };
    }

    return { valid: true, userId: result[0].userId };
  } catch (error) {
    logger.error('Magic link validation failed', error instanceof Error ? error : undefined);
    return { valid: false, error: 'Validation failed' };
  }
}

export async function useMagicLink(token: string): Promise<void> {
  await db
    .update(magicLinkTokens)
    .set({ used: true, usedAt: new Date() })
    .where(eq(magicLinkTokens.token, token));
}

export async function cleanupExpiredMagicLinks(): Promise<number> {
  const result = await db
    .delete(magicLinkTokens)
    .where(and(
      eq(magicLinkTokens.used, true),
      gte(magicLinkTokens.expiresAt, new Date())
    ))
    .returning({ id: magicLinkTokens.id });

  return result.length;
}
