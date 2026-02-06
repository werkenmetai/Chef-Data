/**
 * Reporting Tools
 *
 * Tools for financial reporting with fiscal period filtering.
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, formatExactDate, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import { logger } from '../lib/logger';
import type {
  AgingItem,
  TransactionLineItem,
  VATCodeItem,
  BudgetItem,
  ReportingBalanceItem,
} from '@exact-mcp/shared';

/**
 * Get Profit & Loss Overview
 */
export class GetProfitLossTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_profit_loss',
    description:
      // WAT
      'Haal de Winst & Verliesrekening (P&L / resultatenrekening) op. ' +
      // WANNEER - Vraag-mapping
      'GEBRUIK BIJ: "omzet", "kosten", "winst", "verlies", "resultaat", "marge", ' +
      '"hoe doen we het", "zijn we winstgevend", "P&L", "resultatenrekening", ' +
      '"wat hebben we verdiend", "hoeveel omzet", "wat zijn de kosten". ' +
      // HOE - Filter guidance
      'PERIODE KEUZE: ' +
      'Geen parameters = huidig jaar tot nu. ' +
      'year=2025 = heel boekjaar 2025. ' +
      'year + period_from + period_to = specifieke maanden (bijv. Q1: 1-3). ' +
      'period_from=period_to = één specifieke maand. ' +
      // WAT JE KRIJGT
      'RESULTAAT: omzet per categorie, kosten per categorie, brutowinst, nettowinst, percentages. ' +
      // WAT NIET
      'NIET VOOR: balans/activa/passiva (gebruik get_trial_balance), ' +
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
            'Boekjaar (bijv. 2025). ' +
            'Zonder = huidig jaar. ' +
            'Vorig jaar: gebruik year-1 voor vergelijking.',
        },
        period_from: {
          type: 'number',
          description:
            'Startmaand 1-12. ' +
            'Q1=1, Q2=4, Q3=7, Q4=10. ' +
            'Zonder = vanaf januari.',
        },
        period_to: {
          type: 'number',
          description:
            'Eindmaand 1-12. ' +
            'Q1=3, Q2=6, Q3=9, Q4=12. ' +
            'Zonder = t/m december (heel jaar).',
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
    const periodFrom = (params.period_from as number) || 1;
    const periodTo = (params.period_to as number) || 12;

    // P18-FIX: ProfitLossOverview is a summary endpoint without filter support.
    // Use ReportingBalance instead, filtering for P&L accounts (BalanceType eq 'W')
    // Note: Field is BalanceType (not BalanceSide) - B=Balance sheet, W=P&L
    // @see https://documentation.invantive.com/2017R2/exact-online-data-model/
    const filters = [
      `ReportingYear eq ${year}`,
      `ReportingPeriod ge ${periodFrom}`,
      `ReportingPeriod le ${periodTo}`,
      `BalanceType eq 'W'`, // W = P&L accounts (Winst & Verlies)
    ];

    interface PLEntry {
      account_code: string;
      account_name: string;
      amount: number;
    }

    try {
      // Use ReportingBalance with P&L filter (BalanceType eq 'W')
      // This endpoint supports year/period filters and returns GL account details
      // Note: ReportingBalance uses /financial/ path (no /read/ prefix)
      // Note: Field is BalanceType (not BalanceSide)
      const endpoint = `/${division}/financial/ReportingBalance?$select=GLAccountCode,GLAccountDescription,Amount,BalanceType&$filter=${encodeURIComponent(filters.join(' and '))}`;

      const response = await this.exactRequest<{ d: Record<string, unknown> }>(
        connection,
        endpoint
      );

      const items = extractODataResults<ReportingBalanceItem>(response.d);
      const revenue: PLEntry[] = [];
      const costs: PLEntry[] = [];
      let totalRevenue = 0;
      let totalCosts = 0;

      for (const item of items) {
        const entry: PLEntry = {
          account_code: item.GLAccountCode || '',
          account_name: item.GLAccountDescription || '',
          amount: item.Amount || 0,
        };

        // Revenue accounts typically have negative Amount (credit), costs have positive (debit)
        // Without AmountDebit/AmountCredit, use sign of Amount
        if ((item.Amount || 0) < 0) {
          revenue.push(entry);
          totalRevenue += Math.abs(item.Amount || 0);
        } else {
          costs.push(entry);
          totalCosts += Math.abs(item.Amount || 0);
        }
      }

      const periodDescription = periodFrom === 1 && periodTo === 12
        ? `Heel jaar ${year}`
        : `Periode ${periodFrom}-${periodTo} van ${year}`;

      return {
        division,
        revenue: { items: revenue, total: totalRevenue },
        costs: { items: costs, total: totalCosts },
        summary: {
          total_revenue: totalRevenue,
          total_costs: totalCosts,
          gross_profit: totalRevenue - totalCosts,
        },
        period: { year, from: periodFrom, to: periodTo, description: periodDescription },
        currency: 'EUR',
      };
    } catch (error) {
      logger.error('GetProfitLoss failed', error instanceof Error ? error : undefined, { division, tool: 'get_profit_loss' });
      throw error;
    }
  }
}

