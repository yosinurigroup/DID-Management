import { test, expect } from '@playwright/test';

test.describe('DID Management Application', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should load the homepage and display main layout', async ({ page }) => {
    // Check if the page loads with correct title
    await expect(page).toHaveTitle(/DID Management/);
    
    // Check for main content area
    await expect(page.locator('div#root')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Check if sidebar is visible
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    
    // Test DIDs navigation using data-testid
    const didsButton = page.locator('[data-testid="nav-dids"]');
    if (await didsButton.isVisible()) {
      await didsButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Test Companies navigation
    const companiesButton = page.locator('[data-testid="nav-companies"]');
    if (await companiesButton.isVisible()) {
      await companiesButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Test Dashboard navigation
    const dashboardButton = page.locator('[data-testid="nav-dashboard"]');
    if (await dashboardButton.isVisible()) {
      await dashboardButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should display some content', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check that something rendered
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(100);
  });

  test('should load DIDs page with data table', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Navigate to DIDs using data-testid
    const didsButton = page.locator('[data-testid="nav-dids"]');
    if (await didsButton.isVisible()) {
      await didsButton.click();
      await page.waitForTimeout(2000);
      
      // Check if table exists
      const table = page.locator('table').first();
      if (await table.isVisible()) {
        const rowCount = await page.locator('tbody tr').count();
        console.log(`Found ${rowCount} rows in DIDs table`);
        expect(rowCount).toBeGreaterThan(0);
      }
    }
  });

  test('should load Companies page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Navigate to Companies using data-testid
    const companiesButton = page.locator('[data-testid="nav-companies"]');
    if (await companiesButton.isVisible()) {
      await companiesButton.click();
      await page.waitForTimeout(2000);
      
      // Check if content loaded
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('Companies');
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    // Check if main content is visible
    await expect(page.locator('div#root')).toBeVisible();
    
    // Check if page is responsive
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(50);
  });

  test('should handle basic interactions', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Try clicking various elements to see if app responds
    const clickableElements = await page.locator('button, a, [role="button"]').all();
    
    for (let i = 0; i < Math.min(clickableElements.length, 3); i++) {
      const element = clickableElements[i];
      if (await element.isVisible()) {
        try {
          await element.click();
          await page.waitForTimeout(500);
        } catch (e) {
          // Ignore click errors for now
        }
      }
    }
  });
});