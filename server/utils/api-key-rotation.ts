/**
 * API Key Rotation Mechanism
 * PHASE A: Critical Security - Implement API key rotation with 90-day expiry
 */

import crypto from 'crypto';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { logger } from '../logger';

export interface APIKey {
  id: string;
  userId: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
  expiresAt: Date;
  lastUsedAt: Date | null;
  createdAt: Date;
  rotatedFrom: string | null;
}

const KEY_EXPIRY_DAYS = 90;
const KEY_PREFIX_LENGTH = 8;

export async function initializeAPIKeysTable(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS api_keys (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      key_hash VARCHAR(64) NOT NULL,
      key_prefix VARCHAR(16) NOT NULL,
      name VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      last_used_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      rotated_from VARCHAR(36),
      INDEX idx_user_id (user_id),
      INDEX idx_key_hash (key_hash),
      INDEX idx_expires_at (expires_at)
    )
  `);
}

export function generateAPIKey(): { key: string; hash: string; prefix: string } {
  const key = `sk_${crypto.randomBytes(32).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const prefix = key.slice(0, KEY_PREFIX_LENGTH);
  
  return { key, hash, prefix };
}

export async function createAPIKey(
  userId: string,
  name: string
): Promise<{ key: string; apiKey: APIKey }> {
  const { key, hash, prefix } = generateAPIKey();
  const expiresAt = new Date(Date.now() + KEY_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  
  const result = await db.execute(sql`
    INSERT INTO api_keys (id, user_id, key_hash, key_prefix, name, expires_at, created_at)
    VALUES (
      ${crypto.randomUUID()},
      ${userId},
      ${hash},
      ${prefix},
      ${name},
      ${expiresAt},
      NOW()
    )
    RETURNING *
  `);
  
  const apiKey = result.rows[0] as any;
  
  logger.info('API key created', { 
    userId, 
    keyPrefix: prefix,
    expiresAt 
  });
  
  return { 
    key, 
    apiKey: {
      id: apiKey.id,
      userId: apiKey.user_id,
      keyHash: apiKey.key_hash,
      keyPrefix: apiKey.key_prefix,
      name: apiKey.name,
      expiresAt: apiKey.expires_at,
      lastUsedAt: apiKey.last_used_at,
      createdAt: apiKey.created_at,
      rotatedFrom: apiKey.rotated_from
    }
  };
}

export async function rotateAPIKey(
  oldKeyId: string,
  userId: string
): Promise<{ key: string; apiKey: APIKey }> {
  const oldKey = await db.execute(sql`
    SELECT * FROM api_keys WHERE id = ${oldKeyId} AND user_id = ${userId}
  `);
  
  if (!oldKey.rows || oldKey.rows.length === 0) {
    throw new Error('API key not found');
  }
  
  const oldKeyData = oldKey.rows[0] as any;
  const { key, hash, prefix } = generateAPIKey();
  const expiresAt = new Date(Date.now() + KEY_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  
  const result = await db.execute(sql`
    INSERT INTO api_keys (id, user_id, key_hash, key_prefix, name, expires_at, created_at, rotated_from)
    VALUES (
      ${crypto.randomUUID()},
      ${userId},
      ${hash},
      ${prefix},
      ${oldKeyData.name + ' (Rotated)'},
      ${expiresAt},
      NOW(),
      ${oldKeyId}
    )
    RETURNING *
  `);
  
  await db.execute(sql`
    UPDATE api_keys 
    SET expires_at = NOW() 
    WHERE id = ${oldKeyId}
  `);
  
  const apiKey = result.rows[0] as any;
  
  logger.info('API key rotated', {
    userId,
    oldKeyId,
    newKeyId: apiKey.id,
    expiresAt
  });
  
  return {
    key,
    apiKey: {
      id: apiKey.id,
      userId: apiKey.user_id,
      keyHash: apiKey.key_hash,
      keyPrefix: apiKey.key_prefix,
      name: apiKey.name,
      expiresAt: apiKey.expires_at,
      lastUsedAt: apiKey.last_used_at,
      createdAt: apiKey.created_at,
      rotatedFrom: apiKey.rotated_from
    }
  };
}

export async function verifyAPIKey(key: string): Promise<APIKey | null> {
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  
  const result = await db.execute(sql`
    SELECT * FROM api_keys 
    WHERE key_hash = ${hash} 
    AND expires_at > NOW()
  `);
  
  if (!result.rows || result.rows.length === 0) {
    return null;
  }
  
  const apiKey = result.rows[0] as any;
  
  await db.execute(sql`
    UPDATE api_keys 
    SET last_used_at = NOW() 
    WHERE id = ${apiKey.id}
  `);
  
  return {
    id: apiKey.id,
    userId: apiKey.user_id,
    keyHash: apiKey.key_hash,
    keyPrefix: apiKey.key_prefix,
    name: apiKey.name,
    expiresAt: apiKey.expires_at,
    lastUsedAt: new Date(),
    createdAt: apiKey.created_at,
    rotatedFrom: apiKey.rotated_from
  };
}

export async function checkExpiringKeys(daysThreshold: number = 7): Promise<APIKey[]> {
  const threshold = new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000);
  
  const result = await db.execute(sql`
    SELECT * FROM api_keys 
    WHERE expires_at > NOW() 
    AND expires_at < ${threshold}
    ORDER BY expires_at ASC
  `);
  
  return (result.rows || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    keyHash: row.key_hash,
    keyPrefix: row.key_prefix,
    name: row.name,
    expiresAt: row.expires_at,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    rotatedFrom: row.rotated_from
  }));
}

export async function cleanupExpiredKeys(): Promise<number> {
  const result = await db.execute(sql`
    DELETE FROM api_keys 
    WHERE expires_at < NOW() - INTERVAL '30 days'
    RETURNING id
  `);
  
  const count = result.rows?.length || 0;
  if (count > 0) {
    logger.info('Cleaned up expired API keys', { count });
  }
  
  return count;
}
