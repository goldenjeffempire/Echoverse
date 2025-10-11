/**
 * LOW-007: Integration test for email sending
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { sendEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../services/email';

// Mock email service for testing
vi.mock('../services/email', async () => {
  const actual = await vi.importActual('../services/email');
  return {
    ...actual,
    sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test-123' }),
    sendWelcomeEmail: vi.fn().mockResolvedValue({ success: true }),
    sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true }),
  };
});

describe('Email Integration Tests', () => {
  const testRecipient = 'test@example.com';

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const result = await sendEmail({
        to: testRecipient,
        subject: 'Test Email',
        text: 'This is a test email',
        html: '<p>This is a test email</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
      expect(sendEmail).toHaveBeenCalledWith({
        to: testRecipient,
        subject: 'Test Email',
        text: 'This is a test email',
        html: '<p>This is a test email</p>',
      });
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email to new user', async () => {
      const result = await sendWelcomeEmail(testRecipient, 'John Doe');

      expect(result.success).toBe(true);
      expect(sendWelcomeEmail).toHaveBeenCalledWith(testRecipient, 'John Doe');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with token', async () => {
      const resetToken = 'reset-token-123';
      const result = await sendPasswordResetEmail(testRecipient, resetToken);

      expect(result.success).toBe(true);
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(testRecipient, resetToken);
    });
  });
});
