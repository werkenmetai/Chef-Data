# Backend Taken - Sprint Q1 2026

**Status:** Documentatie voor uitvoering in juiste omgeving
**Auteur:** Daan (Backend Infrastructure)
**Datum:** 2026-02-01
**Branch:** feature/proactive-outreach

---

## Samenvatting Status

| Taak | Status | Prioriteit |
|------|--------|------------|
| 1. Cloudflare Requests Onderzoek | ✅ DONE | - |
| 2. 'starter' Plan Type Fix | ✅ DONE (PR #133) | - |
| 3. Email HTML Escaping | ✅ DONE | - |
| 4. Admin Auth Centraliseren | ✅ DONE | - |
| 5. Database Indexes | ✅ DONE (PR #134) | - |
| 6. Migraties Check | ✅ DONE (PR #134) | - |
| 7. Token Retry Mechanism | ✅ DONE (PR #136) | - |

---

## 1. Cloudflare 163K Requests Onderzoeken

**Status:** ✅ DONE - Onderzocht via wrangler CLI
**Prioriteit:** LOW (geen actie nodig)

### Bevindingen (1 feb 2026)

**Database analyse:**
- D1 queries laatste 24h: ~1.700 (read: 1.255, write: 472)
- api_usage tabel laatste 30 dagen: ~250 MCP API calls
- Unieke users: 1

**Conclusie:** De 163K requests komen NIET van de MCP API.

**Waarschijnlijke bronnen:**
1. Auth Portal (Pages) - page loads, statische assets
2. Cron job - runs elke 5 min (288/dag = ~8.640/maand)
3. Health checks
4. Bot/crawler traffic

**Actie:** Geen actie nodig. De MCP API zelf wordt minimaal gebruikt.
De 163K is waarschijnlijk gecombineerd verkeer van Pages + Workers + assets.

### Origineel Probleem (Gearchiveerd)
- Huidige maand: 163,568 requests
- Workers Free limiet: 100,000 requests/dag
- Overschrijding kan leiden tot service uitval

### Onderzoeksstappen (in Cloudflare Dashboard)

1. **Open Cloudflare Dashboard**
   - Login op https://dash.cloudflare.com
   - Ga naar Workers & Pages > exact-mcp-server

2. **Check Analytics (Workers > Analytics)**
   ```
   - Requests per dag grafiek
   - Requests per uur grafiek
   - Zoek naar spikes of patronen
   ```

3. **Identificeer bronnen (Workers > Logs)**
   ```
   Filter op:
   - Client IP (veel requests van 1 IP = bot)
   - User-Agent (crawlers identificeren)
   - Endpoint (welke routes worden meest aangeroepen)
   - Response status (401/403 loops?)
   ```

4. **Mogelijke oorzaken controleren:**
   - [ ] Bot/crawler traffic (blokkeren via Cloudflare WAF)
   - [ ] Token refresh loops (check `/api/token/refresh` calls)
   - [ ] Error retry loops (check 4xx/5xx response rates)
   - [ ] Legitimate growth (meer users = meer calls)

### Oplossingen indien gevonden

**A. Bot traffic:**
```
Cloudflare Dashboard > Security > WAF > Create Rule
Rule name: Block suspicious bots
Expression: (cf.client.bot) or (http.user_agent contains "bot")
Action: Block
```

**B. Token refresh loops:**
```sql
-- Check voor users met veel refresh attempts
SELECT
  user_id,
  COUNT(*) as refresh_count,
  MIN(timestamp) as first_attempt,
  MAX(timestamp) as last_attempt
FROM api_usage
WHERE endpoint LIKE '%refresh%'
  AND timestamp > datetime('now', '-24 hours')
GROUP BY user_id
HAVING COUNT(*) > 50
ORDER BY refresh_count DESC;
```

**C. Error loops:**
```sql
-- Check voor herhaalde fouten
SELECT
  endpoint,
  response_status,
  COUNT(*) as count
FROM api_usage
WHERE timestamp > datetime('now', '-24 hours')
  AND response_status >= 400
GROUP BY endpoint, response_status
ORDER BY count DESC
LIMIT 20;
```

---

## 2. 'starter' Plan Type Fix

**Status:** ✅ DONE (PR #133 - merged)
**Prioriteit:** -
**Bestand:** `apps/mcp-server/src/auth/api-key.ts`

### Probleem
Plan type in AuthContext interface mist 'starter':
```typescript
// Regel 21 - HUIDIGE situatie
plan: 'free' | 'pro' | 'enterprise';
```

De shared package (`packages/shared/src/types/plans.ts`) heeft WEL 'starter' gedefinieerd.

### Fix

**Bestand:** `apps/mcp-server/src/auth/api-key.ts`

**Regel 21 wijzigen van:**
```typescript
plan: 'free' | 'pro' | 'enterprise';
```

**Naar:**
```typescript
plan: 'free' | 'starter' | 'pro' | 'enterprise';
```

**OF beter - importeer van shared package:**
```typescript
// Bovenaan bestand toevoegen/wijzigen (regel 16):
import { PLAN_LIMITS, type PlanType } from '@exact-mcp/shared';

// Regel 21 wijzigen naar:
plan: PlanType;
```

**Aanvullende locaties om te controleren:**

1. `apps/mcp-server/src/auth/api-key.ts` - regel 177 en 187 (type assertions)
2. Database `users` table - CHECK constraint op `plan` column

```sql
-- Controleer huidige constraint
SELECT sql FROM sqlite_master WHERE name = 'users';

-- Indien nodig, constraint bijwerken (D1 ondersteunt geen ALTER CONSTRAINT)
-- Moet via nieuwe migratie met tabel recreatie
```

---

## 3. Email HTML Escaping

**Status:** DONE
**Reden:** Al geimplementeerd

### Huidige implementatie

**Bestand:** `apps/auth-portal/src/lib/security.ts`
```typescript
export function escapeHtml(unsafe: string | null | undefined): string {
  if (unsafe === null || unsafe === undefined) {
    return '';
  }
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

**Gebruik in email.ts:**
```typescript
import { escapeHtml } from './security';
// Wordt gebruikt in alle email templates waar user input voorkomt
```

---

## 4. Admin Auth Centraliseren

**Status:** DONE
**Reden:** Al geimplementeerd

### Huidige implementatie

**Bestand:** `apps/auth-portal/src/lib/admin.ts`

Functies beschikbaar:
- `isAdmin(db, env, cookies)` - Voor API routes
- `isAdminFromLocals(locals, cookies)` - Voor Astro pages
- `getAdminEmails(env)` - Helper voor admin email lijst

### Gebruik in API routes:
```typescript
import { isAdmin } from '../../../lib/admin';

const admin = await isAdmin(db, env, cookies);
if (!admin.isAdmin) {
  return new Response('Forbidden', { status: 403 });
}
```

---

## 5. Database Indexes Toevoegen

**Status:** ✅ DONE (PR #134 - merged, applied to D1)
**Prioriteit:** -

### Nieuwe migratie aanmaken

**Bestand:** `apps/auth-portal/migrations/0022_performance_indexes.sql`

```sql
-- Migration: Performance Indexes
-- Created: 2026-02-01
-- Author: Daan (Backend Infrastructure)
-- Purpose: Improve query performance for common operations

-- Index voor token refresh cron job
-- Query: SELECT * FROM connections WHERE status = 'active' AND token_expires_at < datetime('now', '+1 hour')
CREATE INDEX IF NOT EXISTS idx_connections_expiring
ON connections(status, token_expires_at);

-- Index voor monthly usage queries
-- Query: SELECT COUNT(*) FROM api_usage WHERE user_id = ? AND timestamp > date('now', 'start of month')
CREATE INDEX IF NOT EXISTS idx_api_usage_user_month
ON api_usage(user_id, timestamp);

-- Index voor daily stats queries
CREATE INDEX IF NOT EXISTS idx_api_usage_date
ON api_usage(date(timestamp));

-- Verify indexes exist
-- Run: SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%';
```

### Uitvoeren

```bash
cd apps/auth-portal
npx wrangler d1 execute exact-mcp-db --file=migrations/0022_performance_indexes.sql
```

---

## 6. Migraties Check

**Status:** ✅ DONE (PR #134 - all conflicts resolved and applied)
**Prioriteit:** -

### Probleem

Er zijn twee migratie bestanden met dezelfde prefix `0019_`:
- `0019_outreach_system.sql` - Proactive outreach systeem
- `0019_response_templates.sql` - Response templates

Beide zijn UNTRACKED (niet gecommit).

### Conflict Details

**0019_outreach_system.sql** bevat:
- `outreach_campaigns` table
- `outreach_log` table
- `outreach_cooldowns` table
- `response_templates` table (CONFLICT!)
- ALTER TABLE users (nieuwe columns)
- Seed data voor campaigns en templates

**0019_response_templates.sql** bevat:
- `response_templates` table (CONFLICT!)
- Seed data voor templates

### Resolutie (Uitgevoerd 1 feb 2026)

**Gekozen oplossing: Optie B + rename table**
1. ✅ Behouden `0019_outreach_system.sql` (bevat proactive email templates)
2. ✅ Renamed `0019_response_templates.sql` → `0022_admin_templates.sql`
3. ✅ Table renamed: `response_templates` → `admin_response_templates`
4. ✅ Alle migraties toegepast op D1 database

**Resultaat:**
- `response_templates` - Proactive outreach email templates (trigger-based)
- `admin_response_templates` - Admin support reply templates (category-based)

### Uitvoeren (na conflict resolutie)

```bash
cd apps/auth-portal

# Check huidige migratie status
npx wrangler d1 execute exact-mcp-db --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# Run nieuwe migraties
npx wrangler d1 execute exact-mcp-db --file=migrations/0019_outreach_system.sql
npx wrangler d1 execute exact-mcp-db --file=migrations/0020_feature_flags.sql
```

### Migratie Volgorde (na resolutie)

| # | File | Status | Dependencies |
|---|------|--------|--------------|
| 0019 | outreach_system.sql | PENDING | Geen |
| 0020 | feature_flags.sql | PENDING | Geen |
| 0021 | division_limits.sql | APPLIED? | Check |
| 0022 | performance_indexes.sql | NEW | Geen |

---

## Checklist voor Uitvoering

### Pre-deployment
- [ ] Backup maken van D1 database
- [ ] Cloudflare requests onderzoeken (taak 1)
- [ ] Migratie conflicten oplossen (taak 6)

### Code changes
- [ ] Fix 'starter' plan type in api-key.ts (taak 2)
- [ ] Commit changes met PR review

### Database
- [ ] Run resolved migrations
- [ ] Verify indexes bestaan
- [ ] Test queries performance

### Post-deployment
- [ ] Monitor error rates
- [ ] Check Cloudflare analytics voor request patterns
- [ ] Verify 'starter' plan users kunnen authenticeren

---

## 7. Token Retry Mechanism

**Status:** ✅ DONE (PR #136, Issue #123)
**Prioriteit:** -
**Datum:** 2026-02-01

### Probleem
OAuth token refresh faalde regelmatig waardoor users opnieuw moesten inloggen, ook al was hun refresh token nog 30 dagen geldig.

### Root Cause
Het token refresh cron job had geen recovery path:
1. Bij falen werd status direct op `refresh_failed` gezet
2. Query `WHERE status = 'active'` sloot gefaalde connections permanent uit
3. Geen retry mechanisme - één fout = permanent verloren

### Oplossing
Retry mechanisme met exponential backoff geïmplementeerd:

**Nieuwe status flow:**
```
active → (falen) → retry_pending → (retry) → active (succes)
                                          → refresh_failed (terminal na 5 pogingen)
```

**Exponential backoff:**
| Poging | Wachttijd |
|--------|-----------|
| 1 | 5 minuten |
| 2 | 15 minuten |
| 3 | 1 uur |
| 4 | 6 uur |
| 5 | 24 uur |

### Bestanden Gewijzigd
- `apps/auth-portal/migrations/0024_token_retry_mechanism.sql` - Database schema
- `apps/mcp-server/src/scheduled/token-refresh.ts` - Retry logica
- `docs/knowledge/exact/LESSONS-LEARNED.md` - Documentatie

### Deployment
- [x] Migratie 0024 toegepast op D1
- [x] MCP server gedeployed
- [x] Bestaande `refresh_failed` connections gemigreerd naar `retry_pending`

---

## Contact

Bij vragen of problemen:
- **Daan** - Backend Infrastructure
- **Slack:** #backend-infra
- **Escalatie:** Max (Tech Lead)
