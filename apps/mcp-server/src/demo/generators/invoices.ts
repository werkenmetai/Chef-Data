/**
 * Demo Generators: invoice tools
 *
 * Returns demo invoice data for Bakkerij De Gouden Croissant.
 */

import { getCurrentIndustryConfig } from '../context';
import {
  getSalesInvoices,
  getPurchaseInvoices,
  getOutstandingInvoices,
  DemoSalesInvoice,
  DemoPurchaseInvoice,
} from '../data/invoices';

/**
 * Calculate days overdue from due date
 */
function calculateDaysOverdue(dueDate: string): number {
  const today = new Date();
  const due = new Date(dueDate);
  const diffMs = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Generate response for get_sales_invoices tool
 */
export function generateGetSalesInvoicesResponse(
  params: Record<string, unknown>
): unknown {
  const status = (params.status as 'open' | 'paid' | 'all') || 'all';
  const customerId = params.customer_id as string | undefined;
  const fromDate = params.from_date as string | undefined;
  const toDate = params.to_date as string | undefined;
  const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);

  // Validate date formats
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (fromDate && !dateRegex.test(fromDate)) {
    return {
      error: `Ongeldig datumformaat voor from_date: "${fromDate}". Gebruik YYYY-MM-DD formaat.`,
      hint: 'Datums moeten exact het formaat YYYY-MM-DD hebben.',
    };
  }
  if (toDate && !dateRegex.test(toDate)) {
    return {
      error: `Ongeldig datumformaat voor to_date: "${toDate}". Gebruik YYYY-MM-DD formaat.`,
      hint: 'Datums moeten exact het formaat YYYY-MM-DD hebben.',
    };
  }

  const invoices = getSalesInvoices({ status, customerId, fromDate, toDate, limit });

  let totalAmount = 0;
  let totalOutstanding = 0;

  const mappedInvoices = invoices.map((inv: DemoSalesInvoice) => {
    totalAmount += inv.amount;
    totalOutstanding += inv.outstandingAmount;

    return {
      id: inv.id,
      invoice_number: inv.invoiceNumber,
      customer_id: inv.customerId,
      customer_name: inv.customerName,
      invoice_date: inv.invoiceDate,
      due_date: inv.dueDate,
      currency: inv.currency,
      amount: inv.amount,
      vat_amount: inv.vatAmount,
      outstanding_amount: inv.outstandingAmount,
      status: inv.outstandingAmount === 0 ? 'paid' : 'open',
      description: inv.description,
      payment_terms: inv.paymentTerms,
    };
  });

  const result: Record<string, unknown> = {
    invoices: mappedInvoices,
    count: invoices.length,
    totals: {
      total_amount: Math.round(totalAmount * 100) / 100,
      total_outstanding: Math.round(totalOutstanding * 100) / 100,
      currency: 'EUR',
    },
    filters: { status, from_date: fromDate, to_date: toDate },
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
  };

  if (invoices.length === 0) {
    result.suggestions = [
      'Geen facturen gevonden met deze filters.',
      'Probeer een ander datumbereik of status filter.',
    ];
  } else if (totalOutstanding > 0) {
    result.context = {
      summary: `${invoices.length} facturen gevonden, waarvan EUR ${totalOutstanding.toFixed(2)} openstaand.`,
      tip: 'Gebruik get_outstanding_invoices voor een gedetailleerd debiteurenoverzicht.',
    };
  }

  result.related_tools = [
    { tool: 'get_outstanding_invoices', when: 'Voor ouderdomsanalyse en betalingsachterstand' },
    { tool: 'search_relations', when: 'Om een specifieke klant te zoeken op naam' },
    { tool: 'get_bank_transactions', when: 'Voor ontvangen betalingen' },
  ];

  return result;
}

/**
 * Generate response for get_purchase_invoices tool
 */
export function generateGetPurchaseInvoicesResponse(
  params: Record<string, unknown>
): unknown {
  const status = (params.status as 'open' | 'paid' | 'all') || 'all';
  const supplierId = params.supplier_id as string | undefined;
  const fromDate = params.from_date as string | undefined;
  const toDate = params.to_date as string | undefined;
  const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);

  // Validate date formats
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (fromDate && !dateRegex.test(fromDate)) {
    return {
      error: `Ongeldig datumformaat voor from_date: "${fromDate}". Gebruik YYYY-MM-DD formaat.`,
    };
  }
  if (toDate && !dateRegex.test(toDate)) {
    return {
      error: `Ongeldig datumformaat voor to_date: "${toDate}". Gebruik YYYY-MM-DD formaat.`,
    };
  }

  const invoices = getPurchaseInvoices({ status, supplierId, fromDate, toDate, limit });

  let totalAmount = 0;

  const mappedInvoices = invoices.map((inv: DemoPurchaseInvoice) => {
    totalAmount += inv.amount;

    return {
      id: inv.id,
      entry_number: inv.entryNumber,
      supplier_id: inv.supplierId,
      supplier_name: inv.supplierName,
      invoice_date: inv.invoiceDate,
      due_date: inv.dueDate,
      currency: inv.currency,
      amount: inv.amount,
      vat_amount: inv.vatAmount,
      description: inv.description,
    };
  });

  const result: Record<string, unknown> = {
    invoices: mappedInvoices,
    count: invoices.length,
    totals: {
      total_amount: Math.round(totalAmount * 100) / 100,
      currency: 'EUR',
    },
    filters: { status, from_date: fromDate, to_date: toDate },
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
  };

  if (invoices.length === 0) {
    result.suggestions = [
      'Geen inkoopfacturen gevonden met deze filters.',
      'Probeer een ander datumbereik.',
    ];
  } else {
    result.context = {
      summary: `${invoices.length} inkoopfacturen gevonden, totaal EUR ${totalAmount.toFixed(2)}.`,
    };
  }

  result.related_tools = [
    { tool: 'get_outstanding_invoices', when: 'Voor openstaande crediteuren (type="payable")' },
    { tool: 'search_relations', when: 'Om een specifieke leverancier te zoeken' },
  ];

  return result;
}

