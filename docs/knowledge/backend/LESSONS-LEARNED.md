# Backend Infrastructure Lessons Learned

**Beheerder:** Daan (Backend Specialist)
**Laatste update:** 2026-02-04 (GitHub hygiene + TypeScript type assertions)

Dit document bevat unieke lessen uit PRs, errors en oplossingen voor backend/infra.

---

## Template voor nieuwe lessen

```markdown
## Lesson: [Korte titel]

**Datum:** YYYY-MM-DD
**PR/Commit:** #xxx
**Ernst:** High/Medium/Low

### Probleem
[Wat ging er mis?]

### Root Cause
[Waarom ging het mis?]

### Oplossing
[Hoe hebben we het opgelost?]

### Code Voorbeeld
\`\`\`typescript
// Before (fout)
...

// After (correct)
...
\`\`\`

### Preventie
[Hoe voorkomen we dit in de toekomst?]
```

---

## Lesson: Stale branches en ongemerged PRs blokkeren CI

**Datum:** 2026-02-04
**PR/Commit:** #230, #231
**Ernst:** MEDIUM

### Probleem
PR #230 kon niet mergen (status: CONFLICTING), CI op main faalde na merge van #229. Er waren 6 stale branches die opgeruimd moesten worden.

### Root Cause
1. PR branches worden niet automatisch verwijderd na merge
2. PRs die lang open blijven krijgen merge conflicts met main
3. TypeScript errors in inline scripts (Astro) worden niet altijd lokaal gecheckt

### Oplossing
1. Rebase PR branch op main: `git rebase origin/main`
2. Bij lege PR na rebase: sluiten (changes al in main)
3. Opruimen stale branches:
   ```bash
   # Remote
   git push origin --delete branch-name
   # Lokaal
   git branch -D branch-name
   ```

### Code Voorbeeld
```bash
# START SESSIE - GitHub hygiene protocol
git fetch origin && git pull origin main
gh pr list --state open  # Check open PRs
gh api repos/{owner}/{repo}/branches --jq '.[].name' | grep -v main  # Check stale branches

# Bij conflicting PR
git checkout problem-branch
git rebase origin/main
git push --force-with-lease origin problem-branch
# Of sluit PR als changes al in main zitten

# Cleanup branches
git push origin --delete claude/old-branch
git branch -D claude/old-branch
```

### Preventie
- **Merge PRs dezelfde sessie** - niet laten liggen
- **Delete branch na merge** - `gh pr merge --delete-branch`
- **Start sessie met hygiene check** - altijd eerst opruimen
- **CI notificaties aanzetten** - Slack/Discord webhook voor failed builds

---

## Lesson: HTMLElement types in Astro inline scripts

**Datum:** 2026-02-04
**PR/Commit:** #231
**Ernst:** MEDIUM

### Probleem
CI typecheck faalde met errors:
- `Property 'disabled' does not exist on type 'HTMLElement'`
- `'data' is of type 'unknown'`

### Root Cause
1. `document.getElementById()` returns `HTMLElement | null`, niet specifieke subtypes
2. `response.json()` returns `Promise<unknown>` (niet `any` in strict mode)
3. Astro inline scripts met `<script>` tag worden getypecheck als TypeScript

### Oplossing
Type assertions toevoegen:

### Code Voorbeeld
```typescript
// Before (fout) - HTMLElement heeft geen 'disabled'
const addBtn = document.getElementById('addToKnowledgeBase');
addBtn.disabled = true; // ERROR: Property 'disabled' does not exist

// After (correct) - Cast naar specifiek element type
const addBtn = document.getElementById('addToKnowledgeBase') as HTMLButtonElement | null;
if (addBtn) {
  addBtn.disabled = true; // OK
}

// Before (fout) - response.json() is unknown
const data = await response.json();
if (data.error) { /* ERROR: 'data' is of type 'unknown' */ }

// After (correct) - Type de response
interface ApiResponse {
  error?: string;
  suggested_article?: {
    title_nl: string;
    category: string;
    tags: string[];
    content_nl: string;
  };
}
const data = await response.json() as ApiResponse;
if (data.error) { /* OK */ }
```

### Preventie
- **Run `tsc --noEmit` lokaal voor commit** - vangt type errors
- **Astro check:** `npx astro check` voor Astro-specifieke issues
- **Type DOM elements correct:** Gebruik `as HTMLButtonElement`, `as HTMLInputElement`, etc.
- **Type API responses:** Definieer interfaces voor alle API responses
- **Strict mode:** Houd TypeScript strict mode aan voor betere type safety

---

## Lesson: PR met identieke content aan main na rebase

**Datum:** 2026-02-04
**PR/Commit:** #230
**Ernst:** LOW

### Probleem
Na rebase van conflicting PR was de branch identiek aan main. `git diff origin/main...HEAD` toonde geen wijzigingen.

### Root Cause
De wijzigingen van de PR waren al via een andere route in main terecht gekomen (mogelijk duplicate work of cherry-pick). De rebase detecteerde dit en "skipped previously applied commit".

### Oplossing
PR sluiten met comment dat changes al in main zitten:

