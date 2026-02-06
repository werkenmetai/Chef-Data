# MCP Knowledge Base Version

**Beheerder:** Ruben (MCP Specialist)

---

## Huidige Versies

| Component | Versie | Datum | Opmerkingen |
|-----------|--------|-------|-------------|
| MCP Server | `0.2.0` | 2026-02-02 | 47 tools, OAuth 2.1 + PKCE, dual transport |
| MCP Protocol Spec | `2025-11-25` | 2026-01-28 | Volgende release gepland juni 2026 |
| TypeScript SDK | `v1.25.2` | 2026-01-28 | Security fix (CVE-2026-0621); v2 verwacht Q1 2026 |
| Authorization Spec | `draft` | 2026-01-28 | DPoP = SHOULD (niet MUST); SEPs in review |
| Claude Code | `v2.1.0+` | 2026-01-28 | Major release 8 jan 2026; updates t/m 17 jan |
| MCP Apps Extension | `SEP-1865` | 2026-01-28 | Eerste officieel MCP extension; productie-klaar |
| MCP Governance | `AAIF / Linux Foundation` | 2025-12-09 | Gedoneerd door Anthropic |

## Server Capabilities

### Transport Support
| Transport | Endpoint | Beschrijving |
|-----------|----------|--------------|
| Streamable HTTP | `/mcp`, `/mcp/{api_key}` | Claude Desktop/Code (recommended) |
| Server-Sent Events (SSE) | `/sse`, `/sse/{api_key}` | ChatGPT, streaming support |
| Demo Mode | `/demo/{demo_key}` | No OAuth, for demonstrations |

### Authentication
| Methode | Beschrijving |
|---------|--------------|
| OAuth 2.1 + PKCE | RFC 9728 Protected Resource Metadata |
| API Keys | `exa_*` prefix, in URL path of Authorization header |
| Demo Keys | `exa_demo*` - skip OAuth, return fake data |

### Tool Count: 47

| Categorie | Tools | Beschrijving |
|-----------|-------|--------------|
| Division Management | 1 | `list_divisions` |
| Relations (CRM) | 2 | `get_relations`, `search_relations` |
| Invoices | 3 | `get_sales_invoices`, `get_purchase_invoices`, `get_outstanding_invoices` |
| Financial | 4 | `get_bank_transactions`, `get_gl_accounts`, `get_trial_balance`, `get_cashflow_forecast` |
| Reporting | 8 | `get_profit_loss`, `get_revenue`, `get_aging_analysis`, `get_transactions`, `get_vat_summary`, `get_budget_comparison`, `get_aging_receivables`, `get_aging_payables` |
| Journals | 2 | `get_journal_entries`, `search_transactions` |
| Orders | 3 | `get_sales_orders`, `get_purchase_orders`, `get_quotations` |
| Items/Inventory | 2 | `get_items`, `get_stock_positions` |
| Projects | 2 | `get_projects`, `get_time_transactions` |
| Project Billing | 2 | `get_project_invoices`, `get_wip_overview` |
| Currencies | 2 | `get_currencies`, `get_currency_rates` |
| Cost Centers | 2 | `get_cost_centers`, `get_cost_center_report` |
| Fixed Assets | 2 | `get_fixed_assets`, `get_depreciation_schedule` |
| Documents | 2 | `get_document_attachments`, `get_document_content` |
| CRM Opportunities | 2 | `get_opportunities`, `get_sales_funnel` |
| Contracts | 3 | `get_sales_contracts`, `get_purchase_contracts`, `get_recurring_revenue` |
| Prices | 3 | `get_sales_prices`, `get_purchase_prices`, `get_margin_analysis` |
| Combo Tools | 2 | `get_customer_360`, `get_financial_snapshot` |

### Demo Mode Industries
| Demo Key | Bedrijf | Branche |
|----------|---------|---------|
| `exa_demo` | Bakkerij De Gouden Croissant B.V. | Bakkerij (default) |
| `exa_demo_bakkerij` | Bakkerij De Gouden Croissant B.V. | Bakkerij |
| `exa_demo_it` | TechSolutions B.V. | IT |
| `exa_demo_advocaat` | Van den Berg Advocaten | Advocatuur |
| `exa_demo_aannemer` | Bouwbedrijf De Vries | Aannemerij |

