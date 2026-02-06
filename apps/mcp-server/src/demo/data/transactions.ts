/**
 * Demo Bank Transactions Data
 *
 * 6 months of realistic bank transactions for the bakery (~€1.5M/year):
 * - Monthly: Rent (EUR 6,000), Salaries (EUR 28,500), Utilities (EUR 3,500)
 * - Weekly: Customer receipts (EUR 25,000-35,000)
 * - Quarterly: VAT payments
 */

export interface DemoBankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number; // Positive = credit/incoming, Negative = debit/outgoing
  type: 'credit' | 'debit';
  glAccount: string;
  glAccountDescription: string;
  relatedParty?: string; // Customer or supplier name
}

// Helper to create dates
function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Generate 6 months of realistic bank transactions
 */
function generateTransactions(): DemoBankTransaction[] {
  const transactions: DemoBankTransaction[] = [];
  let idCounter = 1;

  // Customer names for incoming payments
  const customers = [
    'Hotel Krasnapolsky',
    'Restaurant De Vier Pilaren',
    'Albert Heijn Centrum',
    'Hotel Pulitzer Amsterdam',
    'Cafe De Dokter',
    'Brasserie Nel',
    'Kantoorcomplex Zuidas',
    'Catering Service Amsterdam',
    'Grand Cafe Corso',
    'SPAR Jordaan',
    'Fitness First Amsterdam',
  ];

  // Generate transactions for each month (6 months back)
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - monthOffset);
    monthStart.setDate(1);

    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);

    const daysInMonth = monthEnd.getDate();
    const monthDaysAgo = Math.floor(
      (new Date().getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Monthly fixed costs (around day 1-5)
    // Rent - €6000/month for Amsterdam location
    transactions.push({
      id: `btx-${String(idCounter++).padStart(6, '0')}`,
      date: daysAgo(monthDaysAgo - 1),
      description: 'Huur bedrijfspand - Broodstraat 42',
      amount: -6000.00,
      type: 'debit',
      glAccount: '4200',
      glAccountDescription: 'Huisvestingskosten',
      relatedParty: 'Vastgoed Centrum Amsterdam',
    });

    // Salaries (around 25th of previous month for current month) - 15 FTE
    transactions.push({
      id: `btx-${String(idCounter++).padStart(6, '0')}`,
      date: daysAgo(monthDaysAgo + 5),
      description: 'Salarissen personeel (15 FTE)',
      amount: -28500.00,
      type: 'debit',
      glAccount: '4000',
      glAccountDescription: 'Personeelskosten',
    });

    // Energy (variable 3000-4000) - ovens are energy-intensive
    const energyCost = -(3000 + Math.random() * 1000);
    transactions.push({
      id: `btx-${String(idCounter++).padStart(6, '0')}`,
      date: daysAgo(monthDaysAgo - 10),
      description: 'Elektriciteit en gas - Vattenfall',
      amount: Math.round(energyCost * 100) / 100,
      type: 'debit',
      glAccount: '4010',
      glAccountDescription: 'Energie en water',
      relatedParty: 'Vattenfall Energie',
    });

    // Weekly customer payments (4-5 per month)
    const weeksInMonth = Math.ceil(daysInMonth / 7);
    for (let week = 0; week < weeksInMonth; week++) {
      const weekDay = week * 7 + 3; // Around Wednesday/Thursday
      if (weekDay > daysInMonth) break;

      // 3-5 customer payments per week for larger bakery
      const paymentsThisWeek = 3 + Math.floor(Math.random() * 3);
      for (let p = 0; p < paymentsThisWeek; p++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const amount = 1500 + Math.random() * 6500; // EUR 1,500 - 8,000

        transactions.push({
          id: `btx-${String(idCounter++).padStart(6, '0')}`,
          date: daysAgo(monthDaysAgo - weekDay - p),
          description: `Betaling factuur - ${customer}`,
          amount: Math.round(amount * 100) / 100,
          type: 'credit',
          glAccount: '1300',
          glAccountDescription: 'Debiteuren',
          relatedParty: customer,
        });
      }
    }

    // Supplier payments (3-4 per month) - scaled for larger operation
    const supplierPayments = [
      { name: 'Meelgroothandel Van der Molen', amount: -7500 - Math.random() * 2500, gl: '1600', glDesc: 'Crediteuren' },
      { name: 'Zuivelfabriek De Koe', amount: -4500 - Math.random() * 1500, gl: '1600', glDesc: 'Crediteuren' },
      { name: 'Verpakkingscentrale Nederland', amount: -1200 - Math.random() * 800, gl: '1600', glDesc: 'Crediteuren' },
      { name: 'Eiergroothandel Hendriks', amount: -2200 - Math.random() * 1000, gl: '1600', glDesc: 'Crediteuren' },
    ];

    // Randomly pick 2-3 supplier payments
    const numSupplierPayments = 2 + Math.floor(Math.random() * 2);
    const shuffled = supplierPayments.sort(() => Math.random() - 0.5);

    for (let i = 0; i < numSupplierPayments; i++) {
      const supplier = shuffled[i];
      const paymentDay = 8 + Math.floor(Math.random() * 15); // Day 8-22

      transactions.push({
        id: `btx-${String(idCounter++).padStart(6, '0')}`,
        date: daysAgo(monthDaysAgo - paymentDay),
        description: `Betaling inkoopfactuur - ${supplier.name}`,
        amount: Math.round(supplier.amount * 100) / 100,
        type: 'debit',
        glAccount: supplier.gl,
        glAccountDescription: supplier.glDesc,
        relatedParty: supplier.name,
      });
    }

    // Quarterly VAT payment (every 3 months) - ~€10K/quarter for larger operation
    if (monthOffset % 3 === 0 && monthOffset > 0) {
      transactions.push({
        id: `btx-${String(idCounter++).padStart(6, '0')}`,
        date: daysAgo(monthDaysAgo - 28),
        description: 'BTW afdracht kwartaal',
        amount: -8000 - Math.random() * 4000,
        type: 'debit',
        glAccount: '1700',
        glAccountDescription: 'Af te dragen BTW',
        relatedParty: 'Belastingdienst',
      });
    }

    // Occasional smaller expenses
    if (Math.random() > 0.5) {
      transactions.push({
        id: `btx-${String(idCounter++).padStart(6, '0')}`,
        date: daysAgo(monthDaysAgo - 12),
        description: 'Kantoorbenodigdheden - Staples',
        amount: -(50 + Math.random() * 150),
        type: 'debit',
        glAccount: '4200',
        glAccountDescription: 'Kantoorkosten',
        relatedParty: 'Staples Office Supplies',
      });
    }

    if (Math.random() > 0.6) {
      transactions.push({
        id: `btx-${String(idCounter++).padStart(6, '0')}`,
        date: daysAgo(monthDaysAgo - 18),
        description: 'Reparatie bakkerij equipment',
        amount: -(200 + Math.random() * 500),
        type: 'debit',
        glAccount: '4300',
        glAccountDescription: 'Onderhoud en reparaties',
        relatedParty: 'Bakkerij Equipment Services',
      });
    }
  }

  // Sort by date descending
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  // Round all amounts
  return transactions.map((tx) => ({
    ...tx,
    amount: Math.round(tx.amount * 100) / 100,
  }));
}

