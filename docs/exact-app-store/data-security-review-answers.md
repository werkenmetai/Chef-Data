# Exact Online App Store - Data & Security Review Antwoorden

> Complete antwoorden voor het App Center formulier "Beoordeling: gegevens en beveiliging"
> **Laatst bijgewerkt:** 2026-02-01
> **Status:** ✅ Security + Toestemming GOEDGEKEURD, Marketingbeoordeling INGEDIEND
> **Ingediend door:** Matthijs Huttinga (matthijs@praatmetjeboekhouding.nl)

---

## 1. Doel (max 140 karakters)

### Nederlands
```
Stel vragen aan je Exact Online boekhouding via AI-assistenten zoals Claude en ChatGPT. Alleen-lezen. Geen data-opslag.
```
(119 karakters)

### Engels
```
Ask questions about your Exact Online accounting data using AI assistants like Claude and ChatGPT. Read-only. No data storage.
```
(125 karakters)

---

## 2. Scopes

**Alle scopes zijn "Lezen" of "Ongebruikt". Nergens "Beheren".**

### CRM
| Scope | Instelling | Toelichting |
|-------|-----------|-------------|
| accounts | **Lezen** | Klanten/leveranciers opvragen |
| marketing | Ongebruikt | |
| opportunities | **Lezen** | Pipeline/verkoopkansen voor omzetprognose |
| quotes | **Lezen** | Offertes voor conversie-analyse |

### Sales
| Scope | Instelling | Toelichting |
|-------|-----------|-------------|
| orders | **Lezen** | Verkooporders (get_sales_orders) |
| invoices | **Lezen** | Verkoopfacturen (get_sales_invoices) |
| contracts | **Lezen** | Terugkerende omzet / subscription analyse |
| prices | **Lezen** | Prijslijsten voor marge-analyse |

### Purchase
| Scope | Instelling | Toelichting |
|-------|-----------|-------------|
| orders | **Lezen** | Inkooporders (get_purchase_orders) |
| invoices | **Lezen** | Inkoopfacturen (get_purchase_invoices) |
| contracts | Ongebruikt | |
| prices | **Lezen** | Inkoopprijzen voor kostprijsanalyse |

### Logistics
| Scope | Instelling | Toelichting |
|-------|-----------|-------------|
| items | **Lezen** | Artikelen/producten (get_items) |
| inventory | **Lezen** | Voorraadposities (get_stock_positions) |
| distribution | Ongebruikt | |
| wms | Ongebruikt | |
| assembly | Ongebruikt | |

### Manufacturing
| Scope | Instelling | Toelichting |
|-------|-----------|-------------|
| products | Ongebruikt | |
| production | Ongebruikt | |
| shopfloor | Ongebruikt | |

### Projects
| Scope | Instelling | Toelichting |
|-------|-----------|-------------|
| projects | **Lezen** | Projectrendabiliteit, uurtje-factuurtje ZZP'ers |
| planning | Ongebruikt | |
| billing | **Lezen** | Projectfacturatie, onderhanden werk |

### HRM
| Scope | Instelling | Toelichting |
|-------|-----------|-------------|
| employees | Ongebruikt | Te gevoelig - ander risicoprofiel |
| payroll | Ongebruikt | Te gevoelig - ander risicoprofiel |

### Financial
| Scope | Instelling | Toelichting |
|-------|-----------|-------------|
| currencies | **Lezen** | Multi-currency, wisselkoersen |
| costcenters | **Lezen** | Kostenplaatsen, afdelingsrapportages |
| generalledgers | **Lezen** | Grootboekrekeningen (get_gl_accounts) |
| accounting | **Lezen** | Boekhouding, journaalposten, BTW (get_trial_balance, get_profit_loss, get_revenue, get_transactions, get_vat_summary, get_journal_entries) |
| cashflow | **Lezen** | Banktransacties, cashflow (get_bank_transactions, get_cashflow_forecast) |
| receivables | **Lezen** | Debiteuren (get_outstanding_invoices, get_aging_receivables) |
| payables | **Lezen** | Crediteuren (get_outstanding_invoices, get_aging_payables) |
| returns | Ongebruikt | |
| assets | **Lezen** | Vaste activa, afschrijvingen, investeringsoverzicht |
| budgets | **Lezen** | Budgetvergelijking (get_budget_comparison) |

