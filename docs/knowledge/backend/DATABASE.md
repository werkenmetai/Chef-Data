# Database Schema Documentation

**Beheerder:** Daan (Backend Specialist)
**Database:** Cloudflare D1 (SQLite) - `exact-mcp-db`
**Database ID:** 30788ed4-4a60-4453-b176-dd9da7eecb2d
**Laatste update:** 2026-02-03
**Bron:** Live D1 Console query

---

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CORE TABLES                             │
├─────────────────────────────────────────────────────────────────┤
│  users ──┬── connections ─── divisions                          │
│          ├── user_divisions (OAuth → Exact mapping)             │
│          ├── api_keys                                           │
│          ├── api_usage                                          │
│          ├── sessions                                           │
│          └── tos_acceptances                                    │
├─────────────────────────────────────────────────────────────────┤
│                       OAUTH SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│  oauth_clients ─── oauth_auth_codes                             │
│                └── oauth_tokens                                 │
├─────────────────────────────────────────────────────────────────┤
│                      SUPPORT SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│  support_conversations ─── support_messages                     │
│  knowledge_articles                                             │
├─────────────────────────────────────────────────────────────────┤
│                         SYSTEM                                  │
├─────────────────────────────────────────────────────────────────┤
│  system_settings                                                │
└─────────────────────────────────────────────────────────────────┘
```

**Totaal:** 17 tabellen (incl. user_email_aliases, communication_events)
**Totaal indexes:** 27

---

## Core Tables

### users
Klantaccounts en abonnementen.

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `id` | TEXT | PK | UUID |
| `email` | TEXT | NOT NULL UNIQUE | Email adres |
| `name` | TEXT | | Naam |
| `plan` | TEXT | CHECK ('free','pro','enterprise') | Default: 'free' |
| `api_calls_used` | INTEGER | | Default: 0 |
| `api_calls_reset_at` | TEXT | | Volgende reset datum |
| `stripe_customer_id` | TEXT | | Stripe customer ID |
| `stripe_subscription_id` | TEXT | | Stripe subscription ID |
| `stripe_subscription_status` | TEXT | | Subscription status |
| `stripe_cancel_at_period_end` | INTEGER | | Default: 0 |
| `tos_accepted_version` | TEXT | | ToS versie |
| `tos_accepted_at` | TEXT | | ToS acceptatie timestamp |
| `division_switch_at` | TEXT | | Laatste divisie switch (voor 1-uur cooldown) |
| `email_signature` | TEXT | | Custom email handtekening voor admin replies |
| `created_at` | TEXT | | datetime('now') |
| `updated_at` | TEXT | | datetime('now') |

---

### connections
Exact Online OAuth verbindingen.

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `id` | TEXT | PK | UUID |
| `user_id` | TEXT | NOT NULL FK→users CASCADE | User reference |
| `region` | TEXT | NOT NULL CHECK | 'NL','BE','DE','UK','US','ES','FR' |
| `access_token` | TEXT | NOT NULL | Encrypted OAuth token |
| `refresh_token` | TEXT | NOT NULL | Encrypted refresh token |
| `token_expires_at` | TEXT | NOT NULL | Access token expiry (~10 min) |
| `exact_user_id` | TEXT | | Exact user GUID |
| `exact_user_name` | TEXT | | Exact user naam |
| `exact_email` | TEXT | | Exact email |
| `status` | TEXT | | Default: 'active' |
| `last_used_at` | TEXT | | Laatste API call |
| `created_at` | TEXT | | datetime('now') |
| `updated_at` | TEXT | | datetime('now') |

**Constraints:** UNIQUE(user_id, region)
**Indexes:** `idx_connections_user_id`, `idx_connections_status`, `idx_connections_token_expires_at`

---

### divisions
Exact Online administraties per connectie.

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `id` | TEXT | PK | UUID |
| `connection_id` | TEXT | NOT NULL FK→connections CASCADE | Connection reference |
| `division_code` | INTEGER | NOT NULL | Exact division code |
| `division_name` | TEXT | NOT NULL | Administratie naam |
| `is_default` | BOOLEAN | | Default: FALSE |
| `is_active` | BOOLEAN | | Default: TRUE - Voor plan-gebaseerde divisie limieten |
| `created_at` | TEXT | | datetime('now') |

**Indexes:** `idx_divisions_connection_id`, `idx_divisions_active`

**Divisie Limieten per Plan:**
- Free: 2 actieve divisies
- Starter: 3 actieve divisies
- Pro: 10 actieve divisies
- Enterprise: Onbeperkt

---

### user_divisions
Koppeling tussen OAuth users en Exact Online divisies (P22: Single URL + OAuth).

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `id` | TEXT | PK | UUID |
| `oauth_user_id` | TEXT | NOT NULL FK→users CASCADE | User ID van onze OAuth |
| `connection_id` | TEXT | NOT NULL FK→connections CASCADE | Exact connection reference |
| `division_code` | TEXT | NOT NULL | Division code (gedenormaliseerd) |
| `division_name` | TEXT | | Display naam voor selector |
| `is_default` | BOOLEAN | | Default: TRUE |
| `created_at` | TEXT | | datetime('now') |

**Indexes:** `idx_user_divisions_oauth_user_id`, `idx_user_divisions_connection_id`, `idx_user_divisions_user_default`, `idx_user_divisions_division_code`

**Purpose:** Wanneer een MCP client (ChatGPT/Claude) via OAuth authenticeert, kunnen we via deze tabel opzoeken welke Exact Online divisie(s) de user heeft gekoppeld.

---

### api_keys
API keys voor MCP server toegang.

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `id` | TEXT | PK | UUID |
| `user_id` | TEXT | NOT NULL FK→users CASCADE | User reference |
| `key_hash` | TEXT | NOT NULL UNIQUE | SHA-256 hash |
| `key_prefix` | TEXT | NOT NULL | Eerste 8 chars voor display |
| `name` | TEXT | | Default: 'Default' |
| `last_used_at` | TEXT | | Laatste gebruik |
| `created_at` | TEXT | | datetime('now') |
| `revoked_at` | TEXT | | Revoke timestamp |

**Indexes:** `idx_api_keys_user_id`, `idx_api_keys_key_hash`

---

### api_usage
API call logging voor usage tracking.

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `id` | INTEGER | PK AUTOINCREMENT | Auto-increment |
| `user_id` | TEXT | NOT NULL FK→users CASCADE | User reference |
| `api_key_id` | TEXT | FK→api_keys SET NULL | API key reference |
| `endpoint` | TEXT | NOT NULL | Called endpoint |
| `division_code` | INTEGER | | Used division |
| `timestamp` | TEXT | | datetime('now') |
| `response_status` | INTEGER | | HTTP status code |
| `client_ip` | TEXT | | Client IP address |
| `user_agent` | TEXT | | User agent string |
| `request_id` | TEXT | | Request tracking ID |
| `response_time_ms` | INTEGER | | Response time in ms |

**Indexes:** `idx_api_usage_user_id`, `idx_api_usage_timestamp`, `idx_api_usage_user_agent`

---

### sessions
User sessies voor auth portal.

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `id` | TEXT | PK | Session token |
| `user_id` | TEXT | NOT NULL FK→users CASCADE | User reference |
| `expires_at` | TEXT | NOT NULL | Expiry timestamp |
| `created_at` | TEXT | | datetime('now') |

**Indexes:** `idx_sessions_user_id`, `idx_sessions_expires_at`

---

### tos_acceptances
Terms of Service acceptatie audit trail.

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `id` | TEXT | PK | Default: randomblob UUID |
| `user_id` | TEXT | NOT NULL FK→users CASCADE | User reference |
| `tos_version` | TEXT | NOT NULL | ToS versie |
| `accepted_at` | TEXT | NOT NULL | datetime('now') |
| `ip_address` | TEXT | | Client IP |
| `user_agent` | TEXT | | Browser user agent |

**Indexes:** `idx_tos_user`, `idx_tos_version`

---

## OAuth System Tables

### oauth_clients
OAuth client registraties.

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `id` | TEXT | PK | UUID |
| `client_id` | TEXT | NOT NULL UNIQUE | Public client identifier |
| `client_secret` | TEXT | | Client secret (confidential clients) |
| `client_name` | TEXT | | Display naam |
| `redirect_uris` | TEXT | NOT NULL | JSON array van redirect URIs |
| `grant_types` | TEXT | | Default: '["authorization_code","refresh_token"]' |
| `response_types` | TEXT | | Default: '["code"]' |
| `token_endpoint_auth_method` | TEXT | | Default: 'client_secret_basic' |
| `scope` | TEXT | | Default: 'openid profile' |
| `created_at` | TEXT | | datetime('now') |
| `updated_at` | TEXT | | datetime('now') |

---

### oauth_auth_codes
OAuth authorization codes (korte levensduur).

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `id` | TEXT | PK | UUID |
| `code` | TEXT | NOT NULL UNIQUE | Authorization code |
| `client_id` | TEXT | NOT NULL | Client reference |
| `user_id` | TEXT | NOT NULL | User reference |
| `redirect_uri` | TEXT | NOT NULL | Callback URL |
| `scope` | TEXT | | Granted scopes |
| `code_challenge` | TEXT | | PKCE code challenge |
| `code_challenge_method` | TEXT | | Default: 'S256' |
| `expires_at` | TEXT | NOT NULL | Code expiry (kort!) |
| `created_at` | TEXT | | datetime('now') |
| `used_at` | TEXT | | When code was exchanged |

---

### oauth_tokens
OAuth access/refresh tokens.

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `id` | TEXT | PK | UUID |
| `access_token_hash` | TEXT | NOT NULL UNIQUE | SHA-256 hash |
| `refresh_token_hash` | TEXT | UNIQUE | SHA-256 hash |
| `client_id` | TEXT | NOT NULL | Client reference |
| `user_id` | TEXT | NOT NULL | User reference |
| `scope` | TEXT | | Granted scopes |
| `access_token_expires_at` | TEXT | NOT NULL | Access token expiry |
| `refresh_token_expires_at` | TEXT | | Refresh token expiry |
| `created_at` | TEXT | | datetime('now') |
| `revoked_at` | TEXT | | Revoke timestamp |

---

## Support System Tables

### support_conversations
Hoofd container voor support tickets.

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `id` | TEXT | PK | UUID |
| `user_id` | TEXT | NOT NULL FK→users CASCADE | User reference |
| `subject` | TEXT | NOT NULL | Onderwerp |
| `status` | TEXT | CHECK | Default: 'open'. Opties: open, waiting_user, waiting_support, resolved, closed, spam, archived, replied |
| `priority` | TEXT | CHECK | Default: 'normal'. Opties: low, normal, high, urgent |
| `category` | TEXT | CHECK | Opties: connection, billing, bug, feature, account, other, general |
| `assigned_to` | TEXT | | Assigned admin |
| `handled_by` | TEXT | | 'ai', 'human', 'hybrid' |
| `first_response_at` | TEXT | | First response timestamp |
| `resolved_at` | TEXT | | Resolution timestamp |
| `resolution_type` | TEXT | | How resolved |
| `resolution_notes` | TEXT | | Resolution details |
| `satisfaction_rating` | INTEGER | | 1-5 rating |
| `satisfaction_feedback` | TEXT | | Feedback text |
| `ai_confidence_score` | REAL | | 0.0-1.0 |
| `matched_pattern_id` | TEXT | | AI pattern match |
| `created_at` | TEXT | | datetime('now') |
| `updated_at` | TEXT | | datetime('now') |

**Indexes:** `idx_conversations_user_id`, `idx_conversations_status`, `idx_conversations_created_at`, `idx_conversations_assigned_to`

---

### user_email_aliases
Alternatieve email adressen voor user matching (inbound emails).

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `id` | TEXT | PK | UUID |
| `user_id` | TEXT | NOT NULL FK→users CASCADE | User reference |
| `email` | TEXT | NOT NULL UNIQUE | Alternatief email adres |
| `verified` | BOOLEAN | | Default: FALSE |
| `created_at` | TEXT | | datetime('now') |
| `created_by` | TEXT | | Admin die alias toevoegde |

**Indexes:** `idx_user_email_aliases_email` (LOWER(email)), `idx_user_email_aliases_user_id`

**API Endpoints:**
- `GET /api/admin/users/[id]/emails` - Lijst alle aliases
- `POST /api/admin/users/[id]/emails` - Voeg alias toe
- `DELETE /api/admin/users/[id]/emails?email=xxx` - Verwijder alias

---

### communication_events
Unified log van alle klantcommunicatie (emails, chat, support).

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `id` | TEXT | PK | UUID |
| `user_id` | TEXT | FK→users CASCADE | User reference (NULL voor onbekende afzenders) |
| `type` | TEXT | NOT NULL | 'email', 'chat', 'support', 'system' |
| `direction` | TEXT | NOT NULL | 'in' = naar klant, 'out' = van klant |
| `subject` | TEXT | | Onderwerp |
| `content` | TEXT | | Bericht inhoud |
| `related_id` | TEXT | | Conversatie/thread ID voor groupering |
| `metadata` | TEXT | | JSON met extra data (from_email, to_email, etc.) |
| `archived` | BOOLEAN | | Default: FALSE - Voor inbox archivering |
| `created_at` | TEXT | | datetime('now') |

**Direction Semantiek:**
- `direction = 'in'` = Systeem stuurt NAAR klant (verzonden door ons)
- `direction = 'out'` = Klant stuurt NAAR systeem (ontvangen door ons)

**Indexes:** `idx_communication_events_user_id`, `idx_communication_events_type`, `idx_communication_events_created_at`

**API Endpoints:**
- `GET /admin/inbox` - Overzicht alle communicatie
- `GET /admin/inbox/[id]` - Thread view met context
- `DELETE /api/admin/communications/[id]` - Verwijder bericht
- `POST /api/admin/communications/bulk-delete` - Bulk verwijderen
- `POST /api/admin/communications/archive` - Archiveer berichten

---

### support_messages
Berichten binnen conversations.

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `id` | TEXT | PK | UUID |
| `conversation_id` | TEXT | NOT NULL | Conversation reference |
| `sender_type` | TEXT | NOT NULL | 'user', 'ai', 'admin', 'system' |
| `sender_id` | TEXT | | Sender user ID |
| `content` | TEXT | NOT NULL | Bericht inhoud |
| `content_type` | TEXT | | Default: 'text' |
| `ai_confidence` | REAL | | AI confidence |
| `ai_pattern_used` | TEXT | | Which pattern matched |
| `ai_suggested_articles` | TEXT | | JSON suggested articles |
| `is_internal` | INTEGER | | Default: 0 |
| `metadata` | TEXT | | Extra JSON data |
| `created_at` | TEXT | | datetime('now') |
| `read_at` | TEXT | | Read timestamp |

**Indexes:** `idx_messages_conversation_id`

---

### knowledge_articles
Kennisbank artikelen.

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `id` | TEXT | PK | UUID |
| `slug` | TEXT | UNIQUE NOT NULL | URL slug |
| `title_nl` | TEXT | NOT NULL | Nederlandse titel |
| `title_en` | TEXT | | Engelse titel |
| `content_nl` | TEXT | NOT NULL | Nederlandse content |
| `content_en` | TEXT | | Engelse content |
| `category` | TEXT | NOT NULL | Categorie |
| `tags` | TEXT | | JSON array |
| `sort_order` | INTEGER | | Default: 0 |
| `published` | INTEGER | | Default: 0 |
| `featured` | INTEGER | | Default: 0 |
| `view_count` | INTEGER | | Default: 0 |
| `helpful_count` | INTEGER | | Default: 0 |
| `not_helpful_count` | INTEGER | | Default: 0 |
| `created_at` | TEXT | | datetime('now') |
| `updated_at` | TEXT | | datetime('now') |
| `published_at` | TEXT | | Publish timestamp |

**Indexes:** `idx_articles_slug`, `idx_articles_published`

---

## System Tables

### system_settings
Key-value configuratie store.

| Kolom | Type | Constraints | Beschrijving |
|-------|------|-------------|--------------|
| `key` | TEXT | PK | Setting naam |
| `value` | TEXT | NOT NULL | Setting waarde |
| `description` | TEXT | | Beschrijving |
| `updated_at` | TEXT | | datetime('now') |
| `updated_by` | TEXT | | Who changed it |

---

## All Indexes

| Index | Tabel | Kolom(men) |
|-------|-------|------------|
| `idx_api_keys_key_hash` | api_keys | key_hash |
| `idx_api_keys_user_id` | api_keys | user_id |
| `idx_api_usage_timestamp` | api_usage | timestamp |
| `idx_api_usage_user_agent` | api_usage | user_agent |
| `idx_api_usage_user_id` | api_usage | user_id |
| `idx_articles_published` | knowledge_articles | published |
| `idx_articles_slug` | knowledge_articles | slug |
| `idx_connections_status` | connections | status |
| `idx_connections_token_expires_at` | connections | token_expires_at |
| `idx_connections_user_id` | connections | user_id |
| `idx_conversations_status` | support_conversations | status |
| `idx_conversations_user_id` | support_conversations | user_id |
| `idx_divisions_connection_id` | divisions | connection_id |
| `idx_divisions_active` | divisions | connection_id, is_active |
| `idx_messages_conversation_id` | support_messages | conversation_id |
| `idx_sessions_expires_at` | sessions | expires_at |
| `idx_sessions_user_id` | sessions | user_id |
| `idx_tos_user` | tos_acceptances | user_id |
| `idx_tos_version` | tos_acceptances | tos_version |
| `idx_conversations_created_at` | support_conversations | created_at |
| `idx_conversations_assigned_to` | support_conversations | assigned_to |
| `idx_user_email_aliases_email` | user_email_aliases | LOWER(email) |
| `idx_user_email_aliases_user_id` | user_email_aliases | user_id |
| `idx_communication_events_user_id` | communication_events | user_id |
| `idx_communication_events_type` | communication_events | type |
| `idx_communication_events_created_at` | communication_events | created_at |
| `idx_communication_events_archived` | communication_events | archived |

---

## Schema Inspection Queries

### Alle tabellen opvragen
```sql
SELECT name as table_name, sql as create_statement
FROM sqlite_master
WHERE type = 'table'
  AND name NOT LIKE 'sqlite_%'
  AND name NOT LIKE '_cf_%'
