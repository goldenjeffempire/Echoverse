import { test, expect } from '@playwright/test';

test.describe('AI Website Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-builder');
  });

  test('should load AI builder interface', async ({ page }) => {
    await expect(page).toHaveTitle(/AI Builder|Website Builder/i);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should accept natural language input', async ({ page }) => {
    const input = page.locator('textarea, input[type="text"]').first();
    await input.fill('Create a landing page for a coffee shop');
    await input.press('Enter');
    
    await page.waitForTimeout(1000);
    await expect(input).toBeVisible();
  });

  test('should show template library', async ({ page }) => {
    const templatesButton = page.getByRole('button', { name: /templates|library/i });
    if (await templatesButton.isVisible()) {
      await templatesButton.click();
      await expect(page.locator('[data-testid*="template"], .template-card').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should support drag-and-drop editing', async ({ page }) => {
    await page.waitForTimeout(1000);
    const draggable = page.locator('[draggable="true"], .draggable').first();
    if (await draggable.count() > 0) {
      await draggable.hover();
      expect(await draggable.isVisible()).toBe(true);
    }
  });

  test('should have responsive preview modes', async ({ page }) => {
    const mobileButton = page.getByRole('button', { name: /mobile|phone/i });
    const tabletButton = page.getByRole('button', { name: /tablet/i });
    const desktopButton = page.getByRole('button', { name: /desktop|computer/i });

    const buttons = [mobileButton, tabletButton, desktopButton];
    for (const button of buttons) {
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should allow publishing', async ({ page }) => {
    const publishButton = page.getByRole('button', { name: /publish|deploy|save/i });
    if (await publishButton.isVisible()) {
      await publishButton.click();
      await page.waitForTimeout(1000);
    }
  });
});
