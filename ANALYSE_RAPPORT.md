# Exact Online MCP Server - Analyse & Implementatievoorstel

> ⚠️ **HISTORISCH DOCUMENT** - Dit was het initiële analyserapport van 24 januari 2026.
> Het project is inmiddels **LIVE** op https://praatmetjeboekhouding.nl
> Zie [.context/PIPELINE.md](/.context/PIPELINE.md) voor de huidige status.

**Datum:** 24 januari 2026
**Auteur:** Claude (MCP Expert)
**Project:** Praat met je Boekhouding (Exact Online MCP Integration)
**Status:** ✅ Geïmplementeerd en live

---

## Inhoudsopgave

1. [Executive Summary](#1-executive-summary)
2. [Huidige Stand van Zaken](#2-huidige-stand-van-zaken)
3. [Wat is MCP?](#3-wat-is-mcp)
4. [Exact Online API Analyse](#4-exact-online-api-analyse)
5. [Architectuurvoorstel](#5-architectuurvoorstel)
6. [Implementatieplan](#6-implementatieplan)
7. [Tool Specificaties](#7-tool-specificaties)
8. [Resource Specificaties](#8-resource-specificaties)
9. [Security Overwegingen](#9-security-overwegingen)
10. [Technische Keuzes](#10-technische-keuzes)
11. [Risico's en Mitigaties](#11-risicos-en-mitigaties)
12. [Aanbevelingen](#12-aanbevelingen)

---

## 1. Executive Summary

### Doel
Het bouwen van een **Model Context Protocol (MCP) server** die AI-assistenten (zoals Claude) directe, veilige toegang geeft tot Exact Online's boekhouding- en ERP-functionaliteit.

### Kern Bevindingen

| Aspect | Status/Bevinding |
|--------|------------------|
| **Codebase** | Leeg project, alleen `.gitignore` aanwezig |
| **MCP Ecosysteem** | Volwassen standaard (5.800+ servers), TypeScript SDK aanbevolen |
| **Exact Online API** | REST/OData API met OAuth 2.0, uitgebreide documentatie beschikbaar |
| **Complexiteit** | Gemiddeld-hoog door OAuth flow en rate limiting |

### Aanbevolen Aanpak
- **Taal:** TypeScript (beste MCP SDK ondersteuning)
- **Transport:** STDIO (voor lokale Claude Desktop integratie)
- **Scope:** Fasering - start met CRM/Financial, breid uit naar Sales/Purchase

---

## 2. Huidige Stand van Zaken

### Project Status
Het project is **volledig nieuw** en bevat momenteel:

```
Exact-online-MCP/
├── .git/           # Git repository geconfigureerd
├── .gitignore      # Uitgebreide ignore file (139 regels)
└── (geen code)
```

### Bestaande .gitignore Analyse
De `.gitignore` is voorbereid op:
- ✅ Node.js/npm projecten
- ✅ TypeScript builds (`dist/`, `*.tsbuildinfo`)
- ✅ Environment files (`.env`, `.env.*`)
- ✅ Moderne frameworks (Next.js, Nuxt, etc.)
- ✅ IDE/Editor configuraties

**Conclusie:** De `.gitignore` is correct voorbereid voor een TypeScript MCP server project.

---

## 3. Wat is MCP?

### Protocol Overzicht

Het **Model Context Protocol (MCP)** is een open standaard van Anthropic (november 2024) die AI-systemen verbindt met externe tools en databronnen.

```
┌─────────────────────────────────────────────────────────────┐
│                        MCP HOST                             │
│                   (Claude Desktop/IDE)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  MCP Client  │  │  MCP Client  │  │  MCP Client  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  MCP Server  │  │  MCP Server  │  │  MCP Server  │
   │   (Exact)    │  │   (GitHub)   │  │  (Database)  │
   └──────────────┘  └──────────────┘  └──────────────┘
```

### Drie Kern Primitieven

| Primitief | Beschrijving | Voorbeeld |
|-----------|--------------|-----------|
| **Tools** | Acties die het model kan uitvoeren | `create_invoice`, `get_customer` |
| **Resources** | Data die beschikbaar is voor context | `exactonline://accounts`, `exactonline://invoices` |
| **Prompts** | Herbruikbare templates | "Maak een factuur voor klant X" |

### Waarom MCP voor Exact Online?

1. **Directe AI-integratie** - Claude kan direct facturen maken, klanten opzoeken
2. **Standaardisatie** - Werkt met alle MCP-compatibele AI tools
3. **Security** - Gecontroleerde toegang met OAuth 2.0
4. **Audit trail** - Alle acties zijn traceerbaar
5. **Productiviteit** - Boekhouders kunnen via natuurlijke taal werken

---

## 4. Exact Online API Analyse

### API Karakteristieken

| Kenmerk | Waarde |
|---------|--------|
| **Type** | REST API met OData |
| **Authenticatie** | OAuth 2.0 (verplicht) |
| **Base URL** | `https://start.exactonline.{cc}/api/v1/{division}` |
| **Response Format** | JSON met OData metadata |
| **Rate Limit (minutely)** | 60 calls/minuut/bedrijf |
| **Rate Limit (daily)** | Variabel per bedrijf |
| **Paginatie** | 60 records/request (bulk: 1000) |
| **Token Expiry** | 10 minuten (access token) |

### Beschikbare Modules

```
┌─────────────────────────────────────────────────────────────┐
│                    EXACT ONLINE API                         │
├────────────────┬────────────────┬────────────────┬──────────┤
│   FINANCIAL    │      CRM       │     SALES      │  PURCHASE│
├────────────────┼────────────────┼────────────────┼──────────┤
│ GLAccounts     │ Accounts       │ SalesInvoices  │ Purchase │
│ Journals       │ Contacts       │ SalesOrders    │ Orders   │
│ Transactions   │ Addresses      │ Quotations     │ Suppliers│
│ Banks          │ Opportunities  │ GoodsDelivery  │ Receipts │
├────────────────┼────────────────┼────────────────┼──────────┤
│   LOGISTICS    │      HRM       │   PROJECT      │  SYSTEM  │
├────────────────┼────────────────┼────────────────┼──────────┤
│ Items          │ Employees      │ Projects       │ Users    │
│ Warehouses     │ Contracts      │ TimeEntries    │ Divisions│
│ StockPositions │ Departments    │ Costs          │ Settings │
└────────────────┴────────────────┴────────────────┴──────────┘
```

### OAuth 2.0 Flow

```
┌──────────┐    1. Auth Request     ┌──────────────────┐
│  User    │ ───────────────────────▶│ Exact Online     │
│          │                         │ Login Page       │
│          │ ◀──────────────────────│                  │
│          │    2. Authorization     │                  │
└──────────┘       Code             └──────────────────┘
     │                                       │
     │ 3. Code                               │
     ▼                                       │
┌──────────────┐  4. Exchange Code  ┌────────▼─────────┐
│  MCP Server  │ ──────────────────▶│ Exact Token      │
│              │                    │ Endpoint         │
│              │ ◀─────────────────│                  │
│              │  5. Access +       │                  │
│              │     Refresh Token  └──────────────────┘
└──────────────┘
```

### Country Codes (Endpoints)

| Land | Code | Base URL |
|------|------|----------|
| Nederland | `nl` | `start.exactonline.nl` |
| België | `be` | `start.exactonline.be` |
| Duitsland | `de` | `start.exactonline.de` |
| UK | `co.uk` | `start.exactonline.co.uk` |
| USA | `com` | `start.exactonline.com` |

---

## 5. Architectuurvoorstel

### High-Level Architectuur

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLAUDE DESKTOP / IDE                        │
│                         (MCP Host)                              │
└─────────────────────────────┬───────────────────────────────────┘
                              │ STDIO/JSON-RPC
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXACT ONLINE MCP SERVER                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    MCP Protocol Layer                      │ │
│  │  • Tool Registration                                       │ │
│  │  • Resource Registration                                   │ │
│  │  • Request/Response Handling                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Business Logic Layer                    │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │  CRM Tools  │ │Finance Tools│ │ Sales Tools │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │Purchase Tool│ │ HRM Tools   │ │Project Tools│          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Infrastructure Layer                    │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │OAuth Manager│ │Rate Limiter │ │   Cache     │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  │  ┌─────────────┐ ┌─────────────┐                          │ │
│  │  │ API Client  │ │   Logger    │                          │ │
│  │  └─────────────┘ └─────────────┘                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST
                              ▼
                    ┌───────────────────┐
                    │   EXACT ONLINE    │
                    │   REST API        │
                    └───────────────────┘
```

### Mappenstructuur Voorstel

```
exact-online-mcp/
├── src/
│   ├── index.ts                 # Entry point
│   ├── server.ts                # MCP server setup
│   │
│   ├── auth/
│   │   ├── oauth.ts             # OAuth 2.0 handler
│   │   ├── token-storage.ts     # Token persistence
│   │   └── auth-server.ts       # Local callback server
│   │
│   ├── api/
│   │   ├── client.ts            # Exact Online API client
│   │   ├── rate-limiter.ts      # Rate limit handling
│   │   └── endpoints/
│   │       ├── crm.ts
│   │       ├── financial.ts
│   │       ├── sales.ts
│   │       ├── purchase.ts
│   │       └── ...
│   │
│   ├── tools/
│   │   ├── index.ts             # Tool registry
│   │   ├── crm/
│   │   │   ├── get-accounts.ts
│   │   │   ├── create-account.ts
│   │   │   └── search-contacts.ts
│   │   ├── financial/
│   │   │   ├── get-gl-accounts.ts
│   │   │   ├── get-journals.ts
│   │   │   └── get-transactions.ts
│   │   ├── sales/
│   │   │   ├── create-invoice.ts
│   │   │   ├── get-invoices.ts
│   │   │   └── create-order.ts
│   │   └── purchase/
│   │       ├── get-suppliers.ts
│   │       └── create-purchase-order.ts
│   │
│   ├── resources/
│   │   ├── index.ts             # Resource registry
│   │   ├── accounts.ts
│   │   ├── invoices.ts
│   │   └── items.ts
│   │
│   └── utils/
│       ├── config.ts            # Configuration
│       ├── logger.ts            # Logging
│       └── errors.ts            # Error handling
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 6. Implementatieplan

### Fase 1: Foundation (Week 1-2)

| Taak | Beschrijving | Prioriteit |
|------|--------------|------------|
| Project setup | Package.json, TypeScript config, linting | P0 |
| MCP Server basis | Initialisatie met @modelcontextprotocol/sdk | P0 |
| OAuth implementatie | Complete OAuth 2.0 flow met token refresh | P0 |
| API Client | Basis HTTP client met error handling | P0 |
| Rate Limiter | Respecteren van 60 calls/minuut limiet | P0 |

**Deliverable:** Werkende MCP server die kan authenticeren met Exact Online

### Fase 2: Core Tools (Week 3-4)

| Taak | Beschrijving | Prioriteit |
|------|--------------|------------|
| CRM Tools | Accounts, Contacts CRUD | P0 |
| Financial Tools | GLAccounts, Journals read | P1 |
| System Tools | Divisions, Current user | P0 |
| Error Handling | Consistente error responses | P1 |

**Deliverable:** Werkende tools voor klantbeheer en basisfinanciën

### Fase 3: Sales & Purchase (Week 5-6)

| Taak | Beschrijving | Prioriteit |
|------|--------------|------------|
| Sales Invoices | Create, Read, List invoices | P0 |
| Sales Orders | Create, Read orders | P1 |
| Items/Products | CRUD voor producten | P1 |
| Purchase Orders | Create, Read | P2 |

**Deliverable:** Complete sales flow ondersteuning

### Fase 4: Resources & Polish (Week 7-8)

| Taak | Beschrijving | Prioriteit |
|------|--------------|------------|
| MCP Resources | Read-only data exposure | P1 |
| Caching | Response caching voor performance | P2 |
| Documentation | README, API docs | P1 |
| Testing | Unit & integration tests | P1 |
| Error Messages | Nederlandstalige errors (optioneel) | P3 |

**Deliverable:** Productie-ready MCP server

---

## 7. Tool Specificaties

### Aanbevolen Tools - Fase 1 & 2

#### CRM Tools

```typescript
// Tool: get_accounts
{
  name: "get_accounts",
  description: "Haal een lijst van klanten/relaties op uit Exact Online. Gebruik dit om klantgegevens te zoeken of bekijken.",
  inputSchema: {
    type: "object",
    properties: {
      search: {
        type: "string",
        description: "Zoek op naam of code"
      },
      limit: {
        type: "number",
        default: 20,
        description: "Maximum aantal resultaten (max 60)"
      },
      isSupplier: {
        type: "boolean",
        description: "Filter op leveranciers"
      },
      isCustomer: {
        type: "boolean",
        description: "Filter op klanten"
      }
    }
  }
}

// Tool: create_account
{
  name: "create_account",
  description: "Maak een nieuwe relatie (klant/leverancier) aan in Exact Online.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", required: true },
      email: { type: "string" },
      phone: { type: "string" },
      isCustomer: { type: "boolean", default: true },
      isSupplier: { type: "boolean", default: false },
      vatNumber: { type: "string" },
      chamberOfCommerce: { type: "string" },
      address: {
        type: "object",
        properties: {
          street: { type: "string" },
          city: { type: "string" },
          postalCode: { type: "string" },
          country: { type: "string" }
        }
      }
    },
    required: ["name"]
  }
}

// Tool: get_contacts
{
  name: "get_contacts",
  description: "Haal contactpersonen op, optioneel gefilterd op relatie.",
  inputSchema: {
    type: "object",
    properties: {
      accountId: {
        type: "string",
        description: "GUID van de relatie"
      },
      search: {
        type: "string",
        description: "Zoek op naam of email"
      }
    }
  }
}
```

#### Financial Tools

```typescript
// Tool: get_gl_accounts
{
  name: "get_gl_accounts",
  description: "Haal grootboekrekeningen op uit Exact Online.",
  inputSchema: {
    type: "object",
    properties: {
      search: { type: "string" },
      type: {
        type: "string",
        enum: ["revenue", "expense", "balance"],
        description: "Filter op rekeningtype"
      }
    }
  }
}

// Tool: get_outstanding_invoices
{
  name: "get_outstanding_invoices",
  description: "Haal openstaande facturen op met debiteurenlijst.",
  inputSchema: {
    type: "object",
    properties: {
      accountId: {
        type: "string",
        description: "Filter op specifieke klant (GUID)"
      },
      dueDateBefore: {
        type: "string",
        format: "date",
        description: "Facturen met vervaldatum voor deze datum"
      }
    }
  }
}
```

#### Sales Tools

```typescript
// Tool: create_sales_invoice
{
  name: "create_sales_invoice",
  description: "Maak een nieuwe verkoopfactuur aan in Exact Online. Let op: dit creëert direct een factuur.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        required: true,
        description: "GUID van de klant"
      },
      invoiceDate: {
        type: "string",
        format: "date"
      },
      description: { type: "string" },
      lines: {
        type: "array",
        items: {
          type: "object",
          properties: {
            itemId: { type: "string" },
            description: { type: "string" },
            quantity: { type: "number" },
            unitPrice: { type: "number" },
            vatCode: { type: "string" }
          }
        }
      }
    },
    required: ["customerId", "lines"]
  }
}

// Tool: get_sales_invoices
{
  name: "get_sales_invoices",
  description: "Haal verkoopfacturen op met filters.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: { type: "string" },
      status: {
        type: "string",
        enum: ["draft", "open", "paid", "cancelled"]
      },
      fromDate: { type: "string", format: "date" },
      toDate: { type: "string", format: "date" },
      limit: { type: "number", default: 20 }
    }
  }
}
```

#### System Tools

```typescript
// Tool: get_divisions
{
  name: "get_divisions",
  description: "Haal beschikbare administraties (divisies) op.",
  inputSchema: {
    type: "object",
    properties: {}
  }
}

// Tool: set_division
{
  name: "set_division",
  description: "Selecteer de actieve administratie voor volgende API calls.",
  inputSchema: {
    type: "object",
    properties: {
      divisionId: {
        type: "number",
        required: true,
        description: "Division ID (meestal 6 cijfers)"
      }
    },
    required: ["divisionId"]
  }
}

// Tool: get_current_user
{
  name: "get_current_user",
  description: "Haal informatie op over de ingelogde gebruiker.",
  inputSchema: {
    type: "object",
    properties: {}
  }
}
```

### Tool Naamgeving Conventies

| Prefix | Gebruik | Voorbeeld |
|--------|---------|-----------|
| `get_` | Ophalen van data | `get_accounts`, `get_invoices` |
| `create_` | Nieuwe entiteit aanmaken | `create_invoice`, `create_account` |
| `update_` | Bestaande entiteit wijzigen | `update_account`, `update_invoice` |
| `delete_` | Entiteit verwijderen | `delete_draft_invoice` |
| `search_` | Complexe zoekoperaties | `search_transactions` |
| `list_` | Opsommen zonder filters | `list_vat_codes` |

---

## 8. Resource Specificaties

### MCP Resources

Resources zijn read-only data die het AI-model kan raadplegen voor context.

```typescript
// Resource: exactonline://accounts
{
  uri: "exactonline://accounts",
  name: "Exact Online Accounts",
  description: "Alle relaties (klanten en leveranciers) in de actieve administratie",
  mimeType: "application/json"
}

// Resource: exactonline://accounts/{id}
{
  uri: "exactonline://accounts/{id}",
  name: "Account Details",
  description: "Detailinformatie van een specifieke relatie",
  mimeType: "application/json"
}

// Resource: exactonline://invoices/outstanding
{
  uri: "exactonline://invoices/outstanding",
  name: "Outstanding Invoices",
  description: "Alle openstaande verkoopfacturen",
  mimeType: "application/json"
}

// Resource: exactonline://gl-accounts
{
  uri: "exactonline://gl-accounts",
  name: "General Ledger Accounts",
  description: "Grootboekrekeningschema",
  mimeType: "application/json"
}

// Resource: exactonline://items
{
  uri: "exactonline://items",
  name: "Products & Services",
  description: "Alle artikelen en diensten",
  mimeType: "application/json"
}
```

---

## 9. Security Overwegingen

### OAuth 2.0 Security

| Risico | Mitigatie |
|--------|-----------|
| Token leakage | Tokens opslaan in encrypted local storage |
| Token expiry | Automatische refresh 1 minuut voor expiry |
| Refresh token rotation | Nieuwe refresh token bij elke refresh opslaan |
| Credential exposure | Nooit credentials in logs of responses |

### MCP Security Best Practices

```typescript
// GOED: Valideer alle input
server.tool("create_invoice", schema, async (params) => {
  // Validate customerId is valid GUID
  if (!isValidGuid(params.customerId)) {
    throw new Error("Invalid customer ID format");
  }
  // ...
});

// GOED: Sanitize output
return {
  content: [{
    type: "text",
    text: sanitizeForDisplay(result)
  }]
};

// GOED: Rate limit respecteren
const rateLimiter = new RateLimiter({
  maxRequestsPerMinute: 55, // Buffer van 5
  maxRequestsPerDay: dailyLimit - 100
});
```

### Data Privacy

1. **Geen data caching van gevoelige informatie** - Financiële data niet langdurig cachen
2. **Audit logging** - Alle tool calls loggen voor compliance
3. **Minimal scope** - Alleen benodigde API scopes aanvragen
4. **Local-first** - STDIO transport houdt data lokaal

### Aanbevolen .env Structuur

```env
# Exact Online OAuth
EXACT_CLIENT_ID=your_client_id
EXACT_CLIENT_SECRET=your_client_secret
EXACT_REDIRECT_URI=http://localhost:3000/callback

# Exact Online Configuration
EXACT_COUNTRY_CODE=nl
EXACT_DIVISION_ID=123456

# Token Storage (encrypted)
TOKEN_ENCRYPTION_KEY=your_32_byte_key

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/mcp-server.log
```

---

## 10. Technische Keuzes

### Waarom TypeScript?

| Criterium | TypeScript | Python |
|-----------|------------|--------|
| MCP SDK maturity | Uitstekend | Goed |
| Type safety | Native | Met type hints |
| Exact Online libs | Beschikbaar | Beschikbaar |
| Claude Desktop | Aanbevolen | Ondersteund |
| Async handling | Native Promises | asyncio |
| NPM ecosystem | Zeer groot | - |

**Besluit:** TypeScript voor betere tooling en type safety

### Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.x",
    "zod": "^3.25",
    "axios": "^1.x",
    "keytar": "^7.x",       // Secure credential storage
    "winston": "^3.x"        // Logging
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vitest": "^1.x",
    "@types/node": "^20.x",
    "tsx": "^4.x"            // TypeScript execution
  }
}
```

### Transport Keuze

| Transport | Use Case | Aanbevolen |
|-----------|----------|------------|
| **STDIO** | Lokale Claude Desktop | ✅ Ja |
| Streamable HTTP | Remote servers | Toekomstig |
| HTTP+SSE | Legacy | Nee |

**Besluit:** Start met STDIO voor directe Claude Desktop integratie

---

## 11. Risico's en Mitigaties

### Technische Risico's

| Risico | Impact | Waarschijnlijkheid | Mitigatie |
|--------|--------|-------------------|-----------|
| Rate limiting | Hoog | Hoog | Implementeer queue en backoff |
| Token expiry mid-request | Medium | Medium | Proactive token refresh |
| API changes | Medium | Laag | Versioning, changelog monitoring |
| OAuth callback issues | Hoog | Medium | Meerdere callback methods |

### Operationele Risico's

| Risico | Impact | Waarschijnlijkheid | Mitigatie |
|--------|--------|-------------------|-----------|
| Onbedoelde factuur creatie | Hoog | Medium | Bevestigingsprompts in tool descriptions |
| Data corruption | Hoog | Laag | Read-first validatie |
| Verkeerde administratie | Medium | Medium | Duidelijke division context in responses |

### Mitigatie Strategieën

```typescript
// Rate Limit Queue
class RequestQueue {
  private queue: Request[] = [];
  private processing = false;

  async add(request: Request): Promise<Response> {
    return new Promise((resolve) => {
      this.queue.push({ request, resolve });
      this.process();
    });
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      await this.rateLimiter.acquire();
      const response = await this.execute(item.request);
      item.resolve(response);
    }

    this.processing = false;
  }
}

// Confirmation in Tool Description
{
  name: "create_sales_invoice",
  description: `Maak een DEFINITIEVE verkoopfactuur aan in Exact Online.

    ⚠️ WAARSCHUWING: Dit maakt direct een factuur aan die naar de klant
    kan worden verstuurd. Controleer alle gegevens voordat je deze tool gebruikt.

    Vraag de gebruiker om bevestiging voordat je deze tool aanroept.`,
  // ...
}
```

---

## 12. Aanbevelingen

### Must Have (P0)

1. **Complete OAuth 2.0 implementatie** met token refresh
2. **Rate limiting** met queue en exponential backoff
3. **CRM tools** (accounts, contacts)
4. **Sales tools** (invoices - read en create)
5. **System tools** (divisions, user info)
6. **Error handling** met duidelijke foutmeldingen
7. **Secure token storage** (keytar of vergelijkbaar)

### Should Have (P1)

1. **Financial tools** (GL accounts, journals - read only)
2. **Items/Products tools** (CRUD)
3. **MCP Resources** voor read-only data access
4. **Comprehensive logging** voor debugging
5. **Unit tests** voor kritieke functionaliteit
6. **README** met installatie-instructies

### Could Have (P2)

1. **Purchase tools** (orders, suppliers)
2. **Project tools** (indien beschikbaar in editie)
3. **HRM tools** (employees)
4. **Caching layer** voor performance
5. **Webhooks support** voor real-time updates
6. **Multi-language** error messages

### Won't Have (P3 - Toekomstig)

1. Remote server deployment (Streamable HTTP)
2. Multi-tenant support
3. Custom prompts
4. Automated reporting

---

## Volgende Stappen

### Directe Acties

1. **Project initialisatie**
   - Package.json aanmaken
   - TypeScript configuratie
   - ESLint/Prettier setup

2. **MCP Server skeleton**
   - Basis server setup met @modelcontextprotocol/sdk
   - STDIO transport configuratie

3. **OAuth module**
   - Client credentials configuratie
   - Authorization flow implementatie
   - Token storage met encryption

4. **Eerste tool**
   - `get_divisions` als proof of concept
   - End-to-end test met Claude Desktop

### Aanbevolen Bronnen

| Resource | URL |
|----------|-----|
| MCP Documentatie | https://modelcontextprotocol.io |
| MCP TypeScript SDK | https://github.com/modelcontextprotocol/typescript-sdk |
| Exact Online API | https://support.exactonline.com |
| Exact App Center | https://apps.exactonline.com |

---

## Conclusie

Het bouwen van een Exact Online MCP server is een haalbaar project dat significante waarde kan toevoegen voor boekhouders en ondernemers die met AI-assistenten werken. De combinatie van een volwassen MCP ecosysteem en goed gedocumenteerde Exact Online API maakt een succesvolle implementatie mogelijk.

**Key success factors:**
1. Robuuste OAuth 2.0 implementatie
2. Respecteren van rate limits
3. Duidelijke tool descriptions voor LLM gebruik
4. Veilige token opslag
5. Goede error handling

Met dit rapport als basis kan de implementatie direct beginnen volgens het voorgestelde fasering.

---

*Dit rapport is gegenereerd op basis van uitgebreid onderzoek naar MCP documentatie, Exact Online API specificaties, en best practices uit het MCP ecosysteem.*
