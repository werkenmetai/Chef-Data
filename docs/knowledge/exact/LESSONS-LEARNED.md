# Exact Online API Lessons Learned

**Beheerder:** Joost (Exact API Specialist)
**Laatste update:** 2026-01-30
**Bijgedragen door:** Piet (orchestrator), Joost (exact-specialist)
**Bijgewerkt door:** Piet (orchestrator)

Dit document bevat unieke lessen uit PRs, errors en oplossingen.

---

## Template voor nieuwe lessen

```markdown
## Lesson: [Korte titel]

**Datum:** YYYY-MM-DD
**PR:** #xxx
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

## Bekende Patronen

### Rate Limiting
- Exact Online heeft 60 requests/minute limit
- Gebruik exponential backoff bij 429 errors
- Batch requests waar mogelijk

### Token Refresh
- Access token verloopt na 10 minuten
- Refresh 5 minuten voor expiry
- Refresh token verloopt na 30 dagen

### Division Handling
- Altijd division in API URL opnemen
- User kan meerdere divisions hebben
- Check CurrentDivision bij login

---

## Lesson: Divisions API heeft meerdere endpoints

**Datum:** 2026-01-24
**Commit:** 2166795
**Ernst:** High

### Probleem
404 error bij ophalen van divisions na OAuth login.

### Root Cause
Exact Online heeft verschillende API endpoints voor divisions afhankelijk van de licentie:
- `/api/v1/{division}/hrm/Divisions` - HRM module
- `/api/v1/{division}/system/Divisions` - System module

Niet alle gebruikers hebben toegang tot alle endpoints.

### Oplossing
Meerdere endpoints proberen met fallback:
1. Probeer `hrm/Divisions`
2. Fallback naar `system/Divisions`
3. Laatste fallback: alleen currentDivision uit user info retourneren

### Code Voorbeeld
```typescript
// Before (fout)
const response = await fetch(`${baseUrl}/hrm/Divisions`);

// After (correct)
const endpoints = [
  `${baseUrl}/hrm/Divisions`,
  `${baseUrl}/system/Divisions`,
];
for (const endpoint of endpoints) {
  const response = await fetch(endpoint);
  if (response.ok) return await response.json();
}
// Fallback to currentDivision from user info
return [{ Code: currentDivision }];
```

### Preventie
- Altijd meerdere API endpoints ondersteunen
- Fallback strategie voor API calls
- Test met accounts met verschillende licenties

---

## Lesson: Division parameter moet optioneel zijn

**Datum:** 2026-01-26
**Commit:** 02d70d9
**Ernst:** Medium

### Probleem
Gebruikers moesten altijd een division specificeren, maar wisten niet welke ze hadden.

### Root Cause
Division was verplichte parameter in alle reporting tools.

### Oplossing
Division parameter optioneel gemaakt:
- Als niet opgegeven: query alle divisions van de user
- Resultaten combineren en groeperen per division

### Code Voorbeeld
```typescript
// Before (fout)
const DivisionSchema = z.string().describe('Division code (verplicht)');

// After (correct)
const DivisionSchema = z.string().optional().describe(
  'Division code. Indien niet opgegeven worden alle administraties bevraagd.'
);

// In tool handler:
if (!division) {
  const divisions = await getUserDivisions(user);
  const results = await Promise.all(
    divisions.map(d => fetchData(d))
  );
  return combineResults(results);
}
```

### Preventie
- Verplichte parameters kritisch evalueren
- User-friendly defaults bieden
- Multi-administratie support van begin af aan

---

## Lesson: Kostenplaatsen/dragers zitten in TransactionLines

**Datum:** 2026-01-27
**Commit:** ca1e44a
**Ernst:** Low

### Probleem
Kostenplaatsen en kostendragers werden niet meegeleverd bij transacties.

### Root Cause
De velden waren niet opgenomen in de OData $select query.

### Oplossing
Extra velden toegevoegd aan TransactionLines query:
- CostCenter, CostCenterDescription
- CostUnit, CostUnitDescription

### Code Voorbeeld
```typescript
// Before (fout)
const select = 'Date,Description,AmountDC,GLAccountCode';

// After (correct)
const select = 'Date,Description,AmountDC,GLAccountCode,' +
  'CostCenter,CostCenterDescription,CostUnit,CostUnitDescription';
```

### Preventie
- Documenteer alle beschikbare velden per endpoint
- Check Exact API docs voor nieuwe/ontbrekende velden
- Vraag gebruikers welke data ze nodig hebben

---

## Lesson: Aging analysis vereist openstaande items filter

**Datum:** 2026-01-27
**Commit:** 24d1d6a
**Ernst:** Medium

### Probleem
Ouderdomsanalyse moest handmatig berekend worden.

### Root Cause
Geen directe Exact API voor aging buckets (0-30, 31-60, 61-90, 90+ dagen).

### Oplossing
Custom aging analyse tool gebouwd:
1. Haal openstaande facturen op via Receivables/Payables endpoints
2. Bereken dagen openstaand: `today - invoiceDate`
3. Groepeer in buckets
4. Totaliseer per bucket

### Code Voorbeeld
```typescript
// Aging buckets berekening
const aging = {
  current: 0,      // 0-30 dagen
  days31to60: 0,   // 31-60 dagen
  days61to90: 0,   // 61-90 dagen
  over90: 0,       // 90+ dagen
};

for (const invoice of openInvoices) {
  const daysOpen = daysBetween(invoice.InvoiceDate, today);
  if (daysOpen <= 30) aging.current += invoice.Amount;
  else if (daysOpen <= 60) aging.days31to60 += invoice.Amount;
  else if (daysOpen <= 90) aging.days61to90 += invoice.Amount;
  else aging.over90 += invoice.Amount;
}
```

### Preventie
- Check of Exact native reports beschikbaar zijn
- Bouw herbruikbare utility functies voor berekeningen
- Cache resultaten waar mogelijk (expensive queries)

---

## Lesson: Retry-After header moet gerespecteerd worden bij 429

**Datum:** 2026-01-28
**ROADMAP:** EXACT-002
**Ernst:** High

### Probleem
Bij rate limiting (429 responses) werd niet gewacht op de door Exact aangegeven tijd.

### Root Cause
BaseTool gaf alleen een error bij 429, maar deed geen automatische retry met de Retry-After header.

### Oplossing
Retry-After header parsing en automatische retry met backoff:

### Code Voorbeeld
```typescript
// Before (fout)
if (response.status === 429) {
  throw new ExactAPIError('Rate limit exceeded', 429);
}

// After (correct)
if (response.status === 429) {
  if (rateLimitRetryCount < MAX_RATE_LIMIT_RETRIES) {
    const retryAfterHeader = response.headers.get('Retry-After');
    let waitMs = DEFAULT_RETRY_WAIT_MS; // 60 seconds fallback

    if (retryAfterHeader) {
      const retryAfterSeconds = parseInt(retryAfterHeader, 10);
      if (!isNaN(retryAfterSeconds)) {
        waitMs = retryAfterSeconds * 1000;
      }
    }

    await sleep(waitMs);
    return this.exactRequest<T>(connection, endpoint, options, rateLimitRetryCount + 1);
  }
  throw new RateLimitExceededError();
}
```

### Preventie
- Respecteer altijd rate limit headers van APIs
- Implementeer automatische retry met backoff
- Log rate limit events voor monitoring

---

## Lesson: Refresh token expiry moet apart getrackt worden

**Datum:** 2026-01-28
**ROADMAP:** EXACT-003
**Ernst:** High

### Probleem
Gebruikers werden niet gewaarschuwd voordat hun refresh token (30 dagen geldig) verliep.

### Root Cause
Alleen `token_expires_at` (access token, 10 min) werd getrackt, niet de refresh token expiry.

### Oplossing
Nieuwe kolom `refresh_token_expires_at` toegevoegd:
1. Database migration voor nieuwe kolom
2. Bij elke token refresh: update refresh_token_expires_at naar now + 30 dagen
3. Proactive check: waarschuw gebruiker 7 dagen voor expiry

### Code Voorbeeld
```typescript
// Calculate refresh token expiry (30 days from now)
const REFRESH_TOKEN_VALIDITY_DAYS = 30;
const refreshTokenExpiresAt = new Date(
  Date.now() + REFRESH_TOKEN_VALIDITY_DAYS * 24 * 60 * 60 * 1000
);

// Update in database
await db.prepare(`
  UPDATE connections
  SET refresh_token = ?,
      refresh_token_expires_at = ?,
      expiry_alert_sent = 0
  WHERE id = ?
`).bind(newRefreshToken, refreshTokenExpiresAt.toISOString(), connId).run();

// Proactive warning query (7 days before expiry)
SELECT * FROM connections
WHERE refresh_token_expires_at < datetime('now', '+7 days')
  AND refresh_token_expires_at > datetime('now')
  AND expiry_alert_sent = 0
