# ChatGPT App Directory Submission

> **Status:** Klaar voor submission
> **Datum:** 2 februari 2026
> **Versie:** 1.0

Dit document bevat alle informatie en materialen voor het indienen van "Praat met je Boekhouding" in de ChatGPT App Directory.

---

## Submission Checklist

### Pre-submission Vereisten

- [ ] **OpenAI Platform Account Geverifieerd**
  - URL: https://platform.openai.com/settings/organization/general
  - Klik "Verify Organization"
  - Upload ID document (paspoort/rijbewijs)
  - Wacht op goedkeuring (meestal < 24 uur)

- [ ] **Owner Role Gecontroleerd**
  - URL: https://platform.openai.com/settings/organization/members
  - Controleer dat je "Owner" role hebt

- [ ] **MCP Server Online**
  - URL: https://api.praatmetjeboekhouding.nl/mcp
  - Test: `curl https://api.praatmetjeboekhouding.nl/mcp/exa_demo`

- [ ] **Demo Mode Werkend**
  - URL: https://api.praatmetjeboekhouding.nl/mcp/exa_demo
  - Geen login vereist

- [ ] **Privacy Policy Live**
  - URL: https://praatmetjeboekhouding.nl/privacy

- [ ] **Screenshots Gemaakt**
  - Formaat: 1280x720 PNG
  - Minimaal 3 screenshots

---

## App Metadata

### Basis Informatie

| Veld | Waarde |
|------|--------|
| **App Name** | Praat met je Boekhouding |
| **Short Description** | Vraag je Exact Online boekhouding in natuurlijke taal. Zie facturen, omzet, cashflow en meer. |
| **Category** | Business / Productivity |
| **Pricing** | Freemium (Free tier: 200 calls/maand) |
| **Website** | https://praatmetjeboekhouding.nl |
| **Support Email** | support@praatmetjeboekhouding.nl |

### Lange Beschrijving (voor App Directory)

```
Praat met je Boekhouding verbindt ChatGPT met je Exact Online administratie.
Stel vragen in natuurlijke taal en krijg direct antwoord uit je boekhouding.

MOGELIJKHEDEN:
• Openstaande facturen bekijken en analyseren
• Omzet en winst/verlies rapportages opvragen
• Cashflow voorspellingen genereren
• Debiteurenanalyse en ouderdomsoverzichten
• Klant- en leveranciersgegevens zoeken
• BTW-overzichten en financiële snapshots

VOOR WIE:
• ZZP'ers en freelancers met Exact Online
• MKB ondernemers die snel inzicht willen
• Accountants die klantdata willen analyseren
• Financieel managers die rapportages nodig hebben

PRIVACY & VEILIGHEID:
• Read-only: wij kunnen NIETS wijzigen in je boekhouding
• Jouw data wordt niet opgeslagen of gedeeld
• OAuth 2.1 authenticatie via Exact Online
• GDPR/AVG compliant

GRATIS STARTEN:
• 200 API calls per maand gratis
• Geen creditcard nodig
• Direct aan de slag na koppeling
```

### URLs

| URL Type | URL |
|----------|-----|
| **MCP Server** | `https://api.praatmetjeboekhouding.nl/mcp` |
| **Demo URL** | `https://api.praatmetjeboekhouding.nl/mcp/exa_demo` |
| **Privacy Policy** | `https://praatmetjeboekhouding.nl/privacy` |
| **Terms of Service** | `https://praatmetjeboekhouding.nl/voorwaarden` |
| **Documentation** | `https://praatmetjeboekhouding.nl/docs` |
| **Setup Guide** | `https://praatmetjeboekhouding.nl/setup` |

---

## Test Account Details

### Demo Credentials

```yaml
Demo URL: https://api.praatmetjeboekhouding.nl/mcp/exa_demo
Authentication: None required (API key embedded in URL)
MFA Required: No
Account Creation: Not needed
Login Steps: None - ready to use immediately

Demo Company: Bakkerij De Gouden Croissant B.V.
Location: Amsterdam, Netherlands
Industry: Bakery (food production)
Data: Realistic Dutch business data with invoices, customers, suppliers
```

### Alternatieve Demo Accounts

| Demo Key | Company | Industry |
|----------|---------|----------|
| `exa_demo` of `exa_demo_bakkerij` | Bakkerij De Gouden Croissant B.V. | Bakery |
| `exa_demo_it` | TechVision Consultancy B.V. | IT Consulting |
| `exa_demo_advocaat` | Van der Berg & Partners | Legal Services |
| `exa_demo_aannemer` | Bouwbedrijf De Fundatie B.V. | Construction |

### Demo Data Overzicht (Bakkerij)

