# Cloudflare Workers - Runtime & Limits

**Bron:** [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/platform/limits/)
**Datum:** 2026-01-28
**Beheerder:** Daan (Backend Specialist)

---

## Wat zijn Workers?

Cloudflare Workers zijn serverless functions die draaien op Cloudflare's edge network. Ze gebruiken V8 isolates (dezelfde engine als Chrome) voor snelle startup en lage latency.

---

## Runtime Limits

### Memory
| Limit | Waarde | Notities |
|-------|--------|----------|
| Memory per isolate | **128 MB** | Inclusief JS heap + WebAssembly |
| Per-isolate, niet per-request | Ja | Eén isolate handelt meerdere requests af |
| Memory exceeded handling | Graceful | In-flight requests mogen afmaken |

### CPU Time
| Plan | CPU Limit | Notities |
|------|-----------|----------|
| Free | 10 ms | Per request |
| Paid (Standard) | **5 minuten** | Sinds maart 2025 verhoogd |
| Bundled (legacy) | 50 ms | Automatisch gemigreerd |
| Durable Objects | 30 seconden | Reset bij elke incoming request |

### Script Size
| Limit | Waarde | Notities |
|-------|--------|----------|
| Script + metadata | **1 MB** | Compressed |
| Startup time | 1 seconde | Global scope moet binnen 1s parsen |
| Bindings in metadata | Telt mee | D1, KV, secrets, env vars |

### Subrequests
| Plan | Limit | Notities |
|------|-------|----------|
| Free | 50 | fetch() calls per request |
| Paid | 1000 | fetch() calls per request |
| Bulk KV | 1 | Telt als 1 subrequest |

---

## Best Practices

### Memory Optimalisatie
```typescript
// ❌ Slecht - buffert hele response in memory
const data = await response.json();
return new Response(JSON.stringify(transform(data)));

// ✅ Goed - streaming
const { readable, writable } = new TransformStream();
response.body.pipeTo(writable);
return new Response(readable);
```

### Script Size Verkleinen
- Gebruik KV/R2/D1 voor config en static assets
- Split functionaliteit over meerdere Workers
- Gebruik Service Bindings voor Worker-to-Worker calls

### CPU Optimalisatie
- Vermijd blocking loops
- Gebruik `ctx.waitUntil()` voor non-critical work
- Cache zware berekeningen

---

## ExecutionContext

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // ctx.waitUntil() - background work na response
    ctx.waitUntil(logRequest(request));

    // ctx.passThroughOnException() - fallback naar origin bij error
    ctx.passThroughOnException();

    return new Response("Hello");
  }
}
```

---

## Bindings

| Binding Type | Gebruik | Limit |
|--------------|---------|-------|
| KV | Key-value storage | 1000 ops/request |
| D1 | SQLite database | Zie D1 docs |
| R2 | Object storage | 1000 ops/request |
| Durable Objects | Stateful coordination | 30s CPU/request |
| Service Bindings | Worker-to-Worker | Telt als subrequest |
| Queue | Async messaging | - |
| Secrets | Encrypted env vars | - |

---

## Wrangler Commands

```bash
# Lokaal ontwikkelen
wrangler dev

# Deploy
wrangler deploy

# Logs bekijken
wrangler tail

# Secrets beheren
wrangler secret put SECRET_NAME
```

---

## Bronnen

- [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [CPU Performance](https://blog.cloudflare.com/unpacking-cloudflare-workers-cpu-performance-benchmarks/)
