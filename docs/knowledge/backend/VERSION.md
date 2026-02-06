# Backend Infrastructure Knowledge Base Version

**Beheerder:** Daan (Backend Specialist)

---

## Huidige Versies

| Component | Versie | Datum |
|-----------|--------|-------|
| Cloudflare Workers | `2024.1` | 2026-01-28 |
| D1 Database | `GA` | 2026-01-28 |
| Astro | `4.x` | 2026-01-28 |
| Wrangler | `3.x` | 2026-01-28 |

## Scraped Documentation

| Document | Onderwerp | Datum |
|----------|-----------|-------|
| cloudflare-workers.md | Runtime, limits, bindings | 2026-01-28 |
| cloudflare-d1.md | SQLite database, queries | 2026-01-28 |
| cloudflare-kv.md | Key-value storage, caching | 2026-01-28 |
| astro-cloudflare.md | SSR deployment, adapter | 2026-01-28 |

## Internal Documentation

| Document | Onderwerp | Inhoud |
|----------|-----------|--------|
| DATABASE.md | Complete schema | 20+ tabellen, alle kolommen, indexes, views |
| LESSONS-LEARNED.md | Backend lessons | 10 gedocumenteerde lessons |
| TEST-SCENARIOS.md | Test cases | 8 categorieën, 30+ scenarios |

## Runtime Specificaties

### Cloudflare Workers
| Limit | Waarde | Notities |
|-------|--------|----------|
| CPU time | 10ms (bundled) / 30s (unbound) | Per request |
| Memory | 128MB | Per isolate |
| Script size | 1MB (bundled) / 10MB (unbound) | Compressed |
| Subrequests | 50 (bundled) / 1000 (unbound) | fetch() calls |
| KV reads | 1000/min | Per namespace |
| D1 rows | 100K reads/day (free) | Per database |

### D1 Database
| Limit | Waarde | Notities |
|-------|--------|----------|
| Max DB size | 2GB | Per database |
| Max row size | 1MB | BLOB included |
| Max columns | 100 | Per table |
| Max query | 100ms | Before timeout |
| Max concurrent | 10 | Connections |

## Database Schema Version

| Migratie | Beschrijving | Datum |
|----------|--------------|-------|
| 0001 | Initial schema (users, connections) | 2026-01-15 |
| 0002 | Stripe integration | 2026-01-16 |
| 0003 | Automation fields | 2026-01-17 |
| 0004 | Audit fields | 2026-01-18 |
| 0005 | OAuth tables | 2026-01-19 |
| 0006 | Email preferences | 2026-01-20 |
| 0007 | TOS acceptance | 2026-01-21 |
| 0008 | Support system | 2026-01-22 |
| 0009 | Support seed data | 2026-01-22 |
| 0010 | Connection status | 2026-01-23 |
| 0011 | API usage columns | 2026-01-24 |
| 0012 | Feedback system | 2026-01-25 |
| 0013 | Refresh token expiry | 2026-01-28 |

## Laatste Sync

- **Datum:** 2026-01-28
- **Migraties:** 13 total
- **Tabellen:** users, connections, divisions, api_usage, support_*, feedback

## Changelog

### 2026-01-28
- Initiele kennisbase opgebouwd door Daan
- Cloudflare limits gedocumenteerd
- Database migraties geindexeerd
- OAuth flow gedocumenteerd

## Volgende Check

- **Gepland:** 2026-02-04 (wekelijks)
- **Check op:**
  - Cloudflare Workers updates
  - D1 new features
  - Wrangler deprecations
  - Security patches

## Breaking Changes Log

| Datum | Change | Impact |
|-------|--------|--------|
| 2024-04 | D1 GA release | Stabiele API |
| 2024-09 | Workers bundled → unbound | CPU limits |

## URLs om te monitoren

1. https://developers.cloudflare.com/workers/ - Workers docs
2. https://developers.cloudflare.com/d1/ - D1 docs
3. https://blog.cloudflare.com/ - Platform updates
4. https://github.com/cloudflare/workers-sdk - Wrangler releases

## Environment Variables

| Variabele | Doel | Verplicht |
|-----------|------|-----------|
| TOKEN_ENCRYPTION_KEY | AES-256 token encryption | Ja |
| EXACT_CLIENT_ID | OAuth client | Ja |
| EXACT_CLIENT_SECRET | OAuth secret | Ja |
| RESEND_API_KEY | Email service | Ja |
| STRIPE_SECRET_KEY | Betalingen | Ja (prod) |
