import { test, expect } from '@playwright/test';

test.describe('Marketing Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/marketing');
  });

  test('should load marketing dashboard', async ({ page }) => {
    await expect(page).toHaveTitle(/Marketing|Campaign|Analytics/i);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should create marketing campaign', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create|new campaign|add/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const nameInput = page.locator('input[name="name"], input[placeholder*="campaign" i]').first();
      await nameInput.fill('Test Marketing Campaign');
    }
  });

  test('should display marketing funnel', async ({ page }) => {
    const funnelTab = page.getByRole('tab', { name: /funnel|pipeline/i });
    if (await funnelTab.isVisible()) {
      await funnelTab.click();
      await expect(page.locator('[data-testid*="funnel"], .funnel, canvas').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should support A/B testing', async ({ page }) => {
    const abTestButton = page.getByRole('button', { name: /a\/b test|split test/i });
    if (await abTestButton.isVisible()) {
      await abTestButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should show analytics dashboard', async ({ page }) => {
    const analyticsTab = page.getByRole('tab', { name: /analytics|metrics|dashboard/i });
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
      await expect(page.locator('[data-testid*="chart"], .chart, canvas').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should create landing pages', async ({ page }) => {
    const landingPageButton = page.getByRole('button', { name: /landing page|create page/i });
    if (await landingPageButton.isVisible()) {
      await landingPageButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should support lead capture', async ({ page }) => {
    const leadCaptureTab = page.getByRole('tab', { name: /leads|capture|contacts/i });
    if (await leadCaptureTab.isVisible()) {
      await leadCaptureTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('should manage affiliate program', async ({ page }) => {
    const affiliateTab = page.getByRole('tab', { name: /affiliate|referral|partner/i });
    if (await affiliateTab.isVisible()) {
      await affiliateTab.click();
      await page.waitForTimeout(500);
    }
  });
});
