# Technische Spec: get_cashflow_forecast

**TaskId**: SPEC-001
**Auteur**: Henk (IT Architect)
**Voor**: Kees (Developer)

---

## Doel

MCP tool die een cashflow forecast genereert op basis van openstaande facturen en huidig banksaldo.

## Input

```typescript
{
  division: number;           // Verplicht
  forecast_days: 30 | 60 | 90; // Default: 30
}
```

## Output

```typescript
{
  current_balance: number;
  expected_income: number;      // Receivables binnen forecast periode
  expected_expenses: number;    // Payables binnen forecast periode
  forecast_balance: number;     // current + income - expenses
  warning: string | null;       // Bijv. "Negatief saldo verwacht over 45 dagen"
  period: {
    days: number;
    end_date: string;           // ISO date
  };
  details: {
    receivables_count: number;
    payables_count: number;
  };
  division: number;
}
```

## Exact Online API Endpoints

| Data | Endpoint | Velden |
|------|----------|--------|
| Bank saldo | `/{division}/financialtransaction/BankEntryLines` | Som van `AmountDC` |
| Debiteuren | `/{division}/financial/ReceivablesList` | `Amount`, `DueDate` |
| Crediteuren | `/{division}/financial/PayablesList` | `Amount`, `DueDate` |

**Fallback** voor bank saldo: som laatste maand transacties als opening balance niet beschikbaar.

## Te Hergebruiken Code

1. **BaseTool** (`tools/_base.ts`)
   - Extend `BaseTool`
   - Gebruik `this.getConnection()` en `this.exactRequest<T>()`

2. **Patroon uit invoices.ts** (`GetOutstandingInvoicesTool`)
   - ReceivablesList/PayablesList calls
   - DueDate filtering en days calculatie

3. **Patroon uit financial.ts** (`GetBankTransactionsTool`)
   - BankEntryLines endpoint
   - OData filter opbouw

## Data Flow

```
1. getConnection() -> connection

2. Parallel fetch:
   ├─ BankEntryLines (laatste 3 maanden) -> current_balance
   ├─ ReceivablesList -> filter op DueDate <= forecast_end
   └─ PayablesList -> filter op DueDate <= forecast_end

3. Calculate:
   - expected_income = sum(receivables.Amount)
   - expected_expenses = sum(payables.Amount)
   - forecast_balance = current_balance + income - expenses

4. Generate warning:
   - if forecast_balance < 0 -> "Negatief saldo verwacht"
   - if forecast_balance < 5000 -> "Laag saldo verwacht"
```

## Implementatie Hints

```typescript
// File: apps/mcp-server/src/tools/financial.ts (toevoegen aan bestaand)

export class GetCashflowForecastTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_cashflow_forecast',
    description: 'Genereer cashflow forecast...',
    inputSchema: {
      type: 'object',
      properties: {
        division: { type: 'number', description: '...' },
        forecast_days: { type: 'number', enum: [30, 60, 90], description: '...' }
      },
      required: ['division']
    }
  };

  async run(params: Record<string, unknown>): Promise<unknown> {
    const forecastDays = (params.forecast_days as number) || 30;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + forecastDays);

    // Parallel fetches met Promise.all
    const [balance, receivables, payables] = await Promise.all([
      this.fetchCurrentBalance(division),
      this.fetchReceivables(division, endDate),
      this.fetchPayables(division, endDate)
    ]);

    // ... calculate & return
  }
}
```

## Registratie

Voeg toe aan `apps/mcp-server/src/tools/index.ts`:

```typescript
import { GetCashflowForecastTool } from './financial';
// ...
new GetCashflowForecastTool(),
```

## Test Scenario's

1. Division met data -> forecast met bedragen
2. Division zonder openstaande facturen -> income/expenses = 0
3. Negatieve forecast -> warning message
4. Geen connectie -> error response
