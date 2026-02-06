/**
 * Invoice Tools
 *
 * Tools for working with Exact Online invoices (sales and purchase).
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, parseExactDate, formatExactDate, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import { logger } from '../lib/logger';
import { ConnectionInfo } from '../auth/api-key';
import {
  ExactSalesInvoice,
  ExactPurchaseInvoice,
  ReceivableItem,
  PayableItem,
  OutstandingInvoicesResult,
  FallbackSalesInvoice,
  FallbackPurchaseEntry,
} from '@exact-mcp/shared';

/**
 * Get Sales Invoices Tool
 */
export class GetSalesInvoicesTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_sales_invoices',
    description:
      'Haal verkoopfacturen op uit Exact Online. ' +
      'GEBRUIK BIJ: facturenoverzicht, omzetanalyse, factuurstatus, klantfacturen. ' +
      'TIP: Combineer met get_outstanding_invoices voor openstaande bedragen. ' +
      'VOORBEELD: {"status": "open", "from_date": "2025-01-01", "to_date": "2025-01-31"}',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code. Optioneel (standaard administratie wordt gebruikt).',
        },
        status: {
          type: 'string',
          enum: ['open', 'paid', 'all'],
          description: 'Factuurstatus. Kies: "open" | "paid" | "all" (default: "all")',
        },
        customer_id: {
          type: 'string',
          description: 'Klant ID (GUID formaat). Gebruik search_relations om ID te vinden.',
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
          description: 'Maximum resultaten (1-500, default: 100).',
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

    const status = (params.status as string) || 'all';
    const customerId = params.customer_id as string | undefined;
    const fromDate = params.from_date as string | undefined;
    const toDate = params.to_date as string | undefined;
    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);

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

    // Build OData filter
    const filters: string[] = [];

    // Note: SalesInvoices uses numeric Status field, NOT OutstandingAmountDC for filtering
    // Status values: 10/20 = Processing/Processed (open), 50 = Paid
    // OutstandingAmountDC might not be filterable on this endpoint
    if (status === 'open') {
      filters.push('Status ne 50'); // Not paid (includes draft, processing, processed)
    } else if (status === 'paid') {
      filters.push('Status eq 50'); // Paid
    }

    if (customerId) {
      filters.push(`InvoiceTo eq guid'${customerId}'`);
    }

    if (fromDate) {
      filters.push(`InvoiceDate ge datetime'${fromDate}T00:00:00'`);
    }

    if (toDate) {
      filters.push(`InvoiceDate le datetime'${toDate}T23:59:59'`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';

    // Note: OutstandingAmountDC and PaymentConditionDescription may not exist on this endpoint
    // Use only confirmed fields to avoid "Invalid request" errors
    const endpoint = `/${division}/salesinvoice/SalesInvoices?$select=InvoiceID,InvoiceNumber,InvoiceTo,InvoiceToName,InvoiceDate,DueDate,Currency,AmountDC,VATAmountDC,Status,Description${filterString}&$top=${limit}`;

    const response = await this.exactRequest<{ d: Record<string, unknown> }>(
      connection,
      endpoint
    );

    const invoices = extractODataResults<ExactSalesInvoice>(response.d);

    // Calculate totals
    let totalAmount = 0;

    const mappedInvoices = invoices.map((inv: ExactSalesInvoice) => {
      totalAmount += inv.AmountDC || 0;
      // Note: OutstandingAmountDC not available on this endpoint
      // Use Status field: 50 = paid, other = open
      const isPaid = inv.Status === 50;

      return {
        id: inv.InvoiceID,
        invoice_number: inv.InvoiceNumber,
        customer_id: inv.InvoiceTo,
        customer_name: inv.InvoiceToName,
        invoice_date: formatExactDate(inv.InvoiceDate),
        due_date: formatExactDate(inv.DueDate),
        currency: inv.Currency,
        amount: inv.AmountDC,
        vat_amount: inv.VATAmountDC,
        status: isPaid ? 'paid' : 'open',
        status_code: inv.Status,
        description: inv.Description,
      };
    });

    // Build smart context based on results
    const result: Record<string, unknown> = {
      invoices: mappedInvoices,
      count: invoices.length,
      totals: {
        total_amount: totalAmount,
        currency: mappedInvoices[0]?.currency || 'EUR',
      },
      filters: { status, from_date: fromDate, to_date: toDate },
      division,
    };

    // Add contextual suggestions
    if (invoices.length === 0) {
      result.suggestions = [
        'Geen facturen gevonden met deze filters.',
        fromDate || toDate ? 'Probeer een ander datumbereik.' : 'Probeer filters toe te voegen met from_date en to_date.',
        status !== 'all' ? `Probeer status="all" voor alle facturen.` : null,
        'Gebruik list_divisions om te controleren of je de juiste administratie hebt.',
      ].filter(Boolean);
    } else {
      const openCount = mappedInvoices.filter(inv => inv.status === 'open').length;
      result.context = {
        summary: `${invoices.length} facturen gevonden${openCount > 0 ? `, waarvan ${openCount} openstaand` : ''}.`,
        tip: openCount > 0 ? 'Gebruik get_outstanding_invoices voor een gedetailleerd debiteurenoverzicht met ouderdomsanalyse.' : undefined,
      };
    }

    // Suggest related tools
    result.related_tools = [
      { tool: 'get_outstanding_invoices', when: 'Voor ouderdomsanalyse en betalingsachterstand' },
      { tool: 'search_relations', when: 'Om een specifieke klant te zoeken op naam' },
      { tool: 'get_bank_transactions', when: 'Voor ontvangen betalingen' },
    ];

    return result;
  }
}

