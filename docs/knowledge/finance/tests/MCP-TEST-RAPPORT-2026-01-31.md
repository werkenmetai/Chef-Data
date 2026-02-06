# QA Finance Test Rapport

**Datum:** 2026-01-31 (Final Update)
**Tester:** QA Finance Agent + Claude Opus 4.5
**Administratie:** Beurs van Berlage C.V. (3061007)
**OAuth Status:** ✅ Werkend

---

## Test Resultaten Samenvatting

| Categorie | Totaal | PASS | FAIL | Module N/A |
|-----------|--------|------|------|------------|
| Administratie | 1 | 1 | 0 | 0 |
| Relaties | 2 | 2 | 0 | 0 |
| Facturen | 3 | 3 | 0 | 0 |
| Financieel | 4 | 4 | 0 | 0 |
| Rapportage | 8 | 8 | 0 | 0 |
| Journaal | 2 | 2 | 0 | 0 |
| Orders & Offertes | 3 | 0 | 0 | 3 |
| Artikelen & Voorraad | 2 | 2 | 0 | 0 |
| Projecten | 4 | 0 | 0 | 4 |
| CRM & Sales | 2 | 2 | 0 | 0 |
| Contracten | 3 | 0 | 0 | 3 |
| Vaste Activa | 2 | 2 | 0 | 0 |
| Kostenplaatsen | 2 | 2 | 0 | 0 |
| Prijzen & Marges | 3 | 3 | 0 | 0 |
| Valuta | 2 | 2 | 0 | 0 |
| Documenten | 1 | 1 | 0 | 0 |
| Dashboard | 2 | 2 | 0 | 0 |
| **TOTAAL** | **46** | **36** | **0** | **10** |

**Coverage:** 78% PASS, 0% FAIL, 22% Module niet actief

---

## Gedetailleerde Test Resultaten

### 1. Administratie (1/1 PASS)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `list_divisions` | ✅ PASS | 5 administraties gevonden |

### 2. Relaties (2/2 PASS)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `get_relations` | ✅ PASS | Klanten/leveranciers lijst |
| `search_relations` | ✅ PASS | CreditLine veld verwijderd |

### 3. Facturen (3/3 PASS)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `get_sales_invoices` | ✅ PASS | Status veld filter |
| `get_purchase_invoices` | ✅ PASS | Inkoopfacturen |
| `get_outstanding_invoices` | ✅ PASS | €635K receivables |

### 4. Financieel (4/4 PASS)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `get_bank_transactions` | ✅ PASS | Minimale $select |
| `get_gl_accounts` | ✅ PASS | Grootboekrekeningen |
| `get_trial_balance` | ✅ PASS | **FIXED 31-01:** BalanceType + endpoint path fix, 60 rekeningen |
| `get_cashflow_forecast` | ✅ PASS | Liquiditeitsprognose |

### 5. Rapportage & Analyse (8/8 PASS)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `get_profit_loss` | ✅ PASS | **FIXED 31-01:** BalanceType + endpoint path, €19K revenue |
| `get_revenue` | ✅ PASS | RevenueListByYear endpoint |
| `get_aging_analysis` | ✅ PASS | Ouderdomsanalyse |
| `get_aging_receivables` | ✅ PASS | ReceivablesList endpoint |
| `get_aging_payables` | ✅ PASS | PayablesList endpoint |
| `get_transactions` | ✅ PASS | Minimale $select |
| `get_vat_summary` | ✅ PASS | **FIXED 31-01:** AmountVATFC i.p.v. VATAmountDC |
| `get_budget_comparison` | ✅ PASS | Budget vs werkelijk |

### 6. Journaalposten (2/2 PASS)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `get_journal_entries` | ✅ PASS | **FIXED 31-01:** Created filter i.p.v. Date |
| `search_transactions` | ✅ PASS | Transacties zoeken |

### 7. Orders & Offertes (0/3 - Module N/A)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `get_sales_orders` | ⚠️ MODULE | Module niet actief |
| `get_purchase_orders` | ⚠️ MODULE | Module niet actief |
| `get_quotations` | ⚠️ MODULE | Module niet actief |

### 8. Artikelen & Voorraad (2/2 PASS)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `get_items` | ✅ PASS | **FIXED 31-01:** StandardSalesPrice i.p.v. SalesPrice |
| `get_stock_positions` | ✅ PASS | Voorraadposities (0 items, geen voorraad admin) |

### 9. Projecten (0/4 - Module N/A)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `get_projects` | ⚠️ MODULE | Module niet actief |
| `get_time_transactions` | ⚠️ MODULE | Module niet actief |
| `get_project_invoices` | ⚠️ MODULE | Module niet actief |
| `get_wip_overview` | ⚠️ MODULE | Module niet actief |

### 10. CRM & Sales (2/2 PASS)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `get_opportunities` | ✅ PASS | **FIXED 31-01:** OpportunityStatus i.p.v. Status (0 opportunities) |
| `get_sales_funnel` | ✅ PASS | **FIXED 31-01:** OpportunityStage fields (0 data) |

