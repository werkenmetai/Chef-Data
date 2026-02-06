/**
 * Demo Reporting Data - Multi-Industry Support
 *
 * Revenue, P&L, Aging, VAT, and Budget data based on current demo industry.
 */

import { getCurrentIndustryConfig, DemoIndustry } from '../context';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
];

// ============================================
// INDUSTRY-SPECIFIC REVENUE DATA
// ============================================

interface IndustryRevenueConfig {
  baseMonthlyRevenue: number;
  categories: { name: string; percentage: number }[];
  seasonalFactors: Record<number, number>;
  vatProfile: { highRate: number; lowRate: number; zeroRate: number }; // percentages of revenue
}

const INDUSTRY_REVENUE: Record<DemoIndustry, IndustryRevenueConfig> = {
  bakkerij: {
    baseMonthlyRevenue: 125000,
    categories: [
      { name: 'brood', percentage: 55 },
      { name: 'gebak', percentage: 25 },
      { name: 'catering', percentage: 15 },
      { name: 'overig', percentage: 5 },
    ],
    seasonalFactors: { 1: 0.85, 2: 0.90, 6: 0.95, 7: 0.95, 8: 0.95, 11: 1.1, 12: 1.35 },
    vatProfile: { highRate: 15, lowRate: 80, zeroRate: 5 }, // Food is mostly 9%
  },
  it: {
    baseMonthlyRevenue: 233000,
    categories: [
      { name: 'consultancy', percentage: 60 },
      { name: 'development', percentage: 25 },
      { name: 'support', percentage: 10 },
      { name: 'training', percentage: 5 },
    ],
    seasonalFactors: { 1: 0.90, 7: 0.85, 8: 0.80, 12: 0.75 }, // Summer/holiday dips
    vatProfile: { highRate: 95, lowRate: 0, zeroRate: 5 }, // Services at 21%
  },
  advocaat: {
    baseMonthlyRevenue: 267000,
    categories: [
      { name: 'ondernemingsrecht', percentage: 45 },
      { name: 'arbeidsrecht', percentage: 30 },
      { name: 'vastgoedrecht', percentage: 15 },
      { name: 'procesvoering', percentage: 10 },
    ],
    seasonalFactors: { 1: 0.85, 7: 0.75, 8: 0.70, 12: 0.80 }, // Summer slow
    vatProfile: { highRate: 100, lowRate: 0, zeroRate: 0 }, // All 21%
  },
  aannemer: {
    baseMonthlyRevenue: 375000,
    categories: [
      { name: 'nieuwbouw', percentage: 50 },
      { name: 'renovatie', percentage: 30 },
      { name: 'onderhoud', percentage: 15 },
      { name: 'overig', percentage: 5 },
    ],
    seasonalFactors: { 1: 0.80, 2: 0.85, 11: 0.90, 12: 0.75 }, // Winter slower
    vatProfile: { highRate: 100, lowRate: 0, zeroRate: 0 }, // Construction at 21%
  },
};

// ============================================
// MONTHLY REVENUE
// ============================================

export interface MonthlyRevenue {
  year: number;
  month: number;
  monthName: string;
  revenue: number;
  categories: Record<string, number>;
}

export function getMonthlyRevenue(months: number = 12): MonthlyRevenue[] {
  const config = getCurrentIndustryConfig();
  const revenueConfig = INDUSTRY_REVENUE[config.company.industry];
  const data: MonthlyRevenue[] = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const seasonFactor = revenueConfig.seasonalFactors[month] ?? 1.0;
    const monthlyTotal = Math.round(
      revenueConfig.baseMonthlyRevenue * seasonFactor * (0.95 + Math.random() * 0.1)
    );

    const categories: Record<string, number> = {};
    let remaining = monthlyTotal;
    for (let j = 0; j < revenueConfig.categories.length - 1; j++) {
      const cat = revenueConfig.categories[j];
      const amount = Math.round(monthlyTotal * (cat.percentage / 100));
      categories[cat.name] = amount;
      remaining -= amount;
    }
    categories[revenueConfig.categories[revenueConfig.categories.length - 1].name] = remaining;

    data.push({
      year,
      month,
      monthName: MONTH_NAMES[month - 1],
      revenue: monthlyTotal,
      categories,
    });
  }

  return data;
}

