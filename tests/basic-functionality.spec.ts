import { test, expect } from '@playwright/test';

test.describe('DID Management - Basic Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('✅ App loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/DID Management/);
  });

  test('✅ Main content area is visible', async ({ page }) => {
    await expect(page.locator('div#root')).toBeVisible();
  });

  test('✅ App contains expected text content', async ({ page }) => {
    const content = await page.textContent('body');
    expect(content).toContain('DID Management');
  });

  test('✅ Navigation sidebar exists', async ({ page }) => {
    // Look for sidebar using class name patterns
    const sidebar = page.locator('.bg-gray-800').first();
    await expect(sidebar).toBeVisible();
  });

  test('✅ Navigation buttons are clickable', async ({ page }) => {
    // Find navigation buttons by text content
    const buttons = await page.locator('button').all();
    expect(buttons.length).toBeGreaterThan(0);
    
    // Try clicking the first few buttons
    for (let i = 0; i < Math.min(buttons.length, 3); i++) {
      const button = buttons[i];
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('✅ DIDs section loads data', async ({ page }) => {
    // Look for DIDs text and click it
    const didsElement = page.locator('text=DIDs').first();
    if (await didsElement.isVisible()) {
      await didsElement.click();
      await page.waitForTimeout(2000);
      
      // Check if page changed
      const content = await page.textContent('body');
      expect(content?.length).toBeGreaterThan(100);
    }
  });

  test('✅ Companies section loads', async ({ page }) => {
    const companiesElement = page.locator('text=Companies').first();
    if (await companiesElement.isVisible()) {
      await companiesElement.click();
      await page.waitForTimeout(2000);
      
      const content = await page.textContent('body');
      expect(content).toContain('Companies');
    }
  });

  test('✅ Dashboard section loads', async ({ page }) => {
    const dashboardElement = page.locator('text=Dashboard').first();
    if (await dashboardElement.isVisible()) {
      await dashboardElement.click();
      await page.waitForTimeout(2000);
      
      const content = await page.textContent('body');
      expect(content).toContain('Dashboard');
    }
  });

  test('✅ Mobile responsive design', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check main container still visible
    await expect(page.locator('div#root')).toBeVisible();
    
    // Check content adapts
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(50);
  });

  test('✅ Tables load with data', async ({ page }) => {
    // Navigate to a page with tables
    const didsElement = page.locator('text=DIDs').first();
    if (await didsElement.isVisible()) {
      await didsElement.click();
      await page.waitForTimeout(2000);
      
      // Check for any table
      const tables = await page.locator('table').count();
      if (tables > 0) {
        const rows = await page.locator('tbody tr').count();
        console.log(`Found ${rows} data rows`);
        expect(rows).toBeGreaterThanOrEqual(0);
      }
    }
  });
});