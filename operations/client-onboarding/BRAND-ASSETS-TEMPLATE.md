# Brand Assets: [KLANTNAAM]

> Overzicht van alle visuele assets die we van de klant hebben of geëxtraheerd hebben.

---

## Asset Locaties

```
output/[klantnaam]/
├── assets/
│   ├── images/           # Alle gedownloade afbeeldingen
│   ├── fonts/            # Alle gedownloade fonts
│   └── ...
├── data/
│   └── asset-map.json    # Mapping oude URL → lokaal pad
└── screenshots/          # Referentie screenshots
```

---

## Logo's

| Asset | Bestand | Formaat | Gebruik |
|-------|---------|---------|---------|
| Logo primair | `assets/images/[bestand]` | PNG/SVG | Header, email |
| Logo wit/donker | `assets/images/[bestand]` | PNG/SVG | Donkere achtergronden |
| Logo icon | `assets/images/[bestand]` | PNG/SVG | Favicon, app icon |
| Favicon | `assets/images/[bestand]` | ICO/PNG | Browser tab |

**Status:** [ ] Gedownload via migratie tool [ ] Aangeleverd door klant [ ] Moet nog aangeleverd worden

---

## Fonts

| Font Naam | Bestand | Gewichten | Gebruik |
|-----------|---------|-----------|---------|
| [font] | `assets/fonts/[bestand]` | [400, 700, etc.] | Headings |
| [font] | `assets/fonts/[bestand]` | [400, 700, etc.] | Body text |

**Licentie:** [ ] Open source (gratis) [ ] Google Fonts [ ] Commercieel (licentie nodig) [ ] Onbekend - uitzoeken

---

## Afbeeldingen Inventarisatie

### Hero / Header Images
| Bestand | Pagina | Afmetingen | Behouden? |
|---------|--------|------------|-----------|
| [bestand] | [pagina] | [WxH] | [ ] Ja [ ] Vervangen |

### Product / Dienst Images
| Bestand | Pagina | Afmetingen | Behouden? |
|---------|--------|------------|-----------|
| [bestand] | [pagina] | [WxH] | [ ] Ja [ ] Vervangen |

### Team / Over Ons Foto's
| Bestand | Pagina | Afmetingen | Behouden? |
|---------|--------|------------|-----------|
| [bestand] | [pagina] | [WxH] | [ ] Ja [ ] Vervangen |

### Iconen & Illustraties
| Bestand | Gebruik | Formaat | Behouden? |
|---------|---------|---------|-----------|
| [bestand] | [waarvoor] | SVG/PNG | [ ] Ja [ ] Vervangen |

### Achtergrond Images
| Bestand | Pagina | Type | Behouden? |
|---------|--------|------|-----------|
| [bestand] | [pagina] | CSS bg / img tag | [ ] Ja [ ] Vervangen |

---

## Kleurenpalet (geëxtraheerd)

*Uit de CSS/design van de huidige site:*

| Naam | Hex | RGB | Gebruik |
|------|-----|-----|---------|
| Primair | #[hex] | rgb(X,X,X) | [gebruik] |
| Secundair | #[hex] | rgb(X,X,X) | [gebruik] |
| Accent | #[hex] | rgb(X,X,X) | [gebruik] |
| Achtergrond licht | #[hex] | rgb(X,X,X) | [gebruik] |
| Achtergrond donker | #[hex] | rgb(X,X,X) | [gebruik] |
| Tekst primair | #[hex] | rgb(X,X,X) | [gebruik] |
| Tekst secundair | #[hex] | rgb(X,X,X) | [gebruik] |
| Success | #[hex] | rgb(X,X,X) | [gebruik] |
| Error | #[hex] | rgb(X,X,X) | [gebruik] |

---

## Social Media Assets

| Platform | Huidig profiel | Assets nodig |
|----------|---------------|--------------|
| LinkedIn | [url] | [ ] Banner [ ] Profielfoto |
| Instagram | [url] | [ ] Templates |
| Facebook | [url] | [ ] Banner [ ] Profielfoto |
| Twitter/X | [url] | [ ] Banner [ ] Profielfoto |

---

## Documenten & Downloads

| Document | Bestand | Type | Behouden? |
|----------|---------|------|-----------|
| [naam] | `assets/documents/[bestand]` | PDF | [ ] Ja |

---

## Ontbrekende Assets

| Asset | Nodig voor | Wie levert aan | Deadline |
|-------|-----------|----------------|----------|
| [asset] | [waarvoor] | [ ] Klant [ ] Wij maken | [datum] |

---

## Asset Verwerking Status

### Checklist

- [ ] Alle images gedownload via migratie tool
- [ ] Image kwaliteit gecontroleerd (niet te klein/wazig)
- [ ] Fonts geïdentificeerd en gedownload
- [ ] Font licenties gecontroleerd
- [ ] Logo in alle varianten beschikbaar
- [ ] Favicon aanwezig
- [ ] Kleurenpalet gedocumenteerd
- [ ] Asset map gemaakt (oude URL → nieuwe locatie)
- [ ] Ontbrekende assets lijst gemaakt
- [ ] Klant geïnformeerd over ontbrekende assets

---

*Verantwoordelijke: Nienke (UX/UI Designer)*
*Laatst bijgewerkt: [datum]*
