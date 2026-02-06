/**
 * Demo Generators: financial tools
 *
 * Returns demo financial data for Bakkerij De Gouden Croissant.
 */

import { getCurrentIndustryConfig } from '../context';
import { getBankTransactions, getCurrentBalance } from '../data/transactions';
import { getOutstandingInvoices } from '../data/invoices';

/**
 * Generate response for get_bank_transactions tool
 */
export function generateGetBankTransactionsResponse(
  params: Record<string, unknown>
): unknown {
  const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);

  // Validate date formats
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (params.from_date && !dateRegex.test(params.from_date as string)) {
    return {
      error: `Ongeldig datumformaat voor from_date: "${params.from_date}". Gebruik YYYY-MM-DD formaat.`,
    };
  }
  if (params.to_date && !dateRegex.test(params.to_date as string)) {
    return {
      error: `Ongeldig datumformaat voor to_date: "${params.to_date}". Gebruik YYYY-MM-DD formaat.`,
    };
  }

  // Default date range: this month
  const today = new Date();
  const defaultFromDate = new Date(today.getFullYear(), today.getMonth(), 1);

  const fromDate = (params.from_date as string) || defaultFromDate.toISOString().split('T')[0];
  const toDate = (params.to_date as string) || today.toISOString().split('T')[0];

  const transactions = getBankTransactions({ fromDate, toDate, limit });

  let totalDebit = 0;
  let totalCredit = 0;

  const mappedTransactions = transactions.map((tx) => {
    if (tx.amount > 0) {
      totalCredit += tx.amount;
    } else {
      totalDebit += Math.abs(tx.amount);
    }

    return {
      id: tx.id,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      gl_account: tx.glAccountDescription,
    };
  });

  const net = totalCredit - totalDebit;

  const result: Record<string, unknown> = {
    transactions: mappedTransactions,
    count: transactions.length,
    totals: {
      total_debit: Math.round(totalDebit * 100) / 100,
      total_credit: Math.round(totalCredit * 100) / 100,
      net: Math.round(net * 100) / 100,
      currency: 'EUR',
    },
    period: { from: fromDate, to: toDate },
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
  };

  if (transactions.length === 0) {
    result.suggestions = [
      'Geen banktransacties gevonden in deze periode.',
      'Probeer een ander datumbereik.',
    ];
  } else {
    result.context = {
      summary: `${transactions.length} transacties: EUR ${totalCredit.toFixed(2)} ontvangen, EUR ${totalDebit.toFixed(2)} uitgegeven.`,
      cash_flow:
        net >= 0
          ? `Positieve kasstroom: EUR ${net.toFixed(2)} meer ontvangen dan uitgegeven.`
          : `Negatieve kasstroom: EUR ${Math.abs(net).toFixed(2)} meer uitgegeven dan ontvangen.`,
    };
  }

  result.related_tools = [
    { tool: 'get_outstanding_invoices', when: 'Voor openstaande facturen die nog betaald moeten worden' },
    { tool: 'get_cashflow_forecast', when: 'Voor toekomstige liquiditeitsprognose' },
    { tool: 'get_trial_balance', when: 'Voor volledige balans en resultatenrekening' },
  ];

  return result;
}

/**
 * Generate response for get_cashflow_forecast tool
 */
export function generateGetCashflowForecastResponse(
  params: Record<string, unknown>
): unknown {
  const forecastDays = (params.forecast_days as 30 | 60 | 90) || 30;

  // Get current balance
  const currentBalance = getCurrentBalance();

  // Calculate forecast end date
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + forecastDays);
  const endDateISO = endDate.toISOString().split('T')[0];

  // Get outstanding invoices
  const { receivables, payables } = getOutstandingInvoices({ type: 'both' });

  // Filter receivables and payables due within the forecast period
  const dueReceivables = receivables.filter((r) => r.dueDate <= endDateISO);
  const duePayables = payables.filter((p) => p.dueDate <= endDateISO);

  const expectedIncome = dueReceivables.reduce((sum, r) => sum + r.outstandingAmount, 0);
  const expectedExpenses = duePayables.reduce((sum, p) => sum + p.outstandingAmount, 0);

  const forecastBalance = currentBalance + expectedIncome - expectedExpenses;

  // Generate warning if needed
  let warning: string | null = null;
  if (forecastBalance < 0) {
    warning = `Negatief saldo verwacht over ${forecastDays} dagen. Actie vereist.`;
  } else if (forecastBalance < 5000) {
    warning = `Laag saldo verwacht (< EUR 5.000) over ${forecastDays} dagen. Houd rekening met liquiditeit.`;
  }

  return {
    current_balance: Math.round(currentBalance * 100) / 100,
    expected_income: Math.round(expectedIncome * 100) / 100,
    expected_expenses: Math.round(expectedExpenses * 100) / 100,
    forecast_balance: Math.round(forecastBalance * 100) / 100,
    warning,
    period: {
      days: forecastDays,
      end_date: endDateISO,
    },
    details: {
      receivables_count: dueReceivables.length,
      payables_count: duePayables.length,
    },
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      interpretation:
        forecastBalance >= currentBalance
          ? `Verwacht positieve cashflow: EUR ${(forecastBalance - currentBalance).toFixed(2)} netto toename.`
          : `Verwacht negatieve cashflow: EUR ${Math.abs(forecastBalance - currentBalance).toFixed(2)} netto afname.`,
      recommendation:
        warning
          ? 'Overweeg om betalingsherinneringen te sturen aan debiteuren of uitstel te vragen bij crediteuren.'
          : 'Liquiditeitspositie ziet er gezond uit voor de komende periode.',
    },
    related_tools: [
      { tool: 'get_outstanding_invoices', when: 'Voor details van openstaande facturen' },
      { tool: 'get_bank_transactions', when: 'Voor historische bankbewegingen' },
    ],
  };
}
