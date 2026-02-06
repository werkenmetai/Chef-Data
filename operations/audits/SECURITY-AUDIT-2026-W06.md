# Security Audit Report - Week 6, 2026
## Email & Communication Features

**Auditor:** Bas (Security Manager)
**Datum:** 2026-02-04
**Status:** ORANJE
**Voor:** Matthijs (CEO)

---

## Executive Summary

De nieuwe email- en communicatiefeatures zijn over het algemeen goed beveiligd met consistente admin authorization, parameterized queries en HTML escaping. Er zijn echter enkele medium-priority issues gevonden: optionele webhook signature verificatie, ontbrekende rate limiting, en geen persistent audit logging voor destructieve operaties. Deze issues vereisen aandacht maar vormen geen direct kritiek risico.

---

## Scores per Categorie

| Categorie | Score | Status |
|-----------|-------|--------|
| Email Webhook | 7/10 | ⚠️ |
| Admin Inbox | 8/10 | ✅ |
| Email Signature | 8/10 | ✅ |
| Conversation Management | 7/10 | ⚠️ |
| Email Aliases | 9/10 | ✅ |
| Reply API | 8/10 | ✅ |

**Gemiddelde Score: 7.8/10**

---

## Scope van de Audit

### Features geaudit (19 PRs sinds W05):

| PR | Feature | Geauditeerd |
|----|---------|-------------|
| #177-181 | Email inbound webhook | ✅ |
| #186 | Email loop prevention | ✅ |
| #187 | Admin alert wijziging | ✅ |
| #188 | Admin inbox + bulk delete | ✅ |
| #189 | Inbox tabs/filtering | ✅ |
| #190 | Thread view | ✅ |
| #191 | TypeScript fixes | ✅ |
| #192-195 | Email signature settings | ✅ |
| #193 | Archive functionaliteit | ✅ |

---

## Gedetailleerde Analyse per Categorie

### 1. Email Inbound Webhook (`/api/email/inbound.ts`)

**Positieve bevindingen:**
- Svix HMAC SHA256 signature verificatie correct geimplementeerd (regels 63-120)
- Timestamp verificatie met 5 minuten tolerantie tegen replay attacks (regels 78-83)
- Parameterized SQL queries voor user matching (regel 149, 159-166)
- HTML escaping voor admin alerts via `escapeHtml()` (regels 440-448)
- Eigen domein filtering voorkomt email loops (regels 363-374)

**Issues:**
- Signature verificatie wordt overgeslagen als `RESEND_WEBHOOK_SECRET` niet geconfigureerd is (regels 329-331)
- Geen rate limiting op webhook endpoint
- Geen expliciete spam filtering (alleen eigen domein check)

### 2. Admin Inbox (`inbox.astro`, `inbox/[id].astro`)

**Positieve bevindingen:**
- Admin authorization check op alle pagina's (regels 14-33)
- Bulk delete heeft admin authorization via `/api/admin/communications/bulk-delete`
- SQL queries gebruiken parameterized statements
- Astro escaped automatisch content in templates

**Issues:**
- LIKE query in `[id].astro` (regels 83-98) met `fromEmail` - laag risico omdat waarde uit database komt
- Limit van 100 items per bulk delete is goed (regel 77-81 bulk-delete.ts)

### 3. Email Signature Feature (`/api/admin/signature.ts`)

**Positieve bevindingen:**
- Per-admin isolation correct (signature opgehaald/opgeslagen per `admin.userId`)
- Admin authorization check aanwezig (regels 56-62, 100-107)
- Max length enforcement van 1000 karakters (regels 129-135)
- Type validatie op signature string (regels 122-127)

**Issues:**
- XSS sanitization gebeurt bij rendering in `reply.ts` (regel 280), niet bij opslag - dit is acceptabel

### 4. Conversation Management (`/api/admin/conversations/[id].ts`)

**Positieve bevindingen:**
- Admin authorization op DELETE, PATCH, GET (regels 65-71, 135-141, 241-247)
- Cascade delete correct: messages -> conversation -> events (regels 76-95)
- Status validatie met whitelist (regels 160-166)
- Parameterized queries overal

**Issues:**
- Geen persistent audit logging (alleen `console.log` op regel 97)
- Geen soft-delete optie

### 5. Email Aliases System (`/api/admin/users/[id]/emails.ts`)

**Positieve bevindingen:**
- Admin authorization op alle endpoints (regels 75-81, 145-151, 286-293)
- Email validation met regex (regels 174-179)
- Duplicate prevention voor primary en alias emails (regels 198-225)
- Audit trail via `created_by` veld (regel 232)
- Parameterized queries

**Issues:**
- Email regex is basic - zou RFC 5322 compliant kunnen zijn

