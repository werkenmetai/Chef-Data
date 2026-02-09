const fs = require('fs');
const path = require('path');

const essays = [
  {
    slug: 'joseph-roth-en-stefan-zweig',
    title: 'Joseph Roth en Stefan Zweig',
    subtitle: 'Een heilige drinker in de wereld van gisteren',
    author: 'Piet Wackie Eysten',
    date: '13 oktober 2020',
    category: 'Joseph Roth',
    image: 'images/zweig-roth-ostend-1936.jpg',
    imageAlt: 'Stefan Zweig en Joseph Roth in Oostende, 1936',
    excerpt: 'De vriendschap tussen Joseph Roth en Stefan Zweig was een van de meest bijzondere literaire relaties van de twintigste eeuw.'
  },
  {
    slug: 'rilke-en-zweig',
    title: 'Rilke en Zweig (deel 1)',
    subtitle: 'De relatie tussen Rainer Maria Rilke en Stefan Zweig',
    author: 'Piet Wackie Eysten',
    date: '9 juli 2020',
    category: 'Rilke',
    excerpt: 'Zweig beschouwde Rilke als de grootste dichter van zijn generatie en schreef na diens dood een ontroerend herdenkingsessay.'
  },
  {
    slug: 'rilke-en-zweig-2',
    title: 'Rilke en Zweig (deel 2)',
    subtitle: 'De relatie tussen Rainer Maria Rilke en Stefan Zweig',
    author: 'Piet Wackie Eysten',
    date: '9 juli 2020',
    category: 'Rilke',
    excerpt: 'Het vervolg van het essay over de relatie tussen Rilke en Zweig.'
  },
  {
    slug: 'zweig-en-beethoven',
    title: 'Stefan Zweig over Beethoven (deel 1)',
    subtitle: 'Zweig als verzamelaar van manuscripten',
    author: 'Piet Wackie Eysten',
    date: '2020',
    category: 'Beethoven',
    image: 'images/beethoven.jpg',
    imageAlt: 'Portret Ludwig van Beethoven',
    excerpt: 'Zweig was een hartstochtelijk verzamelaar van manuscripten en autografen. Zijn collectie bevatte originele handschriften van Beethoven.'
  },
  {
    slug: 'tweede-deel-zweig-en-beethoven',
    title: 'Stefan Zweig over Beethoven (deel 2)',
    subtitle: 'Zweig als verzamelaar van manuscripten',
    author: 'Piet Wackie Eysten',
    date: '2020',
    category: 'Beethoven',
    excerpt: 'Het vervolg van het essay over Zweig en Beethoven.'
  },
  {
    slug: 'stefan-zweig-en-frans-masereel',
    title: 'Stefan Zweig en Frans Masereel',
    subtitle: 'Twee pacifisten, twee kunstenaars',
    author: 'Piet Wackie Eysten',
    date: '2020',
    category: 'Masereel',
    excerpt: 'De Belgische houtsnijder Frans Masereel en Stefan Zweig deelden een pacifistisch ideaal.'
  },
  {
    slug: 'emile-verhaeren',
    title: 'Stefan Zweig en Emile Verhaeren',
    subtitle: 'Een bijzondere vriendschap',
    author: 'Piet Wackie Eysten',
    date: '22 mei 2020',
    category: 'Verhaeren',
    excerpt: 'De vriendschap met Verhaeren was bijzonder: jarenlang onderbroken door een heftige ruzie over de Eerste Wereldoorlog.'
  },
  {
    slug: '9-mei-stefan-zweiglezing',
    title: '9 mei: Stefan Zweig-lezing!',
    subtitle: 'Caroline de Gruyter over Zweig en Europa',
    author: 'Erwin Van den Brink',
    date: '21 april 2025',
    category: 'Europa',
    excerpt: 'Op 9 mei, Europadag, houdt Caroline de Gruyter de Stefan Zweig-lezing over het gedachtegoed van Zweig en de relevantie voor het huidige Europa.'
  },
  {
    slug: 'europas-culturele-eenheid',
    title: "Europa's culturele eenheid",
    subtitle: 'De onzichtbare band die Europa verbindt',
    author: '',
    date: '2020',
    category: 'Europa',
    excerpt: "Zweigs visie op Europa's culturele eenheid en de onzichtbare banden die het continent verbinden."
  }
];

