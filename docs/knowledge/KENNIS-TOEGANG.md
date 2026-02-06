# Kennistoegang - Alle Collega's

> **Principe:** Elke collega heeft toegang tot alle kennis. Specialisten beheren, iedereen leert.

---

## Bedrijfsprincipes

We werken volgens Ray Dalio's principes. **Verplichte lezing voor iedereen:**

```bash
# PRINCIPES & BESLUITVORMING
cat operations/PRINCIPLES.md         # Onze bedrijfsprincipes
cat operations/BELIEVABILITY.md      # Wie is expert waarvoor?
cat operations/LESSONS-LEARNED.md    # Organisatie-brede lessen (Piet/Matthijs)
cat operations/templates/POST-MORTEM.md  # Template voor leren van fouten
```

**Kernformule:** `Pijn + Reflectie = Vooruitgang`

Lees meer: `operations/PRINCIPLES.md`

---

## Snelle Toegang

```bash
# TECH DOMEINEN
cat docs/knowledge/mcp/LESSONS-LEARNED.md             # MCP Protocol (Ruben)
cat docs/knowledge/exact/LESSONS-LEARNED.md           # Exact API (Joost)
cat docs/knowledge/backend/LESSONS-LEARNED.md         # Backend/Infra (Daan)
cat docs/knowledge/backend/DATABASE.md                # Database schema
cat docs/knowledge/data-engineering/LESSONS-LEARNED.md # Data Pipelines (Wouter)
cat docs/knowledge/design/LESSONS-LEARNED.md          # UX/UI Design (Nienke)

# BUSINESS DOMEINEN
cat docs/knowledge/marketing/LESSONS-LEARNED.md  # Marketing (Tom)
cat docs/knowledge/sales/LESSONS-LEARNED.md      # Sales (Victor)
cat docs/knowledge/support/LESSONS-LEARNED.md    # Support (Petra)
cat docs/knowledge/finance/LESSONS-LEARNED.md    # Finance (Jan)
cat docs/knowledge/legal/LESSONS-LEARNED.md      # Legal (Eva)
cat docs/knowledge/product/LESSONS-LEARNED.md    # Product (Sander)
cat docs/knowledge/hr/LESSONS-LEARNED.md         # HR/People (Marieke)
```

## Volledige Kennisstructuur

```
docs/knowledge/
├── KENNIS-TOEGANG.md              # Dit bestand - startpunt voor iedereen
│
├── mcp/                            # MCP Protocol (Specialist: Ruben)
│   ├── LESSONS-LEARNED.md          # Protocol bugs & fixes
│   ├── VERSION.md                  # SDK versies
│   └── scraped/                    # 9 officiële MCP docs
│
├── exact/                          # Exact API (Specialist: Joost)
│   ├── LESSONS-LEARNED.md          # API quirks & oplossingen
│   ├── VERSION.md                  # API versie tracking
│   └── scraped/                    # 6 officiële Exact docs
│
├── backend/                        # Backend/Infra (Specialist: Daan)
│   ├── LESSONS-LEARNED.md          # Infra fixes & patronen
│   ├── DATABASE.md                 # Complete schema (20+ tabellen)
│   ├── VERSION.md                  # Dependency versies
│   ├── TEST-SCENARIOS.md           # Edge cases
│   └── scraped/                    # 4 Cloudflare platform docs
│
├── marketing/                      # Marketing (Specialist: Tom)
│   ├── LESSONS-LEARNED.md          # Content, SEO, Growth lessons
│   └── VERSION.md                  # Brand & tooling
│
├── support/                        # Support (Specialist: Petra)
│   ├── LESSONS-LEARNED.md          # Ticket patterns, onboarding
│   └── VERSION.md                  # Support metrics & tooling
│
├── finance/                        # Finance (Specialist: Jan)
│   ├── LESSONS-LEARNED.md          # Billing, subscription issues
│   └── VERSION.md                  # Stripe config, pricing
│
├── legal/                          # Legal (Specialist: Eva)
│   ├── LESSONS-LEARNED.md          # Compliance learnings
│   └── VERSION.md                  # Legal docs versies
│
├── product/                        # Product (Specialist: Sander)
│   ├── LESSONS-LEARNED.md          # Product decisions & learnings
│   └── VERSION.md                  # Product versies
│
├── design/                         # UX/UI Design (Specialist: Nienke)
│   ├── LESSONS-LEARNED.md          # Design learnings
│   └── VERSION.md                  # Design system versies
│
├── sales/                          # Sales (Specialist: Victor)
│   ├── LESSONS-LEARNED.md          # Sales learnings
│   └── VERSION.md                  # Pricing & tooling
│
├── hr/                             # HR/People (Specialist: Marieke)
│   ├── LESSONS-LEARNED.md          # HR learnings
│   └── VERSION.md                  # HR processen & tools
│
└── data-engineering/               # Data Engineering (Specialist: Wouter)
    ├── LESSONS-LEARNED.md          # Pipeline learnings
    └── VERSION.md                  # Data stack versies
```

