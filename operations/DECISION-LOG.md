# Decision Log - [PROJECT_NAAM]

> **Elke belangrijke beslissing wordt vastgelegd. Waarom we iets deden is net zo belangrijk als wat we deden.**

---

## Waarom Een Decision Log?

| Reden | Uitleg |
|-------|--------|
| **Accountability** | Wie besloot wat, op basis van welke info? |
| **Leren** | Waren onze beslissingen achteraf goed? |
| **Onboarding** | Nieuwe agents begrijpen waarom dingen zo zijn |
| **Vermijd herhalingen** | Voorkom dat dezelfde discussie 3x gevoerd wordt |

---

## Decision Record Format

```markdown
## DEC-[NR]: [Titel]

**Datum:** [YYYY-MM-DD]
**Beslisser:** [Wie nam de beslissing]
**Status:** [Proposed | Accepted | Superseded | Deprecated]

### Context
[Waarom moest deze beslissing genomen worden? Wat was de situatie?]

### Opties Overwogen
| Optie | Voordelen | Nadelen |
|-------|-----------|---------|
| A: [optie] | [voordelen] | [nadelen] |
| B: [optie] | [voordelen] | [nadelen] |
| C: [optie] | [voordelen] | [nadelen] |

### Beslissing
[Welke optie is gekozen en waarom]

### Adviseurs
| Persoon | Believability | Advies |
|---------|---------------|--------|
| [naam] | ★★★★★ | [wat adviseerde deze persoon] |
| [naam] | ★★★☆☆ | [wat adviseerde deze persoon] |

### Gevolgen
[Wat zijn de verwachte gevolgen van deze beslissing?]

### Review Datum
[Wanneer evalueren we of dit een goede beslissing was?]
```

---

## Categorieën

| Categorie | Voorbeelden | Wie beslist |
|-----------|-------------|-------------|
| **Strategisch** | Product richting, markt, positionering | Matthijs (CSO) + Piet (CEO) |
| **Technisch** | Architectuur, stack, tooling | Kees (CTO) + Wim |
| **Product** | Features, prioriteiten, UX | Sander (PO) + Kees |
| **Commercieel** | Pricing, partnerships, sales strategie | Lisa (CMO) + Victor + Frans |
| **Operationeel** | Processen, tooling, team structuur | Henk (COO) + Piet |
| **Financieel** | Budget, investeringen, kosten | Frans (CFO) + Piet |
| **Security** | Auth, data handling, compliance | Bas + Eva |

---

## Beslissingen

### Strategisch

*(Nog geen beslissingen - strategie en doel worden nog bepaald)*

---

### Technisch

#### DEC-T001: Repository als Reusable AI Team Template

**Datum:** 2026-01-28
**Beslisser:** Piet (CEO)
**Status:** Accepted

**Context:** Het oorspronkelijke project (Praat met je Boekhouding) is getransformeerd naar een herbruikbare template voor AI teams.

**Beslissing:** Alle project-specifieke content is verwijderd en vervangen door placeholders. De organisatiestructuur, principes, en kennisbank structuur zijn behouden als template.

**Gevolgen:** De repo kan nu als startpunt dienen voor elk nieuw AI team project. Strategie en roadmap moeten ingevuld worden zodra er een concreet doel is.

---

### Organisatorisch

#### DEC-O001: Team Uitbreiding - 6 Nieuwe Rollen

**Datum:** 2026-02-06
**Beslisser:** Piet (CEO) op verzoek van eigenaar
**Status:** Accepted

**Context:** Het team had blinde vlekken: geen product management, geen design, geen sales, geen HR, geen data engineering, geen technisch schrijver.

**Opties Overwogen:**
| Optie | Voordelen | Nadelen |
|-------|-----------|---------|
| A: Alleen Product Owner | Snelste impact | Andere gaten blijven |
| B: Gefaseerd 6 rollen | Balans snelheid/compleetheid | Meer werk |
| C: Alle 6 + resources tegelijk | Team volledig klaar | Veel tegelijk |

**Beslissing:** Optie C - Alle 6 rollen + 7 resource documenten tegelijk implementeren.

**Nieuwe rollen:**
1. Sander - Product Owner (Management, onder Kees)
2. Nienke - UX/UI Designer (Operationeel, onder Wim)
3. Victor - Sales Lead (Management, onder Lisa)
4. Marieke - HR Manager (Management, onder Henk)
5. Wouter - Data Engineer (Operationeel, onder Wim)
6. Iris - Technical Writer (Operationeel, onder Wim)

**Gevolgen:** Team groeit van 25 naar 31 agents. Org structure, believability matrix, en kennistoegang moeten geüpdatet worden.

**Review Datum:** 2026-Q2 - Evalueer of alle rollen effectief benut worden zodra er een concreet bedrijfsdoel is.

---

## Evaluatie Protocol

### Per Kwartaal
1. Review alle beslissingen van afgelopen kwartaal
2. Per beslissing: was dit achteraf de juiste keuze?
3. Update believability van adviseurs op basis van uitkomsten
4. Markeer verouderde beslissingen als `Superseded` of `Deprecated`

### Bij Evaluatie Vragen
- Was de informatie op dat moment correct?
- Zijn de verwachte gevolgen uitgekomen?
- Wat weten we nu dat we toen niet wisten?
- Zouden we het opnieuw anders doen?

---

*Eigenaar: Piet (CEO)*
*Laatst bijgewerkt: 2026-02-06*
*Review cyclus: Per kwartaal*