## Laatste Sync

- **Datum:** 2026-02-02 (VERSION.md update)
- **Bron:** Claude Connector Directory formulier, MCP spec
- **Aantal documenten:** 10
- **Status:** 47 tools, dual transport (SSE + HTTP), demo mode, OAuth 2.1 + PKCE

## Changelog

### 2026-02-02
- **DOCS:** VERSION.md bijgewerkt met complete server capabilities
  - Tool count: 47 tools verdeeld over 18 categorieën
  - Transport support: Streamable HTTP + SSE dual transport
  - Authentication: OAuth 2.1 + PKCE, API keys, demo keys
  - Demo mode: 5 industries (bakkerij, IT, advocaat, aannemer, default)
  - Server versie: 0.2.0
- **OVERVIEW:** Alle tools per categorie gedocumenteerd:
  - Division Management (1), Relations (2), Invoices (3)
  - Financial (4), Reporting (8), Journals (2)
  - Orders (3), Items (2), Projects (2), Billing (2)
  - Currencies (2), Cost Centers (2), Fixed Assets (2)
  - Documents (2), CRM (2), Contracts (3), Prices (3), Combo (2)

### 2026-02-01 (middag)
- **FIX:** Demo URL werkt nu in Claude Desktop als Custom Connector
  - Nieuw endpoint: `/demo/{demo_key}` (skipt OAuth discovery volledig)
  - URL: `https://api.praatmetjeboekhouding.nl/demo/exa_demo`
  - Lost OAuth discovery blokkade op voor demo mode
  - Commit: a92d146

### 2026-02-01
- **FEATURE:** Tool Annotations toegevoegd aan alle 47 tools
  - `readOnlyHint: true` - alle tools zijn read-only
  - `destructiveHint: false` - geen destructieve operaties
  - `idempotentHint: true` - idempotent (geen side effects)
  - `openWorldHint: true` - interactie met externe Exact Online API
  - Vereist voor Claude Connector Directory listing
- **DOCS:** Claude Connector Directory vereisten gedocumenteerd in LESSONS-LEARNED.md
  - Technische vereisten (OAuth, HTTPS, CORS, annotations)
  - Documentatie vereisten (privacy, ToS, setup guide)
  - Test account vereisten (demo mode)
  - Branding vereisten (favicon.ico, logo SVG)
- **ROADMAP:** Toekomstige features toegevoegd
  - MCP Prompts (workflow templates)
  - Claude Agent Skills
  - Claude Code Plugin

### 2026-01-31
- **FEATURE:** Demo mode voor App Store demonstraties
  - API key prefix `exa_demo` activeert fake data
  - Fictief bedrijf: Bakkerij De Gouden Croissant B.V. (Amsterdam)
  - 8 demo tools: list_divisions, get_relations, search_relations, get_*_invoices, get_bank_transactions, get_cashflow_forecast
  - Skippt OAuth en database lookups
- **FIX:** HEAD requests retourneren geen WWW-Authenticate voor demo keys
- **FEATURE:** Claude Code dual MCP configuratie
  - `exact-online` → echte data (OAuth)
  - `exact-online-demo` → demo data (API key)

### 2026-01-28 (middag check)
- **SECURITY:** CVE-2026-0621 ontdekt - ReDoS kwetsbaarheid in TypeScript SDK <= 1.25.1
  - CVSS 8.7 (High) - UriTemplate class catastrophic backtracking
  - **Actie:** Update naar >= 1.25.2 vereist
- **SDK versie gecorrigeerd:** Was v2.0.0-alpha, maar v2 is nog niet uitgebracht. Huidige stabiele versie = v1.25.2
- **MCP Apps (SEP-1865):** Eerste officieel MCP extension - UI in sandboxed iframes
  - Ondersteund door Claude, ChatGPT, Goose, VS Code
  - `ui://` resource scheme voor HTML/JS rendering in chat
  - Potentieel relevant voor onze connector (interactieve Exact Online dashboards)
