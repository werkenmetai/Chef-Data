# MCP Lessons Learned

**Beheerder:** Ruben (MCP Specialist)
**Laatste update:** 2026-01-29 (4e update - parameter documentatie)

Dit document bevat unieke lessen uit PRs, errors en oplossingen.

---

## Lesson: WWW-Authenticate header mist resource_metadata

**Datum:** 2026-01-28
**PR:** OAuth fix commit
**Ernst:** High

### Probleem
Claude Desktop gaf "Invalid authorization" error na OAuth flow.

### Root Cause
WWW-Authenticate header was incompleet. RFC 9728 Section 5.1 vereist `resource_metadata` parameter voor OAuth discovery.

### Oplossing
Header aangepast van:
```
Bearer realm="...", resource="..."
```
Naar:
```
Bearer realm="...", resource="...", resource_metadata=".../\.well-known/oauth-protected-resource"
```

### Code Voorbeeld
```typescript
// Before (fout)
return `Bearer realm="${baseUrl}", resource="${baseUrl}"`;

// After (correct)
return `Bearer realm="${baseUrl}", resource="${baseUrl}", resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`;
```

### Preventie
- Altijd RFC 9728 raadplegen voor OAuth headers
- MCP spec compliance checklist bijhouden

---

## Lesson: Protected Resource Metadata mist scopes_supported

**Datum:** 2026-01-28
**PR:** OAuth fix commit
**Ernst:** Medium

### Probleem
MCP clients konden niet ontdekken welke scopes ondersteund worden.

### Root Cause
`scopes_supported` field ontbrak in `/.well-known/oauth-protected-resource` response.

### Oplossing
Field toegevoegd aan metadata response.

### Code Voorbeeld
```typescript
// Before (fout)
const metadata = {
  resource: baseUrl,
  authorization_servers: [baseUrl],
  bearer_methods_supported: ['header'],
};

// After (correct)
const metadata = {
  resource: baseUrl,
  authorization_servers: [baseUrl],
  bearer_methods_supported: ['header'],
  scopes_supported: ['mcp:tools', 'mcp:resources', 'openid', 'profile'],
};
```

### Preventie
- Check MCP spec voor verplichte metadata fields
- Vergelijk met referentie implementaties

---

## Lesson: OAuth token valid maar user bestaat niet

**Datum:** 2026-01-28
**PR:** OAuth fix commit
**Ernst:** High

### Probleem
OAuth token werd succesvol gevalideerd maar authenticatie faalde met "Invalid API key".

### Root Cause
OAuth flow creëert token met `user_id`, maar user moet EERST Exact Online koppelen om in `users` tabel te komen. Als user direct OAuth probeert zonder Exact koppeling, faalt de user lookup.

### Oplossing
Specifieke error message toegevoegd wanneer OAuth token valid is maar user niet bestaat.

### Code Voorbeeld
```typescript
// Before (fout)
if (userResult) {
  authContext = { ... };
}
// Fallback to API key -> fails with generic error

// After (correct)
if (userResult) {
  authContext = { ... };
} else {
  oauthUserMissing = true;
}

if (oauthUserMissing) {
  return new Response(JSON.stringify({
    error: {
      code: -32003,
      message: 'Account setup incomplete. Please connect your Exact Online account first...',
    },
  }), { status: 403 });
}
```

### Preventie
- Altijd expliciete error handling voor elk auth scenario
- Nooit silent fallthrough naar andere auth methodes

---

## Lesson: CORS headers moeten dynamisch zijn

**Datum:** 2026-01-27
**Commit:** 7a4d955
**Ernst:** High

### Probleem
CORS errors in browser bij MCP calls. `corsHeaders` constant werkte niet correct.

### Root Cause
CORS headers werden als statische constant gedefinieerd, maar moeten dynamisch gegenereerd worden op basis van de request origin.

### Oplossing
`corsHeaders` constant vervangen door `getCorsHeaders(request, env)` function calls.

