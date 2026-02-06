# Roadmap Q2-Q3 2026 - Strategische Planning

**Status:** DRAFT - ter bespreking met Matthijs en team
**Datum:** 2026-01-28
**Laatste update:** 2026-01-30 (P22 voltooid, App Store bijna klaar)

---

## Huidige Status

**Product:** Production Ready (10/10)
- 25 MCP tools voor Exact Online
- Volledige API coverage
- Enterprise-grade security
- Cloudflare edge deployment

**Vraag aan Matthijs:** Waar willen we naartoe? Hieronder opties per categorie.

---

## Categorie 1: Product Uitbreiding

### PROD-001: Accountants Multi-Client Dashboard
**Impact:** HIGH | **Effort:** HIGH | **Revenue:** +++

**Probleem:** Accountants hebben 10-50+ klanten. Nu moet per klant apart inloggen.

**Oplossing:**
- Eén accountant-login met overzicht alle klanten
- Snel switchen tussen administraties
- Cross-client rapportages ("Welke klanten hebben BTW-deadline issues?")

**Business case:** Accountants = power users + referral bron

---

### PROD-002: Scheduled Reports (Email Digest)
**Impact:** MEDIUM | **Effort:** MEDIUM | **Revenue:** ++

**Feature:**
- Wekelijkse/maandelijkse samenvatting per email
- "Je omzet deze week: €X (+Y% vs vorige week)"
- Alerts voor openstaande facturen > 30 dagen

**Technisch:** Cloudflare Cron Triggers + email provider (Resend/Postmark)

---

### PROD-003: WhatsApp / Telegram Bot
**Impact:** HIGH | **Effort:** HIGH | **Revenue:** ++

**Feature:** Stel vragen via WhatsApp aan je boekhouding

**Voordeel:** Laagste drempel, altijd bereikbaar

**Uitdaging:** WhatsApp Business API approval

---

### PROD-004: Write Operations (Fase 2)
**Impact:** HIGH | **Effort:** HIGH | **Revenue:** +++

**Huidige staat:** Read-only (veilig, geen risico)

**Volgende stap:**
- Factuur aanmaken via chat
- Boeking maken
- Offerte versturen

**Risico:** Hoog - fouten in boekhouding. Vereist:
- Dubbele bevestiging
- Audit trail
- Undo functie

**Aanbeveling:** Eerst markt valideren - willen klanten dit echt?

---

## Categorie 2: Markt Uitbreiding

### MARKET-001: Exact App Store Listing ✅ GROTENDEELS KLAAR
**Impact:** HIGH | **Effort:** MEDIUM | **Revenue:** +++

**Status:**
- ✅ Security audit GOEDGEKEURD (29 jan 2026)
- ✅ Toestemmingsverzoek GOEDGEKEURD (29 jan 2026)
- ✅ P22 Single URL + OAuth GEÏMPLEMENTEERD
- ✅ Claude Desktop & ChatGPT beide werkend
- ⬜ Marketingbeoordeling (docs klaar, nog indienen)
- ⬜ Kosten bespreken met partnermanager
- ⬜ Demo video maken

**Volgende stappen:**
- [ ] Contact partnermanager voor kosten
- [ ] Marketingbeoordeling indienen
- [ ] Demo plannen

**Timeline:** 2-3 weken voor publicatie

---

### MARKET-002: Moneybird / Twinfield Integratie
**Impact:** MEDIUM | **Effort:** HIGH | **Revenue:** ++

**Rationale:** Niet iedereen gebruikt Exact Online

**Marktaandeel NL:**
- Exact Online: ~35%
- Moneybird: ~25%
- Twinfield: ~15%
- Overig: ~25%

**Technisch:** Abstractielaag nodig voor multi-provider support

---

### MARKET-003: België / Duitsland Expansie
**Impact:** MEDIUM | **Effort:** MEDIUM | **Revenue:** ++

**Huidige staat:** Code ondersteunt BE/DE regions al

**Nodig:**
- Nederlandse content vertalen
- Lokale BTW-regels valideren
- Marketing in die regio's

---

## Categorie 3: Enterprise Features

### ENT-001: SSO / SAML Integratie
**Impact:** LOW (voor nu) | **Effort:** MEDIUM | **Revenue:** +

**Voor:** Grote accountantskantoren met IT policies

**Wanneer:** Als we 10+ enterprise klanten hebben

---

### ENT-002: Audit Logging Dashboard
**Impact:** MEDIUM | **Effort:** LOW | **Revenue:** +

**Feature:** Wie heeft wat wanneer opgevraagd?

**Compliance:** Belangrijk voor grotere organisaties

---

### ENT-003: Role-Based Access Control
**Impact:** MEDIUM | **Effort:** MEDIUM | **Revenue:** +

**Feature:**
- Admin: alles
- User: alleen lezen
- Viewer: beperkte data

---

## Categorie 4: Quality & Operations

### QA-001: E2E Test Suite
**Impact:** HIGH (intern) | **Effort:** MEDIUM

**Probleem:** Issues vinden in productie i.p.v. testing (zie DB-001)

**Oplossing:**
- Playwright E2E tests
- Mock Exact API
- CI/CD integration

**Quote van Matthijs:** "Ik baal ervan dat we dit soort dingen in gebruik tegenkomen"