## Alle Specialisten

| Domein | Specialist | Kennispool | Rapporteert aan |
|--------|------------|------------|-----------------|
| MCP Protocol | **Ruben** | `mcp/` | Kees (CTO) |
| Exact API | **Joost** | `exact/` | Kees (CTO) |
| Backend/Infra | **Daan** | `backend/` | Kees (CTO) |
| Product | **Sander** | `product/` | Kees (CTO) |
| UX/UI Design | **Nienke** | `design/` | Wim |
| Data Engineering | **Wouter** | `data-engineering/` | Wim |
| Documentation | **Iris** | *alle docs* | Wim |
| Marketing/Content | **Tom** | `marketing/` | Lisa (CMO) |
| Sales | **Victor** | `sales/` | Lisa (CMO) |
| Support/CS | **Petra** | `support/` | Sophie (CCO) |
| Finance/Billing | **Jan** | `finance/` | Frans (CFO) |
| HR/People | **Marieke** | `hr/` | Henk (COO) |
| Legal/Compliance | **Eva** | `legal/` | Direct |

## Wanneer Welke Kennis?

### Tech Vragen

| Vraag/Taak | Lees Eerst | Specialist |
|------------|------------|------------|
| Tool bouwen/aanpassen | `mcp/LESSONS-LEARNED.md` | Ruben |
| Exact API call faalt | `exact/LESSONS-LEARNED.md` | Joost |
| Database query/migratie | `backend/DATABASE.md` | Daan |
| Worker/D1/KV issue | `backend/LESSONS-LEARNED.md` | Daan |
| OAuth/Token probleem | Alle 3 tech LESSONS | Daan + Joost |

### Product & Design Vragen

| Vraag/Taak | Lees Eerst | Specialist |
|------------|------------|------------|
| Feature prioritering | `product/LESSONS-LEARNED.md` | Sander |
| User story schrijven | `product/VERSION.md` | Sander |
| UI/UX design | `design/LESSONS-LEARNED.md` | Nienke |
| Design system | `design/VERSION.md` | Nienke |
| Data pipeline issue | `data-engineering/LESSONS-LEARNED.md` | Wouter |
| Documentatie update | *relevante docs* | Iris |

### Business Vragen

| Vraag/Taak | Lees Eerst | Specialist |
|------------|------------|------------|
| Content/Blog/Social | `marketing/LESSONS-LEARNED.md` | Tom |
| SEO strategie | `marketing/VERSION.md` | Tom |
| Lead/Sales vraag | `sales/LESSONS-LEARNED.md` | Victor |
| Klant probleem | `support/LESSONS-LEARNED.md` | Petra |
| Billing/Subscription | `finance/LESSONS-LEARNED.md` | Jan |
| Onboarding/HR | `hr/LESSONS-LEARNED.md` | Marieke |
| Privacy/GDPR | `legal/LESSONS-LEARNED.md` | Eva |

## Lesson Learned Melden

**Heb je iets geleerd? Meld het aan de juiste specialist!**

### Format

```
[Specialist naam], ik heb een lesson learned:
- Categorie: [relevante categorie]
- Issue: [wat ging er mis of wat ontdekten we]
- Oorzaak: [root cause]
- Oplossing: [wat werkte]
- Bron: [PR/ticket/campagne]
```

### Wie Voor Wat?