### Code Voorbeeld
```bash
# Check of PR nog echte wijzigingen heeft
git diff origin/main...HEAD --stat
# Als leeg: changes zijn al in main

# Sluit de lege PR
gh pr close 230 --comment "Changes already in main after rebase - closing to clean up"
```

### Preventie
- Check altijd diff na rebase
- Communiceer in team over work-in-progress
- Kleine, focused PRs die snel gemerged worden
- Avoid parallel work op dezelfde files

---

## Bekende Patronen

### Token Encryption
- Gebruik altijd `encryptToken()` en `decryptToken()` uit `lib/crypto.ts`
- AES-256-GCM met random IV
- Check `isEncrypted()` voor backwards compatibility

### Database Transactions
- D1 heeft geen echte transactions (SQLite limitation)
- Gebruik `waitUntil()` voor background writes
- Check `meta.changes` voor affected rows

### Cloudflare Workers
- ~~Houd request handlers onder 10ms CPU~~ → Nu 50ms (Paid plan)
- Gebruik `ctx.waitUntil()` voor async work
- Avoid blocking I/O in hot paths
- **Workers Paid Plan actief sinds 2026-02-04** ($5/maand, 50ms CPU, 10M requests)

---

## Lesson: Token decryption moet backwards compatible zijn

**Datum:** 2026-01-24
**Commit:** zie git log
**Ernst:** High

### Probleem
Na toevoegen van token encryption konden bestaande (unencrypted) tokens niet meer gelezen worden.

### Root Cause
`decryptToken()` verwachtte altijd encrypted input, maar database had nog plaintext tokens.

### Oplossing
`isEncrypted()` helper toegevoegd die checkt of token het encrypted format heeft:

### Code Voorbeeld
```typescript
// Before (fout)
const token = await decryptToken(connection.access_token, key);

// After (correct)
import { isEncrypted, decryptToken } from './crypto';

let token = connection.access_token;
if (isEncrypted(token)) {
  token = await decryptToken(token, key);
}
```

### Preventie
- Altijd backwards compatibility checken bij data format changes
- Migrations voor bestaande data
- Unit tests met beide formaten

---

## Lesson: D1 datetime() functies gebruiken voor timestamps

**Datum:** 2026-01-22
**Ernst:** Medium

### Probleem
Timestamps werden inconsistent opgeslagen (soms UTC, soms local).

### Root Cause
Mix van `new Date().toISOString()` in JavaScript en `datetime('now')` in SQL.

### Oplossing
Standaardiseer op SQLite's `datetime('now')` voor consistency:

### Code Voorbeeld
```sql
-- Before (inconsistent)
INSERT INTO users (created_at) VALUES ('2026-01-22T10:00:00.000Z')

-- After (correct)
INSERT INTO users (created_at) VALUES (datetime('now'))

-- For date math
WHERE created_at > datetime('now', '-7 days')
```

### Preventie
- Gebruik altijd `datetime('now')` in SQL voor timestamps
- JavaScript Date alleen voor berekeningen
- Document timezone handling in code

---

## Lesson: Workers KV is eventually consistent

**Datum:** 2026-01-20
**Ernst:** Medium

### Probleem
Rate limiter gaf inconsistente resultaten direct na write.

### Root Cause
KV writes zijn eventually consistent (tot 60s delay mogelijk).

### Oplossing
Rate limiter verplaatst naar D1 voor immediate consistency:

### Code Voorbeeld
```typescript
// Before (fout) - KV
await env.RATE_LIMITS.put(key, count.toString());
const current = await env.RATE_LIMITS.get(key); // Might be stale!

// After (correct) - D1
await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?')
  .bind(key).run();
```

### Preventie
- KV voor read-heavy, write-rarely data (feature flags, config)
- D1 voor data dat consistent moet zijn (rate limits, sessions)
- Document consistency requirements

---

## Lesson: wrangler.toml bindings moeten in alle environments

**Datum:** 2026-01-18
**Ernst:** High

### Probleem
Production deploy faalde met "binding not found" error.

### Root Cause
D1 binding was alleen in `[env.development]` gedefinieerd, niet in `[env.production]`.

### Oplossing
Bindings in top-level of in alle environments:

### Code Voorbeeld
```toml
# Before (fout)
[env.development]
[[d1_databases]]
binding = "DB"

# After (correct)
[[d1_databases]]
binding = "DB"
database_name = "exact-mcp-db"
database_id = "xxx"

[env.production]
# Production-specific overrides only
```

### Preventie
- Bindings altijd top-level definiëren
- CI/CD check voor binding availability
- Test deploy naar staging eerst

---

## Lesson: Astro SSR met Cloudflare adapter vereist specifieke config

**Datum:** 2026-01-17
**Ernst:** Medium

### Probleem
Astro pagina's renderde niet correct op Cloudflare Pages.

### Root Cause
Standaard Astro output is niet compatible met Cloudflare's runtime.

### Oplossing
`@astrojs/cloudflare` adapter met juiste mode:

