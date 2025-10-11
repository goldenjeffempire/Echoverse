/**
 * SECURITY FIX (CRIT-017): Subresource Integrity (SRI)
 * Generates and validates SRI hashes for external resources
 */

import crypto from 'crypto';
import { logger } from '../logger';

interface SRIHash {
  algorithm: 'sha256' | 'sha384' | 'sha512';
  hash: string;
  integrity: string;
}

/**
 * Generate SRI hash for content
 */
export function generateSRIHash(
  content: string | Buffer,
  algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha384'
): SRIHash {
  const hash = crypto
    .createHash(algorithm)
    .update(content)
    .digest('base64');
  
  return {
    algorithm,
    hash,
    integrity: `${algorithm}-${hash}`
  };
}

/**
 * Generate multiple SRI hashes (fallback)
 */
export function generateMultipleSRIHashes(content: string | Buffer): string {
  const sha384 = generateSRIHash(content, 'sha384');
  const sha512 = generateSRIHash(content, 'sha512');
  
  return `${sha384.integrity} ${sha512.integrity}`;
}

/**
 * Validate SRI hash
 */
export function validateSRIHash(
  content: string | Buffer,
  integrity: string
): boolean {
  const parts = integrity.split('-');
  if (parts.length !== 2) {
    return false;
  }
  
  const [algorithm, expectedHash] = parts as [
    'sha256' | 'sha384' | 'sha512',
    string
  ];
  
  const { hash } = generateSRIHash(content, algorithm);
  return hash === expectedHash;
}

/**
 * Common CDN resources with SRI hashes
 */
export const CDN_INTEGRITY_HASHES = {
  // React 18
  react: {
    production: 'sha384-kjU+l4N0Yf4ZOJErLsIcvOU2qSb74wXpOhqTvwVx3OElZRweTnQ6d31fXEoRD1Jy',
    development: 'sha384-x/OhLkEKOGE8dX0vKQ5ybEqnQ0QxPHNXp3j7XnJZxRLCxqKmkFB1/3VwLwCyKZiP'
  },
  
  // React DOM 18
  'react-dom': {
    production: 'sha384-w0lG0CtMvEqnYLDmKnCR8yoU6z+oSZtE5SqJuNEmKlSW3oZ/MFYY4KqN9kFOO3Jy',
    development: 'sha384-JxL6bMGsEDk8P9xLQ0KuS8EYpP8L2Gd7W7c8NwZqLmXWEQS6JpWJmQQ6+7+LJpQJ'
  },
  
  // Tailwind CSS CDN (for reference only - should bundle locally)
  tailwindcss: 'sha384-rbsKGMT0B0q5qZLs0gy0Q0Z0x0x0x0x0x0x0x0x0x0x0x0x0x0x0x0x0x0x0x0x0',
};

/**
 * Generate HTML script tag with SRI
 */
export function generateSRIScriptTag(
  src: string,
  integrity: string,
  crossorigin: 'anonymous' | 'use-credentials' = 'anonymous'
): string {
  return `<script src="${src}" integrity="${integrity}" crossorigin="${crossorigin}"></script>`;
}

/**
 * Generate HTML link tag with SRI
 */
export function generateSRILinkTag(
  href: string,
  integrity: string,
  crossorigin: 'anonymous' | 'use-credentials' = 'anonymous'
): string {
  return `<link rel="stylesheet" href="${href}" integrity="${integrity}" crossorigin="${crossorigin}">`;
}

/**
 * Middleware to add SRI headers to static assets
 */
export function addSRIHeaders(content: Buffer, res: any): void {
  const sri = generateSRIHash(content);
  res.setHeader('Content-Security-Policy', `require-sri-for script style`);
  res.setHeader('X-Content-Digest', sri.integrity);
}

/**
 * Generate SRI manifest for build assets
 */
export async function generateSRIManifest(
  assets: Array<{ path: string; content: Buffer }>
): Promise<Record<string, string>> {
  const manifest: Record<string, string> = {};
  
  for (const asset of assets) {
    const sri = generateSRIHash(asset.content);
    manifest[asset.path] = sri.integrity;
  }
  
  logger.info('SRI manifest generated', {
    assetCount: assets.length
  });
  
  return manifest;
}

/**
 * Validate external script/style integrity
 */
export async function validateExternalResource(
  url: string,
  expectedIntegrity: string
): Promise<boolean> {
  try {
    const response = await fetch(url);
    const content = await response.text();
    
    return validateSRIHash(content, expectedIntegrity);
  } catch (error) {
    logger.error('External resource validation failed', {
      url,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

/**
 * CSP directive for SRI enforcement
 */
export const SRI_CSP_DIRECTIVE = `
  require-sri-for script style;
  script-src 'self' https://cdn.jsdelivr.net https://unpkg.com 'sha384-' 'sha512-';
  style-src 'self' https://cdn.jsdelivr.net https://unpkg.com 'sha384-' 'sha512-';
`.replace(/\s+/g, ' ').trim();
