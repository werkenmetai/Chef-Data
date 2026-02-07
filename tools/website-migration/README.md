# Website Migration Tool

> Crawl een website, maak screenshots, download alle assets, extraheer content en analyseer schrijfstijl.

## Installatie

```bash
cd tools/website-migration
npm install
npx playwright install chromium
```

## Gebruik

### Volledige migratie
```bash
node migrate.js --url https://example.com --output ./output/klantnaam
```

### Alleen crawlen + screenshots
```bash
node migrate.js --url https://example.com --screenshots-only
```

### Alleen assets downloaden
```bash
node migrate.js --url https://example.com --assets-only
```

### Alleen content extraheren
```bash
node migrate.js --url https://example.com --content-only
```

### Met opties
```bash
node migrate.js \
  --url https://example.com \
  --output ./output/klantnaam \
  --max-pages 50 \
  --delay 2000 \
  --mobile \
  --viewport-width 1920 \
  --viewport-height 1080
```

## Output Structuur

```
output/klantnaam/
├── MIGRATION-REPORT.md          # Volledig migratie rapport
├── STYLE-GUIDE.md               # Geëxtraheerde schrijfstijl gids
├── screenshots/
│   ├── index.png                # Desktop screenshots per pagina
│   ├── about.png
│   └── mobile/                  # Mobile screenshots (--mobile flag)
│       ├── index.png
│       └── about.png
├── assets/
│   ├── images/                  # Alle afbeeldingen
│   │   ├── logo.png
│   │   ├── hero-banner.jpg
│   │   └── ...
│   ├── fonts/                   # Alle fonts
│   ├── css/                     # Stylesheets
│   ├── js/                      # JavaScript bestanden
│   ├── videos/                  # Video bestanden
│   └── documents/               # PDF's, Word docs, etc.
├── content/
│   ├── index.md                 # Content per pagina als markdown
│   ├── about.md
│   └── ...
└── data/
    ├── sitemap.json             # Volledige sitemap
    ├── asset-map.json           # Mapping: oude URL → lokaal pad
    ├── writing-style.json       # Geëxtraheerde schrijfstijl data
    └── errors.json              # Eventuele fouten tijdens migratie
```

## Wat het doet

### 1. Crawling
- Bezoekt alle interne pagina's (zelfde domein)
- Volgt links automatisch
- Respecteert `--max-pages` limiet
- Wacht op lazy-loaded content (auto-scroll)

### 2. Screenshots
- Full-page screenshots van elke pagina
- Desktop (standaard 1440x900) en optioneel mobile (375x812)
- Handig voor visuele referentie en QA

### 3. Asset Download
- **Afbeeldingen:** JPG, PNG, SVG, WebP, GIF, AVIF, ICO
- **Fonts:** WOFF, WOFF2, TTF, OTF, EOT
- **CSS:** Stylesheets
- **JavaScript:** Scripts
- **Video's:** MP4, WebM, OGG
- **Documenten:** PDF, Word, Excel, PowerPoint
- Detecteert ook CSS background-images en lazy-loaded images

### 4. Content Extractie
- Titel, meta description, headings per pagina
- Volledige tekst als markdown
- Image inventarisatie met alt-tags en afmetingen
- Paginastructuur analyse

### 5. Schrijfstijl Analyse
- Taaldetectie (NL/EN)
- Jij-vorm vs u-vorm detectie
- CTA-patronen analyse
- Heading stijl classificatie
- Automatisch gegenereerde stijlgids

## Na de Migratie

1. **Review MIGRATION-REPORT.md** — overzicht van alles wat gevonden is
2. **Review STYLE-GUIDE.md** — vul handmatig de toon & sfeer sectie in
3. **Check assets/** — zijn alle images correct gedownload?
4. **Gebruik asset-map.json** — voor URL herschrijving in de nieuwe site
5. **Maak een CLIENT-PROFILE.md** — zie `operations/client-onboarding/`

## Team Verantwoordelijkheden

| Wie | Taak |
|-----|------|
| **Dirk** (DevOps) | Tool installatie, Playwright setup |
| **Daan** (Backend) | Script aanpassingen indien nodig |
| **Nienke** (Design) | Asset review, design inventarisatie |
| **Iris** (Technical Writer) | Content review, stijlgids validatie |
| **Anna** (Content) | Content herschrijven in klant-stijl |
| **Tom** (Growth) | SEO elementen bewaren (titles, meta, headings) |

## Beperkingen

- Werkt alleen met publiek toegankelijke pagina's
- Login-protected content vereist handmatige authenticatie
- Zeer grote sites (1000+ pagina's): gebruik `--max-pages` en draai in batches
- Sommige sites blokkeren headless browsers (User-Agent filtering)
- Rate limiting: verhoog `--delay` als de server verzoeken weigert