| Data Type | Count | Examples |
|-----------|-------|----------|
| Customers | 6 | Hotel Krasnapolsky, Restaurant De Vier Pilaren, Albert Heijn |
| Suppliers | 4 | Meelgroothandel Van der Molen, Zuivelfabriek De Koe |
| Sales Invoices | ~35 | Mix van betaald, open, en vervallen |
| Purchase Invoices | ~15 | Mix van betaald en open |
| Bank Transactions | ~150 | 6 maanden historische data |
| Outstanding Receivables | ~€12,500 | Realistic MKB level |
| Outstanding Payables | ~€4,200 | Realistic MKB level |

---

## Test Cases

### Test Case 1: List Divisions

| Field | Value |
|-------|-------|
| **User Input** | "Welke administraties heb ik in Exact Online?" |
| **Expected Tool** | `list_divisions` |
| **Expected Output** | 1 division: "Bakkerij De Gouden Croissant B.V." with division code 999999 |
| **Verification** | Response contains company name and division details |

### Test Case 2: Outstanding Invoices

| Field | Value |
|-------|-------|
| **User Input** | "Welke facturen staan nog open?" |
| **Expected Tool** | `get_outstanding_invoices` |
| **Expected Output** | List of 5-10 outstanding invoices with customer names, amounts, due dates |
| **Verification** | Invoices show InvoiceNumber, CustomerName, AmountDC, DueDate |

### Test Case 3: Revenue Query

| Field | Value |
|-------|-------|
| **User Input** | "Wat is mijn omzet deze maand?" |
| **Expected Tool** | `get_revenue` |
| **Expected Output** | Revenue breakdown with total amount and date range |
| **Verification** | Response includes total_revenue, period, and breakdown |

### Test Case 4: Cashflow Forecast

| Field | Value |
|-------|-------|
| **User Input** | "Geef me een cashflow voorspelling" |
| **Expected Tool** | `get_cashflow_forecast` |
| **Expected Output** | Cashflow forecast table with receivables, payables, net position |
| **Verification** | Response shows projected cash inflows and outflows |

### Test Case 5: Search Relations

| Field | Value |
|-------|-------|
| **User Input** | "Zoek klant Krasnapolsky" |
| **Expected Tool** | `search_relations` |
| **Expected Output** | Hotel Krasnapolsky details: name, email, phone, city, credit limit |
| **Verification** | Response contains full customer profile |

### Test Case 6: Profit & Loss

| Field | Value |
|-------|-------|
| **User Input** | "Toon de winst en verliesrekening" |
| **Expected Tool** | `get_profit_loss` |
| **Expected Output** | P&L statement with revenue, costs, gross margin, net result |
| **Verification** | Response includes categorized income and expenses |

### Test Case 7: Aging Analysis

| Field | Value |
|-------|-------|
| **User Input** | "Geef een ouderdomsanalyse van openstaande facturen" |
| **Expected Tool** | `get_aging_receivables` |
| **Expected Output** | Aging buckets (current, 30 days, 60 days, 90+ days) with amounts |
| **Verification** | Response shows aging breakdown per customer |

---

## Tool Annotations

