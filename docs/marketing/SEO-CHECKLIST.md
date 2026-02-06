# SEO Checklist & Technische Aanbevelingen

Uitgebreide checklist voor technische SEO en on-page optimalisatie.

---

## Inhoudsopgave

1. [Technische SEO Basis](#1-technische-seo-basis)
2. [On-Page SEO](#2-on-page-seo)
3. [Site Structuur](#3-site-structuur)
4. [Schema Markup](#4-schema-markup)
5. [Core Web Vitals](#5-core-web-vitals)
6. [Content SEO](#6-content-seo)
7. [Internationalisatie](#7-internationalisatie)
8. [Monitoring & Tools](#8-monitoring--tools)

---

## 1. Technische SEO Basis

### 1.1 Essentials Checklist

- [ ] **SSL/HTTPS actief** (al OK op praatmetjeboekhouding.nl)
- [ ] **www vs non-www redirect** - Kies 1 variant en redirect de andere
- [ ] **Trailing slash consistentie** - /blog/ of /blog, niet beide
- [ ] **404 pagina** - Custom 404 met navigatie en zoekfunctie
- [ ] **Robots.txt** - Correct geconfigureerd

### 1.2 Robots.txt Aanbeveling

```txt
# robots.txt voor praatmetjeboekhouding.nl

User-agent: *
Allow: /

# Blokkeer technische pagina's
Disallow: /callback
Disallow: /admin
Disallow: /dashboard
Disallow: /api/

# Sitemap locatie
Sitemap: https://praatmetjeboekhouding.nl/sitemap.xml
```

### 1.3 Sitemap.xml Checklist

- [ ] **Automatisch genereren** - Via Astro sitemap integration
- [ ] **Alleen canonical URLs** - Geen duplicaten
- [ ] **Lastmod dates** - Actuele update datums
- [ ] **Submit naar GSC** - Google Search Console
- [ ] **Prioriteit tags** - Homepage 1.0, blogs 0.8, etc.

**Astro sitemap configuratie:**
```javascript
// astro.config.mjs
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://praatmetjeboekhouding.nl',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/callback') &&
        !page.includes('/admin') &&
        !page.includes('/dashboard'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
});
```

### 1.4 Redirects

- [ ] HTTP → HTTPS redirect
- [ ] www → non-www (of omgekeerd)
- [ ] Oude URLs → nieuwe URLs (301 redirects)
- [ ] Trailing slash consistentie

---

## 2. On-Page SEO

### 2.1 Title Tag Checklist

- [ ] **Max 60 karakters** (of 580px breedte)
- [ ] **Primair keyword vooraan**
- [ ] **Uniek per pagina**
- [ ] **Merknaam aan het einde**: `| Praat met je Boekhouding`
- [ ] **Actiegericht of nieuwsgierigheid wekkend**

**Formules:**
```
[Keyword]: [Belofte] | Praat met je Boekhouding
Hoe [Je X Doet] in [Y] Stappen | Praat met je Boekhouding
[X] [Onderwerp] voor [Doelgroep] [Jaar] | Praat met je Boekhouding
```

**Voorbeelden:**
```
AI Boekhouding: Complete Gids voor Ondernemers | Praat met je Boekhouding
Exact Online Koppelen met AI: Stap-voor-Stap | Praat met je Boekhouding
10 Vragen voor je Boekhouding die Tijd Besparen | Praat met je Boekhouding
```

### 2.2 Meta Description Checklist

- [ ] **Max 155 karakters** (of 920px)
- [ ] **Bevat primair keyword**
- [ ] **Bevat CTA of belofte**
- [ ] **Uniek per pagina**
- [ ] **Beschrijft pagina inhoud accuraat**

**Formule:**
```
[Waardepropositie]. [Wat je leert/krijgt]. [CTA of voordeel].
```

**Voorbeelden:**
```
Leer hoe AI je boekhouding kan versnellen. Praktische gids met voorbeelden
voor MKB. Ontdek of het veilig is en hoe je begint.

Koppel Exact Online met Claude of ChatGPT in 5 minuten. Stap-voor-stap
uitleg met screenshots. Gratis te proberen.
```

### 2.3 Heading Structuur

- [ ] **Eén H1 per pagina** - Bevat primair keyword
- [ ] **Logische H2/H3 hiërarchie** - Geen niveaus overslaan
- [ ] **Keywords in H2's** - Secundaire keywords
- [ ] **Beschrijvende headings** - Niet "Sectie 1", "Meer info"

**Correcte structuur:**
```html
<h1>AI Boekhouding: Complete Gids</h1>
  <h2>Wat is AI Boekhouding?</h2>
  <h2>Hoe Werkt Het?</h2>
    <h3>De Technologie</h3>
    <h3>Het Proces</h3>
  <h2>Voordelen</h2>
  <h2>Nadelen</h2>
  <h2>FAQ</h2>
```

### 2.4 URL Structuur

- [ ] **Kort en beschrijvend**
- [ ] **Bevat keyword**
- [ ] **Lowercase alleen**
- [ ] **Koppeltekens, geen underscores**
- [ ] **Geen speciale tekens of spaties**
- [ ] **Geen datums in URL** (maakt updates lastig)

**Goed:**
```
/blog/ai-boekhouding-gids
/blog/exact-online-tips
/pricing
```

**Fout:**
```
/blog/2026/01/wat-is-ai-boekhouding-complete-gids-voor-ondernemers
/blog/ai_boekhouding
/Blog/AI-Boekhouding
```

### 2.5 Afbeeldingen

- [ ] **Beschrijvende bestandsnamen** - `ai-boekhouding-dashboard.png`
- [ ] **Alt tekst altijd aanwezig** - Beschrijvend, keyword waar natuurlijk
- [ ] **Gecomprimeerd** - WebP format waar mogelijk
- [ ] **Lazy loading** - Voor afbeeldingen below the fold
- [ ] **Juiste afmetingen** - Niet groter dan nodig

**Alt tekst voorbeelden:**
```html
<!-- Goed -->
<img alt="Screenshot van AI boekhouding dashboard met omzet grafiek" />
<img alt="Stap 2: Klik op verbinden met Exact Online" />

<!-- Fout -->
<img alt="image1" />
<img alt="AI boekhouding AI boekhouding beste AI tool" />
<img alt="" />
```

---

## 3. Site Structuur

### 3.1 Aanbevolen URL Hierarchie

```
praatmetjeboekhouding.nl/
│
├── /                           # Homepage
├── /pricing                    # Prijzen
├── /faq                        # FAQ
├── /contact                    # Contact (nieuw)
├── /over-ons                   # About (nieuw)
│
├── /blog/                      # Blog index
│   ├── /blog/[slug]           # Individuele posts
│   ├── /blog/categorie/ai-boekhouding
│   ├── /blog/categorie/exact-online
│   ├── /blog/categorie/privacy
│   └── /blog/categorie/automatisering
│
├── /gids/                      # Pillar pages
│   ├── /gids/ai-boekhouding
│   ├── /gids/exact-online-tips
│   └── /gids/privacy-financiele-data
│
├── /docs/                      # Technische documentatie
│   ├── /docs/tools
│   ├── /docs/setup
│   └── /docs/ai-privacy
│
├── /connect                    # OAuth flow
├── /setup                      # Setup instructies
├── /dashboard                  # User dashboard (noindex)
├── /admin                      # Admin (noindex)
│
├── /terms                      # Juridisch
├── /privacy                    # Privacy policy
│
└── /en/                        # Engelse versies
    ├── /en/
    ├── /en/pricing
    └── /en/blog/...
```

### 3.2 Interne Linking Strategie

**Regels:**
1. Elke pagina max 3 clicks van homepage
2. Pillar pages linken naar alle cluster artikelen
3. Cluster artikelen linken naar pillar page
4. Relevante horizontale links tussen artikelen
5. Sidebar/footer met belangrijkste pagina's

**Link equity flow:**
```
Homepage
    ↓ (sterke links)
Pillar Pages (/gids/*)
    ↓ (medium links)
Cluster Articles (/blog/*)
    ↓ (links naar product)
Conversion Pages (/pricing, /connect)
```

### 3.3 Breadcrumbs

- [ ] Implementeer breadcrumbs op alle pagina's
- [ ] Schema markup voor breadcrumbs
- [ ] Consistent formaat

**Voorbeeld:**
```
Home > Blog > AI Boekhouding > Wat is AI Boekhouding?
Home > Gids > Privacy & AI
```

**Schema:**
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://praatmetjeboekhouding.nl/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://praatmetjeboekhouding.nl/blog/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Wat is AI Boekhouding?",
      "item": "https://praatmetjeboekhouding.nl/blog/wat-is-ai-boekhouding"
    }
  ]
}
```

---

## 4. Schema Markup

### 4.1 Organization (Homepage)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Praat met je Boekhouding",
  "alternateName": "Praat met je Boekhouding",
  "url": "https://praatmetjeboekhouding.nl",
  "logo": "https://praatmetjeboekhouding.nl/logo.png",
  "description": "Praat met je Exact Online boekhouding via AI. Stel vragen in normale taal.",
  "foundingDate": "2024",
  "sameAs": [
    "https://linkedin.com/company/praatmetjeboekhouding",
    "https://twitter.com/praatmetboek"
  ],
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "NL"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "support@praatmetjeboekhouding.nl"
  }
}
```

### 4.2 SoftwareApplication (Product pagina)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Praat met je Boekhouding",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "MCP server die je Exact Online boekhouddata toegankelijk maakt voor AI-assistenten.",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "25"
  },
  "offers": [
    {
      "@type": "Offer",
      "name": "Free",
      "price": "0",
      "priceCurrency": "EUR"
    },
    {
      "@type": "Offer",
      "name": "Pro",
      "price": "49",
      "priceCurrency": "EUR",
      "billingIncrement": "P1M"
    }
  ]
}
```

### 4.3 FAQPage (FAQ pagina)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Wat is Praat met je Boekhouding?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Praat met je Boekhouding is een MCP-server die je Exact Online boekhouddata toegankelijk maakt voor AI-assistenten zoals Claude en ChatGPT."
      }
    },
    {
      "@type": "Question",
      "name": "Is mijn data veilig?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ja, we hebben alleen-lezen toegang tot je data en slaan geen boekhoudgegevens op. Je data wordt versleuteld verzonden en we zijn AVG-compliant."
      }
    }
  ]
}
```

### 4.4 Article (Blog posts)

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Wat is AI Boekhouding? Complete Gids voor Ondernemers",
  "description": "Leer alles over AI boekhouding: hoe het werkt, voordelen, nadelen, en of het veilig is.",
  "image": "https://praatmetjeboekhouding.nl/images/ai-boekhouding-hero.jpg",
  "author": {
    "@type": "Person",
    "name": "Auteur Naam"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Praat met je Boekhouding",
    "logo": {
      "@type": "ImageObject",
      "url": "https://praatmetjeboekhouding.nl/logo.png"
    }
  },
  "datePublished": "2026-01-27",
  "dateModified": "2026-01-27",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://praatmetjeboekhouding.nl/blog/wat-is-ai-boekhouding"
  }
}
```

### 4.5 HowTo (Tutorial posts)

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Exact Online Koppelen met AI",
  "description": "Stap-voor-stap uitleg om je Exact Online te koppelen met Claude of ChatGPT.",
  "totalTime": "PT5M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Account aanmaken",
      "text": "Ga naar praatmetjeboekhouding.nl en maak een gratis account aan."
    },
    {
      "@type": "HowToStep",
      "name": "Exact Online verbinden",
      "text": "Klik op 'Verbinden' en log in met je Exact Online gegevens."
    },
    {
      "@type": "HowToStep",
      "name": "API key kopiëren",
      "text": "Kopieer je API key naar Claude Desktop of je AI-tool."
    }
  ]
}
```

---

## 5. Core Web Vitals

### 5.1 Metrics en Targets

| Metric | Doel | Meting |
|--------|------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | Grootste element laadtijd |
| INP (Interaction to Next Paint) | < 200ms | Interactie responsiviteit |
| CLS (Cumulative Layout Shift) | < 0.1 | Visuele stabiliteit |

### 5.2 LCP Optimalisatie

- [ ] **Kritieke CSS inline** - Above-the-fold styling direct in HTML
- [ ] **Afbeelding preload** - Hero afbeelding vroeg laden
- [ ] **Font preload** - Custom fonts early hints
- [ ] **Lazy load non-critical** - Defer alles below the fold
- [ ] **CDN gebruiken** - Cloudflare CDN (al actief)

```html
<!-- Preload hero afbeelding -->
<link rel="preload" as="image" href="/images/hero.webp" />

<!-- Preload font -->
<link rel="preload" as="font" type="font/woff2"
      href="/fonts/inter.woff2" crossorigin />

<!-- Kritieke CSS inline -->
<style>
  /* Critical path CSS here */
</style>
```

### 5.3 INP Optimalisatie

- [ ] **Geen lange JavaScript taken** - Max 50ms per task
- [ ] **Debounce/throttle events** - Scroll, resize handlers
- [ ] **Web workers** - Zware berekeningen off-main-thread
- [ ] **Code splitting** - Laad JS per pagina

### 5.4 CLS Optimalisatie

- [ ] **Expliciete afmetingen** - Width/height op afbeeldingen
- [ ] **Font display swap** - Voorkom layout shift bij fonts
- [ ] **Reserve ruimte ads/embeds** - Placeholders met vaste grootte
- [ ] **Animaties via transform** - Niet via top/left/width/height

```html
<!-- Voorkom CLS bij afbeeldingen -->
<img src="..." width="800" height="600" alt="..." />

<!-- Of via aspect-ratio -->
<img src="..." style="aspect-ratio: 16/9; width: 100%;" alt="..." />
```

### 5.5 Meting Tools

- Google PageSpeed Insights
- Chrome DevTools Lighthouse
- Google Search Console Core Web Vitals rapport
- web.dev/measure

---

## 6. Content SEO

### 6.1 Keyword Gebruik

- [ ] **Primair keyword in titel**
- [ ] **Primair keyword in H1**
- [ ] **Primair keyword in eerste 100 woorden**
- [ ] **Secundaire keywords in H2's**
- [ ] **Natuurlijk gebruik** - Geen keyword stuffing
- [ ] **LSI keywords** - Gerelateerde termen

### 6.2 Content Kwaliteit

- [ ] **Minimaal 800 woorden** voor ranking artikelen
- [ ] **Pillar pages 2000+ woorden**
- [ ] **Unieke content** - Niet gekopieerd
- [ ] **Up-to-date** - Regelmatig bijwerken
- [ ] **Antwoord op zoekvraag** - Intent matchen
- [ ] **Beter dan concurrentie** - Meer diepgang

### 6.3 Featured Snippet Optimalisatie

**Definitie box (voor "Wat is X?" queries):**
```markdown
## Wat is AI Boekhouding?

AI boekhouding is het gebruik van kunstmatige intelligentie
om boekhoudtaken te automatiseren en financiële inzichten
te verkrijgen via natuurlijke taal. Je stelt een vraag
zoals "hoeveel omzet had ik?" en krijgt direct antwoord.
```

**Stappen lijst (voor "Hoe doe ik X?" queries):**
```markdown
## Hoe koppel je Exact Online met AI?

1. Maak een account aan op praatmetjeboekhouding.nl
2. Klik op 'Verbinden met Exact Online'
3. Log in met je Exact Online gegevens
4. Kopieer de API key naar je AI-tool
5. Stel je eerste vraag
```

**Tabel (voor vergelijkingen):**
```markdown
## AI Boekhouding vs Traditioneel

| Aspect | AI Boekhouding | Traditioneel |
|--------|----------------|--------------|
| Snelheid | Seconden | Uren |
| Kosten | €0-49/mnd | €50-200/uur |
| Beschikbaar | 24/7 | Kantooruren |
```

### 6.4 Content Refresh Strategie

**Kwartaal review:**
- Check rankings in GSC
- Update verouderde informatie
- Voeg nieuwe secties toe
- Verbeter underperforming artikelen

**Triggers voor update:**
- Ranking daalt
- Bounce rate stijgt
- Nieuwe features gelanceerd
- Concurrentie publiceert beter artikel
- Informatie is verouderd (>6 maanden)

---

## 7. Internationalisatie

### 7.1 Hreflang Tags

```html
<!-- Op Nederlandse pagina's -->
<link rel="alternate" hreflang="nl"
      href="https://praatmetjeboekhouding.nl/blog/ai-boekhouding" />
<link rel="alternate" hreflang="en"
      href="https://praatmetjeboekhouding.nl/en/blog/ai-accounting" />
<link rel="alternate" hreflang="x-default"
      href="https://praatmetjeboekhouding.nl/blog/ai-boekhouding" />

<!-- Op Engelse pagina's -->
<link rel="alternate" hreflang="nl"
      href="https://praatmetjeboekhouding.nl/blog/ai-boekhouding" />
<link rel="alternate" hreflang="en"
      href="https://praatmetjeboekhouding.nl/en/blog/ai-accounting" />
<link rel="alternate" hreflang="x-default"
      href="https://praatmetjeboekhouding.nl/blog/ai-boekhouding" />
```

### 7.2 Belgische Markt

Overweeg voor België:
- [ ] Specifieke landing page /be/
- [ ] Belgische BTW/belasting content
- [ ] .be domain of subfolder
- [ ] Hreflang `nl-BE` vs `nl-NL`

---

## 8. Monitoring & Tools

### 8.1 Essentiële Tools

| Tool | Doel | Gratis? |
|------|------|---------|
| Google Search Console | Rankings, indexatie, errors | Ja |
| Google Analytics 4 | Traffic, conversies | Ja |
| Bing Webmaster Tools | Bing optimalisatie | Ja |
| PageSpeed Insights | Core Web Vitals | Ja |
| Ahrefs/SEMrush | Keyword tracking, backlinks | Betaald |
| Screaming Frog | Technical audit | Gratis (500 URLs) |

### 8.2 GSC Setup Checklist

- [ ] Property aanmaken (beide www en non-www)
- [ ] Sitemap submitten
- [ ] URL inspectie testen
- [ ] International targeting instellen
- [ ] Bing Webmaster Tools linken

### 8.3 Wekelijkse Monitoring

```
Maandag:
□ GSC: Nieuwe errors?
□ GSC: Impressies/clicks trend
□ GA4: Traffic bronnen

Maandelijks:
□ Keyword rankings check
□ Backlink groei
□ Core Web Vitals
□ Content performance
□ Competitor check
```

### 8.4 Alert Setup

Stel alerts in voor:
- 404 errors spike
- Indexatie problemen
- Ranking drops >10 posities
- Traffic daling >20%
- Core Web Vitals fails

---

## Quick Reference Card

### Must-Have per Pagina

```
□ Unieke title tag (max 60 chars, keyword vooraan)
□ Unieke meta description (max 155 chars, CTA)
□ H1 met keyword
□ Alt tekst op afbeeldingen
□ Min. 3 interne links
□ Canonical tag
□ Mobile-friendly
□ Snelle laadtijd (<3s)
```

### Before Publish Checklist

```
□ Titel geoptimaliseerd
□ Meta description geschreven
□ URL is kort en bevat keyword
□ Afbeeldingen gecomprimeerd + alt tekst
□ Interne links toegevoegd
□ Schema markup waar relevant
□ Proefgelezen
□ Mobile preview gecheckt
```

---

*Checklist versie 1.0 - Januari 2026*
