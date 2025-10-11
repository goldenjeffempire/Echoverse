import { db } from '../db';
import { sessions } from '@shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { logger } from '../logger';

export interface DeviceSession {
  sessionId: string;
  deviceType?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  lastActivityAt: Date;
  createdAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

export async function getUserActiveSessions(userId: string, currentSessionId?: string): Promise<DeviceSession[]> {
  try {
    const activeSessions = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.userId, userId),
        gte(sessions.expiresAt, new Date())
      ))
      .orderBy(desc(sessions.lastActivityAt));

    return activeSessions.map(session => ({
      sessionId: session.id,
      deviceType: session.deviceType || undefined,
      deviceFingerprint: session.deviceFingerprint || undefined,
      ipAddress: session.ipAddress || undefined,
      userAgent: session.userAgent || undefined,
      lastActivityAt: session.lastActivityAt || session.createdAt!,
      createdAt: session.createdAt!,
      expiresAt: session.expiresAt,
      isCurrent: session.id === currentSessionId,
    }));
  } catch (error) {
    logger.error('Failed to get user active sessions', error instanceof Error ? error : undefined);
    return [];
  }
}

export async function revokeDeviceSession(userId: string, sessionId: string): Promise<boolean> {
  try {
    const result = await db
      .delete(sessions)
      .where(and(
        eq(sessions.id, sessionId),
        eq(sessions.userId, userId)
      ))
      .returning({ id: sessions.id });

    if (result.length > 0) {
      logger.info('Device session revoked', { userId, sessionId });
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Failed to revoke device session', error instanceof Error ? error : undefined);
    return false;
  }
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  try {
    await db
      .update(sessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(sessions.id, sessionId));
  } catch (error) {
    logger.error('Failed to update session activity', error instanceof Error ? error : undefined);
  }
}

export function parseDeviceInfo(userAgent?: string): { deviceType: string; browser?: string; os?: string } {
  if (!userAgent) {
    return { deviceType: 'unknown' };
  }

  const ua = userAgent.toLowerCase();
  let deviceType = 'desktop';
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|windows (phone|ce)|iemobile|mobile safari/i.test(userAgent)) {
    deviceType = 'mobile';
  }

  let browser: string | undefined;
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edge')) browser = 'Edge';

  let os: string | undefined;
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone')) os = 'iOS';

  return { deviceType, browser, os };
}