export function getRevenue(params: {
  year?: number;
  quarter?: 1 | 2 | 3 | 4;
  fromDate?: string;
  toDate?: string;
}): {
  total: number;
  byCategory: Record<string, number>;
  byMonth: MonthlyRevenue[];
} {
  const { year, quarter, fromDate, toDate } = params;

  let data = getMonthlyRevenue(36);

  if (year) {
    data = data.filter((d) => d.year === year);
  }

  if (quarter) {
    const quarterMonths = {
      1: [1, 2, 3],
      2: [4, 5, 6],
      3: [7, 8, 9],
      4: [10, 11, 12],
    };
    data = data.filter((d) => quarterMonths[quarter].includes(d.month));
  }

  if (fromDate || toDate) {
    data = data.filter((d) => {
      const monthStr = `${d.year}-${String(d.month).padStart(2, '0')}-01`;
      if (fromDate && monthStr < fromDate) return false;
      if (toDate && monthStr > toDate) return false;
      return true;
    });
  }

  const total = data.reduce((sum, d) => sum + d.revenue, 0);

  const byCategory: Record<string, number> = {};
  for (const month of data) {
    for (const [cat, amount] of Object.entries(month.categories)) {
      byCategory[cat] = (byCategory[cat] || 0) + amount;
    }
  }

  return { total, byCategory, byMonth: data };
}

// ============================================
// PROFIT & LOSS
// ============================================

export interface ProfitLossData {
  revenue: { total: number; breakdown: Record<string, number> };
  costOfGoods: { total: number; breakdown: Record<string, number> };
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: { total: number; breakdown: Record<string, number> };
  operatingProfit: number;
  operatingMargin: number;
  financialExpenses: number;
  netProfit: number;
  netMargin: number;
}

export function getProfitLoss(params: {
  year?: number;
  quarter?: 1 | 2 | 3 | 4;
}): ProfitLossData {
  const config = getCurrentIndustryConfig();
  const revenueConfig = INDUSTRY_REVENUE[config.company.industry];
  const expenseProfile = config.expenseProfiles;

  let periodFactor = params.quarter ? 0.25 : 1.0;

  // Calculate annual revenue based on base monthly
  const annualRevenue = revenueConfig.baseMonthlyRevenue * 12;
  const revenueTotal = Math.round(annualRevenue * periodFactor);

  // Revenue breakdown
  const revenueBreakdown: Record<string, number> = {};
  for (const cat of revenueConfig.categories) {
    revenueBreakdown[`Omzet ${cat.name}`] = Math.round(revenueTotal * (cat.percentage / 100));
  }

  // Cost of goods sold
  const cogsTotal = Math.round(revenueTotal * (expenseProfile.costOfGoods / 100));
  const cogsBreakdown: Record<string, number> = {
    'Inkoop grondstoffen/materialen': cogsTotal,
  };

  const grossProfit = revenueTotal - cogsTotal;
  const grossMargin = revenueTotal > 0 ? (grossProfit / revenueTotal) * 100 : 0;

  // Operating expenses
  const personnelCosts = Math.round(revenueTotal * (expenseProfile.personnel / 100));
  const housingCosts = Math.round(revenueTotal * (expenseProfile.housing / 100));
  const marketingCosts = Math.round(revenueTotal * (expenseProfile.marketing / 100));
  const otherCosts = Math.round(revenueTotal * (expenseProfile.other / 100));

  const opexTotal = personnelCosts + housingCosts + marketingCosts + otherCosts;
  const opexBreakdown: Record<string, number> = {
    'Personeelskosten': personnelCosts,
    'Huisvestingskosten': housingCosts,
    'Marketing & verkoop': marketingCosts,
    'Overige kosten': otherCosts,
  };

  const operatingProfit = grossProfit - opexTotal;
  const operatingMargin = revenueTotal > 0 ? (operatingProfit / revenueTotal) * 100 : 0;

  // Financial expenses (assume 1% of revenue)
  const finExpenses = Math.round(revenueTotal * 0.01);

  const netProfit = operatingProfit - finExpenses;
  const netMargin = revenueTotal > 0 ? (netProfit / revenueTotal) * 100 : 0;

  return {
    revenue: { total: revenueTotal, breakdown: revenueBreakdown },
    costOfGoods: { total: cogsTotal, breakdown: cogsBreakdown },
    grossProfit,
    grossMargin: Math.round(grossMargin * 10) / 10,
    operatingExpenses: { total: opexTotal, breakdown: opexBreakdown },
    operatingProfit,
    operatingMargin: Math.round(operatingMargin * 10) / 10,
    financialExpenses: finExpenses,
    netProfit,
    netMargin: Math.round(netMargin * 10) / 10,
  };
}

