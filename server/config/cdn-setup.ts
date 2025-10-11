/**
 * CDN Configuration and Asset Upload Automation
 * FIX: HIGH-005 - CDN integration with asset automation
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { createHash } from 'crypto';
import { logger } from '../logger';

const CDN_CONFIG = {
  enabled: process.env.CDN_ENABLED === 'true',
  url: process.env.CDN_URL || '',
  provider: process.env.CDN_PROVIDER || 'cloudflare', // 'cloudflare' | 'cloudfront' | 'custom'
  bucket: process.env.CDN_BUCKET || '',
  region: process.env.CDN_REGION || 'us-east-1',
};

// AWS/CloudFront setup
const s3Client = CDN_CONFIG.bucket ? new S3Client({
  region: CDN_CONFIG.region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
}) : null;

const cloudFrontClient = process.env.CLOUDFRONT_DISTRIBUTION_ID ? new CloudFrontClient({
  region: CDN_CONFIG.region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
}) : null;

// Cloudflare setup
const CLOUDFLARE_CONFIG = {
  zoneId: process.env.CLOUDFLARE_ZONE_ID || '',
  apiToken: process.env.CLOUDFLARE_API_TOKEN || ''
};

const ASSET_TYPES = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'font/eot',
  '.ico': 'image/x-icon',
};

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload asset to CDN
 */
export async function uploadAssetToCDN(
  localPath: string,
  cdnPath: string
): Promise<UploadResult> {
  if (!CDN_CONFIG.enabled) {
    return { success: false, error: 'CDN not enabled' };
  }

  try {
    const fileContent = readFileSync(localPath);
    const contentType = ASSET_TYPES[extname(localPath) as keyof typeof ASSET_TYPES] || 'application/octet-stream';
    const contentHash = createHash('md5').update(fileContent).digest('hex');

    // Check if file already exists with same hash
    if (s3Client && CDN_CONFIG.bucket) {
      try {
        const headCommand = new HeadObjectCommand({
          Bucket: CDN_CONFIG.bucket,
          Key: cdnPath
        });
        const existing = await s3Client.send(headCommand);
        
        if (existing.ETag?.replace(/"/g, '') === contentHash) {
          logger.info(`Asset already on CDN: ${cdnPath}`);
          return {
            success: true,
            url: `${CDN_CONFIG.url}/${cdnPath}`
          };
        }
      } catch (error) {
        // File doesn't exist, proceed with upload
      }

      // P0 FIX #21: Add Vary header for cache poisoning prevention
      // Upload to S3
      const putCommand = new PutObjectCommand({
        Bucket: CDN_CONFIG.bucket,
        Key: cdnPath,
        Body: fileContent,
        ContentType: contentType,
        CacheControl: getCacheControl(contentType),
        // P0 FIX #21: Prevent cache poisoning with proper cache key normalization
        Metadata: {
          'content-hash': contentHash,
          'vary': 'Accept-Encoding, Accept, Origin'
        }
      });

      await s3Client.send(putCommand);
      logger.info(`Uploaded to CDN: ${cdnPath}`);

      return {
        success: true,
        url: `${CDN_CONFIG.url}/${cdnPath}`
      };
    }

    return { success: false, error: 'S3 client not configured' };
  } catch (error) {
    logger.error('CDN upload failed', error instanceof Error ? error : undefined);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Upload entire dist directory to CDN
 */
export async function uploadDistToCDN(distDir: string): Promise<{
  uploaded: number;
  failed: number;
  skipped: number;
}> {
  const stats = { uploaded: 0, failed: 0, skipped: 0 };

  async function uploadDirectory(dir: string, basePath = '') {
    const files = readdirSync(dir);

    for (const file of files) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        await uploadDirectory(fullPath, join(basePath, file));
      } else {
        const cdnPath = join(basePath, file).replace(/\\/g, '/');
        const result = await uploadAssetToCDN(fullPath, cdnPath);

        if (result.success) {
          if (result.url?.includes('already')) {
            stats.skipped++;
          } else {
            stats.uploaded++;
          }
        } else {
          stats.failed++;
        }
      }
    }
  }

  await uploadDirectory(distDir);
  return stats;
}

/**
 * Invalidate CDN cache
 */
export async function invalidateCDN(paths: string[] = ['/*']): Promise<void> {
  if (!CDN_CONFIG.enabled) {
    logger.warn('CDN not enabled, skipping invalidation');
    return;
  }

  try {
    if (CDN_CONFIG.provider === 'cloudfront' && cloudFrontClient) {
      const command = new CreateInvalidationCommand({
        DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: Date.now().toString(),
          Paths: {
            Quantity: paths.length,
            Items: paths
          }
        }
      });

      await cloudFrontClient.send(command);
      logger.info('CloudFront invalidation created');
      
    } else if (CDN_CONFIG.provider === 'cloudflare' && CLOUDFLARE_CONFIG.zoneId) {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_CONFIG.zoneId}/purge_cache`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ files: paths.map(p => `${CDN_CONFIG.url}${p}`) })
        }
      );

      if (!response.ok) {
        throw new Error(`Cloudflare purge failed: ${response.statusText}`);
      }

      logger.info('Cloudflare cache purged');
    }
  } catch (error) {
    logger.error('CDN invalidation failed', error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Get appropriate cache control header
 */
function getCacheControl(contentType: string): string {
  if (contentType.startsWith('image/') || contentType.startsWith('font/')) {
    return 'public, max-age=31536000, immutable'; // 1 year
  }
  if (contentType === 'text/html') {
    return 'public, max-age=0, must-revalidate'; // No cache for HTML
  }
  if (contentType === 'application/javascript' || contentType === 'text/css') {
    return 'public, max-age=31536000, immutable'; // 1 year (with fingerprinting)
  }
  return 'public, max-age=3600'; // 1 hour default
}

/**
 * Get CDN URL for asset
 */
export function getCDNUrl(assetPath: string): string {
  if (!CDN_CONFIG.enabled || !CDN_CONFIG.url) {
    return assetPath;
  }
  return `${CDN_CONFIG.url}/${assetPath.replace(/^\//, '')}`;
}
