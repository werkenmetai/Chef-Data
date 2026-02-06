# Astro + Cloudflare Pages - SSR Deployment

**Bron:** [Astro Cloudflare Docs](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
**Datum:** 2026-01-28
**Beheerder:** Daan (Backend Specialist)

---

## Overview

@astrojs/cloudflare adapter maakt het mogelijk om Astro sites met SSR te deployen naar Cloudflare Pages/Workers.

---

## Installatie

```bash
# Automatisch (aanbevolen)
npx astro add cloudflare

# Handmatig
npm install @astrojs/cloudflare
```

---

## Configuratie

### astro.config.mjs
```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',  // of 'hybrid' voor mixed static/SSR
  adapter: cloudflare({
    mode: 'directory',  // Voor Pages

    // Optioneel: runtime config
    runtime: {
      mode: 'local',
      type: 'pages',
    },

    // Optioneel: session KV binding
    sessionKVBindingName: 'SESSION',
  }),
});
```

### wrangler.toml (voor Workers)
```toml
name = "my-astro-site"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "SESSION"
id = "xxx"

[[d1_databases]]
binding = "DB"
database_name = "my-db"
database_id = "xxx"
```

---

## Output Modes

### Server (full SSR)
```javascript
export default defineConfig({
  output: 'server',  // Alle pagina's SSR
  adapter: cloudflare(),
});
```

### Hybrid (mixed)
```javascript
export default defineConfig({
  output: 'hybrid',  // Static by default
  adapter: cloudflare(),
});

// In page: force SSR
export const prerender = false;
```

### Static pages in SSR mode
```astro
---
// src/pages/privacy.astro
export const prerender = true;  // Pre-render deze pagina
---
```

---

## Bindings Gebruiken

### In Astro pages/endpoints
```astro
---
// src/pages/api/users.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const { env } = locals.runtime;

  // D1 database
  const users = await env.DB.prepare('SELECT * FROM users').all();

  // KV
  const config = await env.KV.get('config', 'json');

  return new Response(JSON.stringify(users));
};
---
```

### TypeScript Types
```typescript
// src/env.d.ts
/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  SESSION: KVNamespace;
}

declare namespace App {
  interface Locals extends Runtime {}
}
```

---

## Sessions

Astro configureert automatisch Workers KV voor sessions.

```astro
---
// Gebruik in page
const session = Astro.session;

// Get value
const userId = await session.get('userId');

// Set value
await session.set('userId', '123');

// Destroy session
await session.destroy();
---
```

---

## Lokaal Ontwikkelen

```bash
# Start dev server met Cloudflare bindings
wrangler pages dev ./dist

# Of met npm script
npm run preview
```

### package.json
```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "wrangler pages dev ./dist"
  }
}
```

---

## Deployment

### Via Git (aanbevolen)
1. Push naar GitHub/GitLab
2. Connect repo in Cloudflare Dashboard
3. Set build command: `npm run build`
4. Set output directory: `dist`

### Via CLI
```bash
# Build
npm run build

# Deploy
npx wrangler pages deploy ./dist
```

---

## Common Issues

### 1. Bindings niet beschikbaar
```typescript
// ❌ Fout - locals.env bestaat niet
const db = Astro.locals.env.DB;

// ✅ Correct - gebruik runtime
const { env } = Astro.locals.runtime;
const db = env.DB;
```

### 2. Build errors met Node modules
```javascript
// astro.config.mjs
export default defineConfig({
  vite: {
    ssr: {
      external: ['node:buffer', 'node:crypto'],
    },
  },
});
```

### 3. Static assets niet gevonden
```toml
# wrangler.toml - zorg dat assets correct zijn
[site]
bucket = "./dist"
```

---

## Best Practices

1. **Prerender waar mogelijk** - sneller en goedkoper
2. **Edge-friendly code** - geen fs, child_process, etc.
3. **Environment variables** via wrangler secrets
4. **Cache responses** waar mogelijk
5. **Test lokaal** met `wrangler pages dev`

---

## Bronnen

- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Deploy Astro to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Cloudflare Pages Astro Guide](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)
