# MCP Tools Reference

Complete reference for all available MCP tools. All tools use Dutch descriptions optimized for Claude.

## Overview

| Category | Tools | Status |
|----------|-------|--------|
| Administraties | 1 | Live |
| Relaties | 2 | Live |
| Facturen | 3 | Live |
| Financieel | 3 | Live |
| Reporting | 6 | Live |
| **Totaal** | **15** | |

---

## Division Tools

### list_divisions

Toon alle Exact Online administraties waar de gebruiker toegang tot heeft.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| include_inactive | boolean | No | Toon ook inactieve administraties |

**Example:**
```json
{
  "name": "list_divisions",
  "arguments": {
    "include_inactive": false
  }
}
```

**Response:**
```json
{
  "divisions": [
    {
      "division_id": 123456,
      "division_code": "123456",
      "division_name": "Demo Bedrijf B.V.",
      "country": "NL",
      "currency": "EUR",
      "is_active": true
    }
  ],
  "total": 1
}
```

---

## Relation Tools

### get_relations

Haal de relaties (klanten/leveranciers) op uit een administratie.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| division | number | Yes | Administratie code |
| type | string | No | `customer`, `supplier`, of `both` (default: both) |
| limit | number | No | Max aantal resultaten (1-1000, default: 100) |

**Response:**
```json
{
  "relations": [
    {
      "id": "guid",
      "code": "KLANT001",
      "name": "Klant B.V.",
      "type": "customer",
      "email": "info@klant.nl",
      "phone": "+31612345678",
      "city": "Amsterdam",
      "country": "NL"
    }
  ],
  "count": 1
}
```

### search_relations

Zoek relaties op naam, code, KvK-nummer of BTW-nummer.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| division | number | Yes | Administratie code |
| query | string | Yes | Zoekterm (min. 2 karakters) |
| search_fields | array | No | Velden om te doorzoeken: `name`, `code`, `kvk`, `vat` |

---

## Invoice Tools

### get_sales_invoices

Haal verkoopfacturen op met optionele filtering.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| division | number | Yes | Administratie code |
| status | string | No | `open`, `paid`, `overdue`, of `all` (default: all) |
| from_date | string | No | Begindatum (YYYY-MM-DD) |
| to_date | string | No | Einddatum (YYYY-MM-DD) |
| limit | number | No | Max resultaten (default: 100) |

**Response:**
```json
{
  "invoices": [...],
  "count": 10,
  "totals": {
    "total_amount": 12500.00,
    "total_outstanding": 3200.00,
    "currency": "EUR"
  }
}
```

### get_purchase_invoices

Haal inkoopfacturen/boekingen op.

**Parameters:** Zelfde als get_sales_invoices

### get_outstanding_invoices

Haal alle openstaande facturen op (debiteuren + crediteuren).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| division | number | No | Administratie code (optioneel: zonder = standaard) |
| type | string | No | `receivable`, `payable`, of `both` (default: both) |
| customer_id | string | No | Filter debiteuren op klant ID (GUID) |
| supplier_id | string | No | Filter crediteuren op leverancier ID (GUID) |
| overdue_only | boolean | No | Alleen facturen voorbij vervaldatum (default: false) |
| min_days_overdue | number | No | Minimaal X dagen over vervaldatum (30/60/90) |

**Response:**
```json
{
  "receivables": [...],
  "payables": [...],
  "summary": {
    "total_receivable": 15000.00,
    "total_payable": 8500.00,
    "net_position": 6500.00,
    "currency": "EUR"
  }
}
```

---

## Financial Tools

### get_bank_transactions

Haal bankmutaties op.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| division | number | Yes | Administratie code |
| from_date | string | No | Begindatum (YYYY-MM-DD) |
| to_date | string | No | Einddatum (YYYY-MM-DD) |
| bank_account | string | No | Filter op bankrekening ID |
| limit | number | No | Max resultaten (default: 100) |

### get_gl_accounts

Haal grootboekrekeningen op.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| division | number | Yes | Administratie code |
| type | string | No | Filter op type: `balance`, `profit_loss`, `all` |

### get_trial_balance

Haal de proef- en saldibalans op.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| division | number | Yes | Administratie code |
| year | number | No | Boekjaar (default: huidig jaar) |
| period | number | No | Periode 1-12 (default: alle) |

---

## Reporting Tools (Fiscale Periode Filtering)

> **Nieuw:** Bij alle reporting tools is de `division` parameter nu **optioneel**. Als je geen division opgeeft, worden alle administraties bevraagd en krijg je gecombineerde resultaten met totalen.

### get_profit_loss

Haal de Winst & Verliesrekening (P&L / resultatenrekening) op.

**Use cases:** Omzet, kosten, brutowinst, nettowinst, resultaatanalyse per periode.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| division | number | No | Administratie code. Optioneel - zonder haalt van alle administraties |
| year | number | No | Boekjaar (default: huidig jaar) |
| period_from | number | No | Start periode 1-12 (default: 1) |
| period_to | number | No | Eind periode 1-12 (default: 12) |

**Response:**
```json
{
  "revenue": {
    "items": [...],
    "total": 150000.00
  },
  "costs": {
    "items": [...],
    "total": 95000.00
  },
  "summary": {
    "total_revenue": 150000.00,
    "total_costs": 95000.00,
    "gross_profit": 55000.00
  },
  "period": {
    "year": 2024,
    "from": 1,
    "to": 6,
    "description": "Periode 1-6 van 2024"
  }
}
```

### get_revenue

Haal omzetgegevens op per jaar of per periode.