### Code Voorbeeld
```javascript
// astro.config.mjs
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server', // or 'hybrid'
  adapter: cloudflare({
    mode: 'directory', // For Pages
    runtime: {
      mode: 'local',
      type: 'pages',
    },
  }),
});
```

### Preventie
- Lees adapter docs zorgvuldig
- Test lokaal met `wrangler pages dev`
- Check Cloudflare Pages limitations

---

## Lesson: COALESCE voor partial updates in upsert

**Datum:** 2026-01-28
**Commit:** 8a779de
**Ernst:** Medium

### Probleem
Bij connection update werden nullable velden overschreven met NULL als ze niet meegegeven werden.

### Root Cause
UPDATE statement zette alle velden, ook als nieuwe waarde NULL was.

### Oplossing
Gebruik `COALESCE(?, existing_value)` om alleen te updaten als nieuwe waarde niet NULL is:

### Code Voorbeeld
```sql
-- Before (fout)
UPDATE connections
SET exact_user_id = ?,
    exact_user_name = ?
WHERE id = ?
-- Als ? = NULL, wordt bestaande waarde overschreven!

-- After (correct)
UPDATE connections
SET exact_user_id = COALESCE(?, exact_user_id),
    exact_user_name = COALESCE(?, exact_user_name)
WHERE id = ?
-- Bestaande waarde blijft behouden als ? = NULL
```

### Preventie
- Gebruik COALESCE voor optionele velden in updates
- Documenteer welke velden nullable zijn
- Test met partial data updates

---

## Lesson: Separate tracking voor access en refresh token expiry

**Datum:** 2026-01-28
**Commit:** 8a779de (EXACT-003)
**Ernst:** High

### Probleem
Refresh tokens (30 dagen) verliepen zonder waarschuwing omdat alleen access token expiry (10 min) werd getrackt.

### Root Cause
Database had alleen `token_expires_at` voor access token, niet voor refresh token.

### Oplossing
Nieuwe kolom `refresh_token_expires_at` toegevoegd met migratie:

### Code Voorbeeld
```sql
-- Migration 0013
ALTER TABLE connections ADD COLUMN refresh_token_expires_at TEXT;

-- Bij token refresh
UPDATE connections
SET access_token = ?,
    refresh_token = ?,
    token_expires_at = ?,           -- 10 minuten
    refresh_token_expires_at = ?     -- 30 dagen
WHERE id = ?
```

```typescript
// Calculate both expiries
const accessExpiresAt = new Date(Date.now() + data.expires_in * 1000); // ~10 min
const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
```

### Preventie
- Track alle token types apart
- Proactive alerts voor expiring tokens
- Documenteer token lifetimes in VERSION.md

---

## Lesson: Reset alert flags bij re-authenticatie

**Datum:** 2026-01-28
**Commit:** 8a779de
**Ernst:** Medium

### Probleem
Na re-authenticatie bleven oude alert flags staan, waardoor gebruikers geen nieuwe warnings kregen.

### Root Cause
`expiry_alert_sent` werd niet gereset bij token refresh.

### Oplossing
Reset relevante flags bij elke succesvolle token update:

### Code Voorbeeld
```sql
-- Before (fout)
UPDATE connections
SET access_token = ?, refresh_token = ?, token_expires_at = ?
WHERE id = ?

-- After (correct)
UPDATE connections
SET access_token = ?,
    refresh_token = ?,
    token_expires_at = ?,
    status = 'active',           -- Reset status
    expiry_alert_sent = 0        -- Reset alert flag
WHERE id = ?
```

### Preventie
- Altijd status flags resetten bij state changes
- Documenteer alle flags en hun lifecycle
- Unit tests voor flag reset scenarios

---

## Lesson: Recursive retry met counter parameter

**Datum:** 2026-01-28
**Commit:** 8a779de (EXACT-002)
**Ernst:** High

### Probleem
Rate limit retry logic kon in oneindige loop raken.

### Root Cause
Geen tracking van retry attempts.

### Oplossing
Counter parameter toevoegen aan recursive functie:

### Code Voorbeeld
```typescript
// Before (fout) - kan oneindige loop worden
async function fetchData(url: string): Promise<Data> {
  const response = await fetch(url);
  if (response.status === 429) {
    await sleep(60000);
    return fetchData(url); // Geen limiet!
  }
  return response.json();
}

// After (correct) - met retry counter
const MAX_RETRIES = 3;

async function fetchData(url: string, retryCount = 0): Promise<Data> {
  const response = await fetch(url);
  if (response.status === 429) {
    if (retryCount < MAX_RETRIES) {
      const waitMs = parseInt(response.headers.get('Retry-After') || '60') * 1000;
      await sleep(waitMs);
      return fetchData(url, retryCount + 1);
    }
    throw new RateLimitExceededError();
  }
  return response.json();
}
```

### Preventie
- Altijd retry limits instellen
- Counter als parameter, niet global state
- Log retry attempts voor monitoring

---

## Lesson: Background writes met ctx.waitUntil()

**Datum:** 2026-01-28
**Commit:** 8a779de
**Ernst:** Medium

### Probleem
Response was traag omdat database writes in de critical path zaten.

### Root Cause
Alle writes werden afgewacht voordat response werd gestuurd.