### 6. Reply API (`/api/admin/reply.ts`)

**Positieve bevindingen:**
- Admin authorization aanwezig (regels 74-85)
- HTML escaping via `escapeHtml()` in email template (regels 273-276, 280)
- Opt-out check via `email_support_replies` (regels 133-142)
- Email validation aanwezig (regels 113-120)
- Communication event logging voor audit trail

**Issues:**
- Geen rate limiting op reply endpoint

---

## Gevonden Issues

| # | Issue | Ernst | Bestand | Fix |
|---|-------|-------|---------|-----|
| 1 | Optionele webhook signature | P2 | `inbound.ts:329-331` | Maak secret verplicht in productie |
| 2 | Geen rate limiting webhook | P2 | `inbound.ts` | Cloudflare rate limiting |
| 3 | Geen persistent audit log | P2 | `conversations/[id].ts:97` | Log naar audit_log tabel |
| 4 | Geen rate limiting reply | P3 | `reply.ts` | Rate limit per admin session |
| 5 | Basic email regex | P3 | `emails.ts:174` | RFC 5322 validatie |
| 6 | LIKE query met metadata | P3 | `inbox/[id].astro:83-98` | Sanitize fromEmail |
| 7 | Geen spam filtering | P3 | `inbound.ts` | Basis spam checks |

---

## Aanbevelingen

### Prioriteit 1 (P2 - Binnen 1 week):

1. **Verplicht webhook secret in productie**
   ```typescript
   // inbound.ts regel 329
   if (!env.RESEND_WEBHOOK_SECRET) {
     console.error('[Inbound Email] RESEND_WEBHOOK_SECRET not configured');
     return new Response(JSON.stringify({ error: 'Server configuration error' }), {
       status: 500
     });
   }
   ```

2. **Implementeer rate limiting voor webhook**
   - Gebruik Cloudflare Rate Limiting rules op `/api/email/inbound`
   - Suggestie: 60 requests per minuut per IP

3. **Voeg persistent audit logging toe**
   ```sql
   CREATE TABLE audit_log (
     id TEXT PRIMARY KEY,
     actor_id TEXT,
     actor_email TEXT,
     action TEXT NOT NULL,
     resource_type TEXT,
     resource_id TEXT,
     metadata TEXT,
     created_at TEXT DEFAULT (datetime('now'))
   );
   ```

### Prioriteit 2 (P3 - Binnen 2 weken):

4. **Verbeter email validatie** - Gebruik library of strictere regex

5. **Sanitize LIKE query input** - Escape `%` en `_` karakters

6. **Basis spam filtering** - Check SPF/DKIM headers

---

## Vergelijking met W05 Audit

| Metric | W05 | W06 |
|--------|-----|-----|
| Overall Score | 9.0/10 | 7.8/10 |
| P0 Issues | 0 | 0 |
| P1 Issues | 0 | 0 |
| P2 Issues | 2 (gefixed) | 3 |
| P3 Issues | 2 (gefixed) | 4 |

**Verklaring lagere score:**
- W05 auditeerde mature, bestaande code
- W06 auditeert nieuwe, snel gebouwde features
- Scores zijn nog steeds acceptabel (7.8/10)

---

## Bestanden Geauditeerd

- `apps/auth-portal/src/pages/api/email/inbound.ts`
- `apps/auth-portal/src/pages/api/admin/signature.ts`
- `apps/auth-portal/src/pages/api/admin/conversations/[id].ts`
- `apps/auth-portal/src/pages/api/admin/users/[id]/emails.ts`
- `apps/auth-portal/src/pages/api/admin/reply.ts`
- `apps/auth-portal/src/pages/api/admin/communications/bulk-delete.ts`
- `apps/auth-portal/src/pages/admin/inbox.astro`
- `apps/auth-portal/src/pages/admin/inbox/[id].astro`
- `apps/auth-portal/src/lib/security.ts`

---

## Conclusie

**Status: ORANJE** - Geen kritieke (P0) of hoge (P1) issues, maar de P2 issues moeten binnen een week worden aangepakt om de status naar GROEN te brengen.

De nieuwe email- en communicatiefeatures tonen een goed security-bewustzijn met consistente authorization checks, parameterized queries, en proper HTML escaping.

**Hoofdconcerns:**
1. Webhook signature verificatie moet verplicht zijn in productie
2. Rate limiting ontbreekt op kritieke endpoints
3. Audit logging voor destructieve operaties moet naar persistent storage

**Geen blokkers voor launch**, maar P2 issues moeten worden gepland.

---

*Bas - Security Manager*
*"Defense in depth, altijd."*

*Gegenereerd: 2026-02-04*