// ============================================
// AGING ANALYSIS
// ============================================

export interface AgingBucket {
  range: string;
  count: number;
  amount: number;
  percentage: number;
}

export function getAgingAnalysis(type: 'receivable' | 'payable'): {
  buckets: AgingBucket[];
  total: number;
  averageDaysOutstanding: number;
} {
  const config = getCurrentIndustryConfig();
  const revenueConfig = INDUSTRY_REVENUE[config.company.industry];

  // Scale amounts based on industry
  const scaleFactor = revenueConfig.baseMonthlyRevenue / 125000;

  if (type === 'receivable') {
    const buckets: AgingBucket[] = [
      { range: 'Niet vervallen', count: 9, amount: Math.round(13885 * scaleFactor), percentage: 52.8 },
      { range: '1-30 dagen', count: 2, amount: Math.round(4845 * scaleFactor), percentage: 18.4 },
      { range: '31-60 dagen', count: 2, amount: Math.round(3820 * scaleFactor), percentage: 14.5 },
      { range: '61-90 dagen', count: 1, amount: Math.round(1250 * scaleFactor), percentage: 4.8 },
      { range: '> 90 dagen', count: 1, amount: Math.round(2500 * scaleFactor), percentage: 9.5 },
    ];
    const total = buckets.reduce((sum, b) => sum + b.amount, 0);
    return { buckets, total, averageDaysOutstanding: 28 };
  } else {
    const buckets: AgingBucket[] = [
      { range: 'Niet vervallen', count: 3, amount: Math.round(7630 * scaleFactor), percentage: 78.9 },
      { range: '1-30 dagen', count: 1, amount: Math.round(780 * scaleFactor), percentage: 8.1 },
      { range: '31-60 dagen', count: 1, amount: Math.round(1260 * scaleFactor), percentage: 13.0 },
      { range: '61-90 dagen', count: 0, amount: 0, percentage: 0 },
      { range: '> 90 dagen', count: 0, amount: 0, percentage: 0 },
    ];
    const total = buckets.reduce((sum, b) => sum + b.amount, 0);
    return { buckets, total, averageDaysOutstanding: 15 };
  }
}

// ============================================
// VAT SUMMARY
// ============================================

export interface VATSummaryData {
  period: string;
  salesVAT: {
    high: { base: number; vat: number };
    low: { base: number; vat: number };
    zero: { base: number; vat: number };
    total: number;
  };
  purchaseVAT: {
    high: { base: number; vat: number };
    low: { base: number; vat: number };
    total: number;
  };
  vatToPay: number;
}

