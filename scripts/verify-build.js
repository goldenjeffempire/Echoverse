#!/usr/bin/env node

/**
 * Production Build Verification Script
 * 
 * Verifies:
 * - Build artifacts exist
 * - Critical files are present
 * - Bundle sizes are within limits
 * - Source maps are generated
 * - No development code in production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

function pass(message) {
  checks.passed.push(message);
  console.log(`✅ ${message}`);
}

function fail(message) {
  checks.failed.push(message);
  console.log(`❌ ${message}`);
}

function warn(message) {
  checks.warnings.push(message);
  console.log(`⚠️  ${message}`);
}

// Check 1: Verify dist directory exists
function checkDistExists() {
  if (fs.existsSync(distDir)) {
    pass('Build directory exists');
    return true;
  } else {
    fail('Build directory does not exist');
    return false;
  }
}

// Check 2: Verify critical files
function checkCriticalFiles() {
  const criticalFiles = [
    'index.html',
    'assets'
  ];
  
  for (const file of criticalFiles) {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
      pass(`Critical file exists: ${file}`);
    } else {
      fail(`Critical file missing: ${file}`);
    }
  }
}

// Check 3: Verify bundle sizes
function checkBundleSizes() {
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fail('Assets directory missing');
    return;
  }
  
  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter(f => f.endsWith('.js'));
  const cssFiles = files.filter(f => f.endsWith('.css'));
  
  const MAX_JS_SIZE = 500 * 1024; // 500KB per chunk
  const MAX_CSS_SIZE = 100 * 1024; // 100KB per CSS file
  
  for (const file of jsFiles) {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    if (stats.size > MAX_JS_SIZE) {
      warn(`Large JS bundle: ${file} (${sizeKB}KB)`);
    } else {
      pass(`JS bundle size OK: ${file} (${sizeKB}KB)`);
    }
  }
  
  for (const file of cssFiles) {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    if (stats.size > MAX_CSS_SIZE) {
      warn(`Large CSS file: ${file} (${sizeKB}KB)`);
    } else {
      pass(`CSS file size OK: ${file} (${sizeKB}KB)`);
    }
  }
}

// Check 4: Verify source maps
function checkSourceMaps() {
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) return;
  
  const files = fs.readdirSync(assetsDir);
  const mapFiles = files.filter(f => f.endsWith('.map'));
  
  if (mapFiles.length > 0) {
    pass(`Source maps generated: ${mapFiles.length} files`);
  } else {
    warn('No source maps found - debugging will be difficult');
  }
}

// Check 5: Check for development code
function checkNoDevelopmentCode() {
  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) return;
  
  const content = fs.readFileSync(indexPath, 'utf-8');
  
  const devPatterns = [
    /console\.log/,
    /debugger/,
    /localhost:5173/,
    /vite-dev/
  ];
  
  for (const pattern of devPatterns) {
    if (pattern.test(content)) {
      fail(`Development code found in build: ${pattern}`);
    }
  }
  
  pass('No development code detected in HTML');
}

// Check 6: Verify asset integrity
function verifyAssetIntegrity() {
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) return;
  
  const files = fs.readdirSync(assetsDir);
  const checksums = {};
  
  for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const content = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    checksums[file] = hash;
  }
  
  // Save checksums for verification
  const checksumPath = path.join(distDir, 'checksums.json');
  fs.writeFileSync(checksumPath, JSON.stringify(checksums, null, 2));
  
  pass(`Asset integrity checksums generated: ${Object.keys(checksums).length} files`);
}

// Check 7: Verify index.html
function verifyIndexHtml() {
  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    fail('index.html missing');
    return;
  }
  
  const content = fs.readFileSync(indexPath, 'utf-8');
  
  // Check for required meta tags
  const requiredTags = [
    { pattern: /<meta charset/, name: 'charset meta' },
    { pattern: /<meta name="viewport"/, name: 'viewport meta' },
    { pattern: /<title>/, name: 'title tag' }
  ];
  
  for (const { pattern, name } of requiredTags) {
    if (pattern.test(content)) {
      pass(`Required tag present: ${name}`);
    } else {
      warn(`Missing recommended tag: ${name}`);
    }
  }
}

// Check 8: Verify assets are minified
function checkMinification() {
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) return;
  
  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter(f => f.endsWith('.js') && !f.endsWith('.map'));
  
  for (const file of jsFiles) {
    const filePath = path.join(assetsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Simple heuristic: minified code has long lines
    const lines = content.split('\n');
    const avgLineLength = content.length / lines.length;
    
    if (avgLineLength > 200) {
      pass(`File appears minified: ${file}`);
    } else {
      warn(`File may not be minified: ${file}`);
    }
  }
}

// Run all checks
function runVerification() {
  console.log('\n🔍 Production Build Verification\n');
  console.log('='.repeat(50) + '\n');
  
  if (!checkDistExists()) {
    console.log('\n❌ Build verification failed: dist directory missing\n');
    process.exit(1);
  }
  
  checkCriticalFiles();
  checkBundleSizes();
  checkSourceMaps();
  checkNoDevelopmentCode();
  verifyAssetIntegrity();
  verifyIndexHtml();
  checkMinification();
  
  console.log('\n' + '='.repeat(50) + '\n');
  console.log(`✅ Passed: ${checks.passed.length}`);
  console.log(`⚠️  Warnings: ${checks.warnings.length}`);
  console.log(`❌ Failed: ${checks.failed.length}\n`);
  
  if (checks.failed.length > 0) {
    console.log('❌ Build verification failed\n');
    process.exit(1);
  } else if (checks.warnings.length > 0) {
    console.log('⚠️  Build verification passed with warnings\n');
    process.exit(0);
  } else {
    console.log('✅ Build verification passed\n');
    process.exit(0);
  }
}

runVerification();
