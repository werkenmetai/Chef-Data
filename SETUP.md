# Setup Guide

Stapsgewijze instructies voor het opzetten van Exact Online MCP vanaf nul.

## Vereisten

- Node.js 18+ en pnpm
- Cloudflare account (gratis)
- Exact Online app registratie
- (Later) Stripe account voor betalingen

## Stap 1: Cloudflare Account

1. Ga naar [dash.cloudflare.com](https://dash.cloudflare.com)
2. Maak een gratis account aan
3. Installeer Wrangler CLI:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

## Stap 2: D1 Database Aanmaken

De database is al geconfigureerd met ID `30788ed4-4a60-4453-b176-dd9da7eecb2d`.

Als je een nieuwe database nodig hebt:
```bash
wrangler d1 create exact-mcp-db
# Kopieer de database_id naar wrangler.toml files
```

### Database Migraties Draaien

```bash
# Initieel schema
wrangler d1 execute exact-mcp-db --file=apps/auth-portal/migrations/0001_initial.sql

# Stripe velden (optioneel, voor betalingen)
wrangler d1 execute exact-mcp-db --file=apps/auth-portal/migrations/0002_add_stripe_fields.sql
```

## Stap 3: Exact Online App Registreren

1. Log in op [apps.exactonline.com](https://apps.exactonline.com)
2. Maak een nieuwe app aan:
   - **Naam:** Exact Online MCP
   - **Type:** OAuth2
   - **Redirect URI:** `https://praatmetjeboekhouding.nl/callback`
3. Noteer de **Client ID** en **Client Secret**

## Stap 4: Omgevingsvariabelen Instellen

### Auth Portal (Cloudflare Pages)

In Cloudflare Dashboard > Pages > exact-online-mcp > Settings > Environment Variables:

| Variable | Waarde | Verplicht |
|----------|--------|-----------|
| `EXACT_CLIENT_ID` | Van stap 3 | Ja |
| `EXACT_CLIENT_SECRET` | Van stap 3 | Ja |
| `EXACT_REDIRECT_URI` | `https://praatmetjeboekhouding.nl/callback` | Ja |
| `ADMIN_EMAILS` | `jouw@email.com` | Nee |
| `STRIPE_SECRET_KEY` | `sk_live_xxx` | Nee (later) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` | Nee (later) |

### MCP Server (Workers)

De MCP Server gebruikt alleen D1 binding, geen extra secrets nodig.

Voor token refresh (optioneel):
```bash
wrangler secret put EXACT_CLIENT_ID --env production
wrangler secret put EXACT_CLIENT_SECRET --env production
```

## Stap 5: Lokale Development

```bash
# Clone en installeer
git clone https://github.com/werkenmetai/Exact-online-MCP.git
cd Exact-online-MCP
pnpm install

# Start development servers
pnpm dev
```

Dit start:
- Auth Portal op http://localhost:4321
- MCP Server op http://localhost:8787

### Lokale Environment

Maak `.dev.vars` aan in `apps/auth-portal/`:

```bash
EXACT_CLIENT_ID=xxx
EXACT_CLIENT_SECRET=xxx
EXACT_REDIRECT_URI=http://localhost:4321/callback
```

**Let op:** Voor lokale OAuth testing moet je een aparte redirect URI registreren in Exact.

## Stap 6: Deployment

### Automatisch (GitHub)

Push naar main triggert automatisch deployment via GitHub Actions.

### Handmatig

```bash
# Auth Portal
cd apps/auth-portal
pnpm build
npx wrangler pages deploy dist

# MCP Server
cd apps/mcp-server
npx wrangler deploy --env production
```

## Stap 7: Verificatie

### Health Check
```bash
curl https://api.praatmetjeboekhouding.nl/health
```

Verwacht:
```json
{"status":"ok","version":"0.1.0","environment":"production"}
```

### Tools List
```bash
curl https://api.praatmetjeboekhouding.nl/tools
```

### Auth Portal
Bezoek https://praatmetjeboekhouding.nl en test de OAuth flow.

## Stap 8: Eerste Connectie Testen

1. Ga naar https://praatmetjeboekhouding.nl/connect
2. Kies je regio (bijv. Nederland)
3. Log in met Exact Online credentials
4. Na redirect: kopieer je API key
5. Test met cURL:
   ```bash
   curl -X POST https://api.praatmetjeboekhouding.nl/mcp \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer exa_jouw_key_hier" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
   ```

## Stripe Activeren (Later)

1. **Stripe Account:** Maak aan op [stripe.com](https://stripe.com)
2. **Producten aanmaken:**
   - Starter: €9/maand
   - Pro: €25/maand
   - Noteer de Price ID (price_xxx)
3. **Webhook instellen:**
   - URL: `https://praatmetjeboekhouding.nl/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`
4. **Code updaten:**
   ```typescript
   // apps/auth-portal/src/lib/stripe.ts
   export const STRIPE_PRICES = {
     pro_monthly: 'price_JOUW_PRICE_ID',
   };
   ```
5. **Secrets toevoegen:** Zie stap 4
6. **Migratie draaien:**
   ```bash
   wrangler d1 execute exact-mcp-db --file=apps/auth-portal/migrations/0002_add_stripe_fields.sql
   ```

## Troubleshooting

### OAuth Callback Errors

**"State verification failed"**
- Cookies worden geblokkeerd
- Redirect URI komt niet overeen
- Te lang gewacht (nonce verlopen)

**"Token exchange failed"**
- Client ID/Secret incorrect
- Redirect URI exact matchen (inclusief trailing slash)

### MCP Server Errors

**401 "Invalid API key"**
- Key incorrect gekopieerd
- Key is ingetrokken
- Controleer of key begint met `exa_`

**403 "No connections found"**
- User heeft nog niet verbonden met Exact
- OAuth flow niet voltooid

### Database Errors

**"no such table"**
- Migraties niet gedraaid
- Verkeerde database ID in wrangler.toml

```bash
# Check welke tabellen bestaan
wrangler d1 execute exact-mcp-db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

## Monitoring

### Logs bekijken

```bash
# MCP Server real-time logs
wrangler tail --env production

# Auth Portal logs
# Via Cloudflare Dashboard > Pages > exact-online-mcp > Deployments > Logs
```

### Admin Dashboard

Ga naar https://praatmetjeboekhouding.nl/admin (vereist ADMIN_EMAILS)

Toont:
- Totaal aantal users
- Actieve connecties
- API calls vandaag/deze maand
- Users per plan

## Volgende Stappen

1. Test de volledige OAuth flow
2. Configureer Claude met je API key (zie /setup)
3. Monitor gebruiksstatistieken in /admin
4. Wanneer klaar: activeer Stripe voor betalingen