/**
 * All demo bank transactions
 */
export const DEMO_BANK_TRANSACTIONS: DemoBankTransaction[] = generateTransactions();

/**
 * Get bank transactions with optional filters
 */
export function getBankTransactions(params: {
  fromDate?: string;
  toDate?: string;
  bankAccount?: string; // Ignored in demo
  limit?: number;
}): DemoBankTransaction[] {
  const { fromDate, toDate, limit = 100 } = params;

  let transactions = DEMO_BANK_TRANSACTIONS;

  // Filter by date range
  if (fromDate) {
    transactions = transactions.filter((tx) => tx.date >= fromDate);
  }
  if (toDate) {
    transactions = transactions.filter((tx) => tx.date <= toDate);
  }

  // Apply limit
  return transactions.slice(0, limit);
}

/**
 * Get current bank balance (sum of all transactions)
 */
export function getCurrentBalance(): number {
  // Start with an opening balance
  const openingBalance = 45000; // EUR 45,000 starting balance

  const totalMovement = DEMO_BANK_TRANSACTIONS.reduce(
    (sum, tx) => sum + tx.amount,
    0
  );

  return Math.round((openingBalance + totalMovement) * 100) / 100;
}

/**
 * Get balance at a specific date
 */
export function getBalanceAtDate(targetDate: string): number {
  const openingBalance = 45000;

  // Sum all transactions up to and including the target date
  const totalMovement = DEMO_BANK_TRANSACTIONS
    .filter((tx) => tx.date <= targetDate)
    .reduce((sum, tx) => sum + tx.amount, 0);

  return Math.round((openingBalance + totalMovement) * 100) / 100;
}

/**
 * Get transaction totals for a period
 */
export function getTransactionTotals(params: {
  fromDate?: string;
  toDate?: string;
}): { totalDebit: number; totalCredit: number; net: number } {
  const transactions = getBankTransactions(params);

  let totalDebit = 0;
  let totalCredit = 0;

  for (const tx of transactions) {
    if (tx.amount > 0) {
      totalCredit += tx.amount;
    } else {
      totalDebit += Math.abs(tx.amount);
    }
  }

  return {
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    net: Math.round((totalCredit - totalDebit) * 100) / 100,
  };
}