- **MCP naar Linux Foundation:** Gedoneerd op 9 dec 2025 aan Agentic AI Foundation (AAIF)
  - Co-founded door Anthropic, Block, OpenAI
  - Governance model blijft via SEP-proces
- **Claude Code v2.1.0:** Major release met 1.096 commits
  - Setup hooks, session teleportation, LSP tool, skills hot reload
  - Anthropic Console hernoemd naar platform.claude.com (12 jan 2026)
- **OAuth SEPs in review:**
  - SEP-991: OAuth Client ID Metadata Documents (trust zonder pre-existing relatie)
  - SEP-1299: OAuth flow management verplaatsen van client naar server
  - DPoP blijft SHOULD (niet MUST) - discussie loopt

### 2026-01-28 (initieel)
- Initiele kennisbase opgebouwd
- 9 MCP spec documenten gescraped
- 7 lessons learned gedocumenteerd
- Test scenarios toegevoegd

## Claude Desktop Custom Connector Info (actueel)

**Bron:** Claude Help Center, Web Search 2026-02-01

| Aspect | Status |
|--------|--------|
| **Transport** | SSE én Streamable HTTP ondersteund (SSE mogelijk deprecated) |
| **Auth specs** | Zowel 3/26 als 6/18 auth spec ondersteund |
| **Plannen** | Pro, Max, Team, Enterprise (beta) |
| **Mobile** | iOS en Android ondersteunen remote MCP servers |
| **Config** | Via Settings → Connectors (NIET via claude_desktop_config.json) |

### Belangrijke Vereisten Custom Connector

1. **Endpoint:** Moet `/mcp` path ondersteunen
2. **Methods:** POST (MCP calls) en GET (initialize/discovery)
3. **OAuth:** Als `.well-known/oauth-authorization-server` bestaat, wordt OAuth flow gestart
4. **Workaround:** Aparte path zonder OAuth discovery (onze `/demo` endpoint)

## Volgende Check

- **Gepland:** 2026-02-04 (wekelijks)
- **Check op:**
  - CVE-2026-0621 fix status in onze dependency tree
  - SEP-991 en SEP-1299 voortgang (OAuth impact)
  - TypeScript SDK v2.0 release (verwacht Q1 2026)
  - Volgende spec release voorbereiding (SEPs finalisatie Q1, release juni 2026)
  - MCP Apps extension mogelijkheden voor onze connector
  - SSE deprecation timeline

## Breaking Changes Log

| Datum | Versie | Change | Impact |
|-------|--------|--------|--------|
| 2025-11-25 | 2025-11-25 | Streamable HTTP vervangt HTTP+SSE | Transport layer |
| 2026-01-05 | SDK v1.25.2 | CVE-2026-0621: ReDoS fix in UriTemplate | Security - update vereist |
| 2025-12-09 | - | MCP gedoneerd aan AAIF / Linux Foundation | Governance |
| 2026-01-26 | SEP-1865 | MCP Apps Extension productie-klaar | Nieuwe capability |

## Security Advisories

| CVE | Ernst | Component | Status |
|-----|-------|-----------|--------|
| CVE-2026-0621 | High (CVSS 8.7) | TypeScript SDK UriTemplate | Fix in v1.25.2 |

## URLs om te monitoren

1. https://modelcontextprotocol.io/specification - Spec updates
2. https://github.com/modelcontextprotocol/typescript-sdk/releases - SDK releases
3. https://github.com/modelcontextprotocol/modelcontextprotocol - Spec repo (issues/PRs)
4. https://blog.modelcontextprotocol.io - MCP Blog (nieuw!)
5. https://platform.claude.com/docs/en/release-notes/overview - Claude API changelog (nieuw!)
6. https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md - Claude Code changelog
7. https://github.com/modelcontextprotocol/ext-apps - MCP Apps extension repo (nieuw!)