### Oplossing
Non-critical writes in `ctx.waitUntil()` voor async execution:

### Code Voorbeeld
```typescript
// Before (fout) - blocks response
async function handleRequest(request: Request, env: Env): Promise<Response> {
  const result = await processData(request);
  await env.DB.prepare('UPDATE usage SET count = count + 1').run(); // Blocks!
  return new Response(JSON.stringify(result));
}

// After (correct) - async background write
async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const result = await processData(request);

  // Fire-and-forget, doesn't block response
  ctx.waitUntil(
    env.DB.prepare('UPDATE usage SET count = count + 1').run()
  );

  return new Response(JSON.stringify(result));
}
```

### Preventie
- Identify non-critical writes
- Use ctx.waitUntil() for analytics, logging, counters
- Keep critical path minimal
- Errors in waitUntil don't affect response

---

## Lesson: Geen raw SQL buiten Database class

**Datum:** 2026-01-28
**Commit:** af584fc
**Ernst:** High

### Probleem
`admin/exact-check.astro` gebruikte `env.DB.prepare()` rechtstreeks met verkeerde tabelnaam `exact_connections` i.p.v. `connections`. Runtime crash: `SQLITE_ERROR: no such table`.

### Root Cause
Raw SQL query buiten de Database class. Geen typecheck op tabelnamen in SQL strings. Code review miste de fout omdat het in een nieuw bestand zat.

### Oplossing
Tabelnaam gecorrigeerd:

### Code Voorbeeld
```typescript
// Before (fout) - raw SQL met verkeerde tabelnaam
const result = await env.DB.prepare(
  'SELECT COUNT(*) as count FROM exact_connections WHERE status = ?'
).bind('active').first();

// After (correct) - juiste tabelnaam
const result = await env.DB.prepare(
  'SELECT COUNT(*) as count FROM connections WHERE status = ?'
).bind('active').first();

// Best practice - gebruik Database class
const result = await db.getActiveConnectionCount();
```

### Preventie
- **Regel:** Alle database queries via de `Database` class in `lib/database.ts`
- Geen directe `env.DB.prepare()` calls in pagina's of API routes
- CI typecheck zou dit niet vangen (SQL strings), dus code review is critical
- Overweeg een linter regel die `env.DB.prepare` buiten database.ts flagged

---

## Lesson: Type imports controleren bij nieuwe files

**Datum:** 2026-01-28
**Commit:** af584fc
**Ernst:** High

### Probleem
`automation.ts` gebruikte `D1Database` type in een interface zonder het te importeren. TypeScript build failure.

### Root Cause
Nieuw bestand aangemaakt dat types gebruikte uit `@cloudflare/workers-types` zonder expliciete import. De auteur had het type waarschijnlijk via IDE autocompletion gebruikt zonder op de import te letten.

### Oplossing
Missende import toegevoegd:

### Code Voorbeeld
```typescript
// Before (fout) - D1Database niet geimporteerd
import { sendEmail, type Env } from './email';

interface AutomationEnv extends Env {
  DB: D1Database; // ERROR: Cannot find name 'D1Database'
}

// After (correct)
import type { D1Database } from '@cloudflare/workers-types';
import { sendEmail, type Env } from './email';

interface AutomationEnv extends Env {
  DB: D1Database; // OK
}
```

### Preventie
- **CI pipeline met `tsc --noEmit`** zou dit direct vangen
- Altijd `npx astro check` draaien voor merge
- IDE configuratie: enable "organize imports on save"
- Code review: check import sectie bij nieuwe files

---

## Lesson: Standaardiseer env access pattern

**Datum:** 2026-01-28
**Commit:** af584fc
**Ernst:** Medium

### Probleem
`admin.astro` deed `Astro.locals.runtime.env` zonder optional chaining. Crasht als `runtime` undefined is (bijv. tijdens static generation of test).

### Root Cause
Inconsistent pattern: 18+ bestanden gebruiken `?.env` (safe), maar 2-3 oudere files doen directe access. Geen gedeelde helper, elke pagina schrijft het zelf.

### Oplossing
Optional chaining toegevoegd. Beter: shared helper maken.

### Code Voorbeeld
```typescript
// Before (fout) - crasht als runtime undefined
const env = Astro.locals.runtime.env;

// After (correct) - null-safe
const env = Astro.locals.runtime?.env;

// Best practice - shared helper (TODO)
// lib/env.ts
export function getEnv(locals: App.Locals) {
  const env = locals.runtime?.env;
  if (!env) throw new Error('Runtime environment not available');
  return env;
}

// In pagina's:
import { getEnv } from '../lib/env';
const env = getEnv(Astro.locals);
```

### Preventie
- Maak `getEnv()` helper in `lib/env.ts`
- Gebruik in alle pagina's en API routes
- Lint regel: ban directe `Astro.locals.runtime.env` access
- One consistent pattern = zero inconsistency bugs

---

## Code Audit Bevindingen - 2026-01-28

> Auditor: Wim (Code Auditor)
> Scope: email.ts, database.ts, admin/emails API, admin/emails pagina, oauth/login.astro
> Focus: Security, Error Handling, TypeScript Type Safety, Performance

