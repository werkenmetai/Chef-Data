# Finance Test Scenarios

**Beheerder:** QA Finance Agent
**Laatste update:** 2026-01-30

Dit document bevat test scenarios voor de financiële MCP tools.

---

## Scenario 1: Openstaande facturen overzicht

### Test Case
**Vraag:** "Welke facturen staan nog open?"

### Verwachte Response
```json
{
  "receivables": [...],
  "payables": [...],
  "totals": {
    "totalReceivables": 12500.00,
    "totalPayables": 8750.00,
    "netPosition": 3750.00
  },
  "context": {
    "summary": "5 openstaande debiteuren (€12.500) en 3 openstaande crediteuren (€8.750). Netto positie: €3.750 te ontvangen.",
    "net_position_meaning": "Positieve netto positie: je hebt meer te ontvangen dan te betalen.",
    "action_items": "2 facturen zijn meer dan 30 dagen oud. Overweeg een herinnering."
  },
  "related_tools": [
    {"tool": "get_sales_invoices", "when": "Voor details over verkoopfacturen"},
    {"tool": "get_purchase_invoices", "when": "Voor details over inkoopfacturen"}
  ]
}
```

### Checklist
- [ ] `totals.netPosition` is correct berekend
- [ ] `context.summary` is menselijk leesbaar
- [ ] `related_tools` bevat relevante vervolgacties
- [ ] Bij 0 openstaand: andere suggestions tonen

---

## Scenario 2: Verkoop facturen met date filter

### Test Case
**Vraag:** "Laat de verkoopfacturen van januari 2026 zien"

### Parameters die gegenereerd moeten worden
```json
{
  "date_from": "2026-01-01",
  "date_to": "2026-01-31"
}
```

### Verwachte Response
- Array van facturen met InvoiceDate binnen range
- Totaal bedrag in context
- Aantal facturen in summary

### Edge Cases
| Input | Verwacht Gedrag |
|-------|-----------------|
| "deze maand" | Huidige maand start/eind |
| "Q1 2026" | 2026-01-01 tot 2026-03-31 |
| "afgelopen week" | 7 dagen terug tot vandaag |
| "gisteren" | Exacte datum |

---

## Scenario 3: Lege resultaten

### Test Case
**Vraag:** "Facturen van februari 2030"

### Verwachte Response
```json
{
  "invoices": [],
  "suggestions": [
    "Geen facturen gevonden in februari 2030",
    "Probeer een andere periode zoals 'afgelopen maand' of 'dit jaar'",
    "Check of je administratie facturen bevat met get_divisions"
  ]
}
```

### Checklist
- [ ] `suggestions` array is niet leeg
- [ ] Suggesties zijn actionable
- [ ] Geen technische error messages

---

## Scenario 4: Banktransacties met cashflow

### Test Case
**Vraag:** "Wat is mijn cashflow deze maand?"

### Verwachte Response
```json
{
  "transactions": [...],
  "context": {
    "summary": "42 transacties: €15.250 ontvangen, €8.430 betaald",
    "cash_flow": "Positieve kasstroom van €6.820 deze maand",
    "tip": "Grootste uitgave: €2.500 aan leverancier X"
  },
  "related_tools": [
    {"tool": "get_outstanding_invoices", "when": "Om te zien wat nog binnenkomt"}
  ]
}
```

### Checklist
- [ ] `context.cash_flow` toont netto positie
- [ ] Positief/negatief correct geformuleerd
- [ ] Tip geeft inzicht in belangrijkste transactie

---

## Scenario 5: Multi-division

### Test Case
**Vraag:** "Hoeveel staat open bij alle administraties?"

### Verwachte Gedrag
1. Check huidige division
2. Indien multi-division user: vraag welke division
3. Of: toon per-division breakdown

### Edge Case
- User met 1 division: geen selectie nodig
- User met 5+ divisions: overzicht per division

---

## Scenario 6: Ongeldige date input

### Test Cases
| Input | Verwacht |
|-------|----------|
| "32 januari 2026" | Foutmelding met correcte format hint |
| "januari 2050" | Waarschuwing over toekomstige datum |
| "" (leeg) | Default naar "alle" of recent |

### Verwachte Foutmelding
```json
{
  "error": "invalid_date",
  "message": "Ongeldige datum '32 januari 2026'. Gebruik format YYYY-MM-DD of natuurlijke taal zoals 'deze maand'.",
  "examples": ["2026-01-15", "deze maand", "Q1 2026"]
}
```

---

## Scenario 7: Grote resultset

### Test Case
**Vraag:** "Alle transacties van dit jaar" (>1000 records)

### Verwachte Gedrag
1. Return maximaal 100 records per request
2. `context.summary` vermeldt totaal aantal
3. Optie om te filteren of pagineren

### Response
```json
{
  "transactions": [...],  // max 100
  "context": {
    "summary": "1.542 transacties gevonden, 100 getoond",
    "tip": "Filter op periode of bedrag voor specifiekere resultaten"
  },
  "pagination": {
    "total": 1542,
    "returned": 100,
    "has_more": true
  }
}
```

---

## Quick Validation Checklist

Per tool call controleer:

### Structuur
- [ ] `content` array aanwezig
- [ ] `context` object met `summary`
- [ ] `related_tools` array (mag leeg zijn)
- [ ] Bij errors: `suggestions` array

### Content Kwaliteit
- [ ] Bedragen correct geformateerd (€ X.XXX,XX)
- [ ] Dates in leesbaar format
- [ ] Summary is 1-2 zinnen, niet technisch

### Smart Context
- [ ] Summary geeft actionable insight
- [ ] Tips zijn relevant voor context
- [ ] Related tools zijn logische vervolgstappen

---

## Test Data Requirements

Voor volledige coverage heb je nodig:

```
Verkoopfacturen:
- 5+ open facturen
- 10+ betaalde facturen
- Mix van recent en oud (>30 dagen)
- Verschillende klanten

Inkoopfacturen:
- 3+ open facturen
- 5+ betaalde facturen
- Verschillende leveranciers

Banktransacties:
- 50+ transacties afgelopen 90 dagen
- Mix van bij- en afschrijvingen
- Verschillende bedragen

Relaties:
- 5+ klanten met facturatie
- 3+ leveranciers met facturatie
```
