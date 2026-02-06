# Exact Online App Store Review - Centraal Overzicht

> **Status:** Technisch gereed voor review
> **Voortgang:** ~75% (marketing assets nog te maken)
> **Admin pagina:** [/admin/exact-check](/admin/exact-check)

---

## Quick Links

| Document | Beschrijving |
|----------|--------------|
| [App Store Content](./app-store-content.md) | Beschrijvingen, scopes, privacy antwoorden |
| [Demo Script](./demo-script.md) | Scenario voor partnermanager demo |
| [Security Audit Prompt](./security-audit-prompt.md) | Agent prompt voor security checks |

---

## Checklist Status

### ✅ Technisch (100% gereed)

| Item | Status | Bewijs |
|------|--------|--------|
| OAuth 2.0 implementatie | ✅ | `src/lib/exact-auth.ts` |
| Token encryptie (AES-256-GCM) | ✅ | `src/lib/crypto.ts` |
| API rate limiting | ✅ | Geïmplementeerd in MCP server |
| Session management | ✅ | `src/lib/database.ts` |
| HTTPS everywhere | ✅ | Cloudflare SSL |
| OAuth state signing | ✅ | HMAC-SHA256 signatures |
| No Exact data storage | ✅ | Alleen tokens opgeslagen |

### ✅ Security & Compliance (100% gereed)

| Item | Status | Document |
|------|--------|----------|
| Privacy Policy | ✅ | `/privacy` pagina |
| Algemene Voorwaarden | ✅ | `/terms` pagina |
| Verwerkersovereenkomst | ✅ | [Template](../compliance/templates/VERWERKERSOVEREENKOMST.md) |
| GDPR compliance | ✅ | [EU Privacy Analysis](../compliance/eu-privacy-analysis.md) |
| Security audit | ✅ | Geen kritieke issues |

### 🟡 Marketing (60% gereed)

| Item | Status | Locatie |
|------|--------|---------|
| App naam | ✅ | "Praat met je Boekhouding" |
| Korte beschrijving | ✅ | [app-store-content.md](./app-store-content.md) |
| Lange beschrijving | ✅ | [app-store-content.md](./app-store-content.md) |
| Logo 512x512 | ❌ TODO | - |
| Screenshots (3-5x) | ❌ TODO | - |
| Categorieën | ✅ | Rapportage, BI, AI |
| Pricing info | ✅ | €0/€9/€25 per maand |
| Support URL | ✅ | /support |

### 🔴 Demo & Goedkeuring (0% gereed)

| Item | Status | Actie |
|------|--------|-------|
| Demo account | ❌ TODO | Account aanmaken |
| Demo script | ✅ | [demo-script.md](./demo-script.md) |
| Afspraak partnermanager | ❌ TODO | Contact opnemen |
| Factuurgegevens | ❌ TODO | KvK, BTW, IBAN |

---

## Data & Security Review Antwoorden

Kant-en-klare antwoorden voor het Exact formulier:

### Doel van de app
```
Praat met je Boekhouding is een MCP-server die Exact Online koppelt aan
AI-assistenten zoals ChatGPT en Claude. Gebruikers kunnen in natuurlijke
taal vragen stellen over hun boekhouding. De app heeft alleen READ toegang
en kan nooit boekingen aanpassen of verwijderen.
```

### Welke scopes zijn nodig?
```
READ-ONLY toegang tot:
- Financial (Grootboek, Journaalposten)
- CRM (Relaties, Contacten)
- Sales (Facturen, Orders)
- Purchase (Inkoopfacturen)
- Logistics (Artikelen, Voorraad)
- Projects (indien beschikbaar)

GEEN write/manage rechten.
```

### Third-party connections
```
- Cloudflare Workers (EU) - hosting
- Cloudflare D1 (EU) - alleen user/session data
- AI providers - via gebruiker, wij slaan niets op

Exact Online data wordt NIET opgeslagen.
```

