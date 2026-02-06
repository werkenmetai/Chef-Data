# Infrastructure Documentation

**Beheerder:** Daan (Backend Specialist)
**Platform:** Cloudflare + Resend
**Laatste update:** 2026-02-03

---

## Architectuur Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLOUDFLARE                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐     ┌─────────────────────┐     ┌──────────────┐  │
│  │ exact-online-mcp    │     │ exact-mcp-api       │     │ exact-mcp-db │  │
│  │ (Pages)             │ ──▶ │ (Worker)            │ ──▶ │ (D1)         │  │
│  │                     │     │                     │     │              │  │
│  │ Frontend / Website  │     │ API Server          │     │ SQLite DB    │  │
│  └─────────────────────┘     └─────────────────────┘     └──────────────┘  │
│           │                           │                                      │
│           │                           │                                      │
│  praatmetjeboekhouding.nl    api.praatmetjeboekhouding.nl                   │
│  exactmcp.com                                                                │
│  exact-online-mcp.pages.dev                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
                            ┌─────────────────────┐
                            │   Exact Online API  │
                            │   (External)        │
                            └─────────────────────┘
```

---

## Components

### 1. exact-online-mcp (Cloudflare Pages)

| Eigenschap | Waarde |
|------------|--------|
| Type | Cloudflare Pages |
| Repo | werkenmetai/Exact-online-MCP |
| Branch | `main` (production) |
| Auto deploy | Ja |
| Framework | Next.js / React |

**Domains:**
- `praatmetjeboekhouding.nl` (primary)
- `exactmcp.com`
- `exact-online-mcp.pages.dev`

**Preview URLs:**
- `{commit}.exact-online-mcp.pages.dev`
- Automatisch voor elke branch/PR

---

### 2. exact-mcp-api (Cloudflare Worker)

| Eigenschap | Waarde |
|------------|--------|
| Type | Cloudflare Worker |
| Deploy | Manual via Wrangler |
| Runtime | V8 Isolate |

**Domain:**
- `api.praatmetjeboekhouding.nl`
- `exact-mcp-api.matthijs-9b9.workers.dev`

**Bindings:**
| Type | Name | Value |
|------|------|-------|
| D1 Database | `DB` | exact-mcp-db |

**Deploy command:**
```bash
cd apps/mcp-server
npx wrangler deploy
```

---

### 3. exact-mcp-db (Cloudflare D1)

| Eigenschap | Waarde |
|------------|--------|
| Type | Cloudflare D1 (SQLite) |
| Database ID | `30788ed4-4a60-4453-b176-dd9da7eecb2d` |
| Name | `exact-mcp-db` |
| Region | Auto |

**Schema:** Zie `docs/knowledge/backend/DATABASE.md`

**Console:**
```
Cloudflare Dashboard → Storage & databases → D1 → exact-mcp-db → Console
```

**Time Travel:**
```bash
# Bookmark current state
wrangler d1 time-travel bookmark exact-mcp-db

# Restore to timestamp
wrangler d1 time-travel restore exact-mcp-db --timestamp "2026-01-28T10:00:00Z"
```

---

## Usage Metrics (January 2026)

| Metric | Waarde | Limiet |
|--------|--------|--------|
| Requests today | 94 | 100,000/day |
| Total requests | 38.91k | - |
| CPU time | 29,362 ms | - |
| Observability events | 56.88k | - |
| Workers build mins | 0 | - |

---

## Monitoring

### Cloudflare Observability

**Location:** Dashboard → Workers → exact-mcp-api → Observability

**Key metrics:**
- Requests per 24h
- Error rate
- CPU time
- Geographic distribution

### Common Log Patterns

| Pattern | Betekenis | Actie |
|---------|-----------|-------|
| `wp-includes/wlwmanifest.xml` | WordPress scanner bots | Negeren (normaal) |
| `[Sentry] No SENTRY_DSN` | Sentry niet geconfigureerd | Optioneel: configureer |
| `401 Unauthorized` | Ongeldige API key | Check key geldigheid |
| `429 Too Many Requests` | Rate limit hit | Check rate limiter |

---

## Deployment Flow

### Frontend (Pages) - Automatisch

```
git push origin main
    │
    ▼
GitHub webhook → Cloudflare Pages
    │
    ▼
Build & Deploy (automatisch)
    │
    ▼
Live op praatmetjeboekhouding.nl
```

### API (Worker) - Handmatig

```
cd apps/mcp-server
    │
    ▼
npx wrangler deploy
    │
    ▼
Live op api.praatmetjeboekhouding.nl
```

### Database (D1) - Migraties

```
# Run migration
wrangler d1 execute exact-mcp-db --file=migrations/XXXX_name.sql