Alle 47 tools gebruiken dezelfde annotations:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false,
  "idempotentHint": true,
  "openWorldHint": true
}
```

### Annotation Justificaties

#### readOnlyHint: true

> "All tools in this MCP server only retrieve data from Exact Online. No tool can create, update, or delete any records in the connected accounting system. The server is designed as read-only to protect user data integrity."

#### destructiveHint: false

> "No tool performs any destructive operations. Data cannot be deleted, overwritten, or permanently modified through any tool. All operations are safe, reversible (by nature of being read-only), and have no lasting side effects."

#### idempotentHint: true

> "All tools return the same result when called with the same parameters. Since tools only read data, repeated calls produce identical results (assuming underlying data hasn't changed). There are no side effects from multiple invocations."

#### openWorldHint: true

> "All tools interact with the external Exact Online API to retrieve accounting data. The MCP server acts as a bridge between ChatGPT and the user's Exact Online account, making external API calls for every tool invocation."

### Per-Tool Justification Template

For submission, use this justification for each tool:

```
Tool: [tool_name]
- readOnlyHint: true - This tool only retrieves [data type] from Exact Online API, no modifications possible
- destructiveHint: false - No data deletion or modification occurs
- openWorldHint: true - Communicates with external Exact Online REST API
```

---

## Complete Tool List (47 tools)

### Financial Tools (12)

| Tool Name | Description | Category |
|-----------|-------------|----------|
| `get_bank_transactions` | Retrieve bank transactions with filters | Banking |
| `get_gl_accounts` | Get general ledger accounts | Accounting |
| `get_trial_balance` | Get trial balance report | Reporting |
| `get_cashflow_forecast` | Generate cashflow forecast | Analysis |
| `get_profit_loss` | Get profit & loss statement | Reporting |
| `get_revenue` | Get revenue breakdown | Reporting |
| `get_aging_analysis` | Analyze outstanding amounts | Analysis |
| `get_transactions` | Get financial transactions | Transactions |
| `get_vat_summary` | Get VAT/BTW summary | Tax |
| `get_budget_comparison` | Compare actuals vs budget | Reporting |
| `get_aging_receivables` | Receivables aging report | Analysis |
| `get_aging_payables` | Payables aging report | Analysis |

### Invoice Tools (5)

| Tool Name | Description | Category |
|-----------|-------------|----------|
| `get_sales_invoices` | Retrieve sales invoices | Invoicing |
| `get_purchase_invoices` | Retrieve purchase invoices | Invoicing |
| `get_outstanding_invoices` | Get unpaid invoices | Invoicing |
| `get_project_invoices` | Get project-related invoices | Projects |
| `get_wip_overview` | Work in progress overview | Projects |

### Relation Tools (2)

| Tool Name | Description | Category |
|-----------|-------------|----------|
| `get_relations` | Get customers and suppliers | CRM |
| `search_relations` | Search by name, code, KvK, VAT | CRM |

### Division Tools (1)

| Tool Name | Description | Category |
|-----------|-------------|----------|
| `list_divisions` | List available administrations | Setup |

### Order Tools (3)

| Tool Name | Description | Category |
|-----------|-------------|----------|
| `get_sales_orders` | Retrieve sales orders | Sales |
| `get_purchase_orders` | Retrieve purchase orders | Purchasing |
| `get_quotations` | Get quotations/offers | Sales |

### Item Tools (2)

| Tool Name | Description | Category |
|-----------|-------------|----------|
| `get_items` | Get products/items | Inventory |
| `get_stock_positions` | Get stock levels | Inventory |

### Project Tools (2)

| Tool Name | Description | Category |
|-----------|-------------|----------|
| `get_projects` | Get project list | Projects |
| `get_time_transactions` | Get time registrations | Projects |

### Contract Tools (3)

| Tool Name | Description | Category |
|-----------|-------------|----------|
| `get_sales_contracts` | Get sales contracts | Contracts |
| `get_purchase_contracts` | Get purchase contracts | Contracts |
| `get_recurring_revenue` | Analyze recurring revenue | Analysis |

### Asset Tools (2)

| Tool Name | Description | Category |
|-----------|-------------|----------|
| `get_fixed_assets` | Get fixed assets | Assets |
| `get_depreciation_schedule` | Get depreciation entries | Assets |

### Cost Center Tools (2)

| Tool Name | Description | Category |
|-----------|-------------|----------|
| `get_cost_centers` | Get cost centers | Accounting |
| `get_cost_center_report` | Cost center analysis | Reporting |

### Currency Tools (2)

| Tool Name | Description | Category |
|-----------|-------------|----------|
| `get_currencies` | Get available currencies | Settings |
| `get_currency_rates` | Get exchange rates | Settings |

### Document Tools (2)

| Tool Name | Description | Category |
|-----------|-------------|----------|
| `get_document_attachments` | List document attachments | Documents |
| `get_document_content` | Download document content | Documents |

### Journal Tools (2)

| Tool Name | Description | Category |
|-----------|-------------|----------|
| `get_journal_entries` | Get journal entries | Accounting |
| `search_transactions` | Search transactions | Accounting |

### Opportunity Tools (2)

| Tool Name | Description | Category |
|-----------|-------------|----------|
| `get_opportunities` | Get sales opportunities | CRM |
| `get_sales_funnel` | Sales funnel analysis | CRM |

### Pricing Tools (3)

| Tool Name | Description | Category |
|-----------|-------------|----------|
| `get_sales_prices` | Get sales price lists | Pricing |
| `get_purchase_prices` | Get purchase prices | Pricing |
| `get_margin_analysis` | Analyze profit margins | Analysis |

### Combo Tools (2)

| Tool Name | Description | Category |
|-----------|-------------|----------|
| `get_customer_360` | Complete customer overview | CRM |
| `get_financial_snapshot` | Complete financial overview | Reporting |

---

## Privacy & Data Handling

### Data Collection Statement

```
Categories of personal data collected:
- Exact Online user email (for authentication)
- API usage metrics (anonymized)

Purposes:
- Authentication with Exact Online
- Service delivery
- Usage monitoring for rate limiting

Data retention:
- Session tokens: 10 hours (Exact Online standard)
- Usage logs: 30 days (anonymized)
- No persistent storage of accounting data

