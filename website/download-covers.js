const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const coversDir = path.join(__dirname, 'images', 'covers');
if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });

// OpenLibrary cover IDs mapped to our book slugs
const books = [
  { slug: 'schaaknovelle', coverId: 5548285 },
  { slug: 'brief-van-een-onbekende', coverId: 1022090 },
  { slug: 'angst', coverId: 1021865 },
  { slug: 'vierentwintig-uur', coverId: 947249 },
  { slug: 'amok', coverId: 10849210 },
  { slug: 'verwarring-der-gevoelens', coverId: 2149679 },
  { slug: 'erasmus', coverId: 9306161 },
  { slug: 'castellio', coverId: 1022773 },
  { slug: 'maria-stuart', coverId: 7255396 },
  { slug: 'marie-antoinette', coverId: 6536618 },
  { slug: 'magellan', coverId: 6480308 },
  { slug: 'sternstunden', coverId: 10410858 },
  { slug: 'ongeduld-van-het-hart', coverId: 595193 },
  { slug: 'de-wereld-van-gisteren', coverId: 8258689 },
  { slug: 'brazilie', coverId: 1920626 },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = url.startsWith('https') ? https.get : http.get;
    get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${response.statusCode} for ${url}`));
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function main() {
  for (const book of books) {
    const url = `https://covers.openlibrary.org/b/id/${book.coverId}-L.jpg`;
    const dest = path.join(coversDir, `${book.slug}.jpg`);

    if (fs.existsSync(dest)) {
      console.log(`SKIP ${book.slug} (already exists)`);
      continue;
    }

    try {
      console.log(`Downloading ${book.slug} from cover ID ${book.coverId}...`);
      await download(url, dest);
      const stats = fs.statSync(dest);
      console.log(`  OK - ${(stats.size / 1024).toFixed(1)} KB`);
    } catch (err) {
      console.error(`  FAIL - ${err.message}`);
    }
  }
  console.log('\nDone!');
}

main();
