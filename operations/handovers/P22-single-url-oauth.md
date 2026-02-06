# P22: Single URL + OAuth voor MCP App Store

> **Status:** 🔄 BIJNA VOLTOOID - Claude Desktop fix moet nog getest
> **Prioriteit:** KRITIEK - Blokkeert App Store publicatie
> **Geschatte omvang:** Medium (2-3 dagen)
> **Datum:** 2026-01-30
> **Laatste update:** 2026-01-30 23:45

## Implementatie Status

| Fase | Status | Commit |
|------|--------|--------|
| Fase 1: Database migration | ✅ Done | `d91513e` |
| Fase 2: OAuth validator | ✅ Done | `d91513e` |
| Fase 3: Auth context | ✅ Done | `d91513e` |
| Fase 4: Router update | ✅ Done | `d91513e` |
| Fase 5: Onboarding flow | ✅ Done | `d91513e` |
| Fase 6: Testing | 🔄 Claude Desktop test nodig | `fd14052` |

### Fixes toegepast tijdens implementatie

| Issue | Fix | Commit |
|-------|-----|--------|
| Astro checkOrigin blokkeerde POST | `checkOrigin: false` in astro.config | `f63f684` |
| CSP form-action blokkeerde consent form | form-action directive verwijderd | `bea971e` |
| Dashboard API teller werkte niet | Leest nu van api_usage tabel | `f718234` |
| Localhost redirect via success page | Direct redirect | `82544e2` |
| OAuth login zonder Exact connectie | Redirect naar /connect eerst | `fd14052` |

### Geteste Scenarios

| Scenario | Status | Notes |
|----------|--------|-------|
| OAuth flow (browser test) | ✅ Werkt | httpbin.org redirect test |
| Token exchange | ✅ Werkt | Access + refresh token ontvangen |
| MCP initialize via OAuth | ✅ Werkt | curl test met Bearer token |
| ChatGPT Web | ✅ Werkt | Omzet ophalen werkt |
| ChatGPT Desktop | ✅ Werkt | Zelfde OAuth flow |
| Claude Desktop | 🔄 Fix deployed | GET /mcp + OAuth precondities - TEST NODIG |
| OAuth zonder Exact connectie | ✅ Gefixt | Redirect naar /connect eerst |
| Token refresh na 30 min | ✅ Gefixt | Verse tokens uit DB |
| Smart context in tools | ✅ Getest | suggestions, related_tools werken |

### Gefixte Issues (2026-01-30)

1. **Claude Desktop "button niet connected"** - GET /mcp gaf plain status ipv MCP initialize response
   - Fix: `apps/mcp-server/src/index.ts` - HTTP GET retourneert nu JSON-RPC format
   - Commit: `1f845d7`

2. **30-min disconnect / token refresh** - Cron refreshte tokens maar MCP had stale tokens in memory
   - Root cause: Memory/DB desynchronization bij token refresh
   - Fix: `apps/mcp-server/src/tools/_base.ts` - Haal verse tokens uit DB voordat we refreshen
   - Commit: `1f845d7`

---

## Executive Summary

We hebben bewezen dat ChatGPT EN Claude kunnen verbinden met onze MCP server. Nu moeten we van "token-in-URL" naar "OAuth identificatie" zodat we één URL kunnen publiceren in de App Stores.

**Van:**
```
ChatGPT → /sse/exa_abc123...  (token in URL)
Claude  → /mcp/exa_abc123...  (token in URL)
```

**Naar:**
```
Alle clients → /mcp (OAuth identificeert gebruiker)
```

---

## Huidige Architectuur (P21 - WERKT)

### Endpoints

| Endpoint | Transport | Client | Status |
|----------|-----------|--------|--------|
| `/sse/{token}` | SSE (Server-Sent Events) | ChatGPT | ✅ Werkt |
| `/mcp/{token}` | HTTP (Streamable) | Claude Code | ✅ Werkt |

### Code Flow (huidige situatie)

```
1. Client vraagt /sse/exa_TOKEN of /mcp/exa_TOKEN
2. index.ts extraheert token uit URL path
3. Token wordt gevalideerd tegen exact_tokens tabel
4. authContext.divisionCode wordt gezet
5. MCP tools gebruiken divisionCode voor Exact API calls
```

### Relevante Bestanden

| Bestand | Functie |
|---------|---------|
| `src/index.ts` | Main router, token extractie, transport selectie |
| `src/mcp/server.ts` | Onze eigen MCPServer class (voor SSE POST) |
| `src/auth/oauth.ts` | OAuth handlers (authorize, token, etc.) |
| `src/auth/token-validator.ts` | Token validatie logica |
| `src/lib/cors.ts` | CORS whitelist (ChatGPT domains toegevoegd) |