/**
 * Get Revenue Analysis
 */
export class GetRevenueTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_revenue',
    description:
      // WAT
      'Haal omzetgegevens per jaar op, uitgesplitst per maand en grootboekrekening. ' +
      // WANNEER - Vraag-mapping
      'GEBRUIK BIJ: "omzet per maand", "omzetontwikkeling", "omzet dit jaar", ' +
      '"vergelijk met vorig jaar", "maandomzet", "omzetgroei", "sales trend", ' +
      '"hoeveel omzet in [maand]", "omzetcijfers". ' +
      // HOE - Filter guidance
      'KIES compare_previous_year=true voor: jaar-op-jaar vergelijking, groei analyse. ' +
      'KIES year=2024 voor: specifiek boekjaar. ' +
      'Zonder parameters: huidig jaar. ' +
      // WAT JE KRIJGT
      'RESULTAAT: omzet per grootboekrekening met maanduitsplitsing (period_1 t/m period_12), totalen. ' +
      // WAT NIET
      'NIET VOOR: kosten analyse (gebruik get_profit_loss), ' +
      'alleen totale winst (gebruik get_profit_loss).',
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
            'TIP: Gebruik met compare_previous_year=true voor groei analyse.',
        },
        compare_previous_year: {
          type: 'boolean',
          description:
            'true = inclusief vergelijking met vorig jaar (year-1). ' +
            'false (default) = alleen gevraagd jaar. ' +
            'Gebruik voor: "groei t.o.v. vorig jaar", "ontwikkeling".',
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
    const comparePrevious = params.compare_previous_year === true;

    try {
      // Use RevenueListByYear endpoint - returns revenue by GL account
      // API-001 FIX: Include GLAccountCode and GLAccountDescription
      const endpoint = `/${division}/read/financial/RevenueListByYear?year=${year}`;

      const response = await this.exactRequest<{ d: Record<string, unknown> }>(
        connection,
        endpoint
      );

      // API-001: Full interface matching RevenueListItem from shared types
      interface RevenueItem {
        GLAccount: string;
        GLAccountCode: string;
        GLAccountDescription: string;
        Amount: number;
        Year: number;
      }
      const items = extractODataResults<RevenueItem>(response.d);
      let totalRevenue = 0;

      // Group by GL account with code and description
      const revenueByAccount: {
        gl_account_code: string;
        gl_account_name: string;
        amount: number;
      }[] = items.map((item) => {
        totalRevenue += item.Amount || 0;
        return {
          gl_account_code: item.GLAccountCode || '',
          gl_account_name: item.GLAccountDescription || '',
          amount: item.Amount || 0,
        };
      });

      // Sort by amount descending (highest revenue first)
      revenueByAccount.sort((a, b) => b.amount - a.amount);

      const result: {
        division: number;
        total_revenue: number;
        revenue_by_account: { gl_account_code: string; gl_account_name: string; amount: number }[];
        year: number;
        currency: string;
        previous_year?: { year: number; total_revenue: number };
        comparison?: { difference: number; percentage_change: string };
      } = {
        division,
        total_revenue: totalRevenue,
        revenue_by_account: revenueByAccount,
        year,
        currency: 'EUR',
      };

      // Compare with previous year if requested
      if (comparePrevious) {
        const prevEndpoint = `/${division}/read/financial/RevenueListByYear?year=${year - 1}`;
        try {
          const prevResponse = await this.exactRequest<{ d: Record<string, unknown> }>(
            connection,
            prevEndpoint
          );
          // Same interface as main query
          interface PrevRevenueItem { GLAccount: string; GLAccountCode: string; GLAccountDescription: string; Amount: number; Year: number; }
          const prevItems = extractODataResults<PrevRevenueItem>(prevResponse.d);
          let prevTotalRevenue = 0;
          for (const item of prevItems) {
            prevTotalRevenue += item.Amount || 0;
          }
          result.previous_year = { year: year - 1, total_revenue: prevTotalRevenue };
          result.comparison = {
            difference: totalRevenue - prevTotalRevenue,
            percentage_change: prevTotalRevenue !== 0
              ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue * 100).toFixed(1) + '%'
              : 'N/A',
          };
        } catch (error) {
          logger.warn('GetRevenue previous year comparison failed', { division, tool: 'get_revenue', errorMessage: error instanceof Error ? error.message : String(error) });
        }
      }

      return result;
    } catch (error) {
      logger.error('GetRevenue failed', error instanceof Error ? error : undefined, { division, tool: 'get_revenue' });
      throw error;
    }
  }
}

