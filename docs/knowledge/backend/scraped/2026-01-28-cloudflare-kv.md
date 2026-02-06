# Cloudflare Workers KV - Key-Value Storage

**Bron:** [Cloudflare KV Docs](https://developers.cloudflare.com/kv/)
**Datum:** 2026-01-28
**Beheerder:** Daan (Backend Specialist)

---

## Wat is Workers KV?

Workers KV is een globally distributed key-value store. Data wordt opgeslagen in centrale stores en gerepliceerd naar alle Cloudflare edge locaties.

---

## ⚠️ Consistency Model

**KV is EVENTUALLY CONSISTENT** - tot 60 seconden delay mogelijk!

```typescript
// ❌ Kan stale data teruggeven
await env.KV.put('counter', '10');
const value = await env.KV.get('counter');
// value might still be '9' or null!

// ✅ Gebruik D1 voor consistent data
// ✅ KV alleen voor read-heavy, write-rarely data
```

### Wanneer KV gebruiken?
| Use Case | KV? | Alternatief |
|----------|-----|-------------|
| Feature flags | ✅ | - |
| Config/settings | ✅ | - |
| Session data | ❌ | D1 of Durable Objects |
| Rate limiting | ❌ | D1 |
| Counters | ❌ | Durable Objects |
| Caching | ✅ | - |

---

## Limits

### Storage
| Plan | Max Storage | Max Value Size |
|------|-------------|----------------|
| Free | 1 GB | 25 MB |
| Paid | Unlimited | 25 MB |

### Operations
| Plan | Reads/day | Writes/day | Lists/day |
|------|-----------|------------|-----------|
| Free | 100,000 | 1,000 | 1,000 |
| Paid | 10M included | 1M included | 1M included |

### Rate Limits
| Method | Limit |
|--------|-------|
| Workers Binding | 1 write/second per key |
| REST API | Lower (use Workers API) |

---

## API Usage

### Basic Operations
```typescript
// Get
const value = await env.KV.get('key');
const json = await env.KV.get('key', 'json');
const buffer = await env.KV.get('key', 'arrayBuffer');

// Put
await env.KV.put('key', 'value');
await env.KV.put('key', JSON.stringify(data));

// Put with expiration
await env.KV.put('key', 'value', {
  expirationTtl: 3600,  // seconds
  // of
  expiration: Math.floor(Date.now() / 1000) + 3600,
});

// Delete
await env.KV.delete('key');

// List keys
const list = await env.KV.list({ prefix: 'user:' });
for (const key of list.keys) {
  console.log(key.name);
}
```

### Metadata
```typescript
// Store with metadata
await env.KV.put('key', 'value', {
  metadata: { version: 1, updatedAt: Date.now() },
});

// Get with metadata
const { value, metadata } = await env.KV.getWithMetadata('key');
```

---

## Wrangler Config

```toml
# wrangler.toml
[[kv_namespaces]]
binding = "KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Preview namespace (for wrangler dev)
[[kv_namespaces]]
binding = "KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
```

---

## Caching Patterns

### Cache-Aside Pattern
```typescript
async function getUser(userId: string, env: Env) {
  // Try cache first
  const cached = await env.KV.get(`user:${userId}`, 'json');
  if (cached) return cached;

  // Fetch from source
  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(userId).first();

  // Cache for 1 hour
  await env.KV.put(`user:${userId}`, JSON.stringify(user), {
    expirationTtl: 3600,
  });

  return user;
}
```

### Cache Invalidation
```typescript
// On user update
await env.DB.prepare('UPDATE users SET name = ?').bind(name).run();
await env.KV.delete(`user:${userId}`);  // Invalidate cache
```

---

## Best Practices

1. **Prefix keys** voor organisatie: `user:123`, `config:feature-x`
2. **Set TTL** voor cache entries om stale data te voorkomen
3. **Niet voor realtime data** - gebruik D1 of Durable Objects
4. **Bulk operations** waar mogelijk voor efficiency
5. **Metadata** voor versioning en tracking

---

## Bronnen

- [KV Limits](https://developers.cloudflare.com/kv/platform/limits/)
- [KV Pricing](https://developers.cloudflare.com/kv/platform/pricing/)
- [KV FAQ](https://developers.cloudflare.com/kv/reference/faq/)
