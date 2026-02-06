# Technical Roadmap - Losse Eindjes

> Automatisch gegenereerd door Code Auditor Agent
> Datum: 2026-01-29 (update)
> Bestanden gescand: 157 (80 TypeScript, 48 Astro, 29 overig)

## Samenvatting

| Categorie | Aantal Items | Prioriteit |
|-----------|--------------|------------|
| Security | 1 (2 fixed) | 🟡 Medium |
| TODOs/FIXMEs | 16 | 🟠 Hoog |
| Missing Features | 12 | 🟠 Hoog |
| Code Quality | 6 (2 fixed) | 🟡 Medium |
| Testing | 1 | 🔴 Hoog |
| Documentation | 3 | 🟢 Laag |

**Totaal: 39 open items** (2 security + 2 code quality fixed)

---

## 🔴 Kritiek - Security & Testing

### SEC-001: XSS Risico via innerHTML - ✅ FIXED (2026-01-27)
- **Bestanden**: (FIXED)
  - `apps/auth-portal/src/pages/dashboard.astro` - DOM API/textContent
  - `apps/auth-portal/src/pages/support/index.astro` - DOM API/textContent
  - `apps/auth-portal/src/pages/support/new.astro` - DOM API/textContent
  - `apps/auth-portal/src/pages/support/conversations/[id].astro` - DOM API/textContent
  - `apps/auth-portal/src/pages/support/articles/[slug].astro` - DOM API/textContent
  - `apps/auth-portal/src/pages/admin/feedback/index.astro` - DOM API/textContent
- **Oplossing**: 17 innerHTML instances vervangen door veilige DOM API constructie en textContent
- **Nieuwe utility**: `apps/auth-portal/src/lib/security.ts` met `escapeHtml()` helper

### SEC-002: CORS Wildcard - ✅ FIXED (2026-01-27)
- **Bestanden**: (FIXED)
  - `apps/mcp-server/src/index.ts` - uses getCorsHeaders()
  - `apps/mcp-server/src/routes/health.ts` - uses getHealthCorsHeaders()
  - `apps/mcp-server/src/auth/oauth.ts` - uses getOAuthCorsHeaders()
- **Oplossing**: Wildcard (*) vervangen door origin whitelist
- **Nieuwe utility**: `apps/mcp-server/src/lib/cors.ts` met origin validation
- **Whitelist**: praatmetjeboekhouding.nl, localhost:* (dev), *.pages.dev (staging)

### SEC-003: Placeholder Stripe Credentials
- **Bestand**: `apps/auth-portal/src/lib/stripe.ts:15,21`
- **Probleem**: `price_XXXXXXXXXXXXXXXX` en `prod_XXXXXXXXXXXXXXXX` zijn placeholder values
- **Actie**: Vervang met echte Stripe IDs bij activatie
- **Effort**: S

### TEST-001: Geen Tests Aanwezig
- **Probleem**: Geen `.test.ts` of `.spec.ts` bestanden gevonden in hele codebase
- **Impact**: Geen geautomatiseerde verificatie van functionaliteit
- **Actie**: Begin met unit tests voor kritieke modules:
  - `apps/mcp-server/src/auth/api-key.ts` (authenticatie)
  - `apps/mcp-server/src/exact/client.ts` (API calls)
  - `apps/auth-portal/src/lib/database.ts` (data layer)
- **Effort**: L

---

## 🟠 Hoog - Incomplete Features (DevOps Agent)

### FEAT-001: DevOps Agent Tools Niet Geïmplementeerd
- **Bestand**: `packages/ai-agents/src/devops-agent/tools.ts`
- **Status**: 12 tools gedefinieerd maar geen echte implementatie
- **Ontbrekend**:
  - `get_sentry_issue` (line 32): Sentry API integratie
  - `read_file` (line 49): GitHub API file reading
  - `search_code` (line 71): GitHub code search
  - `create_branch` (line 93): GitHub branch creation
  - `update_file` (line 125): GitHub file update
  - `run_tests` (line 148): GitHub Actions test runner
  - `create_pull_request` (line 180): GitHub PR creation
  - `add_known_issue` (line 213): Database update
  - `deploy_to_staging` (line 231): GitHub Actions deploy
  - `notify_support` (line 258): Notification system
- **Actie**: Implementeer met GitHub API en Sentry SDK
- **Effort**: L