---

### [2026-01-28] OAuth login.astro valideert redirect_uri niet tegen geregistreerde URIs
- **Ernst:** HIGH
- **Bestand:** `apps/auth-portal/src/pages/oauth/login.astro:18,93`
- **Probleem:** De `redirect_uri` parameter wordt direct uit de URL query string gelezen en gebruikt voor de redirect na autorisatie (regel 93: `new URL(redirectUri!)`), zonder te controleren of deze URI overeenkomt met de geregistreerde `redirect_uris` van de OAuth client. De database tabel `oauth_clients` heeft een `redirect_uris` kolom (migratie 0005), maar login.astro controleert hier niet tegen. De MCP server (`apps/mcp-server/src/auth/oauth.ts:384-390`) doet deze validatie WEL in het `/authorize` endpoint voordat het doorverwijst naar login.astro, maar als een aanvaller login.astro direct benadert, ontbreekt deze bescherming. PKCE mitigeert het risico deels (aanvaller heeft code_verifier nodig), maar defense-in-depth vereist validatie op beide plaatsen.
- **Oplossing:** Voeg redirect_uri validatie toe in login.astro. Haal de `redirect_uris` op uit de `oauth_clients` tabel en controleer of de meegegeven `redirect_uri` in de lijst staat voordat de auth code wordt aangemaakt. Gebruik de bestaande Database class hiervoor (voeg een `getOAuthClient()` method toe).

---

### [2026-01-28] OAuth consent formulier mist CSRF bescherming
- **Ernst:** HIGH
- **Bestand:** `apps/auth-portal/src/pages/oauth/login.astro:213-221`
- **Probleem:** Het POST formulier voor "Toegang verlenen" bevat geen CSRF token. Een aanvaller die de OAuth parameters kent (client_id, redirect_uri, code_challenge) zou een pagina kunnen maken die automatisch het consent formulier indient namens de ingelogde gebruiker. De `state` parameter beschermt de CLIENT tegen CSRF, maar beschermt NIET de authorization server tegen het forceren van autorisatie. In combinatie met het ontbreken van redirect_uri validatie (zie vorig issue) vergroot dit het aanvalsoppervlak.
- **Oplossing:** Voeg een CSRF token toe aan het autorisatie formulier. Genereer een uniek token, sla het op in de sessie of als secure cookie, en valideer het bij de POST request. Alternatiief: gebruik het `auth_request_id` (regel 16) als CSRF-achtige verificatie door het server-side op te slaan en bij POST te valideren.

---

### [2026-01-28] OAuth login.astro POST handler mist try/catch
- **Ernst:** HIGH
- **Bestand:** `apps/auth-portal/src/pages/oauth/login.astro:63-113`
- **Probleem:** Het POST blok dat de authorization code aanmaakt en de database INSERT uitvoert (regels 74-90) heeft geen try/catch error handling. Als de database operatie faalt (bijv. door een constraint violation, connection timeout, of disk full), crasht de pagina met een unhandled error. Dit leidt tot een slechte gebruikerservaring en lekt mogelijk interne foutmeldingen naar de gebruiker. De GET flow heeft WEL impliciete error handling via de `error` variabele.
- **Oplossing:** Wrap het POST blok in een try/catch. Bij een fout: stel de `error` variabele in op een gebruikersvriendelijke melding en laat de pagina renderen in plaats van te crashen. Log de fout server-side voor debugging.

---

### [2026-01-28] Raw SQL queries buiten Database class (herhaald patroon)
- **Ernst:** MEDIUM
- **Bestand:** `apps/auth-portal/src/pages/admin/emails/index.astro:67-74` en `apps/auth-portal/src/pages/oauth/login.astro:38-41,74-90`
- **Probleem:** Twee nieuwe bestanden gebruiken `env.DB.prepare()` rechtstreeks in plaats van via de Database class. Dit is hetzelfde patroon dat eerder is gedocumenteerd (zie "Geen raw SQL buiten Database class" hierboven). In `admin/emails/index.astro` wordt een stats query direct uitgevoerd. In `login.astro` worden OAuth client lookup en auth code INSERT direct gedaan. Dit vergroot het risico op: (1) SQL fouten door verkeerde tabelnamen (reeds eerder voorgekomen), (2) inconsistente query patronen, (3) moeilijker onderhoud.
- **Oplossing:** Verplaats de stats query naar een `getEmailStats()` methode in de Database class. Voeg OAuth-specifieke methods toe: `getOAuthClient(clientId)`, `createAuthCode(...)`. Hiermee wordt alle database interactie gecentraliseerd.

---