---

## Doel Architectuur (P22)

### Eén URL, Meerdere Transports

```
https://api.praatmetjeboekhouding.nl/mcp
```

### Transport Negotiation

| Accept Header | Transport |
|---------------|-----------|
| `text/event-stream` | SSE |
| `application/json` | HTTP Streamable |
| Geen/anders | HTTP Streamable (default) |

### OAuth Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ChatGPT   │     │  Onze MCP   │     │ Exact Online│
│   /Claude   │     │   Server    │     │    OAuth    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ 1. GET /mcp       │                   │
       │ ─────────────────>│                   │
       │                   │                   │
       │ 2. 401 + OAuth    │                   │
       │    metadata       │                   │
       │ <─────────────────│                   │
       │                   │                   │
       │ 3. OAuth dance    │                   │
       │ ─────────────────>│ ─────────────────>│
       │                   │                   │
       │ 4. Access token   │                   │
       │ <─────────────────│ <─────────────────│
       │                   │                   │
       │ 5. GET /mcp       │                   │
       │    + Bearer token │                   │
       │ ─────────────────>│                   │
       │                   │                   │
       │ 6. MCP response   │                   │
       │ <─────────────────│                   │
```

---

## Technische Vereisten

### 1. OAuth 2.1 met PKCE (RFC 7636)

ChatGPT en Claude gebruiken beide OAuth 2.1 met PKCE voor MCP authenticatie.

**Benodigde endpoints:**

| Endpoint | Functie | Status |
|----------|---------|--------|
| `/.well-known/oauth-authorization-server` | OAuth metadata discovery | ✅ Bestaat |
| `/oauth/authorize` | Authorization endpoint | ✅ Bestaat |
| `/oauth/token` | Token exchange | ✅ Bestaat |
| `/oauth/register` | Dynamic Client Registration | ✅ Bestaat |

### 2. Token → User Mapping

**Probleem:** Nu identificeren we users via `exa_` token in URL. Met OAuth moeten we:

1. OAuth access token ontvangen van client
2. Opzoeken welke Exact Online divisie bij deze user hoort
3. Exact API calls maken met juiste credentials

**Database wijziging nodig:**

```sql
-- Huidige tabel: exact_tokens
-- Bevat: division_code, access_token (Exact), refresh_token (Exact)

-- Nieuwe mapping nodig:
ALTER TABLE oauth_tokens ADD COLUMN exact_token_id TEXT REFERENCES exact_tokens(id);
```

Of nieuwe koppeltabel:

```sql
-- Multi-divisie support: user kan meerdere administraties koppelen
CREATE TABLE user_divisions (
  id TEXT PRIMARY KEY,
  oauth_user_id TEXT NOT NULL,      -- Van onze OAuth
  exact_token_id TEXT NOT NULL,     -- FK naar exact_tokens
  division_code TEXT NOT NULL,      -- Voor snelle lookup
  division_name TEXT,               -- Display naam voor selector
  is_default BOOLEAN DEFAULT true,  -- Welke divisie standaard gebruiken
  created_at TEXT DEFAULT (datetime('now'))
);
```

### 3. Transport Detection in index.ts

```typescript
// Nieuwe logica voor /mcp endpoint
if (path === '/mcp' || path === '/mcp/') {
  const acceptHeader = request.headers.get('Accept') || '';
  const isSSE = acceptHeader.includes('text/event-stream');

  // Beide transports, zelfde OAuth check
  const authResult = await validateOAuthToken(request, env);
  if (!authResult.valid) {
    return oauthChallenge(request, env);
  }

  // authContext bevat nu divisionCode via OAuth lookup
  const authContext = await getAuthContextFromOAuth(authResult.token, env);

  if (isSSE) {
    return handleSSETransport(request, env, ctx, authContext);
  } else {
    return handleHTTPTransport(request, env, ctx, authContext);
  }
}
```

---

## Implementatie Stappen

### Fase 1: Database Schema (Day 1 morning)

**Bestand:** `migrations/0004_user_divisions.sql`

```sql
-- Koppel OAuth users aan Exact divisies
CREATE TABLE IF NOT EXISTS user_divisions (
  id TEXT PRIMARY KEY,
  oauth_user_id TEXT NOT NULL,
  exact_token_id TEXT NOT NULL,
  division_code TEXT NOT NULL,
  is_default BOOLEAN DEFAULT true,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (exact_token_id) REFERENCES exact_tokens(id)
);