ORDER BY name;
```

### Volledige schema export (DDL)
```sql
SELECT sql || ';' as schema_ddl
FROM sqlite_master
WHERE sql IS NOT NULL
  AND name NOT LIKE 'sqlite_%'
  AND name NOT LIKE '_cf_%'
ORDER BY
  CASE type
    WHEN 'table' THEN 1
    WHEN 'index' THEN 2
    ELSE 3
  END,
  name;
```

### Alle indexes
```sql
SELECT name, tbl_name, sql
FROM sqlite_master
WHERE type = 'index'
  AND sql IS NOT NULL;
```

---

## Common Queries

### User API usage this month
```sql
SELECT COUNT(*) as calls
FROM api_usage
WHERE user_id = ?
  AND timestamp > datetime('now', 'start of month');
```

### Active connections per user
```sql
SELECT u.email, COUNT(c.id) as connections
FROM users u
LEFT JOIN connections c ON u.id = c.user_id AND c.status = 'active'
GROUP BY u.id;
```

### Expiring tokens (24 uur)
```sql
SELECT c.id, c.user_id, c.token_expires_at, u.email
FROM connections c
JOIN users u ON c.user_id = u.id
WHERE c.token_expires_at < datetime('now', '+24 hours')
  AND c.status = 'active';
```

### Support tickets open
```sql
SELECT COUNT(*) as open_tickets,
       AVG(julianday('now') - julianday(created_at)) as avg_age_days
FROM support_conversations
WHERE status = 'open';
```

---

## D1 Console Commands

```
/tables          - Toon alle tabellen
/clear           - Clear console
/bookmark        - Maak time travel bookmark
/restore <id>    - Restore naar bookmark
```

---

## Backup & Recovery

### Time Travel (D1)
```bash
# Restore naar specifiek moment
wrangler d1 time-travel restore exact-mcp-db --timestamp "2026-01-25T10:00:00Z"

# Bookmark huidige state
wrangler d1 time-travel bookmark exact-mcp-db
```

### Export schema
```bash
wrangler d1 execute exact-mcp-db --command ".schema"
```

---

*Laatste sync met productie D1: 2026-02-03*
