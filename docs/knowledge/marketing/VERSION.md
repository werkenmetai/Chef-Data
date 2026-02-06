# Marketing Versie Tracking

> **Beheerder:** Tom (Growth Lead)
> **Laatst bijgewerkt:** 2026-02-04

## Huidige Tooling

| Tool | Versie/Status | Doel |
|------|---------------|------|
| Website | Astro + Cloudflare Pages | Hoofdsite |
| Blog | Astro Content Collections | Content publicatie |
| Analytics | Cloudflare Web Analytics | Privacy-vriendelijk |
| Email | Resend | Transactionele email |

## Brand Assets

| Asset | Locatie | Status |
|-------|---------|--------|
| Logo | `public/logo.svg` | Actief (58KB) |
| Kleuren | Tailwind config | Exact Blue #0066CC |
| Fonts | System fonts | Performance |

## Content Kalender - Workflow Recipes 🆕

| Type | Frequentie | Eigenaar |
|------|------------|----------|
| Workflow Recipe Blogs | 2-3x per week | Lisa (schrijven), Anna (visuals) |
| Social Posts | 5x per week | Bram |
| LinkedIn Groepen | 2x per week | Bram |

### Team Rollen
| Rol | Persoon | Verantwoordelijkheid |
|-----|---------|---------------------|
| Content Lead | Tom | Strategie, kalender, QA |
| Content Writer | Lisa | Schrijven, SEO optimalisatie |
| Visual Content | Anna | Screenshots, diagrammen |
| SEO/Distribution | Bram | Keyword research, social |

### Content Plan
Zie: `docs/marketing/WORKFLOW-RECIPES-CONTENT-PLAN.md`

## SEO Status

| Pagina | Target Keyword | Status |
|--------|----------------|--------|
| Homepage | MCP boekhouding | Live |
| Features | Exact Online koppeling | Live |
| Pricing | MCP server prijs | Live |
| Blog: Factuurherinneringen | factuurherinneringen automatiseren | Live 🆕 |

## Positionering

```
VAN: "Praat met je boekhouding" (query tool)
NAAR: "Automatiseer je boekhouding" (workflow hub)
```

---

## Lessons Learned - Blog Content

### LESSON-001: Blogs moeten leesbaar zijn voor mensen (2026-02-05)

**Probleem:** Onze eerste blogs waren technische feature-lijsten, geen content die mensen willen lezen.

**Symptomen:**
- Droge tabellen met tool-namen (`get_wip_overview`, `get_margin_analysis`)
- Technisch jargon zonder context ("OAuth 2.1 met PKCE")
- Geen verhaal, geen emotie, geen "dit is wat JIJ ermee kunt"
- Wall of text - geen visuele breaks

**Vergelijking met goed voorbeeld (Beurs van Berlage blog):**
| Aspect | ❌ Onze blogs | ✅ Goed voorbeeld |
|--------|--------------|-------------------|
| Whitespace | Tekst plakt aan elkaar | Veel ruimte tussen secties |
| Headers | Plakken aan tekst | Bold, met ruimte eronder |
| Paragrafen | Lang (5+ zinnen) | Kort (2-3 zinnen) |
| Visuele blokken | Geen | Achtergrondkleuren, cards |
| Taal | Technisch | Menselijk, resultaatgericht |

**Root cause:**
1. **CSS:** Tailwind `prose` class geeft standaard spacing, maar niet genoeg voor visuele blokken
2. **Content:** Engineers schrijven features, niet benefits

**Oplossing (geïmplementeerd 2026-02-05):**

### 1. CSS Header Styling (PR #244)

Headers moeten "poppen" - niet verdwijnen in de tekst.

| Element | Styling | Waarom |
|---------|---------|--------|
| **h2** | `font-size: 1.75rem`, `font-weight: 700`, `color: #0066CC` (Exact Blue) | Hoofdsecties moeten direct opvallen |
| **h3** | `font-size: 1.25rem`, `font-weight: 600`, blauwe accent border links | Subsecties herkenbaar maar ondergeschikt |
| **Spacing** | `h2 margin-top: 3rem`, `h3 margin-top: 2rem` | Ademruimte tussen secties |
| **Dividers** | Subtiele `border-top` op h2 | Visuele scheiding |

### 2. Content Richtlijnen (PR #241, #242, #245)

| Regel | ❌ NIET | ✅ WEL |
|-------|---------|--------|
| Tool-namen | `get_wip_overview` | "Vraag naar je onderhanden werk" |
| Technisch jargon | "OAuth 2.1 met PKCE" | "Log in via je browser" |
| Focus | "Wij hebben gebouwd..." | "Jij kunt nu vragen..." |
| Paragrafen | 5+ zinnen | Max 2-3 zinnen |
| Structuur | Alles in één lijst | Per doelgroep/use case |

### 3. Blog Structuur Template

```html
<h2>Voor [doelgroep]</h2>
<p>[1 zin: wat kan deze lezer nu?]</p>

<div class="bg-exact-light rounded-xl p-6 my-6 not-prose">
  <p class="font-semibold mb-2">Dit kun je vragen:</p>
  <ul class="space-y-2">
    <li>"[Concrete vraag 1]"</li>
    <li>"[Concrete vraag 2]"</li>
  </ul>
</div>
```

### 4. Checklist Nieuwe Blog

- [ ] Geen tool-namen (`get_*`) zichtbaar
- [ ] Geen technisch jargon (MCP, OAuth, API, endpoints)
- [ ] Elke sectie beantwoordt "wat kan IK hiermee?"
- [ ] Max 3 zinnen per paragraaf
- [ ] Minimaal 1 voorbeeldvraag per sectie
- [ ] Headers in Exact Blue (#0066CC)
- [ ] Visuele hiërarchie: h2 > h3 duidelijk zichtbaar

**Eigenaar:** Tom (strategie) + Lars (CSS) + Anna (rewrites)

---

## Wijzigingslog

| Datum | Wijziging | Door |
|-------|-----------|------|
| 2026-02-05 | LESSON-001 uitgebreid met header styling + content richtlijnen + checklist | Piet |
| 2026-02-05 | LESSON-001 toegevoegd (blog leesbaarheid) | Piet |
| 2026-02-04 | Content Machine plan + eerste blog | Piet |
| 2026-02-04 | Team rollen gedefinieerd | Piet |
| 2026-01-28 | Initieel document | Piet |