### Organization
| Scope | Instelling | Toelichting |
|-------|-----------|-------------|
| administration | **Lezen** | Administraties/divisies (list_divisions) |
| documents | **Lezen** | Bijlagen bij facturen etc. |
| workflow | Ongebruikt | |
| search | Ongebruikt | |
| officeapp | Ongebruikt | |
| extensibility | Ongebruikt | |
| googleworkspace | Ongebruikt | |
| conversion | Ongebruikt | |

### Accountancy
| Scope | Instelling | Toelichting |
|-------|-----------|-------------|
| practicemanagement | Ongebruikt | |
| processmanagement | Ongebruikt | |

### Communication
| Scope | Instelling | Toelichting |
|-------|-----------|-------------|
| mailboxes | Ongebruikt | |

### Scope Samenvatting
- **Totaal Lezen:** 23 scopes
- **Totaal Ongebruikt:** overige
- **Totaal Beheren:** 0 (nooit)

---

## 3. Beoordeling Gegevensbescherming en Beveiliging

### Vraag 1: Privacybeleid
**Antwoord: Ja**
```
Gepubliceerd op praatmetjeboekhouding.nl/privacy. Beschrijft verzamelde gegevens, doel, bewaartermijnen, verwijderingsbeleid en hoe toestemming intrekken. AVG-compliant. Contact: privacy@praatmetjeboekhouding.nl
```

### Vraag 2: Expliciete toestemming verzamelen gegevens
**Antwoord: Ja**
```
OAuth 2.0 + PKCE consent flow via Exact Online. Daarnaast expliciete Terms of Service acceptatie. App vraagt alleen leesrechten, vooraf duidelijk gecommuniceerd.
```

### Vraag 3: Akkoord privacybeleid
**Antwoord: Ja**
```
Bij account aanmaken en Exact Online verbinden wordt verwezen naar privacybeleid (/privacy) en voorwaarden (/terms). Expliciete acceptatie vereist.
```

### Vraag 4: Encryptie / beveiliging gegevens
**Antwoord: Ja**
```
Tokens: AES-256-GCM versleuteld. API keys: SHA-256 gehasht. Transport: TLS 1.3. Cookies: httpOnly/Secure/SameSite. Geen boekhouddata opgeslagen.
```

### Vraag 5: Validatie en testen voor doorvoering
**Antwoord: Ja**
```
Git-gebaseerd CI/CD met GitHub Actions. Branch protection op main. Verplichte pull request reviews en geautomatiseerde tests voor elke deployment.
```

### Vraag 6: Wijzigingsgeschiedenis beheren
**Antwoord: Ja**
```
Git (GitHub) versiebeheer. Elke wijziging traceerbaar via commits en pull requests. Audit trail op alle codewijzigingen. Branch protection voorkomt directe changes.
```

### Vraag 7: OWASP best practices beveiligd coderen
**Antwoord: Ja**
```
CSRF-bescherming (HMAC-signed state), OAuth 2.0 + PKCE, input validatie, CSP headers, httpOnly cookies, constant-time vergelijkingen, geen secrets in logs.
```

### Vraag 8: Regelmatig kwetsbaarheden evalueren
**Antwoord: Ja**
```
npm audit voor dependencies, Sentry error monitoring (PII-geredacteerd), code reviews, TypeScript type-safety. Cloudflare WAF en DDoS-bescherming op infraniveau.
```

### Vraag 9: Data bewaren in eigen/cloud datacenter
**Antwoord: Ja**
```
Cloudflare D1 database (EU-regio). Alleen versleutelde OAuth-tokens en gebruikersaccounts opgeslagen. Geen Exact Online boekhouddata — pass-through model.
```