export function getVATSummary(params: {
  year?: number;
  quarter?: 1 | 2 | 3 | 4;
}): VATSummaryData {
  const { year = new Date().getFullYear(), quarter } = params;
  const periodStr = quarter ? `Q${quarter} ${year}` : `${year}`;

  const config = getCurrentIndustryConfig();
  const revenueConfig = INDUSTRY_REVENUE[config.company.industry];
  const vatProfile = revenueConfig.vatProfile;

  const factor = quarter ? 1 : 4;
  const quarterlyRevenue = revenueConfig.baseMonthlyRevenue * 3;

  // Sales VAT based on industry profile
  const highBase = Math.round(quarterlyRevenue * (vatProfile.highRate / 100) * factor);
  const lowBase = Math.round(quarterlyRevenue * (vatProfile.lowRate / 100) * factor);
  const zeroBase = Math.round(quarterlyRevenue * (vatProfile.zeroRate / 100) * factor);

  const salesVAT = {
    high: { base: highBase, vat: Math.round(highBase * 0.21) },
    low: { base: lowBase, vat: Math.round(lowBase * 0.09) },
    zero: { base: zeroBase, vat: 0 },
    total: Math.round(highBase * 0.21) + Math.round(lowBase * 0.09),
  };

  // Purchase VAT (assume 60% of revenue in purchases, mostly 21%)
  const purchaseBase = Math.round(quarterlyRevenue * 0.6 * factor);
  const purchaseVAT = {
    high: { base: Math.round(purchaseBase * 0.7), vat: Math.round(purchaseBase * 0.7 * 0.21) },
    low: { base: Math.round(purchaseBase * 0.3), vat: Math.round(purchaseBase * 0.3 * 0.09) },
    total: Math.round(purchaseBase * 0.7 * 0.21) + Math.round(purchaseBase * 0.3 * 0.09),
  };

  const vatToPay = salesVAT.total - purchaseVAT.total;

  return { period: periodStr, salesVAT, purchaseVAT, vatToPay };
}

// ============================================
// BUDGET COMPARISON
// ============================================

export interface BudgetComparison {
  category: string;
  budget: number;
  actual: number;
  variance: number;
  variancePercentage: number;
}

export function getBudgetComparison(_params: {
  year?: number;
  quarter?: 1 | 2 | 3 | 4;
}): {
  items: BudgetComparison[];
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
} {
  const config = getCurrentIndustryConfig();
  const revenueConfig = INDUSTRY_REVENUE[config.company.industry];
  const expenseProfile = config.expenseProfiles;

  const annualRevenue = revenueConfig.baseMonthlyRevenue * 12;

  // Generate budget items dynamically
  const items: BudgetComparison[] = [];

  // Revenue items (slightly over budget)
  for (const cat of revenueConfig.categories) {
    const budget = Math.round(annualRevenue * (cat.percentage / 100) * 0.95);
    const actual = Math.round(annualRevenue * (cat.percentage / 100));
    items.push({
      category: `Omzet ${cat.name}`,
      budget,
      actual,
      variance: actual - budget,
      variancePercentage: Math.round(((actual - budget) / budget) * 100 * 10) / 10,
    });
  }

  // Expense items (slightly under budget)
  const expenseItems = [
    { name: 'Inkoop grondstoffen', pct: expenseProfile.costOfGoods },
    { name: 'Personeelskosten', pct: expenseProfile.personnel },
    { name: 'Huisvestingskosten', pct: expenseProfile.housing },
    { name: 'Marketing', pct: expenseProfile.marketing },
    { name: 'Overige kosten', pct: expenseProfile.other },
  ];

  for (const exp of expenseItems) {
    const budget = Math.round(annualRevenue * (exp.pct / 100) * 1.05);
    const actual = Math.round(annualRevenue * (exp.pct / 100));
    items.push({
      category: exp.name,
      budget,
      actual,
      variance: actual - budget,
      variancePercentage: Math.round(((actual - budget) / budget) * 100 * 10) / 10,
    });
  }

  const revenueItems = items.filter((i) => i.category.startsWith('Omzet'));
  const costItems = items.filter((i) => !i.category.startsWith('Omzet'));

  const totalBudgetRevenue = revenueItems.reduce((sum, i) => sum + i.budget, 0);
  const totalActualRevenue = revenueItems.reduce((sum, i) => sum + i.actual, 0);
  const totalBudgetCosts = costItems.reduce((sum, i) => sum + i.budget, 0);
  const totalActualCosts = costItems.reduce((sum, i) => sum + i.actual, 0);

  const budgetProfit = totalBudgetRevenue - totalBudgetCosts;
  const actualProfit = totalActualRevenue - totalActualCosts;

  return {
    items,
    totalBudget: budgetProfit,
    totalActual: actualProfit,
    totalVariance: actualProfit - budgetProfit,
  };
}

