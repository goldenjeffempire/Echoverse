
import { chromium, Browser, Page } from '@playwright/test';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const SCREENSHOT_DIR = 'screenshots';
const BASE_URL = 'http://0.0.0.0:5000';

// All platform pages to capture
const PAGES = [
  { name: 'landing-page', path: '/', waitFor: 'h1' },
  { name: 'login', path: '/login', waitFor: 'form' },
  { name: 'register', path: '/register', waitFor: 'form' },
  { name: 'dashboard', path: '/dashboard', waitFor: 'h1', requiresAuth: true },
  { name: 'ai-builder', path: '/ai-builder', waitFor: 'h1' },
  { name: 'website-builder', path: '/builder', waitFor: 'h1' },
  { name: 'ecommerce', path: '/ecommerce', waitFor: 'h1' },
  { name: 'cms', path: '/cms', waitFor: 'h1' },
  { name: 'community', path: '/community', waitFor: 'h1' },
  { name: 'marketing', path: '/marketing', waitFor: 'h1' },
  { name: 'marketplace', path: '/marketplace', waitFor: 'h1' },
  { name: 'users', path: '/users', waitFor: 'h1', requiresAuth: true },
  { name: 'settings', path: '/settings', waitFor: 'h1', requiresAuth: true },
  { name: 'profile', path: '/profile', waitFor: 'h1', requiresAuth: true },
  { name: 'products', path: '/products', waitFor: 'h1' },
  { name: 'checkout', path: '/checkout', waitFor: 'h1' },
  { name: 'pricing', path: '/pricing', waitFor: 'h1' },
  { name: 'templates', path: '/templates', waitFor: 'h1' },
  { name: 'ai-demo', path: '/ai-demo', waitFor: 'h1' },
  { name: 'blog', path: '/blog', waitFor: 'h1' },
  { name: 'about', path: '/about', waitFor: 'h1' },
  { name: 'contact', path: '/contact', waitFor: 'h1' },
  { name: 'careers', path: '/careers', waitFor: 'h1' },
  { name: 'documentation', path: '/documentation', waitFor: 'h1' },
  { name: 'api-reference', path: '/api-reference', waitFor: 'h1' },
  { name: 'support', path: '/support', waitFor: 'h1' },
  { name: 'privacy', path: '/privacy', waitFor: 'h1' },
  { name: 'terms', path: '/terms', waitFor: 'h1' },
  { name: 'cookie-policy', path: '/cookie-policy', waitFor: 'h1' },
];

async function login(page: Page): Promise<void> {
  console.log('Logging in for authenticated pages...');
  await page.goto(`${BASE_URL}/register`);
  await page.waitForLoadState('networkidle');
  
  const timestamp = Date.now();
  const email = `screenshot-user-${timestamp}@example.com`;
  const password = 'Screenshot123!@#';
  
  // Try to register
  try {
    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', password);
    
    const confirmPasswordField = page.locator('input[name="confirmPassword"], input[name="confirm_password"]');
    if (await confirmPasswordField.count() > 0) {
      await confirmPasswordField.fill(password);
    }
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    console.log('User registered successfully');
  } catch (error) {
    console.log('Registration failed, trying login...');
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  }
}

async function captureScreenshot(
  page: Page,
  name: string,
  path: string,
  waitFor: string
): Promise<void> {
  console.log(`Capturing: ${name} (${path})`);
  
  try {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for the specified element
    await page.waitForSelector(waitFor, { timeout: 10000 }).catch(() => {
      console.log(`  Warning: Could not find selector "${waitFor}", continuing anyway`);
    });
    
    // Wait for any animations to complete
    await page.waitForTimeout(1000);
    
    // Scroll to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    
    // Take full page screenshot
    const screenshotPath = join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });
    
    console.log(`  ✓ Saved: ${screenshotPath}`);
    
    // Also capture viewport screenshot
    const viewportPath = join(SCREENSHOT_DIR, `${name}-viewport.png`);
    await page.screenshot({
      path: viewportPath,
      fullPage: false,
    });
    
    console.log(`  ✓ Saved: ${viewportPath}`);
    
  } catch (error) {
    console.error(`  ✗ Failed to capture ${name}:`, error.message);
  }
}

async function main() {
  console.log('Starting screenshot capture...\n');
  
  // Create screenshots directory
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  
  // Launch browser
  const browser: Browser = await chromium.launch({
    headless: true,
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  
  const page: Page = await context.newPage();
  
  try {
    let isAuthenticated = false;
    
    for (const pageConfig of PAGES) {
      // Login if needed
      if (pageConfig.requiresAuth && !isAuthenticated) {
        await login(page);
        isAuthenticated = true;
      }
      
      await captureScreenshot(
        page,
        pageConfig.name,
        pageConfig.path,
        pageConfig.waitFor
      );
      
      // Small delay between screenshots
      await page.waitForTimeout(500);
    }
    
    console.log('\n✓ All screenshots captured successfully!');
    console.log(`Screenshots saved in: ${SCREENSHOT_DIR}/`);
    
  } catch (error) {
    console.error('Error during screenshot capture:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
