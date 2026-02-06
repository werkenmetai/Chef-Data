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
cat docs/knowledge/mcp/LESSONS-LEARNED.md      # MCP Protocol (Ruben)
cat docs/knowledge/exact/LESSONS-LEARNED.md    # Exact API (Joost)
cat docs/knowledge/backend/LESSONS-LEARNED.md  # Backend/Infra (Daan)
cat docs/knowledge/backend/DATABASE.md         # Database schema

# BUSINESS DOMEINEN
cat docs/knowledge/marketing/LESSONS-LEARNED.md  # Marketing (Tom)
cat docs/knowledge/support/LESSONS-LEARNED.md    # Support (Petra)
cat docs/knowledge/finance/LESSONS-LEARNED.md    # Finance (Jan)
cat docs/knowledge/legal/LESSONS-LEARNED.md      # Legal (Eva)
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
└── legal/                          # Legal (Specialist: Eva)
    ├── LESSONS-LEARNED.md          # Compliance learnings
    └── VERSION.md                  # Legal docs versies
```

## Alle Specialisten

| Domein | Specialist | Kennispool | Rapporteert aan |
|--------|------------|------------|-----------------|
| MCP Protocol | **Ruben** | `mcp/` | Kees (CTO) |
| Exact API | **Joost** | `exact/` | Kees (CTO) |
| Backend/Infra | **Daan** | `backend/` | Kees (CTO) |
| Marketing/Content | **Tom** | `marketing/` | Lisa (CMO) |
| Support/CS | **Petra** | `support/` | Sophie (CCO) |
| Finance/Billing | **Jan** | `finance/` | Frans (CFO) |
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

### Business Vragen

| Vraag/Taak | Lees Eerst | Specialist |
|------------|------------|------------|
| Content/Blog/Social | `marketing/LESSONS-LEARNED.md` | Tom |
| SEO strategie | `marketing/VERSION.md` | Tom |
| Klant probleem | `support/LESSONS-LEARNED.md` | Petra |
| Billing/Subscription | `finance/LESSONS-LEARNED.md` | Jan |
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
| Content/SEO/Social | Tom |
| Tickets/Onboarding | Petra |
| Billing/Metrics | Jan |
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

### Finance Team
```bash
cat docs/knowledge/finance/LESSONS-LEARNED.md
cat docs/knowledge/finance/VERSION.md
cat docs/knowledge/backend/DATABASE.md  # Voor subscription data
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

---

*Dit document is het startpunt. De echte kennis zit in de specialist mappen.*
*Elke collega leest, elke specialist beheert, de organisatie leert.*
