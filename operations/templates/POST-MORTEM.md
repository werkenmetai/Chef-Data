# Post-Mortem Template

> **"Pijn + Reflectie = Vooruitgang"**
>
> Het doel is niet schuldigen aanwijzen, maar de organisatie slimmer maken.

---

## Incident/Project Informatie

| Veld | Waarde |
|------|--------|
| **Titel** | [Korte beschrijving van incident/project] |
| **Datum** | [YYYY-MM-DD] |
| **Severity** | [ ] P1-Kritiek [ ] P2-Hoog [ ] P3-Medium [ ] P4-Laag |
| **Type** | [ ] Incident [ ] Project [ ] Proces [ ] Anders |
| **Eigenaar** | [Naam van persoon die post-mortem leidt] |
| **Betrokkenen** | [Lijst van betrokken teamleden] |

---

## Samenvatting

**In één paragraaf:** Wat gebeurde er, wat was de impact, en wat is de belangrijkste les?

```
[Schrijf hier een korte samenvatting van maximaal 5 zinnen]
```

---

## Timeline

| Tijd | Gebeurtenis |
|------|-------------|
| [HH:MM] | [Eerste signaal/start] |
| [HH:MM] | [Volgende stap] |
| [HH:MM] | [Ontdekking/escalatie] |
| [HH:MM] | [Oplossing/resolutie] |
| [HH:MM] | [Volledig hersteld] |

---

## Wat Ging Er Mis?

### Directe Oorzaak
*Wat was de directe trigger van het probleem?*

```
[Beschrijf de directe oorzaak]
```

### Root Cause (5x Waarom)

Ga door totdat je bij de échte oorzaak bent:

1. **Waarom** gebeurde [het probleem]?
   → [Antwoord 1]

2. **Waarom** [Antwoord 1]?
   → [Antwoord 2]

3. **Waarom** [Antwoord 2]?
   → [Antwoord 3]

4. **Waarom** [Antwoord 3]?
   → [Antwoord 4]

5. **Waarom** [Antwoord 4]?
   → [ROOT CAUSE]

### Type Root Cause

- [ ] **Proces** - Ontbrekende of onduidelijke procedure
- [ ] **Techniek** - Bug, fout in code/configuratie
- [ ] **Communicatie** - Miscommunicatie of ontbrekende info
- [ ] **Kennis** - Ontbrekende kennis of training
- [ ] **Resource** - Te weinig tijd/mensen/tools
- [ ] **Externe factor** - Buiten onze controle

---

## Welke Signalen Hebben We Gemist?

*Waren er vroege waarschuwingen die we niet hebben opgepikt?*

| Signaal | Wanneer | Waarom Gemist |
|---------|---------|---------------|
| [Signaal 1] | [Datum/moment] | [Reden dat we het misten] |
| [Signaal 2] | [Datum/moment] | [Reden dat we het misten] |

---

## Impact Analyse

### Business Impact

| Aspect | Impact | Kwantificatie |
|--------|--------|---------------|
| Klanten geraakt | [Ja/Nee] | [Aantal/percentage] |
| Revenue impact | [Ja/Nee] | [Bedrag/schatting] |
| Reputatie impact | [Ja/Nee] | [Beschrijving] |
| Intern impact | [Ja/Nee] | [Uren/frustratie] |

### Wat Ging Goed?

*Wat werkte tijdens de respons? Wat moeten we behouden?*

1. [Positief punt 1]
2. [Positief punt 2]
3. [Positief punt 3]

---

## Actiepunten

### Korte Termijn (Deze Week)

| # | Actie | Eigenaar | Deadline | Status |
|---|-------|----------|----------|--------|
| 1 | [Actie] | [Naam] | [Datum] | [ ] Open |
| 2 | [Actie] | [Naam] | [Datum] | [ ] Open |

### Middellange Termijn (Deze Maand)

| # | Actie | Eigenaar | Deadline | Status |
|---|-------|----------|----------|--------|
| 1 | [Actie] | [Naam] | [Datum] | [ ] Open |
| 2 | [Actie] | [Naam] | [Datum] | [ ] Open |

### Lange Termijn (Dit Kwartaal)

| # | Actie | Eigenaar | Deadline | Status |
|---|-------|----------|----------|--------|
| 1 | [Actie] | [Naam] | [Datum] | [ ] Open |

---

## Lessons Learned

### Toe te voegen aan LESSONS-LEARNED.md

**Welke specialist?** [ ] Ruben (MCP) [ ] Joost (Exact) [ ] Daan (Backend) [ ] Tom (Marketing) [ ] Petra (Support) [ ] Jan (Finance) [ ] Eva (Legal)

```markdown
## [Korte titel van de les]

**Datum:** [YYYY-MM-DD]
**Bron:** Post-mortem [titel]

**Issue:** [Wat ging er mis]

**Root Cause:** [Waarom ging het mis]

**Oplossing:** [Wat werkte / wat voorkomen we nu]

**Detectie:** [Hoe herkennen we dit in de toekomst]
```

---

## Follow-Up

### Review Datum

- [ ] 1 week na incident: Check korte termijn acties
- [ ] 1 maand na incident: Check alle acties + effectiviteit

### Communicatie

- [ ] Team geïnformeerd over lessons learned
- [ ] LESSONS-LEARNED.md bijgewerkt
- [ ] Relevante processen/documentatie bijgewerkt

---

## Ondertekening

| Rol | Naam | Datum |
|-----|------|-------|
| Post-mortem eigenaar | [Naam] | [Datum] |
| Manager | [Naam] | [Datum] |
| Specialist (indien relevant) | [Naam] | [Datum] |

---

## Checklist Post-Mortem

- [ ] Timeline is compleet en accuraat
- [ ] Root cause is geïdentificeerd (niet gestopt bij symptoom)
- [ ] Impact is gekwantificeerd waar mogelijk
- [ ] Actiepunten zijn SMART (Specifiek, Meetbaar, Acceptabel, Realistisch, Tijdgebonden)
- [ ] Elke actie heeft een eigenaar
- [ ] Lessons learned zijn gedocumenteerd
- [ ] Dit document is gedeeld met betrokkenen
- [ ] Follow-up review is gepland

---

*Dit template is gebaseerd op het principe "Pijn + Reflectie = Vooruitgang".*
*Gebruik dit template voor elk significant incident of project, ongeacht succes of falen.*