CREATE INDEX idx_user_divisions_oauth_user ON user_divisions(oauth_user_id);
CREATE INDEX idx_user_divisions_exact_token ON user_divisions(exact_token_id);
```

**Deploy:**
```bash
npx wrangler d1 execute exact-mcp-db --remote --file=migrations/0004_user_divisions.sql
```

### Fase 2: OAuth Token Validation (Day 1 afternoon)

**Bestand:** `src/auth/oauth-validator.ts` (nieuw)

```typescript
import { Env } from '../types';
import { createLogger } from '../lib/logger';

const logger = createLogger('oauth-validator');

interface OAuthValidationResult {
  valid: boolean;
  userId?: string;
  clientId?: string;
  scope?: string;
  error?: string;
}

export async function validateOAuthBearerToken(
  request: Request,
  env: Env
): Promise<OAuthValidationResult> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'missing_token' };
  }

  const token = authHeader.slice(7);
  const tokenHash = await hashToken(token);

  // Zoek token in database
  const result = await env.DB.prepare(`
    SELECT user_id, client_id, scope, access_token_expires_at, revoked_at
    FROM oauth_tokens
    WHERE access_token_hash = ?
  `).bind(tokenHash).first();

  if (!result) {
    return { valid: false, error: 'invalid_token' };
  }

  if (result.revoked_at) {
    return { valid: false, error: 'token_revoked' };
  }

  const expiresAt = new Date(result.access_token_expires_at as string);
  if (expiresAt < new Date()) {
    return { valid: false, error: 'token_expired' };
  }

  return {
    valid: true,
    userId: result.user_id as string,
    clientId: result.client_id as string,
    scope: result.scope as string | undefined,
  };
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Fase 3: Auth Context from OAuth (Day 1 afternoon)

**Bestand:** `src/auth/oauth-context.ts` (nieuw)

```typescript
import { Env, AuthContext } from '../types';
import { createLogger } from '../lib/logger';

const logger = createLogger('oauth-context');

export async function getAuthContextFromOAuth(
  userId: string,
  env: Env
): Promise<AuthContext | null> {
  // Haal default divisie op voor deze OAuth user
  const userDiv = await env.DB.prepare(`
    SELECT ud.division_code, ud.exact_token_id, et.access_token, et.refresh_token
    FROM user_divisions ud
    JOIN exact_tokens et ON ud.exact_token_id = et.id
    WHERE ud.oauth_user_id = ?
    AND ud.is_default = true
  `).bind(userId).first();

  if (!userDiv) {
    logger.warn('No division found for OAuth user', { userId });
    return null;
  }

  return {
    divisionCode: userDiv.division_code as string,
    exactAccessToken: userDiv.access_token as string,
    exactRefreshToken: userDiv.refresh_token as string,
    tokenId: userDiv.exact_token_id as string,
  };
}
```

### Fase 4: Update index.ts Router (Day 2 morning)

**Bestand:** `src/index.ts`

Wijzig de routing logica:

```typescript
// VOOR (huidige situatie):
// Token in URL: /mcp/exa_abc123 of /sse/exa_abc123

// NA (nieuwe situatie):
// OAuth op /mcp, transport via Accept header

import { validateOAuthBearerToken } from './auth/oauth-validator';
import { getAuthContextFromOAuth } from './auth/oauth-context';

// In de request handler:
if (path === '/mcp' || path === '/mcp/') {
  // Check OAuth Bearer token
  const oauthResult = await validateOAuthBearerToken(request, env);

  if (!oauthResult.valid) {
    // Return OAuth challenge
    return new Response(JSON.stringify({
      error: 'unauthorized',
      error_description: oauthResult.error,
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="mcp"',
      },
    });
  }

  // Get auth context (Exact credentials) from OAuth user
  const authContext = await getAuthContextFromOAuth(oauthResult.userId!, env);

  if (!authContext) {
    return new Response(JSON.stringify({
      error: 'no_division',
      error_description: 'No Exact Online division linked to this account',
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Determine transport based on Accept header
  const acceptHeader = request.headers.get('Accept') || '';
  const useSSE = acceptHeader.includes('text/event-stream');

  if (useSSE) {
    // SSE transport (ChatGPT)
    const server = new OurMCPServer(env, ctx, authContext);
    const response = await server.handleRequest(request);
    return wrapMCPResponseAsSSE(response, request, env);
  } else {
    // HTTP Streamable transport (Claude)
    return handleMCPRequest(request, env, ctx, authContext);
  }
}

// Backwards compatibility: /mcp/{token} en /sse/{token} blijven werken
// voor bestaande integraties
```

### Fase 5: Onboarding Flow (Day 2 afternoon) - DONE

