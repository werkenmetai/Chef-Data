# TASK-W05-004: Test Coverage Audit

**Persona:** Roos - QA Engineer
**Datum:** 2025-01-29
**Status:** Completed

---

## Executive Summary

De Exact Online MCP Server codebase bevat **GEEN tests**. Dit is een significant risico voor een productie-applicatie die gevoelige financiele data en OAuth authenticatie afhandelt. De Vitest configuratie is aanwezig maar ongebruikt (`passWithNoTests: true`).

**Risico-niveau: HOOG** - Kritieke security- en data-integriteit modules zijn volledig ongetest.

### Belangrijkste bevindingen:
- 0 test files (*.test.ts, *.spec.ts)
- 0 test directories (__tests__)
- 38 TypeScript source files identificeren die tests nodig hebben
- Vitest geconfigureerd maar niet gebruikt
- Kritieke security modules zonder tests: API-key auth, OAuth, crypto, token management

---

## Huidige Status

### Test Infrastructure
| Component | Status |
|-----------|--------|
| Vitest config | Aanwezig (`apps/mcp-server/vitest.config.ts`) |
| Test files | 0 |
| Coverage rapport | Niet geconfigureerd |
| CI/CD tests | Niet geimplementeerd |

### Vitest Configuratie (huidige staat)
```typescript
export default defineConfig({
  test: {
    passWithNoTests: true,  // Verbergt het probleem
  },
});
```

---

## Geprioriteerde Test Modules

### Prioriteit 1: KRITIEK (Security & Auth)
Hoogste risico - moet eerst getest worden.

#### 1.1 API Key Authentication (`src/auth/api-key.ts`)
**Risico:** HOOG - Bepaalt wie toegang krijgt tot de API
**Complexiteit:** HOOG - PBKDF2 hashing, timing attack preventie, database queries

| Test Scenario | Type | Prioriteit |
|---------------|------|------------|
| `extractApiKey()` - Bearer token extractie | Unit | P1 |
| `extractApiKey()` - Raw key extractie | Unit | P1 |
| `extractApiKey()` - Missing header returns null | Unit | P1 |
| `verifyApiKeyHash()` - PBKDF2 format verificatie | Unit | P1 |
| `verifyApiKeyHash()` - Legacy SHA-256 fallback | Unit | P1 |
| `constantTimeEqual()` - Timing attack preventie | Unit | P1 |
| `authenticateRequest()` - Valid key returns context | Integration | P1 |
| `authenticateRequest()` - Invalid prefix rejected | Integration | P1 |
| `authenticateRequest()` - Revoked key rejected | Integration | P1 |
| `checkRateLimit()` - Plan limits enforced | Integration | P1 |
| `checkRateLimit()` - Enterprise unlimited | Unit | P2 |
| `trackApiUsage()` - Correct logging | Integration | P2 |
| `fetchUserConnections()` - Token decryption | Integration | P1 |
| `logSecurityEvent()` - Events logged | Integration | P2 |

**Geschatte tests:** 15-20

#### 1.2 OAuth Implementation (`src/auth/oauth.ts`)
**Risico:** HOOG - OAuth 2.1 compliance, PKCE, token security
**Complexiteit:** HOOG - RFC compliance, multiple grant types, client registration

| Test Scenario | Type | Prioriteit |
|---------------|------|------------|
| `verifyCodeChallenge()` - S256 PKCE verification | Unit | P1 |
| `handleClientRegistration()` - Valid registration | Integration | P1 |
| `handleClientRegistration()` - Missing redirect_uris | Unit | P1 |
| `handleClientRegistration()` - Non-HTTPS rejected | Unit | P1 |
| `handleClientRegistration()` - Localhost allowed | Unit | P2 |
| `handleAuthorization()` - Missing params rejected | Unit | P1 |
| `handleAuthorization()` - PKCE required | Unit | P1 |
| `handleAuthorization()` - Unknown client rejected | Integration | P1 |
| `handleAuthorizationCodeGrant()` - Valid code exchange | Integration | P1 |
| `handleAuthorizationCodeGrant()` - Used code rejected | Integration | P1 |
| `handleAuthorizationCodeGrant()` - Expired code rejected | Unit | P1 |
| `handleAuthorizationCodeGrant()` - Invalid PKCE verifier | Unit | P1 |
| `handleRefreshTokenGrant()` - Valid refresh | Integration | P1 |
| `handleRefreshTokenGrant()` - Revoked token rejected | Integration | P1 |
| `handleRefreshTokenGrant()` - Expired token rejected | Unit | P1 |
| `handleTokenRevocation()` - Token revoked successfully | Integration | P1 |
| `validateOAuthToken()` - Valid token returns user | Integration | P1 |
| `authenticateClient()` - Basic auth | Unit | P2 |
| `authenticateClient()` - client_secret_post | Unit | P2 |
| `constantTimeEqual()` - Timing safety | Unit | P1 |

