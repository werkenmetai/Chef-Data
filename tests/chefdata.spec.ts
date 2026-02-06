import { test, expect } from '@playwright/test';

test.describe('Chef Data Website', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('https://chefdata.nl');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Screenshot
    await page.screenshot({ path: 'tests/screenshots/chefdata-home.png', fullPage: true });

    // Log info
    const title = await page.title();
    console.log('Page title:', title);
    console.log('Current URL:', page.url());

    // Get headings
    const headings = await page.locator('h1, h2, h3').allTextContents();
    console.log('Headings:', headings);
  });
});
