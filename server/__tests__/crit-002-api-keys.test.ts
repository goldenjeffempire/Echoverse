/**
 * CRIT-002: Hardcoded API Keys Tests
 * Tests that no hardcoded dev fallback keys exist and production enforces presence
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('CRIT-002: Hardcoded API Keys', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    // Clear require cache to force fresh import
    delete require.cache[require.resolve('../env.validation')];
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    delete require.cache[require.resolve('../env.validation')];
  });

  describe('OPENAI_API_KEY Enforcement', () => {
    it('should fail when OPENAI_API_KEY is missing in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.JWT_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.WEBHOOK_SIGNATURE_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.FILE_ENCRYPTION_KEY = 'a'.repeat(64);
      process.env.STRIPE_SECRET_KEY = 'sk_live_test';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
      delete process.env.OPENAI_API_KEY;

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/OPENAI_API_KEY.*required/);
    });

    it('should fail when OPENAI_API_KEY is empty string in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.JWT_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.WEBHOOK_SIGNATURE_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.FILE_ENCRYPTION_KEY = 'a'.repeat(64);
      process.env.STRIPE_SECRET_KEY = 'sk_live_test';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
      process.env.OPENAI_API_KEY = ''; // Empty string

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/OPENAI_API_KEY.*required/);
    });

    it('should fail when OPENAI_API_KEY is only whitespace in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.JWT_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.WEBHOOK_SIGNATURE_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.FILE_ENCRYPTION_KEY = 'a'.repeat(64);
      process.env.STRIPE_SECRET_KEY = 'sk_live_test';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
      process.env.OPENAI_API_KEY = '   '; // Only whitespace

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/OPENAI_API_KEY.*required/);
    });

    it('should succeed when OPENAI_API_KEY is provided in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.JWT_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.WEBHOOK_SIGNATURE_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.FILE_ENCRYPTION_KEY = 'a'.repeat(64);
      process.env.STRIPE_SECRET_KEY = 'sk_live_test';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
      process.env.OPENAI_API_KEY = 'sk-test123';

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).not.toThrow();
    });
  });

  describe('Stripe Webhook Secret No Hardcoded Defaults', () => {
    it('should not have hardcoded dev webhook secret fallback', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'a'.repeat(32);
      process.env.JWT_SECRET = 'b'.repeat(32);
      process.env.WEBHOOK_SIGNATURE_SECRET = 'c'.repeat(32);
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'd'.repeat(32);
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const env = require('../env.validation').validateEnvironmentVariables();
      
      // Should be undefined or empty, not a hardcoded test value
      expect(env.STRIPE_WEBHOOK_SECRET).not.toBe('whsec_dev_webhook_secret_for_testing');
    });

    it('should require STRIPE_WEBHOOK_SECRET in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.JWT_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.WEBHOOK_SIGNATURE_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.FILE_ENCRYPTION_KEY = 'a'.repeat(64);
      process.env.STRIPE_SECRET_KEY = 'sk_live_test';
      process.env.OPENAI_API_KEY = 'sk-test123';
      delete process.env.STRIPE_WEBHOOK_SECRET;

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/STRIPE_WEBHOOK_SECRET/);
    });
  });

  describe('Development Environment Flexibility', () => {
    it('should allow missing OPENAI_API_KEY in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'a'.repeat(32);
      process.env.JWT_SECRET = 'b'.repeat(32);
      process.env.WEBHOOK_SIGNATURE_SECRET = 'c'.repeat(32);
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'd'.repeat(32);
      delete process.env.OPENAI_API_KEY;

      // Should warn but not throw
      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).not.toThrow();
    });

    it('should allow missing STRIPE_WEBHOOK_SECRET in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'a'.repeat(32);
      process.env.JWT_SECRET = 'b'.repeat(32);
      process.env.WEBHOOK_SIGNATURE_SECRET = 'c'.repeat(32);
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'd'.repeat(32);
      delete process.env.STRIPE_WEBHOOK_SECRET;

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).not.toThrow();
    });
  });
});
