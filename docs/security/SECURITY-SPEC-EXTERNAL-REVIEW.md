# Security Specification Document
## Praat met je Boekhouding - Externe Security Review

> **Document voor:** Externe IT Security Auditor
> **Versie:** 1.0
> **Datum:** 3 februari 2026
> **Contact:** Matthijs Huttinga (matthijs@praatmetjeboekhouding.nl)

---

## 1. Executive Summary

### 1.1 Wat is dit project?

**Praat met je Boekhouding** is een MCP-server (Model Context Protocol) die Exact Online boekhouddata toegankelijk maakt voor AI-assistenten zoals Claude en ChatGPT. Gebruikers kunnen in natuurlijke taal vragen stellen over hun boekhouding.

### 1.2 Kernprincipes

| Principe | Implementatie |
|----------|---------------|
| **Read-only** | Alleen leesrechten op Exact Online (23 scopes, 0 beheerrechten) |
| **Pass-through** | Geen opslag van boekhouddata - alleen doorgifte |
| **Privacy-first** | GDPR/AVG compliant, minimale data collectie |
| **Serverless** | Cloudflare Workers - geen eigen servers |

### 1.3 Huidige Status

| Certificering | Status |
|---------------|--------|
| Exact Online Security Review | ✅ **GOEDGEKEURD** (29 jan 2026) |
| Exact Online App Store | ⏳ Marketingbeoordeling ingediend |
| Anthropic Claude Connector | ⏳ Ingediend, wacht op review |
| ISO 27001 / SOC 2 | ❌ Niet van toepassing (serverless) |

---

## 2. Architectuur Overzicht