function cleanHtml(html) {
  // Remove meta-data div
  html = html.replace(/<div class="meta-data">[\s\S]*?<\/div><!--meta data end-->/g, '');
  // Remove clear divs
  html = html.replace(/<div class="clear"><\/div>/g, '');
  // Remove nav
  html = html.replace(/<nav[\s\S]*?<\/nav>/g, '');
  // Remove social tagging
  html = html.replace(/Social tagging:[\s\S]*$/g, '');
  // Remove empty paragraphs
  html = html.replace(/<p>&nbsp;<\/p>/g, '');
  html = html.replace(/<p>\s*<\/p>/g, '');
  // Remove word doc links
  html = html.replace(/<p><a href="[^"]*\.docx">[^<]*<\/a><\/p>/g, '');
  // Remove fetchpriority and decoding attrs
  html = html.replace(/ fetchpriority="[^"]*"/g, '');
  html = html.replace(/ decoding="[^"]*"/g, '');
  // Add responsive styles to images
  html = html.replace(/<img /g, '<img style="max-width: 100%; height: auto; border-radius: 4px; margin: var(--space-md) 0;" ');
  // Remove duplicate consecutive images (same src appearing multiple times)
  html = html.replace(/(<img [^>]*src="([^"]*)"[^>]*>)\s*(<img [^>]*src="\2"[^>]*>)/g, '$1');
  // Remove WordPress ZWEIGROTH images (we use our own public domain photo)
  html = html.replace(/<p><img [^>]*zweigroth[^>]*><\/p>/gi, '');
  html = html.replace(/<p><img [^>]*zweigroth[^>]*><br>/gi, '<p>');
  // Fix unclosed <strong> tags that break rendering
  html = html.replace(/<\/strong><\/p><strong>\s*\n/g, '</strong></p>\n');
  html = html.replace(/<\/strong><\/p><strong>/g, '</strong></p>');
  // Replace external WordPress image URLs with local paths
  html = html.replace(/https:\/\/stefanzweig\.nl\/wp-content\/uploads\/[^"]*\/([^"]+)/g, (match, filename) => {
    return '../images/essays/' + filename.toLowerCase();
  });
  // Clean up extra whitespace
  html = html.replace(/\n{3,}/g, '\n\n');
  return html.trim();
}