### Code Voorbeeld
```typescript
// Before (fout)
const corsHeaders = { 'Access-Control-Allow-Origin': '*' };
return new Response(..., { headers: corsHeaders });

// After (correct)
return new Response(..., { headers: getCorsHeaders(request, env) });
```

### Preventie
- Gebruik altijd functies voor dynamische headers
- Test CORS met echte browser requests, niet alleen curl

---

## Lesson: CORS wildcard (*) is security risico

**Datum:** 2026-01-27
**Commit:** 6c42080
**Ernst:** High

### Probleem
SEC-002: CORS stond alle origins toe met wildcard (*).

### Root Cause
Quick-and-dirty development zonder security review.

### Oplossing
Whitelist van toegestane origins:
- praatmetjeboekhouding.nl (productie)
- localhost:* (development)
- *.pages.dev (staging)

### Code Voorbeeld
```typescript
// Before (fout)
'Access-Control-Allow-Origin': '*'

// After (correct)
const allowedOrigins = [
  'https://praatmetjeboekhouding.nl',
  /^http:\/\/localhost:\d+$/,
  /\.pages\.dev$/,
];
// Validate origin against whitelist
```

### Preventie
- Nooit wildcard CORS in productie
- CORS whitelist configureerbaar maken per environment
- Security review voor elke API change

---

## Lesson: XSS via innerHTML

**Datum:** 2026-01-27
**Commit:** 6c42080
**Ernst:** High

### Probleem
SEC-001: 17 plekken met `innerHTML` waren kwetsbaar voor XSS.

### Root Cause
Dynamische content direct in DOM gezet zonder escaping.

### Oplossing
1. `escapeHtml()` utility gemaakt
2. Alle innerHTML vervangen door safe DOM API (createElement, textContent)

### Code Voorbeeld
```typescript
// Before (fout)
element.innerHTML = `<div>${userData}</div>`;

// After (correct)
const div = document.createElement('div');
div.textContent = userData;
element.appendChild(div);
```

### Preventie
- Nooit innerHTML met user data
- Gebruik textContent voor text
- Gebruik DOM API voor structuur
- ESLint regel voor innerHTML detectie

---

## Lesson: OAuth state moet gesigneerd zijn

**Datum:** 2026-01-27
**Commit:** 4081cfa
**Ernst:** High

### Probleem
OAuth state parameter kon getampered worden zonder detectie.

### Root Cause
State was alleen base64 encoded, niet cryptografisch gesigneerd.

### Oplossing
HMAC signature toegevoegd aan OAuth state. Unsigned states worden nu geweigerd.

### Code Voorbeeld
```typescript
// Before (fout)
const state = btoa(JSON.stringify({ redirectUri, ... }));

// After (correct)
const payload = JSON.stringify({ redirectUri, ... });
const signature = await hmacSign(payload, SESSION_SECRET);
const state = btoa(JSON.stringify({ payload, signature }));

// Bij validatie: verify signature before trusting state
```

### Preventie
- Alle security-gevoelige parameters cryptografisch beschermen
- SESSION_SECRET verplicht in productie
- Geen transition periods voor security fixes

---

## Lesson: CVE-2026-0621 - ReDoS kwetsbaarheid in MCP TypeScript SDK

**Datum:** 2026-01-28 (ontdekt via monitoring)
**Bron:** CVE-2026-0621, GitHub Issue #965
**Ernst:** High (CVSS 8.7)

### Probleem
De `@modelcontextprotocol/sdk` versies t/m 1.25.1 bevatten een Regular Expression Denial of Service (ReDoS) kwetsbaarheid in de `UriTemplate` class.

### Root Cause
De `partToRegExp()` functie in de UriTemplate class genereert dynamische regex patronen met geneste quantifiers bij het verwerken van RFC 6570 exploded array patterns. Bij bijna-matchende input triggert dit catastrophic backtracking: de regex engine probeert elke mogelijke permutatie van interne groepen.

### Impact
Een aanvaller kan een kwaadaardige URI sturen die de Node.js event loop blokkeert (100% CPU op een core). Geen data exfiltratie, maar volledige denial of service van de MCP server.