```

### Preventie
- Track expiry dates voor ALLE tokens, niet alleen access tokens
- Bouw proactieve waarschuwingen in
- Test edge cases: wat als refresh net verloopt tijdens API call?

---

## Lesson: Actieve accounts filteren met Blocked veld, NIET Status veld

**Datum:** 2026-01-29
**Commit:** (updated after API docs research)
**Ernst:** CRITICAL

### Probleem
`get_relations` tool gaf "Invalid request" error bij Beurs van Berlage test.

### Root Cause - DUBBELE VERWARRING!
1. **Eerste fout:** Code gebruikte `Status eq 'C'` (dachten Customer = actief)
2. **Tweede fout:** Gecorrigeerd naar `Status eq 'A'` maar 'A' bestaat niet!

**De waarheid (na API documentatie onderzoek):**

| Veld | Betekenis | Mogelijke waarden |
|------|-----------|-------------------|
| **Status** | Relatie TYPE | `C` = Customer, `P` = Prospect, `S` = Suspect |
| **Blocked** | Actief/geblokkeerd | `false` = actief, `true` = geblokkeerd |

Het **Status** veld is voor classificatie van de klantrelatie, NIET voor actief/inactief!

### Oplossing
Gebruik `Blocked eq false` ipv `Status eq 'A'`:

### Code Voorbeeld
```typescript
// FOUT 1 - 'C' is Customer TYPE, niet status
if (activeOnly) {
  filters.push("Status eq 'C'");
}

// FOUT 2 - 'A' bestaat niet als Status waarde!
if (activeOnly) {
  filters.push("Status eq 'A'");
}

// CORRECT - Blocked veld bepaalt actief/inactief
if (activeOnly) {
  filters.push("Blocked eq false");
}
```

### API Bronnen
- [Invantive Exact Online Data Model](https://documentation.invantive.com/2017R2/exact-online-data-model/)
- [python-exact-online PyPI](https://pypi.org/project/python-exact-online/)
- Exact Online REST API Reference (support.exactonline.com)

### Preventie
- **ALTIJD** API documentatie checken voor veldnamen en waarden
- Vertrouw niet op aannames over veldnamen (Status ≠ active/inactive!)
- Test endpoints zonder filters eerst om structuur te zien
- Bekijk `AccountCustomerStatuses` tabel voor volledige Status waarden

---

## Lesson: Bulk-read endpoints vereisen /read/ prefix

**Datum:** 2026-01-29
**Commit:** 684513e
**Ernst:** High

### Probleem
`get_outstanding_invoices` gaf "Invalid request" voor ReceivablesList en PayablesList.

### Root Cause
Exact Online heeft twee soorten API endpoints:

1. **Standard OData endpoints**: `/financial/GLAccounts`
2. **Bulk-read endpoints**: `/read/financial/ReceivablesList`

De "List" suffix endpoints (ReceivablesList, PayablesList, AgingReceivablesList, etc.) zijn **bulk-read** APIs die de `/read/` prefix vereisen.

### Oplossing
`/read/` prefix toegevoegd aan alle List-type endpoints.

### Code Voorbeeld
```typescript
// Before (FOUT - List endpoints zijn bulk-read!)
const endpoint = `/${division}/financial/ReceivablesList`;
const endpoint = `/${division}/financial/PayablesList`;

// After (CORRECT - /read/ prefix voor bulk endpoints)
const endpoint = `/${division}/read/financial/ReceivablesList`;
const endpoint = `/${division}/read/financial/PayablesList`;
```

### Endpoint Mapping
| Endpoint | Type | Prefix |
|----------|------|--------|
| GLAccounts | Standard | `/financial/` |
| Journals | Standard | `/financial/` |
| **ReceivablesList** | Bulk-read | `/read/financial/` |
| **PayablesList** | Bulk-read | `/read/financial/` |
| **AgingReceivablesListByAgeGroup** | Bulk-read | `/read/financial/` |
| **AgingPayablesListByAgeGroup** | Bulk-read | `/read/financial/` |
| **ReportingBalance** | Varies | Test both! |

### Preventie
- Endpoints met "List" suffix zijn vaak bulk-read
- Check Exact Online API docs voor correcte prefix
- Test elke endpoint afzonderlijk bij implementatie

---

## Lesson: OData datetime vereist tijdcomponent

**Datum:** 2026-01-29
**Commit:** 684513e (voorbereid in 49d12fa)
**Ernst:** Medium

### Probleem
Date filters in OData gaven inconsistente resultaten of "Invalid request".

### Root Cause
OData datetime literals vereisen het volledige ISO 8601 formaat inclusief tijdcomponent.

De Exact Online API accepteert:
- ✅ `datetime'2026-01-29T00:00:00'` (correct)
- ❌ `datetime'2026-01-29'` (kan falen of onvoorspelbaar gedrag)

### Oplossing
Altijd tijdcomponent toevoegen:
- Begin van dag: `T00:00:00`
- Eind van dag: `T23:59:59`

### Code Voorbeeld
```typescript
// Before (ONBETROUWBAAR)
filters.push(`Date ge datetime'${fromDate}'`);
filters.push(`Date le datetime'${toDate}'`);

// After (CORRECT - expliciete tijdcomponent)
filters.push(`Date ge datetime'${fromDate}T00:00:00'`);
filters.push(`Date le datetime'${toDate}T23:59:59'`);
```

### Preventie
- Maak helper functie `toODataDateTime(date, 'start' | 'end')`
- Documenteer dit in coding guidelines
- Gebruik consistent formaat in alle tools

---

## Bekende Exact Online Status/Type Codes

### Account Velden (crm/Accounts)

**Status veld** = Relatie TYPE (niet actief/inactief!):
| Code | Betekenis |
|------|-----------|
| `C` | Customer (klant) |
| `P` | Prospect |
| `S` | Suspect |

**Blocked veld** = Actief/Geblokkeerd:
| Waarde | Betekenis |
|--------|-----------|
| `false` | Actief (niet geblokkeerd) |
| `true` | Geblokkeerd/Inactief |

**Andere boolean velden:**
- `IsCustomer` = Is dit een klant?
- `IsSupplier` = Is dit een leverancier?
- `IsReseller` = Is dit een reseller?
- `IsAccountant` = Is dit een accountant?

⚠️ **KRITIEK:** Gebruik `Blocked eq false` voor actieve accounts, NIET `Status`!

### Item Types (logistics/Items)
| Code | Betekenis |
|------|-----------|
| `1` | Stock (voorraad) |
| `2` | Service (dienst) |
| `3` | Non-stock (niet op voorraad) |
| `4` | Serial (serienummer) |
| `5` | Batch |

### Asset Status (assets/Assets)
| Code | Betekenis |
|------|-----------|
| `1` | Active (actief) |
| `2` | Not validated |
| `3` | Inactive |
| `4` | Depreciated (afgeschreven) |
| `5` | Blocked |
| `6` | Sold (verkocht) |

⚠️ **Let op:** Eerdere code gebruikte 10/20/30 maar de correcte waarden zijn 1-6!

---

## Lesson: TypeScript types moeten matchen met ECHTE API velden

**Datum:** 2026-01-29
**Ernst:** High (build breaker + runtime errors)

### Probleem Serie
1. TypeScript build faalde op `Status eq 'A'` vergelijking
2. We "fixten" de types door 'A' toe te voegen
3. Maar 'A' bestaat NIET in de echte API!

### De Echte Oplossing
Na onderzoek van de Exact Online API docs:
- **Status** veld bevat alleen `C`, `P`, `S` (relatie types)
- **Blocked** veld bepaalt actief/inactief (boolean)

```typescript
// FOUT - Types aanpassen aan verkeerde code
Status: 'A' | 'B' | 'C' | 'I' | 'O' | 'P' | 'S';
r.Status === 'A' ? 'active' : 'inactive'

