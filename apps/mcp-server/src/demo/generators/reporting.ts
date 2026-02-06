/**
 * Demo Generators: Reporting tools
 *
 * Returns demo data for all reporting-related tools.
 */

import { getCurrentIndustryConfig } from '../context';
import {
  getRevenue,
  getProfitLoss,
  getAgingAnalysis,
  getVATSummary,
  getBudgetComparison,
  getTransactionLines,
} from '../data/reporting';

/**
 * Generate response for get_revenue tool
 */
export function generateGetRevenueResponse(
  params: Record<string, unknown>
): unknown {
  const year = (params.year as number) || new Date().getFullYear();

  const data = getRevenue({ year });

  // API-001: Convert byCategory to revenue_by_account format (matches real API)
  const revenueByAccount = Object.entries(data.byCategory).map(([name, amount]) => ({
    gl_account_code: name === 'Brood & Banket' ? '8000' :
                     name === 'Taarten' ? '8010' :
                     name === 'Gebak' ? '8020' :
                     name === 'Dranken' ? '8030' :
                     name === 'Cateringdiensten' ? '8040' : '8099',
    gl_account_name: `Omzet ${name}`,
    amount: amount,
  }));

  // Sort by amount descending
  revenueByAccount.sort((a, b) => b.amount - a.amount);

  return {
    division: getCurrentIndustryConfig().division.code,
    total_revenue: data.total,
    revenue_by_account: revenueByAccount,
    year: year,
    currency: 'EUR',
    _demo: true,
    context: {
      summary: `Totale omzet: EUR ${data.total.toLocaleString('nl-NL')}. ${revenueByAccount[0].gl_account_name} is de grootste categorie (${Math.round((revenueByAccount[0].amount / data.total) * 100)}%).`,
    },
    related_tools: [
      { tool: 'get_profit_loss', when: 'Voor winst/verlies overzicht' },
      { tool: 'get_outstanding_invoices', when: 'Voor openstaande facturen' },
    ],
  };
}

/**
 * Generate response for get_profit_loss tool
 */
export function generateGetProfitLossResponse(
  params: Record<string, unknown>
): unknown {
  const year = params.year as number | undefined;
  const quarter = params.quarter as 1 | 2 | 3 | 4 | undefined;

  const data = getProfitLoss({ year, quarter });

  return {
    period: {
      year: year || new Date().getFullYear(),
      quarter: quarter || 'YTD',
    },
    revenue: {
      total: data.revenue.total,
      breakdown: data.revenue.breakdown,
    },
    cost_of_goods_sold: {
      total: data.costOfGoods.total,
      breakdown: data.costOfGoods.breakdown,
    },
    gross_profit: data.grossProfit,
    gross_margin_percentage: data.grossMargin,
    operating_expenses: {
      total: data.operatingExpenses.total,
      breakdown: data.operatingExpenses.breakdown,
    },
    operating_profit: data.operatingProfit,
    operating_margin_percentage: data.operatingMargin,
    financial_expenses: data.financialExpenses,
    net_profit: data.netProfit,
    net_margin_percentage: data.netMargin,
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: `Netto winst: EUR ${data.netProfit.toLocaleString('nl-NL')} (${data.netMargin}% marge). Bruto marge ${data.grossMargin}%.`,
      health: data.netMargin > 10 ? 'Gezonde winstmarge' : data.netMargin > 5 ? 'Redelijke marge' : 'Lage marge - aandacht nodig',
    },
    related_tools: [
      { tool: 'get_revenue', when: 'Voor gedetailleerde omzet breakdown' },
      { tool: 'get_trial_balance', when: 'Voor volledige balans' },
    ],
  };
}

/**
 * Generate response for get_aging_analysis tool
 */
