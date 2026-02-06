# Hit by a Bus - Noodplan Business Continuity

> **Doel:** Als Matthijs (enige mens in het systeem) wegvalt, kan iemand anders de operatie overnemen met alleen dit document + toegang tot de accounts.
>
> **Doelgroep:** Een technisch persoon die de codebase niet kent.
>
> **Laatst bijgewerkt:** 2026-02-06
> **Eigenaar:** Matthijs Huttinga (CSO)

---

## Stap 0: Wat is dit product?

"[PROJECT_NAAM]" is een MCP server die AI-assistenten (Claude, ChatGPT) verbindt met Exact Online boekhoudsoftware. Gebruikers kunnen in natuurlijke taal vragen stellen over hun administratie.

**Hoe het werkt:**
```
Gebruiker → Claude/ChatGPT → MCP Protocol → Onze server → Exact Online API → Antwoord terug
```

**Business model:** Freemium SaaS (free tier + betaalde plannen).
**Status:** Pre-launch, wacht op Exact App Store goedkeuring.

---

## Stap 1: Accounts & Toegang

### Kritieke accounts (in volgorde van belang)

| # | Account | URL | Eigenaar | Waarvoor |
|---|---------|-----|----------|----------|
| 1 | **Cloudflare** | dash.cloudflare.com | matthijs@chefdata.nl | ALLES draait hier: hosting, database, DNS, workers |
| 2 | **GitHub** | github.com/[GITHUB_ORG] | matthijs@chefdata.nl | Alle broncode, CI/CD, PR workflow |
| 3 | **Exact Online App Center** | apps.exactonline.com | matthijs@chefdata.nl | App Store listing, OAuth credentials |
| 4 | **Resend** | resend.com | matthijs@chefdata.nl | Email verzending ([SUPPORT_EMAIL]) |
| 5 | **OpenAI Platform** | platform.openai.com | matthijs@chefdata.nl | ChatGPT Apps submission |
| 6 | **Anthropic** | console.anthropic.com | matthijs@chefdata.nl | Claude Connector Directory |

### Domeinen

| Domein | Registrar | DNS | Verloopdatum |
|--------|-----------|-----|--------------|
| [PROJECT_DOMEIN] | Cloudflare | Cloudflare | Check dashboard |
| [DOMEIN_ALIAS] | Cloudflare | Cloudflare | Check dashboard |
| chefdata.nl | Cloudflare | Cloudflare | Check dashboard |

### Wachtwoorden & 2FA

**BELANGRIJK:** Alle wachtwoorden en 2FA recovery codes moeten in een encrypted vault staan. Als die er nog niet is: check Matthijs' wachtwoordmanager of fysieke backup.

---

## Stap 2: Draait alles nog?

### Health checks (doe dit EERST)

```bash
# 1. Is de API server online?
curl https://[API_DOMEIN]/health

# 2. Is de website bereikbaar?
curl -I https://[PROJECT_DOMEIN]

# 3. Is de demo werkend?
curl https://[API_DOMEIN]/mcp/exa_demo
```

Als alles 200 teruggeeft: het systeem draait. Je hebt tijd.

### Cloudflare Dashboard checks

1. **Workers** → `exact-mcp-api` → Kijk of er errors zijn in de logs
2. **Pages** → `[PROJECT_SLUG]` → Kijk of laatste deployment gelukt is
3. **D1** → `exact-mcp-db` → Kijk of database bereikbaar is

---

## Stap 3: Architectuur in 5 minuten

```
┌─────────────────────────────────────────────────────────┐
│                    CLOUDFLARE                             │
│                                                           │
│  ┌──────────────────┐    ┌──────────────────────┐        │
│  │  Pages            │    │  Worker               │        │
│  │  (Auth Portal)    │    │  (MCP Server)         │        │
│  │                    │    │                        │        │
│  │  praatmetje...nl  │    │  api.praatmetje...nl  │        │
│  │                    │    │                        │        │
│  │  - Login/Register │    │  - 47 MCP tools        │        │
│  │  - Dashboard      │    │  - OAuth server        │        │
│  │  - Admin panel    │    │  - Exact API calls     │        │
│  │  - Blog/Marketing │    │  - Token refresh cron  │        │
│  └────────┬─────────┘    └───────────┬──────────┘        │
│           │                           │                    │
│           └─────────┬─────────────────┘                    │
│                     │                                      │
│              ┌──────┴──────┐                               │
│              │  D1 Database │                               │
│              │  (SQLite)    │                               │
│              │  32 migraties│                               │
│              └─────────────┘                               │
└─────────────────────────────────────────────────────────┘
                      │
                      │ OAuth + REST API
                      ▼
         ┌────────────────────────┐
         │   Exact Online API     │
         │   (7 regio's)          │
         └────────────────────────┘
```

