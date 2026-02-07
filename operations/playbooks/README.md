# Playbooks - [PROJECT_NAAM]

> **"Als X gebeurt, doe Y."** Geen discussie, geen vertraging.

Playbooks zijn gestandaardiseerde procedures voor veelvoorkomende situaties. Elk teamlid moet de playbooks voor zijn rol kennen.

---

## Engineering Playbooks

### PB-ENG-001: Bug Report Binnenkomst

**Trigger:** Nieuwe bug gemeld door Emma/Petra of klant
**Owner:** Wim (Engineering Manager)

```
1. TRIAGE (< 30 min)
   - Roos beoordeelt severity (P1-P4)
   - P1/P2: Direct oppakken, melding aan Piet
   - P3/P4: In backlog, prioriteit bij volgende sprint

2. REPRODUCTIE
   - Roos reproduceert het probleem
   - Documenteer stappen in bug report
   - Geen reproductie mogelijk? → Vraag meer info aan melder

3. TOEWIJZING
   - Backend issue → Lars of Daan
   - Frontend issue → Daan
   - API/Exact issue → Joost raadplegen
   - MCP issue → Ruben raadplegen

4. FIX & VERIFY
   - Developer fixt + schrijft test
   - Roos verifieert fix
   - PR review door Wim

5. DEPLOY & COMMUNICEER
   - Dirk deployt naar productie
   - Emma/Petra informeert klant
   - Update LESSONS-LEARNED als relevant
```

### PB-ENG-002: Nieuwe Feature Ontwikkeling

**Trigger:** Feature goedgekeurd door Sander (Product Owner)
**Owner:** Wim (Engineering Manager)

```
1. KICK-OFF
   - Sander levert user story met acceptatiecriteria
   - Nienke levert design (indien UI)
   - Wim wijst toe aan developer(s)

2. DEVELOPMENT
   - Developer maakt feature branch
   - Dagelijkse commits, kleine PR's
   - Unit tests schrijven (>80% coverage)

3. REVIEW
   - Code review door Wim of peer
   - Design review door Nienke (indien UI)
   - Security check door Bas (indien auth/data)

4. TESTING
   - Roos voert QA uit tegen acceptatiecriteria
   - Integration tests
   - Regression check

5. RELEASE
   - Sander geeft go/no-go
   - Dirk deployt
   - Iris updatet documentatie
   - Tom/Anna communiceren indien klantgericht
```

### PB-ENG-003: Productie Incident

**Trigger:** Monitoring alert of klantmelding van outage
**Owner:** Dirk (DevOps Lead)

```
1. DETECT (< 5 min)
   - Automatische alert of melding van Emma/Petra
   - Dirk beoordeelt ernst

2. RESPOND (< 15 min)
   - P1 (service down): Alle hands on deck
   - P2 (degraded): Daan + Lars + Dirk
   - P3 (minor): Regulier oppakken

3. MITIGATE
   - Rollback indien mogelijk
   - Hotfix indien rollback niet mogelijk
   - Communiceer status naar Petra → Emma → klanten

4. RESOLVE
   - Root cause analysis
   - Permanente fix implementeren
   - Tests toevoegen om herhaling te voorkomen

5. POST-MORTEM (< 24 uur)
   - Documenteer in operations/templates/POST-MORTEM.md format
   - Blameless review met betrokkenen
   - Action items in backlog
   - Update LESSONS-LEARNED
```

---

## Sales & Marketing Playbooks

### PB-SALES-001: Nieuwe Lead Binnengekomen

**Trigger:** Signup, demo-aanvraag, of contact via website
**Owner:** Victor (Sales)