**Use cases:** Omzetanalyse, omzetontwikkeling, jaar-op-jaar vergelijking, maandomzet.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| division | number | No | Administratie code. Optioneel - zonder haalt van alle administraties |
| year | number | No | Boekjaar (default: huidig jaar) |
| compare_previous_year | boolean | No | Vergelijk met vorig jaar (default: false) |

**Response includes:**
- Omzet per grootboekrekening
- Per-maand uitsplitsing (period_1 t/m period_12)
- Year-over-year vergelijking (indien aangevraagd)

### get_aging_analysis

Haal ouderdomsanalyse (aging) op voor debiteuren of crediteuren.

**Use cases:** Debiteurenbeheer, kredietrisico, incasso prioritering, betalingsgedrag.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| division | number | No | Administratie code. Optioneel - zonder haalt van alle administraties |
| type | string | No | `receivables` of `payables` (default: receivables) |
| group_by_account | boolean | No | Groepeer per klant/leverancier (default: false) |

**Response:**
```json
{
  "type": "receivables",
  "age_groups": {
    "0-30 dagen": 12500.00,
    "30-60 dagen": 4200.00,
    "60-90 dagen": 1800.00,
    "90+ dagen": 950.00
  },
  "total": 19450.00
}
```

### get_transactions

Haal boekingsregels/journaalposten (transaction lines) op.

**Use cases:** Mutaties bekijken, journaalposten, boekingen per periode, grootboekanalyse.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| division | number | No | Administratie code. Optioneel - zonder haalt van alle administraties |
| year | number | No | Boekjaar (default: huidig jaar) |
| period | number | No | Specifieke periode 1-12 |
| gl_account | string | No | Filter op grootboekrekening ID (GUID) |
| journal | string | No | Filter op dagboek code |
| from_date | string | No | Begindatum (YYYY-MM-DD) |
| to_date | string | No | Einddatum (YYYY-MM-DD) |
| limit | number | No | Max resultaten per administratie (default: 100) |

### get_vat_summary

Haal BTW-overzicht op per periode.

**Use cases:** BTW-aangifte voorbereiding, BTW-controle, te betalen/vorderen BTW.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| division | number | No | Administratie code. Optioneel - zonder haalt van alle administraties |
| year | number | No | Boekjaar (default: huidig jaar) |
| period | number | No | Specifieke periode 1-12 |
| quarter | number | No | Kwartaal 1-4 (alternatief voor period) |

**Response:**
```json
{
  "vat_lines": [
    {
      "code": "1A",
      "description": "Leveringen/diensten belast met hoog tarief",
      "base": 100000.00,
      "vat": 21000.00,
      "percentage": 21
    }
  ],
  "totals": {
    "total_base": 100000.00,
    "total_vat": 21000.00
  },
  "period": {
    "year": 2024,
    "quarter": 3,
    "description": "Q3 2024"
  }
}
```

### get_budget_comparison

Vergelijk begroting (budget) met werkelijke cijfers.

**Use cases:** Budget controle, afwijkingsanalyse, financiele planning review.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| division | number | No | Administratie code. Optioneel - zonder haalt van alle administraties |
| year | number | No | Boekjaar (default: huidig jaar) |
| period_from | number | No | Start periode (default: 1) |
| period_to | number | No | Eind periode (default: huidige maand) |

**Response:**
```json
{
  "comparison": [
    {
      "account_code": "8000",
      "account_name": "Omzet",
      "budget": 50000.00,
      "actual": 52500.00,
      "variance": 2500.00,
      "variance_percent": "5.0%"
    }
  ],
  "totals": {
    "budget": 50000.00,
    "actual": 52500.00,
    "variance": 2500.00,
    "variance_percent": "5.0%"
  }
}
```

---

## Error Responses

All tools return errors in this format:

```json
{
  "error": "Error message in Dutch",
  "code": "ERROR_CODE"
}
```

| Code | Description |
|------|-------------|
| `NO_CONNECTION` | Geen Exact Online connectie gevonden |
| `TOKEN_EXPIRED` | Token verlopen, opnieuw verbinden |
| `DIVISION_NOT_FOUND` | Administratie niet gevonden |
| `RATE_LIMITED` | Te veel verzoeken, probeer later |
| `API_ERROR` | Fout van Exact Online API |

---

---

## Design Principle: Filter & Select

> **Kernprincipe:** Des te beter de MCP filters kan toepassen en de juiste kolommen selecteert, des te sneller en betrouwbaarder het systeem werkt.

Alle tools zijn geoptimaliseerd volgens dit principe:

| Aspect | Implementatie |
|--------|---------------|
| **$filter** | API-level filtering, niet achteraf in code |
| **$select** | Alleen benodigde kolommen ophalen |
| **Defaults** | Verstandige defaults (limit=100, active_only=true) |
| **Descriptions** | Duidelijke tool descriptions voor Claude |

Zie: `docs/knowledge/mcp/MCP-DESIGN-PRINCIPLES.md` voor uitgebreide uitleg.

---

## Usage Tips for Claude

When asking questions, Claude will automatically select the right tool:

| User Question | Tool Used |
|--------------|-----------|
| "Welke administraties heb ik?" | list_divisions |
| "Toon alle klanten" | get_relations |
| "Zoek leverancier met naam X" | search_relations |
| "Openstaande facturen?" | get_outstanding_invoices |
| "Omzet van dit kwartaal?" | get_profit_loss |
| "Vergelijk met vorig jaar" | get_revenue (compare) |
| "Debiteuren ouder dan 60 dagen?" | get_aging_analysis |
| "BTW aangifte Q3?" | get_vat_summary |
| "Hoe doen we het vs budget?" | get_budget_comparison |