// CORRECT - Code én types matchen met API
Status: 'C' | 'P' | 'S'; // Relatie type
Blocked: boolean;        // Actief/geblokkeerd
r.Blocked ? 'blocked' : 'active'
```

### Moraal
- TypeScript errors kunnen wijzen op diepere problemen
- "Fix de types om de build te laten slagen" is vaak verkeerd
- **Onderzoek eerst de echte API structuur**

### Preventie
- **Check API docs EERST** voordat je types definieert
- Types moeten API reflecteren, niet andersom
- Test met echte API responses, niet aannames

---

## Lesson: Bulk-read endpoints zijn betrouwbaarder dan standaard OData

**Datum:** 2026-01-29
**Ernst:** High (productie impact)

### Probleem
Standaard OData endpoints geven vaak "Invalid request" terwijl `/read/` bulk endpoints wel werken.

### Observatie tijdens live testing

| Endpoint Type | Voorbeeld | Resultaat |
|---------------|-----------|-----------|
| `/read/financial/ReceivablesList` | Bulk-read | ✅ Werkt |
| `/crm/Accounts` | Standaard OData | ❌ Invalid request |
| `/salesinvoice/SalesInvoices` | Standaard OData | ❌ Invalid request |
| `/logistics/Items` | Standaard OData | ❌ Invalid request |

### Mogelijke oorzaken
1. **Inconsistente filter encoding**: Sommige tools encoden filters, anderen niet
2. **Veldnamen verschillen**: API versies kunnen andere veldnamen hebben
3. **Exact Online editie**: Sommige endpoints bestaan niet in alle edities
4. **API scope vs. endpoint**: Bepaalde endpoints vereisen specifieke scopes

### Aanbeveling
1. **Gebruik `/read/` endpoints waar mogelijk** - betrouwbaarder
2. **Test endpoints zonder filters eerst** - isoleer het probleem
3. **URL-encode ALLE filter strings** - voorkom syntax errors
4. **Check Exact API docs per endpoint** - veldnamen kunnen verschillen

### Te onderzoeken
- [ ] Waarom werken `/read/` endpoints wel en standaard OData niet?
- [ ] Welke veldnamen zijn correct per endpoint?
- [ ] Is er een verschil tussen Exact Online edities?

---

## Lesson: Cloudflare Worker CPU limieten

**Datum:** 2026-01-29
**Ernst:** HIGH (productie impact)

### Probleem
```
Cloudflare Error 1102 - Worker exceeded resource limits
```

### Root Cause
Cloudflare Workers hebben CPU-limieten afhankelijk van het plan:
- **Bundled (Free/Paid)**: 10ms (free) / 50ms (paid) CPU time
- **Unbound**: Geen vast limiet, betaling per gebruik

De MCP server overschrijdt soms de CPU limiet bij complexe queries.

### Oplossing
Toegevoegd aan `wrangler.toml`:
```toml
usage_model = "unbound"
```

Dit schakelt over naar Workers Unbound met usage-based billing.

### Kosten Workers Unbound
- Eerste 1M requests/maand: $0.15 per miljoen
- CPU time: $12.50 per miljoen GB-s
- Voor typisch MKB gebruik: ~$5-20/maand

### Preventie
- Monitor CPU usage in Cloudflare Dashboard
- Optimaliseer hot paths in worker code
- Overweeg caching voor veelgebruikte queries

---

## Lesson: API endpoint paden zijn case-sensitive

**Datum:** 2026-01-29
**Commit:** 9c66fe0
**Ernst:** High (404 errors)

### Probleem
`get_cost_centers` gaf 404 Not Found error.

### Root Cause
Exact Online API paden zijn **case-sensitive**. Wij gebruikten `/hrm/CostCenters` maar de API verwacht `/hrm/Costcenters` (kleine 'c').

### Oplossing
```typescript
// FOUT - CamelCase
const endpoint = `/${division}/hrm/CostCenters`;

// CORRECT - API verwacht lowercase 'c' in centers
const endpoint = `/${division}/hrm/Costcenters`;
```

### Preventie
- **Check exact pad in API docs** - copy-paste bij voorkeur
- Gebruik IDE autocomplete waar mogelijk
- Test nieuwe endpoints individueel

---

## Lesson: Veldnamen bestaan niet altijd zoals verwacht

**Datum:** 2026-01-29
**Commit:** 9c66fe0
**Ernst:** High (Invalid request)

### Probleem
`get_items` filter op `IsOnline eq true` gaf Invalid request.

### Root Cause
Het veld `IsOnline` bestaat NIET in de Exact Online Items API. We hadden dit veld verondersteld zonder te verifiëren.

Het juiste veld is `IsSalesItem` (boolean) dat aangeeft of een item verkocht kan worden.

### Oplossing
```typescript
// FOUT - Veld bestaat niet!
if (activeOnly) {
  filters.push('IsOnline eq true');
}

// CORRECT - Gebruik bestaand veld
if (activeOnly) {
  filters.push('IsSalesItem eq true');
}
```

### Exacte Items velden (boolean)
| Veld | Betekenis |
|------|-----------|
| `IsSalesItem` | Kan verkocht worden |
| `IsPurchaseItem` | Kan ingekocht worden |
| `IsStockItem` | Is voorraadproduct |
| `IsSerialItem` | Heeft serienummers |
| `IsBatchItem` | Gebruikt batchnummers |

### Preventie
- **Verifieer veldnamen tegen API documentatie**
- Gebruik geen veronderstelde veldnamen
- Test filters eerst met echte data

---

## Lesson: API prefix verschilt per endpoint categorie

**Datum:** 2026-01-29
**Commit:** 9c66fe0
**Ernst:** High (404 errors)

### Probleem
`get_currencies` gaf 404 Not Found.

### Root Cause
Currencies endpoint zit onder `/general/` niet `/financial/`:

| Gedacht | Werkelijk |
|---------|-----------|
| `/financial/Currencies` | `/general/Currencies` ❌ |
| N/A | `/general/Currencies` ✅ |

### Oplossing
```typescript
// FOUT - Verkeerde prefix
const endpoint = `/${division}/financial/Currencies`;

// CORRECT - Currencies is algemeen, niet financial
const endpoint = `/${division}/general/Currencies`;
```

### API Prefix Mapping
| Prefix | Endpoints |
|--------|-----------|
| `/general/` | Currencies, Countries, Languages |
| `/financial/` | GLAccounts, Journals, ReportingBalance |
| `/crm/` | Accounts, Contacts, Quotations |
| `/salesinvoice/` | SalesInvoices, SalesInvoiceLines |
| `/purchaseinvoice/` | PurchaseInvoices |
| `/project/` | Projects, TimeTransactions |
| `/hrm/` | Employees, Costcenters |
| `/logistics/` | Items, ItemWarehouses |
| `/assets/` | Assets, DepreciationMethods |

### Preventie
- **Controleer API prefix** in officiële docs
- Maak een mapping tabel voor het team
- Test endpoints individueel na implementatie

---

## Lesson: Status codes variëren per entity type

**Datum:** 2026-01-29
**Commit:** 9c66fe0
**Ernst:** High (incorrect filtering)

### Probleem
`get_fixed_assets` filter op status gaf geen of verkeerde resultaten.

### Root Cause
We gebruikten status codes 10/20/30 terwijl de echte codes 1-6 zijn.

**Verkeerde aannames:**
| Code | Gedacht |
|------|---------|
| 10 | Active |
| 20 | Sold |
| 30 | Scrapped |

**Werkelijke waarden:**
| Code | Betekenis |
|------|-----------|
| 1 | Active |
| 2 | Not validated |
| 3 | Inactive |
| 4 | Depreciated |
| 5 | Blocked |
| 6 | Sold |

### Oplossing
```typescript
// FOUT - Verkeerde codes
if (status === 'active') filters.push('Status eq 10');
if (status === 'sold') filters.push('Status eq 20');

// CORRECT - Juiste codes uit API docs
if (status === 'active') filters.push('Status eq 1');
if (status === 'sold') filters.push('Status eq 6');
```

### Preventie
- **Documenteer status codes per entity**
- Check API docs voor enum waarden
- Test filters met verwachte resultaten

---

## Lesson: OData kan NIET twee velden vergelijken in filters

**Datum:** 2026-01-29
**Gevonden door:** Piet (orchestrator)
**Ernst:** HIGH (400 Bad Request)

### Probleem
`get_sales_invoices` met `status=open` gaf "Ongeldige request naar Exact Online API".

### Root Cause
De OData filter probeerde twee velden te vergelijken:
```
AmountDC ne OutstandingAmountDC
```

Dit is **niet geldig** in OData! Je kunt alleen velden vergelijken met constante waarden.

### Oplossing
Gebruik directe vergelijking met constante waarde:

```typescript
// FOUT - Twee velden vergelijken is niet geldig in OData
if (status === 'open') {
  filters.push('AmountDC ne OutstandingAmountDC');
}

// CORRECT - Vergelijk één veld met constante
if (status === 'open') {
  filters.push('OutstandingAmountDC gt 0');
}
```

### OData Filter Regels
| Geldig | Voorbeeld |
|--------|-----------|
| ✅ Veld vs constante | `Amount gt 100` |
| ✅ Veld vs string | `Status eq 'C'` |
| ✅ Veld vs boolean | `Blocked eq false` |
| ❌ Veld vs veld | `Amount ne Outstanding` |

### Preventie
- OData filters kunnen alleen veld vs. constante vergelijkingen
- Test filters met exact de waarden die je verwacht
- Bij complexe filtering: haal data op en filter client-side

---

## Lesson: ReportingBalance vereist /read/ prefix

**Datum:** 2026-01-29
**Gevonden door:** Piet (orchestrator)
**Ernst:** HIGH (400 Bad Request)

### Probleem
`get_trial_balance` gaf "Ongeldige request naar Exact Online API".

### Root Cause
Het endpoint `/financial/ReportingBalance` bestaat, maar vereist de `/read/` prefix voor bulk queries, vergelijkbaar met ReceivablesList en PayablesList.

### Oplossing
```typescript
// FOUT - Mist /read/ prefix
const endpoint = `/${division}/financial/ReportingBalance?$filter=...`;