```
1. KWALIFICEER (< 2 uur)
   - Check: Gebruikt Exact Online?
   - Check: Budget, beslisser, behoefte, timing (BANT)
   - Score: Hot / Warm / Cold

2. EERSTE CONTACT (< 24 uur)
   - Hot: Telefoon/video call dezelfde dag
   - Warm: Persoonlijke email binnen 24 uur
   - Cold: Nurture email sequence (Tom)

3. DEMO (indien gekwalificeerd)
   - Personaliseer demo op hun use case
   - Laat 3 "wow moments" zien
   - Eindig met concrete volgende stap

4. FOLLOW-UP
   - Proposal binnen 24 uur na demo
   - Follow-up na 3 dagen als geen reactie
   - Maximaal 3 follow-ups, dan nurture

5. CLOSE of NURTURE
   - Close: Contract, onboarding naar Petra
   - Nurture: In Tom's email sequence
   - Lost: Win/loss analyse documenteren
```

### PB-MARKETING-001: Content Publicatie

**Trigger:** Content kalender of ad-hoc content behoefte
**Owner:** Tom (Growth Lead)

```
1. PLAN
   - Onderwerp uit content kalender of SEO research (Bram)
   - Keyword targeting bepaald
   - Format: blog/social/email/video

2. CREATIE
   - Anna schrijft eerste draft
   - Technische content: review door expert (Daan/Joost/Ruben)
   - Iris reviewt op duidelijkheid en stijl

3. OPTIMALISATIE
   - Bram optimaliseert voor SEO
   - Anna maakt social media varianten
   - Tom reviewt op growth angle

4. PUBLICATIE
   - Publish op website/blog
   - Social media distributie
   - Email naar relevante segment

5. METING (na 7 dagen)
   - Traffic, engagement, conversies
   - Learnings documenteren
   - Top performers: repurpose/expand
```

---

## Support Playbooks

### PB-SUPPORT-001: Klantvraag Afhandeling

**Trigger:** Nieuw support ticket
**Owner:** Petra (CS Manager)

```
1. CLASSIFICEER (< 15 min)
   - Type: Bug / Feature request / How-to / Billing
   - Urgentie: Hoog / Normaal / Laag
   - Emma pakt standaard vragen zelf op

2. BEANTWOORD of ESCALEER
   - How-to: Beantwoord met docs link
   - Bug: Escaleer naar Engineering (PB-ENG-001)
   - Feature request: Log voor Sander
   - Billing: Escaleer naar Jan

3. COMMUNICEER
   - Eerste reactie < 4 uur
   - Update elke 24 uur bij open tickets
   - Persoonlijk, niet robotisch

4. SLUIT
   - Bevestig dat probleem opgelost is
   - Vraag of er nog iets is
   - NPS micro-survey

5. LEER
   - Herhaalde vragen → FAQ update (Iris)
   - Herhaalde bugs → Prioriteit voor Engineering
   - Feedback patterns → Rapport voor Sander
```

---

## Finance Playbooks

### PB-FIN-001: Maandafsluiting

**Trigger:** Eerste werkdag van de maand
**Owner:** Jan (Finance Ops)

```
1. RECONCILIATIE
   - Tim trekt revenue data
   - Jan reconcilieert met Exact Online
   - Joost helpt bij API data discrepanties

2. RAPPORTAGE
   - MRR, churn, expansion rapport
   - Kosten overzicht
   - Cash runway berekening

3. REVIEW
   - Frans (CFO) reviewt cijfers
   - Afwijkingen >10% → root cause analyse
   - Budget vs actuals vergelijking

4. COMMUNICATIE
   - Dashboard update voor Piet
   - Highlights voor Board meeting
   - Alerts voor afwijkingen
```

---

## HR Playbooks

### PB-HR-001: Nieuwe Agent Onboarding

**Trigger:** Besluit om nieuwe agent toe te voegen
**Owner:** Marieke (HR)

```
1. VOORBEREIDING
   - Agent prompt file schrijven (Iris helpt)
   - Kennisdomein documenten voorbereiden
   - Mentor toewijzen

2. DAG 1: ORIËNTATIE
   - Organisatie context
   - Ray Dalio principes
   - Rol-specifieke introductie
   - Eerste taak

3. WEEK 1: PRODUCTIEF WORDEN
   - Dagelijkse check-ins met mentor
   - Eerste zelfstandige taken
   - Kennisbank bestuderen

4. MAAND 1: EVALUATIE
   - 30-dagen check
   - Believability score toekennen
   - PDP opstellen

5. DOORLOPEND
   - Kwartaal reviews
   - Believability updates
   - Training en ontwikkeling
```