### Vraag 10: Logische toegang alleen bevoegden
**Antwoord: Ja**
```
OAuth 2.0 authenticatie, unieke API-keys (SHA-256 gehasht), Cloudflare dashboard met 2FA. Database alleen bereikbaar via applicatielaag, geen directe toegang.
```

### Vraag 11: Fysieke toegang alleen bevoegden
**Antwoord: Niet van toepassing**
```
Serverless architectuur op Cloudflare edge netwerk. Geen eigen servers. Cloudflare beheert fysieke beveiliging (ISO 27001, SOC 2 Type II gecertificeerd).
```

### Vraag 12: Verklaring van derden (ISO/SOC)
**Antwoord: Nee**
```
Geen eigen ISO/SOC-certificering. Infrastructuurprovider Cloudflare heeft ISO 27001, SOC 2 Type II en PCI DSS. Wij volgen deze principes in eigen processen.
```

---

## 4. Automatische Koppelingen met Derden

> Formuliervelden per derde partij: Naam, Doel (NL), Gegevens (NL), Doel (EN), Gegevens (EN)

### Derde partij 1: Cloudflare Inc.
| Veld | Tekst |
|------|-------|
| Derde partij | `Cloudflare Inc.` |
| Doel (NL) | `Hosting applicatie en database (Workers, D1, Pages)` |
| Gegevens (NL) | `Versleutelde OAuth-tokens en gebruikersaccounts. Geen boekhouddata.` |
| Doel (EN) | `Application hosting and database (Workers, D1, Pages)` |
| Gegevens (EN) | `Encrypted OAuth tokens and user accounts. No accounting data.` |

### Derde partij 2: Resend Inc.
| Veld | Tekst |
|------|-------|
| Derde partij | `Resend Inc.` |
| Doel (NL) | `Transactionele e-mails (accountbevestiging, notificaties)` |
| Gegevens (NL) | `E-mailadressen van gebruikers. Geen Exact Online data.` |
| Doel (EN) | `Transactional emails (account confirmation, notifications)` |
| Gegevens (EN) | `User email addresses. No Exact Online data.` |

### Derde partij 3: AI-providers (Anthropic / OpenAI / Microsoft)
| Veld | Tekst |
|------|-------|
| Derde partij | `AI-providers (Anthropic / OpenAI / Microsoft)` |
| Doel (NL) | `AI-verwerking op initiatief van gebruiker via MCP-protocol` |
| Gegevens (NL) | `Gebruiker stuurt zelf Exact Online data naar gekozen AI. Wij bepalen niet welke AI.` |
| Doel (EN) | `AI processing initiated by user via MCP protocol` |
| Gegevens (EN) | `User sends Exact Online data to their chosen AI. We do not control which AI.` |

---

## 5. Contactgegevens

| Veld | Waarde |
|------|--------|
| Voornaam | Matthijs |
| Achternaam | Huttinga |
| Telefoon | 0657317135 |
| E-mail | Matthijs@chefdata.nl |

---

## 6. Gebruiksvoorwaarden

**Antwoord: Ja** — Wij voldoen volledig aan de gebruiksvoorwaarden van het Exact Online App Center.

---

## Naadloze Integratie URI's

| Veld | URI |
|------|-----|
| URI voor "Probeer nu" | `https://praatmetjeboekhouding.nl/exact/probeer` |
| URI voor "Starten" | `https://praatmetjeboekhouding.nl/exact/start` |
| URI voor "Niet meer gebruiken" | `https://praatmetjeboekhouding.nl/exact/disconnect` |
| URI voor "Meer informatie" | `https://praatmetjeboekhouding.nl/exact/info` |

---

*Document aangemaakt: 2026-01-28 door Piet (CEO/Orchestrator)*
*Met input van: Bas (Security), Eva (Legal), Kees (CTO), Joost (Exact Specialist)*
