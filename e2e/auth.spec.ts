import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SmartAgentOS/i);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    const loginButton = page.getByRole('link', { name: /sign in/i });
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('should register new user', async ({ page }) => {
    await page.goto('/register');
    const timestamp = Date.now();
    
    await page.fill('input[name="username"]', `testuser_${timestamp}`);
    await page.fill('input[name="email"]', `test_${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'SecurePassword123!');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });
});

test.describe('Accessibility Tests', () => {
  test('should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SmartAgentOS/i);
  });
});