Data sharing:
- No data shared with third parties
- Data flows: User → ChatGPT → Our MCP Server → Exact Online API
```

### No Sensitive Data Collection

We explicitly do NOT collect:
- Banking credentials
- Credit card information
- Government IDs
- Health information
- Full conversation history
- Raw API responses (not stored)

### Response Data Policy

All tool responses:
- Return only data directly relevant to the user's request
- Do not include internal session IDs, trace IDs, or debug info
- Are formatted for readability, not raw API responses

---

## Technical Specifications

### Transport Protocol

| Specification | Value |
|---------------|-------|
| Protocol | MCP (Model Context Protocol) |
| Transport | HTTP/HTTPS |
| Format | JSON |
| Authentication | Bearer token (API key) or OAuth 2.1 |

### Server Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/mcp` | Main MCP endpoint (OAuth flow) |
| `/mcp/{api_key}` | Direct API key authentication |
| `/sse/{api_key}` | Server-Sent Events transport |
| `/demo/{demo_key}` | Demo mode (no auth) |

### Rate Limits

| Plan | Calls/Month | Calls/Minute |
|------|-------------|--------------|
| Free | 200 | 10 |
| Starter | 2,000 | 30 |
| Pro | 20,000 | 60 |
| Enterprise | Unlimited | 120 |

### Error Handling

All errors return structured JSON:

```json
{
  "error": {
    "code": -32000,
    "message": "Human-readable error message"
  }
}
```

Common error codes:
- `-32001`: Authentication required
- `-32002`: Rate limit exceeded
- `-32003`: Account setup incomplete
- `-32600`: Invalid request

---

## Screenshots to Create

### Screenshot 1: Facturen Query
- **Prompt:** "Welke facturen staan open?"
- **Expected:** Tabel met openstaande facturen
- **Filename:** `chatgpt-facturen-query.png`

### Screenshot 2: Cashflow Forecast
- **Prompt:** "Geef me een cashflow voorspelling"
- **Expected:** Cashflow tabel met voorspelling
- **Filename:** `chatgpt-cashflow.png`

### Screenshot 3: Customer Search
- **Prompt:** "Zoek klant Krasnapolsky"
- **Expected:** Klantdetails met contactinfo
- **Filename:** `chatgpt-klant-zoeken.png`

### Screenshot 4: Revenue Report
- **Prompt:** "Wat is mijn omzet dit kwartaal?"
- **Expected:** Omzetoverzicht met breakdown
- **Filename:** `chatgpt-omzet.png`

---

## Submission Steps

### Step 1: Prepare

1. Verify OpenAI account at https://platform.openai.com/settings/organization/general
2. Wait for verification approval
3. Make screenshots with demo account

### Step 2: Create App

1. Go to https://platform.openai.com/apps-manage
2. Click "Create App"
3. Enter MCP Server URL: `https://api.praatmetjeboekhouding.nl/mcp`
4. Click "Scan Tools" to import all 47 tools
5. Verify annotations are displayed correctly

### Step 3: Fill Metadata

1. Enter app name: "Praat met je Boekhouding"
2. Enter description (from this document)
3. Upload logo (128x128 minimum)
4. Upload screenshots
5. Enter URLs (privacy, terms, docs)

### Step 4: Test Account

1. Enter demo URL: `https://api.praatmetjeboekhouding.nl/mcp/exa_demo`
2. Confirm: No login required
3. Confirm: No MFA required
4. Paste test cases from this document

### Step 5: Compliance

Check all boxes:
- [ ] App complies with OpenAI usage policies
- [ ] Privacy policy is published and accurate
- [ ] No unnecessary personal data requested
- [ ] Test credentials work without MFA

### Step 6: Submit

1. Review all information
2. Click "Submit for Review"
3. Note the Case ID for support requests

---

## Post-Submission

### Expected Timeline

| Phase | Duration |
|-------|----------|
| Initial review | 3-7 days |
| Technical testing | 1-3 days |
| Final decision | 1-2 days |
| **Total** | **5-14 days** |

### If Rejected

Common rejection reasons and fixes:

| Reason | Fix |
|--------|-----|
| "Unable to connect to MCP server" | Verify server is online, test demo URL |
| "Test cases failed" | Update expected outputs to match actual |
| "Incorrect annotations" | Verify all tools have correct hints |
| "Privacy policy incomplete" | Add missing data categories |

### After Approval

1. Click "Publish" in dashboard
2. App appears in ChatGPT App Directory
3. Share direct link with users
4. Monitor feedback and ratings

---

## Support Contact

For questions during review:

- **Email:** support@praatmetjeboekhouding.nl
- **Subject:** ChatGPT App Review - [Case ID]
- **Response time:** 24 hours

---

*Document prepared: 2 februari 2026*
*Version: 1.0*
