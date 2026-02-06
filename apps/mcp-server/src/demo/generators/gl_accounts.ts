/**
 * Demo Generators: GL Accounts tools
 *
 * Returns demo data for GL accounts and trial balance.
 */

import { getCurrentIndustryConfig } from '../context';
import { getGLAccounts, getTrialBalance, getAccountTotalsByType } from '../data/gl_accounts';

/**
 * Generate response for get_gl_accounts tool
 */
export function generateGetGLAccountsResponse(
  params: Record<string, unknown>
): unknown {
  const type = params.type as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | undefined;
  const category = params.category as string | undefined;

  const accounts = getGLAccounts({ type, category });

  // Group by category
  const byCategory: Record<string, typeof accounts> = {};
  for (const acc of accounts) {
    if (!byCategory[acc.category]) {
      byCategory[acc.category] = [];
    }
    byCategory[acc.category].push(acc);
  }

  return {
    accounts: accounts.map((acc) => ({
      id: acc.id,
      code: acc.code,
      description: acc.description,
      type: acc.type,
      category: acc.category,
      balance: acc.balance,
    })),
    count: accounts.length,
    by_category: Object.entries(byCategory).map(([cat, accs]) => ({
      category: cat,
      count: accs.length,
      total_balance: accs.reduce((sum, a) => sum + a.balance, 0),
    })),
    filters: {
      type: type || 'all',
      category: category || null,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: `${accounts.length} grootboekrekeningen gevonden${type ? ` van type "${type}"` : ''}.`,
    },
    related_tools: [
      { tool: 'get_trial_balance', when: 'Voor volledige proefbalans' },
      { tool: 'get_transactions', when: 'Voor boekingen op een rekening' },
    ],
  };
}

/**
 * Generate response for get_trial_balance tool
 */
export function generateGetTrialBalanceResponse(
  _params: Record<string, unknown>
): unknown {
  const data = getTrialBalance();
  const totals = getAccountTotalsByType();

  // Group accounts by type for balance sheet structure
  const balanceSheet = {
    assets: data.accounts.filter((a) => a.type === 'asset'),
    liabilities: data.accounts.filter((a) => a.type === 'liability'),
    equity: data.accounts.filter((a) => a.type === 'equity'),
  };

  const incomeStatement = {
    revenue: data.accounts.filter((a) => a.type === 'revenue'),
    expenses: data.accounts.filter((a) => a.type === 'expense'),
  };

  const totalAssets = totals.asset;
  const totalLiabilitiesEquity = totals.liability + totals.equity;
  const totalRevenue = totals.revenue;
  const totalExpenses = totals.expense;
  const netIncome = totalRevenue - totalExpenses;

  return {
    balance_sheet: {
      assets: {
        accounts: balanceSheet.assets.map((a) => ({
          code: a.code,
          description: a.description,
          category: a.category,
          debit: a.debit,
          credit: a.credit,
          balance: a.balance,
        })),
        total: totalAssets,
      },
      liabilities: {
        accounts: balanceSheet.liabilities.map((a) => ({
          code: a.code,
          description: a.description,
          category: a.category,
          debit: a.debit,
          credit: a.credit,
          balance: a.balance,
        })),
        total: totals.liability,
      },
      equity: {
        accounts: balanceSheet.equity.map((a) => ({
          code: a.code,
          description: a.description,
          category: a.category,
          debit: a.debit,
          credit: a.credit,
          balance: a.balance,
        })),
        total: totals.equity,
      },
      total_assets: totalAssets,
      total_liabilities_equity: totalLiabilitiesEquity,
      balanced: Math.abs(totalAssets - totalLiabilitiesEquity) < 1,
    },
    income_statement: {
      revenue: {
        accounts: incomeStatement.revenue.map((a) => ({
          code: a.code,
          description: a.description,
          balance: a.balance,
        })),
        total: totalRevenue,
      },
      expenses: {
        accounts: incomeStatement.expenses.map((a) => ({
          code: a.code,
          description: a.description,
          category: a.category,
          balance: a.balance,
        })),
        total: totalExpenses,
      },
      net_income: netIncome,
    },
    totals: {
      total_debit: data.totalDebit,
      total_credit: data.totalCredit,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: `Balans totaal: EUR ${totalAssets.toLocaleString('nl-NL')} activa. Netto winst: EUR ${netIncome.toLocaleString('nl-NL')}.`,
      balance_check: Math.abs(totalAssets - totalLiabilitiesEquity) < 1
        ? 'Balans in evenwicht ✓'
        : 'Let op: balans niet in evenwicht',
    },
    related_tools: [
      { tool: 'get_profit_loss', when: 'Voor gedetailleerde W&V rekening' },
      { tool: 'get_gl_accounts', when: 'Voor specifieke rekeningen' },
    ],
  };
}