### FEAT-002: Support AI Similarity Search
- **Bestand**: `apps/auth-portal/src/lib/support-ai.ts:133`
- **Probleem**: `similarConversations: []` - altijd lege array
- **Actie**: Implementeer met embeddings of keyword matching
- **Effort**: M

### FEAT-003: User Preference Language
- **Bestanden**:
  - `apps/auth-portal/src/pages/api/support/conversations/index.ts:138`
  - `apps/auth-portal/src/pages/api/support/conversations/index.ts:181`
- **Probleem**: Hardcoded `'nl'` in plaats van user preferences
- **Actie**: Haal taal uit user profiel of browser
- **Effort**: S

---

## 🟡 Medium - Technical Debt

### DEBT-001: Excessief `any` Type Gebruik - ✅ FIXED (2026-01-29)
- **Bestanden**: `apps/mcp-server/src/tools/`
  - `reporting.ts`: ~~22x~~ 0x `any` - gebruikt nu `ExactODataResponse<AgingByAgeGroupItem>`
  - `invoices.ts`: ~~10x~~ 0x `any` - gebruikt proper types
  - `financial.ts`: ~~6x~~ 0x `any` - gebruikt proper types
  - `relations.ts`: ~~2x~~ 0x `any` - gebruikt proper types
- **Oplossing**: Alle tools gebruiken nu generieke `ExactODataResponse<T>` en specifieke types uit `@exact-mcp/shared`
- **Effort**: M

### DEBT-002: Console.log/error in Production Code - ✅ GROTENDEELS FIXED (2026-01-29)
- **Vorige staat**: 52 instanties in mcp-server
- **Huidige staat**: 15 instanties (alleen in logger, sentry, health comments, error-reporter)
- **Opgeloste bestanden**:
  - `_base.ts`: 15x → 0x (alle naar structured logger)
  - `combo.ts`: 7x → 0x (alle naar structured logger)
  - `contracts.ts`: 2x → 0x (alle naar structured logger)
  - `invoices.ts`: 2x → 0x (alle naar structured logger)
  - `financial.ts`: 3x → 0x (alle naar structured logger)
  - `mcp/tools.ts`: 2x → 0x (alle naar structured logger)
  - `mcp/server.ts`: 1x → 0x (naar structured logger)
  - `auth/oauth.ts`: 3x → 0x (alle naar structured logger)
  - `exact/rate-limiter.ts`: 2x → 0x (alle naar structured logger)
- **Resterende** (legitiem): logger.ts (3x), sentry.ts (5x), health.ts (3x docs), error-reporter.ts (4x)
- **Effort**: M

### DEBT-003: Placeholder Metrics Value
- **Bestand**: `apps/mcp-server/src/monitoring/metrics.ts:491`
- **Probleem**: `success_rate: 0.95` is hardcoded placeholder
- **Actie**: Implementeer daadwerkelijke success rate tracking
- **Effort**: S

### DEBT-004: Localhost Fallbacks
- **Bestanden**:
  - `apps/auth-portal/src/pages/api/webhooks/mcp-error.ts:272`
  - `apps/auth-portal/src/pages/api/support/conversations/index.ts:16`
  - `apps/auth-portal/src/pages/api/support/conversations/[id]/messages.ts:202`
- **Probleem**: `env.SITE_URL || 'http://localhost:4321'` kan in production mislukken
- **Actie**: Vereis SITE_URL environment variable
- **Effort**: S

---

## 🟢 Laag - Code Quality