**Geschatte tests:** 20-25

#### 1.3 Cryptographic Utilities (`src/lib/crypto.ts`)
**Risico:** HOOG - Token encryptie, data bescherming
**Complexiteit:** MEDIUM - AES-256-GCM, PBKDF2 key derivation

| Test Scenario | Type | Prioriteit |
|---------------|------|------------|
| `encryptToken()` - Roundtrip encrypt/decrypt | Unit | P1 |
| `encryptToken()` - Different inputs = different outputs | Unit | P1 |
| `encryptToken()` - Missing key throws | Unit | P1 |
| `decryptToken()` - Valid ciphertext decrypted | Unit | P1 |
| `decryptToken()` - Wrong key fails | Unit | P1 |
| `decryptToken()` - Corrupted data fails gracefully | Unit | P1 |
| `isEncrypted()` - Detects encrypted tokens | Unit | P1 |
| `isEncrypted()` - Ignores JWT tokens | Unit | P1 |
| `isEncrypted()` - Handles edge cases | Unit | P2 |

**Geschatte tests:** 10-12

### Prioriteit 2: HOOG (API Client & Token Management)

#### 2.1 Token Manager (`src/exact/token-manager.ts`)
**Risico:** HOOG - Token refresh, session continuity
**Complexiteit:** HOOG - Mutex pattern, retry logic, callbacks

| Test Scenario | Type | Prioriteit |
|---------------|------|------------|
| `setTokens()` - Tokens stored correctly | Unit | P1 |
| `getAccessToken()` - Returns valid token | Unit | P1 |
| `getAccessToken()` - Triggers refresh when needed | Unit | P1 |
| `shouldRefresh()` - Buffer time calculation | Unit | P1 |
| `refreshTokens()` - Mutex prevents race conditions | Unit | P1 |
| `refreshTokens()` - Waiters resolved on success | Unit | P1 |
| `refreshTokens()` - Waiters rejected on failure | Unit | P1 |
| `doRefreshWithRetry()` - Retry on failure | Unit | P1 |
| `doRefreshWithRetry()` - Exponential backoff | Unit | P2 |
| `doRefreshWithRetry()` - No retry on requiresReauth | Unit | P1 |
| `exchangeCode()` - Code exchanged for tokens | Integration | P1 |
| `exchangeCode()` - Invalid code throws | Integration | P1 |
| `onTokenRefresh` callback fired | Unit | P2 |
| `TokenError.requiresReauth` flag | Unit | P1 |

**Geschatte tests:** 15-18

#### 2.2 Exact Client (`src/exact/client.ts`)
**Risico:** HOOG - Alle API calls, data integriteit
**Complexiteit:** HOOG - Request handling, pagination, error handling

| Test Scenario | Type | Prioriteit |
|---------------|------|------------|
| `get()` - Simple GET request | Integration | P1 |
| `get()` - With query params | Unit | P1 |
| `post()` - POST with body | Integration | P1 |
| `put()` / `delete()` - CRUD operations | Integration | P2 |
| `buildUrl()` - Division required for most endpoints | Unit | P1 |
| `buildUrl()` - system/ endpoints skip division | Unit | P1 |
| `buildUrl()` - current/ endpoints skip division | Unit | P1 |
| `handleResponse()` - OData unwrapping | Unit | P1 |
| `handleResponse()` - 204 No Content | Unit | P2 |
| `handleResponse()` - Error handling | Unit | P1 |
| `getAll()` - Pagination handling | Integration | P1 |
| `iterate()` - Async generator works | Integration | P2 |
| `getCurrentUser()` - Returns user info | Integration | P1 |
| `getDivisions()` - Returns divisions | Integration | P1 |
| `onTokenRefreshFailed` callback | Integration | P1 |
| Request timeout (30s) | Unit | P2 |

**Geschatte tests:** 18-22

#### 2.3 Rate Limiter (`src/exact/rate-limiter.ts`)
**Risico:** MEDIUM - API access, user experience
**Complexiteit:** MEDIUM - Throttling, retry logic

| Test Scenario | Type | Prioriteit |
|---------------|------|------------|
| `throttle()` - Waits when limit reached | Unit | P1 |
| `throttle()` - Uses server-reported limits | Unit | P1 |
| `parseRateLimitHeaders()` - Parses all headers | Unit | P1 |
| `isApproachingLimit()` - Threshold detection | Unit | P2 |
| `executeWithRetry()` - Retries on 429 | Unit | P1 |
| `executeWithRetry()` - Uses Retry-After header | Unit | P1 |
| `executeWithRetry()` - Exponential backoff | Unit | P1 |
| `executeWithRetry()` - Network error retry | Unit | P2 |
| `reset()` - Clears state | Unit | P2 |