/**
 * Get Aging Analysis
 */
export class GetAgingAnalysisTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_aging_analysis',
    description:
      'Haal ouderdomsanalyse (aging) op voor debiteuren of crediteuren. ' +
      'Gebruik voor: debiteurenbeheer, kredietrisico, incasso prioritering, betalingsgedrag. ' +
      'Toont openstaande bedragen per ouderdomscategorie (0-30, 30-60, 60-90, 90+ dagen).',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        type: {
          type: 'string',
          enum: ['receivables', 'payables'],
          description: 'Type: receivables (debiteuren) of payables (crediteuren). Default: receivables',
        },
        group_by_account: {
          type: 'boolean',
          description: 'Groepeer per klant/leverancier. Default: false (totalen per age group).',
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

    const type = (params.type as string) || 'receivables';
    const groupByAccount = params.group_by_account === true;

    interface AgingAccountEntry {
      account_id: string;
      account_code: string;
      account_name: string;
      age_groups: Record<string, number>;
      total: number;
    }

    try {
      let endpoint: string;

      // Use /read/financial/ prefix for bulk read endpoints
      if (type === 'receivables') {
        endpoint = groupByAccount
          ? `/${division}/read/financial/AgingReceivablesListByAgeGroup`
          : `/${division}/read/financial/AgingReceivablesList`;
      } else {
        endpoint = groupByAccount
          ? `/${division}/read/financial/AgingPayablesListByAgeGroup`
          : `/${division}/read/financial/AgingPayablesList`;
      }

      const response = await this.exactRequest<{ d: Record<string, unknown> }>(
        connection,
        endpoint
      );

      const items = extractODataResults<AgingItem>(response.d);

      if (groupByAccount) {
        // Grouped by account and age group
        const byAccount: Record<string, AgingAccountEntry> = {};

        for (const item of items) {
          const accountId = item.AccountId;

          if (!byAccount[accountId]) {
            byAccount[accountId] = {
              account_id: accountId,
              account_code: item.AccountCode,
              account_name: item.AccountName,
              age_groups: {},
              total: 0,
            };
          }

          byAccount[accountId].age_groups[item.AgeGroup?.toString() || 'unknown'] = item.Amount || 0;
          byAccount[accountId].total += item.Amount || 0;
        }

        return {
          division,
          type,
          by_account: Object.values(byAccount),
          count: Object.keys(byAccount).length,
        };
      } else {
        // Summary by age group
        const ageGroups: Record<string, number> = {
          'current': 0,
          '30_60': 0,
          '60_90': 0,
          '90_plus': 0,
        };
        let total = 0;

        for (const item of items) {
          total += item.Amount || 0;

          const days = item.DaysOutstanding || 0;
          if (days <= 30) {
            ageGroups.current += item.Amount || 0;
          } else if (days <= 60) {
            ageGroups['30_60'] += item.Amount || 0;
          } else if (days <= 90) {
            ageGroups['60_90'] += item.Amount || 0;
          } else {
            ageGroups['90_plus'] += item.Amount || 0;
          }
        }

        return {
          division,
          type,
          age_groups: {
            '0-30 dagen': ageGroups.current,
            '30-60 dagen': ageGroups['30_60'],
            '60-90 dagen': ageGroups['60_90'],
            '90+ dagen': ageGroups['90_plus'],
          },
          total,
          currency: 'EUR',
        };
      }
    } catch (error) {
      logger.error('GetAgingAnalysis failed', error instanceof Error ? error : undefined, { division, tool: 'get_aging_analysis' });
      throw error;
    }
  }
}

/**
 * Get Journal Entries / Transaction Lines
 */