// CORRECT - Met /read/ prefix voor bulk-read endpoint
const endpoint = `/${division}/read/financial/ReportingBalance?$filter=...`;
```

### Complete lijst /read/ endpoints
| Endpoint | Prefix |
|----------|--------|
| ReceivablesList | `/read/financial/` |
| PayablesList | `/read/financial/` |
| AgingReceivablesListByAgeGroup | `/read/financial/` |
| AgingPayablesListByAgeGroup | `/read/financial/` |
| **ReportingBalance** | `/read/financial/` |

### Preventie
- Alle "List" en "Reporting" endpoints vereisen waarschijnlijk `/read/`
- Consistentie in codebase: gebruik dezelfde prefixes als bestaande werkende endpoints

---

## Lesson: SupplierItem endpoint vereist speciale scopes/edities

**Datum:** 2026-01-29
**TASK:** TASK-005 (P9-019)
**Ernst:** High (403 Forbidden)

### Probleem
`get_purchase_prices` tool gaf "Toegang geweigerd" (403 Forbidden) bij aanroep van `/logistics/SupplierItem`.

### Root Cause
Het endpoint `/logistics/SupplierItem` vereist ofwel:
1. **Speciale OAuth scopes** die niet gedocumenteerd zijn in standaard scope lijsten
2. **Edition-specifieke toegang** (Manufacturing, Wholesale Distribution)
3. **Module-activatie** in het Exact Online account

Opmerkelijk: het endpoint staat NIET in onze `docs/exact-online-api/endpoints.md` documentatie!

### Vergelijking
| Tool | Endpoint | Status |
|------|----------|--------|
| `get_sales_prices` | `/logistics/SalesItemPrices` | Werkt |
| `get_purchase_prices` (oud) | `/logistics/SupplierItem` | 403 Forbidden |
| `get_items` | `/logistics/Items` | Werkt |

### Oplossing
Vervang `/logistics/SupplierItem` door `/logistics/Items` met `IsPurchaseItem eq true` filter:

```typescript
// FOUT - SupplierItem vereist speciale scopes
const endpoint = `/${division}/logistics/SupplierItem?...`;

// CORRECT - Items endpoint werkt met standaard logistics/items scope
const endpoint = `/${division}/logistics/Items?$select=ID,Code,Description,PurchasePrice,CostPriceStandard,...&$filter=IsPurchaseItem eq true`;
```

### Trade-offs
De `Items` endpoint biedt MINDER informatie dan `SupplierItem`:

| Veld | Items | SupplierItem |
|------|-------|--------------|
| PurchasePrice | Ja | Ja |
| CostPriceStandard | Ja | Nee |
| Supplier/SupplierName | Nee | Ja |
| MainSupplier | Nee | Ja |
| PurchaseLeadTime | Nee | Ja |
| MinimumQuantity | Nee | Ja |

Voor leveranciersspecifieke prijzen is een uitgebreidere Exact Online editie vereist.

### Preventie
1. **Check of endpoints in documentatie staan** voordat je ze implementeert
2. **Test endpoints met productie-achtige accounts** (niet alleen test accounts)
3. **Documenteer edition/scope vereisten** per endpoint
4. **Bied fallback opties** voor endpoints die mogelijk niet beschikbaar zijn

### Bronnen
- [Invantive SupplierItems docs](https://documentation.invantive.com/2017R2/exact-online-data-model/webhelp/exact-online-connector-exactonlinerest-logistics-supplieritems.html)
- [Exact API Edition restrictions](https://www.maesn.com/blogs/exact-online-api-explained)

---

## Geconsolideerde API Verificatie Checklist

Na de API bugs van 2026-01-29, gebruik deze checklist bij nieuwe tools:

### Voor implementatie

- [ ] API documentatie gelezen voor endpoint
- [ ] Exact endpoint pad geverifieerd (case-sensitive!)
- [ ] Correcte prefix bevestigd (/general/, /financial/, /crm/, etc.)
- [ ] Alle veldnamen geverifieerd tegen API docs
- [ ] Status/type codes geverifieerd (niet aannemen!)
- [ ] Boolean velden geverifieerd (niet elke "active" filter bestaat)

### Na implementatie

- [ ] Test zonder filters (krijg je data?)
- [ ] Test met filters individueel
- [ ] Vergelijk output met Exact Online UI
- [ ] Documenteer afwijkingen in LESSONS-LEARNED.md

### Bronnen
- Exact Online API Reference: https://start.exactonline.nl/docs/HlpRestAPIResources.aspx
- Invantive Data Model: https://documentation.invantive.com/2017R2/exact-online-data-model/
- Python Exact Online: https://pypi.org/project/python-exact-online/

---

## Lesson: RevenueListByYear vereist 'year' als URL parameter, NIET $filter

**Datum:** 2026-01-30
**ROADMAP:** P18
**Ernst:** CRITICAL (400 Bad Request)

### Probleem
`get_revenue` gaf "Ongeldige request naar Exact Online API".

### Root Cause
De `RevenueListByYear` endpoint verwacht `year` als **URL query parameter**, niet als OData `$filter`.

### Oplossing
```typescript
// FOUT - $filter werkt niet voor deze endpoint!
const endpoint = `/${division}/read/financial/RevenueListByYear?$filter=${encodeURIComponent(`Year eq ${year}`)}`;

// CORRECT - year is een URL parameter
const endpoint = `/${division}/read/financial/RevenueListByYear?year=${year}`;
```

### API Documentatie
- Invantive: https://documentation.invantive.com/2017R2/exact-online-data-model/webhelp/exact-online-connector-exactonlinerest-financial-revenuelistbyyear.html
- Required parameter: `year` (int32)
- Optional parameter: `division` (int32)

### Preventie
- Check of parameters URL-based of filter-based zijn
- Sommige `/read/` endpoints gebruiken parameters ipv filters
- Verifieer tegen Invantive documentatie

---

## Lesson: ProfitLossOverview is een summary endpoint ZONDER filter support

**Datum:** 2026-01-30
**ROADMAP:** P18
**Ernst:** CRITICAL (400 Bad Request)

### Probleem
`get_profit_loss` gaf "Ongeldige request naar Exact Online API".

### Root Cause
`ProfitLossOverview` is een **summary endpoint** dat automatisch current/previous year/period data teruggeeft.
Het ondersteunt **GEEN** filters op `ReportingYear` of `ReportingPeriod` - deze velden bestaan niet!

### Werkelijke API Response Velden
| Veld | Beschrijving |
|------|--------------|
| `CostsCurrentPeriod` | Kosten huidige periode |
| `CostsCurrentYear` | Kosten huidig jaar |
| `RevenueCurrentPeriod` | Omzet huidige periode |
| `RevenueCurrentYear` | Omzet huidig jaar |
| `ResultCurrentPeriod` | Resultaat huidige periode |
| `ResultCurrentYear` | Resultaat huidig jaar |
| `CurrentYear` | Huidig boekjaar |
| `CurrentPeriod` | Huidige periode |

### Oplossing
Gebruik `ReportingBalance` met filter `BalanceSide eq 'W'` (W = P&L accounts):

```typescript
// FOUT - ProfitLossOverview ondersteunt geen filters!
const endpoint = `/${division}/read/financial/ProfitLossOverview?$filter=ReportingYear eq ${year}`;

// CORRECT - Gebruik ReportingBalance met P&L filter
const filters = [
  `ReportingYear eq ${year}`,
  `ReportingPeriod ge ${periodFrom}`,
  `ReportingPeriod le ${periodTo}`,
  `BalanceSide eq 'W'`, // Alleen W&V rekeningen
];
const endpoint = `/${division}/read/financial/ReportingBalance?$filter=${encodeURIComponent(filters.join(' and '))}`;
```

### Preventie
- Check of endpoints filter support hebben
- Sommige endpoints zijn "overview/summary" endpoints
- Gebruik Invantive docs om beschikbare velden te verifiëren

---

## Endpoint Parameter vs Filter Referentie

| Endpoint | Parameter Type | Voorbeeld |
|----------|----------------|-----------|
| `RevenueListByYear` | URL param | `?year=2026` |
| `ReportingBalance` | OData filter | `?$filter=ReportingYear eq 2026` |
| `ReceivablesList` | OData filter | `?$filter=DueDate lt datetime'...'` |
| `ProfitLossOverview` | **GEEN** | Geen parameters, retourneert current data |
| `AgingReceivablesListByAgeGroup` | **GEEN** | Geen parameters |

---

## Lesson: Exact Online retourneert GEEN standaard OData response formaat

**Datum:** 2026-01-30
**Commits:** `6549af7` (ontdekking), `7a8dc28` (centrale fix)
**Ernst:** CRITICAL (alle tools kunnen hierdoor falen)
**Status:** ✅ OPGELOST - Centrale helper geïmplementeerd

### Probleem
`get_relations` tool retourneerde altijd 0 resultaten ondanks dat:
- De API call succesvol was (HTTP 200)
- De app correcte permissies had
- Data WEL zichtbaar was in de Exact Online UI

### Root Cause
Exact Online retourneert een **niet-standaard OData response formaat**:

| Verwacht (standaard OData) | Werkelijk (Exact Online) |
|---------------------------|--------------------------|
| `{d: {results: [item1, item2, ...]}}` | `{d: {0: item1, 1: item2, ...}}` |

De response bevat een **object met numerieke keys** in plaats van een `results` array!

### Debug Proces
1. Eerst dachten we: CRM module niet actief → **Fout** (UI toonde data)
2. Toen dachten we: API permissies missen → **Fout** (permissies waren correct)
3. Toen dachten we: OAuth token mist scope → **Fout** (401 was door andere bug)
4. Uiteindelijk: debug logging toegevoegd die `d_keys: ["0", "1", "2", "3", "4"]` toonde

### Oplossing: Centrale Helper Functie

**Locatie:** `apps/mcp-server/src/tools/_base.ts`

```typescript
/**
 * Extract results from OData response, handling both formats:
 * - Standard OData: {d: {results: [...]}}
 * - Exact Online variant: {d: {0: item1, 1: item2, ...}}
 */
