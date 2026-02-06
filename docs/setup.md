# Setup Guide

Hoe je Praat met je Boekhouding (Exact Online MCP) instelt.

**Live URLs:**
- Dashboard: https://praatmetjeboekhouding.nl
- MCP Server: https://api.praatmetjeboekhouding.nl

---

## Voor Eindgebruikers (Klanten)

### Stap 1: Account aanmaken

1. Ga naar https://praatmetjeboekhouding.nl
2. Klik op **Verbinden met Exact Online**
3. Log in met je Exact Online account
4. Geef toestemming voor toegang

### Stap 2: API key ophalen

1. Ga naar https://praatmetjeboekhouding.nl/dashboard
2. Je API key wordt getoond (begint met `exa_...`)
3. **Kopieer de API key** voor gebruik in Claude Code of Claude Desktop

> ⚠️ **Belangrijk:** Bewaar je API key veilig!

### Stap 3: Verbinden met Claude

#### Optie A: Claude Code (Aanbevolen)

Claude Code werkt betrouwbaar met MCP servers.

```bash
claude mcp add --transport http exact-online https://api.praatmetjeboekhouding.nl/mcp --header "Authorization: Bearer exa_YOUR_API_KEY"
```

Start daarna Claude:
```bash
claude
```

#### Optie B: Claude Desktop

⚠️ **Let op:** Er is een bekende bug (dec 2025) waardoor OAuth voor custom connectors niet werkt.

**Workaround met URL-methode:**

1. Open **Claude Desktop**
2. Ga naar **Settings** → **Connectors**
3. Klik op **Add custom connector**
4. Plak deze URL: `https://api.praatmetjeboekhouding.nl/mcp/exa_YOUR_API_KEY`
5. Klik **Add**

De connector zou nu moeten verbinden. Je kunt nu vragen stellen over je boekhouding!

### Problemen?

Als je een foutmelding krijgt bij het verbinden:

1. **"Error connecting to MCP server"** - Controleer of je de volledige URL hebt gekopieerd inclusief de API key
2. **OAuth/CSRF errors** - Gebruik de vereenvoudigde URL methode (met API key in de URL)
3. Zie [troubleshooting.md](./troubleshooting.md) voor meer oplossingen

---

## Voor Ontwikkelaars

### Prerequisites

- Node.js 20+
- pnpm 9+
- Cloudflare account
- Exact Online developer account

### Stap 1: Exact Online App aanmaken

1. Ga naar [Exact Online App Center](https://apps.exactonline.com)
2. Registreer als developer (~15 EUR/maand)
3. Maak een nieuwe app aan
4. Noteer je Client ID en Client Secret
5. Stel de redirect URI in op je auth portal URL

### Stap 2: Clone en Installeer

```bash
git clone https://github.com/werkenmetai/Exact-online-MCP.git
cd Exact-online-MCP
pnpm install
```

### Stap 3: Configureer Environment

```bash
cp .env.example .env
```

Vul in:
- `EXACT_CLIENT_ID` - Van Exact App Center
- `EXACT_CLIENT_SECRET` - Van Exact App Center
- `TOKEN_ENCRYPTION_KEY` - Genereer met `openssl rand -base64 32`

### Stap 4: Cloudflare Setup

```bash
# Maak D1 database
wrangler d1 create exact-mcp-db

# Voeg secrets toe
wrangler secret put EXACT_CLIENT_ID
wrangler secret put EXACT_CLIENT_SECRET
wrangler secret put TOKEN_ENCRYPTION_KEY
```

### Stap 5: Deploy

```bash
# MCP Server
cd apps/mcp-server
npx wrangler deploy

# Auth Portal
cd ../auth-portal
npx wrangler pages deploy
```

---

## Alternatieve Configuratie: JSON Config

Voor gevorderde gebruikers die de JSON config willen gebruiken:

**Locatie:** `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "exact-online": {
      "url": "https://api.praatmetjeboekhouding.nl/mcp",
      "headers": {
        "Authorization": "Bearer exa_YOUR_API_KEY_HERE"
      }
    }
  }
}
```

---

## Bekende Issues

### Claude Desktop OAuth Bug (december 2025)

Er is een [bekende bug in Claude Desktop](https://github.com/anthropics/claude-ai-mcp/issues/5) waarbij OAuth voor custom connectors niet werkt.

**Aanbeveling:** Gebruik **Claude Code** (CLI) voor betrouwbare MCP-verbindingen:
```bash
claude mcp add --transport http exact-online https://api.praatmetjeboekhouding.nl/mcp --header "Authorization: Bearer exa_YOUR_API_KEY"
```

**Workaround voor Claude Desktop:** Gebruik de vereenvoudigde URL methode met je API key in de URL:
```
https://api.praatmetjeboekhouding.nl/mcp/exa_YOUR_API_KEY
```

Dit omzeilt OAuth volledig en werkt direct.
