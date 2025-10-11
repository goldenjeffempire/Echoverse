#!/usr/bin/env tsx
/**
 * MED-010 FIX: Bundle Size Budget Enforcement
 * Fails CI build if bundle exceeds size limits
 */

import { statSync, readdirSync } from 'fs';
import { join } from 'path';

const DIST_DIR = 'dist';

const BUDGETS = {
  totalSize: 500 * 1024, // 500 KB total
  jsFile: 200 * 1024,    // 200 KB per JS file
  cssFile: 50 * 1024,    // 50 KB per CSS file
  imageFile: 100 * 1024  // 100 KB per image
};

interface FileSizeInfo {
  path: string;
  size: number;
  type: string;
}

function getFileType(filename: string): string {
  if (filename.endsWith('.js')) return 'js';
  if (filename.endsWith('.css')) return 'css';
  if (filename.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image';
  return 'other';
}

function analyzeDirectory(dir: string): FileSizeInfo[] {
  const files: FileSizeInfo[] = [];

  function traverse(currentDir: string) {
    const items = readdirSync(currentDir);

    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else {
        files.push({
          path: fullPath.replace(`${DIST_DIR}/`, ''),
          size: stat.size,
          type: getFileType(item)
        });
      }
    }
  }

  traverse(dir);
  return files;
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function main() {
  console.log('\n📦 MED-010 FIX: Bundle Size Budget Analysis\n');

  try {
    const files = analyzeDirectory(DIST_DIR);
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    console.log(`Total bundle size: ${formatSize(totalSize)}`);
    console.log(`Budget: ${formatSize(BUDGETS.totalSize)}\n`);

    let budgetViolations = 0;

    // Check total size
    if (totalSize > BUDGETS.totalSize) {
      console.error(`❌ BUDGET VIOLATION: Total size ${formatSize(totalSize)} exceeds budget ${formatSize(BUDGETS.totalSize)}`);
      budgetViolations++;
    } else {
      console.log(`✅ Total size within budget (${formatSize(totalSize)}/${formatSize(BUDGETS.totalSize)})`);
    }

    // Check individual files
    console.log('\n📁 Large Files:\n');
    const largeFiles = files.filter(f => {
      if (f.type === 'js' && f.size > BUDGETS.jsFile) return true;
      if (f.type === 'css' && f.size > BUDGETS.cssFile) return true;
      if (f.type === 'image' && f.size > BUDGETS.imageFile) return true;
      return false;
    });

    if (largeFiles.length > 0) {
      largeFiles.forEach(f => {
        const budget = f.type === 'js' ? BUDGETS.jsFile : f.type === 'css' ? BUDGETS.cssFile : BUDGETS.imageFile;
        console.error(`❌ ${f.path}: ${formatSize(f.size)} (budget: ${formatSize(budget)})`);
        budgetViolations++;
      });
    } else {
      console.log('✅ All individual files within budget\n');
    }

    // Breakdown by type
    console.log('📊 Size by Type:\n');
    const byType = files.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + f.size;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(byType).forEach(([type, size]) => {
      console.log(`  ${type}: ${formatSize(size)}`);
    });

    console.log();

    if (budgetViolations > 0) {
      console.error(`\n❌ ${budgetViolations} budget violation(s) - Build FAILED`);
      console.error('\n💡 Suggestions:');
      console.error('  - Enable code splitting');
      console.error('  - Use dynamic imports for large components');
      console.error('  - Optimize images with compression');
      console.error('  - Remove unused dependencies\n');
      process.exit(1);
    }

    console.log('✅ All bundle budgets met - Build PASSED\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error);
    process.exit(1);
  }
}

main();