### Oplossing
Update `@modelcontextprotocol/sdk` naar versie >= 1.25.2.

```bash
# Check huidige versie
npm ls @modelcontextprotocol/sdk

# Update
npm install @modelcontextprotocol/sdk@latest
```

### Impact op onze connector
- **Controleer:** Gebruiken wij UriTemplate in onze server? Zo ja, is onze SDK versie >= 1.25.2?
- **Actie:** `npm audit` draaien op de connector codebase
- **Risico:** Als wij user-supplied URIs verwerken (bijv. Exact Online callback URLs), zijn we kwetsbaar

### Preventie
- Wekelijkse `npm audit` check opnemen in CI/CD
- Dependabot of Renovate configureren voor security updates
- Security advisories monitoren voor `@modelcontextprotocol/sdk`

---

## Lesson: MCP Apps Extension biedt UI mogelijkheden in chat

**Datum:** 2026-01-28 (ontdekt via monitoring)
**Bron:** SEP-1865, blog.modelcontextprotocol.io
**Ernst:** Informational (kans)

### Wat is het?
MCP Apps (SEP-1865) is de eerste officieel MCP extension. Het stelt MCP servers in staat om interactieve UI te presenteren aan gebruikers via sandboxed iframes in de chat client.

### Hoe werkt het?
1. Een tool declareert een `_meta.ui.resourceUri` field dat naar een `ui://` resource wijst
2. De MCP server serveert HTML/JS als resource
3. De host (Claude, ChatGPT, VS Code) rendert dit in een sandboxed iframe
4. Bidirectionele communicatie via JSON-RPC over postMessage

### Kans voor onze connector
Dit opent mogelijkheden voor interactieve Exact Online ervaringen in chat:
- **Interactief dashboard:** Omzet, winst/verlies, liquiditeit visueel tonen
- **Factuur preview:** PDF inline weergeven met markering
- **Configuratie wizard:** Stapsgewijs Exact Online koppeling instellen
- **Data exploratie:** Filters, drill-down in financiele data

### SDK
```bash
npm install @modelcontextprotocol/ext-apps
```

### Architectuur overwegingen
- UI resources worden via `ui://` scheme geserved
- Alle communicatie is loggable (audit trail)
- Sandboxed: geen toegang tot parent DOM, cookies, of local storage
- User consent vereist voor UI-initiated tool calls

### Preventie / Volgende stappen
- Evalueer of MCP Apps waardevol is voor onze connector (P3 backlog)
- Test met Claude en ChatGPT als host
- Overweeg interactieve onboarding flow als eerste use case

---

## Lesson: OAuth SEPs veranderen hoe MCP OAuth werkt

**Datum:** 2026-01-28 (ontdekt via monitoring)
**Bron:** SEP-991, SEP-1299, MCP Core Maintainer Update jan 2026
**Ernst:** Medium (toekomstige impact)

### Wat verandert er?
Twee significante Spec Enhancement Proposals zijn in review die onze OAuth implementatie kunnen beinvloeden:

**SEP-991: OAuth Client ID Metadata Documents**
- Stelt servers in staat om client identiteiten te verifieren via domain-hosted metadata
- Vervangt de noodzaak voor anonieme Dynamic Client Registration (DCR)
- Impact: Onze DCR implementatie moet mogelijk aangepast worden

**SEP-1299: OAuth flow management van client naar server**
- Verplaatst OAuth flow management van MCP clients naar MCP servers
- Gebruikt HTTP Message Signatures voor session binding
- Impact: Potentieel grote refactor van onze OAuth flow

**DPoP (Demonstrating Proof-of-Possession)**
- Status: SHOULD (niet MUST) in huidige spec
- Bindt access tokens cryptografisch aan de client die ze heeft aangevraagd
- Voorkomt token theft/replay attacks
- Impact: Als dit MUST wordt, moeten alle clients DPoP implementeren

### Tijdlijn
- Q1 2026: SEPs worden gefinaliseerd
- Juni 2026: Volgende spec release
- Implementatie deadline: Afhankelijk van transition period na juni 2026

