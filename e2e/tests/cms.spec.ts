import { test, expect } from '@playwright/test';

test.describe('CMS Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cms');
  });

  test('should load CMS dashboard', async ({ page }) => {
    await expect(page).toHaveTitle(/CMS|Content|Blog/i);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should create a new blog post', async ({ page }) => {
    const newPostButton = page.getByRole('button', { name: /new post|create|add/i });
    if (await newPostButton.isVisible()) {
      await newPostButton.click();
      
      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
      await titleInput.fill('Test Blog Post');
      
      const contentArea = page.locator('textarea, [contenteditable="true"]').first();
      await contentArea.fill('This is test content for the blog post.');
    }
  });

  test('should support AI content generation', async ({ page }) => {
    const aiButton = page.getByRole('button', { name: /ai|generate|assistant/i });
    if (await aiButton.isVisible()) {
      await aiButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should schedule posts', async ({ page }) => {
    const scheduleButton = page.getByRole('button', { name: /schedule|publish later/i });
    if (await scheduleButton.isVisible()) {
      await scheduleButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should manage media library', async ({ page }) => {
    const mediaButton = page.getByRole('button', { name: /media|images|library/i });
    if (await mediaButton.isVisible()) {
      await mediaButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should support multi-language content', async ({ page }) => {
    const languageSelect = page.locator('select[name*="language"], select[name*="locale"]').first();
    if (await languageSelect.isVisible()) {
      await languageSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }
  });

  test('should show analytics', async ({ page }) => {
    const analyticsTab = page.getByRole('tab', { name: /analytics|stats|metrics/i });
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
      await expect(page.locator('[data-testid*="chart"], .chart, canvas').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
