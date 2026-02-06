# Exact Online REST API Documentation

Complete reference documentation for the Exact Online REST API.

## Overview

Exact Online is a SaaS ERP/accounting software platform popular in The Netherlands and Belgium. It provides a comprehensive REST API using OData protocol for integration.

## Quick Links

- [Authentication (OAuth 2.0)](./authentication.md)
- [All API Endpoints](./endpoints.md)
- [Rate Limits](./rate-limits.md)
- [OData Filtering & Querying](./odata.md)

## Base URLs

| Region | Base URL |
|--------|----------|
| Netherlands | `https://start.exactonline.nl/api` |
| Belgium | `https://start.exactonline.be/api` |
| UK | `https://start.exactonline.co.uk/api` |
| Germany | `https://start.exactonline.de/api` |
| USA | `https://start.exactonline.com/api` |

## Endpoint Structure

All endpoints follow this pattern:

```
{base_url}/v1/{division}/{service}/{resource}
```

Example:
```
https://start.exactonline.nl/api/v1/123456/crm/Accounts
```

Where:
- `123456` is the division (administratie) ID
- `crm` is the service category
- `Accounts` is the resource

## API Categories

The API is organized into these main categories:

| Category | Description |
|----------|-------------|
| **Accountancy** | Accountant-specific features |
| **Activities** | Tasks, events, service requests |
| **Assets** | Fixed assets management |
| **Budget** | Budget scenarios and tracking |
| **Bulk** | High-volume data retrieval (1000 records/page) |
| **Cashflow** | Banking, payments, receivables |
| **CRM** | Customers, contacts, opportunities, quotes |
| **Documents** | Document management and attachments |
| **Financial** | GL accounts, journals, transactions |
| **FinancialTransaction** | Bank/cash entries |
| **General** | Currencies and general data |
| **GeneralJournalEntry** | Manual journal entries |
| **HRM** | Employees, departments, schedules |
| **Inventory** | Stock, warehouses, serial/batch numbers |
| **Logistics** | Items, pricing, stock positions |
| **Mailbox** | Email integration |
| **Manufacturing** | Production orders, operations |
| **OpeningBalance** | Opening balance management |
| **Payroll** | Payroll-specific data |
| **Project** | Project management, time tracking |
| **Purchase** | Purchase orders and invoices |
| **Sales** | Sales orders and invoices |
| **Subscription** | Recurring invoicing |
| **System** | Divisions, user info, features |
| **Users** | User management and permissions |
| **VAT** | Tax codes and percentages |

## HTTP Methods

| Method | Usage |
|--------|-------|
| `GET` | Retrieve data |
| `POST` | Create new records |
| `PUT` | Update existing records |
| `DELETE` | Remove records |

## Response Format

All responses are JSON in OData format:

```json
{
  "d": {
    "results": [
      {
        "ID": "guid-here",
        "Code": "ACC001",
        "Name": "Example Account"
      }
    ],
    "__next": "https://start.exactonline.nl/api/v1/123456/crm/Accounts?$skiptoken=..."
  }
}
```

## Pagination

- Default: 60 records per page
- Bulk endpoints: 1000 records per page
- Use `$top` to limit results
- Use `$skip` or `__next` URL for pagination

## Official Resources

- [Exact Online Developer Portal](https://www.exact.com/developers)
- [Exact Online App Center](https://apps.exactonline.com)
- [API Reference (requires login)](https://start.exactonline.nl/docs/HlpRestAPIResources.aspx)
- [Support Portal](https://support.exactonline.com)

## Third-Party Libraries

| Language | Library |
|----------|---------|
| Python | [ossobv/exactonline](https://github.com/ossobv/exactonline) |
| PHP | [picqer/exact-php-client](https://github.com/picqer/exact-php-client) |
| Go | [mcnijman/go-exactonline](https://github.com/mcnijman/go-exactonline) |
| .NET | [ExactOnline.Api.DotnetStandard](https://github.com/johnverbiest/ExactOnline.Api.DotnetStandard) |