/**
 * Generate response for get_outstanding_invoices tool
 */
export function generateGetOutstandingInvoicesResponse(
  params: Record<string, unknown>
): unknown {
  const type = (params.type as 'receivable' | 'payable' | 'both') || 'both';
  const customerId = params.customer_id as string | undefined;
  const supplierId = params.supplier_id as string | undefined;
  const overdueOnly = params.overdue_only === true;
  const minDaysOverdue = params.min_days_overdue as number | undefined;

  const { receivables, payables } = getOutstandingInvoices({
    type,
    customerId,
    supplierId,
    overdueOnly,
    minDaysOverdue,
  });

  let totalReceivable = 0;
  let totalPayable = 0;

  const mappedReceivables = receivables.map((inv) => {
    totalReceivable += inv.outstandingAmount;
    const daysOverdue = calculateDaysOverdue(inv.dueDate);

    return {
      invoice_number: inv.invoiceNumber,
      customer_name: inv.customerName,
      invoice_date: inv.invoiceDate,
      due_date: inv.dueDate,
      amount: inv.outstandingAmount,
      currency: inv.currency,
      description: inv.description,
      days_overdue: daysOverdue,
      status: daysOverdue > 0 ? 'overdue' : 'pending',
    };
  });

  const mappedPayables = payables.map((inv) => {
    totalPayable += inv.outstandingAmount;
    const daysOverdue = calculateDaysOverdue(inv.dueDate);

    return {
      entry_number: inv.entryNumber,
      supplier_name: inv.supplierName,
      invoice_date: inv.invoiceDate,
      due_date: inv.dueDate,
      amount: inv.outstandingAmount,
      currency: inv.currency,
      description: inv.description,
      days_overdue: daysOverdue,
      status: daysOverdue > 0 ? 'overdue' : 'pending',
    };
  });

  const netPosition = totalReceivable - totalPayable;

  const result: Record<string, unknown> = {
    receivables: mappedReceivables,
    payables: mappedPayables,
    summary: {
      total_receivable: Math.round(totalReceivable * 100) / 100,
      total_payable: Math.round(totalPayable * 100) / 100,
      net_position: Math.round(netPosition * 100) / 100,
      currency: 'EUR',
    },
    count: {
      receivables: mappedReceivables.length,
      payables: mappedPayables.length,
    },
    filters: {
      type,
      customer_id: customerId,
      supplier_id: supplierId,
      overdue_only: overdueOnly,
      min_days_overdue: minDaysOverdue,
    },
    _demo: true,
  };

  const totalOpen = mappedReceivables.length + mappedPayables.length;

  if (totalOpen === 0) {
    result.suggestions = [
      'Geen openstaande facturen gevonden met deze filters.',
      overdueOnly ? 'Probeer zonder overdue_only=true.' : null,
      minDaysOverdue ? 'Probeer zonder min_days_overdue filter.' : null,
    ].filter(Boolean);
  } else {
    const overdueReceivables = mappedReceivables.filter((r) => r.status === 'overdue');

    result.context = {
      summary: `${totalOpen} openstaande facturen: ${mappedReceivables.length} debiteuren (EUR ${totalReceivable.toFixed(2)}), ${mappedPayables.length} crediteuren (EUR ${totalPayable.toFixed(2)}).`,
      net_position_meaning:
        netPosition >= 0
          ? `Netto positie: EUR ${netPosition.toFixed(2)} te ontvangen.`
          : `Netto positie: EUR ${Math.abs(netPosition).toFixed(2)} te betalen.`,
      action_items:
        overdueReceivables.length > 0
          ? `Let op: ${overdueReceivables.length} achterstallige debiteurenfacturen - overweeg herinneringen te sturen.`
          : undefined,
    };
  }

  result.related_tools = [
    { tool: 'get_aging_receivables', when: 'Voor ouderdomsanalyse per categorie (30/60/90 dagen)' },
    { tool: 'get_cashflow_forecast', when: 'Voor liquiditeitsprognose' },
    { tool: 'search_relations', when: 'Om een klant/leverancier te zoeken op naam' },
  ];

  return result;
}
