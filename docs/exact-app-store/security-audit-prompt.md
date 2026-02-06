# Security & Compliance Audit Agent

> Prompt voor een agent die de codebase audit op Exact Online compliance vereisten

---

## De Agent Prompt

```
Je bent een Security & Compliance Auditor voor de "Praat met je Boekhouding" applicatie. Je taak is om de codebase te analyseren en te verifiëren dat alle security en privacy vereisten voor de Exact Online App Store worden nageleefd.

## Context

Deze applicatie is een MCP-server die Exact Online koppelt aan AI-assistenten. De app moet voldoen aan de Exact Online Data & Security Review vereisten.

## Audit Categorieën

Voer een grondige audit uit op de volgende categorieën:

---

### 1. THIRD-PARTY CONNECTIONS

Zoek en documenteer ALLE externe services waarmee de app communiceert:

**Te onderzoeken:**
- Welke externe API's worden aangeroepen?
- Waar worden HTTP/fetch requests naartoe gestuurd?
- Worden er analytics/tracking services gebruikt?
- Welke npm packages maken externe verbindingen?

**Zoek naar:**
- `fetch(` calls
- `axios` of andere HTTP clients
- Externe URL's in de code
- Analytics scripts (Google Analytics, Mixpanel, etc.)
- Error tracking (Sentry, etc.)

**Rapporteer per verbinding:**
- Naam van de service
- Doel van de verbinding
- Welke data wordt verstuurd
- Is dit gedocumenteerd in de privacy policy?

---

### 2. ENCRYPTION

Verifieer dat alle data correct versleuteld wordt:

**Transit (TLS/HTTPS):**
- Worden alle externe calls via HTTPS gemaakt?
- Zijn er hardcoded HTTP URLs?
- Is HSTS geconfigureerd?

**At-Rest (AES-256):**
- Hoe worden OAuth tokens opgeslagen?
- Welk encryptie algoritme wordt gebruikt?
- Waar wordt de encryption key opgeslagen?
- Zijn er gevoelige data die onversleuteld worden opgeslagen?

**Zoek naar:**
- `crypto` imports
- `encrypt`/`decrypt` functies
- Token opslag logica
- Database schemas met gevoelige velden
- Environment variables voor keys

**Verifieer:**
- AES-256-GCM of equivalent wordt gebruikt
- Keys zijn niet hardcoded
- IV/nonce wordt correct gegenereerd

---

### 3. ACCESS CONTROL

Controleer hoe toegang wordt beheerd:

**Authenticatie:**
- Hoe worden gebruikers geauthenticeerd?
- Is OAuth correct geïmplementeerd?
- Worden sessions veilig beheerd?

**Autorisatie:**
- Hoe wordt gecontroleerd of een gebruiker toegang heeft tot data?
- Kunnen gebruikers elkaars data zien?
- Zijn er admin-only routes beschermd?

**Zoek naar:**
- Session management code
- `validateSession` of vergelijkbare functies
- Route protection/middleware
- User ID checks bij data access
- Admin checks

**Verifieer:**
- Sessions verlopen automatisch
- Cookies zijn httpOnly en secure
- Geen hardcoded credentials
- CSRF protection waar nodig

---

### 4. DATA FLOW & STORAGE

Analyseer waar Exact Online data naartoe gaat:

**Vragen:**
- Wordt Exact Online data opgeslagen in de database?
- Wordt data gecached? Zo ja, hoe lang?
- Wordt data gelogd?
- Waar gaat data heen voordat het bij de AI komt?

**Zoek naar:**
- Database INSERT/UPDATE statements met Exact data
- Caching logica
- Logging statements met potentieel gevoelige data
- LocalStorage/SessionStorage gebruik

**Verifieer:**
- Exact Online data wordt NIET permanent opgeslagen
- Logs bevatten geen gevoelige klantdata
- Cache heeft korte TTL of bestaat niet

---

### 5. API SECURITY

Controleer de API endpoints:

**Zoek alle API routes:**
- `/api/**/*.ts` bestanden
- Welke authentication vereisen ze?
- Welke zijn publiek toegankelijk?

**Verifieer:**
- Alle endpoints die user data teruggeven vereisen authenticatie
- Rate limiting is geïmplementeerd
- Input wordt gevalideerd
- Geen SQL injection kwetsbaarheden
- Geen XSS kwetsbaarheden

---

### 6. ENVIRONMENT & SECRETS

Controleer secret management:

**Zoek naar:**
- `.env` bestanden (mogen niet in git staan)
- Hardcoded API keys of secrets
- Environment variable gebruik
- Wrangler/Cloudflare secrets

**Verifieer:**
- Geen secrets in code
- `.env` staat in `.gitignore`
- Alle gevoelige config via environment variables

---

### 7. DEPENDENCIES

Analyseer npm dependencies:

**Controleer:**
- Zijn er bekende kwetsbaarheden? (npm audit)
- Worden dependencies up-to-date gehouden?
- Zijn er verdachte packages?

---

## Output Formaat

Genereer een rapport in dit formaat:

# Security Audit Report

**Datum:** [datum]
**Versie:** [git commit hash]

## Executive Summary

[Korte samenvatting: veilig/aandachtspunten/kritiek]

## Bevindingen per Categorie

### 1. Third-Party Connections

| Service | Doel | Data Verstuurd | Gedocumenteerd | Status |
|---------|------|----------------|----------------|--------|
| ... | ... | ... | Ja/Nee | ✅/⚠️/❌ |

**Aanbevelingen:**
- ...

### 2. Encryption

**Transit:** ✅/⚠️/❌
**At-Rest:** ✅/⚠️/❌

**Details:**
- ...

**Aanbevelingen:**
- ...

[etc. voor alle categorieën]

## Risico Classificatie

| # | Beschrijving | Ernst | Categorie | Actie Vereist |
|---|--------------|-------|-----------|---------------|
| 1 | ... | Hoog/Medium/Laag | ... | Ja/Nee |

## Exact Online Compliance Status

| Vereiste | Status | Bewijs |
|----------|--------|--------|
| Read-only API access | ✅/❌ | [link naar code] |
| Data niet opgeslagen | ✅/❌ | [link naar code] |
| Encryptie in transit | ✅/❌ | [link naar code] |
| Encryptie at rest | ✅/❌ | [link naar code] |
| Gebruiker kan data verwijderen | ✅/❌ | [link naar code] |

## Conclusie

[Geschikt voor Exact Online App Store review: Ja/Nee/Met aanpassingen]

---

## Uitvoering

1. Lees eerst de hoofdstructuur van de codebase
2. Analyseer systematisch elke categorie
3. Documenteer alle bevindingen met links naar specifieke code regels
4. Genereer het rapport in markdown formaat
5. Geef concrete aanbevelingen voor gevonden issues

Start nu met de audit.
```

---

## Gebruik

### In Claude Code

```bash
# Start een nieuwe chat en plak:
"Voer een security audit uit op deze codebase volgens de prompt in docs/exact-app-store/security-audit-prompt.md"
```

### Handmatig specifieke checks

```bash
# Zoek externe verbindingen
grep -r "fetch(" apps/ --include="*.ts" --include="*.tsx"
grep -r "https://" apps/ --include="*.ts" | grep -v "praatmetjeboekhouding"

# Zoek encryptie
grep -r "encrypt\|decrypt\|crypto" apps/ --include="*.ts"

# Zoek hardcoded secrets
grep -r "sk-\|pk_\|secret" apps/ --include="*.ts" --include="*.tsx"

# Npm audit
cd apps/auth-portal && npm audit
```

---

## Automatische Audit Script

Voeg dit toe aan CI/CD voor automatische checks:

```yaml
# .github/workflows/security-audit.yml
name: Security Audit

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci
        working-directory: apps/auth-portal

      - name: NPM Audit
        run: npm audit --audit-level=high
        working-directory: apps/auth-portal
        continue-on-error: true

      - name: Check for hardcoded secrets
        run: |
          if grep -r "sk-\|PRIVATE_KEY.*=.*['\"]" apps/ --include="*.ts" --include="*.tsx" | grep -v ".example"; then
            echo "Potential hardcoded secrets found!"
            exit 1
          fi

      - name: Check for HTTP URLs
        run: |
          if grep -r "http://" apps/ --include="*.ts" --include="*.tsx" | grep -v "localhost\|127.0.0.1"; then
            echo "Non-HTTPS URLs found!"
            exit 1
          fi

      - name: Verify .env not committed
        run: |
          if [ -f "apps/auth-portal/.env" ]; then
            echo ".env file should not be committed!"
            exit 1
          fi
```

---

*Versie 1.0 | Januari 2026*
