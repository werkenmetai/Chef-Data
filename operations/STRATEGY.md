# Strategisch Plan - Praat met je Boekhouding

> Versie: Week 7, 2026
> Status: Content Machine Actief + App Store Wachten

## Situatie

| Metric | Waarde |
|--------|--------|
| App Store Status | ✅ ALLE FORMULIEREN INGEDIEND - Wacht op reactie |
| Live Test Coverage | 78% (36/46 tools) |
| Failure Rate | 0% (was 57%) |
| Klanten | 0 (pre-launch) |
| MRR | €0 |
| Budget | €0 |
| Team | 1 persoon + AI agents |

## Visie

**Een AI-first SaaS bouwen die zichzelf grotendeels bouwt, onderhoudt en vermarkt.**

Git is het command center. Alles wat geautomatiseerd kan worden, wordt geautomatiseerd. Elke handmatige actie wordt eerst geëvalueerd: kan een agent dit?

### AI Agent Ketens (Update 4 feb 2026)

Onze MCP server is een building block in een groter ecosysteem. Via ChatGPT en Claude kunnen gebruikers **meerdere MCP tools combineren** tot complete workflows:

| Keten | Voorbeeld |
|-------|-----------|
| Email + Boekhouding | "Mail alle klanten met facturen >30 dagen" |
| To-do + Boekhouding | "Maak taken aan voor vervallende facturen" |
| Calendar + Boekhouding | "Plan herinneringen voor betalingsdeadlines" |
| Spreadsheet + Boekhouding | "Export BTW-overzicht naar Google Sheets" |

**Strategische implicatie:** Wij zijn niet alleen een "read-only boekhouding tool", maar een **schakel in geautomatiseerde bedrijfsprocessen**. Dit vergroot de stickiness enorm.

### Platform Roadmap

| Platform | Status | Datum |
|----------|--------|-------|
| Claude Desktop (Mac/Windows) | ✅ Werkend | Jan 2026 |
| Claude Code | ✅ Werkend | Jan 2026 |
| ChatGPT (Plus/Team) | ✅ Werkend | Jan 2026 |
| Claude Connector Directory | ⏳ Ingediend | 1 feb 2026 |
| Claude Cowork (Mac) | 🔜 Compatibel | - |
| Claude Cowork (Windows) | 🔜 Binnenkort | - |

## Strategische Principes

1. **Zero-budget growth** - Alleen gratis/freemium tools, AI doet het werk
2. **Git-centrisch** - Alle planning, beslissingen en acties traceerbaar in repo
3. **Agent-first** - Vraag eerst: "Kan een agent dit doen?"
4. **Minimal viable effort** - Alleen doen wat de volgende stap mogelijk maakt
5. **Compounding content** - Content die blijft werken (SEO, docs, automation)
6. **Platform-agnostisch** - Werk op alle AI platforms (Claude, ChatGPT, Gemini)
7. **Build for Handover** - Bouw alsof je morgen wegvalt. Elke week: "Kan iemand anders dit overnemen met alleen wat in git staat?"

---

## Q1 2026 - Foundation Phase

### Piketpaal 1: Exact Online Goedkeuring ✅ BEHAALD
**Deadline**: Week 6
**Status**: ✅ COMPLETE

#### Behaald (29 jan 2026)
- [x] Security review goedgekeurd
- [x] Toestemmingsverzoek goedgekeurd
- [x] App "Praat met je Boekhouding" in App Store portal

#### Exact App Store Status (1 feb 2026)
| Stap | Status | Datum |
|------|--------|-------|
| Security review | ✅ | 29 jan |
| Toestemmingsverzoek | ✅ | 29 jan |
| Marketingbeoordeling | ✅ INGEDIEND | 1 feb |
| Contact partnermanager (kosten) | ✅ €0 - GEEN KOSTEN | 3 feb |
| Factureringsgegevens | ✅ Kan ingevuld (€0) | 3 feb |
| Demonstratie | ⏳ Wacht op afspraak | - |

**Status:** Wachten op reactie van Exact App Store team

---