### [2026-01-28] HTML injection in email templates via ongesanitiseerde gebruikersinput
- **Ernst:** MEDIUM
- **Bestand:** `apps/auth-portal/src/lib/email.ts:138,217,524,539`
- **Probleem:** Gebruikersnamen, email adressen en error details worden zonder HTML escaping in email templates ge-interpoleerd. Voorbeelden: (1) `sendAdminAlert` op regel 138: `<p>${message}</p>` - message kan HTML bevatten. (2) `welcomeEmail` op regel 217: `Welkom, ${userName}` - userName kan `<script>` of HTML tags bevatten. (3) `adminNewUserAlert` op regel 524: `${user.email}` en `${user.name}` direct in HTML. (4) `adminErrorAlert` op regel 539: `${error.details}` in een `<pre>` tag. Hoewel email clients doorgaans geen JavaScript uitvoeren, kan HTML injection leiden tot: phishing links in admin alerts, misleidende opmaak, of layout-breaking content.
- **Oplossing:** Gebruik de bestaande `escapeHtml()` functie uit `lib/security.ts` voor alle dynamische waarden in email templates. Maak een email-specifieke helper: `escapeEmailContent()` die ook newlines correct afhandelt. Pas toe op: userName, email adressen, error messages, en alle andere user-controlled content.

---

### [2026-01-28] SQL string interpolatie voor LIMIT/OFFSET in database.ts
- **Ernst:** MEDIUM
- **Bestand:** `apps/auth-portal/src/lib/database.ts:1152-1156`
- **Probleem:** In de `getAllConversations()` methode worden `LIMIT` en `OFFSET` waarden via string interpolatie in de SQL query gezet: `query += \` LIMIT ${filters.limit}\``. Hoewel het TypeScript type `number` is, wordt dit niet runtime-afgedwongen. Als een caller per ongeluk een string doorgeeft (TypeScript types zijn compile-time only), zou dit tot SQL injection kunnen leiden. Dit patroon is inconsistent met de rest van de codebase waar `bind()` wordt gebruikt voor alle dynamische waarden.
- **Oplossing:** Gebruik parameterized queries ook voor LIMIT en OFFSET: `.bind(...params, filters.limit, filters.offset)`. Voeg runtime validatie toe: `const safeLimit = Math.max(1, Math.min(Number(filters.limit) || 50, 500))`. De `getEmailLogs()` methode (regel 1755) doet het WEL correct met `.bind(...params, limit, offset)` - volg dat patroon.

---

### [2026-01-28] Admin check logica is gedupliceerd in meerdere bestanden
- **Ernst:** MEDIUM
- **Bestand:** `apps/auth-portal/src/pages/api/admin/emails/index.ts:12-33` en `apps/auth-portal/src/pages/admin/emails/index.astro:42-51`
- **Probleem:** De admin authenticatie check (sessie valideren + email vergelijken met ADMIN_EMAILS) is opnieuw geimplementeerd in het nieuwe email logs endpoint en de email logs pagina. Dezelfde logica bestaat ook in andere admin bestanden. Dit leidt tot: (1) mogelijke inconsistenties als de check wordt gewijzigd op een plek maar niet overal, (2) code duplicatie, (3) verhoogde kans op fouten bij nieuwe admin endpoints.
- **Oplossing:** Maak een gedeelde `isAdmin()` helper in `lib/auth.ts` of `lib/admin.ts` die door alle admin endpoints en pagina's gebruikt wordt. Overweeg een Astro middleware voor admin routes die automatisch de admin check uitvoert.

---

### [2026-01-28] Dead code: ongebruikte oauthParamsBase64 variabele
- **Ernst:** LOW
- **Bestand:** `apps/auth-portal/src/pages/oauth/login.astro:116-123`
- **Probleem:** De variabele `oauthParamsBase64` wordt aangemaakt in het frontmatter script door OAuth parameters te serialiseren naar base64, maar wordt nergens gebruikt in de HTML template. Dit is dead code die verwarrend is voor andere ontwikkelaars en mogelijk een onafgemaakte feature suggereert (bijv. het opslaan van OAuth params voor na de login redirect).
- **Oplossing:** Verwijder de ongebruikte code, of implementeer de beoogde functionaliteit als die nodig is. Als het bedoeld was voor de login redirect flow, documenteer dan wat het doel was.

---

### [2026-01-28] Sequentiele email verzending in sendAdminAlert
- **Ernst:** LOW
- **Bestand:** `apps/auth-portal/src/lib/email.ts:131-143`
- **Probleem:** `sendAdminAlert()` stuurt emails sequentieel in een for-loop met `await` per email. Bij meerdere admin email adressen wordt elk email na de vorige verstuurd, wat onnodige latency toevoegt. Bij 3 admin emails en ~500ms per Resend API call is dat 1.5s wachttijd.
- **Oplossing:** Gebruik `Promise.all()` of `Promise.allSettled()` voor parallelle verzending: `await Promise.allSettled(adminEmails.map(email => sendEmail(...)))`. Dit is vooral belangrijk als het in een request handler zit die niet via `ctx.waitUntil()` wordt aangeroepen.

---

