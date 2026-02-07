# Client Onboarding Protocol

> **Wanneer we een website van een klant overnemen, volg dit protocol.
> Doel: Heel het team past zich aan de klant aan — schrijfstijl, toon, branding, alles.**

---

## Overzicht

```
┌──────────────────────────────────────────────────────┐
│  STAP 1: WEBSITE CRAWLEN                             │
│  Playwright migratie tool draait                      │
│  Output: assets, screenshots, content, schrijfstijl  │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  STAP 2: CLIENT PROFILE INVULLEN                     │
│  Manueel + automatisch: brand, toon, doelgroep       │
│  Output: CLIENT-PROFILE.md                           │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  STAP 3: SCHRIJFSTIJL VASTLEGGEN                     │
│  Review gegenereerde stijlgids, vul aan              │
│  Output: WRITING-STYLE.md                            │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  STAP 4: TEAM AANPASSEN                              │
│  Alle agents ontvangen klant-context                 │
│  Prompts, templates, tone-of-voice aangepast         │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  STAP 5: QA & VALIDATIE                              │
│  Check of output matcht met klant-stijl              │
│  Klant review en goedkeuring                         │
└──────────────────────────────────────────────────────┘
```

---

## Stap 1: Website Crawlen

**Wie:** Dirk (DevOps) of Daan (Backend)
**Tool:** `tools/website-migration/migrate.js`

```bash
cd tools/website-migration
npm install && npx playwright install chromium

node migrate.js \
  --url https://klantwebsite.nl \
  --output ./output/klantnaam \
  --max-pages 100 \
  --mobile \
  --delay 1500
```

**Deliverables:**
- [ ] Alle pagina screenshots (desktop + mobile)
- [ ] Alle images gedownload in `assets/images/`
- [ ] Alle fonts gedownload in `assets/fonts/`
- [ ] Content geëxtraheerd als markdown
- [ ] `MIGRATION-REPORT.md` gegenereerd
- [ ] `STYLE-GUIDE.md` gegenereerd
- [ ] `asset-map.json` voor URL mapping
- [ ] `writing-style.json` voor stijl data

**Commit naar git:**
```bash
cd output/klantnaam
git add .
git commit -m "feat: website migratie data voor [klantnaam]"
```

---

## Stap 2: Client Profile Invullen

**Wie:** Sander (Product Owner) + degene die contact heeft met de klant
**Template:** `CLIENT-PROFILE.md` (zie template hieronder)

Vul het profiel in op basis van:
1. De automatisch gegenereerde `MIGRATION-REPORT.md`
2. Gesprekken met de klant
3. Bestaande materialen (logo files, brand guidelines, etc.)

---

## Stap 3: Schrijfstijl Vastleggen

**Wie:** Iris (Technical Writer) + Anna (Content)

1. Review de automatisch gegenereerde `STYLE-GUIDE.md`
2. Vul de handmatige secties in (toon, sfeer, doelgroep)
3. Maak 3-5 voorbeeldteksten in de klant-stijl
4. Laat de klant reviewen en goedkeuren

**Vragen om aan de klant te stellen:**
- Hoe spreek je je klanten aan? (jij/je of u?)
- Is er een bestaande stijlgids of brand guide?
- Welke toon wil je uitstralen? (professioneel/casual/speels?)
- Zijn er woorden die je altijd/nooit gebruikt?
- Wie is je ideale klant? (persona)
- Welke concurrent vind je inspirerend qua communicatie?

---

## Stap 4: Team Aanpassen

**Wie:** Piet (CEO) coördineert, Marieke (HR) faciliteert

### Hoe Agents Klant-Context Ontvangen

Elk agent die content produceert of met de klant communiceert, moet de volgende bestanden lezen aan het begin van elke taak:

```bash
# VERPLICHT bij klant-gerelateerd werk
cat operations/client-onboarding/CLIENT-PROFILE.md    # Wie is de klant
cat operations/client-onboarding/WRITING-STYLE.md      # Hoe schrijven we
cat operations/client-onboarding/BRAND-ASSETS.md       # Welke assets gebruiken we
```

### Welke Agents Moeten Aanpassen

| Agent | Wat aanpassen | Voorbeeld |
|-------|--------------|-----------|
| **Anna** (Content) | Schrijfstijl, toon, woordkeuze | Blog posts in klant-toon |
| **Tom** (Growth) | Marketing messaging, CTA's | Landing pages, ads |
| **Bram** (SEO) | Meta titles, descriptions in klant-stijl | SEO content |
| **Emma** (Support) | Klantenservice toon | Support antwoorden |
| **Victor** (Sales) | Pitch, proposals in klant-context | Offertes |
| **Iris** (Technical Writer) | Documentatie in klant-stijl | Help docs, FAQ |
| **Nienke** (Design) | Klant kleuren, fonts, branding | UI designs |
| **Daan** (Frontend) | Brand assets in code | CSS variabelen, images |

### Agent Prompt Aanpassing

Voeg deze sectie toe aan relevante agent prompts wanneer er een actief klantproject is:

```markdown
## Actief Klantproject: [Klantnaam]

**LEES ALTIJD EERST:**
- `operations/client-onboarding/CLIENT-PROFILE.md`
- `operations/client-onboarding/WRITING-STYLE.md`

**Schrijfstijl regels:**
- Taal: [NL/EN]
- Aanspreekvorm: [jij/u]
- Toon: [professioneel/casual/speels]
- Verboden woorden: [lijst]
- Verplichte termen: [lijst]
```

---

## Stap 5: QA & Validatie

**Wie:** Roos (QA) + Iris (Technical Writer)

### Content QA Checklist

- [ ] Alle teksten zijn in de juiste aanspreking (jij/u)
- [ ] Toon is consistent met de stijlgids
- [ ] Geen eigen termen/jargon dat niet van de klant is
- [ ] CTA's matchen de klant-stijl
- [ ] Headings volgen het vastgestelde patroon
- [ ] Alle images zijn correct overgenomen
- [ ] Fonts zijn correct geladen
- [ ] Kleuren matchen het brand palette
- [ ] Favicons en logo's correct

### Klant Review

- [ ] Stuur stijlgids naar klant ter goedkeuring
- [ ] Stuur 3 voorbeeld-pagina's in nieuwe opmaak
- [ ] Verwerk feedback
- [ ] Definitieve goedkeuring ontvangen

---

## Templates

De volgende templates staan in deze directory:
- `CLIENT-PROFILE-TEMPLATE.md` - Klant profiel template
- `WRITING-STYLE-TEMPLATE.md` - Schrijfstijl template
- `BRAND-ASSETS-TEMPLATE.md` - Brand assets checklist

---

*Eigenaar: Piet (CEO) + Sander (Product Owner)*
*Laatst bijgewerkt: 2026-02-07*
