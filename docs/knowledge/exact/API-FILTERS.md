# Exact Online API - Beschikbare Filters per Endpoint

> **Doel:** Overzicht van alle filterbare velden per endpoint zodat we weten wat mogelijk is.
>
> **Bron:** Afgeleid uit werkende code en Exact Online API responses.
>
> **Laatste update:** 2026-01-29

---

## Samenvatting: Veelgebruikte Filters

| Filter Type | Veldnaam | Endpoints | Voorbeeld |
|-------------|----------|-----------|-----------|
| Klant/Leverancier | `InvoiceTo`, `OrderedBy`, `Account`, `AccountId` | SalesInvoices, SalesOrders, ReceivablesList | `InvoiceTo eq guid'xxx'` |
| Datum | `InvoiceDate`, `DueDate`, `OrderDate`, `Date` | Alle | `InvoiceDate ge datetime'2025-01-01'` |
| Status | `Status`, `Blocked` | SalesInvoices, Accounts | `Status eq 50` |
| Type | `IsCustomer`, `IsSupplier` | Accounts | `IsCustomer eq true` |
| Periode | `ReportingYear`, `ReportingPeriod`, `FinancialYear` | Reporting endpoints | `ReportingYear eq 2025` |
| Tekst zoeken | `substringof()` | Accounts, Items | `substringof('bakker', Name) eq true` |

---

## CRM / Relaties

### Endpoint: `/crm/Accounts`

**Beschikbare velden voor $filter:**

| Veld | Type | Voorbeeld Filter |
|------|------|------------------|
| `ID` | GUID | `ID eq guid'xxx'` |
| `Code` | string | `Code eq 'KLANT001'` |
| `Name` | string | `substringof('bakker', Name) eq true` |
| `IsCustomer` | boolean | `IsCustomer eq true` |
| `IsSupplier` | boolean | `IsSupplier eq true` |
| `Blocked` | boolean | `Blocked eq false` (actief) |
| `Status` | string | `Status eq 'C'` (C=Customer, S=Suspect, P=Prospect) |
| `VATNumber` | string | `VATNumber eq 'NL123456789B01'` |
| `ChamberOfCommerce` | string | `ChamberOfCommerce eq '12345678'` |
| `City` | string | `City eq 'Amsterdam'` |
| `Country` | string | `Country eq 'NL'` |

**$select velden:**
```
ID, Code, Name, Email, Phone, City, Country, VATNumber,
ChamberOfCommerce, IsCustomer, IsSupplier, Status, Blocked, CreditLine
```

---

## Facturen

### Endpoint: `/salesinvoice/SalesInvoices`

**Beschikbare velden voor $filter:**

| Veld | Type | Voorbeeld Filter | Beschrijving |
|------|------|------------------|--------------|
| `InvoiceID` | GUID | `InvoiceID eq guid'xxx'` | Factuur ID |
| `InvoiceTo` | GUID | `InvoiceTo eq guid'xxx'` | **Klant ID** |
| `InvoiceToName` | string | `substringof('bakker', InvoiceToName) eq true` | Klantnaam |
| `InvoiceNumber` | int | `InvoiceNumber eq 2025001` | Factuurnummer |
| `InvoiceDate` | datetime | `InvoiceDate ge datetime'2025-01-01'` | Factuurdatum |
| `DueDate` | datetime | `DueDate lt datetime'2025-01-29'` | Vervaldatum |
| `Status` | int | `Status eq 50` | 20=Concept, 40=Open, 50=Betaald |
| `OutstandingAmountDC` | decimal | `OutstandingAmountDC ne 0` | Openstaand bedrag |
| `Currency` | string | `Currency eq 'EUR'` | Valuta |

**$select velden:**
```
InvoiceID, InvoiceNumber, InvoiceTo, InvoiceToName, InvoiceDate, DueDate,
Currency, AmountDC, VATAmountDC, OutstandingAmountDC, Status, Description,
PaymentConditionDescription
```

