/**
 * Journal Entry Tools
 *
 * Tools for working with Exact Online journal entries (memoriaal boekingen, dagboekposten).
 * These are essential for viewing unprocessed/draft bookings.
 *
 * @see EXACT-011 in operations/ROADMAP.md
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import { escapeODataString } from '../exact/odata-query';

/**
 * Get General Journal Entries Tool
 *
 * Retrieves memorial/journal entries - crucial for unprocessed bookings visibility.
 */
export class GetGeneralJournalEntriesTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_journal_entries',
    description:
      'Haal memoriaal boekingen / dagboekposten op uit Exact Online. ' +
      'Gebruik voor: handmatige boekingen, correcties, afschrijvingen, overlopende posten. ' +
      'Kan filteren op periode, dagboek, grootboekrekening, en verwerkt/onverwerkt status.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        from_date: {
          type: 'string',
          description: 'Begindatum (YYYY-MM-DD). Default: begin dit jaar.',
        },
        to_date: {
          type: 'string',
          description: 'Einddatum (YYYY-MM-DD). Default: vandaag.',
        },
        journal_code: {
          type: 'string',
          description: 'Filter op dagboekcode (bijv. "90" voor memoriaal). Optioneel.',
        },
        gl_account: {
          type: 'string',
          description: 'Filter op grootboekrekening (GUID). Optioneel.',
        },
        status: {
          type: 'string',
          enum: ['all', 'draft', 'processed'],
          description: 'Status filter: draft (onverwerkt), processed (verwerkt), all. Default: all',
        },
        financial_year: {
          type: 'number',
          description: 'Boekjaar. Default: huidig jaar.',
        },
        financial_period: {
          type: 'number',
          description: 'Periode (1-12). Optioneel.',
        },
        limit: {
          type: 'number',
          description: 'Maximum aantal resultaten (1-500). Default: 100',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        entries: {
          type: 'array',
          description: 'Lijst van dagboekposten',
        },
        count: { type: 'number' },
        totals: {
          type: 'object',
          description: 'Totalen: total_debit, total_credit, net',
        },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['entries', 'count', 'totals', 'filters', 'division'],
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

    // Default date range: this year
    const today = new Date();
    const defaultFromDate = new Date(today.getFullYear(), 0, 1);

    const fromDate = (params.from_date as string) || defaultFromDate.toISOString().split('T')[0];
    const toDate = (params.to_date as string) || today.toISOString().split('T')[0];
    const journalCode = params.journal_code as string | undefined;
    const glAccount = params.gl_account as string | undefined;
    const status = (params.status as string) || 'all';
    const financialYear = (params.financial_year as number) || today.getFullYear();
    const financialPeriod = params.financial_period as number | undefined;

    // Build OData filter
    // Note: Date field doesn't exist on GeneralJournalEntries - use Created instead
    // Note: OData datetime requires time component (T00:00:00)
    // @see LESSONS-LEARNED.md - OData datetime vereist tijdcomponent
    const filters: string[] = [
      `Created ge datetime'${fromDate}T00:00:00'`,
      `Created le datetime'${toDate}T23:59:59'`,
      `FinancialYear eq ${financialYear}`,
    ];

    if (journalCode) {
      filters.push(`JournalCode eq '${escapeODataString(journalCode)}'`);
    }

    if (glAccount) {
      filters.push(`GLAccount eq guid'${glAccount}'`);
    }

    if (financialPeriod) {
      filters.push(`FinancialPeriod eq ${financialPeriod}`);
    }

    // Status filter: 0 = draft, 20 = processed
    if (status === 'draft') {
      filters.push(`Status eq 0`);
    } else if (status === 'processed') {
      filters.push(`Status eq 20`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';

    // Note: Many fields may not exist on GeneralJournalEntries - use absolute minimal set
    // Only EntryID and basic fields - test one field at a time when debugging
    const endpoint = `/${division}/generaljournalentry/GeneralJournalEntries?$select=EntryID,JournalCode,FinancialYear,FinancialPeriod${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<{ d: Record<string, unknown> }>(connection, endpoint);
      const entries = extractODataResults<Record<string, unknown>>(response?.d);

      const formattedEntries = entries.map((entry: Record<string, unknown>) => {
        return {
          entry_id: entry.EntryID,
          journal_code: entry.JournalCode,
          year: entry.FinancialYear,
          period: entry.FinancialPeriod,
        };
      });

      return {
        entries: formattedEntries,
        count: formattedEntries.length,
        filters: {
          from_date: fromDate,
          to_date: toDate,
          journal_code: journalCode,
          status,
          financial_year: financialYear,
          financial_period: financialPeriod,
        },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen dagboekposten: ${(error as Error).message}`,
        division,
      };
    }
  }
}

