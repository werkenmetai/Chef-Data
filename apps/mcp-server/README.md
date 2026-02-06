# MCP Server

Cloudflare Worker die het Model Context Protocol (MCP) implementeert voor Exact Online.

**URL:** https://api.praatmetjeboekhouding.nl

## Wat is MCP?

Model Context Protocol (MCP) is een open standaard van Anthropic waarmee AI-assistenten veilig kunnen communiceren met externe databronnen. Deze server maakt Exact Online data beschikbaar voor Claude, ChatGPT en andere AI's die MCP ondersteunen.

## Architectuur

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  AI Assistant   │────▶│   MCP Server     │────▶│  Exact Online   │
│  (Claude, etc)  │◀────│  (Cloudflare)    │◀────│  REST API       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │
         │                       ▼
         │              ┌──────────────────┐
         └─────────────▶│   D1 Database    │
                        │  (auth, tokens)  │
                        └──────────────────┘
```

## Endpoints

| Endpoint | Method | Auth | Beschrijving |
|----------|--------|------|--------------|
| `/` | POST | API Key | MCP protocol endpoint |
| `/mcp` | POST | API Key | MCP protocol endpoint (Streamable HTTP) |
| `/mcp/{api_key}` | POST | Via URL | **Simpelste methode** - API key in URL |
| `/sse` | POST | API Key | Deprecated alias (gebruik /mcp) |
| `/health` | GET | Geen | Health check |
| `/tools` | GET | Geen | Lijst van beschikbare tools |

## Authenticatie

Er zijn drie manieren om te authenticeren:

### 1. URL met API key (Aanbevolen - simpelst)

```
https://api.praatmetjeboekhouding.nl/mcp/exa_jouw_api_key_hier
```

Dit is de makkelijkste methode voor Claude Desktop - kopieer gewoon de URL uit je dashboard.

### 2. Authorization Header (Aanbevolen voor Claude Code)

```bash
claude mcp add --transport http exact-online https://api.praatmetjeboekhouding.nl/mcp --header "Authorization: Bearer exa_YOUR_API_KEY"
```

Of direct in requests:
```
Authorization: Bearer exa_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Query Parameter

```
https://api.praatmetjeboekhouding.nl/mcp?key=exa_jouw_api_key_hier
```

API keys worden gegenereerd via het [dashboard](https://praatmetjeboekhouding.nl/dashboard).

### Error Codes

| Code | HTTP | Beschrijving |
|------|------|--------------|
| -32001 | 401 | Geen API key meegestuurd |
| -32002 | 401 | Ongeldige of ingetrokken API key |
| -32003 | 429 | Rate limit overschreden |
| -32004 | 403 | Geen Exact Online connectie |
| -32600 | 400 | Ongeldig JSON-RPC request |
| -32601 | 400 | Onbekende methode |
| -32603 | 500 | Interne server error |

## Rate Limits

| Plan | Calls per maand | Prijs |
|------|-----------------|-------|
| Free | 200 | €0 |
| Starter | 750 | €9 |
| Pro | 2.500 | €25 |
| Enterprise | Onbeperkt | Op aanvraag |

Headers in response:
- `X-RateLimit-Limit`: Maandelijkse limiet
- `X-RateLimit-Remaining`: Resterende calls

## MCP Protocol

### Ondersteunde Methods

```
initialize       - Initialiseer de sessie
tools/list       - Lijst beschikbare tools
tools/call       - Roep een tool aan
```

### Request Format (JSON-RPC 2.0)

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_divisions",
    "arguments": {}
  }
}
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 3 divisions: ..."
      }
    ]
  }
}
```

## Beschikbare Tools (15 tools live)

Alle tools zijn **read-only** voor veiligheid.

### Systeem
- `list_divisions` - Toon alle beschikbare administraties

### Relaties (CRM)
- `get_relations` - Klanten en leveranciers ophalen
- `search_relations` - Relaties zoeken op naam/code

### Facturen
- `get_sales_invoices` - Verkoopfacturen ophalen
- `get_purchase_invoices` - Inkoopfacturen ophalen
- `get_outstanding_invoices` - Openstaande facturen

### Financieel
- `get_bank_transactions` - Banktransacties ophalen
- `get_gl_accounts` - Grootboekrekeningen
- `get_journals` - Dagboeken
- `get_trial_balance` - Proef- en saldibalans

### BTW
- `get_vat_returns` - BTW-aangiften
- `get_vat_codes` - BTW-codes
- `validate_vat_number` - BTW-nummer validatie (EU VIES)

### Artikelen
- `get_items` - Producten en diensten
- `search_items` - Artikelen zoeken

Zie [/docs/tools.md](/docs/tools.md) voor volledige documentatie per tool.

## Project Structuur

```
src/
├── index.ts              # Worker entry point
├── types.ts              # TypeScript types
├── auth/
│   └── api-key.ts        # API key validatie
├── exact/
│   ├── client.ts         # Exact API client
│   ├── auth.ts           # OAuth helpers
│   ├── token-manager.ts  # Token refresh
│   ├── rate-limiter.ts   # API rate limiting
│   ├── odata-query.ts    # OData query builder
│   ├── pagination.ts     # Resultaat paginering
│   └── regions.ts        # Regio endpoints
├── mcp/
│   ├── server.ts         # MCP server implementatie
│   ├── tools.ts          # Tool registry
│   └── types.ts          # MCP types
├── tools/
│   ├── _base.ts          # Base tool class
│   └── divisions.ts      # list_divisions tool
└── monitoring/
    ├── metrics.ts        # Performance metrics
    └── sentry.ts         # Error tracking