**Veelgebruikte combinaties:**
```
# Alle facturen van een specifieke klant
$filter=InvoiceTo eq guid'KLANT-GUID-HIER'

# Openstaande facturen van een klant
$filter=InvoiceTo eq guid'xxx' and OutstandingAmountDC ne 0

# Facturen van dit jaar
$filter=InvoiceDate ge datetime'2025-01-01'

# Vervallen facturen
$filter=DueDate lt datetime'2025-01-29' and OutstandingAmountDC ne 0
```

### Endpoint: `/purchaseentry/PurchaseEntries`

**Beschikbare velden voor $filter:**

| Veld | Type | Voorbeeld Filter |
|------|------|------------------|
| `EntryID` | GUID | `EntryID eq guid'xxx'` |
| `Supplier` | GUID | `Supplier eq guid'xxx'` | **Leverancier ID** |
| `SupplierName` | string | `substringof('xxx', SupplierName) eq true` |
| `EntryDate` | datetime | `EntryDate ge datetime'2025-01-01'` |
| `DueDate` | datetime | `DueDate lt datetime'2025-01-29'` |
| `AmountDC` | decimal | `AmountDC ne 0` |

---

## Financieel

### Endpoint: `/read/financial/ReceivablesList` (Debiteuren)

**Beschikbare velden voor $filter:**

| Veld | Type | Voorbeeld Filter |
|------|------|------------------|
| `AccountId` | GUID | `AccountId eq guid'xxx'` | **Klant ID** |
| `DueDate` | datetime | `DueDate lt datetime'2025-01-29'` | Vervaldatum |
| `Amount` | decimal | `Amount gt 1000` | Bedrag |
| `InvoiceDate` | datetime | `InvoiceDate ge datetime'2025-01-01'` | Factuurdatum |

**$select velden:**
```
AccountId, AccountCode, AccountName, Amount, CurrencyCode, Description,
DueDate, EntryNumber, InvoiceDate, InvoiceNumber, YourRef
```

**LET OP:** `DaysOutstanding` is NIET beschikbaar - we berekenen dit client-side!

### Endpoint: `/read/financial/PayablesList` (Crediteuren)

Zelfde velden als ReceivablesList, maar dan voor crediteuren.

### Endpoint: `/read/financial/ReportingBalance` (Saldibalans)

**Beschikbare velden voor $filter:**

| Veld | Type | Voorbeeld Filter |
|------|------|------------------|
| `ReportingYear` | int | `ReportingYear eq 2025` |
| `ReportingPeriod` | int | `ReportingPeriod eq 3` (maart) |
| `GLAccount` | GUID | `GLAccount eq guid'xxx'` |
| `GLAccountCode` | string | `GLAccountCode eq '8000'` |

---

## Orders

### Endpoint: `/salesorder/SalesOrders`

**Beschikbare velden voor $filter:**

| Veld | Type | Voorbeeld Filter |
|------|------|------------------|
| `OrderID` | GUID | `OrderID eq guid'xxx'` |
| `OrderedBy` | GUID | `OrderedBy eq guid'xxx'` | **Klant ID** |
| `OrderedByName` | string | `substringof('xxx', OrderedByName) eq true` |
| `OrderNumber` | int | `OrderNumber eq 2025001` |
| `OrderDate` | datetime | `OrderDate ge datetime'2025-01-01'` |
| `Status` | int | `Status eq 20` |
| `DeliveryDate` | datetime | `DeliveryDate ge datetime'2025-02-01'` |

### Endpoint: `/purchaseorder/PurchaseOrders`

| Veld | Type | Voorbeeld Filter |
|------|------|------------------|
| `Supplier` | GUID | `Supplier eq guid'xxx'` | **Leverancier ID** |
| `OrderDate` | datetime | `OrderDate ge datetime'2025-01-01'` |
| `ReceiptStatus` | int | Bestelstatus |

---

## Projecten

### Endpoint: `/project/Projects`

**Beschikbare velden voor $filter:**

| Veld | Type | Voorbeeld Filter |
|------|------|------------------|
| `ID` | GUID | `ID eq guid'xxx'` |
| `Code` | string | `Code eq 'PRJ001'` |
| `Account` | GUID | `Account eq guid'xxx'` | **Klant ID** |
| `AccountName` | string | `substringof('xxx', AccountName) eq true` |
| `Type` | int | `Type eq 2` |
| `Status` | int | `Status eq 1` (Actief) |
| `StartDate` | datetime | `StartDate ge datetime'2025-01-01'` |
| `EndDate` | datetime | `EndDate le datetime'2025-12-31'` |
| `Manager` | GUID | `Manager eq guid'xxx'` |