export class GetTransactionsTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_transactions',
    description:
      'Haal boekingsregels/journaalposten (transaction lines) op. ' +
      'GEBRUIK BIJ: mutaties, journaalposten, grootboekanalyse, kostenplaatsen, kostendragers. ' +
      'VOORBEELD: {"year": 2025, "period": 1} of {"from_date": "2025-01-01", "to_date": "2025-01-31"}',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code. Optioneel (standaard administratie wordt gebruikt).',
        },
        year: {
          type: 'number',
          description: 'Boekjaar (bijv. 2025). Default: huidig jaar.',
        },
        period: {
          type: 'number',
          description: 'Periode 1-12 (januari=1, december=12). Optioneel.',
        },
        gl_account: {
          type: 'string',
          description: 'Grootboekrekening ID (GUID). Gebruik get_gl_accounts om ID te vinden.',
        },
        journal: {
          type: 'string',
          description: 'Dagboekcode (bijv. "70" voor verkoop). Optioneel.',
        },
        from_date: {
          type: 'string',
          description: 'Begindatum. FORMAAT: "YYYY-MM-DD" (bijv. "2025-01-01"). GEEN andere formaten!',
        },
        to_date: {
          type: 'string',
          description: 'Einddatum. FORMAAT: "YYYY-MM-DD" (bijv. "2025-12-31"). GEEN andere formaten!',
        },
        limit: {
          type: 'number',
          description: 'Maximum resultaten (1-1000, default: 100).',
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

    const year = params.year as number | undefined;
    const period = params.period as number | undefined;
    const glAccount = params.gl_account as string | undefined;
    const journal = params.journal as string | undefined;
    const fromDate = params.from_date as string | undefined;
    const toDate = params.to_date as string | undefined;
    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 1000);

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (fromDate && !dateRegex.test(fromDate)) {
      return {
        error: `Ongeldig datumformaat voor from_date: "${fromDate}". Gebruik YYYY-MM-DD formaat, bijvoorbeeld: "2025-01-01"`,
        hint: 'Datums moeten exact het formaat YYYY-MM-DD hebben, zoals "2025-01-15" voor 15 januari 2025.',
      };
    }
    if (toDate && !dateRegex.test(toDate)) {
      return {
        error: `Ongeldig datumformaat voor to_date: "${toDate}". Gebruik YYYY-MM-DD formaat, bijvoorbeeld: "2025-12-31"`,
        hint: 'Datums moeten exact het formaat YYYY-MM-DD hebben, zoals "2025-12-31" voor 31 december 2025.',
      };
    }

    // Build filters
    const filters: string[] = [];

    if (year) {
      filters.push(`FinancialYear eq ${year}`);
    }

    if (period) {
      filters.push(`FinancialPeriod eq ${period}`);
    }

    if (glAccount) {
      filters.push(`GLAccount eq guid'${glAccount}'`);
    }

    if (journal) {
      filters.push(`JournalCode eq '${journal}'`);
    }

    // Note: OData datetime requires time component (T00:00:00)
    // @see LESSONS-LEARNED.md - OData datetime vereist tijdcomponent
    if (fromDate) {
      filters.push(`Date ge datetime'${fromDate}T00:00:00'`);
    }

    if (toDate) {
      filters.push(`Date le datetime'${toDate}T23:59:59'`);
    }

    const filterString = filters.length > 0
      ? `&$filter=${encodeURIComponent(filters.join(' and '))}`
      : '';

    interface TransactionEntry {
      id: string;
      date: string | undefined;
      year: number;
      period: number;
      journal: string;
      invoice_number: number | null;
      description: string;
      gl_account_code: string;
      gl_account_name: string;
      amount: number;
      type: 'debit' | 'credit';
    }

    try {
      // Note: Use only confirmed fields from search_transactions that work
      // VATAmountDC, EntryNumber, CostCenter/CostUnit fields may not exist
      const endpoint = `/${division}/financialtransaction/TransactionLines?$select=ID,Date,FinancialYear,FinancialPeriod,JournalCode,Description,GLAccount,GLAccountCode,GLAccountDescription,AmountDC,InvoiceNumber${filterString}&$top=${limit}`;

      const response = await this.exactRequest<{ d: Record<string, unknown> }>(
        connection,
        endpoint
      );

      const items = extractODataResults<TransactionLineItem>(response.d);

      let totalDebit = 0;
      let totalCredit = 0;

      const transactions: TransactionEntry[] = items.map((item) => {
        const amount = item.AmountDC || 0;
        if (amount > 0) {
          totalDebit += amount;
        } else {
          totalCredit += Math.abs(amount);
        }

        return {
          id: item.ID,
          date: formatExactDate(item.Date),
          year: item.FinancialYear,
          period: item.FinancialPeriod,
          journal: item.JournalCode,
          invoice_number: item.InvoiceNumber,
          description: item.Description,
          gl_account_code: item.GLAccountCode,
          gl_account_name: item.GLAccountDescription,
          amount: amount,
          type: (amount >= 0 ? 'debit' : 'credit') as 'debit' | 'credit',
        };
      });

      return {
        division,
        transactions,
        count: transactions.length,
        totals: {
          total_debit: totalDebit,
          total_credit: totalCredit,
          balance: totalDebit - totalCredit,
          currency: 'EUR',
        },
        filters: {
          year,
          period,
          gl_account: glAccount,
          journal,
          from_date: fromDate,
          to_date: toDate,
        },
      };
    } catch (error) {
      logger.error('GetTransactions failed', error instanceof Error ? error : undefined, { division, tool: 'get_transactions' });
      throw error;
    }
  }
}

