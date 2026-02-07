#!/usr/bin/env node

/**
 * Website Migration Tool
 *
 * Crawlt een website, maakt screenshots, downloadt alle assets (images, fonts, etc.),
 * extraheert content en slaat alles gestructureerd op.
 *
 * Gebruik:
 *   node migrate.js --url https://example.com --output ./output
 *   node migrate.js --url https://example.com --crawl-only
 *   node migrate.js --url https://example.com --screenshots-only
 *   node migrate.js --url https://example.com --assets-only
 *   node migrate.js --url https://example.com --content-only
 */

const { chromium } = require('playwright');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const mime = require('mime-types');

// --- CLI Arguments ---
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('url', {
    alias: 'u',
    type: 'string',
    description: 'De URL van de website om te migreren',
    demandOption: true,
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'Output directory',
    default: './output',
  })
  .option('max-pages', {
    type: 'number',
    description: 'Maximum aantal paginas om te crawlen',
    default: 100,
  })
  .option('delay', {
    type: 'number',
    description: 'Vertraging tussen paginas (ms)',
    default: 1000,
  })
  .option('crawl-only', { type: 'boolean', default: false })
  .option('screenshots-only', { type: 'boolean', default: false })
  .option('assets-only', { type: 'boolean', default: false })
  .option('content-only', { type: 'boolean', default: false })
  .option('viewport-width', { type: 'number', default: 1440 })
  .option('viewport-height', { type: 'number', default: 900 })
  .option('mobile', { type: 'boolean', default: false, description: 'Ook mobile screenshots maken' })
  .help()
  .argv;

// --- Directories ---
const OUTPUT_DIR = path.resolve(argv.output);
const DIRS = {
  screenshots: path.join(OUTPUT_DIR, 'screenshots'),
  screenshotsMobile: path.join(OUTPUT_DIR, 'screenshots', 'mobile'),
  images: path.join(OUTPUT_DIR, 'assets', 'images'),
  fonts: path.join(OUTPUT_DIR, 'assets', 'fonts'),
  css: path.join(OUTPUT_DIR, 'assets', 'css'),
  js: path.join(OUTPUT_DIR, 'assets', 'js'),
  videos: path.join(OUTPUT_DIR, 'assets', 'videos'),
  documents: path.join(OUTPUT_DIR, 'assets', 'documents'),
  content: path.join(OUTPUT_DIR, 'content'),
  data: path.join(OUTPUT_DIR, 'data'),
};

// --- State ---
const visited = new Set();
const pagesToVisit = [];
const allAssets = {
  images: [],
  fonts: [],
  css: [],
  js: [],
  videos: [],
  documents: [],
};
const siteMap = [];
const errors = [];

// --- Helpers ---

function ensureDirs() {
  Object.values(DIRS).forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true });
  });
}

function isSameOrigin(baseUrl, testUrl) {
  try {
    const base = new URL(baseUrl);
    const test = new URL(testUrl, baseUrl);
    return base.hostname === test.hostname;
  } catch {
    return false;
  }
}

function urlToFilename(url) {
  try {
    const parsed = new URL(url);
    let pathname = parsed.pathname.replace(/^\//, '').replace(/\/$/, '') || 'index';
    pathname = pathname.replace(/\//g, '_');
    // Verwijder query params voor filename
    return pathname.replace(/[^a-zA-Z0-9_.-]/g, '_');
  } catch {
    return 'unknown';
  }
}

function getAssetCategory(url, contentType) {
  const ext = path.extname(new URL(url, 'http://base').pathname).toLowerCase();
  const ct = (contentType || '').toLowerCase();

  if (ct.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.avif', '.bmp'].includes(ext)) {
    return 'images';
  }
  if (ct.includes('font') || ['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(ext)) {
    return 'fonts';
  }
  if (ct.includes('css') || ext === '.css') return 'css';
  if (ct.includes('javascript') || ext === '.js') return 'js';
  if (ct.includes('video') || ['.mp4', '.webm', '.ogg', '.mov'].includes(ext)) return 'videos';
  if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) return 'documents';
  if (ct.startsWith('image/')) return 'images';
  return null;
}

async function downloadAsset(url, category) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebsiteMigrationBot/1.0)',
      },
    });

    const parsed = new URL(url);
    let filename = path.basename(parsed.pathname) || 'unknown';
    // Zorg voor extensie
    if (!path.extname(filename)) {
      const ext = mime.extension(response.headers['content-type']);
      if (ext) filename += '.' + ext;
    }

    // Maak uniek als nodig
    let filepath = path.join(DIRS[category], filename);
    let counter = 1;
    while (fs.existsSync(filepath)) {
      const ext = path.extname(filename);
      const base = path.basename(filename, ext);
      filepath = path.join(DIRS[category], `${base}_${counter}${ext}`);
      counter++;
    }

    fs.writeFileSync(filepath, response.data);

    return {
      originalUrl: url,
      localPath: path.relative(OUTPUT_DIR, filepath),
      size: response.data.length,
      contentType: response.headers['content-type'],
    };
  } catch (err) {
    errors.push({ type: 'asset_download', url, error: err.message });
    return null;
  }
}

