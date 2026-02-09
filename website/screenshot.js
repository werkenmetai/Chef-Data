const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const pages = ['index.html', 'biografie.html', 'bibliografie.html', 'evenementen.html', 'blog.html', 'word-vriend.html', 'contact.html'];

  for (const page of pages) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const tab = await context.newPage();
    const filePath = path.resolve(__dirname, page);
    await tab.goto(`file://${filePath}`);
    await tab.waitForTimeout(500);

    // Make all fade-in elements visible for screenshot
    await tab.addStyleTag({ content: '.fade-in { opacity: 1 !important; transform: none !important; }' });
    await tab.waitForTimeout(300);

    const name = page.replace('.html', '');
    // Full page screenshot
    await tab.screenshot({ path: path.resolve(__dirname, `screenshots/${name}-desktop.png`), fullPage: true });

    // Mobile
    await tab.setViewportSize({ width: 375, height: 812 });
    await tab.waitForTimeout(300);
    await tab.screenshot({ path: path.resolve(__dirname, `screenshots/${name}-mobile.png`), fullPage: true });

    console.log(`Screenshot: ${name}`);
    await context.close();
  }

  await browser.close();
  console.log('Done!');
})();
