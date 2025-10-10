/**
 * E2E Test Utilities
 * Shared helpers for Playwright tests
 */

import { Page, expect } from '@playwright/test';

/**
 * Generate unique test email
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Generate secure test password
 */
export function generateTestPassword(): string {
  return 'Test123!@#SecurePassword';
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 10000
): Promise<any> {
  const response = await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
  
  return response.json();
}

/**
 * Login helper
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

/**
 * Register helper
 */
export async function register(
  page: Page,
  email: string,
  password: string,
  username?: string
): Promise<void> {
  await page.goto('/register');
  
  if (username) {
    const usernameInput = page.locator('input[name="username"]');
    if (await usernameInput.isVisible()) {
      await usernameInput.fill(username);
    }
  }
  
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);
  
  const confirmInput = page.locator('input[name="confirmPassword"], input[name="confirm_password"]');
  if (await confirmInput.isVisible()) {
    await confirmInput.fill(password);
  }
  
  await page.click('button[type="submit"]');
}

/**
 * Logout helper
 */
export async function logout(page: Page): Promise<void> {
  await page.click('[data-testid="user-menu"], [aria-label="User menu"]');
  await page.click('text=Logout, text=Sign out');
  await page.waitForURL('**/login');
}

/**
 * Get CSRF token
 */
export async function getCsrfToken(page: Page): Promise<string> {
  const response = await page.request.get('/api/csrf-token');
  const data = await response.json();
  return data.token;
}

/**
 * Wait for toast/notification
 */
export async function waitForToast(page: Page, message?: string): Promise<void> {
  const toastSelector = '[role="alert"], [data-toast], .toast, .notification';
  await page.waitForSelector(toastSelector, { timeout: 5000 });
  
  if (message) {
    await expect(page.locator(toastSelector)).toContainText(message);
  }
}

/**
 * Fill form field by label
 */
export async function fillFieldByLabel(
  page: Page,
  label: string,
  value: string
): Promise<void> {
  const field = page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + textarea`);
  await field.fill(value);
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(
  page: Page,
  name: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}
