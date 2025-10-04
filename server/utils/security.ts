/**
 * Security Utilities
 * 
 * Provides timing-safe comparisons, crypto helpers, and security validation functions
 */

import { timingSafeEqual, randomBytes, createHash, createHmac } from 'crypto';

/**
 * Timing-safe string comparison to prevent timing attacks
 * Pads strings to same length before comparison
 */
export function timingSafeStringCompare(a: string, b: string): boolean {
  try {
    // Ensure both strings are non-empty
    if (!a || !b) {
      return false;
    }

    // Convert to buffers with consistent encoding
    const bufferA = Buffer.from(a, 'utf8');
    const bufferB = Buffer.from(b, 'utf8');
    
    // If lengths don't match, pad the shorter one with its hash
    // This prevents length-based timing attacks while maintaining constant time
    const maxLength = Math.max(bufferA.length, bufferB.length);
    
    const paddedA = Buffer.alloc(maxLength);
    const paddedB = Buffer.alloc(maxLength);
    
    bufferA.copy(paddedA);
    bufferB.copy(paddedB);
    
    // Fill remaining bytes with deterministic data to maintain timing consistency
    if (bufferA.length < maxLength) {
      const hashA = createHash('sha256').update(bufferA).digest();
      hashA.copy(paddedA, bufferA.length, 0, maxLength - bufferA.length);
    }
    
    if (bufferB.length < maxLength) {
      const hashB = createHash('sha256').update(bufferB).digest();
      hashB.copy(paddedB, bufferB.length, 0, maxLength - bufferB.length);
    }
    
    // Perform constant-time comparison
    return timingSafeEqual(paddedA, paddedB);
  } catch (error) {
    // If any error occurs, fail securely
    return false;
  }
}

/**
 * Timing-safe CSRF token comparison
 */
export function verifyCsrfToken(expected: string, provided: string): boolean {
  if (!expected || !provided) {
    return false;
  }
  
  return timingSafeStringCompare(expected, provided);
}

/**
 * Validate URI scheme to prevent XSS attacks via dangerous schemes
 */
export function isValidUriScheme(uri: string): boolean {
  if (!uri || typeof uri !== 'string') {
    return false;
  }
  
  // Dangerous schemes that should be blocked
  const dangerousSchemes = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
    'blob:',
  ];
  
  const lowerUri = uri.trim().toLowerCase();
  
  // Check for dangerous schemes
  for (const scheme of dangerousSchemes) {
    if (lowerUri.startsWith(scheme)) {
      return false;
    }
  }
  
  // Check for encoded dangerous schemes
  const decoded = decodeURIComponent(lowerUri);
  for (const scheme of dangerousSchemes) {
    if (decoded.startsWith(scheme)) {
      return false;
    }
  }
  
  // Allow only http, https, mailto, tel, and relative URLs
  const allowedSchemes = /^(https?:\/\/|mailto:|tel:|\/|\.\/|\.\.\/|#)/i;
  if (lowerUri.includes(':') && !allowedSchemes.test(lowerUri)) {
    return false;
  }
  
  return true;
}

/**
 * Enhanced HTML entity encoding to prevent XSS
 */
