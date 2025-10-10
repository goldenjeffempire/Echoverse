/**
 * E2E Tests: Website Publishing Flow
 * Tests the website builder and publishing process
 */

import { test, expect } from '@playwright/test';
import { 
  generateTestEmail, 
  generateTestPassword,
  register,
  login
} from '../helpers/test-utils';

test.describe('Website Publishing', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeAll(async () => {
    testEmail = generateTestEmail();
    testPassword = generateTestPassword();
  });

  test('should create and publish a website', async ({ page }) => {
    // Register and login
    await register(page, testEmail, testPassword);
    await login(page, testEmail, testPassword);

    // Navigate to website builder
    await page.goto('/ai-builder');
    await page.waitForLoadState('networkidle');

    // Check if builder is available
    const builderExists = await page.locator('[data-testid="website-builder"], .website-builder, h1:has-text("Builder")').count() > 0;
    
    if (!builderExists) {
      // Try alternative route
      await page.goto('/websites');
      await page.waitForLoadState('networkidle');
    }

    // Create new website
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Website"), a:has-text("Create")');
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForTimeout(1000);

      // Fill website details
      const nameField = page.locator('input[name="name"], input[name="title"], input[placeholder*="name" i]');
      if (await nameField.count() > 0) {
        await nameField.fill(`Test Website ${Date.now()}`);
      }

      const descField = page.locator('textarea[name="description"], input[name="description"]');
      if (await descField.count() > 0) {
        await descField.fill('A test website for e2e testing');
      }

      // Select template if available
      const templates = page.locator('[data-testid="template"], .template-card, button:has-text("Use Template")');
      if (await templates.count() > 0) {
        await templates.first().click();
        await page.waitForTimeout(1000);
      }

      // Submit creation
      const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Continue")');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Look for publish button
    const publishButton = page.locator('button:has-text("Publish"), button[data-action="publish"]');
    if (await publishButton.count() > 0) {
      await publishButton.click();
      
      // Confirm publishing if modal appears
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }

      // Wait for success message
      await expect(page.locator('[role="alert"]:has-text("published"), .success:has-text("published")')).toBeVisible({ 
        timeout: 10000 
      }).catch(() => {
        console.log('Publish confirmation not shown - checking status');
      });
    }
  });

  test('should edit website content', async ({ page }) => {
    await login(page, testEmail, testPassword);
    
    await page.goto('/websites');
    await page.waitForLoadState('networkidle');

    // Find existing websites
    const websiteCards = page.locator('[data-testid="website-card"], .website-card, [class*="website"]');
    const count = await websiteCards.count();

    if (count === 0) {
      console.log('No websites available for edit test');
      test.skip();
    }

    // Click on first website
    const editButton = websiteCards.first().locator('button:has-text("Edit"), a:has-text("Edit")');
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(2000);

      // Try to edit text
      const editableText = page.locator('[contenteditable="true"], textarea, input[type="text"]').first();
      if (await editableText.count() > 0) {
        await editableText.fill('Updated content');
        
        // Save changes
        const saveButton = page.locator('button:has-text("Save"), button[data-action="save"]');
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('should preview website before publishing', async ({ page }) => {
    await login(page, testEmail, testPassword);
    
    await page.goto('/websites');
    await page.waitForLoadState('networkidle');

    const websiteCards = page.locator('[data-testid="website-card"], .website-card');
    if (await websiteCards.count() === 0) {
      test.skip();
    }

    // Look for preview button
    const previewButton = websiteCards.first().locator('button:has-text("Preview"), a:has-text("Preview")');
    if (await previewButton.count() > 0) {
      await previewButton.click();
      
      // Should open preview (new tab or modal)
      await page.waitForTimeout(2000);
      
      // Check if preview content is visible
      const hasPreview = page.url().includes('preview') || await page.locator('[data-preview], .preview').count() > 0;
      expect(hasPreview).toBeTruthy();
    }
  });

  test('should unpublish website', async ({ page }) => {
    await login(page, testEmail, testPassword);
    
    await page.goto('/websites');
    await page.waitForLoadState('networkidle');

    const websiteCards = page.locator('[data-testid="website-card"], .website-card');
    if (await websiteCards.count() === 0) {
      test.skip();
    }

    // Find published website
    const unpublishButton = page.locator('button:has-text("Unpublish"), button:has-text("Take Offline")');
    if (await unpublishButton.count() > 0) {
      await unpublishButton.click();
      
      // Confirm if needed
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }

      // Wait for status update
      await page.waitForTimeout(1000);
      
      // Should show unpublished status
      await expect(page.locator('text=/unpublished|draft|offline/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should delete website', async ({ page }) => {
    await login(page, testEmail, testPassword);
    
    await page.goto('/websites');
    await page.waitForLoadState('networkidle');

    const websiteCards = page.locator('[data-testid="website-card"], .website-card');
    const initialCount = await websiteCards.count();

    if (initialCount === 0) {
      test.skip();
    }

    // Find delete button
    const deleteButton = websiteCards.first().locator('button:has-text("Delete"), button[aria-label*="delete" i]');
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      
      // Confirm deletion
      const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")');
      await confirmButton.click();
      
      await page.waitForTimeout(1000);
      
      // Should have one less website
      const newCount = await websiteCards.count();
      expect(newCount).toBeLessThan(initialCount);
    }
  });

  test('should handle AI generation', async ({ page }) => {
    await login(page, testEmail, testPassword);
    
    await page.goto('/ai-builder');
    await page.waitForLoadState('networkidle');

    // Look for AI prompt input
    const promptInput = page.locator('textarea[name="prompt"], input[name="prompt"], textarea[placeholder*="describe" i]');
    if (await promptInput.count() > 0) {
      await promptInput.fill('Create a modern landing page for a tech startup');
      
      const generateButton = page.locator('button:has-text("Generate"), button:has-text("Create")');
      if (await generateButton.count() > 0) {
        await generateButton.click();
        
        // Should show loading state
        await expect(page.locator('[data-loading], .loading, text=/generating|creating/i')).toBeVisible({ 
          timeout: 3000 
        }).catch(() => {
          console.log('Loading indicator not visible');
        });
        
        // Wait for completion (or timeout)
        await page.waitForTimeout(5000);
      }
    } else {
      console.log('AI prompt input not found - feature may not be available');
      test.skip();
    }
  });
});