### Impact op onze connector
- **DCR:** Als SEP-991 wordt aangenomen, moeten we client metadata documents hosten op ons domein
- **OAuth flow:** Als SEP-1299 wordt aangenomen, verschuift de verantwoordelijkheid voor OAuth management naar onze server
- **DPoP:** Als DPoP MUST wordt, moeten we token binding implementeren

### Preventie / Volgende stappen
- SEP-991 en SEP-1299 wekelijks monitoren op GitHub
- Architectuur flexibel houden voor OAuth changes
- Begin Q2 2026: impact assessment doen op basis van gefinaliseerde SEPs
- DPoP implementatie als SHOULD alvast overwegen (security best practice)

---

## Lesson: MCP is nu Linux Foundation eigendom - governance impact

**Datum:** 2026-01-28 (ontdekt via monitoring)
**Bron:** Agentic AI Foundation (AAIF) aankondiging 9 dec 2025
**Ernst:** Low (governance)

### Wat is er gebeurd?
Op 9 december 2025 heeft Anthropic het Model Context Protocol gedoneerd aan de Agentic AI Foundation (AAIF), een directed fund onder de Linux Foundation. De AAIF is co-founded door Anthropic, Block, en OpenAI.

### Wat betekent dit?
- **Neutraliteit:** MCP is nu vendor-neutraal en community-driven
- **Governance:** AAIF Governing Board beslist over strategie, budget, en nieuwe projecten
- **Technisch:** Maintainers behouden volledige autonomie over technische richting
- **SEP proces:** Blijft ongewijzigd als mechanisme voor spec changes
- **Adoptie:** 97 miljoen maandelijkse SDK downloads, 10.000+ actieve servers

### Impact op onze connector
- **Positief:** Geen vendor lock-in risico meer; MCP wordt breed gedragen
- **Positief:** OpenAI (ChatGPT) is nu mede-eigenaar, wat bredere client support garandeert
- **Neutraal:** Technisch verandert er niets aan het protocol
- **Aandachtspunt:** Nieuwe governance kan leiden tot snellere spec evolutie

### Preventie / Volgende stappen
- AAIF governance besluiten monitoren
- Geen directe actie nodig
- Blog.modelcontextprotocol.io toevoegen aan monitoring URLs (gedaan in VERSION.md)

---

## Lesson: Filter & Select is het Kernprincipe

**Datum:** 2026-01-29
**Bron:** Product insight (Matthijs)
**Ernst:** Foundational

### Het Inzicht

> Des te beter de MCP filters kan toepassen en de juiste kolommen selecteert, des te sneller het werkt met minder fouten.

Dit is geen optimalisatie maar een **fundamenteel principe** dat de kwaliteit van de hele connector bepaalt.

### Waarom Dit Zo Belangrijk Is

```
Slechte Query:  Alle 10.000 records → timeout, rate limit, truncatie, errors
Goede Query:    50 relevante records → snel, betrouwbaar, schoon
```

| Factor | Impact van Slechte Queries | Impact van Goede Queries |
|--------|---------------------------|--------------------------|
| Performance | Trage responses, timeouts | Snelle responses |
| Betrouwbaarheid | Rate limits, errors | Stabiele werking |
| Kosten | Meer API calls, tokens | Efficiënt gebruik |

### De Twee Pilaren

**1. OData $filter - API-level filtering**
```typescript
// SLECHT: Haalt alles op, filtert in code
const all = await api.get('/Accounts');
const active = all.filter(a => !a.Blocked);

// GOED: Database doet het werk
const endpoint = '/Accounts?$filter=Blocked eq false';
const active = await api.get(endpoint);
```

**2. OData $select - Alleen benodigde kolommen**
```typescript
// SLECHT: 50+ velden per record
const endpoint = '/Accounts';

// GOED: Alleen wat we nodig hebben
const endpoint = '/Accounts?$select=ID,Code,Name,Email';
```

### Impact op Tool Design

