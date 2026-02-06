# Support System Analysis

## Current Architecture Summary

### Tech Stack
- **Frontend**: Astro + Tailwind CSS
- **Backend**: Cloudflare Workers + D1 database
- **Package Manager**: pnpm
- **Monorepo**: Turbo

### Page Structure Pattern
Pages use Astro with frontmatter for server-side logic:
```astro
---
import Layout from '../layouts/Layout.astro';
import { Database } from '../lib/database';

// Server-side logic here
const env = Astro.locals.runtime.env;
const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);
---

<Layout title="Page Title">
  <!-- HTML content -->
</Layout>
```

### Database Pattern
The `Database` class (`apps/auth-portal/src/lib/database.ts`) provides:
- Raw query helpers: `run()`, `get()`, `all()`
- Type-safe methods for specific operations
- Token encryption/decryption
- Session management

### API Route Pattern
API endpoints use Astro's APIRoute type:
```typescript
import type { APIRoute } from 'astro';
import { Database } from '../../../lib/database';

export const GET: APIRoute = async ({ cookies, locals }) => {
  const env = (locals as any).runtime?.env;
  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);

  // Auth check
  const sessionId = cookies.get('session_id')?.value;
  const sessionResult = await db.validateSession(sessionId);

  // Business logic
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### Authentication Pattern
- OAuth via Exact Online (no separate login)
- Session cookie: `session_id` (30 days)
- Admin check: `ADMIN_EMAILS` environment variable (comma-separated)

### i18n System
Located in `apps/auth-portal/src/lib/i18n.ts`:
- `t('key.path', lang)` - Get translation
- `getLanguageFromPath(pathname)` - Detect language from URL
- Languages: 'nl' (default), 'en'
- Translations nested object with `{nl: '', en: ''}` pattern

### UI Patterns
- Cards: `bg-white rounded-xl shadow-sm border border-gray-100 p-6`
- Buttons: `px-4 py-2 bg-exact-blue text-white font-medium rounded-lg`
- Forms: POST with formData, action parameter
- Modals: Custom with backdrop and JS handlers

## Database Schema Overview

### Current Tables
1. **users** - Customer accounts
2. **connections** - Exact Online OAuth connections
3. **divisions** - Accessible administraties
4. **api_keys** - API keys for MCP server
5. **api_usage** - API call tracking
6. **sessions** - Authentication sessions

## Integration Points for Support System

### Navigation
- Add "Support" to `Layout.astro` navigation
- Add badge for open conversations

### Dashboard Widget
- Add support widget to `/dashboard` showing open conversations

### Admin Section
- Extend admin panel at `/admin` with support management

### Error Integration
- Connect MCP server errors to support system

## Reusable Patterns Identified

1. **Session validation** - Copy from `dashboard.astro`
2. **Admin check** - Copy from `admin.astro`
3. **Form handling** - POST with action parameter
4. **Toast notifications** - From dashboard.astro
5. **Modal dialogs** - From dashboard.astro
6. **Card styling** - Consistent Tailwind patterns
7. **API response format** - JSON with proper headers