**Geschatte tests:** 10-12

### Prioriteit 3: MEDIUM (Data Processing)

#### 3.1 OData Query Builder (`src/exact/odata-query.ts`)
**Risico:** MEDIUM - Query correctness, OData injection
**Complexiteit:** MEDIUM - String escaping, query building

| Test Scenario | Type | Prioriteit |
|---------------|------|------------|
| `where()` - Basic equality filter | Unit | P1 |
| `compare()` - All operators (eq, ne, gt, ge, lt, le) | Unit | P1 |
| `whereGuid()` - GUID formatting | Unit | P1 |
| `whereDate()` - Date formatting | Unit | P1 |
| `whereDateBetween()` - Range filter | Unit | P2 |
| `startsWith()` / `endsWith()` / `contains()` | Unit | P1 |
| `containsIgnoreCase()` - Case insensitive | Unit | P2 |
| `whereIn()` - Multiple OR conditions | Unit | P1 |
| `escapeString()` - SQL injection prevention | Unit | P1 |
| `select()` - Field selection | Unit | P1 |
| `orderBy()` / `orderByDesc()` - Sorting | Unit | P1 |
| `top()` / `skip()` / `page()` - Pagination | Unit | P1 |
| `build()` - Full query string | Unit | P1 |
| `clone()` - Builder cloning | Unit | P2 |
| `escapeODataString()` - OData injection prevention | Unit | P1 |

**Geschatte tests:** 18-22

#### 3.2 Data Sanitizer (`src/lib/sanitizer.ts`)
**Risico:** MEDIUM - PII protection, GDPR compliance
**Complexiteit:** MEDIUM - Regex patterns, recursive processing

| Test Scenario | Type | Prioriteit |
|---------------|------|------------|
| `maskIban()` - IBAN masking (NL91****4300) | Unit | P1 |
| `maskBsn()` - BSN fully masked | Unit | P1 |
| `maskEmail()` - Email partially masked | Unit | P1 |
| `maskPhone()` - Phone last 4 digits | Unit | P1 |
| `sanitizeString()` - Pattern matching | Unit | P1 |
| `sanitizeObject()` - Recursive processing | Unit | P1 |
| `sanitizeObject()` - Field name detection | Unit | P1 |
| `sanitizeObject()` - excludeFields option | Unit | P2 |
| `sanitize()` - Top-level function | Unit | P1 |
| `createSanitizer()` - Custom defaults | Unit | P2 |
| `financialSanitizer` - Preset config | Unit | P2 |
| `strictSanitizer` - Preset config | Unit | P2 |
| BSN context detection | Unit | P1 |

**Geschatte tests:** 15-18

#### 3.3 Pagination Helper (`src/exact/pagination.ts`)
**Risico:** MEDIUM - Data completeness
**Complexiteit:** MEDIUM - Async generators, response parsing

| Test Scenario | Type | Prioriteit |
|---------------|------|------------|
| `parseResponse()` - OData format | Unit | P1 |
| `parseResponse()` - Direct array | Unit | P1 |
| `parseResponse()` - Empty results | Unit | P1 |
| `isBulkEndpoint()` - Bulk detection | Unit | P1 |
| `getPageSize()` - Standard vs bulk | Unit | P1 |
| `buildParams()` - $top and $skip | Unit | P1 |
| `iterate()` - Multiple pages | Integration | P1 |
| `iterate()` - maxRecords limit | Unit | P1 |
| `iterate()` - onProgress callback | Unit | P2 |
| `fetchAll()` - Combines all pages | Integration | P1 |
| `PaginationCursor` - State management | Unit | P2 |

**Geschatte tests:** 12-15

### Prioriteit 4: LOWER (Infrastructure)

#### 4.1 Circuit Breaker (`src/exact/circuit-breaker.ts`)
**Risico:** LOW - Resilience pattern
**Complexiteit:** LOW - Simple state machine

| Test Scenario | Type | Prioriteit |
|---------------|------|------------|
| Initial state is 'closed' | Unit | P2 |
| `canRequest()` - Closed allows requests | Unit | P2 |
| `recordFailure()` - Opens at threshold | Unit | P1 |
| `canRequest()` - Open blocks requests | Unit | P1 |
| `canRequest()` - Half-open after timeout | Unit | P1 |
| `recordSuccess()` - Closes circuit | Unit | P1 |
| `reset()` - Resets state | Unit | P2 |

**Geschatte tests:** 8-10

#### 4.2 MCP Tools (alle tool classes)
**Risico:** MEDIUM - Business logic correctness
**Complexiteit:** MEDIUM - API integration, data mapping