| Aspect | Vereiste |
|--------|----------|
| Tool descriptions | Duidelijk wanneer en waarvoor te gebruiken |
| Input schema | Filter parameters expliciet aanbieden |
| Defaults | Verstandige defaults (limit=100, active_only=true) |
| API calls | Filter op API niveau, niet achteraf |

### Documentatie

Zie: `docs/knowledge/mcp/MCP-DESIGN-PRINCIPLES.md` voor uitgebreide uitleg en implementatie checklist.

### Preventie

- [ ] Elke nieuwe tool reviewen op filter/select gebruik
- [ ] Geen `any[]` responses - altijd getypte, gefilterde data
- [ ] Tool descriptions moeten filter-mogelijkheden beschrijven
- [ ] Default limits en active filters in elke tool

---

## Lesson: Documenteer ALLE Tool Parameters

**Datum:** 2026-01-29
**Bron:** Documentatie review
**Ernst:** Medium

### Het Probleem

Tool parameters waren verspreid over meerdere documenten:
- `docs/tools.md` - beperkte parameter lijsten
- Tool source code - complete parameters
- Geen centrale mapping naar OData filters

### De Oplossing

Gecreëerd: `docs/knowledge/exact/API-FILTERS.md` met:
1. **Exact Online API filters** - per endpoint welke velden filterbaar zijn
2. **MCP Tool Parameters** - per tool alle parameters met OData mapping
3. **Filter implementatie status** - welke filters daadwerkelijk werken

### Voorbeeld

```markdown
| Tool | Parameter | Type | OData Filter | Beschrijving |
|------|-----------|------|--------------|--------------|
| `get_outstanding_invoices` | `customer_id` | string | `AccountId eq guid'...'` | Filter op klant |
| | `overdue_only` | boolean | `DueDate lt datetime'...'` | Alleen vervallen |
```

### Preventie

- [ ] Bij elke nieuwe parameter: update API-FILTERS.md
- [ ] Bij elke nieuwe tool: documenteer alle parameters met OData mapping
- [ ] Quarterly review: zijn alle parameters gedocumenteerd?

### Referenties

- `docs/knowledge/exact/API-FILTERS.md` - complete parameter documentatie
- `docs/tools.md` - gebruikersdocumentatie (kort)
- `docs/knowledge/mcp/MCP-DESIGN-PRINCIPLES.md` - design principes

---

## Lesson: /mcp/{api_key} POST returns 404 (agents/mcp handler bug)

**Datum:** 2026-01-31
**Bron:** Claude Code MCP connectie troubleshooting
**Ernst:** High

### Probleem

POST requests naar `/mcp/{api_key}` retourneerden "Not Found" (404), terwijl GET requests werkten. Dit brak Claude Code integratie met API key authenticatie.

### Root Cause

De `createMcpHandler` van Cloudflare's `agents/mcp` package verwacht requests op exact `/mcp`. Wanneer een request binnenkomt op `/mcp/exa_xxxx`, herkent de handler dit pad niet en retourneert 404.

### Symptomen

```bash
# Dit werkte (GET)
curl https://api.praatmetjeboekhouding.nl/mcp/exa_xxx
# → 200 OK met instructies

# Dit faalde (POST)
curl -X POST https://api.praatmetjeboekhouding.nl/mcp/exa_xxx -d '...'
# → 404 Not Found
```

### Oplossing

URL rewriting toegevoegd vóór de handler wordt aangeroepen:

```typescript
// FIX: Rewrite /mcp/{api_key} to /mcp for the handler
let handlerRequest = request;
if (pathMatch && pathMatch[1] === 'mcp') {
  const rewrittenUrl = new URL(request.url);
  rewrittenUrl.pathname = '/mcp';
  handlerRequest = new Request(rewrittenUrl.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
}

response = await mcpHandler(handlerRequest, env, ctx);
```

### Gerelateerde Fix

De instructies in de GET response waren ook verkeerd - ze suggereerden Bearer header authenticatie i.p.v. key-in-URL. Dit is ook gecorrigeerd.

### Preventie

