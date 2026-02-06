# Praat met je Boekhouding

> AI-first MCP server dat finance professionals toegang geeft tot hun Exact Online boekhouding via Claude, ChatGPT en andere AI-assistenten.

**Product**: Praat met je Boekhouding - Verbind je Exact Online met AI

**Live URLs:**
- Auth Portal: https://praatmetjeboekhouding.nl
- MCP Server: https://api.praatmetjeboekhouding.nl

## Wat is dit?

Een SaaS product dat:
1. Gebruikers hun Exact Online account laat koppelen (OAuth)
2. Ze een API key geeft
3. Die ze in Claude/ChatGPT configureren
4. Zodat ze in natuurlijke taal vragen kunnen stellen over hun boekhouding

## Tech Stack

| Component | Technologie | URL |
|-----------|-------------|-----|
| Auth Portal | Astro + Cloudflare Pages | praatmetjeboekhouding.nl |
| MCP Server | Cloudflare Workers | api.praatmetjeboekhouding.nl |
| Database | Cloudflare D1 (SQLite) | exact-mcp-db |
| Payments | Stripe (voorbereid) | - |
| CI/CD | GitHub Actions | Automatisch |
| Monorepo | Turborepo + pnpm | - |

## Project Structuur

```
Exact-online-MCP/
├── apps/
│   ├── auth-portal/          # OAuth UI & Dashboard (Astro)
│   │   ├── src/pages/        # Pagina's (connect, callback, dashboard, admin, etc.)
│   │   ├── src/lib/          # Database, Exact OAuth, Stripe helpers
│   │   └── migrations/       # D1 database migraties
│   ├── mcp-server/           # MCP Protocol server (Worker)
│   │   ├── src/mcp/          # MCP protocol handler
│   │   ├── src/tools/        # Exact Online tools (15 tools)
│   │   │   ├── divisions.ts  # list_divisions
│   │   │   ├── relations.ts  # get_relations, search_relations
│   │   │   ├── invoices.ts   # sales, purchase, outstanding
│   │   │   ├── financial.ts  # bank, GL accounts, trial balance
│   │   │   └── reporting.ts  # P&L, revenue, aging, VAT, budget
│   │   └── src/auth/         # API key authenticatie
│   └── api/                  # (Leeg - niet in gebruik)
├── packages/
│   └── shared/               # Gedeelde types
├── .github/workflows/        # CI/CD
└── docs/                     # Documentatie
```

## Omgevingsvariabelen

### Auth Portal (Cloudflare Pages)

```bash
# Exact Online OAuth (VERPLICHT)
EXACT_CLIENT_ID=your-client-id
EXACT_CLIENT_SECRET=your-client-secret
EXACT_REDIRECT_URI=https://praatmetjeboekhouding.nl/callback

# Admin toegang
ADMIN_EMAILS=admin@example.com,admin2@example.com

# Stripe (OPTIONEEL - alleen voor betalingen)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### MCP Server (Cloudflare Workers)

```bash
# Automatisch via D1 binding
DB=exact-mcp-db (D1 Database ID: 30788ed4-4a60-4453-b176-dd9da7eecb2d)
```

## Database Schema

D1 Database `exact-mcp-db`:

```sql
-- Gebruikers
users (id, email, name, plan, api_calls_used, stripe_customer_id, ...)

-- Exact Online connecties per regio
connections (id, user_id, region, access_token, refresh_token, token_expires_at, ...)

-- Administraties per connectie
divisions (id, connection_id, division_code, division_name, is_default)

-- API keys voor MCP
api_keys (id, user_id, key_hash, key_prefix, name, last_used_at, revoked_at)

-- Sessies voor web
sessions (id, user_id, expires_at)

-- API usage tracking
api_usage (id, user_id, api_key_id, endpoint, division_code, response_status, timestamp)
```

## Pagina's (Auth Portal)

| Route | Functie | Auth vereist |
|-------|---------|--------------|
| `/` | Landing page | Nee |
| `/connect` | Start OAuth flow | Nee |
| `/callback` | OAuth callback | Nee |
| `/dashboard` | User dashboard | Ja (sessie) |
| `/admin` | Admin monitoring | Ja (ADMIN_EMAILS) |
| `/setup` | Configuratie instructies | Nee |
| `/docs` | Documentatie | Nee |
| `/pricing` | Prijzen | Nee |
| `/faq` | Veelgestelde vragen | Nee |
| `/status` | Systeem status | Nee |
| `/terms` | Algemene Voorwaarden | Nee |
| `/privacy` | Privacy Policy | Nee |

## MCP Endpoints

| Route | Functie |
|-------|---------|
| `GET /health` | Health check |
| `GET /tools` | Lijst van tools (public) |
| `POST /mcp` | MCP protocol (auth required) |

## Authenticatie Flow

1. **Gebruiker → /connect**: Kiest regio, redirect naar Exact
2. **Exact → /callback**: Ontvangt code, wisselt voor tokens
3. **Callback**: Slaat tokens op, maakt sessie + API key
4. **Dashboard**: Toont API key voor Claude configuratie
5. **Claude → /mcp**: Gebruikt API key in header

## API Key Format

```
exa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- Prefix: `exa_`
- Random: 48 hex chars (24 bytes)
- Opslag: PBKDF2 met salt (100k iteraties) in database

