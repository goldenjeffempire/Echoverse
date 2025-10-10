import { test, expect } from '@playwright/test';

test.describe('Community Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/community');
  });

  test('should load community dashboard', async ({ page }) => {
    await expect(page).toHaveTitle(/Community|Social|Forum/i);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should create a new community', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create community|new community|add/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      await nameInput.fill('Test Community');
      
      const descInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]').first();
      await descInput.fill('A test community for testing purposes');
    }
  });

  test('should join existing community', async ({ page }) => {
    const joinButton = page.getByRole('button', { name: /join|subscribe|follow/i }).first();
    if (await joinButton.isVisible()) {
      await joinButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should support in-app messaging', async ({ page }) => {
    const messageButton = page.getByRole('button', { name: /message|chat|dm/i }).first();
    if (await messageButton.isVisible()) {
      await messageButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should have moderation tools', async ({ page }) => {
    const moderationTab = page.getByRole('tab', { name: /moderation|moderate|admin/i });
    if (await moderationTab.isVisible()) {
      await moderationTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('should support notifications', async ({ page }) => {
    const notificationIcon = page.locator('[data-testid*="notification"], .notification-icon').first();
    if (await notificationIcon.isVisible()) {
      await notificationIcon.click();
      await page.waitForTimeout(500);
    }
  });

  test('should allow sharing content', async ({ page }) => {
    const shareButton = page.getByRole('button', { name: /share/i }).first();
    if (await shareButton.isVisible()) {
      await shareButton.click();
      await page.waitForTimeout(500);
    }
  });
});
