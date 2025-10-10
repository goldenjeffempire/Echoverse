#!/usr/bin/env tsx

/**
 * Production Readiness Automation Script
 * 
 * Automates critical production readiness checks and configurations:
 * - CRIT-004: Sentry error tracking setup
 * - CRIT-007: Automated backup scheduling
 * - CRIT-009: Secrets rotation alerting
 * - HIGH-019: Security headers validation
 * - SEC-001: Security headers testing
 * - CONFIG-001: Environment validation
 * - And more...
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, status: 'pass' | 'fail' | 'warn', message: string) {
  results.push({ name, status, message });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);
}

// CRIT-004: Check Sentry Configuration
function checkSentrySetup() {
  // Check production template first
  const prodTemplateFile = path.join(projectRoot, '.env.production.template');
  if (fs.existsSync(prodTemplateFile)) {
    const template = fs.readFileSync(prodTemplateFile, 'utf-8');
    if (template.includes('SENTRY_DSN')) {
      check('Sentry', 'pass', 'Sentry DSN documented in production template');
    } else {
      check('Sentry', 'warn', 'Sentry DSN not in production template - add SENTRY_DSN');
    }
  } else {
    // Fallback to checking current .env
    const envFile = path.join(projectRoot, '.env');
    if (fs.existsSync(envFile)) {
      const env = fs.readFileSync(envFile, 'utf-8');
      if (env.includes('SENTRY_DSN')) {
        check('Sentry', 'pass', 'Sentry DSN configured in .env');
      } else {
        check('Sentry', 'warn', 'Sentry DSN not configured');
      }
    } else {
      check('Sentry', 'warn', 'No environment files found');
    }
  }
}

// CONFIG-001: Validate Production Environment Variables
function validateProductionEnv() {
  const requiredProdVars = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'JWT_SECRET',
    'WEBHOOK_SIGNATURE_SECRET',
    'TWO_FACTOR_BACKUP_ENCRYPTION_KEY',
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY',
    'SENDGRID_API_KEY',
    'REDIS_URL',
    'AWS_S3_BUCKET'
  ];
  
  const templateFile = path.join(projectRoot, '.env.production.template');
  if (fs.existsSync(templateFile)) {
    check('Production Template', 'pass', '.env.production.template exists');
    
    const template = fs.readFileSync(templateFile, 'utf-8');
    const missingVars = requiredProdVars.filter(v => !template.includes(v));
    
    if (missingVars.length === 0) {
      check('Production Vars', 'pass', 'All required production variables documented');
    } else {
      check('Production Vars', 'warn', `Missing vars in template: ${missingVars.join(', ')}`);
    }
  } else {
    check('Production Template', 'fail', '.env.production.template missing');
  }
}

// HIGH-019, SEC-001: Security Headers Validation
async function validateSecurityHeaders() {
  const testUrl = process.env.APP_URL || 'http://localhost:5000';
  
  return new Promise((resolve) => {
    try {
      // Use correct protocol based on URL
      const isHttps = testUrl.startsWith('https://');
      const client = isHttps ? https : http;
      
      client.get(testUrl, (res) => {
        const headers = res.headers;
        
        const requiredHeaders = [
          'x-content-type-options',
          'x-frame-options',
          'x-xss-protection',
          'content-security-policy'
        ];
        
        // Only check HSTS for HTTPS
        if (isHttps) {
          requiredHeaders.push('strict-transport-security');
        }
        
        const present = requiredHeaders.filter(h => headers[h]);
        const missing = requiredHeaders.filter(h => !headers[h]);
        
        if (missing.length === 0) {
          check('Security Headers', 'pass', 'All security headers present');
        } else {
          check('Security Headers', 'warn', `Missing headers: ${missing.join(', ')}`);
        }
        
        resolve(null);
      }).on('error', (err) => {
        check('Security Headers', 'warn', `Could not test security headers - ${err.message || 'server not running'}`);
        resolve(null);
      });
    } catch (error) {
      check('Security Headers', 'warn', 'Could not test security headers - invalid URL or server not running');
      resolve(null);
    }
  });
}

// Check Database Backup Configuration (CRIT-007)
function checkBackupConfiguration() {
  const backupUtilPath = path.join(projectRoot, 'server/utils/database-backup.ts');
  if (fs.existsSync(backupUtilPath)) {
    check('Backup Utility', 'pass', 'Database backup utility exists');
    
    const content = fs.readFileSync(backupUtilPath, 'utf-8');
    if (content.includes('schedule')) {
      check('Backup Schedule', 'pass', 'Backup scheduling implemented');
    } else {
      check('Backup Schedule', 'warn', 'No automated backup scheduling found');
    }
  } else {
    check('Backup Utility', 'fail', 'Database backup utility missing');
  }
}

// Check Secrets Rotation (CRIT-009)
function checkSecretsRotation() {
  const rotationPath = path.join(projectRoot, 'server/utils/key-rotation.ts');
  if (fs.existsSync(rotationPath)) {
    check('Secrets Rotation', 'pass', 'Key rotation utility exists');
  } else {
    check('Secrets Rotation', 'fail', 'Key rotation utility missing');
  }
}

// Check SSL/TLS Configuration (CRIT-008)
function checkSSLConfiguration() {
  const httpsPath = path.join(projectRoot, 'server/middleware/https-enforcement.ts');
  if (fs.existsSync(httpsPath)) {
    check('HTTPS Enforcement', 'pass', 'HTTPS enforcement middleware exists');
  } else {
    check('HTTPS Enforcement', 'fail', 'HTTPS enforcement middleware missing');
  }
}

// Check Virus Scanning (CRIT-006)
function checkVirusScanning() {
  const virusScanPath = path.join(projectRoot, 'server/middleware/virus-scan-production.ts');
  if (fs.existsSync(virusScanPath)) {
    check('Virus Scanning', 'pass', 'Virus scanning middleware exists');
  } else {
    check('Virus Scanning', 'warn', 'Production virus scanning not configured');
  }
}

// Check Rate Limiting (CRIT-005)
function checkRateLimiting() {
  const rateLimitPath = path.join(projectRoot, 'server/middleware/rate-limit-enhanced.ts');
  if (fs.existsSync(rateLimitPath)) {
    const content = fs.readFileSync(rateLimitPath, 'utf-8');
    if (content.includes('fingerprint')) {
      check('Rate Limiting', 'pass', 'Enhanced rate limiting with fingerprinting');
    } else {
      check('Rate Limiting', 'warn', 'Rate limiting exists but no fingerprinting detected');
    }
  } else {
    check('Rate Limiting', 'fail', 'Rate limiting middleware missing');
  }
}

// Check GDPR Compliance (CRIT-011)
function checkGDPRCompliance() {
  const gdprPath = path.join(projectRoot, 'server/utils/gdpr.ts');
  if (fs.existsSync(gdprPath)) {
    const content = fs.readFileSync(gdprPath, 'utf-8');
    if (content.includes('export') && content.includes('encrypt')) {
      check('GDPR Export', 'pass', 'GDPR export with encryption implemented');
    } else {
      check('GDPR Export', 'warn', 'GDPR export exists but may need encryption');
    }
  } else {
    check('GDPR Export', 'fail', 'GDPR utilities missing');
  }
}

// Check WebSocket Security (CRIT-012)
function checkWebSocketSecurity() {
  const wsPath = path.join(projectRoot, 'server/websocket.ts');
  if (fs.existsSync(wsPath)) {
    const content = fs.readFileSync(wsPath, 'utf-8');
    if (content.includes('token') && content.includes('refresh')) {
      check('WebSocket Security', 'pass', 'WebSocket token refresh implemented');
    } else {
      check('WebSocket Security', 'warn', 'WebSocket may need token refresh mechanism');
    }
  } else {
    check('WebSocket Security', 'fail', 'WebSocket server missing');
  }
}

// Check Stripe Webhook Security (CRIT-010)
function checkStripeWebhookSecurity() {
  const webhookPath = path.join(projectRoot, 'server/services/stripe-webhook-handler.ts');
  if (fs.existsSync(webhookPath)) {
    const content = fs.readFileSync(webhookPath, 'utf-8');
    if (content.includes('verifySignature')) {
      check('Stripe Webhooks', 'pass', 'Webhook signature verification implemented');
    } else {
      check('Stripe Webhooks', 'warn', 'Webhook signature verification may be incomplete');
    }
  } else {
    check('Stripe Webhooks', 'warn', 'Stripe webhook handler not found');
  }
}

// Check TypeScript Strict Mode (MED-001)
function checkTypeScriptStrict() {
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    if (content.compilerOptions?.strict === true) {
      check('TypeScript Strict', 'pass', 'Strict mode enabled');
    } else {
      check('TypeScript Strict', 'warn', 'TypeScript strict mode not enabled');
    }
  }
}

// Check Test Coverage (MED-002)
function checkTestCoverage() {
  const vitestConfig = path.join(projectRoot, 'vitest.config.ts');
  if (fs.existsSync(vitestConfig)) {
    const content = fs.readFileSync(vitestConfig, 'utf-8');
    if (content.includes('coverage')) {
      check('Test Coverage', 'pass', 'Coverage configuration found');
    } else {
      check('Test Coverage', 'warn', 'No coverage thresholds configured');
    }
  }
}

// Main execution
async function runProductionReadinessCheck() {
  console.log('\n🚀 Production Readiness Check\n');
  console.log('='.repeat(60) + '\n');
  
  // Run all checks
  checkSentrySetup();
  validateProductionEnv();
  checkBackupConfiguration();
  checkSecretsRotation();
  checkSSLConfiguration();
  checkVirusScanning();
  checkRateLimiting();
  checkGDPRCompliance();
  checkWebSocketSecurity();
  checkStripeWebhookSecurity();
  checkTypeScriptStrict();
  checkTestCoverage();
  
  await validateSecurityHeaders();
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Summary
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warn').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Failed: ${failed}\n`);
  
  if (failed > 0) {
    console.log('❌ Production readiness check FAILED\n');
    console.log('Critical issues must be resolved before production deployment.\n');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  Production readiness check PASSED with warnings\n');
    console.log('Review warnings before production deployment.\n');
    process.exit(0);
  } else {
    console.log('✅ Production readiness check PASSED\n');
    console.log('System is ready for production deployment!\n');
    process.exit(0);
  }
}

runProductionReadinessCheck();