- Test altijd beide GET en POST bij endpoint changes
- Document welke handler welk URL patroon verwacht
- Claude Code MCP test toevoegen aan CI/CD

### Commit

PR/Commit: fix: rewrite /mcp/{key} URL for agents/mcp handler (2026-01-31)

---

## Lesson: list_divisions toont "Token verlopen" terwijl API werkt

**Datum:** 2026-01-31
**Bron:** MCP test troubleshooting
**Ernst:** Medium (misleidend voor gebruikers)

### Probleem

`list_divisions` tool meldde `token_is_healthy: false` en `token_warning: "Token verlopen. Herauthenticatie vereist."` terwijl andere MCP tools gewoon werkten.

### Root Cause

De `list_divisions` tool doet **geen** Exact Online API calls - het leest alleen cached divisions uit de database. Daardoor wordt het token niet automatisch ververst door `exactRequest()`, maar de `getTokenStatus()` check meldt wel dat het verlopen is gebaseerd op de oude `token_expires_at` in de database.

```
Timeline:
1. Token verloopt in database
2. list_divisions wordt aangeroepen
3. getTokenStatus() checkt tokenExpiresAt → "verlopen"
4. Geen API call → geen automatische refresh
5. Misleidende warning naar gebruiker
6. Volgende tool (bijv. get_revenue) refresht wel → werkt gewoon
```

### Oplossing

Proactieve token refresh toegevoegd aan `list_divisions` vóór status rapportage:

```typescript
private async ensureTokenFresh(connection: ConnectionInfo): Promise<ConnectionInfo> {
  const now = Date.now();
  const expiresAt = connection.tokenExpiresAt.getTime();
  const bufferMs = 3 * 60 * 1000; // 3 minutes buffer

  // If token is valid, return as-is
  if (expiresAt - now > bufferMs) {
    return connection;
  }

  // Token expired or expiring soon - try to refresh
  try {
    await this.refreshToken(connection);
    return connection; // mutated with new tokenExpiresAt
  } catch {
    return connection; // refresh failed, status will show expired
  }
}
```

### Resultaat

| Voor | Na |
|------|-----|
| `token_is_healthy: false` | `token_is_healthy: true` |
| `token_expires_in_seconds: 0` | `token_expires_in_seconds: 600` |
| `token_warning: "Token verlopen..."` | Geen warning |

### Preventie

- Tools die geen API calls doen maar token status rapporteren moeten proactief refreshen
- Overweeg centraliseren van token refresh logic voor alle status-rapporterende tools
- Test MCP tools na lange idle periods om token edge cases te vinden

### Commit

PR #120: fix: proactively refresh token in list_divisions tool (2026-01-31)

---

## Lesson: Demo Mode voor App Store Demonstraties

**Datum:** 2026-01-31
**Bron:** App Store goedkeuringsproces
**Ernst:** Medium (feature)

### Het Probleem

Voor de Exact Online App Store demonstratie willen we screenshots maken zonder echte klantdata te tonen. Dit vereist:
1. Realistische nep-data die eruitziet als echte boekhouding
2. Geen OAuth login nodig (voor snelle demos)
3. Dezelfde tool responses als de productie versie

### De Oplossing

Demo mode geïmplementeerd met API key prefix `exa_demo`:

```
apps/mcp-server/src/demo/
├── index.ts              # Exports + getDemoResponse
├── context.ts            # Demo AuthContext + isDemoApiKey helper
├── data/
│   ├── company.ts        # Bakkerij De Gouden Croissant B.V.
│   ├── relations.ts      # 20 klanten/leveranciers
│   ├── invoices.ts       # 50 facturen (mix open/betaald/verlopen)
│   └── transactions.ts   # 6 maanden banktransacties
└── generators/
    ├── index.ts          # Tool-to-generator mapping
    ├── divisions.ts      # list_divisions response
    ├── relations.ts      # get_relations, search_relations
    ├── invoices.ts       # get_*_invoices
    └── financial.ts      # get_bank_transactions, get_cashflow_forecast
```

### Hoe Het Werkt

