# Troubleshooting Guide

Veelvoorkomende problemen en oplossingen.

## Authenticatie Problemen

### Token Expired / Refresh Failed

**Symptom:** API calls geven 401 Unauthorized

**Hoe tokens werken:**
- Access tokens verlopen na ~10 minuten
- Het systeem refresht automatisch met de refresh token
- Refresh tokens zijn 30 dagen geldig bij inactiviteit

**Wanneer refresh faalt:**
1. Gebruiker is 30+ dagen inactief geweest
2. Gebruiker heeft toegang ingetrokken in Exact Online
3. Exact Online app credentials zijn gewijzigd

**Oplossing:**
1. Ga naar /connect om opnieuw te verbinden
2. Het systeem detecteert refresh failures automatisch
3. Connectie wordt gemarkeerd als `refresh_failed`

**Voor gebruikers:**
> "Je Exact Online verbinding is verlopen. Ga naar je [dashboard](/dashboard) en klik op 'Opnieuw verbinden'."

### Invalid Redirect URI

**Symptom:** OAuth callback faalt met "redirect_uri mismatch"

**Oplossing:**
1. Check je Exact App Center settings
2. Zorg dat de redirect URI exact overeenkomt
3. Vergeet het protocol niet (https://)

**Correcte URI:**
```
https://praatmetjeboekhouding.nl/callback
```

## API Errors

### Rate Limited (429)

**Symptom:** Te veel verzoeken error

**Exact Online Limieten:**
- 60 requests per minuut per division
- 5000 requests per dag per app

**Oplossing:**
1. Wacht even en probeer opnieuw
2. Bij 80% van limiet krijg je een waarschuwing (als email service actief is)
3. Limiet reset aan het begin van elke maand

### Division Not Found (404)

**Symptom:** Administratie niet gevonden

**Mogelijke oorzaken:**
1. Verkeerde division ID
2. Gebruiker heeft geen toegang tot deze administratie
3. Administratie is gedeactiveerd in Exact

**Oplossing:**
1. Gebruik `list_divisions` om beschikbare administraties te zien
2. Check rechten in Exact Online

### No Connections Found

**Symptom:** "Geen Exact Online connectie gevonden"

**Oorzaken:**
1. Gebruiker heeft nog niet verbonden
2. Alle connecties zijn verlopen

**Oplossing:**
1. Ga naar /connect om te verbinden
2. Check /dashboard voor connectie status

## MCP / Claude Problemen

### "Error connecting to the MCP server" in Claude Desktop

**Dit is een bekende bug in Claude Desktop** (sinds december 2025). OAuth voor custom MCP connectors werkt niet correct.

**Beste oplossing: Claude Code (CLI)**

Claude Code werkt betrouwbaar met MCP servers:
```bash
claude mcp add --transport http exact-online https://api.praatmetjeboekhouding.nl/mcp --header "Authorization: Bearer exa_YOUR_API_KEY"
```
Start daarna: `claude`

**Alternatief: Claude Desktop met URL methode**

1. Ga naar https://praatmetjeboekhouding.nl/dashboard
2. Kopieer je API key
3. In Claude Desktop: Settings → Connectors → Add custom connector
4. Plak: `https://api.praatmetjeboekhouding.nl/mcp/exa_YOUR_API_KEY`
5. Klik Add

Deze methode omzeilt OAuth volledig en werkt direct.

**Meer info:** [GitHub Issue: OAuth Broken in Claude Desktop](https://github.com/anthropics/claude-ai-mcp/issues/5)

### Claude ziet de MCP server niet

**Controleer:**
1. URL is correct gekopieerd vanuit het dashboard
2. Claude is volledig herstart (niet alleen venster gesloten)
3. Bij handmatige JSON: syntax correct (geen trailing comma's)

**Op macOS:** Gebruik Cmd+Q om volledig af te sluiten

### Makkelijkste setup methode

**Optie 1: Claude Code (Aanbevolen)**
```bash
claude mcp add --transport http exact-online https://api.praatmetjeboekhouding.nl/mcp --header "Authorization: Bearer exa_YOUR_API_KEY"
claude
```

**Optie 2: Claude Desktop met URL**
1. Maak URL: `https://api.praatmetjeboekhouding.nl/mcp/exa_YOUR_API_KEY`
2. In Claude Desktop: Settings → Connectors → Add custom connector
3. Plak de URL en klik Add
4. Klaar!

### "Authentication required" fout

**Controleer:**
1. API key correct gekopieerd (inclusief `exa_` prefix)
2. Volledige URL gekopieerd uit dashboard
3. Key is niet ingetrokken

**Test met cURL (simpele URL methode):**
```bash
curl -X POST https://api.praatmetjeboekhouding.nl/mcp/exa_YOUR_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

**Test met cURL (header methode):**
```bash
curl -X POST https://api.praatmetjeboekhouding.nl/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer exa_YOUR_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Netwerk Problemen

### Cannot Connect to Exact Online

**Symptom:** Network errors of timeouts

**Mogelijke oorzaken:**
1. Exact Online API is down
2. Cloudflare Worker networking issue
3. DNS resolution probleem

**Controleer:**
1. [status.exact.com](https://status.exact.com) voor Exact status
2. [cloudflarestatus.com](https://cloudflarestatus.com) voor Cloudflare status
3. Probeer opnieuw na een paar minuten

## Veelvoorkomende Foutmeldingen

| Foutmelding | Betekenis | Actie |
|-------------|-----------|-------|
| "Access token has expired" | Token verlopen | Opnieuw verbinden via /connect |
| "Division not accessible" | Geen toegang | Check rechten in Exact Online |
| "Rate limit exceeded" | Te veel requests | Wacht en probeer later |
| "No connections found" | Niet verbonden | Verbind via /connect |
| "Invalid API key" | Key ongeldig | Check key of genereer nieuwe |

## Error Codes

```typescript
switch (error.status) {
  case 401: return 'token_expired';      // Opnieuw verbinden
  case 403: return 'permission_denied';  // Geen toegang
  case 404: return 'not_found';          // Resource bestaat niet
  case 429: return 'rate_limited';       // Wacht en retry
  case 500: return 'exact_api_error';    // Exact probleem
  default: return 'unknown';             // Contact support
}
```

## Contact Support

Nog steeds problemen?
- Email: support@praatmetjeboekhouding.nl
- Check /faq voor meer antwoorden
- Check /status voor systeemstatus
