# MCP Registry & Directory Publicatie Guide

**Auteur:** Piet (Orchestrator) met input van Ruben (MCP) en Daan (Backend)
**Datum:** 2026-02-01
**Status:** Klaar voor submission

---

## Samenvatting

Dit document beschrijft hoe "Praat met je Boekhouding" gepubliceerd kan worden in MCP directories.

**Belangrijke bevinding:** De officiële MCP Registry (registry.modelcontextprotocol.io) is
primair ontworpen voor **npm/pypi packages**, niet voor remote servers. Voor onze remote
OAuth-based server gebruiken we community directories.

---

## Optie 1: Community Directories (AANBEVOLEN)

### PulseMCP (7.890+ servers)
**URL:** https://pulsemcp.com/submit

**Submission info:**
- URL: `https://github.com/werkenmetai/Exact-online-MCP`
- Type: MCP Server
- Contact: hello@pulsemcp.com

### mcp.so
**URL:** https://mcp.so

**Submission:** Via website form of GitHub PR

### Glama.ai
**URL:** https://glama.ai

**Submission:** Via website

---

## Optie 2: Officiële MCP Registry (Vereist npm package)

De officiële registry vereist een gepubliceerd npm package met `mcpName` field.

### Stappen indien we een npm package willen maken:

1. **Maak wrapper package:**
```bash
mkdir packages/mcp-cli
cd packages/mcp-cli
npm init -y
```

2. **Maak CLI entry point:**
```javascript
#!/usr/bin/env node
// packages/mcp-cli/bin/exact-online-mcp.js
const { spawn } = require('child_process');
spawn('npx', ['-y', 'mcp-remote', 'https://api.praatmetjeboekhouding.nl/mcp'], {
  stdio: 'inherit'
});
```

3. **Update package.json:**
```json
{
  "name": "@werkenmetai/exact-online-mcp",
  "mcpName": "io.github.werkenmetai/exact-online-mcp",
  "bin": {
    "exact-online-mcp": "./bin/exact-online-mcp.js"
  }
}
```

4. **Publiceer naar npm:**
```bash
npm publish --access public
```

5. **Dan registry publicatie:**
```bash
mcp-publisher login github
mcp-publisher publish .mcp/server.json
```

**Status:** Uitgesteld - community directories hebben prioriteit

## Onze Server Configuratie

### Namespace
```
io.github.werkenmetai/exact-online-mcp
```

### Remote Server URL
```
https://api.praatmetjeboekhouding.nl/mcp
```

### OAuth Endpoints
| Endpoint | URL |
|----------|-----|
| Authorization | `https://api.praatmetjeboekhouding.nl/oauth/authorize` |
| Token | `https://api.praatmetjeboekhouding.nl/oauth/token` |
| Discovery | `https://api.praatmetjeboekhouding.nl/.well-known/oauth-protected-resource` |

---

## Publicatie Stappen

### Stap 1: Installeer MCP Publisher CLI

```bash
# macOS/Linux
curl -L "https://github.com/modelcontextprotocol/registry/releases/download/v1.0.0/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher
sudo mv mcp-publisher /usr/local/bin/

# Windows (via PowerShell)
# Download van: https://github.com/modelcontextprotocol/registry/releases/latest
```

### Stap 2: Authenticeer met GitHub

```bash
mcp-publisher login github
```

Dit opent je browser voor GitHub OAuth. Log in met het `werkenmetai` account.

### Stap 3: Verifieer server.json

```bash
mcp-publisher validate .mcp/server.json
```

### Stap 4: Publiceer

```bash
mcp-publisher publish .mcp/server.json
```

### Stap 5: Verifieer op Registry

Bezoek: https://registry.modelcontextprotocol.io/servers/io.github.werkenmetai/exact-online-mcp

---

## Server.json Configuratie

Locatie: `.mcp/server.json`

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-10-17/server.schema.json",
  "name": "io.github.werkenmetai/exact-online-mcp",
  "version": "1.0.0",
  "title": "Praat met je Boekhouding - Exact Online MCP",
  "description": "Connect your Exact Online accounting data to AI assistants...",
  "packages": [
    {
      "registryType": "remote",
      "transport": {
        "type": "sse",
        "url": "https://api.praatmetjeboekhouding.nl/mcp"
      },
      "auth": {
        "type": "oauth2",
        "authorizationUrl": "https://api.praatmetjeboekhouding.nl/oauth/authorize",
        "tokenUrl": "https://api.praatmetjeboekhouding.nl/oauth/token"
      }
    }
  ]
}
```

---

## Community Directories

Naast de officiële registry, publiceer ook naar:

### 1. PulseMCP (7.890+ servers)
- URL: https://pulsemcp.com
- Submit: Via website form

### 2. MCP.so
- URL: https://mcp.so
- Submit: Via GitHub PR of website

### 3. Awesome MCP Servers
- URL: https://github.com/modelcontextprotocol/servers
- Submit: GitHub PR naar `servers.json`

---

## Claude Desktop Integratie

### Huidige Methode (werkt nu)

Gebruikers voegen toe aan `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "exact-online": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-remote", "https://api.praatmetjeboekhouding.nl/mcp"]
    }
  }
}
```

### Toekomstige Methode (na Registry GA)

Gebruikers kunnen in Claude Desktop:
1. Settings → MCP Servers → Browse Registry
2. Zoek "Praat met je Boekhouding" of "Exact Online"
3. Klik "Install"
4. Authenticeer via OAuth

---

## OAuth Flow Verificatie

Test de OAuth flow handmatig:

```bash
# 1. Haal discovery metadata op
curl https://api.praatmetjeboekhouding.nl/.well-known/oauth-protected-resource

# 2. Haal authorization server metadata op
curl https://api.praatmetjeboekhouding.nl/.well-known/oauth-authorization-server

# 3. Test SSE connection (met API key voor nu)
curl -H "Accept: text/event-stream" https://api.praatmetjeboekhouding.nl/mcp/exa_YOUR_KEY
```

---

## Checklist voor Publicatie

- [x] `.mcp/server.json` aangemaakt
- [x] `mcpName` toegevoegd aan package.json
- [x] OAuth endpoints geïmplementeerd
- [x] SSE transport werkend
- [ ] `mcp-publisher` CLI geïnstalleerd
- [ ] GitHub OAuth login gedaan
- [ ] Gepubliceerd naar registry
- [ ] Geverifieerd op registry website
- [ ] Gepubliceerd naar PulseMCP
- [ ] Gepubliceerd naar mcp.so

---

## Contact

Bij vragen:
- **Ruben** - MCP Protocol
- **Daan** - Backend/OAuth
- **Piet** - Orchestratie