export function generateGetAgingAnalysisResponse(
  params: Record<string, unknown>
): unknown {
  const type = (params.type as 'receivable' | 'payable') || 'receivable';

  const data = getAgingAnalysis(type);

  return {
    type,
    buckets: data.buckets.map((b) => ({
      range: b.range,
      count: b.count,
      amount: b.amount,
      percentage: b.percentage,
    })),
    summary: {
      total_outstanding: data.total,
      average_days_outstanding: data.averageDaysOutstanding,
      overdue_amount: data.buckets
        .filter((b) => !b.range.includes('Niet vervallen'))
        .reduce((sum, b) => sum + b.amount, 0),
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: type === 'receivable'
        ? `EUR ${data.total.toLocaleString('nl-NL')} openstaand van debiteuren. Gem. ${data.averageDaysOutstanding} dagen.`
        : `EUR ${data.total.toLocaleString('nl-NL')} openstaand aan crediteuren. Gem. ${data.averageDaysOutstanding} dagen.`,
    },
    related_tools: [
      { tool: 'get_outstanding_invoices', when: 'Voor individuele facturen' },
      { tool: 'get_cashflow_forecast', when: 'Voor liquiditeitsprognose' },
    ],
  };
}

/**
 * Generate response for get_aging_receivables tool
 */
export function generateGetAgingReceivablesResponse(
  _params: Record<string, unknown>
): unknown {
  const data = getAgingAnalysis('receivable');

  return {
    buckets: data.buckets,
    total: data.total,
    average_days: data.averageDaysOutstanding,
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: `${data.buckets[0].count} facturen nog niet vervallen (${data.buckets[0].percentage}%). ${data.buckets.slice(1).reduce((sum, b) => sum + b.count, 0)} facturen vervallen.`,
      action: data.buckets[4].amount > 0 ? 'Let op: facturen > 90 dagen - overweeg incasso' : 'Geen kritieke achterstand',
    },
    related_tools: [
      { tool: 'get_outstanding_invoices', when: 'Voor details per factuur' },
    ],
  };
}

/**
 * Generate response for get_aging_payables tool
 */
export function generateGetAgingPayablesResponse(
  _params: Record<string, unknown>
): unknown {
  const data = getAgingAnalysis('payable');

  return {
    buckets: data.buckets,
    total: data.total,
    average_days: data.averageDaysOutstanding,
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: `${data.buckets[0].count} facturen binnen termijn (${data.buckets[0].percentage}%). Totaal EUR ${data.total.toLocaleString('nl-NL')} te betalen.`,
      action: data.buckets[3].amount + data.buckets[4].amount > 0
        ? 'Let op: facturen > 60 dagen - voorkom aanmaningen'
        : 'Alle betalingen binnen normale termijn',
    },
    related_tools: [
      { tool: 'get_outstanding_invoices', when: 'Voor details per factuur' },
      { tool: 'get_cashflow_forecast', when: 'Voor betaalplanning' },
    ],
  };
}

/**
 * Generate response for get_vat_summary tool
 */
export function generateGetVATSummaryResponse(
  params: Record<string, unknown>
): unknown {
  const year = params.year as number | undefined;
  const quarter = params.quarter as 1 | 2 | 3 | 4 | undefined;

  const data = getVATSummary({ year, quarter });

  return {
    period: data.period,
    sales_vat: {
      high_rate: {
        rate: '21%',
        base_amount: data.salesVAT.high.base,
        vat_amount: data.salesVAT.high.vat,
      },
      low_rate: {
        rate: '9%',
        base_amount: data.salesVAT.low.base,
        vat_amount: data.salesVAT.low.vat,
      },
      zero_rate: {
        rate: '0%',
        base_amount: data.salesVAT.zero.base,
        vat_amount: 0,
      },
      total_vat: data.salesVAT.total,
    },
    purchase_vat: {
      high_rate: {
        rate: '21%',
        base_amount: data.purchaseVAT.high.base,
        vat_amount: data.purchaseVAT.high.vat,
      },
      low_rate: {
        rate: '9%',
        base_amount: data.purchaseVAT.low.base,
        vat_amount: data.purchaseVAT.low.vat,
      },
      total_vat: data.purchaseVAT.total,
    },
    vat_to_pay: data.vatToPay,
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: `BTW ${data.period}: EUR ${data.vatToPay.toLocaleString('nl-NL')} af te dragen.`,
      note: `${getCurrentIndustryConfig().company.shortName}: ${getCurrentIndustryConfig().company.industry === 'bakkerij' ? 'meeste omzet tegen 9% BTW (voedingsmiddelen)' : 'omzet tegen 21% BTW (diensten)'}`,
    },
    related_tools: [
      { tool: 'get_revenue', when: 'Voor omzet details' },
      { tool: 'get_profit_loss', when: 'Voor volledige resultatenrekening' },
    ],
  };
}