### QUAL-001: eslint-disable Comment
- **Bestand**: `apps/mcp-server/src/monitoring/sentry.ts:71`
- **Probleem**: `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
- **Actie**: Fix underlying type issue of documenteer waarom nodig
- **Effort**: S

### QUAL-002: Void Expressions voor Unused Variables
- **Bestand**: `packages/ai-agents/src/devops-agent/tools.ts`
- **Probleem**: `void _content; void _message;` patroon voor placeholder implementaties
- **Actie**: Verwijder wanneer echte implementatie klaar is
- **Effort**: S

---

## 📝 Documentatie

### DOC-001: Email Feature Nog Niet Geïmplementeerd
- **Bestand**: `docs/customer-communication/ai-provider-privacy-guide.md:24`
- **Status**: `⏳ TODO` - Email versturen nog niet geïmplementeerd
- **Actie**: Implementeer of update documentatie

### DOC-002: Compliance TODO Items
- **Bestand**: `docs/compliance/ACTION-ITEMS.md`
- **Items**:
  - Exact Online toestemming (line 145)
  - Juristenreview ToS + DPA (line 151)
  - LIA documentatie (line 158)
  - DPIA (line 159)
  - ISO 27001 (line 160)
- **Actie**: Plan juridische review

### DOC-003: Environment Variables Missing in .env.example
- **Bestanden**: `.env.example`, `apps/auth-portal/.env.example`
- **Ontbrekend**: `SITE_URL`, `ADMIN_EMAILS`, `RESEND_API_KEY`, `CRON_SECRET`
- **Actie**: Voeg ontbrekende vars toe met beschrijving

---

## 🧪 Testing

### TEST-001: Volledige Test Coverage Ontbreekt
- **Modules zonder tests** (kritiek):
  | Module | Locatie | Prioriteit |
  |--------|---------|------------|
  | API Key Auth | `apps/mcp-server/src/auth/api-key.ts` | Hoog |
  | Exact Client | `apps/mcp-server/src/exact/client.ts` | Hoog |
  | Database | `apps/auth-portal/src/lib/database.ts` | Hoog |
  | Token Manager | `apps/mcp-server/src/exact/token-manager.ts` | Hoog |
  | Support AI | `apps/auth-portal/src/lib/support-ai.ts` | Medium |
  | Rate Limiter | `apps/mcp-server/src/exact/rate-limiter.ts` | Medium |
- **Test type**: Unit + Integration
- **Framework**: Vitest (al geconfigureerd in `apps/mcp-server/vitest.config.ts`)

---

## Per Component Overzicht

### `/apps/mcp-server`
| ID | Type | Titel | Effort |
|----|------|-------|--------|
| SEC-002 | Security | CORS Wildcard | S |
| DEBT-001 | Debt | Any types in tools | M |
| DEBT-002 | Debt | Console.log usage | M |
| DEBT-003 | Debt | Placeholder metrics | S |
| TEST-001 | Testing | No unit tests | L |

### `/apps/auth-portal`
| ID | Type | Titel | Effort |
|----|------|-------|--------|
| SEC-001 | Security | XSS via innerHTML | M |
| SEC-003 | Security | Stripe placeholders | S |
| FEAT-002 | Feature | Similarity search | M |
| FEAT-003 | Feature | User language pref | S |
| DEBT-004 | Debt | Localhost fallbacks | S |
| DOC-003 | Docs | .env.example incomplete | S |

### `/packages/ai-agents`
| ID | Type | Titel | Effort |
|----|------|-------|--------|
| FEAT-001 | Feature | DevOps agent incomplete | L |
| DEBT-002 | Debt | Console.log usage | S |
| QUAL-002 | Quality | Void placeholder vars | S |

---

## Aanbevolen Volgorde

### Sprint 1 - Security & Foundation
1. **SEC-001**: Fix XSS risico's (innerHTML → textContent/sanitize)
2. **SEC-002**: CORS restrictie implementeren
3. **TEST-001**: Begin met auth + database tests

### Sprint 2 - Core Quality
1. **DEBT-001**: Type safety voor Exact API responses
2. **DEBT-002**: Structured logging overal
3. **FEAT-003**: User language preferences

### Sprint 3 - Features
1. **FEAT-002**: Similarity search voor support
2. **FEAT-001**: DevOps agent tools (incrementeel)

### Sprint 4 - Polish
1. **DOC-002**: Compliance items afronden
2. **DOC-003**: Environment docs updaten
3. **Remaining quality items**

---

## Notities

### Architectuur Observaties
- **Goed**: Duidelijke scheiding tussen auth-portal en mcp-server
- **Goed**: Security best practices (PBKDF2 hashing, token encryption)
- **Goed**: Rate limiting geïmplementeerd
- **Aandacht**: Veel `any` types suggereren dat Exact API types beter gedocumenteerd moeten worden
- **Aandacht**: AI agents (support/devops) zijn deels placeholders

### Aanbevelingen
1. **Prioriteer tests** - Zonder tests is refactoring risicovol
2. **Type safety** - Investeer in Exact Online API types om bugs te voorkomen
3. **Structured logging** - Console.log is niet queryable in production
4. **Security audit** - Overweeg externe security review voor XSS/CORS issues
