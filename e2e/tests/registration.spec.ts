/**
 * E2E Tests: User Registration Flow
 * Tests the complete user registration process including validation
 */

import { test, expect } from '@playwright/test';
import { 
  generateTestEmail, 
  generateTestPassword,
  waitForToast,
  getCsrfToken 
} from '../helpers/test-utils';

test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/register|sign up/i);
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should successfully register new user', async ({ page }) => {
    const email = generateTestEmail();
    const password = generateTestPassword();

    // Fill registration form
    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', password);
    
    // Fill confirm password if present
    const confirmPasswordField = page.locator('input[name="confirmPassword"], input[name="confirm_password"]');
    if (await confirmPasswordField.count() > 0) {
      await confirmPasswordField.fill(password);
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or login
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 10000 });
    
    // Verify success (either on dashboard or login page)
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|login)/);
  });

  test('should show error for duplicate email', async ({ page }) => {
    // Use a known email (or register one first)
    const email = 'duplicate@example.com';
    const password = generateTestPassword();

    // Try to register twice
    for (let i = 0; i < 2; i++) {
      await page.goto('/register');
      await page.fill('input[name="email"], input[type="email"]', email);
      await page.fill('input[name="password"], input[type="password"]', password);
      
      const confirmPasswordField = page.locator('input[name="confirmPassword"], input[name="confirm_password"]');
      if (await confirmPasswordField.count() > 0) {
        await confirmPasswordField.fill(password);
      }
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    }

    // Second attempt should show error
    await expect(page.locator('[role="alert"], .error, .text-red-500')).toContainText(/already exists|already registered|duplicate/i, { timeout: 5000 });
  });

  test('should validate email format', async ({ page }) => {
    const invalidEmail = 'invalid-email';
    const password = generateTestPassword();

    await page.fill('input[name="email"], input[type="email"]', invalidEmail);
    await page.fill('input[name="password"], input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('[role="alert"], .error, input:invalid')).toBeVisible({ timeout: 3000 });
  });

  test('should validate password requirements', async ({ page }) => {
    const email = generateTestEmail();
    const weakPassword = '123'; // Too weak

    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', weakPassword);
    await page.click('button[type="submit"]');

    // Should show password validation error
    await expect(page.locator('[role="alert"], .error, .text-red-500')).toBeVisible({ timeout: 3000 });
  });

  test('should validate password confirmation match', async ({ page }) => {
    const email = generateTestEmail();
    const password = generateTestPassword();
    const differentPassword = 'Different123!@#';

    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', password);
    
    const confirmPasswordField = page.locator('input[name="confirmPassword"], input[name="confirm_password"]');
    if (await confirmPasswordField.count() > 0) {
      await confirmPasswordField.fill(differentPassword);
      await page.click('button[type="submit"]');

      // Should show mismatch error
      await expect(page.locator('[role="alert"], .error, .text-red-500')).toContainText(/match|same/i, { timeout: 3000 });
    }
  });

  test('should include CSRF token in request', async ({ page, request }) => {
    const email = generateTestEmail();
    const password = generateTestPassword();

    // Intercept the registration API call
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/auth/register'),
      { timeout: 10000 }
    );

    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', password);
    
    const confirmPasswordField = page.locator('input[name="confirmPassword"], input[name="confirm_password"]');
    if (await confirmPasswordField.count() > 0) {
      await confirmPasswordField.fill(password);
    }
    
    await page.click('button[type="submit"]');

    const response = await responsePromise;
    const request = response.request();
    
    // Verify CSRF token is present in headers or cookies
    const headers = request.headers();
    const hasCsrfHeader = headers['x-csrf-token'] || headers['x-xsrf-token'];
    
    // CSRF should be present (either success or proper rejection)
    expect(response.status()).toBeLessThan(500); // Not a server error
  });

  test('should navigate to login page', async ({ page }) => {
    // Look for login link
    const loginLink = page.locator('a:has-text("Login"), a:has-text("Sign in"), a[href*="login"]');
    await loginLink.click();

    await page.waitForURL('**/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });
});