/**
 * Get VAT Summary
 */
export class GetVATSummaryTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_vat_summary',
    description:
      'Haal BTW-overzicht op per periode. ' +
      'Gebruik voor: BTW-aangifte voorbereiding, BTW-controle, te betalen/vorderen BTW. ' +
      'Toont BTW bedragen per BTW-code.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        year: {
          type: 'number',
          description: 'Boekjaar. Default: huidig jaar.',
        },
        period: {
          type: 'number',
          description: 'Specifieke periode (1-12). Optioneel - zonder geeft heel jaar.',
        },
        quarter: {
          type: 'number',
          description: 'Kwartaal (1-4). Optioneel - alternatief voor period.',
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
    const period = params.period as number | undefined;
    const quarter = params.quarter as number | undefined;

    // Build period filter
    let periodFilter = `FinancialYear eq ${year}`;
    let periodDescription = `Jaar ${year}`;

    if (period) {
      periodFilter += ` and FinancialPeriod eq ${period}`;
      periodDescription = `Periode ${period} van ${year}`;
    } else if (quarter) {
      const startPeriod = (quarter - 1) * 3 + 1;
      const endPeriod = quarter * 3;
      periodFilter += ` and FinancialPeriod ge ${startPeriod} and FinancialPeriod le ${endPeriod}`;
      periodDescription = `Q${quarter} ${year}`;
    }

    interface VATLineEntry {
      code: string;
      description: string;
      base: number;
      vat: number;
      percentage: number;
    }

    try {
      // First get VAT codes for this division
      // Note: VATPercentages might not be a valid field - use only Code and Description
      const vatCodesEndpoint = `/${division}/vat/VATCodes?$select=Code,Description&$top=100`;
      let vatCodes = new Map<string, string>();
      try {
        const vatCodesResponse = await this.exactRequest<{ d: Record<string, unknown> }>(
          connection,
          vatCodesEndpoint
        );
        const vatCodesItems = extractODataResults<VATCodeItem>(vatCodesResponse.d);
        for (const vc of vatCodesItems) {
          vatCodes.set(vc.Code, vc.Description);
        }
      } catch (error) {
        // If VATCodes fails, continue without code descriptions
        logger.warn('VATCodes lookup failed, continuing without descriptions', { division, tool: 'get_vat_summary' });
      }

      // Get transaction lines with VAT
      // Note: VATAmountDC doesn't exist - use AmountVATFC instead
      const fullFilter = `${periodFilter} and AmountVATFC ne 0`;
      const endpoint = `/${division}/financialtransaction/TransactionLines?$select=VATCode,AmountVATFC,AmountFC,VATPercentage&$filter=${encodeURIComponent(fullFilter)}`;

      const response = await this.exactRequest<{ d: Record<string, unknown> }>(
        connection,
        endpoint
      );

      const items = extractODataResults<TransactionLineItem>(response.d);

      // Aggregate by VAT code
      const vatSummary: Record<string, VATLineEntry> = {};

      for (const item of items) {
        const code = item.VATCode || 'unknown';

        if (!vatSummary[code]) {
          vatSummary[code] = {
            code,
            description: vatCodes.get(code) || 'Onbekend',
            base: 0,
            vat: 0,
            percentage: item.VATPercentage || 0,
          };
        }

        const itemRecord = item as unknown as Record<string, unknown>;
        vatSummary[code].base += ((itemRecord.AmountFC as number) || 0) - ((itemRecord.AmountVATFC as number) || 0);
        vatSummary[code].vat += (itemRecord.AmountVATFC as number) || 0;
      }

      const vatLines = Object.values(vatSummary).sort((a, b) => a.code.localeCompare(b.code));

      let totalBase = 0;
      let totalVAT = 0;
      for (const line of vatLines) {
        totalBase += line.base;
        totalVAT += line.vat;
      }

      return {
        division,
        vat_lines: vatLines,
        totals: {
          total_base: totalBase,
          total_vat: totalVAT,
          currency: 'EUR',
        },
        period: {
          year,
          period,
          quarter,
          description: periodDescription,
        },
      };
    } catch (error) {
      logger.error('GetVATSummary failed', error instanceof Error ? error : undefined, { division, tool: 'get_vat_summary' });
      throw error;
    }
  }
}

