import { createHash, randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import { logger } from '../logger';
import { storage } from '../storage';
import type { WebSocket } from 'ws';

/**
 * Enhanced Session Security Module
 * 
 * Implements:
 * - Session fingerprinting (IP + User-Agent + Accept-Language)
 * - Session fixation defense (regenerate session ID after login)
 * - Session rotation after privilege escalation
 * - Anomaly detection for suspicious activities
 * - Proper invalidation of old sessions across all active connections
 */

// Global registry for session invalidation callbacks
// Used to notify WebSocket server and other components when sessions are invalidated
type SessionInvalidationCallback = (sessionId: string, userId: string, reason: string) => void;
const sessionInvalidationCallbacks: Set<SessionInvalidationCallback> = new Set();

export function registerSessionInvalidationCallback(callback: SessionInvalidationCallback): () => void {
  sessionInvalidationCallbacks.add(callback);
  // Return unregister function
  return () => {
    sessionInvalidationCallbacks.delete(callback);
  };
}

async function notifySessionInvalidation(sessionId: string, userId: string, reason: string): Promise<void> {
  logger.info('Notifying session invalidation', { sessionId: sessionId.substring(0, 8) + '...', userId, reason });
  
  // Notify all registered callbacks (e.g., WebSocket server)
  for (const callback of sessionInvalidationCallbacks) {
    try {
      callback(sessionId, userId, reason);
    } catch (error) {
      logger.error('Session invalidation callback failed', error instanceof Error ? error : undefined);
    }
  }
}

export interface SessionFingerprint {
  hash: string;
  ipAddress: string;
  userAgent: string;
  acceptLanguage?: string;
  createdAt: Date;
}

export interface SessionSecurityMetadata {
  fingerprint: SessionFingerprint;
  privilegeLevel: 'user' | 'moderator' | 'admin';
  lastRotationAt: Date;
  rotationReason?: 'login' | 'privilege_escalation' | 'security_event';
  suspiciousActivityCount: number;
}

/**
 * Generate a device fingerprint from request headers
 * Combines IP, User-Agent, and Accept-Language to create a unique hash
 */
export function generateDeviceFingerprint(req: Request): SessionFingerprint {
  const ipAddress = (req.ip || req.socket.remoteAddress || 'unknown').toString();
  const userAgent = req.get('user-agent') || 'unknown';
  const acceptLanguage = req.get('accept-language') || '';
  const acceptEncoding = req.get('accept-encoding') || '';
  const dnt = req.get('dnt') || '';
  const connection = req.get('connection') || '';
  
  // Create a hash of the fingerprint components including additional headers
  const fingerprintString = `${ipAddress}|${userAgent}|${acceptLanguage}|${acceptEncoding}|${dnt}|${connection}`;
  const hash = createHash('sha256').update(fingerprintString).digest('hex');
  
  return {
    hash,
    ipAddress,
    userAgent,
    acceptLanguage,
    createdAt: new Date()
  };
}

/**
 * Compare two fingerprints to detect potential session hijacking
 * Returns a similarity score (0-100) and flags if suspicious
 */
export function compareFingerprints(
  stored: SessionFingerprint,
  current: SessionFingerprint
): { score: number; suspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];
  let score = 100;
  
  // IP address changed
  if (stored.ipAddress !== current.ipAddress) {
    score -= 40;
    reasons.push('IP address changed');
  }
  
  // User-Agent changed significantly
  if (stored.userAgent !== current.userAgent) {
    // Check if it's just a browser update (minor change)
    const storedUA = stored.userAgent.toLowerCase();
    const currentUA = current.userAgent.toLowerCase();
    
    // Extract browser and OS
    const browserMatch = storedUA.match(/(chrome|firefox|safari|edge)\/([\d.]+)/);
    const currentBrowserMatch = currentUA.match(/(chrome|firefox|safari|edge)\/([\d.]+)/);
    
    if (browserMatch && currentBrowserMatch) {
      if (browserMatch[1] !== currentBrowserMatch[1]) {
        // Different browser entirely
        score -= 50;
        reasons.push('Browser changed completely');
      } else {
        // Same browser, possibly just an update
        score -= 10;
        reasons.push('Browser version updated');
      }
    } else {
      // Completely different UA
      score -= 50;
      reasons.push('User-Agent changed significantly');
    }
  }
  
  // Accept-Language changed
  if (stored.acceptLanguage && current.acceptLanguage && 
      stored.acceptLanguage !== current.acceptLanguage) {
    score -= 10;
    reasons.push('Language preference changed');
  }
  
  // Suspicious if score is too low
  const suspicious = score < 50;
  
  return { score, suspicious, reasons };
}

