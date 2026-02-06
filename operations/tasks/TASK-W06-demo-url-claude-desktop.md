# TASK-W06: Demo URL werkend maken in Claude Desktop

**Aangemaakt:** 2026-02-01
**Status:** ✅ VOLTOOID (1 feb 2026)
**Prioriteit:** 🔴 HOOG (blokkeert Anthropic review)
**Eigenaar:** Ruben (MCP) + Daan (Backend)
**Geschatte tijd:** 30 minuten

---

## Context

De Claude Connector Directory submission is ingediend (1 feb 2026) met demo URL:
```
https://api.praatmetjeboekhouding.nl/mcp/exa_demo
```

**Probleem:** Claude Desktop kan deze URL niet gebruiken als Custom Connector omdat:
1. Claude Desktop doet eerst OAuth discovery via `/.well-known/oauth-authorization-server`
2. Server geeft 401 + OAuth challenge terug
3. Demo users hebben geen Exact Online account → OAuth faalt

**Gewenste situatie:** Demo URL werkt direct in Claude Desktop zonder OAuth.

---

## Technische Oplossing

### Stap 1: Detect demo key VÓÓR OAuth check

**Bestand:** `apps/mcp-server/src/index.ts` (rond line 495)

**Voeg toe VÓÓR `validateOAuthBearerToken()` call:**

```typescript
// Demo Mode: Check for demo API key in URL BEFORE OAuth
const pathMatchDemo = url.pathname.match(/^\/(mcp|sse)\/([a-zA-Z0-9_]+)$/);
const demoTokenInPath = pathMatchDemo ? pathMatchDemo[2] : null;

if (demoTokenInPath && isDemoApiKey(demoTokenInPath)) {
  // Demo mode: skip OAuth entirely, use demo credentials
  const industry = parseDemoIndustry(demoTokenInPath);
  setCurrentDemoIndustry(industry);
  const demoAuthContext = createDemoAuthContext(demoTokenInPath);

  // Continue with normal MCP handling for demo
  const rateLimit = { allowed: true, limit: Infinity, remaining: Infinity };
  return handleMCPRequest(request, env, ctx, demoAuthContext, rateLimit);
}
```

### Stap 2: Skip OAuth discovery voor demo paths

**Bij de `/.well-known/oauth-authorization-server` handler:**

Check of de request van een demo URL komt en geef dan GEEN OAuth metadata terug, of geef een speciale response die aangeeft dat geen auth nodig is.

### Stap 3: Test

```bash
# Test 1: Direct MCP call (moet werken zonder OAuth)
curl -X POST "https://api.praatmetjeboekhouding.nl/mcp/exa_demo" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'

# Test 2: Claude Desktop
# 1. Settings → Connectors → Add custom connector
# 2. URL: https://api.praatmetjeboekhouding.nl/mcp/exa_demo
# 3. Moet DIRECT tools tonen, GEEN OAuth login
```

---

## Acceptatiecriteria

- [x] Demo URL werkt in Claude Desktop als Custom Connector
- [x] Geen OAuth login vereist voor demo keys
- [x] Demo data wordt correct geretourneerd (Bakkerij De Gouden Croissant)
- [x] Normale OAuth flow blijft werken voor echte users
- [x] Gedocumenteerd in LESSONS-LEARNED.md

---

## Oplossing Geïmplementeerd

**Nieuwe endpoint:** `/demo/{demo_key}`

```
https://api.praatmetjeboekhouding.nl/demo/exa_demo
```

Dit endpoint skipt OAuth discovery volledig en retourneert direct MCP responses.

**Commit:** a92d146 - feat: add /demo endpoint for Claude Desktop without OAuth

---

## Referenties

- **Analyse:** Agent a2b568b (Explore) - volledige OAuth/demo flow analyse
- **Demo implementatie:** `apps/mcp-server/src/demo/`
- **OAuth implementatie:** `apps/mcp-server/src/auth/oauth.ts`
- **MCP Lessons:** `docs/knowledge/mcp/LESSONS-LEARNED.md:750`

---

## Waarom dit belangrijk is

1. **Anthropic Review:** Ze kunnen onze connector niet testen zonder werkende demo
2. **App Store Demo:** Exact partnermanager demo vereist werkende screenshots
3. **Onboarding:** Nieuwe users kunnen proberen zonder Exact account

---

*Aangemaakt door Piet (Orchestrator) op verzoek van Matthijs*