/**
 * Get Purchase Invoices Tool
 */
export class GetPurchaseInvoicesTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_purchase_invoices',
    description:
      'Haal inkoopfacturen (crediteurenfacturen) op uit Exact Online. ' +
      'GEBRUIK BIJ: inkoopoverzicht, kostenanalyse, leveranciersfacturen, te betalen facturen. ' +
      'TIP: Gebruik get_outstanding_invoices type="payable" voor openstaande crediteuren. ' +
      'VOORBEELD: {"from_date": "2025-01-01", "to_date": "2025-01-31", "status": "open"}',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code. Optioneel (standaard administratie wordt gebruikt).',
        },
        status: {
          type: 'string',
          enum: ['open', 'paid', 'all'],
          description: 'Factuurstatus. Kies: "open" | "paid" | "all" (default: "all")',
        },
        supplier_id: {
          type: 'string',
          description: 'Leverancier ID (GUID formaat). Gebruik search_relations om ID te vinden.',
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
          description: 'Maximum resultaten (1-500, default: 100).',
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

    const status = (params.status as string) || 'all';
    const supplierId = params.supplier_id as string | undefined;
    const fromDate = params.from_date as string | undefined;
    const toDate = params.to_date as string | undefined;
    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);

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

    // Build OData filter
    const filters: string[] = [];

    // Note: PurchaseEntries doesn't have OutstandingAmount, filter on status later if needed
    if (supplierId) {
      filters.push(`Supplier eq guid'${supplierId}'`);
    }

    if (fromDate) {
      filters.push(`EntryDate ge datetime'${fromDate}T00:00:00'`);
    }

    if (toDate) {
      filters.push(`EntryDate le datetime'${toDate}T23:59:59'`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';

    // Use purchaseentry/PurchaseEntries endpoint (purchaseinvoice may not exist in all editions)
    const endpoint = `/${division}/purchaseentry/PurchaseEntries?$select=EntryID,EntryNumber,Supplier,SupplierName,EntryDate,DueDate,Currency,AmountDC,VATAmountDC,Description,PaymentCondition${filterString}&$top=${limit}`;

    const response = await this.exactRequest<{ d: Record<string, unknown> }>(
      connection,
      endpoint
    );

    const invoices = extractODataResults<ExactPurchaseInvoice>(response.d);

    // Calculate totals
    let totalAmount = 0;

    const mappedInvoices = invoices.map((inv: ExactPurchaseInvoice) => {
      totalAmount += inv.AmountDC || 0;

      return {
        id: inv.EntryID,
        entry_number: inv.EntryNumber,
        supplier_id: inv.Supplier,
        supplier_name: inv.SupplierName,
        invoice_date: formatExactDate(inv.EntryDate),
        due_date: formatExactDate(inv.DueDate),
        currency: inv.Currency,
        amount: inv.AmountDC,
        vat_amount: inv.VATAmountDC,
        description: inv.Description,
      };
    });

    // Build smart context based on results
    const result: Record<string, unknown> = {
      invoices: mappedInvoices,
      count: invoices.length,
      totals: {
        total_amount: totalAmount,
        currency: mappedInvoices[0]?.currency || 'EUR',
      },
      filters: { status, from_date: fromDate, to_date: toDate },
      division,
    };

    // Add contextual suggestions
    if (invoices.length === 0) {
      result.suggestions = [
        'Geen inkoopfacturen gevonden met deze filters.',
        fromDate || toDate ? 'Probeer een ander datumbereik.' : 'Probeer filters toe te voegen met from_date en to_date.',
        'Gebruik list_divisions om te controleren of je de juiste administratie hebt.',
      ].filter(Boolean);
    } else {
      result.context = {
        summary: `${invoices.length} inkoopfacturen gevonden, totaal €${totalAmount.toFixed(2)}.`,
      };
    }

    // Suggest related tools
    result.related_tools = [
      { tool: 'get_outstanding_invoices', when: 'Voor openstaande crediteuren (type="payable")' },
      { tool: 'search_relations', when: 'Om een specifieke leverancier te zoeken op naam' },
      { tool: 'get_bank_transactions', when: 'Voor gedane betalingen' },
    ];

    return result;
  }
}

