/**
 * Bundle Size Analyzer
 * FIX: PERF-001 - Bundle size analysis and monitoring
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { gzipSync } from 'zlib';

interface BundleStats {
  file: string;
  size: number;
  gzipSize: number;
}

interface BundleReport {
  timestamp: string;
  totalSize: number;
  totalGzipSize: number;
  bundles: BundleStats[];
  budget: {
    maxTotalSize: number;
    maxJsSize: number;
    exceeded: boolean;
  };
}

const BUDGET = {
  MAX_TOTAL_SIZE: 500 * 1024, // 500KB
  MAX_JS_SIZE: 200 * 1024,    // 200KB per JS bundle
  MAX_CSS_SIZE: 50 * 1024     // 50KB per CSS bundle
};

function analyzeBundle(distDir: string): BundleReport {
  const bundles: BundleStats[] = [];
  let totalSize = 0;
  let totalGzipSize = 0;

  // Find all JS and CSS files
  const files = [
    ...glob(join(distDir, '**/*.js')),
    ...glob(join(distDir, '**/*.css'))
  ];

  for (const file of files) {
    if (file.includes('node_modules')) continue;

    const content = readFileSync(file);
    const size = content.length;
    const gzipSize = gzipSync(content).length;

    bundles.push({
      file: file.replace(distDir, ''),
      size,
      gzipSize
    });

    totalSize += size;
    totalGzipSize += gzipSize;
  }

  // Check budget
  const exceeded = totalSize > BUDGET.MAX_TOTAL_SIZE || 
                   bundles.some(b => 
                     (b.file.endsWith('.js') && b.size > BUDGET.MAX_JS_SIZE) ||
                     (b.file.endsWith('.css') && b.size > BUDGET.MAX_CSS_SIZE)
                   );

  return {
    timestamp: new Date().toISOString(),
    totalSize,
    totalGzipSize,
    bundles: bundles.sort((a, b) => b.size - a.size),
    budget: {
      maxTotalSize: BUDGET.MAX_TOTAL_SIZE,
      maxJsSize: BUDGET.MAX_JS_SIZE,
      exceeded
    }
  };
}

function glob(pattern: string): string[] {
  // Simple glob implementation - you can use a library for more complex patterns
  const files: string[] = [];
  const dir = pattern.split('**')[0];
  
  function walk(currentDir: string) {
    const entries = require('fs').readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (pattern.includes('*.js') && entry.name.endsWith('.js')) {
        files.push(fullPath);
      } else if (pattern.includes('*.css') && entry.name.endsWith('.css')) {
        files.push(fullPath);
      }
    }
  }
  
  if (existsSync(dir)) {
    walk(dir);
  }
  
  return files;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function printReport(report: BundleReport) {
  console.log('\n📦 Bundle Size Analysis');
  console.log('='.repeat(60));
  console.log(`Total Size: ${formatBytes(report.totalSize)}`);
  console.log(`Gzipped: ${formatBytes(report.totalGzipSize)}`);
  console.log(`Budget: ${formatBytes(BUDGET.MAX_TOTAL_SIZE)}`);
  console.log(`Status: ${report.budget.exceeded ? '❌ EXCEEDED' : '✅ WITHIN BUDGET'}`);
  console.log('\nBundles (largest first):');
  console.log('-'.repeat(60));
  
  for (const bundle of report.bundles) {
    const exceeded = 
      (bundle.file.endsWith('.js') && bundle.size > BUDGET.MAX_JS_SIZE) ||
      (bundle.file.endsWith('.css') && bundle.size > BUDGET.MAX_CSS_SIZE);
    
    const status = exceeded ? '❌' : '✅';
    console.log(`${status} ${bundle.file}`);
    console.log(`   Size: ${formatBytes(bundle.size)} (gzip: ${formatBytes(bundle.gzipSize)})`);
  }
  
  console.log('='.repeat(60) + '\n');
}

// Run analysis
const distDir = join(process.cwd(), 'dist', 'public');

if (!existsSync(distDir)) {
  console.error('❌ Dist directory not found. Run `npm run build` first.');
  process.exit(1);
}

const report = analyzeBundle(distDir);

// Save report
const reportPath = join(process.cwd(), 'bundle-report.json');
writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Print to console
printReport(report);

// Exit with error if budget exceeded
if (report.budget.exceeded) {
  console.error('❌ Bundle size budget exceeded!');
  process.exit(1);
}

console.log('✅ Bundle size within budget');
process.exit(0);
