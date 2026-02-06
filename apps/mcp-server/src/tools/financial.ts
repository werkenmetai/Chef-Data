/**
 * Financial Tools
 *
 * Tools for working with Exact Online financial data (bank, GL accounts, trial balance).
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, formatExactDate, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import { logger } from '../lib/logger';
import { escapeODataString } from '../exact/odata-query';
import {
  ExactBankEntry,
  ExactGLAccount,
  ReportingBalanceItem,
  TrialBalanceEntry,
} from '@exact-mcp/shared';

/**
 * Get Bank Transactions Tool
 */
export class GetBankTransactionsTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_bank_transactions',
    description:
      'Haal banktransacties/bankafschriften op uit Exact Online. ' +
      'GEBRUIK BIJ: bankafschriften, bij- en afschrijvingen, betalingsoverzicht, cash flow. ' +
      'VOORBEELD: {"from_date": "2025-01-01", "to_date": "2025-01-31"}',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code. Optioneel (standaard administratie wordt gebruikt).',
        },
        from_date: {
          type: 'string',
          description: 'Begindatum. FORMAAT: "YYYY-MM-DD" (bijv. "2025-01-01"). Default: begin deze maand.',
        },
        to_date: {
          type: 'string',
          description: 'Einddatum. FORMAAT: "YYYY-MM-DD" (bijv. "2025-01-31"). Default: vandaag.',
        },
        bank_account: {
          type: 'string',
          description: 'Bankrekening ID (GUID formaat). Optioneel.',
        },
        limit: {
          type: 'number',
          description: 'Maximum resultaten (1-500, default: 100).',
        },
      },
      required: [],
    },
    // @see MCP-002 in operations/ROADMAP.md
    outputSchema: {
      type: 'object',
      properties: {
        transactions: {
          type: 'array',
          description: 'Lijst van banktransacties',
          items: {
            type: 'object',
          },
        },
        count: {
          type: 'number',
          description: 'Aantal transacties in resultaat',
        },
        totals: {
          type: 'object',
          description: 'Totalen: total_debit, total_credit, net, currency',
        },
        period: {
          type: 'object',
          description: 'Geselecteerde periode: from, to',
        },
        division: {
          type: 'number',
          description: 'Administratie code',
        },
      },
      required: ['transactions', 'count', 'totals', 'period', 'division'],
    },
    annotations: DEFAULT_TOOL_ANNOTATIONS,
  };

  async run(params: Record<string, unknown>): Promise<unknown> {
    const connection = this.getConnection();
    if (!connection) {
      return { error: 'Geen Exact Online connectie gevonden.' };
    }

    // FEATURE-001: Use default division if not specified
    const division = this.resolveDivision(connection, params.division as number | undefined);
    if (!division) {
      return { error: 'Geen administratie opgegeven en geen standaard administratie ingesteld. Gebruik list_divisions om beschikbare administraties te zien.' };
    }

    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (params.from_date && !dateRegex.test(params.from_date as string)) {
      return {
        error: `Ongeldig datumformaat voor from_date: "${params.from_date}". Gebruik YYYY-MM-DD formaat, bijvoorbeeld: "2025-01-01"`,
        hint: 'Datums moeten exact het formaat YYYY-MM-DD hebben, zoals "2025-01-15" voor 15 januari 2025.',
      };
    }
    if (params.to_date && !dateRegex.test(params.to_date as string)) {
      return {
        error: `Ongeldig datumformaat voor to_date: "${params.to_date}". Gebruik YYYY-MM-DD formaat, bijvoorbeeld: "2025-12-31"`,
        hint: 'Datums moeten exact het formaat YYYY-MM-DD hebben, zoals "2025-12-31" voor 31 december 2025.',
      };
    }

    // Default date range: this month
    const today = new Date();
    const defaultFromDate = new Date(today.getFullYear(), today.getMonth(), 1);

    const fromDate = (params.from_date as string) || defaultFromDate.toISOString().split('T')[0];
    const toDate = (params.to_date as string) || today.toISOString().split('T')[0];
    const bankAccount = params.bank_account as string | undefined;

    // Build OData filter
    const filters: string[] = [
      `Date ge datetime'${fromDate}T00:00:00'`,
      `Date le datetime'${toDate}T23:59:59'`,
    ];

    if (bankAccount) {
      filters.push(`BankAccount eq guid'${bankAccount}'`);
    }

    const filterString = encodeURIComponent(filters.join(' and '));

    // Note: GLAccountDescription may not exist as direct field on BankEntryLines
    // Use only confirmed fields to avoid "Invalid request" errors
    const endpoint = `/${division}/financialtransaction/BankEntryLines?$select=ID,Date,Description,AmountDC,GLAccount&$filter=${filterString}&$top=${limit}`;

    const response = await this.exactRequest<{ d: Record<string, unknown> }>(
      connection,
      endpoint
    );

    const transactions = extractODataResults<ExactBankEntry>(response.d);

    // Calculate totals
    let totalDebit = 0;
    let totalCredit = 0;

    const mappedTransactions = transactions.map((tx: ExactBankEntry) => {
      const amount = tx.AmountDC || 0;
      if (amount > 0) {
        totalCredit += amount;
      } else {
        totalDebit += Math.abs(amount);
      }

      return {
        id: tx.ID,
        date: formatExactDate(tx.Date),
        description: tx.Description,
        amount: amount,
        type: amount >= 0 ? 'credit' : 'debit',
        gl_account_id: tx.GLAccount, // GUID - use get_gl_accounts to lookup name
      };
    });

    // Build result with smart context
    const result: Record<string, unknown> = {
      transactions: mappedTransactions,
      count: transactions.length,
      totals: {
        total_debit: totalDebit,
        total_credit: totalCredit,
        net: totalCredit - totalDebit,
        currency: 'EUR',
      },
      period: { from: fromDate, to: toDate },
      division,
    };

    // Add contextual suggestions
    if (transactions.length === 0) {
      result.suggestions = [
        'Geen banktransacties gevonden in deze periode.',
        'Probeer een ander datumbereik.',
        'Controleer of de bankrekening is gekoppeld in Exact Online.',
      ];
    } else {
      const net = totalCredit - totalDebit;
      result.context = {
        summary: `${transactions.length} transacties: €${totalCredit.toFixed(2)} ontvangen, €${totalDebit.toFixed(2)} uitgegeven.`,
        cash_flow: net >= 0
          ? `Positieve kasstroom: €${net.toFixed(2)} meer ontvangen dan uitgegeven.`
          : `Negatieve kasstroom: €${Math.abs(net).toFixed(2)} meer uitgegeven dan ontvangen.`,
      };
    }

    // Suggest related tools
    result.related_tools = [
      { tool: 'get_outstanding_invoices', when: 'Voor openstaande facturen die nog betaald moeten worden' },
      { tool: 'get_cashflow_forecast', when: 'Voor toekomstige liquiditeitsprognose' },
      { tool: 'get_trial_balance', when: 'Voor volledige balans en resultatenrekening' },
    ];

    return result;
  }
}

