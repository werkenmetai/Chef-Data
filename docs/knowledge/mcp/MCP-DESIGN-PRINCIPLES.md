# MCP Tool Design Principles

> **Kernprincipe:** Des te beter de MCP filters kan toepassen en de juiste kolommen selecteert, des te sneller en betrouwbaarder het systeem werkt.
>
> — Matthijs Huttinga, 2026-01-29

---

## Het Fundamentele Principe

Bij MCP tools voor Exact Online (en vergelijkbare API's) is er een directe correlatie tussen **query precisie** en **systeem kwaliteit**:

```
Betere Filters + Juiste Kolommen = Sneller + Minder Fouten + Lagere Kosten
```

Dit principe heeft impact op drie niveaus:

| Niveau | Gevolg van Slechte Queries | Gevolg van Goede Queries |
|--------|---------------------------|--------------------------|
| **Performance** | Trage responses, timeouts | Snelle responses |
| **Betrouwbaarheid** | Rate limits, truncatie, errors | Stabiele werking |
| **Kosten** | Meer API calls, meer tokens | Efficiënt gebruik |

---

## Waarom Dit Zo Belangrijk Is

### 1. Exact Online API Heeft Limieten

```yaml
Rate limits:
  - 60 requests per minute (per API key)
  - 5000 requests per day (standaard plan)

Response limits:
  - Max 1000 records per request
  - Pagination vereist voor meer
```

**Elke onnodige kolom of ontbrekend filter = meer data = meer kans op problemen.**

### 2. Claude's Context Window Is Beperkt

Zelfs met grote context windows:
- Meer data = langzamere verwerking
- Meer data = meer kans op "lost in the middle"
- Meer data = hogere token kosten

### 3. Minder Data = Minder Foutmogelijkheden

```
Zonder filter:    10.000 records → parse errors, timeouts, truncatie
Met filter:          50 records → clean, snel, betrouwbaar
```

---

## De Twee Pilaren

### Pilaar 1: OData $filter - Vraag Alleen Wat Je Nodig Hebt

**Slecht:**
```
/crm/Accounts
→ Haalt ALLE 5000 relaties op
```

**Goed:**
```
/crm/Accounts?$filter=IsCustomer eq true and Blocked eq false
→ Haalt alleen actieve klanten op (mogelijk 200 records)
```

**Best Practices voor Filters:**

| Scenario | Filter |
|----------|--------|
| Alleen klanten | `IsCustomer eq true` |
| Alleen leveranciers | `IsSupplier eq true` |
| Actieve relaties | `Blocked eq false` |
| Facturen dit jaar | `InvoiceDate ge datetime'2026-01-01'` |
| Openstaande facturen | `Status ne 50` (50 = betaald) |
| Specifieke periode | `FinancialPeriod eq 1 and ReportingYear eq 2026` |

### Pilaar 2: OData $select - Vraag Alleen De Kolommen Die Je Nodig Hebt

**Slecht:**
```
/crm/Accounts
→ Haalt 50+ velden op per record
```

**Goed:**
```
/crm/Accounts?$select=ID,Code,Name,Email,IsCustomer,Blocked
→ Haalt alleen 6 relevante velden op
```

**Best Practices voor Select:**

| Tool Doel | Selecteer | Niet Nodig |
|-----------|-----------|------------|
| Klantoverzicht | ID, Code, Name, Email, Phone | Alle adresvelden, timestamps |
| Factuurlijst | InvoiceNumber, Date, Amount, Status | Alle regeldetails |
| Aging analyse | AccountId, Amount, DueDate | Description, YourRef |

---

## Pilaar 3: Pre-API Filter Selection (Nieuw)

> **Principe:** Laat Claude de juiste filters en kolommen kiezen VOORDAT de API wordt aangeroepen.

Dit is de meest impactvolle optimalisatie: de LLM zelf slim maken over welke data nodig is.

### Het Probleem

```
Gebruiker: "Welke klanten hebben openstaande facturen?"

Naïeve tool:
1. Claude roept get_relations aan (alle 5000 relaties)
2. Claude roept get_outstanding_invoices aan (alle 2000 facturen)
3. Claude matcht handmatig in context → traag, duur, foutgevoelig

Slimme tool:
1. Claude roept get_outstanding_invoices aan met type='receivables'
   → Alleen openstaande debiteuren, direct met klantnamen
```

### De Oplossing: Semantic Tool Descriptions

Tool descriptions moeten Claude **leren denken** over welke data nodig is:

```typescript
// SLECHT: Beschrijft WAT de tool doet
description: 'Haal openstaande facturen op'

// GOED: Beschrijft WANNEER en HOE te gebruiken
description:
  'Haal openstaande facturen (debiteuren/crediteuren) op. ' +
  'WANNEER: klant wil weten wie nog moet betalen, cashflow planning, incasso prioritering. ' +
  'KIES type=receivables voor: "wie moet mij betalen", "openstaande debiteuren", "te ontvangen". ' +
  'KIES type=payables voor: "wat moet ik betalen", "openstaande crediteuren", "te betalen". ' +
  'KIES type=both voor: "netto positie", "cashflow overzicht". ' +
  'TIP: Combineer met min_days_overdue voor incasso focus.'
```

### Parameter Descriptions als Beslishulp

```typescript
inputSchema: {
  properties: {
    type: {
      type: 'string',
      enum: ['receivables', 'payables', 'both'],
      description:
        'receivables = debiteuren (klanten die moeten betalen). ' +
        'payables = crediteuren (leveranciers die betaald moeten worden). ' +
        'both = beide (voor netto positie berekening).'
    },
    min_days_overdue: {
      type: 'number',
      description:
        'Filter op minimaal X dagen over vervaldatum. ' +
        'Gebruik 0 voor alle openstaande, 30 voor incasso focus, 90 voor probleemgevallen.'
    },
    customer_id: {
      type: 'string',
      description:
        'Filter op specifieke klant (GUID). ' +
        'Gebruik bij: "facturen van klant X", "wat staat er open bij [naam]".'
    }
  }
}
```

### Vraag-naar-Filter Mapping in Descriptions

Help Claude door expliciete mappings te geven:

```typescript
description:
  'Haal omzet en kosten per periode (P&L / resultatenrekening). ' +

  // Expliciete vraag-mapping
  'GEBRUIK DEZE TOOL BIJ VRAGEN OVER: ' +
  'omzet, kosten, winst, verlies, resultaat, marge, brutowinst, nettowinst, ' +
  'resultatenrekening, P&L, profit & loss, "hoe doen we het", "zijn we winstgevend". ' +

  // Filter guidance
  'PERIODE FILTERS: ' +
  'year + period_from + period_to voor specifieke maanden. ' +
  'Alleen year voor heel boekjaar. ' +
  'Geen parameters voor huidig jaar tot nu. ' +

  // Wat NIET te verwachten
  'NIET GEBRUIKEN VOOR: balans, activa, passiva, eigen vermogen (gebruik get_trial_balance).'
```

### Voorbeeld: Slimme Tool Description

```typescript
export class GetAgingAnalysisTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_aging_analysis',
    description:
      // WAT
      'Ouderdomsanalyse van openstaande posten per leeftijdscategorie (0-30, 31-60, 61-90, 90+ dagen). ' +

      // WANNEER
      'GEBRUIK BIJ: "hoeveel staat er lang open", "incasso prioriteit", "oude facturen", ' +
      '"betalingsgedrag", "DSO", "kredietrisico", "welke klanten betalen slecht". ' +

      // HOE - Filter guidance
      'KIES type=receivables voor debiteuren (standaard). ' +
      'KIES type=payables voor crediteuren. ' +
      'KIES group_by_account=true om per klant/leverancier te zien. ' +

      // WAT JE KRIJGT
      'RESULTAAT: bedragen per leeftijdscategorie, totalen, optioneel per relatie. ' +

      // WAT NIET
      'NIET VOOR: specifieke factuur details (gebruik get_outstanding_invoices).',

    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie. Optioneel: zonder = alle administraties.'
        },
        type: {
          type: 'string',
          enum: ['receivables', 'payables'],
          description:
            'receivables (default) = analyse van debiteuren. ' +
            'payables = analyse van crediteuren.'
        },
        group_by_account: {
          type: 'boolean',
          description:
            'true = uitsplitsing per klant/leverancier (voor "wie betaalt slecht"). ' +
            'false (default) = alleen totalen per leeftijdscategorie.'
        }
      }
    }
  };
}
```

### Checklist voor Pre-API Filtering

Bij elke tool description, check:

- [ ] **Vraag-mapping**: Welke gebruikersvragen triggeren deze tool?
- [ ] **Filter guidance**: Wanneer welke parameter waarde?
- [ ] **Anti-patterns**: Waarvoor moet deze tool NIET gebruikt worden?
- [ ] **Combinatie hints**: Welke andere tools zijn relevant?
- [ ] **Default uitleg**: Wat gebeurt er zonder parameters?

### Impact

| Zonder Pre-filtering | Met Pre-filtering |
|---------------------|-------------------|
| Claude haalt alles op, filtert achteraf | Claude vraagt precies wat nodig is |
| 3-5 API calls per vraag | 1-2 API calls per vraag |
| Grote responses, veel tokens | Kleine responses, weinig tokens |
| Foutgevoelig bij grote datasets | Consistent betrouwbaar |
| Langzame user experience | Snelle responses |

---

## Impact op Tool Design

### Tool Descriptions Moeten Precies Zijn

De **tool description** bepaalt wanneer Claude de tool selecteert en met welke parameters.

**Slecht:**
```typescript
description: 'Haal klantgegevens op'
// → Claude weet niet wanneer te gebruiken of met welke filters
```

**Goed:**
```typescript
description:
  'Haal klantgegevens op uit een administratie. ' +
  'Gebruik voor: klantoverzicht, contactinfo opzoeken, debiteurenbeheer. ' +
  'Kan filteren op: actief/inactief, alleen klanten/leveranciers/beide. ' +
  'Retourneert: code, naam, email, telefoon, status.',
// → Claude weet precies wanneer en hoe te gebruiken
```

### Parameters Moeten Filters Ondersteunen

**Slecht:**
```typescript
inputSchema: {
  properties: {
    division: { type: 'number' }
  }
}
// → Geen filteropties, haalt altijd alles op
```

**Goed:**
```typescript
inputSchema: {
  properties: {
    division: { type: 'number' },
    type: {
      type: 'string',
      enum: ['customer', 'supplier', 'both'],
      description: 'Filter op klanten, leveranciers, of beide'
    },
    active_only: {
      type: 'boolean',
      description: 'Alleen actieve relaties (default: true)'
    },
    limit: {
      type: 'number',
      description: 'Max aantal resultaten (default: 100)'
    }
  }
}
```

---

## Implementatie Checklist

Bij het bouwen of reviewen van MCP tools:

### Query Optimalisatie

- [ ] **Filter vroeg**: Pas $filter toe op de API, niet in de code na ophalen
- [ ] **Selecteer specifiek**: Gebruik $select met alleen benodigde velden
- [ ] **Limiteer resultaten**: Gebruik $top of limit parameter
- [ ] **Sorteer slim**: Gebruik $orderby zodat belangrijkste data eerst komt
- [ ] **Pagineer bewust**: Overweeg of alle pages echt nodig zijn

### Tool Description

- [ ] **Doel duidelijk**: Beschrijf waarvoor de tool bedoeld is
- [ ] **Use cases expliciet**: Noem concrete scenarios
- [ ] **Filters documenteren**: Beschrijf welke filters beschikbaar zijn
- [ ] **Output beschrijven**: Vertel wat de response bevat

### Error Prevention

- [ ] **Default waarden**: Zet verstandige defaults (active_only=true, limit=100)
- [ ] **Validatie**: Valideer input voordat API call wordt gedaan
- [ ] **Fallbacks**: Handle edge cases (geen data, te veel data)

---

## Voorbeeld: Aging Analysis Tool

### Slechte Implementatie

```typescript
// Haalt ALLE openstaande posten op zonder filter
const endpoint = `/${division}/read/financial/ReceivablesList`;
const response = await this.exactRequest(endpoint);

// Filter achteraf in code - INEFFICIENT
const overdue = response.filter(item => {
  const dueDate = new Date(item.DueDate);
  return dueDate < new Date();
});
```

**Problemen:**
- Haalt mogelijk 10.000+ records op
- Filtert in JavaScript ipv op API niveau
- Alle kolommen opgehaald terwijl maar 3 nodig zijn

### Goede Implementatie

```typescript
// Filter op API niveau: alleen vervallen posten
const filter = encodeURIComponent(`DueDate lt datetime'${today}'`);
const select = 'AccountId,Amount,DueDate,CurrencyCode';
const endpoint = `/${division}/read/financial/ReceivablesList?$filter=${filter}&$select=${select}`;
const response = await this.exactRequest(endpoint);
// Response bevat alleen relevante data, direct bruikbaar
```

**Voordelen:**
- Database doet het zware werk (geoptimaliseerd)
- Minimale data transfer
- Minder kans op rate limits/timeouts
- Schonere code

---

## Metrics voor Succes

Monitor deze metrics om te zien of het principe wordt toegepast:

| Metric | Doel | Actie bij Overschrijding |
|--------|------|-------------------------|
| Gem. response tijd per tool | < 2 seconden | Review filters |
| Records per response | < 500 gemiddeld | Add default limits |
| Rate limit hits | < 1% van requests | Optimize queries |
| API calls per user vraag | < 5 gemiddeld | Combine tools |

---

## Gerelateerde Documenten

- `docs/tools.md` - Tool reference met parameters
- `docs/exact-online-api/odata.md` - OData query syntax
- `docs/exact-online-api/rate-limits.md` - API limieten
- `apps/mcp-server/src/exact/odata-query.ts` - Query builder utility

---

## Samenvatting: De Drie Pilaren

**Het kernprincipe:**

> Des te beter de MCP filters kan toepassen en de juiste kolommen selecteert, des te sneller het werkt met minder fouten.

### De Drie Pilaren

| Pilaar | Principe | Implementatie |
|--------|----------|---------------|
| **1. OData $filter** | Vraag alleen wat je nodig hebt | API-level filtering, niet post-fetch |
| **2. OData $select** | Vraag alleen benodigde kolommen | Expliciete $select in elke query |
| **3. Pre-API Selection** | Laat Claude slim kiezen | Semantic tool descriptions |

### De Feedbackloop

```
Goede Tool Description
        ↓
Claude kiest juiste filters
        ↓
Minimale API request
        ↓
Snelle, schone response
        ↓
Betere user experience
        ↓
Minder errors, lagere kosten
```

### Wat Dit Betekent voor Development

| Fase | Focus |
|------|-------|
| Tool Design | Schrijf descriptions die Claude helpen kiezen |
| Implementation | Vertaal parameters naar $filter/$select |
| Testing | Valideer dat Claude juiste parameters kiest |
| Monitoring | Track API calls per user vraag |

---

## Volgende Stappen

### TODO: Tool Description Audit

Review alle bestaande tools op:
1. Vraag-mapping aanwezig?
2. Filter guidance in descriptions?
3. Anti-patterns gedocumenteerd?
4. Defaults uitgelegd?

Prioriteit tools voor audit:
- [x] `get_outstanding_invoices` - hoogste gebruik (FIXED: DueDate + AccountId filters toegevoegd, customer_id/supplier_id parameters)
- [x] `get_sales_invoices` - klantfilter (OK: InvoiceTo filter via customer_id parameter)
- [x] `get_profit_loss` - complexe filters (OK: ReportingYear/Period filters)
- [x] `get_aging_analysis` - veel parameters (OK: geen extra filters nodig)
- [x] `get_relations` - basis tool (OK: IsCustomer/IsSupplier/Blocked filters)
- [x] `search_relations` - zoek optimalisatie (OK: substringof filter)

Zie `docs/knowledge/exact/API-FILTERS.md` voor complete mapping van tool parameters naar OData filters.

---

**Laatst bijgewerkt:** 2026-01-29
**Auteur:** Claude (op basis van inzichten Matthijs)
**Eigenaar:** Kees (CTO)