**Beslissing:** Direct via Exact login, geen aparte account creatie.

**Status:** GEIMPLEMENTEERD op 2026-01-30

#### Flow:
1. User klikt "Connect" in ChatGPT/Claude
2. Redirect naar onze OAuth authorize endpoint
3. Wij redirecten door naar Exact Online login
4. User logt in bij Exact, selecteert administratie
5. Exact redirect terug met auth code
6. Wij wisselen code voor tokens
7. **Automatisch koppelen:** User + divisie opslaan in `user_divisions`
8. Redirect terug naar MCP client met onze OAuth tokens

#### Implementatie:

**Bestand 1:** `apps/auth-portal/src/lib/database.ts`

Nieuwe methode `syncUserDivisions()` toegevoegd:

```typescript
async syncUserDivisions(
  userId: string,
  connectionId: string,
  divisions: Array<{ code: number; name: string; isDefault?: boolean }>
): Promise<void> {
  // Delete existing user_divisions for this connection
  // This handles re-authentication: old records are replaced
  await this.db
    .prepare('DELETE FROM user_divisions WHERE oauth_user_id = ? AND connection_id = ?')
    .bind(userId, connectionId)
    .run();

  // Insert new user_divisions records
  for (const [index, div] of divisions.entries()) {
    const id = generateId();
    const isDefault = div.isDefault ?? (index === 0);

    await this.db
      .prepare(`
        INSERT INTO user_divisions (id, oauth_user_id, connection_id, division_code, division_name, is_default, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      .bind(id, userId, connectionId, String(div.code), div.name, isDefault ? 1 : 0)
      .run();
  }

  // Ensure only one default per user (if multiple connections exist)
  await this.db
    .prepare(`
      UPDATE user_divisions
      SET is_default = 0
      WHERE oauth_user_id = ?
        AND is_default = 1
        AND id NOT IN (
          SELECT id FROM user_divisions
          WHERE oauth_user_id = ? AND is_default = 1
          ORDER BY created_at DESC
          LIMIT 1
        )
    `)
    .bind(userId, userId)
    .run();
}
```

**Bestand 2:** `apps/auth-portal/src/pages/callback.astro`

Aangeroepen na `syncDivisions()`:

```typescript
// P22: Sync user_divisions for OAuth MCP access (ChatGPT/Claude)
await db.syncUserDivisions(
  dbUser.id,
  connection.id,
  exactDivisions.map(d => ({
    code: d.Code,
    name: d.Description,
    isDefault: d.Code === exactUser.CurrentDivision,
  }))
);
```

#### Features:
- Automatisch vullen van `user_divisions` na Exact OAuth success
- Eerste divisie met `isDefault=true` wordt default (of eerste als geen default)
- Re-authenticatie vervangt oude records (geen duplicaten)
- Multi-divisie support: alle divisies worden opgeslagen
- Eén default per user wordt gegarandeerd

#### Multi-divisie (Fase 2):
Als user meerdere administraties heeft:
1. Toon divisie selector na Exact OAuth
2. User kiest welke te koppelen (of alle)
3. Eerste gekoppelde wordt `is_default = true`
4. Later: MCP tool `switch_division` om te wisselen

### Fase 6: Testing (Day 3)

#### Unit Tests

```typescript
// tests/oauth-validator.test.ts
describe('OAuth Validator', () => {
  it('should validate a valid bearer token', async () => {
    // ...
  });

  it('should reject an expired token', async () => {
    // ...
  });

  it('should reject a revoked token', async () => {
    // ...
  });
});
```

#### Integration Tests

```bash
# Test OAuth flow met curl
# 1. Start authorization
curl -X GET "https://api.praatmetjeboekhouding.nl/oauth/authorize?client_id=test&redirect_uri=..."

# 2. Exchange code for token
curl -X POST "https://api.praatmetjeboekhouding.nl/oauth/token" \
  -d "grant_type=authorization_code&code=..."

# 3. Call MCP with bearer token
curl -X POST "https://api.praatmetjeboekhouding.nl/mcp" \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
```

#### E2E Tests

1. ChatGPT: Add MCP server via URL, complete OAuth, call tool
2. Claude Desktop: Add MCP server, complete OAuth, call tool

---

## Backwards Compatibility

**BELANGRIJK:** De oude `/mcp/{token}` en `/sse/{token}` endpoints MOETEN blijven werken voor:
- Bestaande integraties
- Testing tijdens development
- Fallback als OAuth issues

```typescript
// In index.ts:
// Check for legacy token-in-URL pattern
const tokenMatch = path.match(/^\/(mcp|sse)\/([a-zA-Z0-9_]+)$/);
if (tokenMatch) {
  const [, transport, token] = tokenMatch;
  // Use legacy token validation
  return handleLegacyTokenAuth(request, env, ctx, transport, token);
}