export function encodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  const entityMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  
  return text.replace(/[&<>"'`=\/]/g, (char) => entityMap[char] || char);
}

/**
 * Sanitize event handler attributes from strings
 */
export function sanitizeEventHandlers(text: string): string {
  if (!text) return '';
  
  // Remove all event handler attributes (on*)
  const eventHandlerPattern = /\s*on\w+\s*=\s*["'][^"']*["']/gi;
  let sanitized = text.replace(eventHandlerPattern, '');
  
  // Also remove event handlers without quotes
  const eventHandlerPattern2 = /\s*on\w+\s*=\s*[^\s>]*/gi;
  sanitized = sanitized.replace(eventHandlerPattern2, '');
  
  return sanitized;
}

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate a CSRF token for double-submit cookie pattern
 */
export function generateCsrfToken(): string {
  return generateSecureToken(32);
}

/**
 * Hash data with SHA-256 (one-way)
 */
export function hashData(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Generate HMAC signature
 */
export function generateHmacSignature(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verify HMAC signature with timing-safe comparison
 */
export function verifyHmacSignature(data: string, signature: string, secret: string): boolean {
  const expected = generateHmacSignature(data, secret);
  return timingSafeStringCompare(expected, signature);
}

/**
 * Validate password strength
 * Returns object with validation results and specific failures
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { valid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty', 'abc123',
    'letmein', 'welcome', 'monkey', '1234567890', 'password1'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate a device fingerprint from request data
 */
export function generateDeviceFingerprint(ipAddress: string, userAgent: string): string {
  const data = `${ipAddress}-${userAgent}`;
  return hashData(data);
}

/**
 * Check if IP address has changed (for session hijacking detection)
 */
export function detectIpChange(
  sessionIp: string | null,
  currentIp: string,
  strictMode: boolean = false
): boolean {
  if (!sessionIp) {
    return false; // No IP recorded yet
  }
  
  if (strictMode) {
    // Strict mode: exact match required
    return sessionIp !== currentIp;
  }
  
  // Lenient mode: allow same subnet (useful for mobile networks)
  // Compare first 3 octets for IPv4
  const sessionParts = sessionIp.split('.');
  const currentParts = currentIp.split('.');
  
  if (sessionParts.length === 4 && currentParts.length === 4) {
    // IPv4 comparison - allow same /24 subnet
    return !(
      sessionParts[0] === currentParts[0] &&
      sessionParts[1] === currentParts[1] &&
      sessionParts[2] === currentParts[2]
    );
  }
  
  // For IPv6 or other formats, require exact match
  return sessionIp !== currentIp;
}

/**
 * Check if User-Agent has changed significantly
 */
export function detectUserAgentChange(
  sessionUserAgent: string | null,
  currentUserAgent: string
): boolean {
  if (!sessionUserAgent) {
    return false; // No UA recorded yet
  }
  
  // Normalize both user agents
  const normalizeUA = (ua: string) => ua.toLowerCase().replace(/\s+/g, ' ').trim();
  
  const sessionUA = normalizeUA(sessionUserAgent);
  const currentUA = normalizeUA(currentUserAgent);
  
  // Exact match is ideal
  if (sessionUA === currentUA) {
    return false;
  }
  
  // Extract browser and OS for comparison (allow minor version changes)
  const extractBrowserOS = (ua: string) => {
    const browser = ua.match(/(chrome|firefox|safari|edge|opera)\/[\d.]+/i)?.[0] || '';
    const os = ua.match(/(windows|mac|linux|android|ios)[\s\d._]*/i)?.[0] || '';
    return `${browser}-${os}`.toLowerCase();
  };
  
  const sessionSignature = extractBrowserOS(sessionUA);
  const currentSignature = extractBrowserOS(currentUA);
  
  // If core browser/OS changed, flag as suspicious
  return sessionSignature !== currentSignature;
}

/**
 * Rate limit key generator for different contexts
 */
export function generateRateLimitKey(
  prefix: string,
  identifier: string,
  ipAddress?: string
): string {
  if (ipAddress) {
    return `${prefix}:${identifier}:${ipAddress}`;
  }
  return `${prefix}:${identifier}`;
}

/**
 * Sanitize file name to prevent directory traversal
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return 'unnamed';
  
  // Remove path components
  let sanitized = fileName.replace(/^.*[\\\/]/, '');
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Prevent hidden files
  if (sanitized.startsWith('.')) {
    sanitized = '_' + sanitized;
  }
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }
  
  return sanitized || 'unnamed';
}

/**
 * Validate file signature (magic numbers)
 */
export function validateFileSignature(
  buffer: Buffer,
  expectedMimeType: string
): boolean {
  if (!buffer || buffer.length < 4) {
    return false;
  }
  
  // Common file signatures (magic numbers)
  const signatures: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // Note: bytes 8-11 should be 'WEBP'
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
    'application/zip': [[0x50, 0x4B, 0x03, 0x04]],
  };
  
  const expectedSigs = signatures[expectedMimeType];
  if (!expectedSigs) {
    return true; // Unknown type, can't validate
  }
  
  // Check if buffer starts with any of the expected signatures
  return expectedSigs.some(sig => 
    sig.every((byte, index) => buffer[index] === byte)
  );
}