Elke tool class zou minimaal moeten hebben:
- Input validation test
- Success scenario test
- Error handling test
- Edge case tests

**Geschatte tests per tool:** 4-6
**Aantal tools:** ~12
**Totaal geschatte tests:** 48-72

---

## Test Pyramid Aanbeveling

```
                    /\
                   /  \
                  / E2E \
                 / Tests \     <- 10% (Playwright, 5-10 tests)
                /   (5%)  \
               /----------\
              / Integration \
             /    Tests     \   <- 30% (API calls, DB, 40-50 tests)
            /     (25%)      \
           /------------------\
          /     Unit Tests     \
         /       (70%)          \ <- 60% (Pure functions, 100-120 tests)
        /________________________\
```

### Aanbevolen Test Verdeling

| Type | Percentage | Geschat Aantal | Focus |
|------|------------|----------------|-------|
| Unit Tests | 60% | 100-120 | Pure functions, utilities, builders |
| Integration Tests | 30% | 40-50 | API client, database, auth flows |
| E2E Tests | 10% | 5-10 | Critical user flows |

---

## Effort Schatting

### Fase 1: Security Tests (Sprint 1) - 3-4 dagen
| Module | Tests | Effort |
|--------|-------|--------|
| api-key.ts | 15-20 | 1 dag |
| oauth.ts | 20-25 | 1.5 dagen |
| crypto.ts | 10-12 | 0.5 dag |
| **Subtotaal** | **45-57** | **3-4 dagen** |

### Fase 2: Core API Tests (Sprint 2) - 4-5 dagen
| Module | Tests | Effort |
|--------|-------|--------|
| token-manager.ts | 15-18 | 1 dag |
| client.ts | 18-22 | 1.5 dagen |
| rate-limiter.ts | 10-12 | 0.5 dag |
| odata-query.ts | 18-22 | 1 dag |
| **Subtotaal** | **61-74** | **4-5 dagen** |

### Fase 3: Data & Utils Tests (Sprint 3) - 2-3 dagen
| Module | Tests | Effort |
|--------|-------|--------|
| sanitizer.ts | 15-18 | 0.5 dag |
| pagination.ts | 12-15 | 0.5 dag |
| circuit-breaker.ts | 8-10 | 0.25 dag |
| **Subtotaal** | **35-43** | **1.25-2 dagen** |

### Fase 4: Tool Tests (Sprint 4) - 3-4 dagen
| Module | Tests | Effort |
|--------|-------|--------|
| All tool classes | 48-72 | 3-4 dagen |

### Totaal Effort

| Fase | Tests | Effort | Prioriteit |
|------|-------|--------|------------|
| Fase 1 - Security | 45-57 | 3-4 dagen | KRITIEK |
| Fase 2 - Core API | 61-74 | 4-5 dagen | HOOG |
| Fase 3 - Data Utils | 35-43 | 1.25-2 dagen | MEDIUM |
| Fase 4 - Tools | 48-72 | 3-4 dagen | MEDIUM |
| **TOTAAL** | **189-246** | **11.25-15 dagen** |

---

## Aanbevelingen

### Directe Acties (Week 1)
1. **Update vitest.config.ts** - Verwijder `passWithNoTests: true`
2. **Setup test utilities** - Mock factories voor DB, Request, Env
3. **Start met crypto.ts tests** - Laagste complexiteit, hoogste waarde
4. **Configureer coverage reporting** - Stel minimale threshold in (bijv. 80%)

### Korte Termijn (Week 2-3)
5. **Complete security module tests** - api-key.ts, oauth.ts
6. **Setup CI/CD integration** - Tests in GitHub Actions
7. **Token manager tests** - Kritiek voor token refresh issues

### Medium Termijn (Week 4-6)
8. **Exact client tests** - Volledige API coverage
9. **Data processing tests** - OData, sanitizer, pagination
10. **Tool tests** - Business logic validatie

### Voorgestelde Vitest Configuratie

```typescript
// apps/mcp-server/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare', // Cloudflare Workers environment
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['src/**/*.d.ts', 'src/__tests__/**'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
    testTimeout: 10000,
  },
});
```

---

## Conclusie

De huidige test coverage van 0% is een aanzienlijk risico voor een productie-applicatie die:
- Financiele data verwerkt
- OAuth authenticatie implementeert
- API keys en tokens beheert
- Gevoelige PII data verwerkt

**Aanbeveling:** Start onmiddellijk met Fase 1 (security tests) en bouw incrementeel uit naar volledige coverage. De geschatte investering van 11-15 ontwikkel-dagen zal significant bijdragen aan code kwaliteit, security en maintainability.

---

*Rapport gegenereerd door Roos (QA Engineer)*
*Referentie: TEST-001 in ROADMAP.md*
