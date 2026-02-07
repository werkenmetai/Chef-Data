# Agent Aanpassing bij Klantprojecten

> **Wanneer we voor een klant werken, past het hele team zich aan.
> Dit document beschrijft HOE elke agent zich aanpast.**

---

## Principe

```
Klant website crawlen
        ↓
Client Profile + Writing Style vastleggen
        ↓
Elke agent leest klant-context VOOR elke taak
        ↓
Output matcht klant-stijl, niet onze eigen stijl
```

---

## Verplichte Context per Agent

### Wie Leest Wat

| Agent | Must-Read | Waarom |
|-------|-----------|--------|
| **Anna** (Content) | CLIENT-PROFILE + WRITING-STYLE + BRAND-ASSETS | Schrijft alle content |
| **Tom** (Growth) | CLIENT-PROFILE + WRITING-STYLE | Marketing messaging |
| **Bram** (SEO) | CLIENT-PROFILE + WRITING-STYLE | SEO content, meta tags |
| **Victor** (Sales) | CLIENT-PROFILE | Klant-kennis voor pitches |
| **Emma** (Support) | CLIENT-PROFILE + WRITING-STYLE | Klantenservice toon |
| **Iris** (Technical Writer) | WRITING-STYLE + BRAND-ASSETS | Docs in klant-stijl |
| **Nienke** (Design) | CLIENT-PROFILE + BRAND-ASSETS | Design in klant-branding |
| **Daan** (Frontend) | BRAND-ASSETS | Kleuren, fonts, images in code |
| **Sander** (Product) | CLIENT-PROFILE | Feature prioriteiten |
| **Roos** (QA) | WRITING-STYLE | Content QA |

---

## Aanpassingsregels per Domein

### Content & Marketing (Anna, Tom, Bram)

**VOOR elke tekst, check:**
```
1. Welke aanspreekvorm? → WRITING-STYLE sectie 1
2. Welke toon voor deze context? → WRITING-STYLE sectie 2, "Toon per Context"
3. Verboden/verplichte woorden? → WRITING-STYLE sectie 3
4. CTA stijl? → WRITING-STYLE sectie 4
5. SEO regels? → WRITING-STYLE sectie 5
```

**NA elke tekst, check:**
```
- [ ] Leest dit alsof de klant het zelf geschreven heeft?
- [ ] Geen eigen bedrijfstermen per ongeluk gebruikt?
- [ ] Toon consistent met andere klant-content?
```

### Design (Nienke)

**VOOR elk design, check:**
```
1. Kleurenpalet → BRAND-ASSETS kleuren tabel
2. Fonts → BRAND-ASSETS fonts tabel
3. Logo gebruik → BRAND-ASSETS logo's
4. Fotografie stijl → CLIENT-PROFILE visuele identiteit
5. Bestaande patronen → screenshots uit migratie
```

### Frontend (Daan)

**VOOR elke implementatie, check:**
```
1. CSS variabelen → BRAND-ASSETS kleuren + fonts
2. Image paden → data/asset-map.json
3. Favicon + logo → BRAND-ASSETS
4. Font loading → BRAND-ASSETS fonts + licenties
```

### Support (Emma)

**VOOR elk klantcontact, check:**
```
1. Aanspreekvorm → WRITING-STYLE sectie 1
2. Toon voor support → WRITING-STYLE "Toon per Context" → Support/FAQ
3. Kernboodschap → CLIENT-PROFILE
```

---

## Stijl Overschrijving in Agent Prompts

Wanneer een klantproject actief is, voeg dit blok toe aan de bovenkant
van elke relevante agent prompt:

```markdown
## ⚠️ ACTIEF KLANTPROJECT: [Klantnaam]

**LEES EERST (verplicht bij elke taak):**
1. `operations/client-onboarding/CLIENT-PROFILE.md`
2. `operations/client-onboarding/WRITING-STYLE.md`
3. `operations/client-onboarding/BRAND-ASSETS.md`

**Schrijfregels deze klant:**
- Taal: [NL/EN]
- Aanspreking: [jij/je | u | wij]
- Toon: [X, Y, Z]
- Let op: [specifieke aandachtspunten]

**ALLE output moet passen bij de klant-stijl, niet bij onze eigen stijl.**
```

---

## Voorbeeld: Aanpassing in de Praktijk

### Scenario: Blog schrijven voor klant "De Groene Accountant"

**Client Profile zegt:**
- Doelgroep: ZZP'ers en kleine ondernemers
- Toon: Warm, toegankelijk, geen jargon
- Aanspreking: jij/je
- USP: Duurzame boekhouding

**Writing Style zegt:**
- Korte zinnen (max 15 woorden)
- Geen Engelse termen
- CTA stijl: uitnodigend, niet pushy
- Verboden: "klik hier", "offerte aanvragen"
- Verplicht: "ontdek", "begin vandaag"

**Anna schrijft (FOUT):**
```
Wij bieden een state-of-the-art boekhoudoplossing voor uw bedrijf.
Klik hier om een offerte aan te vragen voor onze premium diensten.
```

**Anna schrijft (GOED):**
```
Wil je weten hoeveel je bedrijf echt verdient? Zonder ingewikkeld
gedoe? Ontdek hoe groene boekhouding je tijd en geld bespaart.
Begin vandaag — het kost je maar 5 minuten.
```

---

## Kwaliteitscontrole

### Per Tekst (Anna/Tom/Bram → Iris reviewed)
- [ ] Aanspreekvorm correct
- [ ] Toon past bij context
- [ ] Geen verboden woorden
- [ ] Verplichte termen waar nodig
- [ ] CTA in juiste stijl
- [ ] Zou de klant dit zelf zeggen?

### Per Design (Nienke → Roos reviewed)
- [ ] Kleuren uit klant palette
- [ ] Fonts correct
- [ ] Logo juist gebruikt
- [ ] Fotostijl consistent

### Per Sprint (Iris doet volledige audit)
- [ ] Alle nieuwe content door stijlgids-check
- [ ] Consistentie tussen pagina's
- [ ] Geen stijl-drift (langzaam afwijken van de gids)

---

## Meerdere Klanten Tegelijk

Als we voor meerdere klanten werken:

```
operations/client-onboarding/
├── klant-a/
│   ├── CLIENT-PROFILE.md
│   ├── WRITING-STYLE.md
│   └── BRAND-ASSETS.md
├── klant-b/
│   ├── CLIENT-PROFILE.md
│   ├── WRITING-STYLE.md
│   └── BRAND-ASSETS.md
└── README.md (dit protocol)
```

**Belangrijk:** Agents moeten altijd checken voor WELKE klant ze werken
voordat ze beginnen. Stijlen mogen NOOIT gemixed worden.

---

*Eigenaar: Piet (CEO) + Marieke (HR)*
*Laatst bijgewerkt: 2026-02-07*