# Of via console
Cloudflare Dashboard → D1 → Console → Paste SQL
```

---

## Environment Variables

### Worker (exact-mcp-api)

Configureer via: Dashboard → Workers → exact-mcp-api → Settings → Variables

| Variable | Beschrijving | Secret? |
|----------|--------------|---------|
| `EXACT_CLIENT_ID` | Exact OAuth client ID | Ja |
| `EXACT_CLIENT_SECRET` | Exact OAuth client secret | Ja |
| `ENCRYPTION_KEY` | Token encryption key | Ja |
| `SENTRY_DSN` | Sentry error tracking | Optioneel |

---

## Disaster Recovery

### Database Backup

D1 heeft automatische Time Travel (30 dagen):

```bash
# Lijst van bookmarks
wrangler d1 time-travel info exact-mcp-db

# Restore naar specifiek moment
wrangler d1 time-travel restore exact-mcp-db --timestamp "2026-01-25T10:00:00Z"
```

### Worker Rollback

```bash
# Via dashboard: Workers → Deployments → ... → Rollback
# Of via wrangler:
wrangler rollback
```

### Pages Rollback

Dashboard → Pages → exact-online-mcp → Deployments → Rollback to deployment

---

## Security Checklist

- [x] HTTPS only (Cloudflare enforced)
- [x] API keys hashed (SHA-256)
- [x] OAuth tokens encrypted
- [x] Rate limiting enabled
- [ ] SENTRY_DSN configureren (optioneel)
- [ ] WAF rules voor scanner bots (optioneel)

---

## Cost Estimate (Free Tier)

| Resource | Free Tier | Huidig Gebruik |
|----------|-----------|----------------|
| Workers requests | 100k/day | ~1k/day |
| Workers CPU | 10ms/request | 0.96ms avg |
| D1 reads | 5M/day | ~100/day |
| D1 writes | 100k/day | ~10/day |
| D1 storage | 5GB | <1MB |
| Pages builds | 500/month | ~20/month |

**Status:** Ruim binnen free tier

---

## Useful Commands

```bash
# Deploy worker
cd apps/mcp-server && npx wrangler deploy

# Tail worker logs
npx wrangler tail exact-mcp-api

# D1 query
npx wrangler d1 execute exact-mcp-db --command "SELECT * FROM users"

# D1 migrations
npx wrangler d1 execute exact-mcp-db --file=migrations/0014_new.sql

# Check worker status
npx wrangler whoami
```

---

## Contacts

| Rol | Wie | Verantwoordelijkheid |
|-----|-----|----------------------|
| Infrastructure | Daan | Workers, D1, deploys |
| Frontend | Lisa | Pages, UI |
| API/MCP | Ruben | MCP protocol |
| Exact Integration | Joost | OAuth, API calls |

---

---

## Email Infrastructure (Resend)

### Outbound Email
| Eigenschap | Waarde |
|------------|--------|
| Provider | Resend |
| From Address | support@praatmetjeboekhouding.nl |
| Domain | praatmetjeboekhouding.nl (verified) |

**Capabilities:**
- Transactionele emails (welkom, alerts, replies)
- Admin notificaties
- Customer support replies

### Inbound Email
| Eigenschap | Waarde |
|------------|--------|
| Webhook URL | `https://praatmetjeboekhouding.nl/api/email/inbound` |
| Event | `email.received` |
| Signature | Svix HMAC verification |

**MX Record:**
```
praatmetjeboekhouding.nl MX 10 inbound.resend.com
```

**Inbound Flow:**
```
Customer sends email → Resend receives
        │
        ▼
Webhook to /api/email/inbound
        │
        ▼
Svix signature verification
        │
        ▼
Domain filter (ignore own domains)
        │
        ▼
User matching (email + aliases)
        │
        ▼
Store in communication_events
```

**Environment Variables:**
| Variable | Beschrijving | Secret? |
|----------|--------------|---------|
| `RESEND_API_KEY` | Resend API key | Ja |
| `RESEND_WEBHOOK_SECRET` | Svix webhook secret | Ja |

**Loop Prevention:**
Emails van eigen domeinen (`@praatmetjeboekhouding.nl`, `@chefdata.nl`) worden genegeerd om loops te voorkomen.

---

### Admin Inbox

**URL:** `/admin/inbox`

**Features:**
| Feature | Beschrijving |
|---------|--------------|
| Tabs | Inkomend / Verzonden |
| Filters | Type, onbekende afzenders |
| Bulk acties | Selecteer + verwijder |
| Thread view | Volledig gesprek met context |
| Reply | Direct reageren met email optie |

**API Endpoints:**
| Endpoint | Method | Beschrijving |
|----------|--------|--------------|
| `/admin/inbox` | GET | Inbox overzicht |
| `/admin/inbox/[id]` | GET | Thread view |
| `/api/admin/communications/[id]` | DELETE | Verwijder bericht |
| `/api/admin/communications/bulk-delete` | POST | Bulk verwijderen |

---

*Laatste update: 2026-02-03*