/**
 * Get Budget vs Actual
 */
export class GetBudgetComparisonTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_budget_comparison',
    description:
      'Vergelijk begroting (budget) met werkelijke cijfers. ' +
      'Gebruik voor: budget controle, afwijkingsanalyse, financiële planning review. ' +
      'Toont budget, werkelijk en verschil per grootboekrekening.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        year: {
          type: 'number',
          description: 'Boekjaar. Default: huidig jaar.',
        },
        period_from: {
          type: 'number',
          description: 'Start periode (1-12). Default: 1.',
        },
        period_to: {
          type: 'number',
          description: 'Eind periode (1-12). Default: huidige maand.',
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
    const periodFrom = (params.period_from as number) || 1;
    const periodTo = (params.period_to as number) || new Date().getMonth() + 1;

    interface BudgetComparisonEntry {
      account_code: string;
      account_name: string;
      budget: number;
      actual: number;
      variance: number;
      variance_percent: string;
    }

    try {
      // Get budget data
      const budgetEndpoint = `/${division}/budget/Budgets?$filter=${encodeURIComponent(`ReportingYear eq ${year} and ReportingPeriod ge ${periodFrom} and ReportingPeriod le ${periodTo}`)}&$select=GLAccount,GLAccountCode,GLAccountDescription,AmountDC,ReportingPeriod`;

      let budgetItems: BudgetItem[] = [];
      try {
        const budgetResponse = await this.exactRequest<{ d: Record<string, unknown> }>(
          connection,
          budgetEndpoint
        );
        budgetItems = extractODataResults<BudgetItem>(budgetResponse.d);
      } catch (error) {
        logger.info('GetBudgetComparison no budget data available', { division, tool: 'get_budget_comparison' });
      }

      // Get actual data from ReportingBalance (use /read/financial/ prefix for bulk read endpoints)
      const actualEndpoint = `/${division}/read/financial/ReportingBalance?$filter=${encodeURIComponent(`ReportingYear eq ${year} and ReportingPeriod ge ${periodFrom} and ReportingPeriod le ${periodTo}`)}&$select=GLAccount,GLAccountCode,GLAccountDescription,Amount`;

      const actualResponse = await this.exactRequest<{ d: Record<string, unknown> }>(
        connection,
        actualEndpoint
      );
      const actualItems = extractODataResults<ReportingBalanceItem>(actualResponse.d);

      // Aggregate by GL Account
      const comparison: Record<string, BudgetComparisonEntry> = {};

      // Add budget amounts
      for (const item of budgetItems) {
        const code = item.GLAccountCode;
        if (!comparison[code]) {
          comparison[code] = {
            account_code: code,
            account_name: item.GLAccountDescription,
            budget: 0,
            actual: 0,
            variance: 0,
            variance_percent: '0%',
          };
        }
        comparison[code].budget += item.AmountDC || 0;
      }

      // Add actual amounts
      for (const item of actualItems) {
        const code = item.GLAccountCode;
        if (!comparison[code]) {
          comparison[code] = {
            account_code: code,
            account_name: item.GLAccountDescription,
            budget: 0,
            actual: 0,
            variance: 0,
            variance_percent: '0%',
          };
        }
        comparison[code].actual += item.Amount || 0;
      }

      // Calculate variances
      let totalBudget = 0;
      let totalActual = 0;

      for (const entry of Object.values(comparison)) {
        entry.variance = entry.actual - entry.budget;
        entry.variance_percent = entry.budget !== 0
          ? ((entry.variance / entry.budget) * 100).toFixed(1) + '%'
          : 'N/A';
        totalBudget += entry.budget;
        totalActual += entry.actual;
      }

      const periodDescription = `Periode ${periodFrom}-${periodTo} van ${year}`;

      return {
        division,
        comparison: Object.values(comparison).sort((a, b) => a.account_code.localeCompare(b.account_code)),
        totals: {
          budget: totalBudget,
          actual: totalActual,
          variance: totalActual - totalBudget,
          variance_percent: totalBudget !== 0
            ? (((totalActual - totalBudget) / totalBudget) * 100).toFixed(1) + '%'
            : 'N/A',
        },
        period: {
          year,
          from: periodFrom,
          to: periodTo,
          description: periodDescription,
        },
        currency: 'EUR',
      };
    } catch (error) {
      logger.error('GetBudgetComparison failed', error instanceof Error ? error : undefined, { division, tool: 'get_budget_comparison' });
      throw error;
    }
  }
}