## Rate Limits

| Plan | API Calls/maand | Administraties | Prijs |
|------|-----------------|----------------|-------|
| Free | 200 | 2 | €0 |
| Starter | 750 | 3 | €9 |
| Pro | 2.500 | 10 | €25 |
| Enterprise | Onbeperkt | Onbeperkt | Op aanvraag |

## Development

```bash
# Installeren
pnpm install

# Development (alle apps)
pnpm dev

# Alleen auth-portal
pnpm --filter auth-portal dev

# Alleen mcp-server
pnpm --filter mcp-server dev

# Build
pnpm build

# Deploy MCP server
pnpm --filter mcp-server deploy
```

## Deployment

### Automatisch (GitHub Actions)

- Push naar `main` of `claude/setup-exact-online-mcp-Tnzgt` triggert deploy
- Zie `.github/workflows/deploy-mcp-server.yml`

### Handmatig

```bash
cd apps/mcp-server && npx wrangler deploy
cd apps/auth-portal && npx wrangler pages deploy dist
```

## Stripe Integratie (Voorbereid)

Bestanden aanwezig maar niet actief:
- `src/lib/stripe.ts` - Helper functies
- `src/pages/api/stripe/checkout.ts` - Checkout sessie
- `src/pages/api/stripe/portal.ts` - Customer portal
- `src/pages/api/stripe/webhook.ts` - Webhook handler

### Activeren:

1. Stripe account aanmaken
2. Producten aanmaken: Starter (€9/maand), Pro (€25/maand)
3. `STRIPE_SECRET_KEY` en `STRIPE_WEBHOOK_SECRET` toevoegen
4. Price ID's updaten in `src/lib/stripe.ts`
5. Migratie `0002_add_stripe_fields.sql` draaien

## Belangrijke Bestanden

### Auth Portal

```
apps/auth-portal/
├── src/lib/
│   ├── database.ts      # D1 database operations
│   ├── exact-auth.ts    # Exact OAuth helpers
│   └── stripe.ts        # Stripe helpers
├── src/pages/
│   ├── connect.astro    # OAuth start
│   ├── callback.astro   # OAuth callback
│   ├── dashboard.astro  # User dashboard
│   └── admin.astro      # Admin monitoring
└── wrangler.toml        # Cloudflare config
```

### MCP Server

```
apps/mcp-server/
├── src/
│   ├── index.ts         # Worker entry point
│   ├── auth/
│   │   └── api-key.ts   # API key validation
│   ├── mcp/
│   │   ├── server.ts    # MCP protocol handler
│   │   └── tools.ts     # Tool registry (15 tools)
│   ├── exact/
│   │   ├── client.ts    # Exact API client with token refresh
│   │   └── tokens.ts    # Token manager
│   └── tools/
│       ├── _base.ts     # Base tool class
│       ├── divisions.ts # list_divisions
│       ├── relations.ts # get/search relations
│       ├── invoices.ts  # sales/purchase/outstanding
│       ├── financial.ts # bank/GL/trial balance
│       └── reporting.ts # P&L/revenue/aging/VAT/budget
└── wrangler.toml        # Cloudflare config
```

## Automation & Email (Voorbereid)

Het systeem heeft een volledig email- en automatiseringssysteem klaarstaan:

### Email Service (`src/lib/email.ts`)
- Welkom email bij registratie
- Onboarding emails (dag 1, 3, 7)
- Token expiry alerts
- Rate limit waarschuwingen
- Admin notificaties

### Cron Jobs (`src/lib/automation.ts`)
- Hourly: Token refresh failures checken
- Daily: Onboarding emails, inactiviteit detectie
- Monthly: Usage reset

### Activeren:
1. Resend account aanmaken op [resend.com](https://resend.com)
2. `RESEND_API_KEY` toevoegen aan Cloudflare Pages
3. Cron triggers configureren in Cloudflare Dashboard

## Kosten

| Component | Gratis tier | Daarna |
|-----------|-------------|--------|
| Cloudflare Workers | 100k req/dag | $5/maand |
| Cloudflare D1 | 5M reads/dag | $0.001/1M |
| Exact Online API | Onbeperkt | Gratis |
| Stripe | - | 1.4% + €0.25/tx |

## Links

- [Exact Online API Docs](https://start.exactonline.nl/docs/HlpRestAPIResources.aspx)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Cloudflare Workers](https://developers.cloudflare.com/workers)
- [Cloudflare D1](https://developers.cloudflare.com/d1)
- [Astro](https://astro.build)

## License

MIT - Chef Data B.V.