export function extractODataResults<T>(responseD: Record<string, unknown> | undefined): T[] {
  if (!responseD) return [];
  // Standard OData format
  if (Array.isArray(responseD.results)) return responseD.results as T[];
  // Exact Online variant: object with numeric keys
  const numericKeys = Object.keys(responseD)
    .filter(key => !isNaN(Number(key)) && key !== '__next' && key !== '__count');
  if (numericKeys.length > 0) {
    return numericKeys
      .sort((a, b) => Number(a) - Number(b))
      .map(key => responseD[key] as T);
  }
  return [];
}
```

### Gebruik in Tools

```typescript
// Import de helper
import { BaseTool, extractODataResults } from './_base';

// Gebruik in tool
const response = await this.exactRequest<{ d: Record<string, unknown> }>(connection, endpoint);
const items = extractODataResults<TypeName>(response.d);
```

### Alle Getroffen Bestanden (17 totaal, 60+ patterns)

| Bestand | Patterns | Status |
|---------|----------|--------|
| `reporting.ts` | 11 | ✅ Fixed |
| `combo.ts` | 8 | ✅ Fixed |
| `invoices.ts` | 6 | ✅ Fixed |
| `financial.ts` | 6 | ✅ Fixed |
| `contracts.ts` | 4 | ✅ Fixed |
| `orders.ts` | 3 | ✅ Fixed |
| `prices.ts` | 3 | ✅ Fixed |
| `relations.ts` | 2 | ✅ Fixed |
| `items.ts` | 2 | ✅ Fixed |
| `projects.ts` | 2 | ✅ Fixed |
| `journals.ts` | 2 | ✅ Fixed |
| `assets.ts` | 2 | ✅ Fixed |
| `currencies.ts` | 2 | ✅ Fixed |
| `costcenters.ts` | 2 | ✅ Fixed |
| `billing.ts` | 2 | ✅ Fixed |
| `opportunities.ts` | 2 | ✅ Fixed |
| `documents.ts` | 1 | ✅ Fixed |

### Preventie voor Nieuwe Tools

1. **ALTIJD** `extractODataResults<T>()` helper gebruiken
2. **NOOIT** direct `response.d?.results` gebruiken
3. Response type moet `{ d: Record<string, unknown> }` zijn
4. Test met echte API - niet alleen aannemen dat OData standaard is

### Gerelateerde Documentatie
- Invantive docs vermelden dit niet expliciet
- Exact Online officiële docs ook niet
- Dit is kennelijk een ongedocumenteerde eigenaardigheid van de API
- ROADMAP.md P20 bevat volledige fix details

---

## Lesson: Accept header moet exact correct zijn

**Datum:** 2026-01-31
**Bron:** Exact Online OData documentatie
**Ernst:** Medium

### Probleem
Sommige API calls kunnen falen met onduidelijke errors.

### Root Cause
Exact Online accepteert NIET alle standaard Accept headers:

| Header | Status |
|--------|--------|
| `application/json` | ✅ Werkt |
| `application/atom+xml` | ✅ Werkt (default) |
| `application/xml` | ❌ NIET GEACCEPTEERD |

### Oplossing
Altijd `application/json` gebruiken voor JSON responses.

### Preventie
- Gebruik expliciete `Accept: application/json` header
- Nooit `application/xml` gebruiken

---

## Lesson: Prefer header voor volledige POST response

**Datum:** 2026-01-31
**Bron:** Exact Online OData documentatie
**Ernst:** Low (convenience)

### Probleem
Na POST krijg je soms alleen de GUID terug, niet alle velden.

### Oplossing
Gebruik de custom Exact Online header:
```
Prefer: return=representation
```

Dit zorgt dat alle property data wordt geretourneerd na een POST.

### Preventie
- Voeg `Prefer: return=representation` toe bij POST requests
- Dit is een custom Exact Online header, niet standaard OData

---

## Lesson: Synchrone requests verplicht voor data integriteit

**Datum:** 2026-01-31
**Bron:** Exact Online OData documentatie
**Ernst:** HIGH (data integriteit)

### Probleem
Bij parallelle API requests kunnen duplicaten of missende records ontstaan.

### Root Cause
Exact Online documentatie waarschuwt:
> "Parallel requests will be queued in an undetermined sequence order."
> "Duplicate data records or even missing data records might be returned."

### Oplossing
Altijd synchrone requests gebruiken - wacht op `__next` property:

```typescript
// FOUT - Parallelle requests voor paginering
const promises = [
  fetch('...?$skip=0'),
  fetch('...?$skip=60'),
  fetch('...?$skip=120'),
];

// CORRECT - Synchrone requests met __next
let allResults = [];
let endpoint = initialEndpoint;
while (endpoint) {
  const response = await fetch(endpoint);
  const data = await response.json();
  allResults.push(...extractResults(data));
  endpoint = data.d?.__next;
}
```

### Preventie
- Nooit parallelle requests voor dezelfde dataset
- Altijd `__next` property volgen
- Valideer record counts met `$count` vooraf indien nodig

---

## Lesson: Bulk en Sync API voor grote datasets

**Datum:** 2026-01-31
**Bron:** Exact Online OData documentatie
**Ernst:** Medium (performance optimalisatie)

### Probleem
Standaard API geeft 60 records per call - inefficiënt voor grote datasets.

### Oplossing
Exact Online biedt speciale API types:

| Type | Records | Use Case | Requirement |
|------|---------|----------|-------------|
| Regular | 60 | Normale CRUD | - |
| **Bulk** | 1000 | Initiële sync | `$select` verplicht |
| **Sync** | 1000 | Delta updates | Timestamp parameter |
| **Deleted** | - | Verwijderde records | - |

### Bulk API Gebruik
```typescript
// Bulk endpoint - let op: /bulk/ prefix
// En $select is VERPLICHT
const endpoint = `/${division}/bulk/crm/Accounts?$select=ID,Name,Code`;
```

### Sync API Gebruik
```typescript
// Sync endpoint met timestamp
// Retourneert alleen gewijzigde records sinds timestamp
const endpoint = `/${division}/sync/crm/Accounts?timestamp=${lastSyncTimestamp}`;
```

### Preventie
- Gebruik Bulk API voor initiële data sync
- Gebruik Sync API voor delta synchronisatie
- Combineer met Deleted API om verwijderingen te detecteren
- Check of endpoints beschikbaar zijn in Reference docs

---

## Lesson: Binary data via Base64 en attachments via link

**Datum:** 2026-01-31
**Bron:** Exact Online OData documentatie
**Ernst:** Low (specifiek use case)

### Probleem
Hoe stuur je binary data (PDF, afbeeldingen) naar Exact?

### Oplossing
**Uploaden:** Convert naar Base64 string:
```typescript
const base64Content = Buffer.from(fileContent).toString('base64');
```

**Downloaden:** Ophalen via speciale link:
```
GET: .../docs/SysAttachment.aspx?ID=guid
```

De link moet opgevraagd worden MET access token.

### Preventie
- Binary velden bevatten vaak een LINK, niet de data zelf
- Valideer Base64 met online tools tijdens development
- Check bestandsgrootte limieten in API docs

---

## Lesson: Exact Online retourneert dates in Microsoft JSON format

**Datum:** 2026-01-31
**Gevonden door:** QA Finance Agent
**Ernst:** HIGH (days_overdue altijd 0)
**Status:** ✅ OPGELOST - Centrale helpers geïmplementeerd

### Probleem
`get_outstanding_invoices` tool gaf `days_overdue: 0` voor ALLE facturen, ook als ze maanden over de vervaldatum waren.

### Root Cause
Exact Online retourneert datum velden in **Microsoft JSON Date format**:
- Formaat: `/Date(1661904000000)/` (timestamp in milliseconds sinds epoch)
- JavaScript's `new Date("/Date(1661904000000)/")` retourneert `Invalid Date`

De code deed:
```typescript
const dueDate = item.DueDate ? new Date(item.DueDate) : null;
```

Dit resulteerde in `Invalid Date`, waardoor `daysOverdue` altijd 0 was.

### Oplossing
Centrale helper functies toegevoegd in `_base.ts`:

```typescript
/**
 * Parse dates from Exact Online API responses.
 * Handles both Microsoft JSON format and ISO 8601.
 */
