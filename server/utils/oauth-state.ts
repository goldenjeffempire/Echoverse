import crypto from 'crypto';
import { logger } from '../logger';

// Store for OAuth state tokens (in production, use Redis)
const stateStore = new Map<string, { createdAt: number; returnUrl?: string }>();

// Cleanup interval for expired states
const STATE_TTL = 10 * 60 * 1000; // 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.createdAt > STATE_TTL) {
      stateStore.delete(state);
    }
  }
}, 60000); // Clean up every minute

// PHASE 1: OAuth redirect URL whitelist
const OAUTH_REDIRECT_WHITELIST = [
  process.env.APP_URL || 'http://localhost:5000',
  'http://localhost:5000',
  'http://localhost:3000',
  // Add production domains from env
  ...(process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || []),
];

/**
 * Validate OAuth redirect URL against whitelist
 * PHASE 1 CRITICAL SECURITY: Now checks full URL path, not just origin
 */
function validateOAuthRedirectUrl(url: string | undefined): boolean {
  if (!url) return true; // No URL is valid (will use default)
  
  try {
    const parsedUrl = new URL(url);
    
    // SECURITY: Reject dangerous protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      logger.warn('OAuth redirect URL has invalid protocol', { url, protocol: parsedUrl.protocol });
      return false;
    }
    
    // SECURITY: Reject URLs with credentials (user:pass@domain)
    if (parsedUrl.username || parsedUrl.password) {
      logger.warn('OAuth redirect URL contains credentials', { url });
      return false;
    }
    
    // Check if the full URL (origin + pathname) matches whitelist
    return OAUTH_REDIRECT_WHITELIST.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        
        // PHASE 1 FIX: Check both origin AND path, not just origin
        // Origin must match exactly
        if (parsedUrl.origin !== allowedUrl.origin) {
          return false;
        }
        
        // Path validation: must start with allowed path or be more specific
        // If allowedUrl has a path, redirect must be under that path
        const allowedPath = allowedUrl.pathname.replace(/\/$/, ''); // Remove trailing slash
        const redirectPath = parsedUrl.pathname.replace(/\/$/, ''); // Remove trailing slash
        
        // Allow exact match or subpaths
        if (allowedPath === '' || allowedPath === '/') {
          // Whitelist allows all paths on this origin
          return true;
        }
        
        // Redirect path must start with allowed path
        if (!redirectPath.startsWith(allowedPath)) {
          logger.warn('OAuth redirect path not under allowed path', { 
            redirectPath, 
            allowedPath 
          });
          return false;
        }
        
        return true;
      } catch {
        return false;
      }
    });
  } catch {
    // Invalid URL
    logger.warn('Invalid OAuth redirect URL', { url });
    return false;
  }
}

/**
 * Generate OAuth state parameter for CSRF protection
 * @param returnUrl Optional URL to return to after OAuth flow
 * @returns Base64-encoded state parameter
 */
export function generateOAuthState(returnUrl?: string): string {
  // PHASE 1: Validate redirect URL against whitelist
  if (returnUrl && !validateOAuthRedirectUrl(returnUrl)) {
    logger.error('OAuth redirect URL not in whitelist', new Error('Invalid redirect URL'), { returnUrl });
    throw new Error('Invalid OAuth redirect URL - not in allowed list');
  }
  
  // P0 ISSUE #12 FIX: OAuth state parameter 256-bit for cryptographic security (32 bytes = 256 bits)
  const randomBytes = crypto.randomBytes(32); // 256-bit
  const state = randomBytes.toString('base64url');
  
  stateStore.set(state, {
    createdAt: Date.now(),
    returnUrl,
  });
  
  logger.debug('OAuth state generated', { state: state.substring(0, 8) + '...' });
  return state;
}

/**
 * Validate OAuth state parameter
 * @param state State parameter from OAuth callback
 * @returns Validation result with optional return URL
 */
export function validateOAuthState(state: string): {
  valid: boolean;
  returnUrl?: string;
  error?: string;
} {
  if (!state) {
    logger.warn('OAuth state validation failed: missing state');
    return { valid: false, error: 'Missing state parameter' };
  }

  const stateData = stateStore.get(state);
  
  if (!stateData) {
    logger.warn('OAuth state validation failed: invalid or expired state', {
      state: state.substring(0, 8) + '...',
    });
    return { valid: false, error: 'Invalid or expired state parameter' };
  }

  // Check if state is expired
  const age = Date.now() - stateData.createdAt;
  if (age > STATE_TTL) {
    stateStore.delete(state);
    logger.warn('OAuth state validation failed: expired state', {
      state: state.substring(0, 8) + '...',
      age,
    });
    return { valid: false, error: 'Expired state parameter' };
  }

  // Valid state - remove it (one-time use)
  stateStore.delete(state);
  
  logger.debug('OAuth state validated successfully', {
    state: state.substring(0, 8) + '...',
  });
  
  return {
    valid: true,
    returnUrl: stateData.returnUrl,
  };
}

/**
 * Clear all stored states (for testing or cleanup)
 */
export function clearOAuthStates(): void {
  stateStore.clear();
  logger.debug('All OAuth states cleared');
}
