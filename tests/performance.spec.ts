import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load homepage quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Check for Core Web Vitals
    const performanceMetrics = await page.evaluate(() => {
      return JSON.stringify(performance.getEntriesByType('navigation'));
    });
    
    console.log('Performance metrics:', performanceMetrics);
  });

  test('should handle large data tables efficiently', async ({ page }) => {
    await page.goto('/');
    await page.click('text=DIDs');
    
    const startTime = Date.now();
    await page.waitForSelector('table');
    const tableLoadTime = Date.now() - startTime;
    
    // Table should load within 2 seconds
    expect(tableLoadTime).toBeLessThan(2000);
    
    // Check if table is responsive
    const tableRows = await page.locator('tbody tr').count();
    console.log(`Table loaded with ${tableRows} rows in ${tableLoadTime}ms`);
  });

  test('should handle rapid navigation', async ({ page }) => {
    await page.goto('/');
    
    const pages = ['Dashboard', 'DIDs', 'Companies', 'Area Codes', 'Upload Data'];
    
    for (const pageName of pages) {
      const startTime = Date.now();
      await page.click(`text=${pageName}`);
      await page.waitForSelector('h1');
      const navigationTime = Date.now() - startTime;
      
      // Each navigation should be under 1 second
      expect(navigationTime).toBeLessThan(1000);
      console.log(`${pageName} navigation took ${navigationTime}ms`);
    }
  });

  test('should handle concurrent API requests', async ({ page }) => {
    await page.goto('/');
    
    // Start multiple API requests simultaneously
    const promises = [
      page.request.get('http://localhost:3001/api/dids'),
      page.request.get('http://localhost:3001/api/companies'),
      page.request.get('http://localhost:3001/api/areacodes')
    ];
    
    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    // All requests should complete within 3 seconds
    expect(totalTime).toBeLessThan(3000);
    
    // All responses should be successful
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });
    
    console.log(`Concurrent API requests completed in ${totalTime}ms`);
  });
});