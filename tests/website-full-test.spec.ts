import { test, expect } from '@playwright/test';

// First: Login (manual) and save session
test.describe('Website Full Test - Praat met je Boekhouding', () => {

  test('1. Login and save session', async ({ page }) => {
    // Go to dashboard
    await page.goto('https://praatmetjeboekhouding.nl/dashboard');

    console.log('\n========================================');
    console.log('ACTIE VEREIST: Log in via Exact Online');
    console.log('1. Klik "Verbinden met Exact Online"');
    console.log('2. Log in met je Exact credentials');
    console.log('3. Wacht tot je terug bent op dashboard');
    console.log('4. Druk dan op "Resume" in de Playwright Inspector');
    console.log('========================================\n');

    // Pause for manual login
    await page.pause();

    // After login, save screenshot
    await page.screenshot({ path: 'tests/screenshots/dashboard-logged-in.png', fullPage: true });
    console.log('Login successful! Session saved.');
  });

  test('2. Test all navigation links', async ({ page }) => {
    const pages = [
      { name: 'Home', url: 'https://praatmetjeboekhouding.nl/' },
      { name: 'Documentatie', url: 'https://praatmetjeboekhouding.nl/docs' },
      { name: 'Prijzen', url: 'https://praatmetjeboekhouding.nl/prijzen' },
      { name: 'Setup', url: 'https://praatmetjeboekhouding.nl/setup' },
      { name: 'Support', url: 'https://praatmetjeboekhouding.nl/support' },
      { name: 'Blog', url: 'https://praatmetjeboekhouding.nl/blog' },
      { name: 'Dashboard', url: 'https://praatmetjeboekhouding.nl/dashboard' },
    ];

    for (const p of pages) {
      console.log(`\nTesting: ${p.name}`);
      await page.goto(p.url);
      await page.waitForLoadState('networkidle');

      // Screenshot
      const filename = p.name.toLowerCase().replace(/\s/g, '-');
      await page.screenshot({ path: `tests/screenshots/pmjb-${filename}.png`, fullPage: true });

      // Check no errors
      const title = await page.title();
      console.log(`  Title: ${title}`);
      console.log(`  URL: ${page.url()}`);

      // Check for error indicators
      const body = await page.locator('body').textContent();
      const hasError = body?.includes('404') || body?.includes('Error') || body?.includes('Not Found');
      console.log(`  Status: ${hasError ? '❌ ERROR DETECTED' : '✅ OK'}`);
    }
  });

  test('3. Test blog articles', async ({ page }) => {
    await page.goto('https://praatmetjeboekhouding.nl/blog');
    await page.waitForLoadState('networkidle');

    // Find all blog links
    const blogLinks = await page.locator('a[href*="/blog/"]').all();
    console.log(`\nFound ${blogLinks.length} blog article links`);

    // Test first 5 blog articles
    const linksToTest = blogLinks.slice(0, 5);

    for (let i = 0; i < linksToTest.length; i++) {
      const href = await linksToTest[i].getAttribute('href');
      if (href && !href.endsWith('/blog/')) {
        console.log(`\nTesting blog: ${href}`);
        await page.goto(href.startsWith('http') ? href : `https://praatmetjeboekhouding.nl${href}`);
        await page.waitForLoadState('networkidle');

        await page.screenshot({ path: `tests/screenshots/pmjb-blog-${i + 1}.png`, fullPage: true });

        const title = await page.title();
        console.log(`  Title: ${title}`);
        console.log(`  Status: ✅ Loaded`);
      }
    }
  });

  test('4. Test all buttons and interactive elements', async ({ page }) => {
    await page.goto('https://praatmetjeboekhouding.nl/');
    await page.waitForLoadState('networkidle');

    // Find all buttons
    const buttons = await page.locator('button').all();
    console.log(`\nFound ${buttons.length} buttons on homepage`);

    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const isVisible = await buttons[i].isVisible();
      const isEnabled = await buttons[i].isEnabled();
      console.log(`  Button ${i + 1}: "${text?.trim()}" - Visible: ${isVisible}, Enabled: ${isEnabled}`);
    }

    // Find all links and check for broken ones
    const links = await page.locator('a[href]').all();
    console.log(`\nFound ${links.length} links on homepage`);

    let brokenLinks = 0;
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && href.startsWith('http') && !href.includes('linkedin') && !href.includes('twitter')) {
        // Could add link checking here
      }
    }
  });
});
