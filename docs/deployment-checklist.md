# Deployment Checklist

Stappen voor het deployen van Praat met je Boekhouding naar productie.

## Vereiste Cloudflare Secrets

Deze secrets MOETEN worden ingesteld via het Cloudflare Dashboard of wrangler CLI:

### 1. Via Cloudflare Dashboard

Ga naar: **Workers & Pages** → **exact-mcp-api** → **Settings** → **Variables and Secrets**

| Naam | Type | Waarde |
|------|------|--------|
| `EXACT_CLIENT_ID` | Secret | Je Exact Online Client ID (van App Center) |
| `EXACT_CLIENT_SECRET` | Secret | Je Exact Online Client Secret (van App Center) |
| `TOKEN_ENCRYPTION_KEY` | Secret | Genereer met: `openssl rand -base64 32` |

### 2. Via Wrangler CLI (alternatief)

```bash
# Navigate naar MCP server
cd apps/mcp-server

# Set secrets (je wordt gevraagd om de waarde)
npx wrangler secret put EXACT_CLIENT_ID --env production
npx wrangler secret put EXACT_CLIENT_SECRET --env production
npx wrangler secret put TOKEN_ENCRYPTION_KEY --env production
```

**TOKEN_ENCRYPTION_KEY genereren:**
```bash
openssl rand -base64 32
# Kopieer output en gebruik als secret
```

## Deployment Commando's

### MCP Server

```bash
cd apps/mcp-server
npx wrangler deploy --env production
```

### Auth Portal (indien nodig)

```bash
cd apps/auth-portal
npx wrangler pages deploy dist
```

## Verificatie

### 1. Health Check

```bash
curl https://api.praatmetjeboekhouding.nl/health
```

Verwachte response:
```json
{
  "status": "ok",
  "version": "0.2.0",
  "environment": "production",
  "transport": "streamable-http"
}
```

### 2. MCP Protocol Test

```bash
# Met API key in URL (aanbevolen methode)
curl -X POST https://api.praatmetjeboekhouding.nl/sse/YOUR_API_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### 3. Claude Desktop Test

1. Open Claude Desktop
2. Ga naar Settings → Connectors
3. Voeg toe: `https://api.praatmetjeboekhouding.nl/sse/YOUR_API_KEY`
4. Stel een vraag over je boekhouding

## Troubleshooting Deployment

### "Variables are empty" in Cloudflare Dashboard

Secrets zijn niet zichtbaar na opslaan (security feature). Check of ze werken:

```bash
# Deploy met --dry-run om config te zien
npx wrangler deploy --dry-run --env production
```

### "401 Unauthorized" bij API calls

1. Check of TOKEN_ENCRYPTION_KEY is gezet
2. Check of EXACT_CLIENT_ID en EXACT_CLIENT_SECRET kloppen
3. Check Cloudflare logs: Workers → exact-mcp-api → Logs

### OAuth "redirect_uri mismatch"

Zorg dat in Exact App Center de redirect URI exact is:
```
https://praatmetjeboekhouding.nl/callback
```

## Productie URLs

| Service | URL |
|---------|-----|
| Dashboard | https://praatmetjeboekhouding.nl |
| MCP Server | https://api.praatmetjeboekhouding.nl |
| Health Check | https://api.praatmetjeboekhouding.nl/health |
| Tools List | https://api.praatmetjeboekhouding.nl/tools |

---

*Laatste update: Januari 2026*