### Piketpaal 2: Product Klaar voor Demo ✅ BEHAALD
**Status**: ✅ COMPLETE (31 jan 2026)

#### Behaald
- [x] MCP server draait stabiel (0% failure rate)
- [x] Auth flow werkt end-to-end (OAuth + MCP)
- [x] **36 tools** werkend (was target: 5)
- [x] Landing page live
- [x] Demo Mode voor screenshots (Bakkerij De Gouden Croissant)
- [x] ChatGPT + Claude Desktop beide werkend

#### QA Resultaten (31 jan)
| Metric | Resultaat |
|--------|-----------|
| Tools getest | 46 |
| PASS | 36 (78%) |
| FAIL | 0 (0%) |
| Module N/A | 10 (22%) |

---

### Piketpaal 3: Content Machine Draait ✅ GESTART
**Deadline**: Week 10
**Eigenaar**: Tom (Content Lead) + Team

#### Waarom
SEO content begint pas te ranken na 3-6 maanden. Hoe eerder we starten, hoe eerder resultaat.

#### Status (Week 6)
- [x] Content strategie gedefinieerd: "Workflow Recipes"
- [x] Team rollen vastgelegd: Tom, Lisa, Anna, Bram
- [x] 30 recipe topics gepland (6 categorieën)
- [x] Eerste blog live: Automatische Factuurherinneringen
- [ ] 2-3 blogs per week consistente output

#### Strategische Shift
```
VAN: "Praat met je boekhouding" (query tool)
NAAR: "Automatiseer je boekhouding" (workflow hub)
```

#### Content Plan
Zie: `docs/marketing/WORKFLOW-RECIPES-CONTENT-PLAN.md`

---

## Weekstructuur

### Maandag: Planning
- Review vorige week in Git
- Update STRATEGY.md met voortgang
- Bepaal focus voor de week

### Dinsdag-Donderdag: Executie
- CEO: Externe contacten, beslissingen
- Agents: Code, content, audits

### Vrijdag: Review & Commit
- Alle werk committen
- CHANGELOG updaten
- Volgende week voorbereiden

---

## Agent Deployment Plan

### Nu Inzetbaar
| Agent | Taak | Frequentie |
|-------|------|------------|
| Code Auditor | ROADMAP.md updaten | Wekelijks |
| Content Writer | Blog posts | 1x per week |
| Security Expert | Vulnerabilities fixen | Bij findings |
| CEO Planner | Strategy reviews | Wekelijks |

### Te Bouwen
| Agent | Doel | Prioriteit |
|-------|------|------------|
| Support Agent | Klantvragen automatisch | Na eerste klanten |
| DevOps Agent | Bug fixes automatisch | Na Sentry setup |
| Outreach Agent | LinkedIn/email automation | Na product-market fit |

---

## Beslissingen Log

### 2026-W05: Bootstrap Strategie
**Besluit**: AI-first, zero-budget aanpak
**Rationale**: Geen funding, wel toegang tot krachtige AI. Gebruik dit als competitive advantage.
**Gevolgen**: Alles via Git, agents doen bulk van het werk.

---

## Gebouwd in Week 5 (31 jan 2026)

### Customer Communication Platform ✅
| Component | Status | Beschrijving |
|-----------|--------|--------------|
| **Admin Communications Widget** | ✅ | Recente communicatie over alle klanten op admin dashboard |
| **Customer "Mijn Berichten"** | ✅ | Klanten zien hun berichten + kunnen reageren |
| **Message API** | ✅ | `/api/messages/send` voor klant → support berichten |
| **Berichten Pagina** | ✅ | `/berichten` - Volledige historie met paginering |
| **Google-style App Launcher** | ✅ | Quick access dropdown in admin header |

### Billing & Outreach Platform ✅
| Component | Status | Beschrijving |
|-----------|--------|--------------|
| **Exact Billing Integration** | ✅ | `exact-billing.ts` met upgrade/downgrade logic |
| **Proactive Outreach Engine** | ✅ | Campaign management, triggers, cooldowns |
| **AI Customer Ops** | ✅ | Response templates, feature flags |
| **Customer Timeline** | ✅ | `/admin/customer/[id]` - Unified view per klant |