/**
 * Get Aging Receivables Tool - Ouderdomsanalyse debiteuren
 * Shows receivables grouped by age (0-30, 31-60, 61-90, 90+ days)
 */
export class GetAgingReceivablesTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_aging_receivables',
    description:
      // WAT
      'Ouderdomsanalyse van DEBITEUREN (klanten die moeten betalen) per leeftijdscategorie. ' +
      // WANNEER - Vraag-mapping
      'GEBRUIK BIJ: "hoeveel staat er open bij klanten", "debiteuren aging", "oude vorderingen", ' +
      '"wie betaalt te laat", "incasso overzicht", "DSO analyse", "betalingsgedrag klanten", ' +
      '"cashflow risico", "kredietrisico". ' +
      // WAT JE KRIJGT
      'RESULTAAT: totalen per periode (0-30, 31-60, 61-90, 90+ dagen) met aantallen en bedragen. ' +
      // WAT NIET
      'NIET VOOR: individuele facturen (gebruik get_outstanding_invoices), ' +
      'crediteuren/leveranciers (gebruik get_aging_payables).',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code. Optioneel: zonder = standaard administratie.',
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

    // Use ReceivablesList which is the working endpoint
    // Calculate age groups client-side based on DueDate
    try {
      const endpoint = `/${division}/read/financial/ReceivablesList?$select=AccountId,AccountCode,AccountName,Amount,DueDate,InvoiceNumber,CurrencyCode`;

      const response = await this.exactRequest<{ d: Record<string, unknown> }>(
        connection,
        endpoint
      );

      interface AgingReceivableItem {
        AccountId: string;
        AccountCode: string;
        AccountName: string;
        Amount: number;
        DueDate: string | null;
        InvoiceNumber: string;
        CurrencyCode: string;
      }

      const items = extractODataResults<AgingReceivableItem>(response.d);
      const today = new Date();

      // Calculate age groups client-side
      const ageGroups: Record<string, { amount: number; count: number }> = {
        '0-30 dagen': { amount: 0, count: 0 },
        '31-60 dagen': { amount: 0, count: 0 },
        '61-90 dagen': { amount: 0, count: 0 },
        '90+ dagen': { amount: 0, count: 0 },
      };

      let totalAmount = 0;
      let totalCount = 0;

      for (const item of items) {
        const amount = item.Amount || 0;
        totalAmount += amount;
        totalCount++;

        // Calculate days overdue
        let daysOverdue = 0;
        if (item.DueDate) {
          const msDateMatch = item.DueDate.match(/^\/Date\((\d+)\)\/$/);
          const dueDate = msDateMatch
            ? new Date(parseInt(msDateMatch[1], 10))
            : new Date(item.DueDate);
          daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Categorize by age
        if (daysOverdue <= 30) {
          ageGroups['0-30 dagen'].amount += amount;
          ageGroups['0-30 dagen'].count++;
        } else if (daysOverdue <= 60) {
          ageGroups['31-60 dagen'].amount += amount;
          ageGroups['31-60 dagen'].count++;
        } else if (daysOverdue <= 90) {
          ageGroups['61-90 dagen'].amount += amount;
          ageGroups['61-90 dagen'].count++;
        } else {
          ageGroups['90+ dagen'].amount += amount;
          ageGroups['90+ dagen'].count++;
        }
      }

      return {
        division,
        age_groups: Object.entries(ageGroups).map(([description, data]) => ({
          age_description: description,
          amount: data.amount,
          count: data.count,
          currency: 'EUR',
        })),
        totals: {
          total_amount: totalAmount,
          total_count: totalCount,
          currency: 'EUR',
        },
        description: 'Ouderdomsanalyse debiteuren - toont openstaande vorderingen per leeftijdscategorie',
      };
    } catch (error) {
      logger.error('GetAgingReceivables failed', error instanceof Error ? error : undefined, { division, tool: 'get_aging_receivables' });
      throw error;
    }
  }
}

