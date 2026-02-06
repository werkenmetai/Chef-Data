/**
 * Demo Generators: Journal tools
 *
 * Returns demo data for journal entries and transaction search.
 */

import { getCurrentIndustryConfig } from '../context';

// Helper to create dates
function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Demo journal entry interface
 */
interface DemoJournalEntry {
  id: string;
  entryNumber: number;
  journalCode: string;
  journalDescription: string;
  date: string;
  status: 'draft' | 'processed';
  description: string;
  lines: {
    lineNumber: number;
    glAccountCode: string;
    glAccountDescription: string;
    debit: number;
    credit: number;
    description: string;
  }[];
}

/**
 * Generate demo journal entries
 */
function generateJournalEntries(): DemoJournalEntry[] {
  return [
    {
      id: 'je-001',
      entryNumber: 2024001,
      journalCode: 'MEM',
      journalDescription: 'Memoriaal',
      date: daysAgo(5),
      status: 'processed',
      description: 'Afschrijving januari 2024',
      lines: [
        { lineNumber: 1, glAccountCode: '4300', glAccountDescription: 'Afschrijving machines', debit: 708.33, credit: 0, description: 'Afschrijving machines jan' },
        { lineNumber: 2, glAccountCode: '0210', glAccountDescription: 'Afschrijving machines', debit: 0, credit: 708.33, description: 'Cum. afschrijving machines' },
        { lineNumber: 3, glAccountCode: '4310', glAccountDescription: 'Afschrijving inventaris', debit: 208.33, credit: 0, description: 'Afschrijving inventaris jan' },
        { lineNumber: 4, glAccountCode: '0310', glAccountDescription: 'Afschrijving inventaris', debit: 0, credit: 208.33, description: 'Cum. afschrijving inventaris' },
      ],
    },
    {
      id: 'je-002',
      entryNumber: 2024002,
      journalCode: 'MEM',
      journalDescription: 'Memoriaal',
      date: daysAgo(3),
      status: 'draft',
      description: 'Voorziening dubieuze debiteuren',
      lines: [
        { lineNumber: 1, glAccountCode: '4600', glAccountDescription: 'Afschrijving debiteuren', debit: 500, credit: 0, description: 'Voorziening dubieuze debiteuren' },
        { lineNumber: 2, glAccountCode: '1310', glAccountDescription: 'Voorziening debiteuren', debit: 0, credit: 500, description: 'Voorziening dubieuze debiteuren' },
      ],
    },
    {
      id: 'je-003',
      entryNumber: 2024003,
      journalCode: 'SAL',
      journalDescription: 'Salarissen',
      date: daysAgo(25),
      status: 'processed',
      description: 'Salarissen januari 2024',
      lines: [
        { lineNumber: 1, glAccountCode: '4000', glAccountDescription: 'Lonen en salarissen', debit: 10416.67, credit: 0, description: 'Bruto lonen jan' },
        { lineNumber: 2, glAccountCode: '4010', glAccountDescription: 'Sociale lasten', debit: 2083.33, credit: 0, description: 'Sociale lasten jan' },
        { lineNumber: 3, glAccountCode: '1800', glAccountDescription: 'Af te dragen loonheffing', debit: 0, credit: 3200, description: 'Loonheffing jan' },
        { lineNumber: 4, glAccountCode: '1100', glAccountDescription: 'ING Bankrekening', debit: 0, credit: 9300, description: 'Netto lonen jan' },
      ],
    },
    {
      id: 'je-004',
      entryNumber: 2024004,
      journalCode: 'BTW',
      journalDescription: 'BTW Aangifte',
      date: daysAgo(10),
      status: 'draft',
      description: 'BTW aangifte Q4 2023',
      lines: [
        { lineNumber: 1, glAccountCode: '1700', glAccountDescription: 'Af te dragen BTW', debit: 5200, credit: 0, description: 'BTW afdracht Q4' },
        { lineNumber: 2, glAccountCode: '1500', glAccountDescription: 'Te vorderen BTW', debit: 0, credit: 2800, description: 'Voorbelasting Q4' },
        { lineNumber: 3, glAccountCode: '1100', glAccountDescription: 'ING Bankrekening', debit: 0, credit: 2400, description: 'BTW betaling Q4' },
      ],
    },
    {
      id: 'je-005',
      entryNumber: 2024005,
      journalCode: 'MEM',
      journalDescription: 'Memoriaal',
      date: daysAgo(2),
      status: 'draft',
      description: 'Correctie voorraadwaardering',
      lines: [
        { lineNumber: 1, glAccountCode: '7100', glAccountDescription: 'Voorraadverschillen', debit: 350, credit: 0, description: 'Voorraadtelling verschil' },
        { lineNumber: 2, glAccountCode: '1400', glAccountDescription: 'Voorraad grondstoffen', debit: 0, credit: 350, description: 'Correctie voorraad grondstoffen' },
      ],
    },
  ];
}

/**
 * Generate response for get_journal_entries tool
 */
