/**
 * Combo Tools (OPT-002)
 *
 * Combined tools that fetch multiple related data sources in a single call.
 * These tools reduce the number of API calls and provide better context for analysis.
 *
 * @see OPT-002 in operations/ROADMAP.md
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import { logger } from '../lib/logger';
import { validateGuid, buildGuidFilter } from '../exact/odata-query';
import type {
  ExactAccount,
  ExactODataResponse,
  ReceivableItem,
  PayableItem,
} from '@exact-mcp/shared';

/**
 * Customer 360 Tool
 *
 * Provides a complete view of a customer including:
 * - Basic info (name, contact, KvK, BTW)
 * - Outstanding invoices (receivables)
 * - Recent sales invoices
 * - Payment behavior summary
 */
export class GetCustomer360Tool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_customer_360',
    description:
      'Haal een compleet klantoverzicht op: basisgegevens, openstaande facturen, recente facturen en betaalgedrag. ' +
      'Gebruik voor: klantanalyse, credit check, debiteurenbeheer, klantgesprek voorbereiding. ' +
      'Combineert data die normaal 3-4 losse API calls zou kosten.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        customer_id: {
          type: 'string',
          description: 'Klant ID (GUID). Verplicht.',
        },
      },
      required: ['customer_id'],
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

    const customerId = params.customer_id as string;

    // Validate GUID format before making API calls
    let validatedCustomerId: string;
    try {
      validatedCustomerId = validateGuid(customerId);
    } catch (error) {
      return { error: `Ongeldig customer_id formaat: ${(error as Error).message}`, division };
    }

    // Fetch all data in parallel for efficiency
    const [customerData, receivables, recentInvoices] = await Promise.all([
      this.fetchCustomer(division, validatedCustomerId),
      this.fetchReceivables(division, validatedCustomerId),
      this.fetchRecentInvoices(division, validatedCustomerId),
    ]);

    if (!customerData) {
      return { error: `Klant met ID ${customerId} niet gevonden.` };
    }

    // Calculate payment behavior metrics
    const paymentBehavior = this.calculatePaymentBehavior(receivables);

    return {
      customer: {
        id: customerData.ID,
        code: customerData.Code,
        name: customerData.Name,
        email: customerData.Email,
        phone: customerData.Phone,
        city: customerData.City,
        country: customerData.Country,
        vat_number: customerData.VATNumber,
        kvk_number: customerData.ChamberOfCommerce,
        is_customer: customerData.IsCustomer,
        is_supplier: customerData.IsSupplier,
        status: customerData.Blocked ? 'blocked' : 'active',
        credit_limit: customerData.CreditLine,
      },
      outstanding: {
        invoices: receivables.map(r => ({
          invoice_number: r.InvoiceNumber,
          amount: r.Amount,
          currency: r.CurrencyCode,
          due_date: r.DueDate?.split('T')[0],
          days_overdue: this.calculateDaysOverdue(r.DueDate),
        })),
        total_amount: receivables.reduce((sum, r) => sum + (r.Amount || 0), 0),
        count: receivables.length,
      },
      recent_invoices: recentInvoices.map(inv => ({
        invoice_number: inv.InvoiceNumber,
        date: inv.InvoiceDate?.split('T')[0],
        amount: inv.AmountDC,
        status: inv.OutstandingAmountDC === 0 ? 'paid' : 'open',
      })),
      payment_behavior: paymentBehavior,
      summary: {
        total_outstanding: receivables.reduce((sum, r) => sum + (r.Amount || 0), 0),
        overdue_amount: receivables
          .filter(r => this.calculateDaysOverdue(r.DueDate) > 0)
          .reduce((sum, r) => sum + (r.Amount || 0), 0),
        average_days_overdue: paymentBehavior.average_days_overdue,
        risk_level: paymentBehavior.risk_level,
      },
      division,
    };
  }

  private async fetchCustomer(division: number, customerId: string): Promise<ExactAccount | null> {
    try {
      // customerId is already validated in run()
      const endpoint = `/${division}/crm/Accounts?$filter=${buildGuidFilter('ID', customerId)}&$select=ID,Code,Name,Email,Phone,City,Country,VATNumber,ChamberOfCommerce,IsCustomer,IsSupplier,Blocked,CreditLine`;
      const response = await this.exactRequest<ExactODataResponse<ExactAccount>>(
        this.getConnection()!,
        endpoint
      );
      const results = extractODataResults<ExactAccount>(response.d as Record<string, unknown>);
      return results[0] || null;
    } catch (error) {
      logger.error('Error fetching customer', error instanceof Error ? error : undefined, { tool: 'GetCustomer360' });
      return null;
    }
  }

  private async fetchReceivables(division: number, customerId: string): Promise<ReceivableItem[]> {
    try {
      // customerId is already validated in run()
      const endpoint = `/${division}/read/financial/ReceivablesList?$filter=${buildGuidFilter('AccountId', customerId)}&$select=AccountId,AccountName,Amount,CurrencyCode,DueDate,InvoiceNumber,InvoiceDate`;
      const response = await this.exactRequest<{ d: Record<string, unknown> }>(
        this.getConnection()!,
        endpoint
      );
      return extractODataResults<ReceivableItem>(response.d);
    } catch (error) {
      logger.error('Error fetching receivables', error instanceof Error ? error : undefined, { tool: 'GetCustomer360' });
      return [];
    }
  }

  private async fetchRecentInvoices(division: number, customerId: string): Promise<Array<{
    InvoiceNumber: string;
    InvoiceDate: string;
    AmountDC: number;
    OutstandingAmountDC: number;
  }>> {
    try {
      // customerId is already validated in run()
      const endpoint = `/${division}/salesinvoice/SalesInvoices?$filter=${buildGuidFilter('InvoiceTo', customerId)}&$select=InvoiceNumber,InvoiceDate,AmountDC,OutstandingAmountDC&$top=10`;
      const response = await this.exactRequest<{ d: Record<string, unknown> }>(
        this.getConnection()!,
        endpoint
      );
      return extractODataResults<{
        InvoiceNumber: string;
        InvoiceDate: string;
        AmountDC: number;
        OutstandingAmountDC: number;
      }>(response.d);
    } catch (error) {
      logger.error('Error fetching recent invoices', error instanceof Error ? error : undefined, { tool: 'GetCustomer360' });
      return [];
    }
  }

  private calculateDaysOverdue(dueDate: string | null | undefined): number {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  private calculatePaymentBehavior(receivables: ReceivableItem[]): {
    average_days_overdue: number;
    max_days_overdue: number;
    on_time_percentage: number;
    risk_level: 'low' | 'medium' | 'high';
  } {
    if (receivables.length === 0) {
      return {
        average_days_overdue: 0,
        max_days_overdue: 0,
        on_time_percentage: 100,
        risk_level: 'low',
      };
    }

    const daysOverdueList = receivables.map(r => this.calculateDaysOverdue(r.DueDate));
    const totalDaysOverdue = daysOverdueList.reduce((sum, d) => sum + d, 0);
    const maxDaysOverdue = Math.max(...daysOverdueList);
    const onTimeCount = daysOverdueList.filter(d => d === 0).length;

    const avgDaysOverdue = Math.round(totalDaysOverdue / receivables.length);
    const onTimePercentage = Math.round((onTimeCount / receivables.length) * 100);

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (avgDaysOverdue > 60 || maxDaysOverdue > 90) {
      riskLevel = 'high';
    } else if (avgDaysOverdue > 30 || maxDaysOverdue > 60) {
      riskLevel = 'medium';
    }

    return {
      average_days_overdue: avgDaysOverdue,
      max_days_overdue: maxDaysOverdue,
      on_time_percentage: onTimePercentage,
      risk_level: riskLevel,
    };
  }
}