---

## Contracten / Abonnementen

### Endpoint: `/subscription/Subscriptions`

**Beschikbare velden voor $filter:**

| Veld | Type | Voorbeeld Filter |
|------|------|------------------|
| `ID` | GUID | `ID eq guid'xxx'` |
| `OrderedBy` | GUID | `OrderedBy eq guid'xxx'` | **Klant ID** |
| `OrderedByName` | string | `substringof('xxx', OrderedByName) eq true` |
| `StartDate` | datetime | `StartDate le datetime'2025-01-29'` |
| `EndDate` | datetime | `EndDate ge datetime'2025-01-29'` or `EndDate eq null` |

**Actieve contracten:**
```
$filter=StartDate le datetime'2025-01-29' and (EndDate ge datetime'2025-01-29' or EndDate eq null)
```

---

## Items / Artikelen

### Endpoint: `/logistics/Items`

**Beschikbare velden voor $filter:**

| Veld | Type | Voorbeeld Filter |
|------|------|------------------|
| `ID` | GUID | `ID eq guid'xxx'` |
| `Code` | string | `Code eq 'ART001'` |
| `Description` | string | `substringof('laptop', Description) eq true` |
| `Type` | int | Artikeltype |
| `IsSalesItem` | boolean | `IsSalesItem eq true` |
| `IsPurchaseItem` | boolean | `IsPurchaseItem eq true` |
| `IsStockItem` | boolean | `IsStockItem eq true` |
| `ItemGroup` | GUID | `ItemGroup eq guid'xxx'` |

---

## OData Filter Syntax

### Vergelijkingsoperatoren

| Operator | Betekenis | Voorbeeld |
|----------|-----------|-----------|
| `eq` | Gelijk aan | `Status eq 50` |
| `ne` | Niet gelijk aan | `Amount ne 0` |
| `gt` | Groter dan | `Amount gt 1000` |
| `ge` | Groter of gelijk | `Date ge datetime'2025-01-01'` |
| `lt` | Kleiner dan | `Date lt datetime'2025-01-29'` |
| `le` | Kleiner of gelijk | `Period le 6` |

### Logische operatoren

| Operator | Voorbeeld |
|----------|-----------|
| `and` | `IsCustomer eq true and Blocked eq false` |
| `or` | `Status eq 20 or Status eq 40` |
| `not` | `not Blocked` |

### String functies

| Functie | Voorbeeld |
|---------|-----------|
| `substringof` | `substringof('bakker', Name) eq true` |
| `startswith` | `startswith(Code, 'KL') eq true` |
| `endswith` | `endswith(Email, '@example.com') eq true` |

### GUID syntax

```
$filter=InvoiceTo eq guid'12345678-1234-1234-1234-123456789012'
```

### DateTime syntax

```
$filter=InvoiceDate ge datetime'2025-01-01'
$filter=DueDate lt datetime'2025-01-29T00:00:00'
```

---

## MCP Tool Parameters → OData Filters

Onderstaande tabel toont **alle beschikbare parameters** per MCP tool en welke OData filters ze gebruiken.

### Relaties

| Tool | Parameter | Type | OData Filter | Beschrijving |
|------|-----------|------|--------------|--------------|
| `get_relations` | `division` | number | - | Administratie code |
| | `type` | enum | `IsCustomer eq true` / `IsSupplier eq true` | customer, supplier, both |
| | `active_only` | boolean | `Blocked eq false` | Alleen actieve relaties |
| | `limit` | number | `$top=N` | Max resultaten (1-1000) |
| `search_relations` | `division` | number | - | Administratie code |
| | `query` | string | `substringof('...', Name)` | Zoekterm (min 2 chars) |
| | `search_fields` | array | Meerdere substringof | name, code, kvk, vat |

### Facturen