### 2.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              GEBRUIKER                                   │
│                    (ZZP'er / MKB-ondernemer)                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Vraag: "Welke facturen staan open?"
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          AI ASSISTANT                                    │
│              (Claude Desktop / ChatGPT / Claude.ai)                      │
│                                                                          │
│  - Verwerkt natuurlijke taal                                            │
│  - Bepaalt welke tool aan te roepen                                      │
│  - Formatteert antwoord voor gebruiker                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ MCP Protocol (JSON-RPC 2.0)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        MCP SERVER (Onze Applicatie)                      │
│            api.praatmetjeboekhouding.nl (Cloudflare Worker)              │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │   OAuth     │  │   47 MCP    │  │   Token     │                      │
│  │   Handler   │  │   Tools     │  │   Manager   │                      │
│  └─────────────┘  └─────────────┘  └─────────────┘                      │
│                                                                          │
│  - Valideert authenticatie (OAuth 2.1 + PKCE of API key)                │
│  - Roept Exact Online API aan                                            │
│  - Geeft data door naar AI (geen opslag)                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS + OAuth 2.0 Bearer Token
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXACT ONLINE API                                 │
│                    (start.exactonline.nl)                                │
│                                                                          │
│  - Officiële REST/OData API                                             │
│  - Rate limited (60 req/min per app)                                    │
│  - Regionale endpoints (NL, BE, DE, UK, US, ES, FR)                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXACT ONLINE DATABASE                                 │
│              (Beheerd door Exact - buiten onze scope)                    │
│                                                                          │
│  - Grootboekrekeningen, facturen, transacties, etc.                     │
│  - Wij hebben ALLEEN leesrechten                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. AUTHENTICATIE FLOW                                                    │
│     User → Auth Portal → Exact OAuth → Tokens encrypted → D1 Database    │
│                                                                           │
│  2. VRAAG/ANTWOORD FLOW                                                   │
│     User vraag → AI → MCP Server → Exact API → Data → AI → Antwoord      │
│                         │                        │                        │
│                         │    GEEN OPSLAG         │                        │
│                         └────────────────────────┘                        │
│                                                                           │
│  3. TOKEN REFRESH FLOW (elke ~10 minuten)                                 │
│     Cron Job → Check expiring tokens → Refresh via Exact → Update D1     │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Componenten

| Component | Technologie | Functie |
|-----------|-------------|---------|
| **MCP Server** | Cloudflare Worker | API endpoint voor AI-assistenten |
| **Auth Portal** | Cloudflare Pages + Astro | Website en OAuth flow |
| **Database** | Cloudflare D1 (SQLite) | Users, tokens, API keys |
| **File Storage** | Cloudflare R2 | Screenshots (feedback) |
| **Email** | Resend | Transactionele emails |
| **Monitoring** | Sentry | Error tracking (PII-geredacteerd) |

---

## 3. Technologie Stack

### 3.1 Infrastructure

| Component | Provider | Certificering |
|-----------|----------|---------------|
| Compute | Cloudflare Workers | ISO 27001, SOC 2 Type II, PCI DSS |
| Database | Cloudflare D1 | ISO 27001, SOC 2 Type II |
| CDN/WAF | Cloudflare | ISO 27001, SOC 2 Type II |
| DNS | Cloudflare | ISO 27001, SOC 2 Type II |
| Object Storage | Cloudflare R2 | ISO 27001, SOC 2 Type II |

### 3.2 Software Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Cloudflare Workers | V8 isolates |
| Language | TypeScript | 5.x |
| Framework (Portal) | Astro | 4.x |
| Package Manager | npm | 10.x |
| CI/CD | GitHub Actions | - |

### 3.3 Dependencies

Alle dependencies worden beheerd via `package.json` met:
- `npm audit` controles in CI pipeline
- Dependabot alerts (GitHub)
- Pinned versions voor reproduceerbare builds

---

## 4. Authenticatie & Autorisatie

### 4.1 OAuth 2.1 + PKCE Implementatie

**Standaarden:**
- RFC 6749 (OAuth 2.0)
- RFC 7636 (PKCE)
- RFC 8414 (Authorization Server Metadata)
- RFC 7591 (Dynamic Client Registration)

**Flow:**

```
1. User klikt "Verbind Exact Online"
2. Frontend genereert:
   - code_verifier (43-128 chars, cryptographic random)
   - code_challenge = BASE64URL(SHA256(code_verifier))
   - state = HMAC(session_id + timestamp, SESSION_SECRET)

3. Redirect naar Exact Online:
   /authorize?
     response_type=code&
     client_id=xxx&
     redirect_uri=https://praatmetjeboekhouding.nl/callback&
     code_challenge=xxx&
     code_challenge_method=S256&
     state=xxx

4. User authoriseert in Exact Online

5. Callback met authorization code:
   /callback?code=xxx&state=xxx

6. Server verifieert:
   - State signature (HMAC-SHA256)
   - Nonce cookie match (CSRF protection)
   - Exchange code for tokens met code_verifier

7. Tokens encrypted en opgeslagen in D1
```

**Bestandslocaties:**
- `apps/mcp-server/src/auth/oauth.ts` - OAuth server implementatie
- `apps/auth-portal/src/lib/exact-auth.ts` - PKCE utilities
- `apps/mcp-server/src/auth/oauth-validator.ts` - Request validatie

### 4.2 API Key Authenticatie

**Voor:** MCP clients die geen OAuth ondersteunen (legacy)

**Implementatie:**
- Keys gegenereerd met `crypto.getRandomValues()`
- Format: `exa_` + 40 hex characters
- Opslag: SHA-256 hash (nooit plaintext)
- Nieuwe keys: PBKDF2 (100.000 iteraties)
- Vergelijking: Constant-time (`crypto.timingSafeEqual`)

**Bestandslocatie:** `apps/mcp-server/src/auth/api-key.ts`

### 4.3 Session Management

| Setting | Waarde |
|---------|--------|
| Cookie naam | `session_id` |
| httpOnly | ✅ Ja |
| Secure | ✅ Ja |
| SameSite | Lax |
| Expiry | 30 dagen |
| Regeneratie | Bij privilege change |

> **Note:** `SameSite=Lax` is vereist voor OAuth redirect flows. Strict zou de callback blokkeren.

---

## 5. Encryptie

### 5.1 In Transit

| Protocol | Minimum Versie | Configuratie |
|----------|----------------|--------------|
| TLS | 1.2 (1.3 preferred) | Cloudflare managed |
| HSTS | ✅ Enabled | max-age=31536000 |
| Certificate | Let's Encrypt | Auto-renew via Cloudflare |

### 5.2 At Rest

**OAuth Tokens (connections.access_token, connections.refresh_token):**

```
Algorithm: AES-256-GCM
Key Derivation: PBKDF2 (100.000 iterations, SHA-256)
IV: 96-bit (cryptographically random per encryption)
Salt: 16 bytes (random per encryption)
Tag: 128-bit authentication tag

Storage Format: Base64(salt || iv || ciphertext || tag)

Key Source: TOKEN_ENCRYPTION_KEY environment variable
```

**API Keys (api_keys.key_hash):**

```
Algorithm: SHA-256 (legacy) / PBKDF2 (new)
Salt: Integrated in PBKDF2
Iterations: 100.000

Note: Plaintext key only shown once at creation, never stored
```

**Bestandslocaties:**
- `apps/mcp-server/src/lib/crypto.ts`
- `apps/auth-portal/src/lib/crypto.ts`

### 5.3 Key Management

| Key | Opslag | Rotatie |
|-----|--------|---------|
| TOKEN_ENCRYPTION_KEY | Cloudflare Secret | Handmatig |
| SESSION_SECRET | Cloudflare Secret | Handmatig |
| EXACT_CLIENT_SECRET | Cloudflare Secret | Bij Exact wijziging |

---

## 6. Data Handling

### 6.1 Wat We Opslaan

| Data Type | Opslag | Encryptie | Retentie |
|-----------|--------|-----------|----------|
| User email | D1 | Plaintext | Tot account deletion |
| User naam | D1 | Plaintext | Tot account deletion |
| OAuth tokens | D1 | AES-256-GCM | Tot disconnect |
| API key hash | D1 | SHA-256/PBKDF2 | Tot revoke |
| API usage logs | D1 | Plaintext | 90 dagen |
| Support messages | D1 | Plaintext | Tot ticket deletion |

### 6.2 Wat We NIET Opslaan

| Data Type | Reden |
|-----------|-------|
| Boekhouddata (facturen, transacties, etc.) | Pass-through model |
| Exact Online credentials | OAuth-based access |
| Plaintext API keys | Alleen hash opgeslagen |
| AI conversaties | Verwerkt door AI provider |

### 6.3 Data Locatie

```
Alle data: EU Region (waar mogelijk EU server geselecteerd)

Cloudflare Services:
- Workers: EU Region
- D1 Database: EU Region
- R2 Bucket: feedback-screenshots-eu (EU jurisdiction)
- Pages: EU Region

Email Provider:
- Resend: Ierland (EU West)
```

**EU Data Residency:** Alle services zijn geconfigureerd voor EU data residency waar mogelijk. Dit vereenvoudigt GDPR compliance en elimineert de noodzaak voor SCCs voor de meeste verwerkers.

### 6.4 Data Verwijdering

**User-initiated:**
- Account deletion: Cascade delete van alle gerelateerde data
- Exact disconnect: Tokens verwijderd, verbinding inactive

**Automatic:**
- Sessions: Verwijderd na expiry
- OAuth auth codes: Verwijderd na 10 minuten
- API usage logs: Verwijderd na 90 dagen

---

## 7. API Security

### 7.1 Rate Limiting

| Scope | Limiet | Window |
|-------|--------|--------|
| Per API key | 60 requests | 1 minuut |
| Per user (daily) | Plan-based | 24 uur |
| - Free plan | 100 calls | 24 uur |
| - Starter plan | 1.000 calls | 24 uur |
| - Pro plan | 10.000 calls | 24 uur |
| - Enterprise | Onbeperkt | - |

**Implementatie:** `apps/mcp-server/src/exact/rate-limiter.ts`

### 7.2 Input Validation

- TypeScript type checking (compile-time)
- Zod schema validation (runtime)
- SQL parameterized queries (geen string concatenation)
- HTML escaping voor output
- URL sanitization (blokkeert javascript:, data:, vbscript:)

### 7.3 CORS Policy

**Toegestane origins:**
```
Production:
- https://praatmetjeboekhouding.nl
- https://api.praatmetjeboekhouding.nl
- https://chatgpt.com
- https://chat.openai.com
- https://claude.ai

Development (alleen in dev mode):
- http://localhost:*
- https://*.pages.dev
```

**Bestandslocatie:** `apps/mcp-server/src/lib/cors.ts`

### 7.4 Security Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

> **Note:** `X-XSS-Protection` header is bewust weggelaten (deprecated in moderne browsers, CSP is voldoende).

**Bestandslocatie:** `apps/auth-portal/src/middleware.ts`

---

## 8. Exact Online Integratie

### 8.1 OAuth Scopes

**Totaal: 23 lees-scopes, 0 beheer-scopes**

| Categorie | Scopes (Lezen) |
|-----------|----------------|
| CRM | accounts, opportunities, quotes |
| Sales | orders, invoices, contracts, prices |
| Purchase | orders, invoices, prices |
| Logistics | items, inventory |
| Projects | projects, billing |
| Financial | currencies, costcenters, generalledgers, accounting, cashflow, receivables, payables, assets, budgets |
| Organization | administration, documents |

**Bewust NIET aangevraagd:**
- HRM (employees, payroll) - Te gevoelig
- Alle "Beheren" rechten - Read-only principe

### 8.2 MCP Tools (47 stuks)

| Categorie | Tools | Voorbeeld |
|-----------|-------|-----------|
| Financieel | 15 | get_trial_balance, get_profit_loss, get_vat_summary |
| Verkoop | 8 | get_sales_invoices, get_outstanding_invoices |
| Inkoop | 6 | get_purchase_invoices, get_aging_payables |
| Logistiek | 5 | get_items, get_stock_positions |
| Relaties | 4 | get_accounts, get_contacts |
| Projecten | 4 | get_projects, get_time_entries |
| Diversen | 5 | list_divisions, get_document |

**Alle tools zijn read-only** - geen create, update, of delete operaties.

### 8.3 Token Management

```
Access Token Lifetime: ~10 minuten (Exact bepaalt)
Refresh Token Lifetime: ~6 maanden
Refresh Strategy: 3 minuten voor expiry
Retry Logic: 5 pogingen met exponential backoff
```

**Bestandslocatie:** `apps/mcp-server/src/exact/token-manager.ts`

---

## 9. Database Schema

### 9.1 Tabellen Overzicht

| Tabel | Records (schatting) | Gevoelige Data |
|-------|---------------------|----------------|
| users | 100-1000 | email, naam |
| connections | 100-500 | encrypted tokens |
| divisions | 200-1000 | Exact division codes |
| api_keys | 50-200 | hashed keys |
| sessions | 50-500 | session tokens |
| api_usage | 10.000+ | usage logs |
| oauth_tokens | 100-500 | hashed tokens |

### 9.2 Security-Relevante Kolommen

| Tabel.Kolom | Bescherming |
|-------------|-------------|
| connections.access_token | AES-256-GCM encrypted |
| connections.refresh_token | AES-256-GCM encrypted |
| api_keys.key_hash | SHA-256 / PBKDF2 hashed |
| oauth_tokens.access_token_hash | SHA-256 hashed |
| oauth_tokens.refresh_token_hash | SHA-256 hashed |
| sessions.id | Cryptographic random |

### 9.3 Foreign Key Constraints

Alle user-gerelateerde tabellen hebben `ON DELETE CASCADE` naar `users`, waardoor account deletion alle data verwijdert.

---

## 10. Third-Party Services

### 10.1 Service Overzicht

| Service | Doel | Locatie | Data Gedeeld | DPA |
|---------|------|---------|--------------|-----|
| Cloudflare | Hosting, DB, CDN | **EU Region** | Alles | ✅ |
| Resend | Email (inbound/outbound) | **Ierland (EU)** | Email adressen, berichten | ✅ |
| Sentry | Error monitoring | EU | Errors (PII-geredacteerd) | ✅ |
| Anthropic | AI (Claude) | VS | User-initiated queries | Via Terms |
| OpenAI | AI (ChatGPT) | VS | User-initiated queries | Via Terms |
| Exact Online | Boekhouding API | NL | OAuth tokens | Via App Center |

> **Note:** Cloudflare en Resend zijn expliciet geconfigureerd voor EU data residency.

### 10.2 AI Provider Data Flow

```
BELANGRIJK: Wij sturen GEEN data naar AI providers.

Flow:
1. User vraagt iets aan AI (bijv. Claude)
2. AI bepaalt dat het boekhouddata nodig heeft
3. AI roept onze MCP tool aan
4. Wij halen data op bij Exact Online
5. Data gaat DIRECT naar AI (via MCP response)
6. AI genereert antwoord voor user

Wij zijn een doorgeefluik - geen data opslag of verwerking.
```

---

## 11. Compliance Status

### 11.1 GDPR/AVG

| Vereiste | Status | Bewijs |
|----------|--------|--------|
| Privacy Policy | ✅ | /privacy |
| Terms of Service | ✅ | /voorwaarden |
| DPA/Verwerkersovereenkomst | ✅ | /verwerkersovereenkomst |
| Consent flow | ✅ | OAuth + ToS acceptance |
| Data subject rights | ✅ | Account deletion, export |
| Breach notification | ✅ | Procedure gedocumenteerd |

### 11.2 Exact Online Requirements

| Vereiste | Status |
|----------|--------|
| Security Review | ✅ GOEDGEKEURD |
| Toestemmingsverzoek | ✅ GOEDGEKEURD |
| Read-only access | ✅ |
| No data storage | ✅ |
| Privacy policy | ✅ |
| HTTPS only | ✅ |

---

## 12. Bekende Aandachtspunten

### 12.1 Architecturale Beslissingen

| Beslissing | Rationale | Trade-off |
|------------|-----------|-----------|
| `unsafe-inline` in CSP | Astro hydration vereist inline scripts | XSS risico gemitigeerd door andere maatregelen |
| Geen ISO 27001 | Serverless architecture, geen eigen infra | Cloudflare certificeringen dekken infra |
| SHA-256 voor legacy keys | Backwards compatibility | PBKDF2 voor nieuwe keys |

---

## 13. Aanbevolen Audit Scope

### 13.1 Prioriteit 1 - Kritiek

1. **OAuth implementatie review**
   - PKCE correctheid
   - State parameter validatie
   - Token opslag encryptie

2. **API authenticatie**
   - API key hashing
   - Session management
   - Rate limiting effectiviteit

3. **Input validation**
   - SQL injection testen
   - XSS testen
   - Path traversal testen

### 13.2 Prioriteit 2 - Hoog

4. **Cryptografie review**
   - AES-256-GCM implementatie
   - Key management
   - IV/nonce hergebruik check

5. **CORS configuratie**
   - Origin whitelist
   - Credentials handling
   - Preflight caching

6. **Database security**
   - Access controls
   - Sensitive data handling
   - Backup/recovery

### 13.3 Prioriteit 3 - Medium

7. **Dependency audit**
   - npm packages vulnerabilities
   - Supply chain risico's

8. **Error handling**
   - Information disclosure
   - Stack traces in responses

9. **Logging review**
   - PII in logs
   - Log retention

---

## 14. Toegang voor Auditor

### 14.1 Code Repository

```
GitHub: https://github.com/werkenmetai/Exact-online-MCP
Branch: main (production)
Access: Invite als read-only collaborator
```

### 14.2 Relevante Bestanden

| Categorie | Paden |
|-----------|-------|
| OAuth | `apps/mcp-server/src/auth/` |
| Crypto | `apps/*/src/lib/crypto.ts` |
| Database | `apps/auth-portal/migrations/` |
| API Routes | `apps/auth-portal/src/pages/api/` |
| Security | `apps/auth-portal/src/lib/security.ts` |
| CORS | `apps/mcp-server/src/lib/cors.ts` |
| Middleware | `apps/auth-portal/src/middleware.ts` |

### 14.3 Test Omgeving

```
Demo URL: https://api.praatmetjeboekhouding.nl/demo/exa_demo
Test Account: Geen login nodig (demo mode)
Test Data: Bakkerij De Gouden Croissant (fictief)
```

---

## 15. Contact & Escalatie

| Rol | Naam | Contact |
|-----|------|---------|
| CEO | Matthijs Huttinga | matthijs@praatmetjeboekhouding.nl |
| Security Lead | Bas (Agent) | Via Matthijs |
| Backend Lead | Daan (Agent) | Via Matthijs |

---

## 16. Document Geschiedenis

| Versie | Datum | Auteur | Wijzigingen |
|--------|-------|--------|-------------|
| 1.0 | 2026-02-03 | Piet (Orchestrator) | Initiële versie |

---

## Bijlagen

### A. Bestandsstructuur

```
Exact-online-MCP/
├── apps/
│   ├── mcp-server/              # MCP API (Cloudflare Worker)
│   │   ├── src/
│   │   │   ├── auth/            # OAuth, API key auth
│   │   │   ├── exact/           # Exact Online API client
│   │   │   ├── lib/             # Crypto, CORS, utilities
│   │   │   ├── tools/           # 47 MCP tools
│   │   │   └── monitoring/      # Metrics, error reporting
│   │   └── wrangler.toml        # Cloudflare config
│   │
│   └── auth-portal/             # Website (Cloudflare Pages)
│       ├── src/
│       │   ├── pages/           # Astro pages + API routes
│       │   ├── lib/             # Utilities, crypto
│       │   └── middleware.ts    # Security headers
│       ├── migrations/          # D1 database migrations
│       └── wrangler.toml        # Cloudflare config
│
├── docs/
│   ├── exact-app-store/         # Exact compliance docs
│   ├── knowledge/               # Technical knowledge base
│   └── security/                # Security documentation
│
└── operations/                  # Operations & planning
```

### B. Environment Variables

```
# MCP Server
EXACT_CLIENT_ID          # Exact OAuth client ID
EXACT_CLIENT_SECRET      # Exact OAuth client secret
TOKEN_ENCRYPTION_KEY     # AES-256 key for token encryption
SENTRY_DSN              # Sentry error tracking

# Auth Portal
SESSION_SECRET          # Session cookie signing
RESEND_API_KEY         # Email service
STRIPE_SECRET_KEY      # Payment processing
CRON_SECRET            # Cron job authentication
```

### C. Security Checklist voor Review

```
[ ] OAuth 2.1 + PKCE implementatie correct
[ ] State parameter HMAC validatie
[ ] Token encryption (AES-256-GCM) correct
[ ] API key hashing (PBKDF2) correct
[ ] Session management secure
[ ] CORS whitelist strict
[ ] CSP headers effectief
[ ] Input validation op alle endpoints
[ ] SQL queries parameterized
[ ] XSS prevention in output
[ ] Rate limiting effectief
[ ] Error messages geen gevoelige info
[ ] Logs geen PII
[ ] Dependencies geen known vulnerabilities
[ ] Secrets niet in code
[ ] HTTPS everywhere
```

---

*Dit document is automatisch gegenereerd op basis van de codebase analyse.*
*Voor vragen of toegang, neem contact op met Matthijs Huttinga.*