/**
 * Get Transaction Lines Tool
 *
 * More detailed transaction search with all filters from Exact's search screen.
 */
export class GetTransactionLinesTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'search_transactions',
    description:
      'Uitgebreid zoeken in transacties/boekingen met alle filters zoals in Exact Online. ' +
      'Gebruik voor: specifieke boekingen zoeken, grootboekanalyse, dagboekcontrole. ' +
      'Filters: datum, dagboek, dagboektype, grootboekrekening, debet/credit, verwerkt status.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        from_date: {
          type: 'string',
          description: 'Begindatum (YYYY-MM-DD).',
        },
        to_date: {
          type: 'string',
          description: 'Einddatum (YYYY-MM-DD).',
        },
        financial_year: {
          type: 'number',
          description: 'Boekjaar.',
        },
        financial_period: {
          type: 'number',
          description: 'Periode (1-12).',
        },
        journal_code: {
          type: 'string',
          description: 'Dagboekcode.',
        },
        journal_type: {
          type: 'number',
          description: 'Dagboektype (systeem enum). Vraag beschikbare types op via /financial/Journals endpoint. Voorbeelden: Kas, Bank, Verkoop, Inkoop, Memoriaal.',
        },
        gl_account: {
          type: 'string',
          description: 'Grootboekrekeningnummer (bijv. "1600" voor crediteuren).',
        },
        amount_type: {
          type: 'string',
          enum: ['all', 'debit', 'credit'],
          description: 'Debet/Credit filter. Default: all',
        },
        min_amount: {
          type: 'number',
          description: 'Minimum bedrag (absoluut).',
        },
        max_amount: {
          type: 'number',
          description: 'Maximum bedrag (absoluut).',
        },
        processed: {
          type: 'boolean',
          description: 'true = verwerkt, false = onverwerkt, niet opgeven = alle',
        },
        description_contains: {
          type: 'string',
          description: 'Zoek in omschrijving.',
        },
        limit: {
          type: 'number',
          description: 'Maximum aantal resultaten (1-1000). Default: 200',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        transactions: { type: 'array' },
        count: { type: 'number' },
        totals: { type: 'object' },
        filters_applied: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['transactions', 'count', 'totals', 'filters_applied', 'division'],
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

    const limit = Math.min(Math.max((params.limit as number) || 200, 1), 1000);

    // Build OData filter
    const filters: string[] = [];

    // Date filters
    if (params.from_date) {
      filters.push(`Date ge datetime'${params.from_date}'`);
    }
    if (params.to_date) {
      filters.push(`Date le datetime'${params.to_date}'`);
    }

    // Year/Period
    if (params.financial_year) {
      filters.push(`FinancialYear eq ${params.financial_year}`);
    }
    if (params.financial_period) {
      filters.push(`FinancialPeriod eq ${params.financial_period}`);
    }

    // Journal filters
    if (params.journal_code) {
      filters.push(`JournalCode eq '${escapeODataString(params.journal_code as string)}'`);
    }
    if (params.journal_type !== undefined) {
      filters.push(`Type eq ${params.journal_type}`);
    }

    // GL Account filter
    if (params.gl_account) {
      filters.push(`GLAccountCode eq '${escapeODataString(params.gl_account as string)}'`);
    }

    // Amount filters
    const amountType = params.amount_type as string;
    if (amountType === 'debit') {
      filters.push(`AmountDC gt 0`);
    } else if (amountType === 'credit') {
      filters.push(`AmountDC lt 0`);
    }

    if (params.min_amount !== undefined) {
      filters.push(`(AmountDC ge ${params.min_amount} or AmountDC le -${params.min_amount})`);
    }
    if (params.max_amount !== undefined) {
      filters.push(`(AmountDC le ${params.max_amount} and AmountDC ge -${params.max_amount})`);
    }

    // Description search
    // Note: Exact Online OData requires 'eq true' suffix for substringof()
    if (params.description_contains) {
      filters.push(`substringof('${escapeODataString(params.description_contains as string)}', Description) eq true`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';

    const endpoint = `/${division}/financialtransaction/TransactionLines?$select=ID,LineNumber,Date,FinancialYear,FinancialPeriod,JournalCode,JournalDescription,Type,GLAccount,GLAccountCode,GLAccountDescription,Description,AmountDC,AmountFC,Currency,AccountCode,AccountName,InvoiceNumber,Document${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<{ d: Record<string, unknown> }>(connection, endpoint);
      const transactions = extractODataResults<Record<string, unknown>>(response?.d);

      let totalDebit = 0;
      let totalCredit = 0;

      const formattedTransactions = transactions.map((tx: Record<string, unknown>) => {
        const amount = tx.AmountDC as number;
        if (amount > 0) {
          totalDebit += amount;
        } else {
          totalCredit += Math.abs(amount);
        }

        return {
          id: tx.ID,
          line_number: tx.LineNumber,
          date: this.formatDate(tx.Date as string),
          year: tx.FinancialYear,
          period: tx.FinancialPeriod,
          journal_code: tx.JournalCode,
          journal_name: tx.JournalDescription,
          journal_type: tx.Type,
          journal_type_label: this.getJournalTypeLabel(tx.Type as number),
          gl_account_code: tx.GLAccountCode,
          gl_account_name: tx.GLAccountDescription,
          relation_code: tx.AccountCode,
          relation_name: tx.AccountName,
          description: tx.Description,
          amount: amount,
          debit: amount > 0 ? amount : 0,
          credit: amount < 0 ? Math.abs(amount) : 0,
          currency: tx.Currency,
          invoice_number: tx.InvoiceNumber,
          document: tx.Document,
        };
      });

      return {
        transactions: formattedTransactions,
        count: formattedTransactions.length,
        totals: {
          total_debit: Math.round(totalDebit * 100) / 100,
          total_credit: Math.round(totalCredit * 100) / 100,
          net: Math.round((totalDebit - totalCredit) * 100) / 100,
        },
        filters_applied: {
          from_date: params.from_date,
          to_date: params.to_date,
          financial_year: params.financial_year,
          financial_period: params.financial_period,
          journal_code: params.journal_code,
          journal_type: params.journal_type,
          gl_account: params.gl_account,
          amount_type: amountType,
          min_amount: params.min_amount,
          max_amount: params.max_amount,
          description_contains: params.description_contains,
        },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij zoeken transacties: ${(error as Error).message}`,
        division,
      };
    }
  }

  private formatDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    const match = dateStr.match(/\/Date\((\d+)\)\//);
    if (match) {
      return new Date(parseInt(match[1])).toISOString().split('T')[0];
    }
    return dateStr;
  }

  private getJournalTypeLabel(type: number): string {
    const labels: Record<number, string> = {
      10: 'Verkoop',
      12: 'Verkoopcorrectie',
      20: 'Inkoop',
      21: 'Inkoopcorrectie',
      22: 'Inkoop direct',
      30: 'Bank/Kas',
      40: 'Kas',
      70: 'Memoriaal',
      80: 'Voorraad',
      82: 'Herwaardering',
      83: 'Voorraadcorrectie',
      84: 'WIP',
      85: 'Conversieverschil',
      90: 'Overig memoriaal',
    };
    return labels[type] || `Type ${type}`;
  }
}

// Export all journal tools
export const journalTools = [
  GetGeneralJournalEntriesTool,
  GetTransactionLinesTool,
];
