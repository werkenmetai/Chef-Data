# Exact Online Modules per MCP Tool

> Overzicht van welke Exact Online modules actief moeten zijn voor elke MCP tool.

**Laatste update:** 2026-01-29

---

## Basis Tools (altijd beschikbaar)

Deze tools werken met elke Exact Online administratie:

| MCP Tool | Exact Module | Omschrijving |
|----------|--------------|--------------|
| `list_divisions` | - | Lijst administraties |
| `get_gl_accounts` | Financial Accounting | Grootboekrekeningen |
| `get_journal_entries` | Financial Accounting | Journaalposten |
| `get_bank_transactions` | Financial Accounting | Banktransacties |
| `get_trial_balance` | Financial Accounting | Proef/saldibalans |
| `get_relations` | CRM / Account Management | Relaties (klanten/leveranciers) |
| `search_relations` | CRM / Account Management | Zoeken in relaties |
| `get_sales_invoices` | Sales Invoices | Verkoopfacturen |
| `get_purchase_invoices` | Purchase Invoices | Inkoopfacturen |
| `get_outstanding_invoices` | Receivables/Payables | Openstaande facturen |
| `get_cashflow_forecast` | Financial Accounting | Cashflow prognose |
| `search_transactions` | Financial Accounting | Zoeken in transacties |

---

## Tools met Module-afhankelijkheid

Deze tools vereisen specifieke Exact Online modules die niet in alle abonnementen zitten:

### Project Management

| MCP Tool | Exact Module | Nederlandse Naam |
|----------|--------------|------------------|
| `get_projects` | Project Management | Projectbeheer |
| `get_time_transactions` | Time & Billing Registration | Uren & Facturatie |

**Vereist:** Exact Online Project module (vaak onderdeel van "Exact Online voor Accountancy" of "Manufacturing")

---

### Sales & Purchase Orders

| MCP Tool | Exact Module | Nederlandse Naam |
|----------|--------------|------------------|
| `get_sales_orders` | Sales Orders | Verkooporders |
| `get_purchase_orders` | Purchase Orders | Inkooporders |
| `get_quotations` | Quotations | Offertes |

**Vereist:** Exact Online met Order/Logistiek functionaliteit

---

### Voorraad & Artikelen

| MCP Tool | Exact Module | Nederlandse Naam |
|----------|--------------|------------------|
| `get_items` | Item Management | Artikelbeheer |
| `get_stock_positions` | Inventory Management | Voorraadbeheer |

**Vereist:** Basis Exact Online (meestal beschikbaar)

---

### Vaste Activa

| MCP Tool | Exact Module | Nederlandse Naam |
|----------|--------------|------------------|
| `get_fixed_assets` | Asset Management | Vaste activa |
| `get_depreciation` | Asset Management | Afschrijvingen |

**Vereist:** Exact Online met Vaste Activa module

---

### Optionele Stamgegevens

| MCP Tool | Exact Module | Nederlandse Naam | Opmerking |
|----------|--------------|------------------|-----------|
| `get_cost_centers` | HRM / Cost Analysis | Kostenplaatsen | Moet ingesteld zijn |
| `get_currencies` | Multi-currency | Valuta | Moet geactiveerd zijn |

---

## Foutmeldingen & Oplossingen

### "Access Denied" / 403 Error

**Oorzaak:** De benodigde module is niet actief of de app heeft geen toegang.

**Oplossing:**
1. Check in Exact Online → Mijn Exact → Apps of "Praat met je Boekhouding" toegang heeft
2. Vraag je accountant of beheerder om de module te activeren
3. Controleer je Exact Online abonnement (sommige modules zijn add-ons)

### "Not Found" / 404 Error

**Oorzaak:** De data bestaat niet of de module is niet geconfigureerd.

**Oplossing:**
1. Voor kostenplaatsen: stel deze eerst in via Stamgegevens
2. Voor valuta: activeer multi-currency in de administratie
3. Check of er daadwerkelijk data is in Exact Online

---

## Hoe controleer je welke modules actief zijn?

1. Log in op Exact Online
2. Ga naar **Mijn Exact** → **Abonnement** of **Licenties**
3. Bekijk welke modules/add-ons actief zijn

Of vraag je accountant - zij kunnen dit zien in het accountantsdashboard.

---

## Modules per Exact Online Editie

| Editie | Financieel | CRM | Orders | Projecten | Activa |
|--------|------------|-----|--------|-----------|--------|
| **Boekhouden** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Accountancy** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Handel** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Manufacturing** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Professional** | ✅ | ✅ | ✅ | ✅ | ✅ |

*Let op: Dit is een indicatie. Exact Online past regelmatig abonnementsvormen aan.*