| Tool | Parameter | Type | OData Filter | Beschrijving |
|------|-----------|------|--------------|--------------|
| `get_sales_invoices` | `division` | number | - | Administratie code |
| | `status` | enum | `OutstandingAmountDC gt/eq 0` | open, paid, all |
| | `customer_id` | string | `InvoiceTo eq guid'...'` | Filter op klant |
| | `from_date` | string | `InvoiceDate ge datetime'...'` | Begindatum |
| | `to_date` | string | `InvoiceDate le datetime'...'` | Einddatum |
| | `limit` | number | `$top=N` | Max resultaten (1-500) |
| `get_purchase_invoices` | `division` | number | - | Administratie code |
| | `status` | enum | - | open, paid, all |
| | `supplier_id` | string | `Supplier eq guid'...'` | Filter op leverancier |
| | `from_date` | string | `EntryDate ge datetime'...'` | Begindatum |
| | `to_date` | string | `EntryDate le datetime'...'` | Einddatum |
| | `limit` | number | `$top=N` | Max resultaten (1-500) |
| `get_outstanding_invoices` | `division` | number | - | Administratie code |
| | `type` | enum | - | receivable, payable, both |
| | `customer_id` | string | `AccountId eq guid'...'` | Filter debiteuren op klant |
| | `supplier_id` | string | `AccountId eq guid'...'` | Filter crediteuren op leverancier |
| | `overdue_only` | boolean | `DueDate lt datetime'...'` | Alleen vervallen facturen |
| | `min_days_overdue` | number | `DueDate lt datetime'...'` | Min dagen over vervaldatum |

### Orders

| Tool | Parameter | Type | OData Filter | Beschrijving |
|------|-----------|------|--------------|--------------|
| `get_sales_orders` | `division` | number | - | Administratie code |
| | `status` | enum | `Status eq 12/20/21/45` | open, partial, complete, canceled |
| | `customer_id` | string | `OrderedBy eq guid'...'` | Filter op klant |
| | `from_date` | string | `OrderDate ge datetime'...'` | Begindatum |
| | `to_date` | string | `OrderDate le datetime'...'` | Einddatum |
| | `limit` | number | `$top=N` | Max resultaten (1-500) |
| `get_purchase_orders` | `division` | number | - | Administratie code |
| | `status` | enum | `ReceiptStatus eq ...` | Status filter |
| | `supplier_id` | string | `Supplier eq guid'...'` | Filter op leverancier |
| | `from_date` | string | `OrderDate ge datetime'...'` | Begindatum |
| | `to_date` | string | `OrderDate le datetime'...'` | Einddatum |
| | `limit` | number | `$top=N` | Max resultaten (1-500) |

### Reporting (Periode filters)

| Tool | Parameter | Type | OData Filter | Beschrijving |
|------|-----------|------|--------------|--------------|
| `get_profit_loss` | `division` | number | - | Administratie (optioneel) |
| | `year` | number | `ReportingYear eq N` | Boekjaar |
| | `period_from` | number | `ReportingPeriod ge N` | Startmaand (1-12) |
| | `period_to` | number | `ReportingPeriod le N` | Eindmaand (1-12) |
| `get_revenue` | `division` | number | - | Administratie (optioneel) |
| | `year` | number | `ReportingYear eq N` | Boekjaar |
| | `compare_previous_year` | boolean | - | Vergelijk met vorig jaar |
| `get_trial_balance` | `division` | number | - | Administratie (optioneel) |
| | `year` | number | `ReportingYear eq N` | Boekjaar |
| | `period` | number | `ReportingPeriod eq N` | Specifieke maand |
| `get_vat_summary` | `division` | number | - | Administratie (optioneel) |
| | `year` | number | `ReportingYear eq N` | Boekjaar |
| | `period` | number | `ReportingPeriod eq N` | Maand (1-12) |
| | `quarter` | number | - | Kwartaal (1-4) |
| `get_budget_comparison` | `division` | number | - | Administratie (optioneel) |
| | `year` | number | `ReportingYear eq N` | Boekjaar |
| | `period_from` | number | `ReportingPeriod ge N` | Startmaand |
| | `period_to` | number | `ReportingPeriod le N` | Eindmaand |

### Aging / Ouderdomsanalyse

