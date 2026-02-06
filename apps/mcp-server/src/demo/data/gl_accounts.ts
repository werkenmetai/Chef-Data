/**
 * Demo GL Accounts (Grootboekrekeningen)
 *
 * Realistic chart of accounts for a Dutch bakery (MKB).
 * Based on Dutch standard rekeningschema.
 */

export interface DemoGLAccount {
  id: string;
  code: string;
  description: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  category: string;
  balance: number; // Current balance
  debit: number; // YTD debit
  credit: number; // YTD credit
}

/**
 * Chart of accounts for Bakkerij De Gouden Croissant
 *
 * Grote, succesvolle bakkerij met:
 * - ~€1.5M jaaromzet
 * - ~6% netto winstmarge
 * - Gezonde cashpositie
 * - Professionele operatie met bezorgdienst
 */
export const DEMO_GL_ACCOUNTS: DemoGLAccount[] = [
  // BALANS - ACTIVA (Assets)
  // Vaste activa - Professionele bakkerij equipment
  {
    id: 'gl-0100',
    code: '0100',
    description: 'Bedrijfsgebouwen',
    type: 'asset',
    category: 'Vaste activa',
    balance: 0, // Huur, geen eigendom
    debit: 0,
    credit: 0,
  },
  {
    id: 'gl-0200',
    code: '0200',
    description: 'Machines en installaties',
    type: 'asset',
    category: 'Vaste activa',
    balance: 245000, // Professionele ovens, mixers, koeling
    debit: 245000,
    credit: 0,
  },
  {
    id: 'gl-0210',
    code: '0210',
    description: 'Afschrijving machines',
    type: 'asset',
    category: 'Vaste activa',
    balance: -98000,
    debit: 0,
    credit: 98000,
  },
  {
    id: 'gl-0300',
    code: '0300',
    description: 'Inventaris en inrichting',
    type: 'asset',
    category: 'Vaste activa',
    balance: 75000, // Winkelinrichting + magazijn
    debit: 75000,
    credit: 0,
  },
  {
    id: 'gl-0310',
    code: '0310',
    description: 'Afschrijving inventaris',
    type: 'asset',
    category: 'Vaste activa',
    balance: -35000,
    debit: 0,
    credit: 35000,
  },
  {
    id: 'gl-0400',
    code: '0400',
    description: 'Vervoermiddelen',
    type: 'asset',
    category: 'Vaste activa',
    balance: 95000, // 3 bezorgbussen
    debit: 95000,
    credit: 0,
  },
  {
    id: 'gl-0410',
    code: '0410',
    description: 'Afschrijving vervoermiddelen',
    type: 'asset',
    category: 'Vaste activa',
    balance: -38000,
    debit: 0,
    credit: 38000,
  },

  // Vlottende activa - Sterke liquiditeit
  {
    id: 'gl-1000',
    code: '1000',
    description: 'Kas',
    type: 'asset',
    category: 'Liquide middelen',
    balance: 8500, // Dagelijkse kassa
    debit: 125000,
    credit: 116500,
  },
  {
    id: 'gl-1100',
    code: '1100',
    description: 'ING Bankrekening',
    type: 'asset',
    category: 'Liquide middelen',
    balance: 187500, // Gezonde cashpositie
    debit: 1850000,
    credit: 1662500,
  },
  {
    id: 'gl-1200',
    code: '1200',
    description: 'Spaarrekening',
    type: 'asset',
    category: 'Liquide middelen',
    balance: 75000, // Reserve voor investeringen
    debit: 75000,
    credit: 0,
  },
  {
    id: 'gl-1300',
    code: '1300',
    description: 'Debiteuren',
    type: 'asset',
    category: 'Vorderingen',
    balance: 52000, // B2B klanten (hotels, restaurants)
    debit: 425000,
    credit: 373000,
  },
  {
    id: 'gl-1400',
    code: '1400',
    description: 'Voorraad grondstoffen',
    type: 'asset',
    category: 'Voorraden',
    balance: 24000, // Meel, boter, suiker, etc.
    debit: 145000,
    credit: 121000,
  },
  {
    id: 'gl-1410',
    code: '1410',
    description: 'Voorraad verpakkingen',
    type: 'asset',
    category: 'Voorraden',
    balance: 4500,
    debit: 22000,
    credit: 17500,
  },
  {
    id: 'gl-1500',
    code: '1500',
    description: 'Te vorderen BTW',
    type: 'asset',
    category: 'Vorderingen',
    balance: 12800,
    debit: 95000,
    credit: 82200,
  },

  // BALANS - PASSIVA (Liabilities & Equity)
  // Eigen vermogen - Winstgevend bedrijf
  {
    id: 'gl-2000',
    code: '2000',
    description: 'Aandelenkapitaal',
    type: 'equity',
    category: 'Eigen vermogen',
    balance: 100000,
    debit: 0,
    credit: 100000,
  },
  {
    id: 'gl-2100',
    code: '2100',
    description: 'Reserves',
    type: 'equity',
    category: 'Eigen vermogen',
    balance: 185000, // Opgebouwd uit eerdere winsten
    debit: 0,
    credit: 185000,
  },
  {
    id: 'gl-2200',
    code: '2200',
    description: 'Winst lopend boekjaar',
    type: 'equity',
    category: 'Eigen vermogen',
    balance: 92500, // ~6% van €1.5M omzet
    debit: 0,
    credit: 92500,
  },

  // Vreemd vermogen lang
  {
    id: 'gl-2500',
    code: '2500',
    description: 'Lening ING Bank',
    type: 'liability',
    category: 'Langlopende schulden',
    balance: 85000, // Investeringslening machines
    debit: 15000,
    credit: 100000,
  },

  // Vreemd vermogen kort
  {
    id: 'gl-1600',
    code: '1600',
    description: 'Crediteuren',
    type: 'liability',
    category: 'Kortlopende schulden',
    balance: 38500, // Leveranciers
    debit: 285000,
    credit: 323500,
  },
  {
    id: 'gl-1700',
    code: '1700',
    description: 'Af te dragen BTW',
    type: 'liability',
    category: 'Kortlopende schulden',
    balance: 24500,
    debit: 65000,
    credit: 89500,
  },
  {
    id: 'gl-1800',
    code: '1800',
    description: 'Af te dragen loonheffing',
    type: 'liability',
    category: 'Kortlopende schulden',
    balance: 14200, // ~15 FTE
    debit: 42600,
    credit: 56800,
  },
  {
    id: 'gl-1900',
    code: '1900',
    description: 'Overige schulden',
    type: 'liability',
    category: 'Kortlopende schulden',
    balance: 8500,
    debit: 12500,
    credit: 21000,
  },

  // RESULTATENREKENING - OMZET (Revenue) ~€860K YTD (Jan-okt)
  {
    id: 'gl-8000',
    code: '8000',
    description: 'Omzet brood',
    type: 'revenue',
    category: 'Omzet',
    balance: 515000, // 55% van omzet - core business
    debit: 0,
    credit: 515000,
  },
  {
    id: 'gl-8010',
    code: '8010',
    description: 'Omzet gebak en taarten',
    type: 'revenue',
    category: 'Omzet',
    balance: 218000, // 25% - hogere marge
    debit: 0,
    credit: 218000,
  },
  {
    id: 'gl-8020',
    code: '8020',
    description: 'Omzet catering',
    type: 'revenue',
    category: 'Omzet',
    balance: 112000, // 13% - B2B events
    debit: 0,
    credit: 112000,
  },
  {
    id: 'gl-8100',
    code: '8100',
    description: 'Overige opbrengsten',
    type: 'revenue',
    category: 'Omzet',
    balance: 18500, // 2% - koffie, merchandise
    debit: 0,
    credit: 18500,
  },

  // RESULTATENREKENING - KOSTEN (Expenses)
  // Kostprijs omzet (~35% van omzet)
  {
    id: 'gl-7000',
    code: '7000',
    description: 'Inkoop grondstoffen',
    type: 'expense',
    category: 'Kostprijs omzet',
    balance: 265000, // Meel, boter, eieren, etc.
    debit: 265000,
    credit: 0,
  },
  {
    id: 'gl-7010',
    code: '7010',
    description: 'Inkoop verpakkingen',
    type: 'expense',
    category: 'Kostprijs omzet',
    balance: 32000,
    debit: 32000,
    credit: 0,
  },
  {
    id: 'gl-7100',
    code: '7100',
    description: 'Voorraadverschillen',
    type: 'expense',
    category: 'Kostprijs omzet',
    balance: 4200,
    debit: 4200,
    credit: 0,
  },

  // Personeelskosten (~35% van omzet) - 15 FTE
  {
    id: 'gl-4000',
    code: '4000',
    description: 'Lonen en salarissen',
    type: 'expense',
    category: 'Personeelskosten',
    balance: 285000, // 15 FTE gemiddeld €35K bruto
    debit: 285000,
    credit: 0,
  },
  {
    id: 'gl-4010',
    code: '4010',
    description: 'Sociale lasten',
    type: 'expense',
    category: 'Personeelskosten',
    balance: 57000, // ~20% van lonen
    debit: 57000,
    credit: 0,
  },
  {
    id: 'gl-4020',
    code: '4020',
    description: 'Pensioenlasten',
    type: 'expense',
    category: 'Personeelskosten',
    balance: 22800, // ~8% van lonen
    debit: 22800,
    credit: 0,
  },
  {
    id: 'gl-4100',
    code: '4100',
    description: 'Overige personeelskosten',
    type: 'expense',
    category: 'Personeelskosten',
    balance: 9500, // Opleidingen, werkkleding
    debit: 9500,
    credit: 0,
  },

  // Huisvestingskosten
  {
    id: 'gl-4200',
    code: '4200',
    description: 'Huur bedrijfspand',
    type: 'expense',
    category: 'Huisvestingskosten',
    balance: 72000, // €6000/maand - Amsterdam
    debit: 72000,
    credit: 0,
  },
  {
    id: 'gl-4210',
    code: '4210',
    description: 'Energie en water',
    type: 'expense',
    category: 'Huisvestingskosten',
    balance: 38000, // Ovens zijn energie-intensief
    debit: 38000,
    credit: 0,
  },
  {
    id: 'gl-4220',
    code: '4220',
    description: 'Onderhoud pand',
    type: 'expense',
    category: 'Huisvestingskosten',
    balance: 7500,
    debit: 7500,
    credit: 0,
  },
  {
    id: 'gl-4230',
    code: '4230',
    description: 'Verzekeringen',
    type: 'expense',
    category: 'Huisvestingskosten',
    balance: 12500,
    debit: 12500,
    credit: 0,
  },

  // Afschrijvingen
  {
    id: 'gl-4300',
    code: '4300',
    description: 'Afschrijving machines',
    type: 'expense',
    category: 'Afschrijvingen',
    balance: 24500, // 10% van €245K
    debit: 24500,
    credit: 0,
  },
  {
    id: 'gl-4310',
    code: '4310',
    description: 'Afschrijving inventaris',
    type: 'expense',
    category: 'Afschrijvingen',
    balance: 7500,
    debit: 7500,
    credit: 0,
  },
  {
    id: 'gl-4320',
    code: '4320',
    description: 'Afschrijving vervoermiddelen',
    type: 'expense',
    category: 'Afschrijvingen',
    balance: 12000, // 3 bussen over 5 jaar
    debit: 12000,
    credit: 0,
  },

  // Verkoopkosten
  {
    id: 'gl-4400',
    code: '4400',
    description: 'Reclame en marketing',
    type: 'expense',
    category: 'Verkoopkosten',
    balance: 15000, // Social media, lokale advertenties
    debit: 15000,
    credit: 0,
  },
  {
    id: 'gl-4410',
    code: '4410',
    description: 'Bezorgkosten',
    type: 'expense',
    category: 'Verkoopkosten',
    balance: 28000, // Brandstof, onderhoud bussen
    debit: 28000,
    credit: 0,
  },

  // Algemene kosten
  {
    id: 'gl-4500',
    code: '4500',
    description: 'Kantoorkosten',
    type: 'expense',
    category: 'Algemene kosten',
    balance: 5500,
    debit: 5500,
    credit: 0,
  },
  {
    id: 'gl-4510',
    code: '4510',
    description: 'Accountantskosten',
    type: 'expense',
    category: 'Algemene kosten',
    balance: 9500,
    debit: 9500,
    credit: 0,
  },
  {
    id: 'gl-4520',
    code: '4520',
    description: 'Bankkosten',
    type: 'expense',
    category: 'Algemene kosten',
    balance: 2400,
    debit: 2400,
    credit: 0,
  },
  {
    id: 'gl-4530',
    code: '4530',
    description: 'Rentelasten',
    type: 'expense',
    category: 'Financiele lasten',
    balance: 4100, // ~5% op €85K lening
    debit: 4100,
    credit: 0,
  },
];