// --- Core Functions ---

async function crawlPage(browser, url, baseUrl) {
  if (visited.has(url) || visited.size >= argv.maxPages) return null;
  visited.add(url);

  const context = await browser.newContext({
    viewport: { width: argv.viewportWidth, height: argv.viewportHeight },
    userAgent: 'Mozilla/5.0 (compatible; WebsiteMigrationBot/1.0)',
  });
  const page = await context.newPage();

  console.log(`[${visited.size}/${argv.maxPages}] Crawling: ${url}`);

  const pageData = {
    url,
    title: '',
    description: '',
    headings: [],
    links: [],
    images: [],
    text: '',
    meta: {},
  };

  try {
    // Onderschep network requests voor assets
    const interceptedAssets = [];
    page.on('response', async (response) => {
      try {
        const responseUrl = response.url();
        const contentType = response.headers()['content-type'] || '';
        const category = getAssetCategory(responseUrl, contentType);
        if (category && isSameOrigin(baseUrl, responseUrl)) {
          interceptedAssets.push({ url: responseUrl, category, contentType });
        }
      } catch { /* ignore */ }
    });

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Scroll naar beneden voor lazy-loaded images
    await autoScroll(page);

    // --- Extractie ---

    // Title & Meta
    pageData.title = await page.title();
    pageData.description = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="description"]');
      return meta ? meta.content : '';
    });
    pageData.meta = await page.evaluate(() => {
      const metas = {};
      document.querySelectorAll('meta').forEach((m) => {
        const name = m.getAttribute('name') || m.getAttribute('property') || '';
        if (name) metas[name] = m.content;
      });
      return metas;
    });

    // Headings
    pageData.headings = await page.evaluate(() => {
      const headings = [];
      document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
        headings.push({ level: parseInt(h.tagName[1]), text: h.textContent.trim() });
      });
      return headings;
    });

    // Links (voor crawling)
    const links = await page.evaluate(() => {
      return [...document.querySelectorAll('a[href]')].map((a) => a.href);
    });
    pageData.links = links.filter((l) => isSameOrigin(baseUrl, l));

    // Nieuwe pagina's toevoegen aan queue
    for (const link of pageData.links) {
      const cleanUrl = link.split('#')[0].split('?')[0]; // Strip hash en query
      if (!visited.has(cleanUrl) && isSameOrigin(baseUrl, cleanUrl)) {
        pagesToVisit.push(cleanUrl);
      }
    }

    // Images (src + srcset + CSS background images)
    pageData.images = await page.evaluate(() => {
      const imgs = [];
      // <img> tags
      document.querySelectorAll('img').forEach((img) => {
        const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
        if (src) {
          imgs.push({
            src,
            alt: img.alt || '',
            width: img.naturalWidth || img.width || null,
            height: img.naturalHeight || img.height || null,
          });
        }
        // srcset
        const srcset = img.srcset || img.getAttribute('data-srcset');
        if (srcset) {
          srcset.split(',').forEach((s) => {
            const parts = s.trim().split(/\s+/);
            if (parts[0]) imgs.push({ src: parts[0], alt: img.alt || '', srcsetDescriptor: parts[1] || '' });
          });
        }
      });
      // <picture> sources
      document.querySelectorAll('picture source').forEach((source) => {
        const srcset = source.srcset;
        if (srcset) {
          srcset.split(',').forEach((s) => {
            const parts = s.trim().split(/\s+/);
            if (parts[0]) imgs.push({ src: parts[0], alt: '', type: source.type || '' });
          });
        }
      });
      // CSS background images
      document.querySelectorAll('*').forEach((el) => {
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg !== 'none') {
          const matches = bg.match(/url\(["']?(.*?)["']?\)/g);
          if (matches) {
            matches.forEach((m) => {
              const url = m.replace(/url\(["']?/, '').replace(/["']?\)/, '');
              if (url && !url.startsWith('data:')) {
                imgs.push({ src: url, alt: '', type: 'css-background' });
              }
            });
          }
        }
      });
      return imgs;
    });

    // Voeg intercepted assets toe
    for (const asset of interceptedAssets) {
      if (!allAssets[asset.category].includes(asset.url)) {
        allAssets[asset.category].push(asset.url);
      }
    }

    // Voeg pagina images toe aan global assets
    for (const img of pageData.images) {
      try {
        const absoluteUrl = new URL(img.src, url).href;
        if (!allAssets.images.includes(absoluteUrl)) {
          allAssets.images.push(absoluteUrl);
        }
      } catch { /* skip invalid URLs */ }
    }

    // Text content
    pageData.text = await page.evaluate(() => {
      // Verwijder scripts en styles
      const clone = document.body.cloneNode(true);
      clone.querySelectorAll('script, style, noscript').forEach((el) => el.remove());
      return clone.textContent.replace(/\s+/g, ' ').trim();
    });

    // Screenshot (desktop)
    const screenshotFilename = urlToFilename(url) + '.png';
    await page.screenshot({
      path: path.join(DIRS.screenshots, screenshotFilename),
      fullPage: true,
    });
    pageData.screenshot = `screenshots/${screenshotFilename}`;

    // Screenshot (mobile)
    if (argv.mobile) {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(DIRS.screenshotsMobile, screenshotFilename),
        fullPage: true,
      });
      pageData.screenshotMobile = `screenshots/mobile/${screenshotFilename}`;
    }

    // Sitemap entry
    siteMap.push({
      url,
      title: pageData.title,
      description: pageData.description,
      headings: pageData.headings.filter((h) => h.level <= 2).map((h) => h.text),
      imageCount: pageData.images.length,
      screenshot: pageData.screenshot,
    });

  } catch (err) {
    errors.push({ type: 'crawl', url, error: err.message });
    console.error(`  ERROR: ${err.message}`);
  } finally {
    await context.close();
  }

  // Vertraging tussen pagina's
  if (argv.delay > 0) {
    await new Promise((r) => setTimeout(r, argv.delay));
  }

  return pageData;
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          // Scroll terug naar boven
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
    });
  });
  // Wacht op lazy-loaded content
  await page.waitForTimeout(1000);
}

