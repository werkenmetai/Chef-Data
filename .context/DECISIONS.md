# Architecture Decision Records (ADR)

## ADR-001: Cloudflare Workers als Runtime

**Datum**: 2026-01-24
**Status**: Accepted
**Beslisser**: Matthijs + Claude

### Context
We moeten kiezen waar de MCP server draait.

### Opties Overwogen

| Optie | Pros | Cons |
|-------|------|------|
| Lokaal (Node.js) | Simpel te debuggen | Moet altijd draaien, onderhoud |
| VPS (DigitalOcean) | Volledige controle | Server beheer, kosten |
| AWS Lambda | Schaalbaar | Complex, cold starts |
| **Cloudflare Workers** | Serverless, edge, goedkoop | Cloudflare lock-in, 50ms CPU limit |

### Beslissing
Cloudflare Workers

### Rationale
- Geen server beheer nodig (past bij AI-first / low maintenance)
- Gratis tier is ruim voldoende voor start
- D1 database en KV storage geïntegreerd
- Edge deployment = lage latency
- Wrangler CLI maakt deploys simpel

### Consequenties
- Moeten binnen 50ms CPU time per request blijven
- Geen langlopende processen mogelijk
- Cloudflare account vereist

---

## ADR-002: AI-First Operations Model

**Datum**: 2026-01-24
**Status**: Accepted
**Beslisser**: Matthijs + Claude

### Context
Hoe minimaliseren we onderhoudslast terwijl we goede service bieden?

### Beslissing
AI agents voor support (L1/L2) en bugfixes (DevOps).

### Rationale
- Matthijs heeft geen tijd voor dagelijkse support
- 80% van support is repetitief en AI-geschikt
- Bugs in isolated tool files zijn AI-fixable
- Alleen kritieke issues en strategische beslissingen naar mens

### Consequenties
- Moet investeren in goede AI agent prompts
- Codebase moet modulair en testbaar zijn
- Monitoring moet actionable zijn
- Sommige klanten willen misschien menselijke support

---

## ADR-003: Read-Only Eerste Versie

**Datum**: 2026-01-24
**Status**: Accepted
**Beslisser**: Matthijs + Claude

### Context
Moeten we direct write operations (facturen maken, boekingen) ondersteunen?

### Beslissing
Nee, eerst read-only. Write operations in v2.

### Rationale
- Read-only kan geen schade aanrichten
- 80% van de waarde zit in lezen en valideren
- Write vereist veel meer edge cases en validatie
- Lager risico voor eerste klanten

### Consequenties
- Beperktere feature set bij launch
- Klanten die willen inboeken moeten wachten
- Minder differentiatie vs. CData (ook read-only)

---

## ADR-004: Context Management in Repository

**Datum**: 2026-01-24
**Status**: Accepted
**Beslisser**: Matthijs + Claude

### Context
Hoe zorgen we dat project context bewaard blijft tussen chat sessies?

### Beslissing
`.context/` folder in de repository met gestructureerde markdown files.

### Rationale
- Versioned samen met code (git history)
- Human-readable én machine-readable
- Geen externe dependencies
- Claude kan het lezen en updaten
- Matthijs kan het ook handmatig editen

### Consequenties
- Moet discipline hebben om te updaten na elke sessie
- Kan automatisch via commit hooks
- Files kunnen groot worden (history)

---

## ADR-005: Turborepo met pnpm

**Datum**: 2026-01-24
**Status**: Accepted
**Beslisser**: Claude

### Context
We hebben een monorepo structuur nodig voor meerdere apps en packages.

### Opties Overwogen

| Optie | Pros | Cons |
|-------|------|------|
| Nx | Feature-rich, generators | Overkill voor dit project |
| Lerna | Mature, veel docs | Legacy, minder actief |
| **Turborepo** | Simpel, snel, Vercel-backed | Minder features dan Nx |
| Geen monorepo | Simpelste | Moeilijker code delen |

### Beslissing
Turborepo met pnpm workspaces

### Rationale
- Simpel en snel genoeg voor onze use case
- Goede caching voor CI
- pnpm is de snelste en meest disk-efficient package manager
- Makkelijk te begrijpen structuur

### Consequenties
- pnpm vereist (niet npm of yarn)
- turbo.json configuratie nodig
- Apps en packages in aparte folders

---

## ADR-006: Domein en Branding

**Datum**: 2026-01-25
**Status**: Accepted
**Beslisser**: Matthijs

### Context
Het project had oorspronkelijk exactmcp.com als domein. Dit moest veranderen.

### Beslissing
- Productnaam: **Praat met je Boekhouding**
- Auth Portal: `praatmetjeboekhouding.nl`
- MCP Server: `api.praatmetjeboekhouding.nl`

### Rationale
- Nederlandse naam spreekt doelgroep (MKB) beter aan
- "Praat met je Boekhouding" beschrijft precies wat het doet
- .nl domein geeft vertrouwen bij Nederlandse ondernemers

### Consequenties
- Alle redirect URIs in Exact Online moesten worden aangepast
- Cloudflare environment variables moesten worden bijgewerkt
- Documentatie moest worden aangepast

---

## ADR-007: Vereenvoudigde MCP Authenticatie

**Datum**: 2026-01-25
**Status**: Accepted
**Beslisser**: Matthijs + Claude

### Context
Klanten vonden het ingewikkeld om Claude Desktop te configureren met headers.

### Opties Overwogen

| Optie | Pros | Cons |
|-------|------|------|
| Authorization header | Standaard, veilig | Complex voor niet-technische users |
| **API key in URL path** | Simpel, één kopie-actie | Key zichtbaar in URL |
| Query parameter | Simpel | Key in server logs |

### Beslissing
API key in URL path ondersteunen: `/sse/{api_key}`

### Rationale
- Klant hoeft alleen ONE URL te kopiëren
- Claude Desktop "Add custom connector" werkt direct
- Geen "Advanced settings" nodig
- Key is nog steeds geheim (niet gedeeld publiekelijk)

### Consequenties
- URL bevat API key - moet duidelijk communiceren om niet te delen
- Drie auth methoden te onderhouden (header, URL, query param)
- Simpelere onboarding = meer conversie

---

## ADR-008: Astro voor Auth Portal

**Datum**: 2026-01-24
**Status**: Accepted
**Beslisser**: Claude

### Context
We hadden een framework nodig voor de auth portal.

### Opties Overwogen

| Optie | Pros | Cons |
|-------|------|------|
| Plain HTML | Simpel | Geen componenten, DRY |
| Next.js | Feature-rich | Overkill, Vercel focus |
| **Astro** | SSR, islands, licht | Minder bekend |
| SvelteKit | Modern | Cloudflare setup complex |

### Beslissing
Astro met Cloudflare adapter

### Rationale
- Perfect voor content-heavy pagina's met interactieve elementen
- Native Cloudflare Pages ondersteuning
- Tailwind CSS integratie out-of-box
- Snelle builds, kleine bundles

### Consequenties
- Team moet Astro syntax leren
- Minder community/plugins dan Next.js
- Werkt uitstekend voor onze use case

---

## Template voor Nieuwe Beslissingen

```markdown
## ADR-XXX: [Titel]

**Datum**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded
**Beslisser**: Wie

### Context
Wat is het probleem of de vraag?

### Opties Overwogen
| Optie | Pros | Cons |
|-------|------|------|

### Beslissing
Wat hebben we besloten?

### Rationale
Waarom?

### Consequenties
Wat betekent dit voor de toekomst?
```