### Twee apps, een database

| App | Type | Domein | Code |
|-----|------|--------|------|
| **Auth Portal** | Cloudflare Pages (Astro) | [PROJECT_DOMEIN] | `apps/auth-portal/` |
| **MCP Server** | Cloudflare Worker | [API_DOMEIN] | `apps/mcp-server/` |

Beide apps delen dezelfde D1 database (`exact-mcp-db`).

---

## Stap 4: Secrets & Environment Variables

### Productie secrets (in Cloudflare Dashboard)

**Waar:** Cloudflare → Workers/Pages → Settings → Variables and Secrets

| Secret | Wat het doet | Hoe te verkrijgen |
|--------|-------------|-------------------|
| `EXACT_CLIENT_ID` | OAuth client ID voor Exact Online | Exact App Center dashboard |
| `EXACT_CLIENT_SECRET` | OAuth client secret | Exact App Center dashboard |
| `TOKEN_ENCRYPTION_KEY` | Versleuteling van OAuth tokens in DB | Zelf gegenereerd (32 chars). Als je deze kwijtraakt, moeten ALLE gebruikers opnieuw inloggen |
| `SESSION_SECRET` | Sessie versleuteling | Zelf gegenereerd. Kan geroteerd worden (users loggen opnieuw in) |
| `CRON_SECRET` | Authenticatie voor scheduled jobs | Zelf gegenereerd |
| `RESEND_API_KEY` | Email service API key | Resend dashboard |
| `RESEND_WEBHOOK_SECRET` | Inbound email verificatie | Resend dashboard |

### Niet-actieve secrets (voorbereid voor later)

| Secret | Status | Wanneer nodig |
|--------|--------|---------------|
| `STRIPE_SECRET_KEY` | Nog niet actief | Bij activeren betalingen |
| `STRIPE_WEBHOOK_SECRET` | Nog niet actief | Bij activeren betalingen |
| `SENTRY_DSN` | Optioneel | Voor error monitoring |

### GitHub Actions secrets

| Secret | Waarvoor |
|--------|----------|
| `CLOUDFLARE_API_TOKEN` | Deployment naar Cloudflare |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

---

## Stap 5: Hoe te deployen

### Automatisch (normaal)

Push naar `main` branch triggert automatische deployment via GitHub Actions.

```bash
# Clone de repo
git clone https://[GITHUB_REPO_URL].git
cd [REPO_NAAM]

# Installeer dependencies
pnpm install

# Maak een branch (main is beschermd)
git checkout -b fix/mijn-fix

# Commit en push
git add -A && git commit -m "fix: beschrijving"
git push -u origin HEAD

# Maak PR en merge
gh pr create --fill
gh pr merge --merge --delete-branch

# Terug naar main
git checkout main && git pull
```

### Handmatig (noodgeval)

```bash
# MCP Server deployen
cd apps/mcp-server
pnpm build
npx wrangler deploy

# Auth Portal deployen
cd apps/auth-portal
pnpm build
npx wrangler pages deploy dist
```

### Rollback (iets kapot na deploy)

```bash
# Worker terugdraaien
npx wrangler rollback

# Of via Cloudflare Dashboard:
# Workers → exact-mcp-api → Deployments → Selecteer vorige → Rollback
```

---

## Stap 6: Database

### Toegang

```bash
# Query uitvoeren
wrangler d1 execute exact-mcp-db --command "SELECT COUNT(*) FROM users"

# Alle tabellen zien
wrangler d1 execute exact-mcp-db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### Backup & Restore

D1 heeft automatische Time Travel (30 dagen bewaard).

```bash
# Huidige staat bookmarken
wrangler d1 time-travel bookmark exact-mcp-db