async function extractWritingStyle(allPageData) {
  const style = {
    language: 'unknown',
    formalityIndicators: [],
    commonPhrases: [],
    toneKeywords: [],
    avgSentenceLength: 0,
    usesJijVorm: false,
    usesUVorm: false,
    bulletPointHeavy: false,
    headingStyle: '',
    ctaPatterns: [],
  };

  const allText = allPageData.map((p) => p.text).join(' ');
  const allHeadings = allPageData.flatMap((p) => p.headings.map((h) => h.text));

  // Detecteer taal (simpel: check voor NL woorden)
  const nlWords = ['de', 'het', 'een', 'van', 'in', 'is', 'dat', 'op', 'en', 'voor', 'met', 'zijn', 'naar', 'ook', 'niet', 'wat', 'maar'];
  const enWords = ['the', 'is', 'of', 'and', 'to', 'in', 'for', 'with', 'that', 'this', 'are', 'not', 'but'];
  const words = allText.toLowerCase().split(/\s+/);
  const nlCount = words.filter((w) => nlWords.includes(w)).length;
  const enCount = words.filter((w) => enWords.includes(w)).length;
  style.language = nlCount > enCount ? 'nl' : 'en';

  // Jij/je vs U
  const jijCount = (allText.match(/\b(jij|je|jouw|jullie)\b/gi) || []).length;
  const uCount = (allText.match(/\b(u |uw )\b/gi) || []).length;
  style.usesJijVorm = jijCount > uCount;
  style.usesUVorm = uCount > jijCount;

  // Formality
  if (style.usesUVorm) style.formalityIndicators.push('Formeel (u-vorm)');
  if (style.usesJijVorm) style.formalityIndicators.push('Informeel (jij-vorm)');

  // CTA patterns
  const ctaRegex = /\b(bestel|koop|probeer|start|vraag aan|neem contact|meld je aan|registreer|download|ontdek|bekijk|lees meer|meer info|gratis|offerte)\b/gi;
  const ctaMatches = allText.match(ctaRegex) || [];
  const ctaCounts = {};
  ctaMatches.forEach((m) => {
    const lower = m.toLowerCase();
    ctaCounts[lower] = (ctaCounts[lower] || 0) + 1;
  });
  style.ctaPatterns = Object.entries(ctaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  // Heading style
  const avgHeadingLength = allHeadings.reduce((sum, h) => sum + h.length, 0) / (allHeadings.length || 1);
  const questionHeadings = allHeadings.filter((h) => h.includes('?')).length;
  style.headingStyle = questionHeadings > allHeadings.length * 0.3
    ? 'Vraag-gebaseerd'
    : avgHeadingLength < 30 ? 'Kort en krachtig' : 'Beschrijvend';

  return style;
}

// --- Main ---

async function main() {
  console.log('=== Website Migration Tool ===');
  console.log(`URL: ${argv.url}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Max pages: ${argv.maxPages}`);
  console.log('');

  ensureDirs();

  const browser = await chromium.launch({ headless: true });

  try {
    // --- Fase 1: Crawlen ---
    console.log('--- Fase 1: Crawling ---');
    const baseUrl = argv.url;
    pagesToVisit.push(baseUrl);
    const allPageData = [];

    while (pagesToVisit.length > 0 && visited.size < argv.maxPages) {
      const url = pagesToVisit.shift();
      if (visited.has(url)) continue;
      const pageData = await crawlPage(browser, url, baseUrl);
      if (pageData) allPageData.push(pageData);
    }

    console.log(`\nGecrawld: ${visited.size} pagina's`);

    // --- Fase 2: Assets downloaden ---
    if (!argv.crawlOnly && !argv.screenshotsOnly && !argv.contentOnly) {
      console.log('\n--- Fase 2: Assets downloaden ---');
      const assetMap = [];

      for (const [category, urls] of Object.entries(allAssets)) {
        const uniqueUrls = [...new Set(urls)];
        console.log(`  ${category}: ${uniqueUrls.length} bestanden`);

        for (const url of uniqueUrls) {
          const result = await downloadAsset(url, category);
          if (result) {
            assetMap.push({ ...result, category });
          }
        }
      }

      // Asset map opslaan
      fs.writeFileSync(
        path.join(DIRS.data, 'asset-map.json'),
        JSON.stringify(assetMap, null, 2)
      );
      console.log(`\nTotaal assets gedownload: ${assetMap.length}`);
    }

    // --- Fase 3: Content extractie ---
    if (!argv.crawlOnly && !argv.screenshotsOnly && !argv.assetsOnly) {
      console.log('\n--- Fase 3: Content extractie ---');

      for (const pageData of allPageData) {
        const filename = urlToFilename(pageData.url) + '.md';
        const markdown = pageToMarkdown(pageData);
        fs.writeFileSync(path.join(DIRS.content, filename), markdown);
      }

      console.log(`Content geëxporteerd: ${allPageData.length} pagina's`);
    }

    // --- Fase 4: Writing Style Analyse ---
    console.log('\n--- Fase 4: Schrijfstijl Analyse ---');
    const writingStyle = await extractWritingStyle(allPageData);
    fs.writeFileSync(
      path.join(DIRS.data, 'writing-style.json'),
      JSON.stringify(writingStyle, null, 2)
    );

    // --- Fase 5: Rapportage ---
    console.log('\n--- Fase 5: Rapportage ---');

    // Sitemap
    fs.writeFileSync(
      path.join(DIRS.data, 'sitemap.json'),
      JSON.stringify(siteMap, null, 2)
    );

    // Errors
    if (errors.length > 0) {
      fs.writeFileSync(
        path.join(DIRS.data, 'errors.json'),
        JSON.stringify(errors, null, 2)
      );
    }

    // Migration report
    const report = generateReport(allPageData, writingStyle);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'MIGRATION-REPORT.md'), report);

    // Style guide
    const styleGuide = generateStyleGuide(writingStyle, allPageData);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'STYLE-GUIDE.md'), styleGuide);

    console.log('\n=== Migratie Compleet ===');
    console.log(`Pagina's: ${visited.size}`);
    console.log(`Images: ${allAssets.images.length}`);
    console.log(`Fonts: ${allAssets.fonts.length}`);
    console.log(`CSS: ${allAssets.css.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`\nOutput: ${OUTPUT_DIR}`);
    console.log(`Rapport: ${path.join(OUTPUT_DIR, 'MIGRATION-REPORT.md')}`);
    console.log(`Stijlgids: ${path.join(OUTPUT_DIR, 'STYLE-GUIDE.md')}`);

  } finally {
    await browser.close();
  }
}

function pageToMarkdown(pageData) {
  let md = `# ${pageData.title}\n\n`;
  md += `> Bron: ${pageData.url}\n\n`;

  if (pageData.description) {
    md += `**Beschrijving:** ${pageData.description}\n\n`;
  }

  md += `---\n\n`;

  // Headings structuur
  if (pageData.headings.length > 0) {
    md += `## Pagina Structuur\n\n`;
    pageData.headings.forEach((h) => {
      md += `${'  '.repeat(h.level - 1)}- ${h.text}\n`;
    });
    md += '\n';
  }

  // Images op deze pagina
  if (pageData.images.length > 0) {
    md += `## Afbeeldingen (${pageData.images.length})\n\n`;
    pageData.images.forEach((img) => {
      md += `- \`${img.src}\``;
      if (img.alt) md += ` — alt: "${img.alt}"`;
      if (img.width) md += ` — ${img.width}x${img.height}`;
      md += '\n';
    });
    md += '\n';
  }

  // Text content
  if (pageData.text) {
    md += `## Content\n\n`;
    // Split in paragrafen voor leesbaarheid
    const sentences = pageData.text.split(/\.\s+/);
    let paragraph = '';
    sentences.forEach((s, i) => {
      paragraph += s + '. ';
      if ((i + 1) % 3 === 0) {
        md += paragraph.trim() + '\n\n';
        paragraph = '';
      }
    });
    if (paragraph.trim()) md += paragraph.trim() + '\n\n';
  }

  return md;
}