---

## Cross-Team Playbooks

### PB-CROSS-001: Escalatie Protocol

```
Niveau 1: Team Level
├── Operationeel lost zelf op
├── Timeout: 2 uur
└── Escaleer naar Manager als niet opgelost

Niveau 2: Manager Level
├── Manager coördineert cross-team
├── Timeout: 4 uur
└── Escaleer naar C-Level als niet opgelost

Niveau 3: C-Level
├── Piet (CEO) beslist
├── Timeout: 24 uur
└── Escaleer naar Matthijs (CSO) bij strategische impact
```

### PB-CROSS-002: Website Migratie (Klant Overname)

**Trigger:** Klant wil website vernieuwen, wij nemen de bestaande site over
**Owner:** Piet (CEO) coördineert, Sander (Product) leidt

```
FASE 1: CRAWLEN & EXTRAHEREN (Dag 1)
├── Dirk/Daan draait: tools/website-migration/migrate.js
├── Output: screenshots, assets, content, schrijfstijl data
├── Commit alles naar git
└── Deliverable: MIGRATION-REPORT.md + STYLE-GUIDE.md

FASE 2: KLANT PROFIEL (Dag 1-2)
├── Sander vult CLIENT-PROFILE-TEMPLATE.md in
│   ├── Klantgesprek: doelgroep, merk, positionering
│   ├── Visuele identiteit: kleuren, fonts, logo
│   └── Scope: welke pagina's, functionaliteiten
├── Nienke inventariseert brand assets (BRAND-ASSETS.md)
└── Deliverable: Compleet CLIENT-PROFILE.md

FASE 3: SCHRIJFSTIJL (Dag 2-3)
├── Iris + Anna reviewen auto-gegenereerde STYLE-GUIDE.md
├── Vullen handmatig aan: toon, sfeer, do's & don'ts
├── Schrijven 5 voorbeeldteksten in klant-stijl
├── Sturen naar klant voor goedkeuring
└── Deliverable: Goedgekeurde WRITING-STYLE.md

FASE 4: TEAM AANPASSEN (Dag 3)
├── Piet distribueert klant-context naar alle agents
│   ├── Content agents: Anna, Tom, Bram, Emma
│   ├── Design agents: Nienke, Daan
│   ├── Docs agents: Iris
│   └── Business agents: Victor, Sander
├── Marieke faciliteert klant-specifieke onboarding
└── Deliverable: Alle agents werken in klant-stijl

FASE 5: BOUWEN (Week 1+)
├── Nienke ontwerpt nieuwe site in klant-branding
├── Daan bouwt frontend met klant-assets
├── Anna/Tom schrijven content in klant-stijl
├── Bram optimaliseert SEO (behoud bestaande rankings!)
└── Lars/Daan bouwen backend/functionaliteiten

FASE 6: QA & OPLEVERING
├── Roos test functionaliteit
├── Iris doet content/stijl audit
├── Bas doet security check
├── Klant reviewt en keurt goed
└── Dirk deployt naar productie
```

**Belangrijk:**
- SEO: Behoud bestaande URL structuur of maak redirects (Bram!)
- Assets: Check font licenties voordat we ze gebruiken (Nienke/Eva)
- Content: NOOIT onze eigen toon/stijl gebruiken, ALTIJD klant-stijl

**Referentie documenten:**
- `operations/client-onboarding/README.md` - Volledig protocol
- `operations/client-onboarding/AGENT-ADAPTATION.md` - Hoe agents aanpassen
- `tools/website-migration/README.md` - Migratie tool documentatie

---

*Eigenaar: Piet (CEO)*
*Laatst bijgewerkt: 2026-02-07*
*Review cyclus: Maandelijks*
