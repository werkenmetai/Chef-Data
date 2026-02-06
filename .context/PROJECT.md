# Praat met je Boekhouding - Project Context

> **Laatste update**: 2026-01-25 door Claude
> **Huidige fase**: Production - Live and Working
> **Status**: OAuth flow werkt, Dashboard werkt, MCP Server live

**Live URLs:**
- Auth Portal: https://praatmetjeboekhouding.nl
- MCP Server: https://api.praatmetjeboekhouding.nl

## Quick Start voor Claude

Als je dit leest, ben je aan het werk aan Praat met je Boekhouding.
Dit is een live productie-systeem. Lees eerst dit document, dan PIPELINE.md voor de huidige taken.

## Project Overzicht

### Wat bouwen we?
Een MCP (Model Context Protocol) server die finance professionals
toegang geeft tot hun Exact Online data via Claude. AI-first,
self-maintaining, minimaal menselijk onderhoud.

### Voor wie?
- Nederlandse MKB finance managers
- Accountantskantoren
- Primary user: Matthijs Huttinga (Chef Data B.V.)

### Kernwaarden
1. **AI-first operations** - Support en bugfixes door AI agents
2. **Minimal maintenance** - <2 uur/week menselijke interventie
3. **Self-service** - Klanten lossen 90% zelf op
4. **Modular** - Elke tool isolated, makkelijk te fixen

## Belangrijke Links

| Resource | Link |
|----------|------|
| Repository | https://github.com/werkenmetai/Exact-online-MCP |
| Exact API Docs | https://start.exactonline.nl/docs/HlpRestAPIResources.aspx |
| MCP Protocol | https://modelcontextprotocol.io |
| Cloudflare Workers | https://developers.cloudflare.com/workers |

## Stakeholders & Rollen

| Wie | Rol | Contact |
|-----|-----|---------|
| Matthijs Huttinga | Product Owner, Reviewer | - |
| Claude (AI) | Developer, Support Agent, DevOps Agent | - |
| Exact Online | API Provider | Support portal |

## Technische Stack

```yaml
Runtime: Cloudflare Workers (serverless)
Database: Cloudflare D1 (SQLite)
Auth Portal: Cloudflare Pages (Astro)
Package Manager: pnpm
Monorepo: Turborepo
CI/CD: GitHub Actions
AI Agents: Claude API
Language: TypeScript
```

## Repository Structuur

```
exact-online-mcp/
├── .context/           # Project brain - start hier
├── .github/workflows/  # CI/CD
├── apps/
│   ├── mcp-server/     # Cloudflare Worker (main)
│   │   └── src/
│   │       ├── exact/  # Exact Online API client (NEW!)
│   │       ├── mcp/    # MCP protocol handlers
│   │       └── tools/  # MCP tools
│   ├── auth-portal/    # OAuth flow UI (Cloudflare Pages)
│   └── api/            # REST API for dashboard/agents
├── packages/
│   ├── shared/         # Gedeelde types & utils
│   └── ai-agents/      # AI Agent definities
├── docs/
│   └── exact-online-api/  # Complete API documentatie (NEW!)
└── scripts/            # Utility scripts
```

## Recent Geïmplementeerd (2026-01-24)

### Exact Online API Client (`apps/mcp-server/src/exact/`)

Complete API client met de volgende features:

| Feature | Bestand | Beschrijving |
|---------|---------|--------------|
| **Rate Limiter** | `rate-limiter.ts` | 300 req/min tracking, retry logic met exponential backoff |
| **Token Manager** | `token-manager.ts` | Proactief token refresh (2 min voor expiry) |
| **Regions** | `regions.ts` | Multi-region support (NL, BE, UK, DE, US, ES, FR) |
| **Pagination** | `pagination.ts` | Automatische pagination, async iterators |
| **OData Builder** | `odata-query.ts` | Fluent query builder voor filters, sorting, etc. |
| **Unified Client** | `client.ts` | Combineert alle features in één API |

### API Documentatie (`docs/exact-online-api/`)

Uitgebreide documentatie voor de Exact Online API:
- `authentication.md` - OAuth 2.0 flow, token lifetimes
- `endpoints.md` - 300+ API endpoints over 40+ services
- `rate-limits.md` - Limits en best practices
- `odata.md` - Query opties, filtering, pagination

## Huidige Status

Zie [PIPELINE.md](./PIPELINE.md) voor gedetailleerde status.

### Fase Overzicht

| Fase | Status | Notes |
|------|--------|-------|
| 1. Spec & Planning | ✅ Compleet | Specs geschreven |
| 2. Repository Setup | ✅ Compleet | Monorepo structuur |
| 3. Core MCP Server | ✅ Compleet | API client werkt |
| 4. OAuth & Auth | ✅ Compleet | Exact Online OAuth werkt |
| 5. Tools (Basis) | ✅ Compleet | 15 tools live |
| 6. Auth Portal | ✅ Compleet | Dashboard werkt |
| 7. CI/CD | ✅ Compleet | GitHub Actions |
| 8. Monitoring | 🔄 In Progress | Sentry + Grafana |
| 9. AI Agents | Not Started | Support + DevOps |
| 10. Stripe Payments | Voorbereid | Code klaar, niet actief |

## Belangrijke Beslissingen

Zie [DECISIONS.md](./DECISIONS.md) voor volledige historie.

### Recente Beslissingen
- **2026-01-24**: Cloudflare Workers ipv lokaal (serverless, geen infra)
- **2026-01-24**: AI-first operations model (agents voor support/devops)
- **2026-01-24**: Read-only eerste versie (write later)
- **2026-01-24**: Context management in repository (.context/ folder)
- **2026-01-24**: Multi-region support van begin af aan (NL/BE primary)
- **2026-01-24**: Proactief token refresh (2 min buffer) vanwege 10-min expiry

## Bekende Beperkingen & Risico's

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| Geen Exact Developer account | HIGH | Mock/placeholder OAuth |
| Exact API breaking changes | Medium | Monitoring + AI agent fixes |
| OAuth token complexity | Medium | Proactief refresh, auto-retry |
| Rate limiting Exact | Low | RateLimiter class, exponential backoff |

## API Client Usage Example

```typescript
import { ExactClient, query } from './exact';

// Initialiseer client
const client = new ExactClient({
  clientId: env.EXACT_CLIENT_ID,
  clientSecret: env.EXACT_CLIENT_SECRET,
  region: 'NL',
  onTokenRefresh: async (tokens) => {
    // Persist nieuwe tokens
    await db.saveTokens(tokens);
  },
}, env);

// Set division na authenticatie
const user = await client.getCurrentUser();
client.setDivision(user.CurrentDivision);

// Query met OData builder
const customers = await client.query('crm/Accounts',
  query()
    .where('Status', 'C')
    .where('IsCustomer', true)
    .select('ID', 'Code', 'Name', 'Email')
    .orderBy('Name')
    .limit(100)
);

// Fetch all pages automatisch
const allInvoices = await client.getAll('salesinvoice/SalesInvoices', {
  $filter: "Status ne 50",
});
```

## Voor de Volgende Sessie

Als je een nieuwe chat start:

1. Open dit bestand: `.context/PROJECT.md`
2. Lees de "Huidige Status" sectie
3. Open `PIPELINE.md` voor specifieke taken
4. Check `BLOCKERS.md` als er issues zijn
5. Ga verder waar je gebleven was

**Tip voor Matthijs**: Zeg gewoon "Lees .context/PROJECT.md en ga verder"