### 11. Contracten (0/3 - Module N/A)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `get_sales_contracts` | ⚠️ MODULE | Module niet actief |
| `get_purchase_contracts` | ⚠️ MODULE | Module niet actief |
| `get_recurring_revenue` | ⚠️ MODULE | Module niet actief |

### 12. Vaste Activa (2/2 PASS)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `get_fixed_assets` | ✅ PASS | **FIXED 31-01:** InvestmentAmountDC, 5 assets, €54K |
| `get_depreciation_schedule` | ✅ PASS | Afschrijvingsschema |

### 13. Kostenplaatsen (2/2 PASS)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `get_cost_centers` | ✅ PASS | 30 kostenplaatsen |
| `get_cost_center_report` | ✅ PASS | Kostenplaats rapport |

### 14. Prijzen & Marges (3/3 PASS)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `get_sales_prices` | ✅ PASS | **FIXED 31-01:** NumberOfItemsPerUnit typo, 5 prijzen |
| `get_purchase_prices` | ✅ PASS | **FIXED 31-01:** CostPriceStandard i.p.v. PurchasePrice |
| `get_margin_analysis` | ✅ PASS | **FIXED 31-01:** StandardSalesPrice |

### 15. Valuta (2/2 PASS)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `get_currencies` | ✅ PASS | **FIXED 31-01:** Minimale velden |
| `get_currency_rates` | ✅ PASS | Wisselkoersen |

### 16. Documenten (1/1 PASS)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `get_document_attachments` | ✅ PASS | **FIXED 31-01:** FileName/FileSize/Url, 5 PDF bijlagen |

### 17. Dashboard Tools (2/2 PASS)

| Tool | Status | Opmerkingen |
|------|--------|-------------|
| `get_financial_snapshot` | ✅ PASS | Financieel dashboard |
| `get_customer_360` | ✅ PASS | Klant 360 view |

---

## Fixes Toegepast (2026-01-31)

### Batch 1: API Field Fixes (commit b975a88)

| Tool | Fix |
|------|-----|
| `get_document_attachments` | AttachmentFileName/Size/Url → FileName/FileSize/Url |
| `get_sales_prices` | NumberOfItemPerUnit → NumberOfItemsPerUnit |
| `get_purchase_prices` | PurchasePrice/SalesPrice/Currency verwijderd |
| `get_margin_analysis` | StandardSalesPrice i.p.v. SalesPrice |
| `get_journal_entries` | Created filter i.p.v. Date |
| `get_profit_loss` | /read/ prefix (later verwijderd) |

### Batch 2: CI/CD Fix (commit 1cc6199)

| Issue | Fix |
|-------|-----|
| Deploy failed | `pnpm --filter @exact-mcp/shared build` stap toegevoegd |

### Batch 3: ReportingBalance Fixes (commits a683376, 5f74af6)

| Tool | Fix |
|------|-----|
| `get_trial_balance` | BalanceSide → BalanceType |
| `get_profit_loss` | BalanceSide → BalanceType |
| Both | /read/ prefix verwijderd |

---

## Root Cause Analyse

### Patroon 1: Ongeldige $select velden
**Symptoom:** "Ongeldige request" error
**Oorzaak:** Exact Online OData geeft generieke error bij niet-bestaande velden
**Oplossing:** Altijd API docs checken op exacte veldnamen

### Patroon 2: Verkeerde endpoint prefix
**Symptoom:** "Gegevens niet gevonden" error
**Oorzaak:** Sommige endpoints vereisen /read/ prefix, andere niet
**Oplossing:**
- `/read/financial/` voor: ReceivablesList, PayablesList, AgingReceivablesList
- `/financial/` voor: ReportingBalance, GLAccounts

### Patroon 3: Veldnaam variaties
**Voorbeelden:**
- `BalanceSide` vs `BalanceType`
- `NumberOfItemPerUnit` vs `NumberOfItemsPerUnit`
- `SalesPrice` vs `StandardSalesPrice`
- `Date` vs `Created`

---

## Test Omgeving

```
Exact Online Administratie: Beurs van Berlage C.V.
Division Code: 3061007
Region: NL
OAuth Token: Werkend
Test Datum: 2026-01-31

Beschikbare Divisies:
- 3061007: Beurs van Berlage C.V. (default)
- 3069073: Beurs van Berlage Café B.V.
- 3237471: Beurs van Berlage Exploitatie B.V.
- 3237461: Beurs van Berlage Vastgoed B.V.
- 3223810: TST Beurs van Berlage TST
```

---

## Git Commits (Bug Fixes 2026-01-31)

| Commit | Beschrijving |
|--------|--------------|
| b975a88 | fix: correct invalid API field names in multiple MCP tools |
| 1cc6199 | fix(ci): add build step to deploy-mcp-server workflow |
| a683376 | fix: use BalanceType instead of BalanceSide for ReportingBalance |
| 5f74af6 | fix: remove /read/ prefix from ReportingBalance endpoint |

---

*Rapport gegenereerd door QA Finance Agent + Claude Opus 4.5*
*Laatst bijgewerkt: 2026-01-31 16:40*