1. API key check in auth flow:
```typescript
if (isDemoApiKey(token)) {
  return createDemoAuthContext(); // Skip OAuth, DB lookups
}
```

2. Demo response in tool execution:
```typescript
if (authContext?.isDemoMode) {
  const demoResponse = getDemoResponse(toolName, params);
  if (demoResponse) return demoResponse;
}
```

### Demo Data Overzicht

| Categorie | Aantal | Details |
|-----------|--------|---------|
| Klanten | 14 | Hotel Krasnapolsky, Restaurant De Vier Pilaren, etc. |
| Leveranciers | 6 | Meelgroothandel Van der Molen, etc. |
| Verkoopfacturen | 35 | 60% betaald, 25% open, 15% verlopen |
| Inkoopfacturen | 15 | 67% betaald, 20% open, 13% verlopen |
| Banktransacties | ~150 | 6 maanden, realistische cashflow |
| Openstaand (debiteur) | ~€12.500 | Realistisch MKB niveau |
| Openstaand (crediteur) | ~€4.200 | Realistisch MKB niveau |

### Ondersteunde Demo Tools

- `list_divisions`
- `get_relations` / `search_relations`
- `get_sales_invoices` / `get_purchase_invoices` / `get_outstanding_invoices`
- `get_bank_transactions`
- `get_cashflow_forecast`

### Gebruik

```bash
# Via Claude Code MCP
claude mcp add exact-online-demo https://api.praatmetjeboekhouding.nl/mcp/exa_demo --transport http

# Via curl
curl -X POST https://api.praatmetjeboekhouding.nl/sse/exa_demo \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/call","params":{"name":"get_outstanding_invoices","arguments":{}}}'
```

### ~~Beperking: Claude Desktop OAuth Discovery~~ ✅ OPGELOST

~~Claude Desktop Custom Connector detecteert OAuth via `.well-known/oauth-authorization-server` op de base URL. Dit betekent dat zelfs met demo key, Claude Desktop OAuth login vereist.~~

**OPLOSSING (1 feb 2026):** Nieuw `/demo/{demo_key}` endpoint dat OAuth volledig skipt.

### Claude Desktop Demo URL (NIEUW)

```
https://api.praatmetjeboekhouding.nl/demo/exa_demo
```

Dit endpoint:
- Heeft GEEN OAuth discovery (geen `.well-known` check)
- Retourneert direct MCP initialize response
- Werkt in Claude Desktop als Custom Connector

**Stappen Claude Desktop:**
1. Settings → Connectors → Add custom connector
2. URL: `https://api.praatmetjeboekhouding.nl/demo/exa_demo`
3. Klik Add → Direct verbonden met demo data

**Beschikbare demo keys:**
- `exa_demo` of `exa_demo_bakkerij` - Bakkerij De Gouden Croissant
- `exa_demo_it` - TechVision Consultancy (IT)
- `exa_demo_advocaat` - Van der Berg & Partners (Juridisch)
- `exa_demo_aannemer` - Bouwbedrijf De Fundatie (Bouw)

### Preventie

- [x] ~~Aparte demo subdomain overwegen voor Claude Desktop~~ → `/demo` endpoint
- [ ] Demo data periodiek reviewen op realisme
- [ ] Nieuwe tools toevoegen aan demo generators

### Commits

- df7c7b4: feat: add demo mode for App Store demonstrations
- c09aa2e: fix: skip OAuth for demo keys in HEAD requests
- a92d146: feat: add /demo endpoint for Claude Desktop without OAuth

---

## Lesson: Claude Connector Directory Vereisten

**Datum:** 2026-02-01
**Bron:** Claude Connector submission formulier
**Ernst:** HIGH (blocker voor directory listing)

### Overzicht

Om geaccepteerd te worden in de Claude Connector Directory moet een MCP server voldoen aan specifieke technische, documentatie en policy vereisten.

### Technische Vereisten

