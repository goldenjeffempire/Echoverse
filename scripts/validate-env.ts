/**
 * Environment Variable Validation Script
 * Validates all required production environment variables
 */

import * as dotenv from 'dotenv';
import { existsSync } from 'fs';

// Load environment
dotenv.config();

interface EnvVar {
  name: string;
  required: boolean;
  pattern?: RegExp;
  description: string;
}

const ENV_VARS: EnvVar[] = [
  // Core
  { name: 'NODE_ENV', required: true, description: 'Environment name' },
  { name: 'PORT', required: true, pattern: /^\d+$/, description: 'Server port' },
  
  // Database
  { name: 'DATABASE_URL', required: true, pattern: /^postgres/, description: 'PostgreSQL connection string' },
  
  // Security
  { name: 'SESSION_SECRET', required: true, pattern: /.{32,}/, description: 'Session secret (min 32 chars)' },
  { name: 'JWT_SECRET', required: true, pattern: /.{32,}/, description: 'JWT secret (min 32 chars)' },
  { name: 'ENCRYPTION_KEY', required: true, pattern: /.{32,}/, description: 'Encryption key (min 32 chars)' },
  
  // Stripe (required for payments)
  { name: 'STRIPE_SECRET_KEY', required: false, pattern: /^sk_/, description: 'Stripe secret key' },
  { name: 'STRIPE_PUBLISHABLE_KEY', required: false, pattern: /^pk_/, description: 'Stripe publishable key' },
  { name: 'STRIPE_WEBHOOK_SECRET', required: false, pattern: /^whsec_/, description: 'Stripe webhook secret' },
  
  // Email
  { name: 'SENDGRID_API_KEY', required: false, description: 'SendGrid API key' },
  
  // Monitoring
  { name: 'SENTRY_DSN', required: false, pattern: /^https:\/\//, description: 'Sentry DSN' },
  
  // Storage
  { name: 'AWS_S3_BUCKET', required: false, description: 'S3 bucket name' },
  
  // Redis
  { name: 'REDIS_URL', required: false, pattern: /^redis/, description: 'Redis connection string' },
  
  // AI
  { name: 'OPENAI_API_KEY', required: false, pattern: /^sk-/, description: 'OpenAI API key' }
];

const errors: string[] = [];
const warnings: string[] = [];

console.log('🔍 Validating environment variables...\n');

// Check each variable
for (const envVar of ENV_VARS) {
  const value = process.env[envVar.name];
  
  if (!value) {
    if (envVar.required) {
      errors.push(`❌ ${envVar.name}: MISSING (required) - ${envVar.description}`);
    } else {
      warnings.push(`⚠️  ${envVar.name}: Not set (optional) - ${envVar.description}`);
    }
    continue;
  }
  
  // Validate pattern
  if (envVar.pattern && !envVar.pattern.test(value)) {
    errors.push(`❌ ${envVar.name}: INVALID FORMAT - ${envVar.description}`);
    continue;
  }
  
  console.log(`✅ ${envVar.name}: OK`);
}

// Print results
console.log('\n' + '='.repeat(60));

if (errors.length > 0) {
  console.log('\n❌ ERRORS:\n');
  errors.forEach(err => console.log(err));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:\n');
  warnings.forEach(warn => console.log(warn));
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ All environment variables are valid!');
}

console.log('\n' + '='.repeat(60) + '\n');

// Exit with error if validation failed
if (errors.length > 0) {
  console.error('Environment validation failed. Fix the errors above.');
  process.exit(1);
}

process.exit(0);