/**
 * Regenerate session ID to prevent session fixation attacks
 * Called after login or privilege escalation
 * 
 * This function properly invalidates the old session across:
 * - Database storage
 * - Active WebSocket connections
 * - Any other registered session handlers
 */
export async function regenerateSessionId(
  oldSessionId: string,
  userId: string,
  reason: 'login' | 'privilege_escalation' | 'security_event',
  fingerprint: SessionFingerprint
): Promise<string> {
  try {
    // Get old session data
    const oldSession = await storage.getSession(oldSessionId);
    if (!oldSession) {
      throw new Error('Session not found');
    }
    
    // Generate new session ID
    const newSessionId = randomUUID();
    
    logger.info('Session ID regeneration started', {
      userId,
      oldSessionId: oldSessionId.substring(0, 8) + '...',
      newSessionId: newSessionId.substring(0, 8) + '...',
      reason
    });
    
    // CRITICAL: Notify all components BEFORE deleting to ensure clean shutdown
    // This closes WebSocket connections, clears caches, etc.
    await notifySessionInvalidation(oldSessionId, userId, `regeneration: ${reason}`);
    
    // Small delay to allow notifications to propagate
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Delete old session from database
    await storage.deleteSession(oldSessionId);
    
    // Create new session with updated data
    await storage.createSession({
      id: newSessionId,
      userId,
      refreshTokenHash: oldSession.refreshTokenHash || '',
      expiresAt: oldSession.expiresAt
    });
    
    // Note: Additional security metadata (IP, fingerprint) should be stored
    // when the schema is updated to include these fields in updateSession
    
    logger.info('Session ID regeneration completed', {
      userId,
      oldSessionId: oldSessionId.substring(0, 8) + '...',
      newSessionId: newSessionId.substring(0, 8) + '...',
      reason
    });
    
    return newSessionId;
  } catch (error) {
    logger.error('Failed to regenerate session ID', error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Validate session security and detect anomalies
 */
export async function validateSessionSecurity(
  sessionId: string,
  req: Request
): Promise<{ valid: boolean; shouldRotate: boolean; reasons: string[] }> {
  const reasons: string[] = [];
  let valid = true;
  let shouldRotate = false;
  
  try {
    const session = await storage.getSession(sessionId);
    if (!session) {
      return { valid: false, shouldRotate: false, reasons: ['Session not found'] };
    }
    
    // Check if session has expired
    if (new Date() > session.expiresAt) {
      reasons.push('Session expired');
      return { valid: false, shouldRotate: false, reasons };
    }
    
    // Check for inactivity timeout (15 minutes)
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
    if (session.lastActivityAt) {
      const timeSinceActivity = Date.now() - session.lastActivityAt.getTime();
      if (timeSinceActivity > INACTIVITY_TIMEOUT) {
        reasons.push('Session inactive for more than 15 minutes');
        return { valid: false, shouldRotate: false, reasons };
      }
    }
    
    // Generate current fingerprint
    const currentFingerprint = generateDeviceFingerprint(req);
    
    // Compare with stored fingerprint if available
    if (session.deviceFingerprint) {
      const storedFingerprint: SessionFingerprint = {
        hash: session.deviceFingerprint,
        ipAddress: session.ipAddress || '',
        userAgent: session.userAgent || '',
        createdAt: session.createdAt || new Date()
      };
      
      const comparison = compareFingerprints(storedFingerprint, currentFingerprint);
      
      if (comparison.suspicious) {
        reasons.push(...comparison.reasons);
        logger.warn('Suspicious session activity detected', {
          sessionId: sessionId.substring(0, 8) + '...',
          score: comparison.score,
          reasons: comparison.reasons
        });
        
        // In production mode, invalidate suspicious sessions
        if (process.env.NODE_ENV === 'production') {
          valid = false;
          // Log suspicious activity for monitoring
          logger.warn('Invalidating suspicious session', { sessionId });
        }
      }
    }
    
    // Check if session should be rotated based on age
    const rotationInterval = 4 * 60 * 60 * 1000; // 4 hours
    if (session.lastActivityAt && 
        Date.now() - session.lastActivityAt.getTime() > rotationInterval) {
      shouldRotate = true;
      reasons.push('Session rotation interval exceeded');
    }
    
    return { valid, shouldRotate, reasons };
  } catch (error) {
    logger.error('Session validation failed', error instanceof Error ? error : undefined);
    return { valid: false, shouldRotate: false, reasons: ['Validation error'] };
  }
}

/**
 * Rotate session after privilege escalation
 * Should be called when user's role is changed
 */
export async function rotateSessionAfterPrivilegeChange(
  sessionId: string,
  userId: string,
  newRole: 'user' | 'moderator' | 'admin',
  req: Request
): Promise<string> {
  logger.info('Rotating session after privilege escalation', {
    sessionId: sessionId.substring(0, 8) + '...',
    userId,
    newRole
  });
  
  const fingerprint = generateDeviceFingerprint(req);
  return regenerateSessionId(sessionId, userId, 'privilege_escalation', fingerprint);
}

/**
 * Track and log security events
 */
export async function logSecurityEvent(
  sessionId: string,
  userId: string,
  eventType: 'login' | 'logout' | 'privilege_change' | 'suspicious_activity' | 'password_change',
  metadata?: Record<string, unknown>
): Promise<void> {
  logger.info('Security event', {
    sessionId: sessionId ? sessionId.substring(0, 8) + '...' : 'N/A',
    userId,
    eventType,
    metadata,
    timestamp: new Date().toISOString()
  });
  
  // Store security events in database for audit trail
  await storage.createAuditLog({
    userId,
    action: eventType,
    resource: 'session',
    resourceId: sessionId,
    details: metadata,
    ipAddress: metadata?.ipAddress as string,
    userAgent: metadata?.userAgent as string,
    success: true
  });
}

/**
 * Invalidate a session and notify all active connections
 * Used for forced logout, security events, etc.
 */
export async function invalidateSession(
  sessionId: string,
  userId: string,
  reason: string
): Promise<void> {
  logger.info('Invalidating session', { sessionId: sessionId.substring(0, 8) + '...', userId, reason });
  
  // Notify all components before deletion
  await notifySessionInvalidation(sessionId, userId, reason);
  
  // Small delay to allow notifications to propagate
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Delete from database
  await storage.deleteSession(sessionId);
  
  logger.info('Session invalidated successfully', { sessionId: sessionId.substring(0, 8) + '...', userId });
}

/**
 * Invalidate all sessions for a user
 * Used when password changes or account is compromised
 */
export async function invalidateAllUserSessions(
  userId: string,
  reason: string,
  exceptSessionId?: string
): Promise<void> {
  logger.info('Invalidating all user sessions', { userId, reason, exceptSessionId: exceptSessionId?.substring(0, 8) + '...' });
  
  // Get all user sessions
  const sessions = await storage.getUserSessions(userId);
  
  // Invalidate each session (except the optional exception)
  for (const session of sessions) {
    if (exceptSessionId && session.id === exceptSessionId) {
      continue; // Keep this session active (e.g., current session after password change)
    }
    
    await notifySessionInvalidation(session.id, userId, reason);
  }
  
  // Small delay to allow notifications to propagate
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Delete from database
  if (exceptSessionId) {
    // Delete all except the current session
    for (const session of sessions) {
      if (session.id !== exceptSessionId) {
        await storage.deleteSession(session.id);
      }
    }
  } else {
    // Delete all sessions
    await storage.deleteUserSessions(userId);
  }
  
  logger.info('All user sessions invalidated', { userId, count: sessions.length });
}

/**
 * Configure session cookie with security best practices
 * Uses __Host- prefix in production for enhanced security
 * 
 * __Host- prefix requirements:
 * - Must be set with Secure flag
 * - Must be set from a secure (HTTPS) origin
 * - Must have path=/
 * - Must NOT have Domain attribute
 */
export function getSecureSessionCookieConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: 'strict' as const, // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    // __Host- prefix cookies cannot have a Domain attribute
    domain: undefined
  };
}

/**
 * Get the appropriate cookie name with security prefix
 * Uses __Host- prefix in production for enhanced security
 */
export function getSessionCookieName(cookieBaseName: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? `__Host-${cookieBaseName}` : cookieBaseName;
}

/**
 * TLS Fingerprinting for Session Binding
 * 
 * While true TLS channel binding (RFC 5929) requires access to TLS finished messages,
 * we can implement a practical alternative using TLS connection characteristics:
 * - TLS version
 * - Cipher suite
 * - Client certificate fingerprint (if mTLS is used)
 * 
 * This provides defense-in-depth against session hijacking even over TLS
 */
export function generateTlsFingerprint(req: Request): string | null {
  try {
    // Access TLS socket information if available
    const socket = (req as { socket?: { encrypted?: boolean; getProtocol?: () => string; getCipher?: () => { name?: string }; getPeerCertificate?: () => { fingerprint?: string } } }).socket;
    const tlsSocket = socket?.encrypted ? socket : null;
    
    if (!tlsSocket) {
      // Not a TLS connection (e.g., development)
      return null;
    }
    
    const fingerprint: string[] = [];
    
    // TLS version
    if (tlsSocket.getProtocol) {
      fingerprint.push(tlsSocket.getProtocol());
    }
    
    // Cipher suite
    if (tlsSocket.getCipher) {
      const cipher = tlsSocket.getCipher();
      if (cipher?.name) {
        fingerprint.push(cipher.name);
      }
    }
    
    // Client certificate (if mTLS)
    if (tlsSocket.getPeerCertificate) {
      const cert = tlsSocket.getPeerCertificate();
      if (cert?.fingerprint) {
        fingerprint.push(cert.fingerprint);
      }
    }
    
    // Return null if no TLS information available
    if (fingerprint.length === 0) {
      return null;
    }
    
    // Create hash of fingerprint components
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(fingerprint.join('::')).digest('hex');
  } catch (error) {
    // Fail securely - don't expose errors
    return null;
  }
}

/**
 * Validate session TLS binding
 * Returns true if binding matches or if TLS binding is not available
 */
export function validateTlsBinding(
  req: Request,
  sessionTlsFingerprint: string | null
): { valid: boolean; reason?: string } {
  // If no TLS fingerprint was stored (e.g., development), skip validation
  if (!sessionTlsFingerprint) {
    return { valid: true };
  }
  
  const currentFingerprint = generateTlsFingerprint(req);
  
  // If we can't generate a current fingerprint but one was stored, this is suspicious
  if (!currentFingerprint) {
    return { 
      valid: false, 
      reason: 'TLS fingerprint mismatch: current connection not using TLS' 
    };
  }
  
  // Compare fingerprints
  if (currentFingerprint !== sessionTlsFingerprint) {
    return { 
      valid: false, 
      reason: 'TLS fingerprint mismatch: connection characteristics changed' 
    };
  }
  
  return { valid: true };
}

/**
 * Implement SameSite=Strict for CSRF protection
 */
export function setSecureCookie(
  res: Response,
  name: string,
  value: string,
  options?: Partial<ReturnType<typeof getSecureSessionCookieConfig>>
): void {
  const config = {
    ...getSecureSessionCookieConfig(),
    ...options
  };
  
  res.cookie(name, value, config);
}