| Tool | Parameter | Type | OData Filter | Beschrijving |
|------|-----------|------|--------------|--------------|
| `get_aging_analysis` | `division` | number | - | Administratie (optioneel) |
| | `type` | enum | - | receivables, payables |
| | `group_by_account` | boolean | - | Groepeer per klant/lev |
| `get_aging_receivables` | `division` | number | - | Administratie (optioneel) |
| `get_aging_payables` | `division` | number | - | Administratie (optioneel) |

### Financieel

| Tool | Parameter | Type | OData Filter | Beschrijving |
|------|-----------|------|--------------|--------------|
| `get_bank_transactions` | `division` | number | - | Administratie code |
| | `from_date` | string | `Date ge datetime'...'` | Begindatum |
| | `to_date` | string | `Date le datetime'...'` | Einddatum |
| | `bank_account` | string | `BankAccount eq guid'...'` | Specifieke bankrekening |
| | `limit` | number | `$top=N` | Max resultaten |
| `get_gl_accounts` | `division` | number | - | Administratie code |
| | `type` | enum | - | balance, profit_loss, all |
| `get_transactions` | `division` | number | - | Administratie (optioneel) |
| | `year` | number | `FinancialYear eq N` | Boekjaar |
| | `period` | number | `FinancialPeriod eq N` | Specifieke periode |
| | `gl_account` | string | `GLAccount eq guid'...'` | Grootboekrekening |
| | `journal` | string | `JournalCode eq '...'` | Dagboekcode |
| | `from_date` | string | `Date ge datetime'...'` | Begindatum |
| | `to_date` | string | `Date le datetime'...'` | Einddatum |
| | `limit` | number | `$top=N` | Max resultaten |
| `get_cashflow_forecast` | `division` | number | - | Administratie (optioneel) |
| | `weeks` | number | - | Voorspelling horizon |

### Contracten

| Tool | Parameter | Type | OData Filter | Beschrijving |
|------|-----------|------|--------------|--------------|
| `get_sales_contracts` | `division` | number | - | Administratie code |
| | `customer_id` | string | `OrderedBy eq guid'...'` | Filter op klant |
| | `status` | enum | Datum filters | active, expiring, all |
| | `limit` | number | `$top=N` | Max resultaten |
| `get_purchase_contracts` | `division` | number | - | Administratie code |
| | `supplier_id` | string | `OrderedBy eq guid'...'` | Filter op leverancier |
| | `status` | enum | Datum filters | active, expiring, all |
| | `limit` | number | `$top=N` | Max resultaten |

### Projecten

| Tool | Parameter | Type | OData Filter | Beschrijving |
|------|-----------|------|--------------|--------------|
| `get_projects` | `division` | number | - | Administratie code |
| | `customer_id` | string | `Account eq guid'...'` | Filter op klant |
| | `status` | enum | `Type eq N` | active, completed, all |
| | `limit` | number | `$top=N` | Max resultaten |
| `get_time_transactions` | `division` | number | - | Administratie code |
| | `project_id` | string | `Project eq guid'...'` | Filter op project |
| | `from_date` | string | `Date ge datetime'...'` | Begindatum |
| | `to_date` | string | `Date le datetime'...'` | Einddatum |

### Items / Voorraad

| Tool | Parameter | Type | OData Filter | Beschrijving |
|------|-----------|------|--------------|--------------|
| `get_items` | `division` | number | - | Administratie code |
| | `type` | enum | `IsSalesItem/IsPurchaseItem/IsStockItem` | sales, purchase, stock, all |
| | `search` | string | `substringof('...', Description)` | Zoek in omschrijving |
| | `limit` | number | `$top=N` | Max resultaten |
| `get_stock_positions` | `division` | number | - | Administratie code |
| | `item_id` | string | `Item eq guid'...'` | Specifiek artikel |
| | `warehouse_id` | string | `Warehouse eq guid'...'` | Specifiek magazijn |

---

## Referenties

- Exact Online API Console: https://start.exactonline.nl/docs/HlpRestAPIResources.aspx
- OData Query Options: https://www.odata.org/documentation/odata-version-2-0/uri-conventions/

---

**Laatst bijgewerkt:** 2026-01-29
**Beheerder:** Kees (CTO)