// New OAuth-based /mcp endpoint
if (path === '/mcp' || path === '/mcp/') {
  // Use OAuth validation
  return handleOAuthMCP(request, env, ctx);
}
```

---

## Configuratie Wijzigingen

### wrangler.toml

Geen wijzigingen nodig - bestaande D1 binding werkt.

### Environment Variables

Geen nieuwe variabelen nodig.

### CORS

Reeds geconfigureerd voor ChatGPT in `src/lib/cors.ts`.

---

## Risico's en Mitigaties

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| OAuth tokens verlopen tijdens MCP sessie | Medium | Implement token refresh in MCP server |
| Meerdere divisies per user | Low | ✅ Multi-divisie support, `is_default` flag + later selector |
| Rate limiting per OAuth user | Low | ✅ Per OAuth user (past bij Exact model) |
| ChatGPT stuurt geen Accept header | High | ✅ Al opgelost in P21 |
| MCP connectie disconnect na 30 min | High | 🔍 Te onderzoeken - niet in onze code |

---

## Success Criteria

| Criterium | Verificatie |
|-----------|-------------|
| ChatGPT kan verbinden via `/mcp` + OAuth | E2E test |
| Claude kan verbinden via `/mcp` + OAuth | E2E test |
| Legacy `/mcp/{token}` blijft werken | Integration test |
| Legacy `/sse/{token}` blijft werken | Integration test |
| Token refresh werkt | Unit test |
| Rate limiting werkt per OAuth user | Integration test |

---

## Deliverables

1. `migrations/0004_user_divisions.sql` - Database schema
2. `src/auth/oauth-validator.ts` - Token validation
3. `src/auth/oauth-context.ts` - Auth context lookup
4. Updated `src/index.ts` - New routing logic
5. Tests voor alle nieuwe code
6. Documentatie update in VERSION.md

---

## Handover Notities

### Wat al werkt (P21)
- SSE transport voor ChatGPT via `/sse/{token}`
- HTTP transport voor Claude via `/mcp/{token}`
- Onze eigen MCPServer class in `src/mcp/server.ts`
- OAuth endpoints (authorize, token, register)
- CORS voor ChatGPT domains

### Waar op te letten
1. **Accept header:** ChatGPT stuurt soms geen Accept header - default naar HTTP
2. **Token hashing:** We hashen tokens met SHA-256, niet plaintext opslaan
3. **Exact token refresh:** Exact tokens verlopen na 10 minuten, refresh nodig
4. **Error responses:** MCP spec vereist specifiek JSON-RPC error format

### Beslissingen Matthijs (2026-01-30)

| Vraag | Beslissing | Implicatie |
|-------|------------|------------|
| Multi-divisie support? | ✅ **Ja** | User kan meerdere administraties koppelen, divisie selector nodig |
| Onboarding flow? | **Direct via Exact login** | Geen aparte account creatie, OAuth redirect naar Exact |
| Rate limit? | **Per OAuth user** | Exact is strikt, past bij hun model |

### OPGELOST: MCP Connectie Disconnect (30-min issue)

**Probleem:** MCP connectie disconnect na ~10-30 minuten met "token vernieuwen mislukt".

**Root Cause Analyse:**
Het probleem was **memory/DB desynchronization**:
1. Cron job refresht tokens in DB elke 5 minuten
2. MCP sessie heeft oude tokens in memory
3. Wanneer MCP probeert te refreshen, gebruikt het de OUDE refresh_token
4. Deze refresh_token is al geconsumeerd door de cron → Exact zegt "invalid"
5. MCP markeert connectie als "refresh_failed"

**Oplossing (commit `1f845d7`):**
- `getFreshTokens()` methode toegevoegd aan `_base.ts`
- `exactRequest()` haalt nu verse tokens uit DB voordat het refresht
- Als DB tokens nog geldig zijn (cron al gerefresht), gebruik die direct
- Als DB tokens ook verlopen, gebruik DB's verse refresh_token voor refresh

**Token Lifetimes (ter referentie):**
- MCP OAuth access token: 1 uur
- MCP OAuth refresh token: 30 dagen
- Exact access token: 10 minuten (auto-refresh)
- Exact refresh token: 30 dagen

---

## Contact

**Aangemaakt door:** Piet (CEO Agent)
**Datum:** 2026-01-30
**Review door:** Matthijs (CSO)

Bij vragen: Tag @ruben (MCP Protocol) of @joost (Exact API)
