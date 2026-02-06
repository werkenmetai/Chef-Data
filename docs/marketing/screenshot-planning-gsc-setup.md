# Marketing Sprint: Screenshots Planning & GSC Setup

**Auteur:** Tom (Growth Lead / Marketing)
**Datum:** 2026-02-01
**Status:** Planning (geen code)

---

## Taak 1: Screenshots Planning

### 1.1 Overzicht benodigde screenshots

We hebben screenshots nodig voor drie kanalen:
1. **Exact App Store listing** - formele, professionele screenshots
2. **Website/Landing page** - conversie-gerichte visuals
3. **Blog posts** - contextuele illustraties

---

### 1.2 Shot-List

#### A. CORE FEATURES - Hoge prioriteit

| # | Screenshot | Pagina/Tool | Wat moet zichtbaar zijn | Kanaal | Prioriteit |
|---|------------|-------------|-------------------------|--------|------------|
| 1 | ChatGPT met facturen opvragen | ChatGPT interface | Chat met vraag "Welke facturen staan open?" en AI response met facturenlijst. MCP tool-call zichtbaar. | App Store, Website | P1 |
| 2 | Claude Desktop cashflow forecast | Claude Desktop app | Vraag over cashflow + grafiek/tabel output. Duidelijk Exact Online data. | App Store, Website | P1 |
| 3 | Dashboard met verbonden administraties | /dashboard | Overzicht API keys, usage stats, plan info. Minimaal 1 verbonden administratie. | App Store, Website | P1 |
| 4 | Division Toggle (NIEUW!) | /dashboard | Dropdown of lijst met meerdere divisions, active/inactive status, switch mogelijkheid | App Store, Website, Blog | P1 |
| 5 | OAuth success flow | /oauth/success | Success message na koppeling, "direct klaar" gevoel | Website | P2 |

#### B. WEBSITE & BLOG FEATURES - Nieuwe features

| # | Screenshot | Pagina/Tool | Wat moet zichtbaar zijn | Kanaal | Prioriteit |
|---|------------|-------------|-------------------------|--------|------------|
| 6 | Blog met filters (NIEUW!) | /blog | Overzicht blog posts met category filter pills actief. Meerdere artikelen zichtbaar. | Website, Blog | P1 |
| 7 | Blog artikel detail | /blog/[slug] | Volledig artikel met leestijd, categorie badge, datum | Blog | P2 |
| 8 | Mobile menu (NIEUW!) | Elke pagina (mobile) | Hamburger menu open, navigatie items zichtbaar | Website | P2 |
| 9 | Pricing pagina | /prijzen | Alle plans naast elkaar, feature vergelijking | Website | P2 |

#### C. AI PROVIDER INTEGRATIES - Demo/Showcase

| # | Screenshot | Pagina/Tool | Wat moet zichtbaar zijn | Kanaal | Prioriteit |
|---|------------|-------------|-------------------------|--------|------------|
| 10 | ChatGPT MCP setup | ChatGPT settings | MCP server URL configuratie, connectie actief | Website, Blog | P1 |
| 11 | Claude Desktop config | claude_desktop_config.json | JSON configuratie met onze MCP URL | Website, Blog | P2 |
| 12 | Copilot integratie | Copilot interface | Voorbeeld query met Exact data | Blog | P3 |

#### D. ADMIN/DEMO MODE - Voor App Store review

| # | Screenshot | Pagina/Tool | Wat moet zichtbaar zijn | Kanaal | Prioriteit |
|---|------------|-------------|-------------------------|--------|------------|
| 13 | Demo mode bedrijven | /admin/demo | 4 demo bedrijven (Bakkerij, IT, Advocaat, Aannemer) met API keys | App Store | P1 |
| 14 | Demo MCP response | Terminal/curl | JSON response van demo API call met realistische data | App Store | P2 |

#### E. EXTRA - Nice to have

| # | Screenshot | Pagina/Tool | Wat moet zichtbaar zijn | Kanaal | Prioriteit |
|---|------------|-------------|-------------------------|--------|------------|
| 15 | Support chat | /support/new | AI support interface met vraag/antwoord | Website | P3 |
| 16 | Privacy/AI disclaimer | /connect | Privacy waarschuwing voor AI provider keuze | Website | P3 |
| 17 | Region selector | /connect | Dropdown met alle landen (NL, BE, DE, UK, FR, ES, US) | Website | P3 |

---

### 1.3 Screenshot Specificaties

#### Formaten per kanaal:

**Exact App Store:**
- Resolutie: 1280x800 of 2560x1600 (retina)
- Formaat: PNG
- Maximaal 5 screenshots
- Taal: Engels (primair) + Nederlands

**Website/Landing:**
- Resolutie: 1200x800 (landscape) of 800x600 (card)
- Formaat: WebP (met PNG fallback)
- Bestandsgrootte: < 200KB per afbeelding

**Blog:**
- Resolutie: 1200x630 (OG image compatible)
- Formaat: WebP
- Met annotaties/pijlen waar nuttig

#### Browser/Tool settings voor screenshots:

1. **Browser:** Chrome, Brave, of Arc
2. **Extensions:** Geen zichtbare extensions in toolbar
3. **Dark mode:** UIT (light mode voor consistentie)
4. **Zoom:** 100%
5. **Demo data:** Gebruik demo mode keys (exa_demo, exa_demo_it, etc.)

---

### 1.4 Screenshot Werkwijze

1. **Voorbereiding:**
   - Log in met demo account
   - Activeer minimaal 2 divisions
   - Genereer test data via demo mode