/**
 * Get GL Accounts Tool
 */
export class GetGLAccountsTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_gl_accounts',
    description:
      'Haal grootboekrekeningen (GL accounts) op uit Exact Online. ' +
      'Gebruik voor: rekeningschema, grootboekstructuur, rekening zoeken, kostenplaatsen. ' +
      'Toont rekeningnummer, naam, type en categorie.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        type: {
          type: 'string',
          enum: ['balance', 'profitloss', 'all'],
          description: 'Type rekening: balance (balans), profitloss (W&V), all (alle). Default: all',
        },
        search: {
          type: 'string',
          description: 'Zoek op naam of rekeningnummer. Optioneel.',
        },
        limit: {
          type: 'number',
          description: 'Maximum aantal resultaten (1-1000). Default: 200',
        },
      },
      required: [],
    },
    // @see MCP-002 in operations/ROADMAP.md
    outputSchema: {
      type: 'object',
      properties: {
        accounts: {
          type: 'array',
          description: 'Lijst van grootboekrekeningen',
        },
        count: {
          type: 'number',
          description: 'Aantal rekeningen in resultaat',
        },
        filters: {
          type: 'object',
          description: 'Toegepaste filters: type, search',
        },
        division: {
          type: 'number',
          description: 'Administratie code',
        },
      },
      required: ['accounts', 'count', 'filters', 'division'],
    },
    annotations: DEFAULT_TOOL_ANNOTATIONS,
  };

  async run(params: Record<string, unknown>): Promise<unknown> {
    const connection = this.getConnection();
    if (!connection) {
      return { error: 'Geen Exact Online connectie gevonden.' };
    }

    // FEATURE-001: Use default division if not specified
    const division = this.resolveDivision(connection, params.division as number | undefined);
    if (!division) {
      return { error: 'Geen administratie opgegeven en geen standaard administratie ingesteld. Gebruik list_divisions om beschikbare administraties te zien.' };
    }

    const type = (params.type as string) || 'all';
    const search = params.search as string | undefined;
    const limit = Math.min(Math.max((params.limit as number) || 200, 1), 1000);

    // Build OData filter
    const filters: string[] = [];

    // Filter by type (B = Balance, W = Profit/Loss)
    if (type === 'balance') {
      filters.push("BalanceSide eq 'B'");
    } else if (type === 'profitloss') {
      filters.push("BalanceSide eq 'W'");
    }

    if (search) {
      // @see EXACT-004 in operations/ROADMAP.md - OData injection prevention
      // Note: Exact Online OData requires 'eq true' suffix for substringof()
      const searchTerm = escapeODataString(search);
      filters.push(`(substringof('${searchTerm}', Description) eq true or substringof('${searchTerm}', Code) eq true)`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';

    const endpoint = `/${division}/financial/GLAccounts?$select=ID,Code,Description,BalanceSide,BalanceType,TypeDescription${filterString}&$top=${limit}`;

    const response = await this.exactRequest<{ d: Record<string, unknown> }>(
      connection,
      endpoint
    );

    const accounts = extractODataResults<ExactGLAccount>(response.d);

    return {
      accounts: accounts.map((acc: ExactGLAccount) => ({
        id: acc.ID,
        code: acc.Code,
        name: acc.Description,
        balance_side: acc.BalanceSide === 'B' ? 'balance' : 'profitloss',
        balance_type: acc.BalanceType,
        type_description: acc.TypeDescription,
      })),
      count: accounts.length,
      filters: { type, search },
      division,
    };
  }
}

/**
 * Get Trial Balance Tool
 */
export class GetTrialBalanceTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_trial_balance',
    description:
      // WAT
      'Haal de proef- en saldibalans (trial balance) op - saldo per grootboekrekening. ' +
      // WANNEER - Vraag-mapping
      'GEBRUIK BIJ: "balans", "activa en passiva", "eigen vermogen", "vermogenspositie", ' +
      '"saldibalans", "proefbalans", "financiële positie", "wat bezitten we", ' +
      '"schulden", "bezittingen", "maandafsluiting", "jaarafsluiting". ' +
      // HOE - Filter guidance
      'PERIODE KEUZE: ' +
      'Geen parameters = huidig jaar, alle periodes. ' +
      'year=2025 = specifiek boekjaar. ' +
      'period=3 = t/m maart (cumulatief). ' +
      // WAT JE KRIJGT
      'RESULTAAT: balansrekeningen (activa, passiva, eigen vermogen) + W&V rekeningen met debet/credit saldi. ' +
      // WAT NIET
      'NIET VOOR: alleen omzet/kosten (gebruik get_profit_loss), ' +
      'cashflow prognose (gebruik get_cashflow_forecast).',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code. Optioneel: zonder = standaard administratie.',
        },
        year: {
          type: 'number',
          description:
            'Boekjaar (bijv. 2025). Zonder = huidig jaar. ' +
            'Gebruik year-1 voor vergelijking met vorig jaar.',
        },
        period: {
          type: 'number',
          description:
            'Periode 1-12 (cumulatief t/m die maand). ' +
            '0 of leeg = heel jaar. ' +
            'Bijv. period=6 = H1 (t/m juni).',
        },
      },
      required: [],
    },
    annotations: DEFAULT_TOOL_ANNOTATIONS,
  };

  async run(params: Record<string, unknown>): Promise<unknown> {
    const connection = this.getConnection();
    if (!connection) {
      return { error: 'Geen Exact Online connectie gevonden.' };
    }

    // FEATURE-001: Use default division if not specified
    const division = this.resolveDivision(connection, params.division as number | undefined);
    if (!division) {
      return { error: 'Geen administratie opgegeven en geen standaard administratie ingesteld. Gebruik list_divisions om beschikbare administraties te zien.' };
    }

    const year = (params.year as number) || new Date().getFullYear();
    const period = (params.period as number) ?? 0;

    // Build filter
    const filters: string[] = [
      `ReportingYear eq ${year}`,
    ];

    if (period > 0) {
      filters.push(`ReportingPeriod eq ${period}`);
    }

    const filterString = encodeURIComponent(filters.join(' and '));

    // ReportingBalance endpoint (no /read/ prefix needed)
    // Note: Field is BalanceType (not BalanceSide) - B=Balance sheet, W=P&L
    const endpoint = `/${division}/financial/ReportingBalance?$select=GLAccount,GLAccountCode,GLAccountDescription,BalanceType,AmountDebit,AmountCredit,Amount&$filter=${filterString}`;

    const response = await this.exactRequest<{ d: Record<string, unknown> }>(
      connection,
      endpoint
    );

    const balances = extractODataResults<ReportingBalanceItem>(response.d);

    // Separate balance sheet and P&L
    const balanceSheet: TrialBalanceEntry[] = [];
    const profitLoss: TrialBalanceEntry[] = [];

    let totalDebit = 0;
    let totalCredit = 0;

    for (const b of balances) {
      const entry = {
        account_code: b.GLAccountCode,
        account_name: b.GLAccountDescription,
        debit: b.AmountDebit || 0,
        credit: b.AmountCredit || 0,
        balance: b.Amount || 0,
      };

      totalDebit += entry.debit;
      totalCredit += entry.credit;

      // BalanceType: 'B' = Balance sheet, 'W' = P&L
      const balanceType = (b as unknown as Record<string, unknown>).BalanceType as string;
      if (balanceType === 'B') {
        balanceSheet.push(entry);
      } else {
        profitLoss.push(entry);
      }
    }

    return {
      balance_sheet: balanceSheet,
      profit_loss: profitLoss,
      totals: {
        total_debit: totalDebit,
        total_credit: totalCredit,
        difference: totalDebit - totalCredit,
        balanced: Math.abs(totalDebit - totalCredit) < 0.01,
      },
      period: {
        year,
        period: period || 'full_year',
        period_description: period > 0 ? `Periode ${period}` : `Heel jaar ${year}`,
      },
      count: balances.length,
      division,
    };
  }
}

