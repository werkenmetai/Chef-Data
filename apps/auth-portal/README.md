# Auth Portal

OAuth portal en dashboard voor Exact Online MCP.

**URL:** https://praatmetjeboekhouding.nl

## Technologie

- **Framework:** Astro
- **Hosting:** Cloudflare Pages
- **Database:** Cloudflare D1
- **Styling:** Tailwind CSS

## Pagina's

| Route | Bestand | Functie |
|-------|---------|---------|
| `/` | index.astro | Landing page |
| `/connect` | connect.astro | Start OAuth flow, kies regio |
| `/callback` | callback.astro | OAuth callback, tokens opslaan |
| `/dashboard` | dashboard.astro | User dashboard, API keys |
| `/admin` | admin.astro | Admin monitoring |
| `/setup` | setup.astro | Claude configuratie instructies |
| `/docs` | docs.astro | Documentatie |
| `/pricing` | pricing.astro | Prijzen en plannen |
| `/terms` | terms.astro | Algemene Voorwaarden |
| `/privacy` | privacy.astro | Privacy Policy |

## API Routes

```
/api/stripe/checkout.ts  - Start Stripe checkout
/api/stripe/portal.ts    - Stripe customer portal
/api/stripe/webhook.ts   - Stripe webhook handler
```

## Bibliotheek Bestanden

### `src/lib/database.ts`

D1 database operaties:
- `findUserByEmail()` / `getOrCreateUser()`
- `upsertConnection()` / `getConnectionsByUser()`
- `syncDivisions()` / `getDivisionsByUser()`
- `createApiKey()` / `validateApiKey()` / `revokeApiKey()`
- `createSession()` / `validateSession()` / `deleteSession()`
- `trackApiCall()` / `getApiUsageStats()`

### `src/lib/exact-auth.ts`

Exact Online OAuth helpers:
- `buildAuthorizationUrl()` - OAuth URL bouwen
- `exchangeCodeForTokens()` - Code -> tokens
- `getCurrentUser()` - User info ophalen
- `getDivisions()` - Administraties ophalen
- `generateState()` / `encodeState()` / `decodeState()`

### `src/lib/stripe.ts`

Stripe helpers (voorbereid):
- `createCheckoutSession()` - Start betaling
- `createBillingPortalSession()` - Abonnementsbeheer
- `verifyWebhookSignature()` - Webhook validatie
- `cancelSubscription()` - Opzegging

## Omgevingsvariabelen

```bash
# Verplicht
EXACT_CLIENT_ID=xxx
EXACT_CLIENT_SECRET=xxx
EXACT_REDIRECT_URI=https://praatmetjeboekhouding.nl/callback

# Optioneel
ADMIN_EMAILS=admin@example.com
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Database Migraties

```bash
# Voer uit in Cloudflare D1 Console

# Initieel schema
cat migrations/0001_initial.sql

# Stripe velden
cat migrations/0002_add_stripe_fields.sql
```

## Development

```bash
# Vanuit root
pnpm --filter auth-portal dev

# Of vanuit deze directory
pnpm dev
```

## Deployment

Automatisch via Cloudflare Pages bij push naar main.

Handmatig:
```bash
pnpm build
npx wrangler pages deploy dist
```

## Tailwind Kleuren

Custom kleuren in `tailwind.config.mjs`:

```javascript
exact: {
  blue: '#0066CC',  // Primary
  dark: '#004C99',  // Hover
  light: '#E6F0FA', // Background
}
```

## Sessie & Auth Flow

1. User klikt "Verbinden" → `/connect`
2. Redirect naar Exact OAuth met state
3. Exact redirect terug → `/callback`
4. Callback:
   - Verify state nonce
   - Exchange code for tokens
   - Get user info from Exact
   - Create/update user in DB
   - Store connection + divisions
   - Create session
   - Generate API key (new users)
5. Set `session_id` cookie
6. Redirect naar `/dashboard`

## API Key Generatie

```typescript
// Format: exa_xxxxxxxx...
const prefix = 'exa';
const random = crypto.getRandomValues(new Uint8Array(24));
const key = `${prefix}_${toHex(random)}`;

// Opslag: PBKDF2 met salt (100,000 iteraties)
// Format: pbkdf2$<salt_hex>$<hash_hex>
const salt = crypto.getRandomValues(new Uint8Array(16));
const hash = await crypto.subtle.deriveBits({
  name: 'PBKDF2',
  salt: salt,
  iterations: 100000,
  hash: 'SHA-256',
}, keyMaterial, 256);
```

> **Note:** Legacy SHA-256 hashes worden nog steeds ondersteund voor backward compatibility.