---

### QA-002: Staging Environment
**Impact:** HIGH (intern) | **Effort:** LOW

**Huidige staat:** Alleen productie

**Voorstel:**
- staging.praatmetjeboekhouding.nl
- Aparte D1 database
- Test met echte Exact sandbox

---

### OPS-001: Monitoring Dashboard
**Impact:** MEDIUM | **Effort:** LOW

**Feature:**
- Real-time API usage
- Error rates
- Token expiry warnings

**Technisch:** Cloudflare Analytics + custom dashboard

---

## Prioritering Matrix

| ID | Feature | Impact | Effort | Revenue | Prioriteit |
|----|---------|--------|--------|---------|------------|
| MARKET-001 | Exact App Store | HIGH | MEDIUM | +++ | **P1** |
| QA-001 | E2E Tests | HIGH | MEDIUM | - | **P1** |
| QA-002 | Staging Env | HIGH | LOW | - | **P1** |
| PROD-002 | Email Digests | MEDIUM | MEDIUM | ++ | **P2** |
| PROD-001 | Multi-Client | HIGH | HIGH | +++ | **P2** |
| OPS-001 | Monitoring | MEDIUM | LOW | - | **P2** |
| PROD-003 | WhatsApp | HIGH | HIGH | ++ | **P3** |
| MARKET-002 | Moneybird | MEDIUM | HIGH | ++ | **P3** |
| PROD-004 | Write Ops | HIGH | HIGH | +++ | **P3** |

---

## Suggestie voor Q2 2026

**Focus: Stabiliteit + Groei Fundament**

1. **Exact App Store** - grootste groeikans
2. **E2E Tests + Staging** - voorkom productie-issues
3. **Email Digests** - gebruikers engaged houden

**Niet nu:**
- Write operations (te risicovol zonder meer validatie)
- WhatsApp (afleiding van core product)
- Multi-provider (focus op Exact excellence eerst)

---

## Categorie 5: Branding & Design

### BRAND-001: Logo Ontwerp & Implementatie ✅ DONE
**Impact:** HIGH | **Effort:** LOW | **Opgelost:** 2026-01-28

**Implementatie:**
- [x] Logo ontwerp (spraakbubbel + boek icoon)
- [x] Logo.png geupload (1024x1024)
- [x] favicon.svg bijgewerkt met logo icoon
- [x] og-image.svg bijgewerkt met logo
- [x] visual-identity.md geschreven (kleuren, fonts, logo gebruik)
- [ ] Logo in email templates (TODO)
- [ ] Logo voor Exact App Store listing (TODO)

**Locatie:** `/apps/auth-portal/public/` en `/docs/branding/visual-identity.md`

---

## Categorie 6: Operations & Infrastructure

### OPS-002: Email Systeem Activeren
**Impact:** HIGH | **Effort:** LOW | **Status:** CODE KLAAR, CONFIG MIST

**Huidige staat:**
- ✅ Email templates volledig (`/apps/auth-portal/src/lib/email.ts`)
- ✅ Automation logic volledig (`/apps/auth-portal/src/lib/automation.ts`)
- ✅ Cron endpoints (`/api/cron/hourly`, `/api/cron/daily`, `/api/cron/monthly`)
- ❌ RESEND_API_KEY niet geconfigureerd
- ❌ CRON_SECRET niet geconfigureerd
- ❌ ADMIN_EMAILS niet geconfigureerd
- ❌ Cloudflare Cron Triggers niet ingesteld

**Actie nodig:**
1. Resend account aanmaken (gratis, 100 emails/dag)
2. Cloudflare Pages environment variables toevoegen:
   - `RESEND_API_KEY`
   - `CRON_SECRET` (random string voor beveiliging)
   - `ADMIN_EMAILS` (matthijs@chefdata.nl)
3. Cloudflare Cron Triggers configureren:
   - Hourly: `0 * * * *` → `/api/cron/hourly`
   - Daily: `0 8 * * *` → `/api/cron/daily`
   - Monthly: `0 0 1 * *` → `/api/cron/monthly`

---

### OPS-003: Email Logging in Admin Center ✅ DONE
**Impact:** MEDIUM | **Effort:** MEDIUM | **Opgelost:** 2026-01-28

**Implementatie:**
- ✅ `email_log` tabel (migrations/0015)
- ✅ `logEmail()` en `getEmailLogs()` in database.ts
- ✅ `sendEmail()` logt nu alle emails (sent/failed/dev_mode)
- ✅ `/api/admin/emails` endpoint met filters & paginatie
- ✅ `/admin/emails` pagina met stats, filters, tabel
- ✅ Link in admin navigatie

**Resultaat:** Alle klantcommunicatie nu zichtbaar in admin center.

---

## Vragen voor Matthijs

1. **Prioriteit:** App Store of accountants-features eerst?
2. **Resources:** Hoeveel dev capacity hebben we Q2?
3. **Validatie:** Hebben klanten om write operations gevraagd?
4. **Partner:** Interesse van accountantskantoren voor pilot?
5. **Internationaal:** Is BE/DE expansie interessant nu?
6. **Email:** Resend account aanmaken + config in Cloudflare?

---

*Opgesteld door: Piet (CEO Agent) | Review door: Matthijs*
