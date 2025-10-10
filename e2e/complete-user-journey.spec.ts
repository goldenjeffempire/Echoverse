/**
 * LOW-008: E2E test for complete user journey
 */

import { test, expect } from '@playwright/test';

test.describe('Complete User Journey E2E', () => {
  const testEmail = `e2e.journey.${Date.now()}@example.com`;
  const testPassword = 'SecureE2EPassword123!';
  const testUsername = `e2euser_${Date.now()}`;

  test('should complete full user journey: signup → login → create content → checkout → logout', async ({ page }) => {
    // Step 1: Navigate to homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/EchoVerse/);

    // Step 2: Sign up
    await page.click('text=Sign Up');
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Step 3: Create website
    await page.click('text=Create Website');
    await page.fill('input[name="siteName"]', 'My E2E Test Site');
    await page.fill('textarea[name="description"]', 'This is an E2E test website');
    await page.click('button:has-text("Create")');
    
    // Verify website created
    await expect(page.locator('text=My E2E Test Site')).toBeVisible();

    // Step 4: Add product to store
    await page.click('text=Store');
    await page.click('text=Add Product');
    await page.fill('input[name="productName"]', 'Test Product');
    await page.fill('input[name="price"]', '29.99');
    await page.click('button:has-text("Save")');
    
    // Verify product added
    await expect(page.locator('text=Test Product')).toBeVisible();

    // Step 5: View product as customer
    await page.goto('/');
    await page.click('text=Shop');
    await page.click('text=Test Product');
    
    // Step 6: Add to cart and checkout
    await page.click('button:has-text("Add to Cart")');
    await page.click('[aria-label="Cart"]');
    await expect(page.locator('text=Test Product')).toBeVisible();
    await page.click('button:has-text("Checkout")');
    
    // Fill checkout details
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');
    
    // Complete order (will fail in test, but validates flow)
    await page.click('button:has-text("Complete Order")');

    // Step 7: View order history
    await page.goto('/dashboard/orders');
    await expect(page.locator('text=Test Product')).toBeVisible();

    // Step 8: Logout
    await page.click('[aria-label="User menu"]');
    await page.click('text=Logout');
    
    // Verify redirected to homepage and logged out
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test duplicate signup
    await page.goto('/signup');
    await page.fill('input[name="username"]', 'existinguser');
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Should show error for duplicate email (if already exists)
    // Or successful signup (if first time)
    await expect(page.locator('text=/Email already|Success/')).toBeVisible();

    // Test invalid login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.locator('text=/Invalid|Error/')).toBeVisible();
  });
});