function generateReport(allPageData, writingStyle) {
  let report = `# Website Migratie Rapport\n\n`;
  report += `**Bron:** ${argv.url}\n`;
  report += `**Datum:** ${new Date().toISOString().split('T')[0]}\n`;
  report += `**Tool:** Website Migration Tool v1.0\n\n`;

  report += `---\n\n`;

  report += `## Samenvatting\n\n`;
  report += `| Metric | Waarde |\n`;
  report += `|--------|--------|\n`;
  report += `| Pagina's gecrawld | ${visited.size} |\n`;
  report += `| Afbeeldingen gevonden | ${allAssets.images.length} |\n`;
  report += `| Fonts gevonden | ${allAssets.fonts.length} |\n`;
  report += `| CSS bestanden | ${allAssets.css.length} |\n`;
  report += `| JS bestanden | ${allAssets.js.length} |\n`;
  report += `| Video's | ${allAssets.videos.length} |\n`;
  report += `| Documenten | ${allAssets.documents.length} |\n`;
  report += `| Errors | ${errors.length} |\n\n`;

  report += `## Taal & Schrijfstijl\n\n`;
  report += `| Kenmerk | Waarde |\n`;
  report += `|---------|--------|\n`;
  report += `| Taal | ${writingStyle.language === 'nl' ? 'Nederlands' : 'Engels'} |\n`;
  report += `| Aanspreking | ${writingStyle.usesJijVorm ? 'Jij/je-vorm (informeel)' : writingStyle.usesUVorm ? 'U-vorm (formeel)' : 'Gemengd/onduidelijk'} |\n`;
  report += `| Heading stijl | ${writingStyle.headingStyle} |\n\n`;

  if (writingStyle.ctaPatterns.length > 0) {
    report += `### CTA Patronen\n`;
    writingStyle.ctaPatterns.forEach((cta) => {
      report += `- **${cta.word}** (${cta.count}x)\n`;
    });
    report += '\n';
  }

  report += `## Sitemap\n\n`;
  siteMap.forEach((entry) => {
    report += `### ${entry.title || entry.url}\n`;
    report += `- URL: ${entry.url}\n`;
    report += `- Afbeeldingen: ${entry.imageCount}\n`;
    if (entry.headings.length > 0) {
      report += `- Headings: ${entry.headings.join(', ')}\n`;
    }
    report += '\n';
  });

  if (errors.length > 0) {
    report += `## Errors\n\n`;
    errors.forEach((err) => {
      report += `- **${err.type}**: ${err.url} — ${err.error}\n`;
    });
  }

  return report;
}