### [2026-01-28] Input validatie ontbreekt voor paginatie parameters in admin email endpoint
- **Ernst:** LOW
- **Bestand:** `apps/auth-portal/src/pages/api/admin/emails/index.ts:61-62`
- **Probleem:** De `limit` en `offset` parameters worden via `parseInt()` geparsed zonder verdere validatie. Negatieve waarden (bijv. `?limit=-1`) worden doorgestuurd naar de database. De database method `getEmailLogs()` heeft een fallback (`filters.limit || 50`), die NaN vangt maar geen negatieve waarden. Een extreem grote `limit` waarde (bijv. 999999999) kan leiden tot memory issues.
- **Oplossing:** Voeg bounds checking toe: `limit: Math.max(1, Math.min(parseInt(...) || 50, 200))` en `offset: Math.max(0, parseInt(...) || 0)`. Dit voorkomt zowel negatieve waarden als onredelijk grote requests.

---

## Lesson: Verkeerde package naam breekt productie build 5x onopgemerkt

**Datum:** 2026-01-31
**PR/Commit:** #124, c25f99f, fix: 7a74049
**Ernst:** HIGH (BLOKKEREND)

### Probleem
Cloudflare Pages builds faalden 5x op rij zonder dat iemand het merkte. De pricing pagina op productie toonde nog de oude prijzen (€49 i.p.v. €9/€25) omdat geen enkele deploy sinds 31 januari succesvol was.

### Root Cause
In PR #124 werd de package import per ongeluk veranderd:
```typescript
// FOUT (commit c25f99f)
import { PLAN_LIMITS } from '@praat-met-je-boekhouding/shared';

// CORRECT (commit 7a74049)
import { PLAN_LIMITS } from '@exact-mcp/shared';
```

De package heet `@exact-mcp/shared` in `package.json`, maar iemand typte de "vriendelijke" naam. TypeScript/build check faalt op dit, maar:
1. Lokaal werd geen build gedraaid voor de merge
2. Cloudflare CI had geen notificatie naar Slack/Discord
3. Niemand checkte de Cloudflare dashboard na de merge

### Oplossing
1. Commit `7a74049` fixte de package naam
2. In Cloudflare: "Retry deployment" klikken voor commit `275b9a4`

### Code Voorbeeld
```typescript
// Verkeerde naamgeving - NOOIT doen
import { X } from '@praat-met-je-boekhouding/shared';  // ❌ Bestaat niet
import { X } from '@exact-mcp/shared';                 // ✅ Correct

// Package.json definiëert de echte naam:
// "name": "@exact-mcp/shared"
```

### Preventie
1. **ALTIJD lokaal builden voor merge:**
   ```bash
   cd apps/auth-portal && npm run build
   ```
2. **CI notificaties aanzetten:** Cloudflare → Settings → Notifications → Slack/Discord webhook voor failed builds
3. **Pre-commit hook toevoegen:**
   ```bash
   # .husky/pre-push
   npm run build --workspaces --if-present
   ```
4. **Monorepo package namen standaardiseren:** Gebruik altijd `@exact-mcp/*` namespace, nooit de "marketing naam"
5. **Dashboard check na elke merge:** Voeg aan PR checklist toe: "Cloudflare deploy succesvol?"

### Impact
- **5 mislukte deploys** in 41 minuten tijd
- **Pricing pagina verouderd:** Gebruikers zagen €49 i.p.v. nieuwe prijzen
- **App Store risico:** Als Exact de verkeerde prijzen had gezien = inconsistentie → afwijzing

---

## Lesson: Plan-gebaseerde feature limits met cooldown mechanisme

**Datum:** 2026-02-01
**Migration:** 0021_division_limits.sql
**Ernst:** FEATURE

### Context
Gebruikers hebben meerdere Exact Online divisies (administraties), maar we willen per plan limiteren hoeveel ze tegelijk actief kunnen hebben.

### Implementatie

#### Database Schema
```sql
-- Migration 0021
ALTER TABLE divisions ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN division_switch_at TEXT;
CREATE INDEX IF NOT EXISTS idx_divisions_active ON divisions(connection_id, is_active);
```

#### Plan Limieten
| Plan | Actieve Divisies |
|------|------------------|
| Free | 2 |
| Starter | 3 |
| Pro | 10 |
| Enterprise | Unlimited |

#### Database Methods (database.ts)
```typescript
// Tellen van actieve divisies
async getActiveDivisionsCount(userId: string): Promise<number>

// Divisies met status ophalen
async getUserDivisionsWithStatus(userId: string): Promise<DivisionWithStatus[]>

// Cooldown check (1 uur tussen switches)
async canSwitchDivision(userId: string): Promise<{ canSwitch: boolean; cooldownUntil?: string }>

// Toggle met plan limit check
async toggleDivisionActive(
  userId: string,
  divisionId: string,
  active: boolean
): Promise<{ success: boolean; error?: string; cooldownUntil?: string }>
```

### Cooldown Pattern
```typescript
// Voorkom "division hopping" met 1-uur cooldown
const canSwitch = await db.canSwitchDivision(userId);
if (!canSwitch.canSwitch) {
  return {
    success: false,
    error: 'Je kunt pas over 1 uur weer wisselen',
    cooldownUntil: canSwitch.cooldownUntil
  };
}

// Na succesvolle switch: update timestamp
await db.updateDivisionSwitchTime(userId);
```