### Commits (31 jan)
```
f1735c9 feat(admin): add Google-style app launcher in header
e9498de feat(dashboard): add customer communications with reply functionality
e7ee689 feat(admin): add unified communications widget to dashboard
af45bd4 feat: add Exact Online billing integration with upgrade/downgrade logic
bfc3d19 feat: implement proactive outreach engine with campaign management
56d58e1 feat: add AI Customer Ops with response templates and feature flags
```

---

## Week 6 Resultaten (3-7 feb) ✅ AFGEROND

### Business
- [x] Marketingbeoordeling ingediend (1 feb) ✅
- [x] Contact partnermanager (1 feb) ✅ €0 kosten bevestigd
- [x] Demo script finaliseerd ✅ (PR #205)
- [x] Security audit GROEN ✅ (alle P2 issues gefixed)
- [x] Legal audit GROEN ✅ (Privacy Policy, ToS, Verwerkersovereenkomst v1.1)

### Content Machine 🆕
- [x] Workflow Recipes Content Plan compleet ✅ (PR #214)
- [x] Eerste blog live: Factuurherinneringen ✅ (PR #213)
- [x] 30 recipe topics gedefinieerd (6 categorieën)
- [x] Team rollen: Tom, Lisa, Anna, Bram
- [x] BTW disclaimer richtlijnen toegevoegd

### Tech
- [x] P23 Document download ✅ (tool #47)
- [x] Admin inbox + signature settings ✅
- [x] 11 PRs gemerged op dinsdag 4 feb

---

## Volgende Week (W07) - CONTENT & DEMO WEEK

### Must Do
- [ ] Tweede blog: BTW voorbereiding naar Sheets
- [ ] ChatGPT Apps account verificatie
- [ ] Demo dry-run voor Exact App Store
- [ ] Partnermanager demonstratie afspraak

### Should Do
- [ ] Derde blog publiceren
- [ ] ChatGPT Apps submission
- [ ] Cloudflare rate limiting configureren

### Could Do
- [ ] Gemini integratie research
- [ ] Demo video opnemen

---

## Gebouwd op 31 jan 2026 (middag sessie)

### Exact Billing Webhook ✅
| Component | Status | Beschrijving |
|-----------|--------|--------------|
| **Webhook Endpoint** | ✅ | `/api/exact/webhook.ts` - lifecycle events |
| **Signature Verification** | ✅ | HMAC SHA-256 via `EXACT_WEBHOOK_SECRET` |
| **Event Handling** | ✅ | 8 event types (create, upgrade, downgrade, cancel, etc.) |
| **Duplicate Prevention** | ✅ | Event ID tracking in `billing_events` |

### Admin UX Verbeteringen ✅
| Component | Status | Beschrijving |
|-----------|--------|--------------|
| **App Launcher (all pages)** | ✅ | 22 admin pagina's bijgewerkt |
| **Pricing Upgrade Flow** | ✅ | Modal fallback + App Store redirect |
| **CI TypeScript Fixes** | ✅ | 9 errors gefixed met type assertions |

### Configuratie Nodig (na App Store publicatie)
```bash
# Cloudflare Dashboard → Settings → Environment Variables
EXACT_WEBHOOK_SECRET=<van Exact App Store>

# In code: apps/auth-portal/src/lib/constants.ts
EXACT_APP_STORE_URL = 'https://apps.exactonline.nl/nl/app/praat-met-je-boekhouding'
EXACT_APP_STORE_ENABLED = true  # Zet op true wanneer live
```

---

## Metrics om te Tracken

| Metric | Hoe Meten | Target W8 |
|--------|-----------|-----------|
| Exact Status | Manual | Partner contact |
| Blog Posts | Git commits | 3 |
| Security Issues | ROADMAP.md | 0 kritiek |
| Landing Page | Live check | Online |

---

## Resources

- `/operations/agents/` - Agent prompts
- `/docs/branding/` - Tone of voice & schrijfrichtlijnen
- `/ROADMAP.md` - Technische backlog
- `/docs/marketing/` - Content strategie
- `/docs/strategy/PRICING-STRATEGY.md` - Prijsstrategie & roadmap
- `/docs/strategy/FEEDBACK-LOOP-STRATEGY.md` - Feedback loop & quote verzameling
- `/docs/strategy/AI-CUSTOMER-OPS.md` - AI-First Customer Operations

---

---

## Gebouwd op 1 feb 2026

### Division Limits Feature ✅
| Component | Status | Beschrijving |
|-----------|--------|--------------|
| **Migration 0021** | ✅ | `is_active` op divisions, `division_switch_at` op users |
| **Database Methods** | ✅ | 5 nieuwe methods in database.ts (getActiveDivisionsCount, toggleDivisionActive, etc.) |
| **Toggle API** | ✅ | `/api/divisions/toggle` - GET en POST endpoints |
| **Dashboard UI** | ✅ | Toggle switches per divisie, limiet indicators, cooldown timer |
| **Plan Enforcement** | ✅ | Free: 2, Starter: 3, Pro: 10, Enterprise: unlimited |

### UI/UX Verbeteringen ✅
| Component | Status | Beschrijving |
|-----------|--------|--------------|
| **Navigatie Vereenvoudigd** | ✅ | 5 → 3 items (Docs, Pricing, Hulp) |
| **Berichten Icoontje** | ✅ | Alleen voor ingelogde users |
| **Admin Link** | ✅ | Alleen voor admins |
| **Login/Dashboard** | ✅ | Conditionele button tekst |
| **Blog/Setup** | ✅ | Verplaatst naar footer |

### Marketing & Compliance ✅
| Component | Status | Beschrijving |
|-----------|--------|--------------|
| **Email Adressen** | ✅ | @chefdata.nl → @praatmetjeboekhouding.nl (15+ bestanden) |
| **App Store Content** | ✅ | Marketingbeoordeling ingediend |
| **Admin Starter Plan** | ✅ | Ontbrekende optie toegevoegd |

### Commits (1 feb)
```
38a61a0 feat: add division toggle UI to dashboard
fe8a9a8 feat: simplify navigation + add division limits feature
8acc757 docs: update emails + mark marketing as submitted
04900cc feat: Exact App Store prep + navigation improvements (#127)
```

---

## Gebouwd op 2 feb 2026

### Customer Communication Platform - Bug Fixes ✅
| Component | Status | Beschrijving |
|-----------|--------|--------------|
| **Message Direction** | ✅ | Admin replies tonen nu correct als "Van ons" bij klant |
| **Dashboard Layout** | ✅ | "Mijn Berichten" boven "Exact Online Connecties" |
| **Admin Customer Profile** | ✅ | Laad fout gefixed (verkeerde tabelnaam) |

### UI/UX Verbeteringen ✅
| Component | Status | Beschrijving |
|-----------|--------|--------------|
| **Pricing Page** | ✅ | Dynamische "Upgrade/Downgrade" tekst op knoppen |
| **Message Labels** | ✅ | Categorie tags (Bug, Feature, Vraag, Feedback) |
| **Message Detail Modal** | ✅ | Klik op bericht → volledig bericht in modal |
| **Reply Flow** | ✅ | Reageren vanuit modal met prefilled subject |

### Commits (2 feb)
```
c5d929e Merge pull request #154 - pricing buttons and message UI
e14cb96 feat: improve pricing buttons and message UI
eaf1bbd Merge pull request #153 - fix messages and dashboard
1e7a002 fix: message direction and dashboard layout improvements
```

### Smart Division Management ✅ (sessie 2)
| Component | Status | Beschrijving |
|-----------|--------|--------------|
| **MCP Filter op is_active** | ✅ | Alleen actieve divisies naar AI gestuurd |
| **Smart Division Resolution** | ✅ | AI kiest automatisch of vraagt bij meerdere opties |
| **Auto-Default Rotation** | ✅ | Nieuwe default gekozen bij deactiveren |
| **"Alles activeren" Button** | ✅ | Bulk activate alle divisies (binnen plan limiet) |
| **DivisionInfo.isActive** | ✅ | Interface + demo contexts bijgewerkt |

**Nieuwe UX Flow:**
- Gebruiker kan meerdere divisies actief hebben (= allemaal "defaults")
- AI krijgt alleen actieve divisies en kiest slim
- Plan limiet wordt gerespecteerd bij bulk activate

### Email Communication System ✅ (sessie 3 - PDCA)
| Component | Status | Beschrijving |
|-----------|--------|--------------|
| **Admin krijgt email bij klantbericht** | ✅ | `sendAdminAlert()` in `/api/messages/send.ts` |
| **Admin reply → support_messages** | ✅ | Antwoord zichtbaar in "Mijn Gesprekken" |
| **Configureerbare signature** | ✅ | `signature` parameter in `/api/admin/reply.ts` |
| **Email voorkeur klant** | ✅ | `email_support_replies` toggle in dashboard |
| **Email preferences API** | ✅ | `/api/preferences/email` GET/POST |
| **Migration 0025** | ✅ | `email_support_replies` kolom toegevoegd |

**Email Flow Compleet:**
1. Klant stuurt bericht → Admin krijgt email alert
2. Admin reageert → Bericht in support_messages + email naar klant (indien enabled)
3. Klant kan email notificaties aan/uit zetten in dashboard

---

---

## Gebouwd op 4 feb 2026

### Content Machine Launch ✅
| Component | Status | Beschrijving |
|-----------|--------|--------------|
| **Workflow Recipes Plan** | ✅ | Comprehensive content productie plan |
| **30 Recipe Topics** | ✅ | 6 categorieën (Email, Sheets, To-Do, Calendar, Slack, Multi-Tool) |
| **Team Rollen** | ✅ | Tom (Lead), Lisa (Writer), Anna (Visual), Bram (SEO) |
| **BTW Disclaimers** | ✅ | Richtlijnen voor financiële content |
| **Eerste Blog** | ✅ | Factuurherinneringen met Gmail + Exact Online |

### Positionering Shift
```
VAN: "Praat met je boekhouding" (query tool)
NAAR: "Automatiseer je boekhouding" (workflow hub)
```

### Commits (4 feb)
```
3557cee Merge pull request #214 - workflow recipes content plan
618a662 docs: add workflow recipe blog - automatic invoice reminders (#213)
```

---

---

## Week 6 Extra Resultaten (5-6 feb) - Toegevoegd

### Content Kwaliteit (ISSUE-004)
- [x] Alle product blogs herschreven voor menselijke leesbaarheid ✅
- [x] 17 MCP tools blog herschreven ✅
- [x] ChatGPT koppeling blog herschreven ✅
- [x] 6 tutorial blogs herschreven ✅
- [x] Blog headers visueel verbeterd ✅
- [x] Blog schrijfrichtlijnen gedocumenteerd (LESSON-001) ✅
- [x] Blog spacing CSS fix ✅

### SEO & Security
- [x] OG image toegevoegd ✅
- [x] SEO meta tags opgeschoond ✅
- [x] Publieke /tools endpoint verwijderd (security) ✅
- [x] MCP instructies beveiligd ✅

### GitHub Hygiene
- [x] 47 stale branches verwijderd ✅
- [x] Alleen main branch over ✅
- [x] Working tree clean ✅

---

## Week 7 Planning (10-14 feb) - VOORBEREID

### Content Machine (vooruit gewerkt)
- [x] Blog: BTW overzicht exporteren naar Sheets ✅ (geschreven)
- [x] Blog: Betalingsbevestigingen automatiseren ✅ (geschreven)
- [x] Blog: Betaaldeadlines in Google Calendar ✅ (geschreven)
- [ ] Social posts schedulen
- [ ] LinkedIn groepen posten

### Business
- [ ] Demo dry-run
- [ ] Partnermanager response opvolgen
- [ ] Demo afspraak plannen

### Tech
- [ ] ChatGPT Apps submission (Matthijs: account verificatie)
- [ ] Cloudflare rate limiting configureren (Matthijs: dashboard)

---

*Laatst bijgewerkt: 2026-02-06 door Piet (W06 afsluiting + W07 voorbereiding)*