function generateStyleGuide(writingStyle, allPageData) {
  let guide = `# Schrijfstijl Gids - Geëxtraheerd uit Bronsite\n\n`;
  guide += `> Dit document is automatisch gegenereerd door analyse van de bronwebsite.\n`;
  guide += `> Review en pas aan voordat het team dit gebruikt.\n\n`;

  guide += `---\n\n`;

  guide += `## Taal\n\n`;
  guide += `- **Primaire taal:** ${writingStyle.language === 'nl' ? 'Nederlands' : 'Engels'}\n\n`;

  guide += `## Aanspreking\n\n`;
  if (writingStyle.usesJijVorm) {
    guide += `De website gebruikt de **jij/je-vorm** (informeel).\n\n`;
    guide += `- "Jij kunt..." ✅\n`;
    guide += `- "U kunt..." ❌\n`;
    guide += `- "Je ontdekt..." ✅\n`;
  } else if (writingStyle.usesUVorm) {
    guide += `De website gebruikt de **u-vorm** (formeel).\n\n`;
    guide += `- "U kunt..." ✅\n`;
    guide += `- "Jij kunt..." ❌\n`;
  } else {
    guide += `De aanspreekvorm is gemengd. Kies één stijl en wees consistent.\n`;
  }
  guide += '\n';

  guide += `## Heading Stijl\n\n`;
  guide += `Stijl: **${writingStyle.headingStyle}**\n\n`;
  guide += `Voorbeelden van de site:\n`;
  const sampleHeadings = allPageData
    .flatMap((p) => p.headings)
    .filter((h) => h.level <= 2)
    .slice(0, 10);
  sampleHeadings.forEach((h) => {
    guide += `- H${h.level}: "${h.text}"\n`;
  });
  guide += '\n';

  guide += `## Call-to-Action Stijl\n\n`;
  if (writingStyle.ctaPatterns.length > 0) {
    guide += `Meest gebruikte CTA woorden:\n`;
    writingStyle.ctaPatterns.forEach((cta) => {
      guide += `- "${cta.word}" (${cta.count}x gebruikt)\n`;
    });
  }
  guide += '\n';

  guide += `## Toon & Sfeer\n\n`;
  guide += `*Dit moet handmatig worden ingevuld na review van de content:*\n\n`;
  guide += `| Aspect | Huidige Site | Nieuwe Site |\n`;
  guide += `|--------|-------------|-------------|\n`;
  guide += `| Toon | [professioneel/casual/speels/...] | [behouden/aanpassen] |\n`;
  guide += `| Complexiteit | [eenvoudig/technisch/gemengd] | [behouden/aanpassen] |\n`;
  guide += `| Doelgroep | [wie] | [behouden/aanpassen] |\n`;
  guide += `| Emotie | [neutraal/enthousiast/urgent/...] | [behouden/aanpassen] |\n\n`;

  guide += `---\n\n`;
  guide += `*Gegenereerd: ${new Date().toISOString().split('T')[0]}*\n`;
  guide += `*Bron: ${argv.url}*\n`;

  return guide;
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