/**
 * Get Aging Payables Tool - Ouderdomsanalyse crediteuren
 * Shows payables grouped by age (0-30, 31-60, 61-90, 90+ days)
 */
export class GetAgingPayablesTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_aging_payables',
    description:
      // WAT
      'Ouderdomsanalyse van CREDITEUREN (leveranciers die betaald moeten worden) per leeftijdscategorie. ' +
      // WANNEER - Vraag-mapping
      'GEBRUIK BIJ: "hoeveel moeten we betalen", "crediteuren aging", "oude schulden", ' +
      '"betalingsachterstand leveranciers", "wat staat er open", "liquiditeitsplanning", ' +
      '"betalingsprioriteiten", "welke leveranciers wachten". ' +
      // WAT JE KRIJGT
      'RESULTAAT: totalen per periode (0-30, 31-60, 61-90, 90+ dagen) met aantallen en bedragen. ' +
      // WAT NIET
      'NIET VOOR: individuele facturen (gebruik get_outstanding_invoices type=payable), ' +
      'debiteuren/klanten (gebruik get_aging_receivables).',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code. Optioneel: zonder = standaard administratie.',
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

    // Use PayablesList which is the working endpoint
    // Calculate age groups client-side based on DueDate
    try {
      const endpoint = `/${division}/read/financial/PayablesList?$select=AccountId,AccountCode,AccountName,Amount,DueDate,InvoiceNumber,CurrencyCode`;

      const response = await this.exactRequest<{ d: Record<string, unknown> }>(
        connection,
        endpoint
      );

      interface AgingPayableItem {
        AccountId: string;
        AccountCode: string;
        AccountName: string;
        Amount: number;
        DueDate: string | null;
        InvoiceNumber: string;
        CurrencyCode: string;
      }

      const items = extractODataResults<AgingPayableItem>(response.d);
      const today = new Date();

      // Calculate age groups client-side
      const ageGroups: Record<string, { amount: number; count: number }> = {
        '0-30 dagen': { amount: 0, count: 0 },
        '31-60 dagen': { amount: 0, count: 0 },
        '61-90 dagen': { amount: 0, count: 0 },
        '90+ dagen': { amount: 0, count: 0 },
      };

      let totalAmount = 0;
      let totalCount = 0;

      for (const item of items) {
        const amount = item.Amount || 0;
        totalAmount += amount;
        totalCount++;

        // Calculate days overdue
        let daysOverdue = 0;
        if (item.DueDate) {
          const msDateMatch = item.DueDate.match(/^\/Date\((\d+)\)\/$/);
          const dueDate = msDateMatch
            ? new Date(parseInt(msDateMatch[1], 10))
            : new Date(item.DueDate);
          daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Categorize by age
        if (daysOverdue <= 30) {
          ageGroups['0-30 dagen'].amount += amount;
          ageGroups['0-30 dagen'].count++;
        } else if (daysOverdue <= 60) {
          ageGroups['31-60 dagen'].amount += amount;
          ageGroups['31-60 dagen'].count++;
        } else if (daysOverdue <= 90) {
          ageGroups['61-90 dagen'].amount += amount;
          ageGroups['61-90 dagen'].count++;
        } else {
          ageGroups['90+ dagen'].amount += amount;
          ageGroups['90+ dagen'].count++;
        }
      }

      return {
        division,
        age_groups: Object.entries(ageGroups).map(([description, data]) => ({
          age_description: description,
          amount: data.amount,
          count: data.count,
          currency: 'EUR',
        })),
        totals: {
          total_amount: totalAmount,
          total_count: totalCount,
          currency: 'EUR',
        },
        description: 'Ouderdomsanalyse crediteuren - toont openstaande schulden per leeftijdscategorie',
      };
    } catch (error) {
      logger.error('GetAgingPayables failed', error instanceof Error ? error : undefined, { division, tool: 'get_aging_payables' });
      throw error;
    }
  }
}