# Herstellen naar tijdstip
wrangler d1 time-travel restore exact-mcp-db --timestamp "2026-02-06T10:00:00Z"
```

### Belangrijkste tabellen

| Tabel | Wat erin zit |
|-------|-------------|
| `users` | Klantaccounts, plannen, usage |
| `connections` | Exact Online OAuth tokens (versleuteld) |
| `divisions` | Exact Online administraties per connectie |
| `api_keys` | MCP API keys (gehashed) |
| `oauth_tokens` | OAuth tokens voor Claude/ChatGPT |
| `api_usage` | Alle API calls (rate limiting) |
| `audit_log` | Admin acties audit trail |

Volledig schema: `docs/knowledge/backend/DATABASE.md`

---

## Stap 7: Cron Job (Token Refresh)

Er draait een cron job elke 5 minuten die Exact Online tokens ververst:

```
Schedule: */5 * * * *
Worker: exact-mcp-api
Endpoint: /scheduled (intern)
```

**Als tokens verlopen en niet ververst worden:** Gebruikers krijgen "token vernieuwen mislukt" errors. Ze moeten dan opnieuw inloggen via de website.

Dit draait automatisch in Cloudflare. Je hoeft hier niets voor te doen zolang de Worker draait.

---

## Stap 8: Veelvoorkomende problemen

### "De API geeft errors"

1. Check Worker logs: Cloudflare Dashboard → Workers → exact-mcp-api → Logs
2. Check of Exact Online API bereikbaar is (hun status pagina)
3. Check of tokens niet verlopen zijn: `wrangler d1 execute exact-mcp-db --command "SELECT id, token_expires_at FROM connections WHERE token_expires_at < datetime('now')"`

### "De website is offline"

1. Check Cloudflare status: cloudflarestatus.com
2. Check Pages deployment: Cloudflare Dashboard → Pages → [PROJECT_SLUG]
3. Check DNS: `dig [PROJECT_DOMEIN]`

### "Gebruikers kunnen niet inloggen"

1. Check of de OAuth redirect URL klopt in Exact App Center
2. Redirect URL moet zijn: `https://[PROJECT_DOMEIN]/callback`
3. Check of `EXACT_CLIENT_ID` en `EXACT_CLIENT_SECRET` nog geldig zijn

### "Email werkt niet"

1. Check Resend dashboard voor delivery status
2. Check of MX record klopt: `dig MX [PROJECT_DOMEIN]` → moet `inbound.resend.com` zijn
3. Check of `RESEND_API_KEY` nog geldig is

---

## Stap 9: Kosten & Limieten

### Huidige kosten: ~€0/maand

Alles draait binnen free tiers:

| Service | Free Tier | Huidig Gebruik | Limiet |
|---------|-----------|----------------|--------|
| Cloudflare Workers | 100k requests/dag | ~1k/dag | Ruim voldoende |
| Cloudflare D1 | 5M reads/dag | ~100/dag | Ruim voldoende |
| Cloudflare Pages | 500 builds/maand | ~20/maand | Ruim voldoende |
| Resend Email | 100 emails/dag | ~5/dag | Ruim voldoende |
| GitHub | Gratis (public repo) | - | Geen limiet |

**Wanneer kosten stijgen:** Bij >100k API requests/dag of >5GB database. Dat is ver weg.

---

## Stap 10: Lopende zaken

### App Store Status (feb 2026)

| Platform | Status | Volgende stap |
|----------|--------|---------------|
| **Exact App Store** | Wacht op demo afspraak | Partnermanager opvolgen |
| **Claude Connector** | Ingediend, wacht op review | Afwachten |
| **ChatGPT Apps** | Klaar voor submission | Account verificatie nodig |

### Contactpersonen

| Wie | Waarvoor | Hoe te bereiken |
|-----|----------|-----------------|
| Exact Partnermanager | App Store goedkeuring | Via Exact App Center portal |
| Anthropic team | Claude Connector listing | Via submission portal |

---

