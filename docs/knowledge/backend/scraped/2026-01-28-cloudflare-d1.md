# Cloudflare D1 - SQLite Database

**Bron:** [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
**Datum:** 2026-01-28
**Beheerder:** Daan (Backend Specialist)

---

## Wat is D1?

D1 is Cloudflare's managed serverless database gebouwd op SQLite. Het draait op de edge en is ontworpen voor horizontale schaling via meerdere kleinere databases.

---

## Limits

### Database Size
| Plan | Limit | Notities |
|------|-------|----------|
| Free | 500 MB | Per database |
| Paid | **10 GB** | Per database |
| Aanbeveling | Horizontal scaling | Per-user of per-tenant databases |

### Query Limits
| Limit | Waarde | Notities |
|-------|--------|----------|
| Bound parameters | **100** | Per query |
| String size | ~2 MB | SQLITE_LIMIT_LENGTH |
| Query timeout | 100 ms | Before timeout |
| Max concurrent | 10 | Connections |

### Free Tier (sinds 2025-02-10)
| Resource | Limit | Reset |
|----------|-------|-------|
| Reads | 5 million/day | 00:00 UTC |
| Writes | 100,000/day | 00:00 UTC |
| Storage | 5 GB | - |

---

## Consistency Model

⚠️ **D1 is eventually consistent** voor reads over meerdere locaties.

```typescript
// ❌ Kan stale data teruggeven direct na write
await env.DB.prepare('UPDATE users SET name = ?').bind('New').run();
const user = await env.DB.prepare('SELECT * FROM users').first();
// user.name might still be old value!

// ✅ Beter: gebruik RETURNING of accepteer eventual consistency
const result = await env.DB.prepare(
  'UPDATE users SET name = ? RETURNING *'
).bind('New').first();
```

---

## Query Patterns

### Prepared Statements (ALTIJD gebruiken)
```typescript
// ✅ Veilig - parameterized
await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();

// ❌ NOOIT - SQL injection risk
await env.DB.prepare(`SELECT * FROM users WHERE id = ${userId}`).all();
```

### Batch Inserts
```typescript
// Max 100 parameters, dus max 10 rows bij 10 kolommen
const stmt = env.DB.prepare(
  'INSERT INTO items (a, b, c) VALUES (?, ?, ?)'
);

// Gebruik batch voor meerdere statements
await env.DB.batch([
  stmt.bind(1, 2, 3),
  stmt.bind(4, 5, 6),
  stmt.bind(7, 8, 9),
]);
```

### Transactions
```typescript
// D1 heeft GEEN echte transactions!
// Batch is atomic, maar geen rollback

await env.DB.batch([
  env.DB.prepare('UPDATE accounts SET balance = balance - 100 WHERE id = ?').bind(from),
  env.DB.prepare('UPDATE accounts SET balance = balance + 100 WHERE id = ?').bind(to),
]);
```

---

## Migrations

### Bestandsstructuur
```
migrations/
├── 0001_initial_schema.sql
├── 0002_add_users.sql
├── 0003_add_connections.sql
└── ...
```

### Uitvoeren
```bash
# Lokaal (development)
wrangler d1 execute exact-mcp-db --local --file=migrations/0001.sql

# Remote (production)
wrangler d1 execute exact-mcp-db --remote --file=migrations/0001.sql
```

### Best Practices
```sql
-- Gebruik IF NOT EXISTS voor veilige re-runs
CREATE TABLE IF NOT EXISTS users (...);

-- Gebruik ALTER TABLE met checks
ALTER TABLE connections ADD COLUMN new_field TEXT;

-- Maak indexes voor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

---

## Time Travel (Backups)

D1 ondersteunt point-in-time recovery voor de laatste 30 dagen.

```bash
# Restore naar specifiek moment
wrangler d1 time-travel restore exact-mcp-db --timestamp "2026-01-25T10:00:00Z"
```

---

## Wrangler Config

```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "exact-mcp-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

## Performance Tips

1. **Gebruik indexes** voor WHERE/ORDER BY kolommen
2. **Batch queries** waar mogelijk
3. **Limit resultaten** met LIMIT clause
4. **Selecteer alleen nodige kolommen** - geen SELECT *
5. **Gebruik EXPLAIN** voor query analysis

```sql
EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = 'test@test.nl';
```

---

## Bronnen

- [D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)
- [D1 FAQ](https://developers.cloudflare.com/d1/reference/faq/)
- [D1 Release Notes](https://developers.cloudflare.com/d1/platform/release-notes/)