export function parseExactDate(dateValue: string | null | undefined): Date | null {
  if (!dateValue) return null;

  // Microsoft JSON Date format: "/Date(1661904000000)/"
  const msDateMatch = dateValue.match(/^\/Date\((\d+)\)\/$/);
  if (msDateMatch) {
    return new Date(parseInt(msDateMatch[1], 10));
  }

  // Try standard ISO 8601 format
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format a date value to YYYY-MM-DD format.
 */
export function formatExactDate(dateValue: string | null | undefined): string | undefined {
  const date = parseExactDate(dateValue);
  return date ? date.toISOString().split('T')[0] : undefined;
}
```

### Gebruik in Tools

```typescript
// Import de helpers
import { parseExactDate, formatExactDate } from './_base';

// Voor berekeningen (bijv. daysOverdue)
const dueDate = parseExactDate(item.DueDate);
const daysOverdue = dueDate
  ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
  : 0;

// Voor output (bijv. invoice_date field)
invoice_date: formatExactDate(item.InvoiceDate),
```

### Getroffen Bestanden
- `invoices.ts` - GetSalesInvoicesTool, GetPurchaseInvoicesTool, GetOutstandingInvoicesTool
- `financial.ts` - GetBankTransactionsTool
- `reporting.ts` - GetTransactionsTool

### Microsoft JSON Date Format Referentie
- Format: `/Date(timestamp)/` waar timestamp milliseconden sinds 1 januari 1970 is
- Voorbeeld: `/Date(1661904000000)/` = `2022-08-31T00:00:00Z`
- Gebruikt door: .NET WCF services, ASP.NET ASMX, sommige OData implementaties
- NIET compatibel met JavaScript's `new Date()` parser

### Preventie
1. **ALTIJD** `parseExactDate()` gebruiken voor date berekeningen
2. **ALTIJD** `formatExactDate()` gebruiken voor date output
3. **NOOIT** `new Date(item.DateField)` direct gebruiken
4. **NOOIT** `item.DateField?.split('T')[0]` gebruiken (werkt niet met MS JSON format)

---

## Lesson: $orderby significant vermindert API performance

**Datum:** 2026-01-31
**ROADMAP:** P25
**Ernst:** HIGH (performance impact)
**Status:** ✅ OPGELOST - Verwijderd uit alle 17 tool bestanden

### Probleem
Exact Online API calls waren trager dan nodig.

### Root Cause
Volgens de officiële Exact Online OData documentatie:
> "$orderby significantly decreases API performance"

De AI (Claude/GPT) sorteert data zelf in het geheugen. Server-side sorteren is dus dubbel werk en vertraagt de API response.

### Oplossing
Alle `$orderby` parameters verwijderd uit 17 tool bestanden (38 endpoints totaal):

| Bestand | Endpoints aangepast |
|---------|---------------------|
| assets.ts | 2 |
| billing.ts | 2 |
| combo.ts | 2 |
| contracts.ts | 2 |
| costcenters.ts | 1 |
| currencies.ts | 2 |
| documents.ts | 1 |
| financial.ts | 4 |
| invoices.ts | 6 |
| items.ts | 2 |
| journals.ts | 2 |
| opportunities.ts | 1 |
| orders.ts | 3 |
| prices.ts | 3 |
| projects.ts | 2 |
| relations.ts | 1 |
| reporting.ts | 2 |

### Code Voorbeeld
```typescript
// FOUT - Server-side sorteren vertraagt API
const endpoint = `/${division}/salesinvoice/SalesInvoices?$select=...&$orderby=InvoiceDate desc${filterString}&$top=${limit}`;

// CORRECT - Geen $orderby, AI sorteert zelf
const endpoint = `/${division}/salesinvoice/SalesInvoices?$select=...${filterString}&$top=${limit}`;
```

### Gerelateerde OData Best Practices (P10)
1. **Prefer header**: `Prefer: return=representation` voor volledige POST response
2. **Bulk endpoints**: `/read/` prefix geeft 1000 records/page ipv 60
3. **$select verplicht**: Altijd expliciete velden selecteren
4. **Geen $orderby**: AI sorteert zelf, geen server-side overhead

### Preventie
1. Gebruik NOOIT `$orderby` in Exact Online API calls
2. Als sortering nodig is, sorteer client-side in JavaScript
3. Documenteer deze keuze in tool comments
4. Check performance metrics na implementatie

---

## Lesson: $select velden moeten exact correct zijn - geen aannames

**Datum:** 2026-01-31
**Commits:** `3f3ded2`, `eeb1a34`, `3dfd1a5`, `086a0d9`
**Ernst:** CRITICAL (veroorzaakt "Ongeldige request" zonder duidelijke foutmelding)

### Probleem
Meerdere tools faalden met "Ongeldige request" zonder specifieke foutmelding.

### Root Cause
De `$select` parameter bevatte velden die NIET bestaan op het endpoint:

| Endpoint | Niet-bestaand veld | Aanname |
|----------|-------------------|---------|
| `salesinvoice/SalesInvoices` | `OutstandingAmountDC` | Leek logisch voor facturen |
| `salesinvoice/SalesInvoices` | `PaymentConditionDescription` | Leek nuttig |
| `financialtransaction/BankEntryLines` | `GLAccountDescription` | Leek beschikbaar |
| `financialtransaction/BankEntryLines` | `BankAccount` | Verkeerde naamgeving |
| `crm/Accounts` | `CreditLine` | Bestaat niet voor alle accounts |
| `financialtransaction/TransactionLines` | `VATAmountDC` | Niet op alle regels |
| `financialtransaction/TransactionLines` | `EntryNumber` | Niet beschikbaar |
| `financialtransaction/TransactionLines` | `CostCenter`, `CostCenterDescription` | Niet altijd |
| `generaljournalentry/GeneralJournalEntries` | `JournalDescription`, `GLAccountCode`, etc. | Entry level vs line level |

### Oplossing
Start met minimale $select en breid alleen uit na bevestiging:

```typescript
// FOUT - Aannames over beschikbare velden
const endpoint = `/${division}/salesinvoice/SalesInvoices?$select=InvoiceID,InvoiceNumber,OutstandingAmountDC,PaymentConditionDescription`;

// CORRECT - Alleen bevestigde velden
const endpoint = `/${division}/salesinvoice/SalesInvoices?$select=InvoiceID,InvoiceNumber,InvoiceTo,InvoiceToName,InvoiceDate,DueDate,Currency,AmountDC,VATAmountDC,Status,Description`;
```

### Bevestigde Werkende Veldlijsten

**salesinvoice/SalesInvoices:**
```
InvoiceID, InvoiceNumber, InvoiceTo, InvoiceToName, InvoiceDate, DueDate, Currency, AmountDC, VATAmountDC, Status, Description
```

**financialtransaction/BankEntryLines:**
```
ID, Date, Description, AmountDC, GLAccount
```

**financialtransaction/TransactionLines:**
```
ID, Date, FinancialYear, FinancialPeriod, JournalCode, Description, GLAccount, GLAccountCode, GLAccountDescription, AmountDC, InvoiceNumber
```

**crm/Accounts:**
```
ID, Code, Name, Email, Phone, City, Country, VATNumber, ChamberOfCommerce, IsSupplier, Status, Blocked
```

### Preventie
1. **Test eerst zonder $select** om te zien welke velden beschikbaar zijn
2. **Voeg velden één voor één toe** en test na elke toevoeging
3. **Documenteer werkende veldlijsten** per endpoint in dit document
4. **Vergelijk met werkende tools** - als `search_transactions` werkt, gebruik dezelfde velden

---

## Lesson: AgingReceivablesListByAgeGroup endpoints zijn onbetrouwbaar

**Datum:** 2026-01-31
**Commit:** `79bcbfa`
**Ernst:** HIGH (veroorzaakt tool failures)

### Probleem
`get_aging_receivables` en `get_aging_payables` faalden met "Ongeldige request".

### Root Cause
De endpoints `AgingReceivablesListByAgeGroup` en `AgingPayablesListByAgeGroup` bestaan mogelijk niet voor alle Exact Online edities, of vereisen specifieke modules die niet altijd actief zijn.

Interessant: `get_aging_analysis` werkte WEL omdat die (met default parameters) `AgingReceivablesList` zonder "ByAgeGroup" suffix gebruikt.

### Oplossing
Gebruik de basis `ReceivablesList` en `PayablesList` endpoints en bereken age groups client-side:

```typescript
// FOUT - ByAgeGroup endpoint faalt vaak
const endpoint = `/${division}/read/financial/AgingReceivablesListByAgeGroup`;

// CORRECT - Basis List endpoint + client-side berekening
const endpoint = `/${division}/read/financial/ReceivablesList?$select=AccountId,AccountCode,AccountName,Amount,DueDate,InvoiceNumber,CurrencyCode`;

// Dan client-side:
const today = new Date();
for (const item of items) {
  const dueDate = parseExactDate(item.DueDate);
  const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

  if (daysOverdue <= 30) ageGroups['0-30'].amount += item.Amount;
  else if (daysOverdue <= 60) ageGroups['31-60'].amount += item.Amount;
  // etc.
}
```

### Trade-off
- **Nadeel:** Iets meer client-side processing
- **Voordeel:** Betrouwbaar over alle Exact Online edities

### Preventie
1. Vermijd "ByAgeGroup" suffixed endpoints
2. Gebruik basis List endpoints met client-side aggregatie
3. Test met accounts van verschillende Exact Online edities

---

## Lesson: Status veld op SalesInvoices is numeriek, niet OutstandingAmountDC

**Datum:** 2026-01-31
**Commit:** `d515931`
**Ernst:** HIGH (filter werkt niet)

### Probleem
Filter op `OutstandingAmountDC gt 0` voor openstaande facturen faalde.

### Root Cause
1. `OutstandingAmountDC` bestaat NIET als filterbaar veld op SalesInvoices
2. Er IS een numeriek `Status` veld dat betalingsstatus aangeeft

### Status Waarden SalesInvoices
| Code | Betekenis |
|------|-----------|
| 0 | Draft |
| 5 | Rejected |
| 10 | Processing |
| 20 | Processed |
| 50 | Paid |

### Oplossing
```typescript
// FOUT - OutstandingAmountDC filter
if (status === 'open') {
  filters.push('OutstandingAmountDC gt 0');
}

// CORRECT - Numeriek Status veld
if (status === 'open') {
  filters.push('Status ne 50'); // Alles behalve betaald
} else if (status === 'paid') {
  filters.push('Status eq 50');
}
```

### Preventie
- Check API documentatie voor filterbare velden
- Test filters individueel voordat je ze combineert

---

## Lesson: Currencies endpoint heeft GEEN IsDefault, Symbol, Active velden

**Datum:** 2026-01-31
**Commit:** `c1c0d57`
**Ernst:** HIGH (veroorzaakt "Ongeldige request")

### Probleem
`get_currencies` tool faalde met "Ongeldige request naar Exact Online API".

### Root Cause
De code gebruikte velden die NIET bestaan op het `/general/Currencies` endpoint:

| Veld in code | Bestaat? | API Docs |
|--------------|----------|----------|
| `Code` | ✅ | Primary key |
| `Description` | ✅ | Naam van valuta |
| `IsDefault` | ❌ | BESTAAT NIET |
| `Symbol` | ❌ | BESTAAT NIET |
| `Active` | ❌ | BESTAAT NIET |

### Werkelijke Currencies Velden (API Docs)
| Veld | Type | Beschrijving |
|------|------|--------------|
| Code | Edm.String | Primary key (EUR, USD, etc.) |
| Description | Edm.String | Valuta naam |
| AmountPrecision | Edm.Double | Decimalen voor wisselkoersen |
| PricePrecision | Edm.Double | Decimalen voor prijzen |
| Created | Edm.DateTime | Aanmaakdatum |
| Modified | Edm.DateTime | Wijzigingsdatum |

### Oplossing
```typescript
// FOUT - Niet-bestaande velden
const endpoint = `/${division}/general/Currencies?$select=Code,Description,IsDefault,Symbol,Active`;

// CORRECT - Alleen bestaande velden
const endpoint = `/${division}/general/Currencies?$select=Code,Description,AmountPrecision,PricePrecision`;
```

### Bron
https://start.exactonline.nl/docs/HlpRestAPIResourcesDetails.aspx?name=GeneralCurrencies

---

## Lesson: Items endpoint - meerdere velden bestaan niet

**Datum:** 2026-01-31
**Commit:** `c1c0d57`
**Ernst:** HIGH (veroorzaakt "Ongeldige request")

### Probleem
`get_items` tool faalde met "Ongeldige request naar Exact Online API".

### Root Cause
De code gebruikte velden die NIET bestaan op het `/logistics/Items` endpoint:

| Veld in code | Bestaat? |
|--------------|----------|
| `ItemGroupDescription` | ❌ |
| `IsWebshopItem` | ❌ |
| `SalesPrice` | ❌ (gebruik `StandardSalesPrice`) |
| `PurchasePrice` | ❌ |
| `UnitDescription` | ❌ (alleen `Unit`) |

### Werkende Items Velden
```
ID, Code, Description, IsSalesItem, IsPurchaseItem, IsStockItem,
CostPriceStandard, StandardSalesPrice, Unit, Stock
```

### Oplossing
```typescript
// FOUT - Niet-bestaande velden
const endpoint = `/${division}/logistics/Items?$select=ID,Code,Description,Type,ItemGroup,ItemGroupDescription,IsSalesItem,IsPurchaseItem,IsStockItem,IsWebshopItem,CostPriceStandard,SalesPrice,PurchasePrice,Unit,UnitDescription,Stock,Created,Modified`;

// CORRECT - Alleen bestaande velden
const endpoint = `/${division}/logistics/Items?$select=ID,Code,Description,IsSalesItem,IsPurchaseItem,IsStockItem,CostPriceStandard,StandardSalesPrice,Unit,Stock`;
```

### Bron
https://start.exactonline.nl/docs/HlpRestAPIResourcesDetails.aspx?name=LogisticsItems

---

## Lesson: TransactionLines - VATAmountDC bestaat niet, gebruik AmountVATFC

**Datum:** 2026-01-31
**Commit:** `c1c0d57`
**Ernst:** HIGH (veroorzaakt "Ongeldige request")

### Probleem
`get_vat_summary` tool faalde met "Ongeldige request naar Exact Online API".

### Root Cause
Het veld `VATAmountDC` bestaat NIET op TransactionLines. De juiste velden zijn:
- `AmountVATFC` - BTW bedrag in factuurvaluta
- `AmountVATBaseFC` - BTW grondslag in factuurvaluta

### TransactionLines BTW-gerelateerde Velden
| Veld | Type | Beschrijving |
|------|------|--------------|
| `VATCode` | Edm.String | BTW code |
| `VATPercentage` | Edm.Double | BTW percentage |
| `AmountVATFC` | Edm.Double | BTW bedrag (factuurvaluta) |
| `AmountVATBaseFC` | Edm.Double | Grondslag (factuurvaluta) |
| `VATType` | Edm.String | BTW type |

### Oplossing
```typescript
// FOUT - VATAmountDC bestaat niet
const endpoint = `/${division}/financialtransaction/TransactionLines?$select=VATCode,VATAmountDC,AmountDC,VATPercentage&$filter=VATAmountDC ne 0`;

// CORRECT - Gebruik AmountVATFC
const endpoint = `/${division}/financialtransaction/TransactionLines?$select=VATCode,AmountVATFC,AmountFC,VATPercentage&$filter=AmountVATFC ne 0`;
```

### Bron
https://start.exactonline.nl/docs/HlpRestAPIResourcesDetails.aspx?name=FinancialTransactionTransactionLines

---

## API Veld Verificatie Workflow

Na herhaalde $select errors, volg deze workflow:

### Stap 1: Check officiële API docs
```
https://start.exactonline.nl/docs/HlpRestAPIResourcesDetails.aspx?name=[EndpointNaam]
```

### Stap 2: Noteer ALLEEN gedocumenteerde velden
- Kopieer veldnamen exact (case-sensitive!)
- Let op: sommige velden hebben andere namen dan verwacht

### Stap 3: Test minimale $select eerst
```typescript
// Start simpel
const endpoint = `/${division}/path/Endpoint?$select=ID,Name&$top=1`;
```

### Stap 4: Breid uit en test na elke toevoeging
```typescript
// Voeg één veld toe
const endpoint = `/${division}/path/Endpoint?$select=ID,Name,NewField&$top=1`;
```

### Stap 5: Documenteer werkende veldlijst
Voeg toe aan dit document onder "Bevestigde Werkende Veldlijsten"

---

## Lesson: DocumentAttachments Ongeldige Velden

**Datum:** 2026-01-31
**Ernst:** High

### Probleem
`get_document_attachments` faalde met "Ongeldige request" error.

### Root Cause
De $select bevatte niet-bestaande velden:
- `AttachmentFileName` → bestaat niet (gebruik `FileName`)
- `AttachmentFileSize` → bestaat niet (gebruik `FileSize`)
- `AttachmentUrl` → bestaat niet (gebruik `Url`)
- `Created` → bestaat niet op DocumentAttachments
- `Creator` → bestaat niet op DocumentAttachments

### Oplossing
```typescript
// Before (fout)
$select=ID,AttachmentFileName,AttachmentFileSize,AttachmentUrl,Document,FileName,FileSize,Created,Creator

// After (correct)
$select=ID,Document,FileName,FileSize,Url
```

### Bron
https://start.exactonline.nl/docs/HlpRestAPIResourcesDetails.aspx?name=DocumentsDocumentAttachments

---

## Lesson: SalesItemPrices NumberOfItemsPerUnit Typo

**Datum:** 2026-01-31
**Ernst:** High

### Probleem
`get_sales_prices` faalde met "Ongeldige request" error.

### Root Cause
Typo in veldnaam: `NumberOfItemPerUnit` i.p.v. `NumberOfItemsPerUnit` (mist de 's').

### Oplossing
```typescript
// Before (fout)
$select=...,NumberOfItemPerUnit,...

// After (correct)
$select=...,NumberOfItemsPerUnit,...
```

### Preventie
Altijd exact veldnamen kopiëren uit API docs, niet typen.

---

## Lesson: Items Endpoint - PurchasePrice, SalesPrice, Currency Bestaan Niet

**Datum:** 2026-01-31
**Ernst:** High

### Probleem
`get_purchase_prices` en `get_margin_analysis` faalden met "Ongeldige request" error.

### Root Cause
De /logistics/Items endpoint heeft deze velden NIET:
- `PurchasePrice` → bestaat niet
- `SalesPrice` → gebruik `StandardSalesPrice`
- `Currency` → bestaat niet (gebruik `CostPriceCurrency` indien nodig)

### Oplossing
```typescript
// Before (fout)
$select=ID,Code,Description,PurchasePrice,CostPriceStandard,SalesPrice,Currency,...

// After (correct)
$select=ID,Code,Description,CostPriceStandard,StandardSalesPrice,...
```

### Bevestigde Items Velden
- ID, Code, Description
- CostPriceStandard, CostPriceNew, AverageCost
- StandardSalesPrice
- Unit, UnitDescription
- IsPurchaseItem, IsSalesItem, IsStockItem
- ItemGroup, ItemGroupCode, ItemGroupDescription
- Created, Modified

### Bron
https://start.exactonline.nl/docs/HlpRestAPIResourcesDetails.aspx?name=LogisticsItems

---

## Lesson: GeneralJournalEntries - Date Veld Bestaat Niet

**Datum:** 2026-01-31
**Ernst:** High

### Probleem
`get_journal_entries` faalde met "Ongeldige request" error.

### Root Cause
Het `Date` veld bestaat NIET op GeneralJournalEntries. Beschikbare datum velden:
- `Created` (Edm.DateTime)
- `Modified` (Edm.DateTime)

### Oplossing
```typescript
// Before (fout) - filter op niet-bestaand Date veld
const filters = [
  `Date ge datetime'${fromDate}T00:00:00'`,
  `Date le datetime'${toDate}T23:59:59'`,
  ...
];

// After (correct) - gebruik Created
const filters = [
  `Created ge datetime'${fromDate}T00:00:00'`,
  `Created le datetime'${toDate}T23:59:59'`,
  ...
];
```

### Bevestigde GeneralJournalEntries Velden
- EntryID, EntryNumber
- JournalCode, JournalDescription
- FinancialYear, FinancialPeriod
- Created, Modified
- Currency, ExchangeRate
- Status, StatusDescription
- Type, TypeDescription
- Division, Reversal

### Bron
https://start.exactonline.nl/docs/HlpRestAPIResourcesDetails.aspx?name=GeneralJournalEntryGeneralJournalEntries

---

## Lesson: ReportingBalance Endpoint Vereist /read/ Prefix

**Datum:** 2026-01-31
**Ernst:** High

### Probleem
`get_profit_loss` retourneerde "De gevraagde gegevens zijn niet gevonden" error.

### Root Cause
De endpoint `/financial/ReportingBalance` werkt niet zonder `/read/` prefix.
Consistent met andere bulk-read endpoints zoals ReceivablesList, PayablesList.

### Oplossing
```typescript
// Before (fout)
const endpoint = `/${division}/financial/ReportingBalance?$select=...`;

// After (correct)
const endpoint = `/${division}/read/financial/ReportingBalance?$select=...`;
```

### Preventie
Bulk read endpoints altijd met `/read/` prefix:
- `/read/financial/ReportingBalance`
- `/read/financial/ReceivablesList`
- `/read/financial/PayablesList`
- `/read/financial/AgingReceivablesList`
- `/read/financial/AgingPayablesList`

---

## Bevestigde Werkende Veldlijsten

### DocumentAttachments
```
ID, Document, FileName, FileSize, Url
```

### SalesItemPrices
```
ID, Item, ItemCode, ItemDescription, Account, AccountName, Currency,
DefaultItemUnit, DefaultItemUnitDescription, NumberOfItemsPerUnit,
Price, Quantity, StartDate, EndDate, Created, Modified
```

### Items (logistics)
```
ID, Code, Description, CostPriceStandard, StandardSalesPrice,
Unit, UnitDescription, IsPurchaseItem, IsSalesItem, IsStockItem,
ItemGroup, ItemGroupCode, ItemGroupDescription, Created, Modified, Stock
```

### GeneralJournalEntries
```
EntryID, JournalCode, JournalDescription, FinancialYear, FinancialPeriod,
Created, Modified, Currency, Division, EntryNumber, Status, StatusDescription
```

### ReportingBalance
```
GLAccount, GLAccountCode, GLAccountDescription, BalanceType,
AmountDebit, AmountCredit, Amount, ReportingYear, ReportingPeriod
```
**LET OP:** Endpoint is `/financial/ReportingBalance` (ZONDER /read/ prefix!)

---

## Lesson: ReportingBalance Endpoint Path (Geen /read/ prefix)

**Datum:** 2026-01-31
**Ernst:** High

### Probleem
`get_trial_balance` en `get_profit_loss` retourneerden "De gevraagde gegevens zijn niet gevonden" error.

### Root Cause
Het ReportingBalance endpoint werkt ZONDER `/read/` prefix:
- ❌ `/read/financial/ReportingBalance` - werkt NIET
- ✅ `/financial/ReportingBalance` - werkt WEL

### Endpoint Prefix Regels
| Endpoint | Prefix |
|----------|--------|
| ReportingBalance | `/financial/` (geen /read/) |
| GLAccounts | `/financial/` (geen /read/) |
| ReceivablesList | `/read/financial/` |
| PayablesList | `/read/financial/` |
| AgingReceivablesList | `/read/financial/` |
| RevenueListByYear | `/read/financial/` |

### Bron
https://github.com/picqer/exact-php-client (endpoint definitie)

---

## Lesson: Module N/A Tools API Verificatie (2026-01-31)

**Datum:** 2026-01-31
**Ernst:** High

### Probleem
10 tools die "Module N/A" status hadden in tests bleken veel verkeerde API veldnamen en status codes te gebruiken.

### Gevonden Issues per Tool

#### PurchaseOrders
- `VATAmountDC` → `VATAmount`
- Status codes: 10=Open (niet Draft), 20=Partial, 30=Complete, 40=Canceled (niet 45)

#### Quotations
- `ValidUntil` → `DueDate`
- `VATAmountDC` → `VATAmountFC`
- Status codes compleet anders: 5=Rejected, 20=Draft, 25=Open, 35=Processing, 50=Accepted

#### Projects
- `ManagerFullName` → `ManagerFullname` (lowercase 'n')
- Type codes: 1=Campaign, 2=Fixed, 3=T&M, 4=Non-billable, 5=Prepaid

#### TimeTransactions
- `Hours` → `Quantity`
- `Status` → `HourStatus`
- Status codes: 1=Draft, 2=Rejected, 10=Submitted, 20=Final

#### InvoiceTerms (Project Invoices)
- `ProjectCode`, `Account`, `AccountName` bestaan NIET op dit endpoint

#### CostsByProject (WIP Overview)
- `ProjectStatus` filter bestaat NIET
- Endpoint mogelijk niet officieel gedocumenteerd

#### SubscriptionLines
- `Subscription` → `EntryID` (foreign key)
- `StartDate` → `FromDate`
- `EndDate` → `ToDate`
- `ItemCode` bestaat NIET

### Oplossing
Alle veldnamen en status codes gecorrigeerd naar officiële API documentatie.
Type casts toegevoegd voor backwards compatibility.

### Preventie
1. ALTIJD officiële API docs checken: https://start.exactonline.nl/docs/HlpRestAPIResourcesDetails.aspx?name=[EndpointName]
2. Picqer PHP client als referentie: https://github.com/picqer/exact-php-client
3. Test met echte API responses, niet alleen documentatie

---

## Lesson: Token refresh retry mechanisme met exponential backoff

**Datum:** 2026-02-01
**Issue:** #123
**Ernst:** CRITICAL (users moesten opnieuw inloggen)
**Status:** ✅ OPGELOST - Retry mechanisme geïmplementeerd

### Probleem
OAuth token refresh faalde regelmatig en users moesten opnieuw verbinding maken met Exact Online, ook al was hun refresh token nog 30 dagen geldig.

### Root Cause
Het token refresh cron job had een architecturaal probleem:
1. Bij falen werd de status direct op `refresh_failed` gezet
2. De query `WHERE status = 'active'` sloot gefaalde connections permanent uit
3. Er was **GEEN** retry mechanisme - één fout = permanent verloren

Database toonde 2 connections met `status = 'refresh_failed'` terwijl hun refresh tokens nog tot maart geldig waren!

### Oplossing
Retry mechanisme met exponential backoff geïmplementeerd:

**Nieuwe status flow:**
```
active → (falen) → retry_pending → (retry) → active (succes)
                                          → refresh_failed (terminal na 5 pogingen)
```

**Exponential backoff schema:**
| Poging | Wachttijd |
|--------|-----------|
| 1 | 5 minuten |
| 2 | 15 minuten |
| 3 | 1 uur |
| 4 | 6 uur |
| 5 | 24 uur |

Totaal: ~31 uur aan retry pogingen voordat terminal failure.

**Database wijzigingen (migratie 0024):**
```sql
ALTER TABLE connections ADD COLUMN retry_count INTEGER DEFAULT 0;
ALTER TABLE connections ADD COLUMN next_retry_at TEXT;
ALTER TABLE connections ADD COLUMN last_retry_error TEXT;

CREATE INDEX idx_connections_retry_eligible
  ON connections(status, next_retry_at, refresh_token_expires_at);
```

**Code wijzigingen (token-refresh.ts):**
```typescript
// Bij falen: schedule retry ipv direct naar refresh_failed
if (newRetryCount <= MAX_RETRY_COUNT && !refreshTokenExpired) {
  const backoffMinutes = RETRY_BACKOFF_MINUTES[newRetryCount - 1];
  await env.DB.prepare(`
    UPDATE connections
    SET
      status = 'retry_pending',
      retry_count = ?,
      next_retry_at = datetime('now', '+' || ? || ' minutes'),
      last_retry_error = ?
    WHERE id = ?
  `).bind(newRetryCount, backoffMinutes, errorMessage, connectionId).run();
}

// Query verwerkt ook retry_pending connections
WHERE status = 'active' ... OR (status = 'retry_pending' AND next_retry_at <= now())
```

### Terminal Failure Condities
Pas `refresh_failed` status bij:
1. Max retries (5) overschreden
2. Refresh token verlopen (`refresh_token_expires_at < now()`)

### Preventie
- Altijd retry mechanisme bouwen voor externe API calls
- Track refresh token expiry apart van access token expiry
- Monitor retry_count voor proactieve alerts
- Stuur user notificatie bij terminal failure zodat ze actie kunnen nemen
