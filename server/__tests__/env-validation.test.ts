/**
 * CRIT-001: Environment Validation Tests
 * Tests that startup fails fast with clear messages when required production vars are missing
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('CRIT-001: Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Production Environment Validation', () => {
    it('should fail when NODE_ENV=production and DATABASE_URL is missing', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;

      expect(() => {
        // Dynamic import to trigger validation
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/DATABASE_URL/);
    });

    it('should fail when NODE_ENV=production and SESSION_SECRET is missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      delete process.env.SESSION_SECRET;

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/SESSION_SECRET/);
    });

    it('should fail when NODE_ENV=production and JWT_SECRET is missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'a'.repeat(64);
      delete process.env.JWT_SECRET;

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/JWT_SECRET/);
    });

    it('should fail when NODE_ENV=production and JWT_SECRET is too short', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'a'.repeat(64);
      process.env.JWT_SECRET = 'short';

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/32 characters/);
    });

    it('should fail when NODE_ENV=production and WEBHOOK_SIGNATURE_SECRET is missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'a'.repeat(64);
      process.env.JWT_SECRET = 'b'.repeat(64);
      delete process.env.WEBHOOK_SIGNATURE_SECRET;

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/WEBHOOK_SIGNATURE_SECRET/);
    });

    it('should fail when NODE_ENV=production and FILE_ENCRYPTION_KEY is missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'a'.repeat(64);
      process.env.JWT_SECRET = 'b'.repeat(64);
      process.env.WEBHOOK_SIGNATURE_SECRET = 'c'.repeat(64);
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'd'.repeat(64);
      delete process.env.FILE_ENCRYPTION_KEY;

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/FILE_ENCRYPTION_KEY/);
    });

    it('should fail when NODE_ENV=production and OPENAI_API_KEY is missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'a'.repeat(64);
      process.env.JWT_SECRET = 'b'.repeat(64);
      process.env.WEBHOOK_SIGNATURE_SECRET = 'c'.repeat(64);
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'd'.repeat(64);
      process.env.FILE_ENCRYPTION_KEY = 'e'.repeat(64);
      delete process.env.OPENAI_API_KEY;

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/OPENAI_API_KEY/);
    });

    it('should fail when NODE_ENV=production and STRIPE_SECRET_KEY is missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'a'.repeat(64);
      process.env.JWT_SECRET = 'b'.repeat(64);
      process.env.WEBHOOK_SIGNATURE_SECRET = 'c'.repeat(64);
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'd'.repeat(64);
      process.env.FILE_ENCRYPTION_KEY = 'e'.repeat(64);
      process.env.OPENAI_API_KEY = 'sk-test123';
      delete process.env.STRIPE_SECRET_KEY;

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/STRIPE_SECRET_KEY/);
    });

    it('should fail when NODE_ENV=production and STRIPE_WEBHOOK_SECRET is missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'a'.repeat(64);
      process.env.JWT_SECRET = 'b'.repeat(64);
      process.env.WEBHOOK_SIGNATURE_SECRET = 'c'.repeat(64);
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'd'.repeat(64);
      process.env.FILE_ENCRYPTION_KEY = 'e'.repeat(64);
      process.env.OPENAI_API_KEY = 'sk-test123';
      process.env.STRIPE_SECRET_KEY = 'sk_live_test';
      delete process.env.STRIPE_WEBHOOK_SECRET;

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/STRIPE_WEBHOOK_SECRET/);
    });
  });

  describe('Secret Strength Validation', () => {
    it('should fail when JWT_SECRET lacks character diversity in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.JWT_SECRET = 'a'.repeat(64); // Only lowercase
      process.env.WEBHOOK_SIGNATURE_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'd'.repeat(64);
      process.env.FILE_ENCRYPTION_KEY = 'e'.repeat(64);
      process.env.OPENAI_API_KEY = 'sk-test123';
      process.env.STRIPE_SECRET_KEY = 'sk_live_test';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/character types/);
    });

    it('should fail when JWT_SECRET has repeated patterns in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.JWT_SECRET = 'Aaaaaa' + 'B'.repeat(58); // Repeated pattern
      process.env.WEBHOOK_SIGNATURE_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'd'.repeat(64);
      process.env.FILE_ENCRYPTION_KEY = 'e'.repeat(64);
      process.env.OPENAI_API_KEY = 'sk-test123';
      process.env.STRIPE_SECRET_KEY = 'sk_live_test';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/repeated/);
    });

    it('should fail when SESSION_SECRET lacks character diversity in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = '1'.repeat(64); // Only numbers
      process.env.JWT_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.WEBHOOK_SIGNATURE_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'd'.repeat(64);
      process.env.FILE_ENCRYPTION_KEY = 'e'.repeat(64);
      process.env.OPENAI_API_KEY = 'sk-test123';
      process.env.STRIPE_SECRET_KEY = 'sk_live_test';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/character types/);
    });
  });

  describe('Development Environment Validation', () => {
    it('should succeed in development with minimal required vars', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'a'.repeat(32);
      process.env.JWT_SECRET = 'b'.repeat(32);
      process.env.WEBHOOK_SIGNATURE_SECRET = 'c'.repeat(32);
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'd'.repeat(32);

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).not.toThrow();
    });

    it('should allow weak secrets in development with warnings', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'dev-session-secret-for-testing';
      process.env.JWT_SECRET = 'dev-jwt-secret-for-testing!!!';
      process.env.WEBHOOK_SIGNATURE_SECRET = 'dev-webhook-secret-for-testing';
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'dev-2fa-key-for-testing!!!!!!';

      // Should not throw, but may warn
      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).not.toThrow();
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error message for missing DATABASE_URL', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;

      try {
        require('../env.validation').validateEnvironmentVariables();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toMatch(/DATABASE_URL/);
        expect(error.message.toLowerCase()).toMatch(/required|missing|must/);
      }
    });

    it('should provide clear error message for weak JWT_SECRET', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.JWT_SECRET = 'weak';

      try {
        require('../env.validation').validateEnvironmentVariables();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toMatch(/JWT_SECRET/);
        expect(error.message).toMatch(/32 characters|character|length/);
      }
    });
  });

  describe('File Encryption Key Validation', () => {
    it('should require FILE_ENCRYPTION_KEY to be exactly 64 hex characters in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'a'.repeat(64);
      process.env.JWT_SECRET = 'b'.repeat(64);
      process.env.WEBHOOK_SIGNATURE_SECRET = 'c'.repeat(64);
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'd'.repeat(64);
      process.env.FILE_ENCRYPTION_KEY = 'notahexstring'; // Wrong format
      process.env.OPENAI_API_KEY = 'sk-test123';
      process.env.STRIPE_SECRET_KEY = 'sk_live_test';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).toThrow(/FILE_ENCRYPTION_KEY/);
    });

    it('should accept valid 64 hex character FILE_ENCRYPTION_KEY in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      process.env.SESSION_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.JWT_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.WEBHOOK_SIGNATURE_SECRET = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY = 'Abc123!@#$%^&*()Def456!@#$%^&*()Ghi789!@#$%^&*()Jkl012!@#$%^&*()';
      process.env.FILE_ENCRYPTION_KEY = 'a'.repeat(64); // Valid hex
      process.env.OPENAI_API_KEY = 'sk-test123';
      process.env.STRIPE_SECRET_KEY = 'sk_live_test';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

      expect(() => {
        require('../env.validation').validateEnvironmentVariables();
      }).not.toThrow();
    });
  });
});