2. **Capture tool:**
   - macOS: Cleanshot X of native screenshot
   - Windows: ShareX of Snipping Tool
   - Full page: Browser extension (GoFullPage)

3. **Post-processing:**
   - Crop naar relevante content
   - Blur gevoelige data indien nodig
   - Add subtle drop shadow voor depth
   - Compress via TinyPNG/Squoosh

---

## Taak 2: Google Search Console Setup

### 2.1 Overzicht

**Domein:** praatmetjeboekhouding.nl
**Hosting:** Cloudflare Pages
**DNS:** Cloudflare

---

### 2.2 Verificatie Methode

**Aanbevolen: DNS TXT Record (via Cloudflare)**

Dit is de meest betrouwbare methode voor Cloudflare-hosted sites.

#### Stappen:

1. **Ga naar Google Search Console**
   - URL: https://search.google.com/search-console
   - Log in met het Google account dat eigenaar wordt

2. **Voeg property toe**
   - Klik "Property toevoegen"
   - Kies "Domain" (niet URL-prefix)
   - Voer in: `praatmetjeboekhouding.nl`

3. **Kopieer DNS verificatie record**
   - Google toont een TXT record zoals:
   ```
   google-site-verification=XXXXXXXXXXXXXXXXXXXX
   ```

4. **Voeg toe in Cloudflare DNS**
   - Ga naar Cloudflare Dashboard > praatmetjeboekhouding.nl > DNS
   - Klik "Add record"
   - Type: TXT
   - Name: @ (of praatmetjeboekhouding.nl)
   - Content: de volledige google-site-verification string
   - TTL: Auto
   - Proxy status: DNS only (grijs wolkje)

5. **Verifieer in GSC**
   - Wacht 5-10 minuten voor DNS propagatie
   - Klik "Verify" in Google Search Console
   - Bij succes: groene vinkje

---

### 2.3 Sitemap Submitten

#### Locatie sitemap:
```
https://praatmetjeboekhouding.nl/sitemap.xml
```

**Let op:** Astro genereert automatisch een sitemap als `@astrojs/sitemap` is geconfigureerd.

#### Stappen:

1. **Verifieer dat sitemap bestaat**
   ```bash
   curl -I https://praatmetjeboekhouding.nl/sitemap.xml
   # Moet HTTP 200 returnen
   ```

2. **Submit in GSC**
   - Ga naar GSC > Sitemaps (linker menu)
   - Voer in: `sitemap.xml`
   - Klik "Submit"

3. **Controleer status**
   - Status moet worden "Success"
   - Check aantal geindexeerde URLs

#### Optioneel: Sitemap index
Als er meerdere sitemaps zijn (blog, pages, etc.):
```
/sitemap-index.xml
/sitemap-pages.xml
/sitemap-blog.xml
```

---

### 2.4 Belangrijke GSC Instellingen

#### A. International Targeting

1. Ga naar GSC > Settings > International Targeting
2. Kies **Nederland** als primair land
3. Hreflang tags zijn al geimplementeerd in Layout.astro:
   ```html
   <link rel="alternate" hreflang="nl" href="..." />
   <link rel="alternate" hreflang="en" href="..." />
   <link rel="alternate" hreflang="x-default" href="..." />
   ```

#### B. URL Parameters (Legacy)

- Niet meer actief in nieuwe GSC interface
- Cloudflare URL parameters worden automatisch afgehandeld

#### C. Crawl Rate

- Laat op "Let Google optimize"
- Cloudflare caching helpt met server load

#### D. Gebruikers toevoegen

1. Ga naar Settings > Users and permissions
2. Voeg teamleden toe:
   - **Full:** matthijs@chefdata.nl (eigenaar)
   - **Full:** [marketing email]
   - **Restricted:** eventuele andere stakeholders

---

### 2.5 Monitoring Checklist (Week 1)

Na GSC setup, monitor deze metrics dagelijks:

| Metric | Waar te vinden | Doel Week 1 |
|--------|---------------|-------------|
| Indexering | Coverage rapport | > 50% paginas geindexeerd |
| Crawl errors | Coverage > Excluded | 0 server errors |
| Sitemap status | Sitemaps | "Success" status |
| Mobile usability | Mobile Usability | 0 issues |
| Core Web Vitals | Core Web Vitals | Alle "Good" |

---

### 2.6 Bing Webmaster Tools (Bonus)

Aangezien Microsoft Copilot Bing gebruikt:

1. **URL:** https://www.bing.com/webmasters
2. **Import vanuit GSC:** Gebruik "Import from GSC" optie
3. **Verificatie:** Automatisch via GSC koppeling
4. **Sitemap:** Wordt automatisch meegenomen

---

## Volgende Stappen

### Screenshots (Tom):
- [ ] Demo account voorbereiden met test data
- [ ] Screenshot tool installeren/configureren
- [ ] Eerste 5 P1 screenshots maken
- [ ] Upload naar /public/images/ of R2 bucket

### GSC Setup (Tom/Dev):
- [ ] DNS TXT record toevoegen in Cloudflare
- [ ] GSC verificatie voltooien
- [ ] Sitemap submitten
- [ ] Bing Webmaster Tools koppelen

### Follow-up:
- [ ] Week 2: GSC metrics review
- [ ] Week 2: Screenshots voor blog posts
- [ ] Week 3: A/B test landing page met nieuwe screenshots

---

*Dit document is planning - geen code wijzigingen nodig.*