```

## Omgevingsvariabelen

Secrets (via `wrangler secret put`):
```bash
# OAuth credentials (optioneel - token refresh)
EXACT_CLIENT_ID=xxx
EXACT_CLIENT_SECRET=xxx

# Error tracking (optioneel)
SENTRY_DSN=xxx
```

## Development

```bash
# Vanuit root
pnpm --filter mcp-server dev

# Of vanuit deze directory
pnpm dev

# Start local worker op http://localhost:8787
```

### Testen

```bash
# Health check
curl http://localhost:8787/health

# Tools list (geen auth nodig)
curl http://localhost:8787/tools

# MCP request (met API key)
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer exa_your_key_here" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Deployment

```bash
# Deploy naar production
pnpm --filter mcp-server deploy

# Of via wrangler
wrangler deploy --env production
```

## Token Refresh

De server handelt automatisch token refresh af:

1. Bij elk request wordt `tokenExpiresAt` gecontroleerd
2. Als token <5 minuten geldig is, wordt deze ververst
3. Nieuwe tokens worden opgeslagen in de database
4. Refresh failures worden gelogd maar breken de request niet

## Exact Online API

De server communiceert met Exact Online via hun REST/OData API:

- **Base URL:** `https://start.exactonline.{region}/api/v1/{division}/`
- **Format:** OData v3
- **Auth:** OAuth 2.0 Bearer token
- **Rate limit:** 60 requests/minuut per divisie

### Ondersteunde Regio's

| Code | Domain |
|------|--------|
| NL | start.exactonline.nl |
| BE | start.exactonline.be |
| DE | start.exactonline.de |
| UK | start.exactonline.co.uk |
| US | start.exactonline.com |
| ES | start.exactonline.es |
| FR | start.exactonline.fr |

## Monitoring

### Logs

Cloudflare Workers logs zijn beschikbaar via:
- Cloudflare Dashboard > Workers > exact-mcp-api > Logs
- `wrangler tail` voor real-time logging

### Metrics

Elke API call wordt getracked in de `api_usage` tabel:
- `user_id` - Welke gebruiker
- `api_key_id` - Welke key
- `endpoint` - Welke tool
- `response_status` - Succes/error
- `timestamp` - Wanneer

## Security

- **API Keys:** SHA-256 gehashed opgeslagen
- **Tokens:** Versleuteld in database
- **CORS:** Configureerbaar per origin
- **Rate Limiting:** Per user en per plan
- **Read-only:** Geen write operaties naar Exact

## Relatie met Auth Portal

Deze MCP server deelt de D1 database met de auth-portal:
- Auth portal beheert users, connections en API keys
- MCP server valideert keys en haalt tokens op
- Beide gebruiken dezelfde database ID
