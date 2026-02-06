# Claude Connector Directory Submission

> **Status:** Ingediend - Wacht op review
> **Submission Datum:** 1 februari 2026
> **Versie:** 1.0

Dit document documenteert onze submission naar de Claude Connector Directory.

---

## Submission Status

| Stap | Status | Datum |
|------|--------|-------|
| OAuth 2.1 + PKCE implementatie | ✅ Complete | 31 jan 2026 |
| SSE + Streamable HTTP transport | ✅ Complete | 31 jan 2026 |
| Tool Annotations (47 tools) | ✅ Complete | 31 jan 2026 |
| Demo URL zonder OAuth | ✅ Complete | 1 feb 2026 |
| 6-pagina formulier ingevuld | ✅ Complete | 1 feb 2026 |
| Directory submission ingediend | ✅ Complete | 1 feb 2026 |
| Review door Anthropic | ⏳ Pending | - |
| Listing in claude.com/connectors | ⏳ Pending | - |

---

## Formulier Secties

### 1. Basic Info

| Field | Value |
|-------|-------|
| Server Name | Praat met je Boekhouding |
| Description | Connect to your Exact Online accounting in natural language. View invoices, revenue, cashflow and more. |
| Category | Finance / Accounting |
| Pricing | Freemium |
| Website | https://praatmetjeboekhouding.nl |

### 2. Authentication

| Field | Value |
|-------|-------|
| Auth Type | OAuth 2.1 with PKCE |
| Transport | Streamable HTTP (SSE) |
| Token Endpoint | https://api.praatmetjeboekhouding.nl/oauth/token |
| Authorization Endpoint | https://api.praatmetjeboekhouding.nl/oauth/authorize |

### 3. Test Account

| Field | Value |
|-------|-------|
| Demo URL | https://api.praatmetjeboekhouding.nl/demo/exa_demo |
| Login Required | No |
| Sample Data | Yes - Bakkerij De Gouden Croissant B.V. |
| Credentials Expire | Never |

### 4. Server Details

- 47 tools listed
- All tools have annotations (readOnlyHint, destructiveHint, etc.)
- No resources (future feature)
- No prompts (future feature)

### 5. Skills & Plugins

Skipped - toekomstige features:
- MCP Prompts (workflow templates)
- Claude Agent Skills
- Claude Code Plugin

### 6. Checklist

All confirmed:
- [x] Server is live and production-ready
- [x] Privacy policy published
- [x] Terms of service published
- [x] No cross-service automation
- [x] No financial transactions
- [x] Company owns the API being connected

---

## Wacht Op

- Review door Anthropic team
- Eventuele vragen/clarificaties
- Listing in claude.com/connectors

---

## Claude Desktop Setup (Workaround)

Tot de directory listing live is, kunnen users de connector handmatig toevoegen:

### Via Custom Connector UI (werkt niet betrouwbaar)

Bug #5826 in Claude Desktop: Custom Connector UI werkt niet correct voor remote servers.

### Via Config File (aanbevolen)

**Demo Mode:**
```json
{
  "mcpServers": {
    "exact-online-demo": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://api.praatmetjeboekhouding.nl/demo/exa_demo"]
    }
  }
}
```

**Productie (OAuth):**
```json
{
  "mcpServers": {
    "exact-online": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://api.praatmetjeboekhouding.nl/mcp"]
    }
  }
}
```

### Config Locaties

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

---

## Technical Requirements (Claude Specific)

### Tool Annotations (Verplicht)

```typescript
{
  readOnlyHint: true,      // We only read data
  destructiveHint: false,  // We don't delete anything
  idempotentHint: true,    // Same call = same result
  openWorldHint: true,     // External API interaction
}
```

### OAuth 2.1 Requirements

- PKCE (Proof Key for Code Exchange) verplicht
- State parameter gesigneerd met HMAC
- Protected Resource Metadata endpoint
- Dynamic Client Registration (optioneel)

### Transport Requirements

- Streamable HTTP (aanbevolen voor Claude)
- SSE (Server-Sent Events) ondersteund
- HTTPS verplicht

---

## Referenties

- Claude Connector Directory: https://claude.com/connectors
- MCP Specification: https://modelcontextprotocol.io
- Tool Annotations Spec: https://modelcontextprotocol.io/specification/2024-11-05/server/tools#tool-annotations

---

*Document created: 2 februari 2026*
