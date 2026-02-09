const https = require('https');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'images');

const images = [
  {
    slug: 'zweig-setzer-1927.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Zweig_Setzer_1927.jpg',
    desc: 'Portrait by F.X. Setzer, 1927 (public domain)'
  },
  {
    slug: 'zweig-1900.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Stefan_Zweig_1900_%28cropped%29.jpg',
    desc: 'Young Stefan Zweig, ca. 1900 (public domain)'
  },
  {
    slug: 'zweig-roth-ostend-1936.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Elisabet_Charlotte_%28Lotte%29_Altmann_-_Zweig_and_Roth_in_Ostend_in_1936.jpg',
    desc: 'Zweig and Joseph Roth in Ostend, 1936 (public domain)'
  },
  {
    slug: 'zweig-friderike-kapuzinerberg-1922.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/85/Stefan_Zweig_Friderike_Zweig_1922_by_Ludwig_Boedecker.jpg',
    desc: 'Zweig with Friderike at Kapuzinerberg, 1922 (public domain)'
  },
  {
    slug: 'zweig-living-room-1922.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Stefan_Zweig_living_room_1922_by_Ludwig_Boedecker.jpg',
    desc: 'Zweig living room Kapuzinerberg, 1922 (public domain)'
  },
  {
    slug: 'zweig-farewell-letter-1942.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/07/%C3%9Altima_vers%C3%A3o_da_Declara%C3%A7%C3%A3o_de_agradecimento_ao_Brasil%2C_que_Zweig_deixou_em_cima_da_c%C3%B4moda_antes_de_se_suicidar.jpg',
    desc: 'Farewell letter, Petropolis 1942 (public domain)'
  },
  {
    slug: 'zweig-zentrum-salzburg.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Stefan_Zweig_Centre_Edmundsburg.JPG',
    desc: 'Stefan Zweig Centre Edmundsburg, Salzburg (CC BY-SA 4.0, Wald1siedel)'
  },
  {
    slug: 'stolpersteine-zweig.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salzburg_Kapuzinerberg_Stefan-Zweig-Weg_Stolpersteine_Zweig-2948.jpg',
    desc: 'Stolpersteine at Kapuzinerberg (CC BY-SA 4.0, Isiwal)'
  }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: { 'User-Agent': 'StefanZweigGenootschap/1.0 (info@stefanzweig.nl) Node.js' }
    };
    https.get(options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function main() {
  for (const img of images) {
    const dest = path.join(imagesDir, img.slug);
    if (fs.existsSync(dest)) {
      console.log(`SKIP ${img.slug} (exists)`);
      continue;
    }
    try {
      console.log(`Downloading ${img.slug}...`);
      await download(img.url, dest);
      const stats = fs.statSync(dest);
      console.log(`  OK - ${(stats.size / 1024).toFixed(1)} KB - ${img.desc}`);
    } catch (err) {
      console.error(`  FAIL - ${err.message}`);
    }
  }
  console.log('\nDone!');
}

main();