/**
 * Financial Snapshot Tool
 *
 * Provides a complete financial overview including:
 * - Trial balance summary (assets, liabilities, equity, revenue, expenses)
 * - Cash position (current bank balance)
 * - Receivables and payables totals
 * - Cashflow forecast
 */
export class GetFinancialSnapshotTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_financial_snapshot',
    description:
      'Haal een compleet financieel overzicht op: balans samenvatting, cash positie, debiteuren/crediteuren, en cashflow prognose. ' +
      'Gebruik voor: management rapportage, financiële gezondheid check, maandafsluiting, directie overleg. ' +
      'Combineert data die normaal 4-5 losse API calls zou kosten.',
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
          description: 'Periode (1-12). Default: huidige maand.',
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
    const period = (params.period as number) || new Date().getMonth() + 1;

    // Fetch all data in parallel
    const [trialBalance, receivables, payables, bankBalance] = await Promise.all([
      this.fetchTrialBalanceSummary(division, year, period),
      this.fetchReceivablesTotal(division),
      this.fetchPayablesTotal(division),
      this.fetchBankBalance(division),
    ]);

    // Calculate key metrics
    const netPosition = (receivables.total || 0) - (payables.total || 0);
    const cashPosition = bankBalance + netPosition;

    // Determine financial health
    const healthStatus = this.assessFinancialHealth(
      bankBalance,
      receivables.total,
      payables.total,
      trialBalance
    );

    return {
      period: {
        year,
        period,
        period_name: this.getPeriodName(period),
      },
      balance_summary: trialBalance,
      cash_position: {
        current_bank_balance: bankBalance,
        total_receivables: receivables.total,
        total_payables: payables.total,
        net_working_capital: netPosition,
        projected_cash: cashPosition,
      },
      receivables: {
        total: receivables.total,
        count: receivables.count,
        overdue: receivables.overdue,
      },
      payables: {
        total: payables.total,
        count: payables.count,
        overdue: payables.overdue,
      },
      health_check: healthStatus,
      division,
    };
  }

  private async fetchTrialBalanceSummary(division: number, year: number, period: number): Promise<{
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
    total_revenue: number;
    total_expenses: number;
    net_result: number;
  }> {
    try {
      // Use /read/financial/ prefix for bulk read endpoints
      const endpoint = `/${division}/read/financial/ReportingBalance?$filter=ReportingYear eq ${year} and ReportingPeriod eq ${period}&$select=GLAccountCode,Amount,BalanceType`;
      const response = await this.exactRequest<{ d: Record<string, unknown> }>(
        this.getConnection()!,
        endpoint
      );

      const results = extractODataResults<{
        GLAccountCode: string;
        Amount: number;
        BalanceType: string;
      }>(response.d);

      // Categorize by account code ranges (Dutch RGS standard)
      let assets = 0, liabilities = 0, equity = 0, revenue = 0, expenses = 0;

      for (const item of results) {
        const code = parseInt(item.GLAccountCode?.charAt(0) || '0');
        const amount = item.Amount || 0;

        // Dutch chart of accounts: 0-1=Assets, 2=Equity, 3-4=Liabilities, 8=Revenue, 4-7=Expenses
        if (code === 0 || code === 1) assets += amount;
        else if (code === 2) equity += amount;
        else if (code === 3) liabilities += amount;
        else if (code === 8) revenue += Math.abs(amount);
        else if (code >= 4 && code <= 7) expenses += amount;
      }

      return {
        total_assets: assets,
        total_liabilities: liabilities,
        total_equity: equity,
        total_revenue: revenue,
        total_expenses: expenses,
        net_result: revenue - expenses,
      };
    } catch (error) {
      logger.error('Error fetching trial balance', error instanceof Error ? error : undefined, { tool: 'GetFinancialSnapshot' });
      return {
        total_assets: 0,
        total_liabilities: 0,
        total_equity: 0,
        total_revenue: 0,
        total_expenses: 0,
        net_result: 0,
      };
    }
  }

  private async fetchReceivablesTotal(division: number): Promise<{
    total: number;
    count: number;
    overdue: number;
  }> {
    try {
      const endpoint = `/${division}/read/financial/ReceivablesList?$select=Amount,DueDate`;
      const response = await this.exactRequest<{ d: Record<string, unknown> }>(
        this.getConnection()!,
        endpoint
      );

      const items = extractODataResults<ReceivableItem>(response.d);
      const today = new Date();
      let overdue = 0;

      for (const item of items) {
        if (item.DueDate && new Date(item.DueDate) < today) {
          overdue += item.Amount || 0;
        }
      }

      return {
        total: items.reduce((sum, i) => sum + (i.Amount || 0), 0),
        count: items.length,
        overdue,
      };
    } catch (error) {
      logger.error('Error fetching receivables', error instanceof Error ? error : undefined, { tool: 'GetFinancialSnapshot' });
      return { total: 0, count: 0, overdue: 0 };
    }
  }

  private async fetchPayablesTotal(division: number): Promise<{
    total: number;
    count: number;
    overdue: number;
  }> {
    try {
      const endpoint = `/${division}/read/financial/PayablesList?$select=Amount,DueDate`;
      const response = await this.exactRequest<{ d: Record<string, unknown> }>(
        this.getConnection()!,
        endpoint
      );

      const items = extractODataResults<PayableItem>(response.d);
      const today = new Date();
      let overdue = 0;

      for (const item of items) {
        if (item.DueDate && new Date(item.DueDate) < today) {
          overdue += item.Amount || 0;
        }
      }

      return {
        total: items.reduce((sum, i) => sum + (i.Amount || 0), 0),
        count: items.length,
        overdue,
      };
    } catch (error) {
      logger.error('Error fetching payables', error instanceof Error ? error : undefined, { tool: 'GetFinancialSnapshot' });
      return { total: 0, count: 0, overdue: 0 };
    }
  }

  private async fetchBankBalance(division: number): Promise<number> {
    try {
      // Get the most recent bank entry to get closing balance
      const endpoint = `/${division}/financialtransaction/BankEntries?$select=ClosingBalanceFC&$top=1`;
      const response = await this.exactRequest<{ d: Record<string, unknown> }>(
        this.getConnection()!,
        endpoint
      );
      const results = extractODataResults<{ ClosingBalanceFC: number }>(response.d);
      return results[0]?.ClosingBalanceFC || 0;
    } catch (error) {
      logger.error('Error fetching bank balance', error instanceof Error ? error : undefined, { tool: 'GetFinancialSnapshot' });
      return 0;
    }
  }

  private getPeriodName(period: number): string {
    const months = [
      'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
      'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
    ];
    return months[period - 1] || `Periode ${period}`;
  }

  private assessFinancialHealth(
    bankBalance: number,
    receivables: number,
    payables: number,
    trialBalance: { net_result: number }
  ): {
    status: 'healthy' | 'attention' | 'critical';
    indicators: string[];
    recommendations: string[];
  } {
    const indicators: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check bank balance
    if (bankBalance > payables) {
      indicators.push('✅ Banksaldo dekt openstaande crediteuren');
      score += 2;
    } else if (bankBalance > payables * 0.5) {
      indicators.push('⚠️ Banksaldo dekt 50-100% van crediteuren');
      recommendations.push('Monitor cashflow nauwlettend');
      score += 1;
    } else {
      indicators.push('❌ Banksaldo onvoldoende voor crediteuren');
      recommendations.push('Urgentie: verbeter liquiditeit');
    }

    // Check receivables vs payables
    if (receivables > payables * 1.5) {
      indicators.push('✅ Gezonde verhouding debiteuren/crediteuren');
      score += 2;
    } else if (receivables > payables) {
      indicators.push('⚠️ Debiteuren net hoger dan crediteuren');
      score += 1;
    } else {
      indicators.push('❌ Crediteuren hoger dan debiteuren');
      recommendations.push('Focus op incasso en debiteurenbeheer');
    }

    // Check profitability
    if (trialBalance.net_result > 0) {
      indicators.push('✅ Positief resultaat');
      score += 2;
    } else {
      indicators.push('❌ Negatief resultaat');
      recommendations.push('Analyseer kosten en omzet');
    }

    let status: 'healthy' | 'attention' | 'critical';
    if (score >= 5) status = 'healthy';
    else if (score >= 3) status = 'attention';
    else status = 'critical';

    if (recommendations.length === 0) {
      recommendations.push('Financiële positie is gezond, blijf monitoren');
    }

    return { status, indicators, recommendations };
  }
}