| Lesson Type | Meld aan |
|-------------|----------|
| MCP/Protocol | Ruben |
| Exact API | Joost |
| Backend/Infra/DB | Daan |
| Product/Features | Sander |
| UX/UI/Design | Nienke |
| Data Pipelines/Quality | Wouter |
| Documentatie | Iris |
| Content/SEO/Social | Tom |
| Sales/Leads/Deals | Victor |
| Tickets/Onboarding klant | Petra |
| Billing/Metrics | Jan |
| HR/Team/Performance | Marieke |
| Privacy/Compliance | Eva |

## Verplichte Kennis per Team

### Engineering Team
```bash
cat docs/knowledge/backend/DATABASE.md
cat docs/knowledge/mcp/LESSONS-LEARNED.md
cat docs/knowledge/exact/LESSONS-LEARNED.md
cat docs/knowledge/backend/LESSONS-LEARNED.md
```

### Marketing Team
```bash
cat docs/knowledge/marketing/LESSONS-LEARNED.md
cat docs/knowledge/marketing/VERSION.md
```

### Support Team
```bash
cat docs/knowledge/support/LESSONS-LEARNED.md
cat docs/knowledge/backend/LESSONS-LEARNED.md  # Voor troubleshooting
cat docs/knowledge/exact/LESSONS-LEARNED.md    # Voor API issues
```

### Product & Design Team
```bash
cat docs/knowledge/product/LESSONS-LEARNED.md
cat docs/knowledge/design/LESSONS-LEARNED.md
cat operations/ROADMAP.md
```

### Sales Team
```bash
cat docs/knowledge/sales/LESSONS-LEARNED.md
cat docs/knowledge/product/LESSONS-LEARNED.md  # Productkennis voor demos
cat operations/COMPETITIVE-INTELLIGENCE.md
```

### Finance Team
```bash
cat docs/knowledge/finance/LESSONS-LEARNED.md
cat docs/knowledge/finance/VERSION.md
cat docs/knowledge/backend/DATABASE.md  # Voor subscription data
```

### HR Team
```bash
cat docs/knowledge/hr/LESSONS-LEARNED.md
cat operations/ONBOARDING.md
cat operations/KENNISTOETSEN.md
cat operations/training/README.md
```

### Data Engineering Team
```bash
cat docs/knowledge/data-engineering/LESSONS-LEARNED.md
cat docs/knowledge/backend/LESSONS-LEARNED.md
cat docs/knowledge/exact/LESSONS-LEARNED.md  # API als databron
```

## Kennis Synchronisatie

### Wekelijks (Woensdag)
Alle specialisten updaten hun LESSONS-LEARNED.md met:
- Nieuwe issues/fixes uit de week
- Patronen ontdekt
- Best practices bijgewerkt

### Bij Elke PR/Wijziging
1. Bevat het een lesson? → Meld aan specialist
2. Raakt het meerdere domeinen? → Meld aan alle relevante specialisten
3. Specialist documenteert → Kennis groeit voor iedereen

## Escalatie Flow

```
Collega vindt issue
         ↓
Check LESSONS-LEARNED.md van relevante specialist
         ↓
┌─────────────────────────────────────────┐
│ Staat het erin? → Volg de oplossing     │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ Staat het er NIET in? → Meld aan        │
│ specialist met details                   │
└─────────────────────────────────────────┘
         ↓
Specialist lost op + documenteert
         ↓
Kennis groeit voor hele organisatie
```

## Cross-Domain Issues

Sommige issues raken meerdere domeinen:

| Issue Type | Betrokken Specialisten |
|------------|------------------------|
| OAuth/Auth flow | Daan + Joost + Ruben |
| Website performance | Daan + Bram (via Tom) |
| Billing klachten | Jan + Petra |
| Data privacy | Eva + Daan |
| API errors in support | Petra → escalatie naar Joost/Daan |
| Feature prioritering | Sander + Tom + Tim |
| Design naar code | Nienke + Daan |
| Sales → Support handover | Victor + Petra |
| Data pipeline issues | Wouter + Daan + Joost |
| Kennisbank updates | Iris + domein specialist |
| Team performance | Marieke + direct manager |

---

*Dit document is het startpunt. De echte kennis zit in de specialist mappen.*
*Elke collega leest, elke specialist beheert, de organisatie leert.*