/**
 * Cashflow Forecast Response Types
 */
interface CashflowForecastResponse {
  current_balance: number;
  expected_income: number;
  expected_expenses: number;
  forecast_balance: number;
  warning: string | null;
  period: {
    days: number;
    end_date: string;
  };
  details: {
    receivables_count: number;
    payables_count: number;
  };
  division: number;
}

interface BankEntryLine {
  ID: string;
  AmountDC: number;
  Date: string;
}

interface ReceivableItem {
  AccountId: string;
  Amount: number;
  DueDate: string | null;
}

interface PayableItem {
  AccountId: string;
  Amount: number;
  DueDate: string | null;
}

/**
 * Get Cashflow Forecast Tool
 *
 * Generates a cashflow forecast based on current bank balance,
 * outstanding receivables, and outstanding payables.
 */
export class GetCashflowForecastTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_cashflow_forecast',
    description:
      // WAT
      'Genereer cashflow forecast: verwacht banksaldo op basis van openstaande facturen. ' +
      // WANNEER - Vraag-mapping
      'GEBRUIK BIJ: "cashflow", "liquiditeit", "kunnen we dit betalen", "genoeg geld", ' +
      '"cash positie", "werkkapitaal", "geld tekort", "betaalcapaciteit", ' +
      '"financiële ruimte", "hoeveel hebben we over", "rood staan". ' +
      // HOE - Filter guidance
      'KIES forecast_days=30 (default) voor: korte termijn, acute problemen. ' +
      'KIES forecast_days=60 voor: middellange termijn planning. ' +
      'KIES forecast_days=90 voor: kwartaal vooruitkijken. ' +
      // WAT JE KRIJGT
      'RESULTAAT: huidig banksaldo, verwachte inkomsten (debiteuren), verwachte uitgaven (crediteuren), ' +
      'forecast saldo, automatische waarschuwing bij laag/negatief saldo. ' +
      // WAT NIET
      'NIET VOOR: historische transacties (gebruik get_bank_transactions), ' +
      'factuurdetails (gebruik get_outstanding_invoices).',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code. Optioneel: zonder = standaard administratie.',
        },
        forecast_days: {
          type: 'number',
          enum: [30, 60, 90],
          description:
            '30 (default) = komende maand. ' +
            '60 = komende 2 maanden. ' +
            '90 = komend kwartaal. ' +
            'Langere periode = meer onzekerheid.',
        },
      },
      required: [],
    },
    annotations: DEFAULT_TOOL_ANNOTATIONS,
  };

  async run(params: Record<string, unknown>): Promise<CashflowForecastResponse | { error: string }> {
    const connection = this.getConnection();
    if (!connection) {
      return { error: 'Geen Exact Online connectie gevonden.' };
    }

    // FEATURE-001: Use default division if not specified
    const division = this.resolveDivision(connection, params.division as number | undefined);
    if (!division) {
      return { error: 'Geen administratie opgegeven en geen standaard administratie ingesteld. Gebruik list_divisions om beschikbare administraties te zien.' };
    }

    const forecastDays = (params.forecast_days as 30 | 60 | 90) || 30;

    // Calculate forecast end date
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + forecastDays);
    const endDateISO = endDate.toISOString().split('T')[0];

    // Parallel fetch: bank balance, receivables, payables
    const [currentBalance, receivablesData, payablesData] = await Promise.all([
      this.fetchCurrentBalance(division),
      this.fetchReceivables(division, endDateISO),
      this.fetchPayables(division, endDateISO),
    ]);

    // Calculate totals
    const expectedIncome = receivablesData.total;
    const expectedExpenses = payablesData.total;
    const forecastBalance = currentBalance + expectedIncome - expectedExpenses;

    // Generate warning if needed
    const warning = this.generateWarning(forecastBalance, forecastDays);

    return {
      current_balance: currentBalance,
      expected_income: expectedIncome,
      expected_expenses: expectedExpenses,
      forecast_balance: forecastBalance,
      warning,
      period: {
        days: forecastDays,
        end_date: endDateISO,
      },
      details: {
        receivables_count: receivablesData.count,
        payables_count: payablesData.count,
      },
      division,
    };
  }

  /**
   * Fetch current bank balance from BankEntryLines (last 3 months)
   */
  private async fetchCurrentBalance(division: number): Promise<number> {
    const connection = this.getConnection();
    if (!connection) {
      return 0;
    }

    // Get transactions from the last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const fromDate = threeMonthsAgo.toISOString().split('T')[0];

    const filter = encodeURIComponent(`Date ge datetime'${fromDate}'`);
    const endpoint = `/${division}/financialtransaction/BankEntryLines?$select=ID,AmountDC,Date&$filter=${filter}`;

    try {
      const response = await this.exactRequest<{ d: Record<string, unknown> }>(
        connection,
        endpoint
      );

      const transactions = extractODataResults<BankEntryLine>(response.d);

      // Sum all transactions to get current balance
      let balance = 0;
      for (const tx of transactions) {
        balance += tx.AmountDC || 0;
      }

      return balance;
    } catch (error) {
      logger.error('Error fetching bank balance', error instanceof Error ? error : undefined, { tool: 'GetCashflowForecast' });
      return 0;
    }
  }

  /**
   * Fetch receivables (debtors) due within the forecast period
   */
  private async fetchReceivables(
    division: number,
    endDate: string
  ): Promise<{ total: number; count: number }> {
    const connection = this.getConnection();
    if (!connection) {
      return { total: 0, count: 0 };
    }

    const filter = encodeURIComponent(`DueDate le datetime'${endDate}T23:59:59'`);
    const endpoint = `/${division}/read/financial/ReceivablesList?$select=AccountId,Amount,DueDate&$filter=${filter}`;

    try {
      const response = await this.exactRequest<{ d: Record<string, unknown> }>(
        connection,
        endpoint
      );

      const receivables = extractODataResults<ReceivableItem>(response.d);

      let total = 0;
      for (const item of receivables) {
        total += item.Amount || 0;
      }

      return { total, count: receivables.length };
    } catch (error) {
      logger.error('Error fetching receivables', error instanceof Error ? error : undefined, { tool: 'GetCashflowForecast' });
      return { total: 0, count: 0 };
    }
  }

  /**
   * Fetch payables (creditors) due within the forecast period
   */
  private async fetchPayables(
    division: number,
    endDate: string
  ): Promise<{ total: number; count: number }> {
    const connection = this.getConnection();
    if (!connection) {
      return { total: 0, count: 0 };
    }

    const filter = encodeURIComponent(`DueDate le datetime'${endDate}T23:59:59'`);
    const endpoint = `/${division}/read/financial/PayablesList?$select=AccountId,Amount,DueDate&$filter=${filter}`;

    try {
      const response = await this.exactRequest<{ d: Record<string, unknown> }>(
        connection,
        endpoint
      );

      const payables = extractODataResults<PayableItem>(response.d);

      let total = 0;
      for (const item of payables) {
        total += item.Amount || 0;
      }

      return { total, count: payables.length };
    } catch (error) {
      logger.error('Error fetching payables', error instanceof Error ? error : undefined, { tool: 'GetCashflowForecast' });
      return { total: 0, count: 0 };
    }
  }

  /**
   * Generate warning message based on forecast balance
   */
  private generateWarning(forecastBalance: number, forecastDays: number): string | null {
    if (forecastBalance < 0) {
      return `Negatief saldo verwacht over ${forecastDays} dagen. Actie vereist.`;
    }
    if (forecastBalance < 5000) {
      return `Laag saldo verwacht (< EUR 5.000) over ${forecastDays} dagen. Houd rekening met liquiditeit.`;
    }
    return null;
  }
}
