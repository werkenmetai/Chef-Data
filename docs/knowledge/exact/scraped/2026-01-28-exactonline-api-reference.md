# Exact Online REST API - Reference documentation

**Bron:** https://start.exactonline.nl/docs/HlpRestAPIResources.aspx
**Datum:** 2026-01-28
**Gescraped door:** Claude Browser Extension

---

Almost all of the Exact Online REST API resource URIs require a **Division parameter**. This parameter identifies the division that is accessed.

## Getting the Current Division

```
GET /api/v1/current/Me?$select=CurrentDivision
```

## Getting All Divisions

- `/api/v1/{division}/system/Divisions` - Divisions accessible to the user
- `/api/v1/{division}/system/AllDivisions` - All divisions for the current license

## API Characteristics

- Most REST API endpoints have a page size of **60**
- Bulk and sync endpoints have a page size of **1000**
- It is recommended to use sync endpoints where possible

## Available Services

The API provides endpoints organized by service categories including:

| Service | Examples |
|---------|----------|
| **Accountancy** | AccountInvolvedAccounts, AccountOwners, InvolvedUserRoles, InvolvedUsers, SolutionLinks, TaskTypes |
| **Activities** | CommunicationNotes, Complaints, Events, ServiceRequests, Tasks |
| **Assets** | AssetGroups, Assets, CommercialBuildingValues, DepreciationMethods |
| **Budget** | Budgets, BudgetScenarios (BETA) |
| **Bulk** | Cashflow/Payments, Cashflow/Receivables, CRM/Accounts, CRM/Addresses, CRM/Contacts |
| **CRM** | Accounts, Addresses, Contacts |
| **Documents** | Document handling endpoints |
| **Financial** | Financial data endpoints |
| **HRM** | Human resource management |
| **Inventory** | Inventory management |
| **Logistics** | Logistics operations |
| **Manufacturing** | Manufacturing processes |
| **Payroll** | Payroll management |
| **Project** | Project management |
| **Purchase** | Purchase operations |
| **Sales** | Sales operations |
| **Sync** | Synchronization endpoints |
| **System** | System configuration |
| **VAT** | VAT-related endpoints |
| **Webhooks** | Webhook configuration |
| **Workflow** | Workflow management |

## Supported Methods by Endpoint

Most endpoints support a combination of: **GET**, **POST**, **PUT**, **DELETE**