## Stap 11: Repo structuur (waar vind je wat)

```
[REPO_NAAM]/
├── apps/
│   ├── auth-portal/          # Website + OAuth + Dashboard
│   │   ├── src/pages/        # Routes (astro bestanden)
│   │   ├── src/lib/          # Business logic
│   │   ├── migrations/       # Database migraties (0001-0032)
│   │   └── wrangler.toml     # Cloudflare Pages config
│   └── mcp-server/           # API server + MCP tools
│       ├── src/tools/        # 47 Exact Online tools
│       ├── src/exact/        # Exact API client
│       ├── src/auth/         # OAuth implementatie
│       └── wrangler.toml     # Cloudflare Worker config
├── operations/               # Strategie, planning, agent prompts
│   ├── STRATEGY.md           # Bedrijfsstrategie
│   ├── ROADMAP.md            # Technische roadmap
│   ├── LESSONS-LEARNED.md    # Organisatie-lessen
│   ├── weeks/                # Weekplanningen
│   └── agents/               # AI agent instructies
├── docs/                     # Documentatie
│   ├── knowledge/            # Kennisbank per domein
│   ├── marketing/            # Content strategie
│   └── compliance/           # Privacy, ToS, verwerkersovereenkomst
└── .github/workflows/        # CI/CD pipelines
```

---

## Stap 12: Security samenvatting

| Maatregel | Status |
|-----------|--------|
| HTTPS overal | Cloudflare enforced |
| API keys gehashed | PBKDF2, 100k iteraties |
| OAuth tokens versleuteld | AES-256-GCM |
| PKCE op OAuth flow | Actief |
| SQL injection preventie | Input sanitization |
| Branch protection | enforce_admins=true |
| Audit logging | Actief |
| Rate limiting | Geimplementeerd in code |
| Security audit | GROEN (feb 2026) |
| Legal audit | GROEN (feb 2026) |

---

## Noodcontact

| Rol | Naam | Email |
|-----|------|-------|
| **Eigenaar/CSO** | Matthijs Huttinga | matthijs@chefdata.nl |
| **Bedrijf** | Chef Data B.V. | - |

---

## Checklist: Eerste week na overname

### Dag 1: Stabilisatie
- [ ] Toegang tot Cloudflare account verkrijgen
- [ ] Toegang tot GitHub account verkrijgen
- [ ] Health checks uitvoeren (Stap 2)
- [ ] Controleer of cron job draait (token refresh)

### Dag 2-3: Orientatie
- [ ] Dit document volledig lezen
- [ ] `operations/STRATEGY.md` lezen
- [ ] Cloudflare Dashboard verkennen
- [ ] Worker logs bekijken (zijn er errors?)

### Dag 4-5: Operationeel
- [ ] Lokale development omgeving opzetten (`pnpm install`)
- [ ] Test een kleine wijziging via PR workflow
- [ ] Controleer database status
- [ ] Email systeem testen

### Week 2: Eigenaarschap
- [ ] Alle secrets documenteren in eigen vault
- [ ] 2FA recovery codes veiligstellen
- [ ] Exact Partnermanager contacten
- [ ] Klanten (indien aanwezig) informeren over verandering

---

## TODO: Encrypted Vault (deadline: W10 - 2 maart 2026)

- [ ] Bitwarden account aanmaken (of alternatief)
- [ ] Alle account credentials invullen (Cloudflare, GitHub, Exact, Resend, OpenAI, Anthropic)
- [ ] 2FA recovery codes opslaan per account
- [ ] Cloudflare secrets backuppen (EXACT_CLIENT_ID, EXACT_CLIENT_SECRET, TOKEN_ENCRYPTION_KEY)
- [ ] Emergency Access instellen (vertrouwenspersoon toevoegen)
- [ ] Master password op papier op veilige fysieke plek

**Status:** Nog niet gestart. Dit is de laatste ontbrekende schakel in de bus-factor mitigatie.

---

*Dit document is geschreven vanuit Principe 7: "Build for Handover" - bouw alsof je morgen wegvalt.*

*Zie ook: `operations/LESSONS-LEARNED.md` Les #8 voor de strategische context achter dit document.*