export function generateGetJournalEntriesResponse(
  params: Record<string, unknown>
): unknown {
  const status = params.status as 'draft' | 'processed' | 'all' | undefined;
  const journalCode = params.journal_code as string | undefined;
  const fromDate = params.from_date as string | undefined;
  const toDate = params.to_date as string | undefined;

  let entries = generateJournalEntries();

  // Filter by status
  if (status && status !== 'all') {
    entries = entries.filter((e) => e.status === status);
  }

  // Filter by journal code
  if (journalCode) {
    entries = entries.filter((e) => e.journalCode === journalCode);
  }

  // Filter by date
  if (fromDate) {
    entries = entries.filter((e) => e.date >= fromDate);
  }
  if (toDate) {
    entries = entries.filter((e) => e.date <= toDate);
  }

  const draftEntries = entries.filter((e) => e.status === 'draft');
  const totalDebit = entries.reduce(
    (sum, e) => sum + e.lines.reduce((lsum, l) => lsum + l.debit, 0),
    0
  );

  return {
    entries: entries.map((e) => ({
      id: e.id,
      entry_number: e.entryNumber,
      journal_code: e.journalCode,
      journal_description: e.journalDescription,
      date: e.date,
      status: e.status,
      description: e.description,
      line_count: e.lines.length,
      total_debit: e.lines.reduce((sum, l) => sum + l.debit, 0),
      total_credit: e.lines.reduce((sum, l) => sum + l.credit, 0),
    })),
    count: entries.length,
    summary: {
      draft_count: draftEntries.length,
      processed_count: entries.length - draftEntries.length,
      total_debit: totalDebit,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: `${entries.length} journaalboekingen gevonden, waarvan ${draftEntries.length} nog niet verwerkt.`,
      action: draftEntries.length > 0
        ? `Let op: ${draftEntries.length} concept boekingen wachten op verwerking.`
        : 'Alle boekingen zijn verwerkt.',
    },
    related_tools: [
      { tool: 'get_transactions', when: 'Voor gedetailleerde transactieregels' },
      { tool: 'get_trial_balance', when: 'Voor effect op balans' },
    ],
  };
}

/**
 * Generate response for search_transactions tool (get_transaction_lines)
 */
export function generateSearchTransactionsResponse(
  params: Record<string, unknown>
): unknown {
  const fromDate = params.from_date as string | undefined;
  const toDate = params.to_date as string | undefined;
  const glAccountCode = params.gl_account as string | undefined;
  const description = params.description as string | undefined;
  const minAmount = params.min_amount as number | undefined;
  const maxAmount = params.max_amount as number | undefined;

  // Generate sample transaction lines from journal entries
  const entries = generateJournalEntries();
  let lines: {
    entryId: string;
    entryNumber: number;
    lineNumber: number;
    date: string;
    journalCode: string;
    glAccountCode: string;
    glAccountDescription: string;
    description: string;
    debit: number;
    credit: number;
  }[] = [];

  for (const entry of entries) {
    for (const line of entry.lines) {
      lines.push({
        entryId: entry.id,
        entryNumber: entry.entryNumber,
        lineNumber: line.lineNumber,
        date: entry.date,
        journalCode: entry.journalCode,
        glAccountCode: line.glAccountCode,
        glAccountDescription: line.glAccountDescription,
        description: line.description,
        debit: line.debit,
        credit: line.credit,
      });
    }
  }

  // Apply filters
  if (fromDate) {
    lines = lines.filter((l) => l.date >= fromDate);
  }
  if (toDate) {
    lines = lines.filter((l) => l.date <= toDate);
  }
  if (glAccountCode) {
    lines = lines.filter((l) => l.glAccountCode === glAccountCode);
  }
  if (description) {
    const searchTerm = description.toLowerCase();
    lines = lines.filter((l) => l.description.toLowerCase().includes(searchTerm));
  }
  if (minAmount !== undefined) {
    lines = lines.filter((l) => l.debit >= minAmount || l.credit >= minAmount);
  }
  if (maxAmount !== undefined) {
    lines = lines.filter((l) => l.debit <= maxAmount && l.credit <= maxAmount);
  }

  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

  return {
    transactions: lines.map((l) => ({
      entry_id: l.entryId,
      entry_number: l.entryNumber,
      line_number: l.lineNumber,
      date: l.date,
      journal_code: l.journalCode,
      gl_account_code: l.glAccountCode,
      gl_account_description: l.glAccountDescription,
      description: l.description,
      debit: l.debit,
      credit: l.credit,
    })),
    count: lines.length,
    totals: {
      debit: Math.round(totalDebit * 100) / 100,
      credit: Math.round(totalCredit * 100) / 100,
      balance: Math.round((totalDebit - totalCredit) * 100) / 100,
    },
    filters: {
      from_date: fromDate,
      to_date: toDate,
      gl_account: glAccountCode,
      description: description,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: `${lines.length} transactieregels gevonden. Totaal debet EUR ${totalDebit.toLocaleString('nl-NL')}, credit EUR ${totalCredit.toLocaleString('nl-NL')}.`,
    },
    related_tools: [
      { tool: 'get_gl_accounts', when: 'Voor grootboekrekeningen' },
      { tool: 'get_journal_entries', when: 'Voor volledige boekingen' },
    ],
  };
}