/**
 * Get GL accounts with optional filters
 */
export function getGLAccounts(params: {
  type?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  category?: string;
}): DemoGLAccount[] {
  const { type, category } = params;

  let accounts = DEMO_GL_ACCOUNTS;

  if (type) {
    accounts = accounts.filter((acc) => acc.type === type);
  }

  if (category) {
    accounts = accounts.filter((acc) =>
      acc.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  return accounts;
}

/**
 * Get trial balance (all accounts with balances)
 */
export function getTrialBalance(): {
  accounts: DemoGLAccount[];
  totalDebit: number;
  totalCredit: number;
  totalBalance: number;
} {
  const accounts = DEMO_GL_ACCOUNTS;

  let totalDebit = 0;
  let totalCredit = 0;

  for (const acc of accounts) {
    totalDebit += acc.debit;
    totalCredit += acc.credit;
  }

  return {
    accounts,
    totalDebit,
    totalCredit,
    totalBalance: totalDebit - totalCredit,
  };
}

/**
 * Calculate totals by account type
 */
export function getAccountTotalsByType(): Record<string, number> {
  const totals: Record<string, number> = {
    asset: 0,
    liability: 0,
    equity: 0,
    revenue: 0,
    expense: 0,
  };

  for (const acc of DEMO_GL_ACCOUNTS) {
    totals[acc.type] += acc.balance;
  }

  return totals;
}