/**
 * Get Outstanding Invoices Tool
 * Uses the dedicated financial/ReceivablesList and financial/PayablesList endpoints
 */
export class GetOutstandingInvoicesTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_outstanding_invoices',
    description:
      // WAT
      'Haal openstaande (onbetaalde) facturen op met details per factuur. ' +
      // WANNEER - Vraag-mapping
      'GEBRUIK BIJ: "openstaande facturen", "wie moet betalen", "wat moeten wij betalen", ' +
      '"debiteurenoverzicht", "crediteurenoverzicht", "achterstallige facturen", "te incasseren", ' +
      '"openstaande facturen van klant X", "wat staat er open bij leverancier Y". ' +
      // HOE - Filter guidance
      'KIES type=receivable voor: debiteuren, te ontvangen, klanten die moeten betalen. ' +
      'KIES type=payable voor: crediteuren, te betalen, leveranciers. ' +
      'KIES type=both voor: netto positie, totaal cashflow overzicht. ' +
      'KIES customer_id voor: openstaande facturen van een specifieke klant. ' +
      'KIES supplier_id voor: openstaande facturen aan een specifieke leverancier. ' +
      'KIES overdue_only=true voor: alleen achterstallige, incasso focus. ' +
      'KIES min_days_overdue=30/60/90 voor: specifieke ouderdom filter. ' +
      // WAT JE KRIJGT
      'RESULTAAT: factuurnummer, bedrag, vervaldatum, dagen open, klant/leverancier naam. ' +
      // WAT NIET
      'NIET VOOR: alleen totalen per leeftijdscategorie (gebruik get_aging_receivables/payables). ' +
      // TIP
      'TIP: Combineer met get_cashflow_forecast voor liquiditeitsprognose.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code. Optioneel: zonder = standaard administratie.',
        },
        type: {
          type: 'string',
          enum: ['receivable', 'payable', 'both'],
          description:
            'receivable = debiteuren (klanten die moeten betalen). ' +
            'payable = crediteuren (leveranciers die betaald moeten worden). ' +
            'both (default) = beide voor totaaloverzicht.',
        },
        customer_id: {
          type: 'string',
          description:
            'Filter op specifieke klant/debiteur ID (GUID). ' +
            'Gebruik bij: "openstaande facturen van klant X", "wat staat er open bij [naam]". ' +
            'Werkt alleen met type=receivable of type=both.',
        },
        supplier_id: {
          type: 'string',
          description:
            'Filter op specifieke leverancier/crediteur ID (GUID). ' +
            'Gebruik bij: "openstaande facturen aan leverancier X". ' +
            'Werkt alleen met type=payable of type=both.',
        },
        overdue_only: {
          type: 'boolean',
          description:
            'true = alleen facturen VOORBIJ vervaldatum (voor incasso). ' +
            'false (default) = alle openstaande facturen.',
        },
        min_days_overdue: {
          type: 'number',
          description:
            'Filter op minimaal X dagen over vervaldatum. ' +
            'Gebruik 30 voor > 1 maand, 60 voor > 2 maanden, 90 voor probleemgevallen. ' +
            'Zonder = alle openstaande (ook niet-vervallen).',
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

    const type = (params.type as string) || 'both';
    const customerId = params.customer_id as string | undefined;
    const supplierId = params.supplier_id as string | undefined;
    const overdueOnly = params.overdue_only === true;
    const minDaysOverdue = params.min_days_overdue as number | undefined;

    const results: OutstandingInvoicesResult = {
      receivables: [],
      payables: [],
      summary: {
        total_receivable: 0,
        total_payable: 0,
        net_position: 0,
      },
    };

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Build OData filter for date-based filtering (server-side)
    // This is more efficient than fetching all and filtering client-side
    const buildDateFilter = (): string => {
      if (minDaysOverdue && minDaysOverdue > 0) {
        // Filter: DueDate before (today - minDaysOverdue)
        const cutoffDate = new Date(today);
        cutoffDate.setDate(cutoffDate.getDate() - minDaysOverdue);
        return `DueDate lt datetime'${cutoffDate.toISOString().split('T')[0]}'`;
      } else if (overdueOnly) {
        // Filter: DueDate before today
        return `DueDate lt datetime'${todayStr}'`;
      }
      return '';
    };

    // Build complete OData filter with all conditions
    const buildFilter = (accountId?: string): string => {
      const filters: string[] = [];

      // Date filter
      const dateFilter = buildDateFilter();
      if (dateFilter) {
        filters.push(dateFilter);
      }

      // Account filter (customer or supplier)
      if (accountId) {
        filters.push(`AccountId eq guid'${accountId}'`);
      }

      return filters.length > 0 ? filters.join(' and ') : '';
    };

    // Get receivables using dedicated financial endpoint
    if (type === 'receivable' || type === 'both') {
      try {
        let endpoint = `/${division}/read/financial/ReceivablesList?$select=AccountId,AccountCode,AccountName,Amount,CurrencyCode,Description,DueDate,EntryNumber,InvoiceDate,InvoiceNumber,YourRef`;

        // Apply server-side filters (date + customer) if specified
        const receivablesFilter = buildFilter(customerId);
        if (receivablesFilter) {
          endpoint += `&$filter=${encodeURIComponent(receivablesFilter)}`;
        }

        const response = await this.exactRequest<{ d: Record<string, unknown> }>(
          connection,
          endpoint
        );

        for (const item of extractODataResults<ReceivableItem>(response.d)) {
          const dueDate = parseExactDate(item.DueDate);
          const daysOverdue = dueDate
            ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          if (overdueOnly && daysOverdue <= 0) continue;
          if (minDaysOverdue && daysOverdue < minDaysOverdue) continue;

          results.receivables.push({
            invoice_number: item.InvoiceNumber,
            entry_number: item.EntryNumber,
            customer_code: item.AccountCode,
            customer_name: item.AccountName,
            invoice_date: formatExactDate(item.InvoiceDate),
            due_date: formatExactDate(item.DueDate),
            amount: item.Amount,
            currency: item.CurrencyCode,
            description: item.Description,
            your_ref: item.YourRef,
            days_overdue: daysOverdue > 0 ? daysOverdue : 0,
            status: daysOverdue > 0 ? 'overdue' : 'pending',
          });

          results.summary.total_receivable += item.Amount || 0;
        }
      } catch (error) {
        logger.error('Receivables error', error instanceof Error ? error : undefined, { tool: 'GetOutstandingInvoices' });
        // Fallback to salesinvoice endpoint if ReceivablesList not available
        await this.getReceivablesFallback(division, connection, results, today, overdueOnly, minDaysOverdue);
      }
    }

    // Get payables using dedicated financial endpoint
    if (type === 'payable' || type === 'both') {
      try {
        let endpoint = `/${division}/read/financial/PayablesList?$select=AccountId,AccountCode,AccountName,Amount,CurrencyCode,Description,DueDate,EntryNumber,InvoiceDate,InvoiceNumber,YourRef`;

        // Apply server-side filters (date + supplier) if specified
        const payablesFilter = buildFilter(supplierId);
        if (payablesFilter) {
          endpoint += `&$filter=${encodeURIComponent(payablesFilter)}`;
        }

        const response = await this.exactRequest<{ d: Record<string, unknown> }>(
          connection,
          endpoint
        );

        for (const item of extractODataResults<PayableItem>(response.d)) {
          const dueDate = parseExactDate(item.DueDate);
          const daysOverdue = dueDate
            ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          if (overdueOnly && daysOverdue <= 0) continue;
          if (minDaysOverdue && daysOverdue < minDaysOverdue) continue;

          results.payables.push({
            invoice_number: item.InvoiceNumber,
            entry_number: item.EntryNumber,
            supplier_code: item.AccountCode,
            supplier_name: item.AccountName,
            invoice_date: formatExactDate(item.InvoiceDate),
            due_date: formatExactDate(item.DueDate),
            amount: item.Amount,
            currency: item.CurrencyCode,
            description: item.Description,
            your_ref: item.YourRef,
            days_overdue: daysOverdue > 0 ? daysOverdue : 0,
            status: daysOverdue > 0 ? 'overdue' : 'pending',
          });

          results.summary.total_payable += item.Amount || 0;
        }
      } catch (error) {
        logger.error('Payables error', error instanceof Error ? error : undefined, { tool: 'GetOutstandingInvoices' });
        // Fallback to purchaseentry endpoint if PayablesList not available
        await this.getPayablesFallback(division, connection, results, today, overdueOnly, minDaysOverdue);
      }
    }

    results.summary.net_position = results.summary.total_receivable - results.summary.total_payable;
    results.summary.currency = 'EUR';
    results.count = {
      receivables: results.receivables.length,
      payables: results.payables.length,
    };
    results.filters = { type, customer_id: customerId, supplier_id: supplierId, overdue_only: overdueOnly, min_days_overdue: minDaysOverdue };

    // Add smart context based on results
    const totalOpen = results.receivables.length + results.payables.length;
    if (totalOpen === 0) {
      results.suggestions = [
        'Geen openstaande facturen gevonden met deze filters.',
        overdueOnly ? 'Probeer zonder overdue_only=true om alle openstaande facturen te zien.' : null,
        minDaysOverdue ? 'Probeer zonder min_days_overdue filter.' : null,
        type !== 'both' ? `Probeer type="both" voor volledig overzicht.` : null,
      ].filter(Boolean);
    } else {
      // Provide actionable insights
      const overdueReceivables = results.receivables.filter(r => r.status === 'overdue');

      results.context = {
        summary: `${totalOpen} openstaande facturen: ${results.receivables.length} debiteuren (€${results.summary.total_receivable.toFixed(2)}), ${results.payables.length} crediteuren (€${results.summary.total_payable.toFixed(2)}).`,
        net_position_meaning: results.summary.net_position >= 0
          ? `Netto positie: €${results.summary.net_position.toFixed(2)} te ontvangen.`
          : `Netto positie: €${Math.abs(results.summary.net_position).toFixed(2)} te betalen.`,
        action_items: overdueReceivables.length > 0
          ? `Let op: ${overdueReceivables.length} achterstallige debiteurenfacturen - overweeg herinneringen te sturen.`
          : undefined,
      };
    }

    // Suggest related tools
    results.related_tools = [
      { tool: 'get_aging_receivables', when: 'Voor ouderdomsanalyse per categorie (30/60/90 dagen)' },
      { tool: 'get_cashflow_forecast', when: 'Voor liquiditeitsprognose' },
      { tool: 'search_relations', when: 'Om een klant/leverancier te zoeken op naam' },
    ];

    return results;
  }

  // Fallback method using salesinvoice endpoint
  private async getReceivablesFallback(
    division: number,
    connection: ConnectionInfo,
    results: OutstandingInvoicesResult,
    today: Date,
    overdueOnly: boolean,
    minDaysOverdue?: number
  ): Promise<void> {
    const endpoint = `/${division}/salesinvoice/SalesInvoices?$select=InvoiceID,InvoiceNumber,InvoiceToName,InvoiceDate,DueDate,Currency,AmountDC,OutstandingAmountDC&$filter=OutstandingAmountDC ne 0&$top=500`;

    const response = await this.exactRequest<{ d: Record<string, unknown> }>(
      connection,
      endpoint
    );

    for (const item of extractODataResults<FallbackSalesInvoice>(response.d)) {
      const dueDate = parseExactDate(item.DueDate);
      const daysOverdue = dueDate
        ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      if (overdueOnly && daysOverdue <= 0) continue;
      if (minDaysOverdue && daysOverdue < minDaysOverdue) continue;

      results.receivables.push({
        invoice_number: item.InvoiceNumber,
        customer_name: item.InvoiceToName,
        invoice_date: formatExactDate(item.InvoiceDate),
        due_date: formatExactDate(item.DueDate),
        amount: item.OutstandingAmountDC,
        currency: item.Currency,
        days_overdue: daysOverdue > 0 ? daysOverdue : 0,
        status: daysOverdue > 0 ? 'overdue' : 'pending',
      });

      results.summary.total_receivable += item.OutstandingAmountDC || 0;
    }
  }

  // Fallback method using purchaseentry endpoint
  private async getPayablesFallback(
    division: number,
    connection: ConnectionInfo,
    results: OutstandingInvoicesResult,
    today: Date,
    overdueOnly: boolean,
    minDaysOverdue?: number
  ): Promise<void> {
    const endpoint = `/${division}/purchaseentry/PurchaseEntries?$select=EntryID,EntryNumber,SupplierName,EntryDate,DueDate,Currency,AmountDC&$filter=AmountDC ne 0&$top=500`;

    const response = await this.exactRequest<{ d: Record<string, unknown> }>(
      connection,
      endpoint
    );

    for (const item of extractODataResults<FallbackPurchaseEntry>(response.d)) {
      const dueDate = parseExactDate(item.DueDate);
      const daysOverdue = dueDate
        ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      if (overdueOnly && daysOverdue <= 0) continue;
      if (minDaysOverdue && daysOverdue < minDaysOverdue) continue;

      results.payables.push({
        entry_number: item.EntryNumber,
        supplier_name: item.SupplierName,
        invoice_date: formatExactDate(item.EntryDate),
        due_date: formatExactDate(item.DueDate),
        amount: item.AmountDC,
        currency: item.Currency,
        days_overdue: daysOverdue > 0 ? daysOverdue : 0,
        status: daysOverdue > 0 ? 'overdue' : 'pending',
      });

      results.summary.total_payable += item.AmountDC || 0;
    }
  }
}