// ============================================
// TRANSACTION LINES
// ============================================

export interface TransactionLine {
  id: string;
  entryNumber: number;
  lineNumber: number;
  date: string;
  glAccountCode: string;
  glAccountDescription: string;
  description: string;
  debit: number;
  credit: number;
  vatCode?: string;
  costCenter?: string;
}

export function getTransactionLines(params: {
  fromDate?: string;
  toDate?: string;
  glAccountCode?: string;
  limit?: number;
}): TransactionLine[] {
  const { fromDate, toDate, glAccountCode, limit = 100 } = params;
  const config = getCurrentIndustryConfig();
  const revenueConfig = INDUSTRY_REVENUE[config.company.industry];

  const lines: TransactionLine[] = [];
  const today = new Date();
  const scaleFactor = revenueConfig.baseMonthlyRevenue / 125000;

  // Sample transactions based on industry
  const accounts = [
    { code: '8000', desc: `Omzet ${revenueConfig.categories[0].name}`, credit: 500 * scaleFactor },
    { code: '8010', desc: `Omzet ${revenueConfig.categories[1].name}`, credit: 200 * scaleFactor },
    { code: '7000', desc: 'Inkoop grondstoffen', debit: 300 * scaleFactor },
    { code: '4000', desc: 'Lonen en salarissen', debit: 1000 * scaleFactor },
    { code: '4200', desc: 'Huur bedrijfspand', debit: 2500 * scaleFactor },
    { code: '4210', desc: 'Energie en water', debit: 200 * scaleFactor },
  ];

  for (let i = 0; i < 50; i++) {
    const daysBack = Math.floor(Math.random() * 90);
    const date = new Date(today);
    date.setDate(date.getDate() - daysBack);
    const dateStr = date.toISOString().split('T')[0];

    const acc = accounts[Math.floor(Math.random() * accounts.length)];
    const isDebit = 'debit' in acc;
    const amount = Math.round(((acc as any).debit || (acc as any).credit) * (0.8 + Math.random() * 0.4) * 100) / 100;

    lines.push({
      id: `tl-${String(i + 1).padStart(5, '0')}`,
      entryNumber: 2024000 + i,
      lineNumber: 1,
      date: dateStr,
      glAccountCode: acc.code,
      glAccountDescription: acc.desc,
      description: `Boeking ${acc.desc.toLowerCase()}`,
      debit: isDebit ? amount : 0,
      credit: !isDebit ? amount : 0,
      vatCode: acc.code.startsWith('8') ? 'V21' : acc.code.startsWith('7') ? 'I21' : undefined,
    });
  }

  lines.sort((a, b) => b.date.localeCompare(a.date));

  let filtered = lines;
  if (fromDate) filtered = filtered.filter((l) => l.date >= fromDate);
  if (toDate) filtered = filtered.filter((l) => l.date <= toDate);
  if (glAccountCode) filtered = filtered.filter((l) => l.glAccountCode === glAccountCode);

  return filtered.slice(0, limit);
}