### API Design
```typescript
// POST /api/divisions/toggle
// Body: { divisionId: string, active: boolean }
// Returns: { success: boolean, activeDivisions: number, planLimit: number }

// GET /api/divisions/toggle
// Returns: { divisions[], activeDivisions, planLimit, canSwitch, cooldownUntil }
```

### UI Pattern (Dashboard)
- Toggle switches per divisie
- Limiet indicator: "2/2 administraties actief"
- Cooldown timer met countdown
- Upgrade CTA wanneer limiet bereikt

### Lessen
1. **Defaults matter:** `is_active DEFAULT TRUE` zodat bestaande divisies actief blijven
2. **Cooldown in users tabel:** Niet per divisie, maar per user (voorkomt tegelijk switchen van meerdere divisies)
3. **Index voor performance:** `idx_divisions_active` voor snelle active count queries
4. **Plan limit in constants.ts:** Single source of truth voor limieten

---

## Lesson: Email loops voorkomen door domain filtering

**Datum:** 2026-02-03
**PR/Commit:** #189
**Ernst:** HIGH

### Probleem
Admin alerts voor inbound emails veroorzaakten een oneindige loop. Wanneer een admin alert werd verstuurd naar support@praatmetjeboekhouding.nl, werd deze als inbound email ontvangen, wat weer een nieuwe alert triggerde.

### Root Cause
Inbound email webhook (`/api/email/inbound`) verwerkte ALLE emails, inclusief emails van ons eigen domein. Er was geen filter om ons eigen email verkeer te herkennen.

### Oplossing
Domain filtering toegevoegd aan de inbound webhook om emails van eigen domeinen te negeren:

### Code Voorbeeld
```typescript
// apps/auth-portal/src/pages/api/email/inbound.ts

// Ignore emails from our own domain to prevent loops
const ownDomains = ['praatmetjeboekhouding.nl', 'chefdata.nl'];
const senderDomain = senderEmail.split('@')[1]?.toLowerCase();

if (senderDomain && ownDomains.includes(senderDomain)) {
  console.log(`[Inbound Email] Ignoring email from own domain: ${senderEmail}`);
  return new Response(
    JSON.stringify({ received: true, note: 'Ignored - email from own domain' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### Preventie
- Altijd eigen domeinen filteren bij inbound email processing
- Test email flows end-to-end voordat je naar productie gaat
- Monitor email volumes na deployment
- Consider rate limiting op admin alerts

---

## Lesson: Direction field semantiek documenteren

**Datum:** 2026-02-03
**Ernst:** MEDIUM

### Probleem
Verwarring over wat `direction = 'in'` vs `direction = 'out'` betekent in `communication_events` tabel.

### Root Cause
Naming is vanuit het perspectief van het systeem, niet de admin.

### Oplossing
Duidelijke documentatie:

```typescript
// communication_events.direction
// 'in' = systeem stuurt NAAR klant (verzonden door ons)
// 'out' = klant stuurt NAAR systeem (ontvangen door ons)

// Voor admin inbox tabs:
if (activeTab === 'inkomend') {
  // Emails die WIJ ontvangen = direction 'out' (naar buiten vanuit klant)
  whereClause += " AND ce.direction = 'out'";
} else if (activeTab === 'verzonden') {
  // Emails die WIJ versturen = direction 'in' (naar binnen bij klant)
  whereClause += " AND ce.direction = 'in'";
}
```

### Preventie
- Documenteer field semantiek in DATABASE.md
- Gebruik descriptive names waar mogelijk (bijv. `sent_to_customer` boolean)
- Comments in code bij niet-voor-de-hand-liggende logica

---

## Lesson: Cloudflare WAF Rate Limiting voor webhook endpoints

**Datum:** 2026-02-04
**Audit:** SECURITY-AUDIT-2026-W06 (P2 item)
**Ernst:** MEDIUM

### Context
Webhook endpoints zoals `/api/email/inbound` moeten beschermd worden tegen abuse en DDoS.

### Implementatie
Cloudflare WAF Rate Limiting configureren via Dashboard:

**Stappen:**
1. Ga naar Cloudflare Dashboard → praatmetjeboekhouding.nl
2. Security → WAF → Rate limiting rules
3. Create rule:
   - Name: `Rate limit inbound email webhook`
   - Match: URI Path contains `/api/email/inbound`
   - Rate: 60 requests per minute per IP
   - Action: Block for 1 minute
   - Response: 429 Too Many Requests

**Aanbevolen rules:**

| Endpoint | Rate Limit | Per | Action |
|----------|------------|-----|--------|
| `/api/email/inbound` | 60/min | IP | Block 1 min |
| `/api/exact/webhook` | 120/min | IP | Block 1 min |
| `/api/messages/send` | 10/min | IP | Block 5 min |
| `/api/admin/*` | 30/min | IP | Challenge |

### Verificatie
```bash
# Test rate limiting werkt
for i in {1..70}; do curl -s -o /dev/null -w "%{http_code}\n" https://praatmetjeboekhouding.nl/api/email/inbound; done
# Moet 429 responses geven na 60 requests
```

### Preventie
- Documenteer rate limits in API docs
- Monitor rate limit triggers in Cloudflare Analytics
- Alert bij ongewoon veel blocks

---