/**
 * Generate response for get_budget_comparison tool
 */
export function generateGetBudgetComparisonResponse(
  params: Record<string, unknown>
): unknown {
  const year = params.year as number | undefined;
  const quarter = params.quarter as 1 | 2 | 3 | 4 | undefined;

  const data = getBudgetComparison({ year, quarter });

  return {
    period: {
      year: year || new Date().getFullYear(),
      quarter: quarter || 'YTD',
    },
    items: data.items.map((item) => ({
      category: item.category,
      budget: item.budget,
      actual: item.actual,
      variance: item.variance,
      variance_percentage: item.variancePercentage,
      status: item.variance >= 0
        ? item.category.startsWith('Omzet') ? 'boven_budget' : 'onder_budget'
        : item.category.startsWith('Omzet') ? 'onder_budget' : 'boven_budget',
    })),
    totals: {
      budget_profit: data.totalBudget,
      actual_profit: data.totalActual,
      variance: data.totalVariance,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: `Winst EUR ${data.totalActual.toLocaleString('nl-NL')} vs budget EUR ${data.totalBudget.toLocaleString('nl-NL')} (${data.totalVariance >= 0 ? '+' : ''}EUR ${data.totalVariance.toLocaleString('nl-NL')}).`,
      performance: data.totalVariance >= 0 ? 'Boven budget - goed gepresteerd!' : 'Onder budget - actie nodig',
    },
    related_tools: [
      { tool: 'get_profit_loss', when: 'Voor gedetailleerde P&L' },
      { tool: 'get_revenue', when: 'Voor omzet analyse' },
    ],
  };
}

/**
 * Generate response for get_transactions tool (transaction search)
 */
export function generateGetTransactionsResponse(
  params: Record<string, unknown>
): unknown {
  const fromDate = params.from_date as string | undefined;
  const toDate = params.to_date as string | undefined;
  const glAccountCode = params.gl_account as string | undefined;
  const limit = (params.limit as number) || 100;

  const lines = getTransactionLines({ fromDate, toDate, glAccountCode, limit });

  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

  return {
    transactions: lines.map((l) => ({
      id: l.id,
      entry_number: l.entryNumber,
      date: l.date,
      gl_account: l.glAccountCode,
      gl_account_description: l.glAccountDescription,
      description: l.description,
      debit: l.debit,
      credit: l.credit,
      vat_code: l.vatCode,
    })),
    count: lines.length,
    totals: {
      debit: Math.round(totalDebit * 100) / 100,
      credit: Math.round(totalCredit * 100) / 100,
    },
    filters: {
      from_date: fromDate,
      to_date: toDate,
      gl_account: glAccountCode,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: `${lines.length} transacties gevonden. Totaal debet EUR ${totalDebit.toLocaleString('nl-NL')}, credit EUR ${totalCredit.toLocaleString('nl-NL')}.`,
    },
    related_tools: [
      { tool: 'get_gl_accounts', when: 'Voor grootboekrekeningen overzicht' },
      { tool: 'get_trial_balance', when: 'Voor proefbalans' },
    ],
  };
}