### Encryptie
```
Transit: HTTPS/TLS 1.3 voor alle verbindingen
At-rest: AES-256-GCM voor OAuth tokens met PBKDF2 key derivation
```

### Toegangscontrole
```
- OAuth 2.0 met Exact Online
- Session-based auth met secure httpOnly cookies
- Tokens verlopen automatisch (30 dagen)
- Gebruiker kan verbinding altijd intrekken
```

### Data verwijdering
```
Gebruiker kan:
1. Verbinding intrekken via dashboard (direct)
2. Account verwijderen via support (binnen 24 uur)
Alle data wordt permanent verwijderd.
```

---

## Gerelateerde Documentatie

### Compliance & Legal
- [EU Privacy Analysis](../compliance/eu-privacy-analysis.md) - GDPR compliance
- [Juridisch Actieplan](../compliance/JURIDISCH-ACTIEPLAN.md) - Actiepunten
- [Verwerkersovereenkomst](../compliance/templates/VERWERKERSOVEREENKOMST.md) - DPA template
- [Algemene Voorwaarden](../compliance/templates/ALGEMENE-VOORWAARDEN.md) - ToS

### Exact Online API
- [API Overview](../exact-online-api/README.md) - API documentatie
- [Authentication](../exact-online-api/authentication.md) - OAuth flow
- [Rate Limits](../exact-online-api/rate-limits.md) - 60/min, 5000/dag

### Branding & Copy
- [Tone of Voice](../branding/tone-of-voice.md) - Schrijfstijl
- [Schrijver Prompt](../branding/schrijver-prompt.md) - AI prompt voor copy

---

## Proces Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXACT ONLINE APP STORE REVIEW                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. DATA & SECURITY REVIEW (formulier invullen)                │
│     ├─ Doel beschrijving                    ✅ Gereed           │
│     ├─ Scopes selecteren                    ✅ Gereed           │
│     ├─ Third-party connections              ✅ Gereed           │
│     └─ Privacy/security vragen              ✅ Gereed           │
│                                                                 │
│  2. MARKETING CONTENT (uploaden)                               │
│     ├─ App naam & beschrijvingen            ✅ Gereed           │
│     ├─ Logo                                 ❌ TODO             │
│     ├─ Screenshots                          ❌ TODO             │
│     └─ Pricing & contact info               ✅ Gereed           │
│                                                                 │
│  3. TOESTEMMING AANVRAGEN                                      │
│     └─ Klik "Request Permission" in App Centre                 │
│                                                                 │
│  4. DEMO & REVIEW                                              │
│     ├─ Exact neemt contact op               ⏳ Wachten          │
│     ├─ Demo geven                           ❌ TODO             │
│     └─ Feedback verwerken                   ⏳ Wachten          │
│                                                                 │
│  5. PARTNER FEE                                                │
│     ├─ Kosten bespreken                     ❌ TODO             │
│     └─ Factuurgegevens aanleveren           ❌ TODO             │
│                                                                 │
│  6. PUBLICATIE                                                 │
│     └─ App live in App Store                ⏳ Wachten          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Volgende Stappen

### Nu te doen
1. **Logo maken** - 512x512 PNG
2. **Screenshots maken** - Dashboard, chat, verbindingsflow
3. **Demo account** - Test Exact administratie klaarzetten

### Daarna
4. **Formulier invullen** - Data & Security Review in App Centre
5. **Toestemming aanvragen** - Request Permission knop
6. **Wachten op contact** - Exact partnermanager

### Links
- [Exact App Centre](https://apps.exactonline.com/) - Inloggen
- [Developer Docs](https://support.exactonline.com/community/s/article/All-All-DNO-Content-restintro) - API docs
- [Partner Support](https://www.exact.com/nl/partners) - Contact

---

## Contactgegevens

**App eigenaar:** WerkenmetAI B.V.
**Support:** support@praatmetjeboekhouding.nl
**Privacy:** privacy@praatmetjeboekhouding.nl
**Website:** https://praatmetjeboekhouding.nl

---

*Laatst bijgewerkt: Januari 2026*
