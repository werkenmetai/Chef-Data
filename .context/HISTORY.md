# Project History

Chronologisch overzicht van alle werk sessies.

---

## 2026-01-24 - Sessie 1: Project Kickoff & Specificatie

**Duur**: ~2 uur
**Participants**: Matthijs, Claude

### Wat besproken
1. Initiële idee: MCP server voor Exact Online
2. Use cases uitgewerkt (betalingsherinneringen, validatie, etc.)
3. Bestaande oplossingen gecheckt (CData, Zapier)
4. Besloten om zelf te bouwen

### Wat opgeleverd
- `exact-online-mcp-spec-v2.md` - Complete specificatie
- 40+ MCP tools gedefinieerd
- Exact Online API endpoints gedocumenteerd
- AI-first operations architectuur
- Context management systeem

### Beslissingen genomen
- ADR-001: Cloudflare Workers als runtime
- ADR-002: AI-First Operations Model
- ADR-003: Read-Only eerste versie
- ADR-004: Context Management in Repository

### Open vragen
- Exact Developer account nodig
- Commercieel model uitwerken?

---

## 2026-01-24 - Sessie 2: Repository Setup

**Duur**: ~2 uur
**Participants**: Claude

### Wat besproken
1. Repository structuur opzetten
2. Turborepo/pnpm configuratie
3. Basis project setup

### Wat opgeleverd
- `.context/` folder met alle documentatie:
  - PROJECT.md
  - PIPELINE.md
  - DECISIONS.md
  - HISTORY.md
  - BLOCKERS.md
- Monorepo structuur
- Configuratie bestanden
- MCP server skeleton
- GitHub Actions workflows
- AI agent definities (support + devops)

### Beslissingen genomen
- ADR-005: Turborepo met pnpm

### Blokkades tegengekomen
- Geen Exact Developer account (verwacht, werken met mocks)

---

## 2026-01-24 - Sessie 3: Exact Online API Client

**Duur**: ~1.5 uur
**Participants**: Claude

### Wat besproken
1. Research Exact Online API documentatie
2. Identificatie van ontbrekende features:
   - Rate limiting
   - Multi-region support
   - Proactief token refresh
   - Pagination
   - OData query builder

### Wat opgeleverd

**Nieuwe bestanden in `apps/mcp-server/src/exact/`:**
- `rate-limiter.ts` - Rate limiter (300 req/min, exponential backoff)
- `regions.ts` - Multi-region config (NL, BE, UK, DE, US, ES, FR)
- `token-manager.ts` - Token manager met proactief refresh
- `pagination.ts` - Pagination helper met async iterators
- `odata-query.ts` - Fluent OData query builder
- `client.ts` - Unified ExactClient met alle features
- `auth.ts` - Updated met region support
- `index.ts` - Clean exports

**Nieuwe bestanden in `docs/exact-online-api/`:**
- `README.md` - API overzicht
- `authentication.md` - OAuth 2.0 documentatie
- `endpoints.md` - 300+ API endpoints
- `rate-limits.md` - Rate limit info en best practices
- `odata.md` - OData query opties

**Nieuwe types in `packages/shared/`:**
- `types/api.ts` - API types (regions, tokens, OData)

### Beslissingen genomen
- Multi-region support van begin af aan (NL/BE primary)
- Proactief token refresh (2 min buffer) vanwege 10-min expiry
- OData query builder voor betere developer experience
- Comprehensive API documentatie in repository

### Technische details
- Access tokens vervallen na 10 minuten
- Refresh tokens vervallen na 30 dagen
- Rate limit: 300 requests per minuut
- Pagination: 60 records standaard, 1000 voor bulk endpoints
- 7 regio's ondersteund: NL, BE, UK, DE, US, ES, FR

### Volgende sessie
- OAuth end-to-end testen (zodra credentials beschikbaar)
- Eerste echte MCP tools bouwen
- D1 database voor token storage

---

## 2026-01-25 - Sessie 4: CI/CD Fixes & Production Launch

**Duur**: ~3 uur
**Participants**: Matthijs, Claude

### Wat besproken
1. GitHub Actions CI/CD pipeline fouten
2. TypeScript compilatie errors
3. OAuth flow debugging
4. Dashboard database errors

### Wat opgeleverd

**CI/CD Fixes:**
- `apps/auth-portal/package.json` - Added @astrojs/check dependency
- `apps/mcp-server/vitest.config.ts` - passWithNoTests: true
- `apps/mcp-server/wrangler.toml` - Staging environment toegevoegd
- `apps/auth-portal/wrangler.toml` - Unsupported [build] section verwijderd

**TypeScript Fixes:**
- `apps/auth-portal/src/env.d.ts` - Stripe fields toegevoegd aan Env interface
- Diverse Astro pages - DOM type casts gefixed

**Database Fixes:**
- 4 Stripe kolommen toegevoegd aan users table

**Productie:**
- Auth Portal live op https://praatmetjeboekhouding.nl
- MCP Server live op https://api.praatmetjeboekhouding.nl
- OAuth flow werkt volledig
- Dashboard werkt

### Beslissingen genomen
- ADR-006: Domein en Branding (praatmetjeboekhouding.nl)

### Blokkades opgelost
- BLOCK-001: Exact Developer Account ✅

---

## 2026-01-25 - Sessie 5: Documentatie & UX Verbetering

**Duur**: ~1 uur
**Participants**: Matthijs, Claude

### Wat besproken
1. Alle documentatie bijwerken met nieuwe branding
2. Setup vereenvoudigen voor klanten
3. Dashboard UX verbeteren

### Wat opgeleverd

**Vereenvoudigde Authenticatie:**
- `apps/mcp-server/src/index.ts` - API key in URL path ondersteuning (`/sse/{api_key}`)
- Klanten kunnen nu ONE URL kopiëren in Claude Desktop

**Documentatie Updates:**
- `README.md` - Nieuwe branding "Praat met je Boekhouding"
- `ANALYSE_RAPPORT.md` - Gemarkeerd als historisch document
- `apps/mcp-server/README.md` - 15 live tools gedocumenteerd
- `.context/PROJECT.md` - Status naar "Live in Production"
- `.context/PIPELINE.md` - Alle taken als completed
- `.context/BLOCKERS.md` - OAuth blocker opgelost
- `.context/DECISIONS.md` - Nieuwe ADRs toegevoegd
- `docs/setup.md` - Claude Desktop UI methode

**Dashboard Verbeteringen:**
- `apps/auth-portal/src/pages/dashboard.astro` - Claude URL bovenaan bij nieuwe key
- `apps/auth-portal/src/pages/setup.astro` - Simpele "één URL" methode prominent

### Beslissingen genomen
- ADR-007: Vereenvoudigde MCP Authenticatie (API key in URL)
- ADR-008: Astro voor Auth Portal

---

## Template voor Nieuwe Sessies

```markdown
## YYYY-MM-DD - Sessie X: [Titel]

**Duur**: X uur
**Participants**: Wie

### Wat besproken
1. ...

### Wat opgeleverd
- ...

### Beslissingen genomen
- ...

### Blokkades tegengekomen
- ...

### Volgende sessie
- ...
```