| Vereiste | Status | Hoe implementeren |
|----------|--------|-------------------|
| **Tool Annotations** | ✅ | Elke tool moet `annotations` hebben met `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint` |
| **OAuth 2.0/2.1** | ✅ | Volledige OAuth implementatie voor authenticated tools |
| **HTTPS** | ✅ | Server alleen bereikbaar via HTTPS |
| **CORS** | ✅ | Correct geconfigureerd voor browser-based auth |
| **Streamable HTTP** | ⚠️ | Aanbevolen (SSE wordt mogelijk deprecated) |

### Tool Annotations (VERPLICHT)

```typescript
// Elke tool MOET annotations hebben
definition: ToolDefinition = {
  name: 'tool_name',
  description: '...',
  inputSchema: { ... },
  annotations: {
    readOnlyHint: true,      // true = alleen lezen, geen wijzigingen
    destructiveHint: false,  // true = kan data verwijderen
    idempotentHint: true,    // true = meerdere calls = zelfde resultaat
    openWorldHint: true,     // true = interactie met externe API
  },
};
```

### Documentatie Vereisten

| Document | URL | Verplicht |
|----------|-----|-----------|
| Setup instructions | /docs of README | ✅ Ja |
| Tool descriptions | In tool definitions | ✅ Ja |
| Troubleshooting guide | /docs/troubleshooting | ✅ Ja |
| Privacy policy | /privacy | ✅ Ja |
| Terms of service | /voorwaarden | ✅ Ja |
| DPA (verwerkersovereenkomst) | /verwerkersovereenkomst | Optioneel |

### Test Account Vereisten

| Vereiste | Onze implementatie |
|----------|-------------------|
| Sample data beschikbaar | Demo mode met `exa_demo` key |
| Credentials 30+ dagen geldig | Demo keys verlopen niet |
| Direct testbare URL | `https://api.praatmetjeboekhouding.nl/mcp/exa_demo` |
| Geen config nodig | API key embedded in URL |

### Branding Vereisten

| Item | Formaat | Locatie |
|------|---------|---------|
| Logo | SVG (1:1 vierkant) | `/favicon.svg` |
| Favicon | ICO (voor Google) | `/favicon.ico` |
| Screenshots | PNG/JPG | Promotional materials |

**Let op:** Google's favicon service (`google.com/s2/favicons?domain=...`) vereist `/favicon.ico`, niet alleen `.svg`.

### Policy Compliance

Voor directory listing moet de server:
- ❌ GEEN cross-service automation enablen
- ❌ GEEN geld/crypto transfers uitvoeren
- ❌ GEEN financiële transacties uitvoeren
- ✅ Eigendom zijn van de company die de API beheert
- ✅ Live en production-ready zijn

### Optionele Uitbreidingen

| Feature | Beschrijving | Status |
|---------|--------------|--------|
| MCP Prompts | Voorgedefinieerde workflow templates | BACKLOG |
| Agent Skills | Modulaire capabilities voor Claude | BACKLOG |
| Claude Code Plugin | Slash commands en agents | BACKLOG |

### Formulier Structuur (6 pagina's)

1. **Basic Info** - Naam, beschrijving, URLs, pricing
2. **Authentication** - OAuth endpoints, transport type
3. **Test Account** - Demo credentials, setup instructions
4. **Server Details** - Tools lijst, annotations, resources
5. **Skills & Plugins** - Optionele uitbreidingen
6. **Checklist** - Policy, technical, docs, testing confirmatie

### Preventie Checklist

Bij nieuwe MCP servers of updates:
- [ ] Tool annotations toegevoegd aan alle tools
- [ ] OAuth endpoints gedocumenteerd
- [ ] Demo mode met embedded API key URL
- [ ] Privacy policy en ToS gepubliceerd
- [ ] Favicon.ico aanwezig (niet alleen .svg)
- [ ] HTTPS enforced
- [ ] Streamable HTTP support (toekomstbestendig)

### Referenties

- Claude Connector Directory: https://claude.com/connectors
- MCP Tool Annotations Spec: https://modelcontextprotocol.io/specification/2024-11-05/server/tools#tool-annotations
- OAuth 2.1 voor MCP: RFC 9728
