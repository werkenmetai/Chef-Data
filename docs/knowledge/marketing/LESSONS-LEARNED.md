# Marketing Lessons Learned

> **Beheerder:** Tom (Growth Lead)
> **Domein:** Content, SEO, Growth, Community
> **Laatst bijgewerkt:** 2026-02-08 (sync vanuit Exact-online-MCP)

## Hoe Lessons Toevoegen

```markdown
## Lesson: [Korte titel]

**Datum:** YYYY-MM-DD
**Melder:** [Naam]
**Categorie:** Content | SEO | Social | Growth | Community

### Probleem
[Wat ging er mis of wat ontdekten we]

### Oorzaak
[Root cause]

### Oplossing
[Wat werkte]

### Preventie
[Hoe voorkomen we dit in de toekomst]

### Bron
[PR/campagne/experiment]
```

---

## Lessons

### LESSON-001: Blogs moeten leesbaar zijn voor mensen

**Datum:** 2026-02-05
**Melder:** Lisa (CMO)
**Categorie:** Content

**Probleem:** Eerste blogs waren technische feature-lijsten, droge content.
**Oorzaak:** CSS styling onvoldoende (Tailwind prose), engineers schrijven features niet benefits.
**Oplossing:** CSS header styling (PR #244), nieuwe content guidelines (PR #241, #242, #245), blog template structuur.
**Preventie:** Blog checklist: geen tool namen, geen technisch jargon, max 3 zinnen per alinea, voorbeeldvragen per sectie.

---

### LESSON-002: ChatGPT kon ons niet vinden op generieke zoektermen

**Datum:** 2026-02-07
**Melder:** Piet (CEO) via ChatGPT-verslag
**Categorie:** SEO

**Probleem:**
ChatGPT kon "Praat met je Boekhouding" niet vinden bij zoekopdrachten als:
- "Exact Online koppelen aan ChatGPT"
- "Exact Online connector"
- "Exact Online integratie ChatGPT"

Pas bij merknaam ("praatmetjeboekhouding") of specifieke combo ("Exact Online ChatGPT MCP") werd de pagina gevonden.

**Oorzaak:**
1. H1 bevatte "Praat met je Exact Online boekhouding" maar NIET "ChatGPT", "koppelen" of "MCP connector"
2. Zichtbare tekst op homepage miste generieke zoektermen die mensen gebruiken
3. Structured data (FAQPage) had slechts 4 vragen, geen specifieke over ChatGPT koppeling
4. Geen HowTo schema voor de "Zo werkt het" stappen
5. Keywords meta tag miste "koppelen", "integratie", "connector"
6. Sitemap verouderd: 12 van 22 blog posts ontbraken

**Oplossing (PR #278):**
1. Meta description herschreven met "Exact Online koppelen aan ChatGPT" als opening
2. Hero sectie uitgebreid met zichtbare tekst: "Koppel Exact Online aan ChatGPT, Claude of Copilot via onze MCP connector"
3. FAQPage schema uitgebreid van 4→7 vragen incl. "Hoe koppel ik Exact Online aan ChatGPT?" en "Wat is een MCP connector?"
4. HowTo schema toegevoegd voor de 3 setup stappen
5. SoftwareApplication schema naam verbeterd: "MCP Connector voor Exact Online"
6. Keywords meta tag uitgebreid met "koppelen", "integratie", "connector"
7. Sitemap bijgewerkt met alle 22 blog posts

**Preventie:**
- Bij elke pagina-update: check of de **zoektermen die mensen typen** in zichtbare tekst staan
- Structured data altijd meenemen bij content updates
- Sitemap automatiseren of maandelijks synchroniseren met blog-posts.ts
- Kwartaal-check: zoek op onze doelwoorden in Google en ChatGPT - vinden we onszelf?

**Kernles:**
Een goede title tag is niet genoeg. Zichtbare tekst op de pagina (H1, eerste alinea, FAQ) moet de termen bevatten die je doelgroep daadwerkelijk intypt.

**Bron:** ChatGPT-verslag "Waarom ik de tool niet kon vinden"

---

### LESSON-003: Platform capabilities kennis ontbrak (2026-02-07)

**Datum:** 2026-02-07
**Melder:** Piet (orchestrator) + Matthijs (CSO)
**Categorie:** Content

#### Probleem
Blogs en advies waren incompleet omdat we geen documentatie hadden over platform mogelijkheden. Blogs noemden alleen "ChatGPT en Claude" terwijl 10+ platforms werken.

#### Oorzaak
1. Geen intern document met platform capabilities
2. MCP ecosysteem groeit snel (8.250+ servers) maar team wist dit niet
3. Content team schreef vanuit beperkte kennis

#### Oplossing
1. 5 diepte-onderzoeken in `docs/research/`
2. Master document: `docs/product/PLATFORM-CAPABILITIES.md`
3. Website ge-update: alle pagina's noemen nu 10+ platforms
4. Alle 22 blogs geaudit en gecorrigeerd

#### Preventie
**Verplichte lezing voor ELKE blog:**
- `docs/product/PLATFORM-CAPABILITIES.md` - Wat kan elk platform?
- Noem altijd "10+ platforms" niet alleen "ChatGPT en Claude"
- Vermeld combinatie-mogelijkheden (spreadsheets, email, Slack)
- Check platform beperkingen (bijv. Voice Mode werkt niet met MCP)

#### Bron
PRs #265-#274, onderzoeksagenten 2026-02-07

---

## Best Practices

### Content
- Gebruik altijd de huisstijl (zie brand guidelines)
- Afbeeldingen optimaliseren voor web (max 200KB, WebP formaat)
- Alt-teksten voor alle afbeeldingen (accessibility + SEO)

### SEO
- Focus keywords in titel, H1, en eerste paragraaf
- Meta descriptions 150-160 karakters
- Interne links naar gerelateerde content

### Social
- Post tijden: 9:00, 12:00, 17:00 (Nederlandse tijdzone)
- Hashtags: max 5 per post
- Engage binnen 1 uur op comments
