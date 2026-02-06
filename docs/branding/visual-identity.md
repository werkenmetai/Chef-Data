# Visual Identity: Praat met je Boekhouding

> Versie 1.0 | Januari 2026

---

## Logo

### Concept
Het logo combineert twee elementen:
1. **Spraakbubbel** - verwijst naar "Praat met" en de AI-conversatie
2. **Open boek/grootboek** - verwijst naar "Boekhouding" en financiële administratie

De linkerpagina bevat een lijst (bullets + lijnen) die vragen/taken symboliseert.
De rechterpagina bevat data-blokken die financiële informatie symboliseren.

### Bestanden

| Bestand | Formaat | Gebruik |
|---------|---------|---------|
| `Logo.png` | PNG 1024x1024 | Website, presentaties, print |
| `favicon.svg` | SVG 32x32 | Browser tab, app icon |
| `og-image.svg` | SVG 1200x630 | Social media sharing |

### Locatie
`/apps/auth-portal/public/`

---

## Kleuren

### Primaire kleur

| Naam | Hex | RGB | Gebruik |
|------|-----|-----|---------|
| **Brand Blue** | `#0066CC` | 0, 102, 204 | Logo, knoppen, links, accenten |

### Secundaire kleuren

| Naam | Hex | RGB | Gebruik |
|------|-----|-----|---------|
| **Dark Blue** | `#004499` | 0, 68, 153 | Gradiënten, hover states |
| **Light Blue** | `#E6F0FA` | 230, 240, 250 | Achtergronden, highlights |

### Neutralen

| Naam | Hex | Gebruik |
|------|-----|---------|
| **White** | `#FFFFFF` | Achtergrond, tekst op blauw |
| **Near Black** | `#1A1A1A` | Body tekst |
| **Gray 600** | `#6B7280` | Secundaire tekst |
| **Gray 200** | `#E5E7EB` | Borders, dividers |

### Functionele kleuren

| Naam | Hex | Gebruik |
|------|-----|---------|
| **Success** | `#10B981` | Bevestigingen, positieve acties |
| **Warning** | `#F59E0B` | Waarschuwingen |
| **Error** | `#EF4444` | Foutmeldingen |

---

## Typografie

### Primair lettertype
**System UI Stack**
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

### Hiërarchie

| Element | Grootte | Gewicht | Line height |
|---------|---------|---------|-------------|
| H1 | 48px / 3rem | Bold (700) | 1.2 |
| H2 | 36px / 2.25rem | Bold (700) | 1.25 |
| H3 | 24px / 1.5rem | Semibold (600) | 1.3 |
| H4 | 20px / 1.25rem | Semibold (600) | 1.4 |
| Body | 16px / 1rem | Regular (400) | 1.6 |
| Small | 14px / 0.875rem | Regular (400) | 1.5 |
| Caption | 12px / 0.75rem | Regular (400) | 1.4 |

### Code lettertype
```css
font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
```

---

## Logo Gebruik

### Minimale grootte
- **Digitaal:** 24px hoogte minimum
- **Print:** 10mm hoogte minimum

### Witruimte
Minimaal 50% van de logo-hoogte aan alle kanten vrij houden.

### Correcte varianten

| Variant | Achtergrond | Gebruik |
|---------|-------------|---------|
| Full color | Wit/licht | Standaard |
| White | Blauw/donker | Header, social media |
| Monochrome | Neutraal | Documenten, watermarks |

### Niet doen

- Logo vervormen of uitrekken
- Logo roteren
- Andere kleuren gebruiken dan gespecificeerd
- Logo op drukke achtergrond plaatsen zonder contrast
- Tekst over het logo plaatsen
- Logo als patroon gebruiken

---

## UI Componenten

### Knoppen

**Primair (CTA)**
```css
background: #0066CC;
color: white;
border-radius: 8px;
padding: 12px 24px;
font-weight: 600;
```

**Secundair**
```css
background: transparent;
color: #0066CC;
border: 2px solid #0066CC;
border-radius: 8px;
```

**Ghost**
```css
background: transparent;
color: #0066CC;
border: none;
```

### Cards
```css
background: white;
border-radius: 12px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
padding: 24px;
```

### Input velden
```css
border: 1px solid #E5E7EB;
border-radius: 8px;
padding: 12px 16px;
font-size: 16px;
```

---

## Iconen

### Stijl
- Line icons (niet filled)
- 2px stroke width
- Rounded corners
- Consistent met logo-stijl

### Aanbevolen icon set
- Heroicons (https://heroicons.com)
- Lucide (https://lucide.dev)

---

## Gradiënten

### Brand gradient
```css
background: linear-gradient(135deg, #0066CC 0%, #004499 100%);
```

Gebruik voor:
- Hero sections
- Feature highlights
- Call-to-action banners

---

## Afbeeldingen

### Stijl
- Clean, moderne uitstraling
- Hoog contrast
- Geen overmatige filters

### Illustraties
- Simpele, geometrische stijl
- Gebruik brand kleuren
- Consistente lijndikte (2-3px)

---

## Social Media

### Profielfoto
Gebruik het logo-icoon (zonder tekst) op vierkant formaat:
- 400x400px voor de meeste platforms
- Brand Blue (#0066CC) achtergrond met wit icoon

### Cover/header afbeeldingen
Gebruik de og-image als basis, aangepast per platform:
- LinkedIn: 1584x396px
- Twitter/X: 1500x500px
- Facebook: 820x312px

---

## Downloads

Alle brand assets zijn beschikbaar in:
`/apps/auth-portal/public/`

Voor hoge-resolutie versies of specifieke formaten, neem contact op met het product team.

---

## Contact

Vragen over visual identity of brand assets?
- **Intern:** Product/marketing team
- **Extern:** hello@praatmetjeboekhouding.nl

---

*Laatste update: januari 2026*
