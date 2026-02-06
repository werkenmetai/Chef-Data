import { test, expect } from '@playwright/test';

test.describe('Praat met je Boekhouding Dashboard', () => {
  test('dashboard page loads', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('https://praatmetjeboekhouding.nl/dashboard');

    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/dashboard.png', fullPage: true });

    // Log the page title
    const title = await page.title();
    console.log('Page title:', title);

    // Log the current URL (in case of redirect)
    console.log('Current URL:', page.url());

    // Check if page loaded (not a 404 or error)
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Get page content for analysis
    const content = await page.content();
    console.log('Page length:', content.length, 'characters');
  });

  test('check dashboard elements', async ({ page }) => {
    await page.goto('https://praatmetjeboekhouding.nl/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Screenshot after full load
    await page.screenshot({ path: 'tests/screenshots/dashboard-loaded.png', fullPage: true });

    // List all headings
    const headings = await page.locator('h1, h2, h3').allTextContents();
    console.log('Headings found:', headings);

    // List all buttons
    const buttons = await page.locator('button').allTextContents();
    console.log('Buttons found:', buttons);

    // List all links
    const links = await page.locator('a').evaluateAll(els =>
      els.map(el => ({ text: el.textContent?.trim(), href: el.getAttribute('href') }))
    );
    console.log('Links found:', links.length);
  });
});
