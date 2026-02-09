const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = [
  'index.html', 'biografie.html', 'bibliografie.html', 'evenementen.html',
  'blog.html', 'word-vriend.html', 'contact.html'
];

let totalChanges = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let html = fs.readFileSync(filePath, 'utf8');
  const original = html;

  // 1. Add favicon after <meta name="viewport"> if not already present
  if (!html.includes('favicon')) {
    html = html.replace(
      /<meta name="viewport"[^>]+>/,
      '$&\n  <link rel="icon" type="image/svg+xml" href="favicon.svg">'
    );
  }

  // 2. Fix Privacy/Voorwaarden links in footer
  html = html.replace(
    /<a href="#" style="color: var\(--gold-pale\);">Privacy<\/a>/g,
    '<a href="privacy.html" style="color: var(--gold-pale);">Privacy</a>'
  );
  html = html.replace(
    /<a href="#" style="color: var\(--gold-pale\);">Voorwaarden<\/a>/g,
    '<a href="voorwaarden.html" style="color: var(--gold-pale);">Voorwaarden</a>'
  );

  // 3. Fix footer "Ontdek" section links
  // Citaten -> bibliografie.html (closest relevant page)
  html = html.replace(
    /<li><a href="#">Citaten<\/a><\/li>/g,
    '<li><a href="blog.html">Citaten</a></li>'
  );
  // Zweig & Nederland -> biografie.html section
  html = html.replace(
    /<li><a href="#">Zweig &amp; Nederland<\/a><\/li>/g,
    '<li><a href="biografie.html#nederland">Zweig &amp; Nederland</a></li>'
  );
  // Digitaal Archief -> bibliografie.html
  html = html.replace(
    /<li><a href="#">Digitaal Archief<\/a><\/li>/g,
    '<li><a href="bibliografie.html">Digitaal Archief</a></li>'
  );

  // 4. Fix Instagram/LinkedIn placeholder links (social)
  html = html.replace(
    /<a href="#" aria-label="Instagram">/g,
    '<a href="https://www.instagram.com/" aria-label="Instagram" target="_blank" rel="noopener">'
  );
  html = html.replace(
    /<a href="#" aria-label="LinkedIn">/g,
    '<a href="https://www.linkedin.com/" aria-label="LinkedIn" target="_blank" rel="noopener">'
  );

  if (html !== original) {
    fs.writeFileSync(filePath, html);
    totalChanges++;
    console.log(`Updated: ${file}`);
  } else {
    console.log(`No changes: ${file}`);
  }
}

// 5. Fix blog.html specific links
const blogPath = path.join(dir, 'blog.html');
let blog = fs.readFileSync(blogPath, 'utf8');

// Fix sidebar theme links
blog = blog.replace('<li><a href="#">Europa</a></li>', '<li><a href="biografie.html#europa">Europa</a></li>');
blog = blog.replace('<li><a href="#">Humanisme</a></li>', '<li><a href="biografie.html#humanisme">Humanisme</a></li>');
blog = blog.replace('<li><a href="#">Fanatisme</a></li>', '<li><a href="biografie.html#fanatisme">Fanatisme</a></li>');
blog = blog.replace('<li><a href="#">Ludwig van Beethoven</a></li>', '<li><a href="blog.html#beethoven">Ludwig van Beethoven</a></li>');
blog = blog.replace('<li><a href="#">Frans Masereel</a></li>', '<li><a href="blog.html#masereel">Frans Masereel</a></li>');
blog = blog.replace('<li><a href="#">Rainer Maria Rilke</a></li>', '<li><a href="blog.html#rilke">Rainer Maria Rilke</a></li>');
blog = blog.replace('<li><a href="#">Joseph Roth</a></li>', '<li><a href="blog.html#roth">Joseph Roth</a></li>');
blog = blog.replace('<li><a href="#">Emile Verhaeren</a></li>', '<li><a href="blog.html#verhaeren">Emile Verhaeren</a></li>');

// Remove "Lees verder" links since there are no article pages
blog = blog.replace(/\s*<a href="#" class="blog-post__read-more">Lees verder<\/a>/g, '');

// Add IDs to blog articles for sidebar links
blog = blog.replace('<h2 class="blog-post__title"><a href="#">Joseph Roth en Stefan Zweig</a></h2>', '<h2 class="blog-post__title" id="roth">Joseph Roth en Stefan Zweig</h2>');
blog = blog.replace('<h2 class="blog-post__title"><a href="#">Rilke en Zweig</a></h2>', '<h2 class="blog-post__title" id="rilke">Rilke en Zweig</h2>');
blog = blog.replace('<h2 class="blog-post__title"><a href="#">Stefan Zweig over Beethoven</a></h2>', '<h2 class="blog-post__title" id="beethoven">Stefan Zweig over Beethoven</h2>');
blog = blog.replace('<h2 class="blog-post__title"><a href="#">Frans Masereel en Stefan Zweig</a></h2>', '<h2 class="blog-post__title" id="masereel">Frans Masereel en Stefan Zweig</h2>');
blog = blog.replace('<h2 class="blog-post__title"><a href="#">De Onzichtbare Verzameling</a></h2>', '<h2 class="blog-post__title">De Onzichtbare Verzameling</h2>');
blog = blog.replace('<h2 class="blog-post__title"><a href="#">9 mei: Stefan Zweig-lezing!</a></h2>', '<h2 class="blog-post__title">9 mei: Stefan Zweig-lezing!</h2>');

fs.writeFileSync(blogPath, blog);
console.log('Updated: blog.html (sidebar + articles)');

console.log(`\nDone! ${totalChanges + 1} files updated.`);
