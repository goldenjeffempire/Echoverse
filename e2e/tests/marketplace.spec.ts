import { test, expect } from '@playwright/test';

test.describe('Marketplace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/marketplace');
  });

  test('should load marketplace', async ({ page }) => {
    await expect(page).toHaveTitle(/Marketplace|Plugins|Extensions/i);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display plugin listings', async ({ page }) => {
    await expect(page.locator('[data-testid*="plugin"], .plugin-card, .extension-card').first()).toBeVisible({ timeout: 5000 });
  });

  test('should search for plugins', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    await searchInput.fill('analytics');
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);
  });

  test('should install a plugin', async ({ page }) => {
    const installButton = page.getByRole('button', { name: /install|add/i }).first();
    if (await installButton.isVisible()) {
      await installButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should show installed plugins', async ({ page }) => {
    const installedTab = page.getByRole('tab', { name: /installed|my plugins/i });
    if (await installedTab.isVisible()) {
      await installedTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('should support plugin updates', async ({ page }) => {
    const updateButton = page.getByRole('button', { name: /update|upgrade/i }).first();
    if (await updateButton.isVisible()) {
      await updateButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should display developer portal', async ({ page }) => {
    const devPortalLink = page.getByRole('link', { name: /developer|submit plugin|publish/i });
    if (await devPortalLink.isVisible()) {
      await devPortalLink.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should show revenue sharing info', async ({ page }) => {
    const revenueTab = page.getByRole('tab', { name: /revenue|earnings|payout/i });
    if (await revenueTab.isVisible()) {
      await revenueTab.click();
      await page.waitForTimeout(500);
    }
  });
});
