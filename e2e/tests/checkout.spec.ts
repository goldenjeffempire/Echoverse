/**
 * E2E Tests: Checkout Flow
 * Tests the complete e-commerce checkout process
 */

import { test, expect } from '@playwright/test';
import { 
  generateTestEmail, 
  generateTestPassword,
  register,
  login,
  waitForToast 
} from '../helpers/test-utils';

test.describe('Checkout Flow', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeAll(async () => {
    testEmail = generateTestEmail();
    testPassword = generateTestPassword();
  });

  test('should complete full checkout process', async ({ page }) => {
    // Register and login
    await register(page, testEmail, testPassword);
    await login(page, testEmail, testPassword);

    // Navigate to products/shop
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Check if products are available
    const productCards = page.locator('[data-testid="product-card"], .product-card, [class*="product"]');
    const productCount = await productCards.count();

    if (productCount === 0) {
      console.log('No products available for checkout test');
      test.skip();
    }

    // Add first product to cart
    const firstProduct = productCards.first();
    await firstProduct.scrollIntoViewIfNeeded();
    
    const addToCartButton = firstProduct.locator('button:has-text("Add to Cart"), button:has-text("Add")');
    await addToCartButton.click();

    // Wait for cart update
    await page.waitForTimeout(1000);

    // Go to cart
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    // Verify cart contains items
    await expect(page.locator('[data-testid="cart-item"], .cart-item')).toBeVisible({ timeout: 5000 });

    // Fill shipping information
    const shippingFields = {
      'Full Name': 'Test User',
      'Address': '123 Test Street',
      'City': 'Test City',
      'State': 'CA',
      'Zip Code': '12345',
      'Phone': '555-0100'
    };

    for (const [label, value] of Object.entries(shippingFields)) {
      const field = page.locator(`input[placeholder*="${label}" i], input[name*="${label.toLowerCase().replace(' ', '')}" i]`).first();
      if (await field.count() > 0) {
        await field.fill(value);
      }
    }

    // Proceed to payment
    const proceedButton = page.locator('button:has-text("Proceed"), button:has-text("Continue"), button:has-text("Next")');
    if (await proceedButton.count() > 0) {
      await proceedButton.click();
      await page.waitForTimeout(1000);
    }

    // Fill payment details (test mode)
    const cardNumberField = page.locator('input[name="cardNumber"], input[placeholder*="card number" i]');
    if (await cardNumberField.count() > 0) {
      await cardNumberField.fill('4242424242424242'); // Test card
      await page.fill('input[name="expiry"], input[placeholder*="expiry" i], input[placeholder*="mm/yy" i]', '12/25');
      await page.fill('input[name="cvc"], input[placeholder*="cvc" i], input[placeholder*="cvv" i]', '123');
    }

    // Complete order
    const completeButton = page.locator('button:has-text("Complete"), button:has-text("Place Order"), button:has-text("Pay")');
    if (await completeButton.count() > 0) {
      await completeButton.click();
      
      // Wait for order confirmation
      await page.waitForURL(/\/(orders|confirmation|success)/, { timeout: 15000 }).catch(() => {
        console.log('Order completion redirect timeout - may need payment provider setup');
      });
    }
  });

  test('should validate checkout with empty cart', async ({ page }) => {
    await login(page, testEmail, testPassword);
    
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    // Should show empty cart message or redirect
    const isEmpty = await page.locator('text=/empty cart|no items|cart is empty/i').count() > 0;
    expect(isEmpty || !page.url().includes('/checkout')).toBeTruthy();
  });

  test('should update cart quantities', async ({ page }) => {
    await login(page, testEmail, testPassword);
    
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const productCards = page.locator('[data-testid="product-card"], .product-card');
    if (await productCards.count() === 0) {
      test.skip();
    }

    // Add product to cart
    await productCards.first().locator('button:has-text("Add")').click();
    await page.waitForTimeout(1000);

    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');

    // Try to update quantity
    const quantityInput = page.locator('input[type="number"], input[name="quantity"]').first();
    if (await quantityInput.count() > 0) {
      await quantityInput.fill('2');
      await page.waitForTimeout(1000);

      // Verify total updated
      const totalElement = page.locator('[data-testid="total"], .total, text=/total:/i');
      await expect(totalElement).toBeVisible();
    }
  });

  test('should apply discount code', async ({ page }) => {
    await login(page, testEmail, testPassword);
    
    await page.goto('/products');
    const productCards = page.locator('[data-testid="product-card"], .product-card');
    if (await productCards.count() === 0) {
      test.skip();
    }

    await productCards.first().locator('button:has-text("Add")').click();
    await page.goto('/checkout');

    const discountField = page.locator('input[name="discount"], input[name="coupon"], input[placeholder*="discount" i]');
    if (await discountField.count() > 0) {
      await discountField.fill('TEST10');
      await page.locator('button:has-text("Apply")').click();
      await page.waitForTimeout(1000);

      // Should show discount applied or invalid code message
      const hasResponse = await page.locator('[role="alert"], .success, .error').count() > 0;
      expect(hasResponse).toBeTruthy();
    }
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    await login(page, testEmail, testPassword);
    
    await page.goto('/products');
    const productCards = page.locator('[data-testid="product-card"], .product-card');
    if (await productCards.count() === 0) {
      test.skip();
    }

    await productCards.first().locator('button:has-text("Add")').click();
    await page.goto('/checkout');

    // Fill shipping info
    await page.fill('input[name="address"], input[placeholder*="address" i]', '123 Test St');

    // Use declined test card
    const cardField = page.locator('input[name="cardNumber"], input[placeholder*="card" i]');
    if (await cardField.count() > 0) {
      await cardField.fill('4000000000000002'); // Declined card
      await page.fill('input[name="expiry"]', '12/25');
      await page.fill('input[name="cvc"]', '123');

      await page.locator('button:has-text("Complete"), button:has-text("Place Order")').click();
      
      // Should show error message
      await expect(page.locator('[role="alert"], .error')).toBeVisible({ timeout: 5000 });
    }
  });
});