function createArticlePage(essay) {
  const rawHtml = fs.readFileSync(path.join('scraped-essays', essay.slug + '.html'), 'utf8');
  const content = cleanHtml(rawHtml);

  const authorLine = essay.author ? `<span>Door ${essay.author}</span>` : '';
  const imagePart = essay.image
    ? `<img src="../${essay.image}" alt="${essay.imageAlt || ''}" style="width: 100%; max-width: 500px; border-radius: 4px; margin-bottom: var(--space-lg);">`
    : '';

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="../favicon.svg">
  <meta name="description" content="${essay.title} — ${essay.subtitle}">
  <title>${essay.title} &mdash; Stefan Zweig Genootschap Nederland</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>

  <!-- HEADER -->
  <header class="site-header">
    <div class="header-inner">
      <a href="../index.html" class="site-logo">
        <img src="../images/logo.png" alt="Stefan Zweig Genootschap Nederland" class="site-logo__img">
      </a>
      <nav class="main-nav" role="navigation" aria-label="Hoofdnavigatie">
        <ul class="main-nav__list">
          <li><a href="../index.html" class="main-nav__link">Home</a></li>
          <li><a href="../biografie.html" class="main-nav__link">Biografie</a></li>
          <li><a href="../bibliografie.html" class="main-nav__link">Werken</a></li>
          <li><a href="../evenementen.html" class="main-nav__link">Evenementen</a></li>
          <li><a href="../blog.html" class="main-nav__link active">Actualiteit</a></li>
          <li><a href="../word-vriend.html" class="main-nav__link">Word Vriend</a></li>
          <li><a href="../contact.html" class="main-nav__link">Contact</a></li>
        </ul>
        <div class="nav-cta"><a href="../word-vriend.html" class="btn btn--primary">Word Vriend</a></div>
        <div class="lang-switch">
          <button class="lang-switch__btn active" data-lang="nl">NL</button>
          <button class="lang-switch__btn" data-lang="de">DE</button>
          <button class="lang-switch__btn" data-lang="en">EN</button>
        </div>
      </nav>
      <button class="nav-toggle" aria-label="Menu openen">
        <span class="nav-toggle__bar"></span>
        <span class="nav-toggle__bar"></span>
        <span class="nav-toggle__bar"></span>
      </button>
    </div>
  </header>

  <!-- ARTICLE HEADER -->
  <section class="page-header">
    <div class="container">
      <p class="section-subtitle" style="color: var(--gold);">${essay.category}</p>
      <h1>${essay.title}</h1>
      <p>${essay.subtitle}</p>
    </div>
  </section>

  <!-- ARTICLE -->
  <section class="section">
    <div class="container container--narrow">
      <article class="article-content">
        <div class="blog-post__meta" style="margin-bottom: var(--space-xl);">
          <span class="blog-post__category">${essay.category}</span>
          <span>${essay.date}</span>
          ${authorLine}
        </div>
        ${imagePart}
${content}
        <div style="margin-top: var(--space-2xl); padding-top: var(--space-xl); border-top: 1px solid var(--border);">
          <a href="../blog.html" style="color: var(--burgundy); font-weight: 500;">&larr; Terug naar overzicht</a>
        </div>
      </article>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <h4>Stefan Zweig Genootschap</h4>
          <p>Het Nederlandse platform voor de thema's van Stefan Zweig.</p>
        </div>
        <div class="footer-col">
          <h4>Navigatie</h4>
          <ul>
            <li><a href="../biografie.html">Biografie</a></li>
            <li><a href="../bibliografie.html">Werken</a></li>
            <li><a href="../evenementen.html">Evenementen</a></li>
            <li><a href="../blog.html">Actualiteit</a></li>
            <li><a href="../word-vriend.html">Word Vriend</a></li>
            <li><a href="../contact.html">Contact</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Partners</h4>
          <ul>
            <li><a href="https://stefan-zweig-zentrum.at" target="_blank" rel="noopener">Stefan Zweig Zentrum</a></li>
            <li><a href="https://www.dbnl.org" target="_blank" rel="noopener">DBNL</a></li>
            <li><a href="https://www.gutenberg.org" target="_blank" rel="noopener">Project Gutenberg</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Stefan Zweig Genootschap Nederland</p>
        <p><a href="../privacy.html" style="color: var(--gold-pale);">Privacy</a> &middot; <a href="../voorwaarden.html" style="color: var(--gold-pale);">Voorwaarden</a></p>
      </div>
    </div>
  </footer>

  <script src="../js/main.js"></script>
</body>
</html>
`;
}

// Create essays directory
fs.mkdirSync('essays', { recursive: true });

// Generate all article pages
for (const essay of essays) {
  const html = createArticlePage(essay);
  fs.writeFileSync(path.join('essays', essay.slug + '.html'), html);
  console.log('Created: essays/' + essay.slug + '.html');
}

// Export essays data for blog.html update
fs.writeFileSync('essays-meta.json', JSON.stringify(essays, null, 2));
console.log('\nAll article pages created!');
