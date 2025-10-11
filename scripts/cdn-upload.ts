#!/usr/bin/env tsx
/**
 * HIGH-002 FIX: Automated CDN Asset Upload on Build
 * Uploads dist assets to CDN after successful build
 */

import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { uploadAssetToCDN } from '../server/config/cdn-setup';
import { logger } from '../server/logger';

const DIST_DIR = 'dist';
const CDN_ENABLED = process.env.CDN_ENABLED === 'true';

interface UploadStats {
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
}

async function uploadDirectory(localDir: string, cdnPrefix: string): Promise<UploadStats> {
  const stats: UploadStats = { total: 0, succeeded: 0, failed: 0, skipped: 0 };

  async function processDir(dir: string, prefix: string) {
    const files = readdirSync(dir);

    for (const file of files) {
      const localPath = join(dir, file);
      const fileStat = statSync(localPath);

      if (fileStat.isDirectory()) {
        await processDir(localPath, `${prefix}/${file}`);
      } else {
        stats.total++;
        const cdnPath = `${prefix}/${file}`.replace(/^\//, ''); // Remove leading slash

        try {
          const result = await uploadAssetToCDN(localPath, cdnPath);
          
          if (result.success) {
            stats.succeeded++;
            console.log(`✅ Uploaded: ${cdnPath} -> ${result.url}`);
          } else {
            stats.failed++;
            console.error(`❌ Failed: ${cdnPath} - ${result.error}`);
          }
        } catch (error) {
          stats.failed++;
          console.error(`❌ Error uploading ${cdnPath}:`, error);
        }
      }
    }
  }

  await processDir(localDir, cdnPrefix);
  return stats;
}

async function main() {
  console.log('\n🚀 HIGH-002 FIX: CDN Asset Upload Automation\n');

  if (!CDN_ENABLED) {
    console.log('⚠️  CDN not enabled - skipping upload');
    console.log('Set CDN_ENABLED=true to enable CDN uploads\n');
    process.exit(0);
  }

  console.log(`📦 Uploading assets from ${DIST_DIR}...\n`);

  try {
    const stats = await uploadDirectory(DIST_DIR, '');

    console.log('\n📊 Upload Summary:');
    console.log(`   Total files: ${stats.total}`);
    console.log(`   ✅ Succeeded: ${stats.succeeded}`);
    console.log(`   ❌ Failed: ${stats.failed}`);
    console.log(`   ⏭️  Skipped: ${stats.skipped}\n`);

    if (stats.failed > 0) {
      console.error('⚠️  Some uploads failed - review errors above');
      process.exit(1);
    }

    console.log('✅ All assets uploaded successfully to CDN\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ CDN upload failed:', error);
    process.exit(1);
  }
}

main();
