/**
 * Orders & Quotations Tools
 *
 * Tools for working with Exact Online sales orders, purchase orders, and quotations.
 *
 * @see EXACT-011 in operations/ROADMAP.md
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, DEFAULT_TOOL_ANNOTATIONS } from './_base';

/**
 * Get Sales Orders Tool
 */
export class GetSalesOrdersTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_sales_orders',
    description:
      'Haal verkooporders op uit Exact Online. ' +
      'GEBRUIK BIJ: orderoverzicht, openstaande orders, leverstatus, orderwaarde analyse. ' +
      'VEREIST: Sales Orders module actief in Exact Online. ' +
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
          enum: ['all', 'open', 'partial', 'complete', 'canceled'],
          description: 'Status. Kies: "all" | "open" | "partial" | "complete" | "canceled" (default: "all")',
        },
        customer_id: {
          type: 'string',
          description: 'Klant ID (GUID formaat). Gebruik search_relations om ID te vinden.',
        },
        from_date: {
          type: 'string',
          description: 'Begindatum. FORMAAT: "YYYY-MM-DD" (bijv. "2025-01-01"). Default: begin dit jaar.',
        },
        to_date: {
          type: 'string',
          description: 'Einddatum. FORMAAT: "YYYY-MM-DD" (bijv. "2025-12-31"). Default: vandaag.',
        },
        limit: {
          type: 'number',
          description: 'Maximum resultaten (1-500, default: 100).',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        orders: { type: 'array' },
        count: { type: 'number' },
        totals: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['orders', 'count', 'totals', 'filters', 'division'],
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
    const status = (params.status as string) || 'all';

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (params.from_date && !dateRegex.test(params.from_date as string)) {
      return {
        error: `Ongeldig datumformaat voor from_date: "${params.from_date}". Gebruik YYYY-MM-DD formaat, bijvoorbeeld: "2025-01-01"`,
        hint: 'Datums moeten exact het formaat YYYY-MM-DD hebben, zoals "2025-01-15" voor 15 januari 2025.',
      };
    }
    if (params.to_date && !dateRegex.test(params.to_date as string)) {
      return {
        error: `Ongeldig datumformaat voor to_date: "${params.to_date}". Gebruik YYYY-MM-DD formaat, bijvoorbeeld: "2025-12-31"`,
        hint: 'Datums moeten exact het formaat YYYY-MM-DD hebben, zoals "2025-12-31" voor 31 december 2025.',
      };
    }

    const today = new Date();
    const defaultFromDate = new Date(today.getFullYear(), 0, 1);
    const fromDate = (params.from_date as string) || defaultFromDate.toISOString().split('T')[0];
    const toDate = (params.to_date as string) || today.toISOString().split('T')[0];
    const customerId = params.customer_id as string | undefined;

    const filters: string[] = [
      `OrderDate ge datetime'${fromDate}'`,
      `OrderDate le datetime'${toDate}'`,
    ];

    if (customerId) {
      filters.push(`OrderedBy eq guid'${customerId}'`);
    }

    // Status mapping: 12=Open, 20=Partial, 21=Complete, 45=Canceled
    if (status === 'open') {
      filters.push(`Status eq 12`);
    } else if (status === 'partial') {
      filters.push(`Status eq 20`);
    } else if (status === 'complete') {
      filters.push(`Status eq 21`);
    } else if (status === 'canceled') {
      filters.push(`Status eq 45`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';

    const endpoint = `/${division}/salesorder/SalesOrders?$select=OrderID,OrderNumber,OrderDate,DeliveryDate,OrderedBy,OrderedByName,Status,Currency,AmountDC,VATAmountDC,Description,YourRef,Created,Modified${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<{ d: Record<string, unknown> }>(connection, endpoint);
      const orders = extractODataResults<Record<string, unknown>>(response?.d);

      let totalAmount = 0;
      let totalVat = 0;

      const formattedOrders = orders.map((order: Record<string, unknown>) => {
        const amount = (order.AmountDC as number) || 0;
        const vat = (order.VATAmountDC as number) || 0;
        totalAmount += amount;
        totalVat += vat;

        return {
          order_id: order.OrderID,
          order_number: order.OrderNumber,
          order_date: this.formatDate(order.OrderDate as string),
          delivery_date: this.formatDate(order.DeliveryDate as string),
          customer_id: order.OrderedBy,
          customer_name: order.OrderedByName,
          status_code: order.Status,
          status: this.getStatusLabel(order.Status as number),
          currency: order.Currency,
          amount: amount,
          vat: vat,
          total: amount + vat,
          description: order.Description,
          your_ref: order.YourRef,
          created: this.formatDate(order.Created as string),
          modified: this.formatDate(order.Modified as string),
        };
      });

      return {
        orders: formattedOrders,
        count: formattedOrders.length,
        totals: {
          total_amount: Math.round(totalAmount * 100) / 100,
          total_vat: Math.round(totalVat * 100) / 100,
          total_incl_vat: Math.round((totalAmount + totalVat) * 100) / 100,
        },
        filters: { status, from_date: fromDate, to_date: toDate, customer_id: customerId },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen verkooporders: ${(error as Error).message}`,
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

  private getStatusLabel(status: number): string {
    const labels: Record<number, string> = {
      12: 'Open',
      20: 'Deels geleverd',
      21: 'Volledig geleverd',
      45: 'Geannuleerd',
    };
    return labels[status] || `Status ${status}`;
  }
}

/**
 * Get Purchase Orders Tool
 */
export class GetPurchaseOrdersTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_purchase_orders',
    description:
      'Haal inkooporders op uit Exact Online. ' +
      'GEBRUIK BIJ: inkoopoverzicht, openstaande bestellingen, leverancierorders. ' +
      'VEREIST: Purchase Orders module actief in Exact Online. ' +
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
          enum: ['all', 'open', 'partial', 'complete', 'canceled'],
          description: 'Status. Kies: "all" | "open" | "partial" | "complete" | "canceled" (default: "all")',
        },
        supplier_id: {
          type: 'string',
          description: 'Leverancier ID (GUID formaat). Gebruik search_relations om ID te vinden.',
        },
        from_date: {
          type: 'string',
          description: 'Begindatum. FORMAAT: "YYYY-MM-DD" (bijv. "2025-01-01"). Default: begin dit jaar.',
        },
        to_date: {
          type: 'string',
          description: 'Einddatum. FORMAAT: "YYYY-MM-DD" (bijv. "2025-12-31"). Default: vandaag.',
        },
        limit: {
          type: 'number',
          description: 'Maximum resultaten (1-500, default: 100).',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        orders: { type: 'array' },
        count: { type: 'number' },
        totals: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['orders', 'count', 'totals', 'filters', 'division'],
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
    const status = (params.status as string) || 'all';

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (params.from_date && !dateRegex.test(params.from_date as string)) {
      return {
        error: `Ongeldig datumformaat voor from_date: "${params.from_date}". Gebruik YYYY-MM-DD formaat, bijvoorbeeld: "2025-01-01"`,
        hint: 'Datums moeten exact het formaat YYYY-MM-DD hebben, zoals "2025-01-15" voor 15 januari 2025.',
      };
    }
    if (params.to_date && !dateRegex.test(params.to_date as string)) {
      return {
        error: `Ongeldig datumformaat voor to_date: "${params.to_date}". Gebruik YYYY-MM-DD formaat, bijvoorbeeld: "2025-12-31"`,
        hint: 'Datums moeten exact het formaat YYYY-MM-DD hebben, zoals "2025-12-31" voor 31 december 2025.',
      };
    }

    const today = new Date();
    const defaultFromDate = new Date(today.getFullYear(), 0, 1);
    const fromDate = (params.from_date as string) || defaultFromDate.toISOString().split('T')[0];
    const toDate = (params.to_date as string) || today.toISOString().split('T')[0];
    const supplierId = params.supplier_id as string | undefined;

    const filters: string[] = [
      `OrderDate ge datetime'${fromDate}'`,
      `OrderDate le datetime'${toDate}'`,
    ];

    if (supplierId) {
      filters.push(`Supplier eq guid'${supplierId}'`);
    }

    // Status mapping per API docs: 10=Open, 20=Partial, 30=Complete, 40=Canceled
    if (status === 'open') {
      filters.push(`ReceiptStatus eq 10`);
    } else if (status === 'partial') {
      filters.push(`ReceiptStatus eq 20`);
    } else if (status === 'complete') {
      filters.push(`ReceiptStatus eq 30`);
    } else if (status === 'canceled') {
      filters.push(`ReceiptStatus eq 40`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';

    // Note: API uses VATAmount (not VATAmountDC) for PurchaseOrders
    const endpoint = `/${division}/purchaseorder/PurchaseOrders?$select=PurchaseOrderID,OrderNumber,OrderDate,ReceiptDate,Supplier,SupplierName,ReceiptStatus,Currency,AmountDC,VATAmount,Description,YourRef,Created,Modified${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<{ d: Record<string, unknown> }>(connection, endpoint);
      const orders = extractODataResults<Record<string, unknown>>(response?.d);

      let totalAmount = 0;
      let totalVat = 0;

      const formattedOrders = orders.map((order: Record<string, unknown>) => {
        const amount = (order.AmountDC as number) || 0;
        const vat = (order.VATAmount as number) || 0; // API uses VATAmount, not VATAmountDC
        totalAmount += amount;
        totalVat += vat;

        return {
          order_id: order.PurchaseOrderID,
          order_number: order.OrderNumber,
          order_date: this.formatDate(order.OrderDate as string),
          receipt_date: this.formatDate(order.ReceiptDate as string),
          supplier_id: order.Supplier,
          supplier_name: order.SupplierName,
          status_code: order.ReceiptStatus,
          status: this.getStatusLabel(order.ReceiptStatus as number),
          currency: order.Currency,
          amount: amount,
          vat: vat,
          total: amount + vat,
          description: order.Description,
          your_ref: order.YourRef,
          created: this.formatDate(order.Created as string),
          modified: this.formatDate(order.Modified as string),
        };
      });

      return {
        orders: formattedOrders,
        count: formattedOrders.length,
        totals: {
          total_amount: Math.round(totalAmount * 100) / 100,
          total_vat: Math.round(totalVat * 100) / 100,
          total_incl_vat: Math.round((totalAmount + totalVat) * 100) / 100,
        },
        filters: { status, from_date: fromDate, to_date: toDate, supplier_id: supplierId },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen inkooporders: ${(error as Error).message}`,
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

  private getStatusLabel(status: number): string {
    // Status codes per API docs: 10=Open, 20=Partial, 30=Complete, 40=Canceled
    const labels: Record<number, string> = {
      10: 'Open',
      20: 'Deels ontvangen',
      30: 'Volledig ontvangen',
      40: 'Geannuleerd',
    };
    return labels[status] || `Status ${status}`;
  }
}

/**
 * Get Quotations Tool
 */
export class GetQuotationsTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_quotations',
    description:
      'Haal offertes op uit Exact Online. ' +
      'GEBRUIK BIJ: offertepipeline, openstaande offertes, conversie analyse. ' +
      'VEREIST: Quotations module actief in Exact Online. ' +
      'VOORBEELD: {"status": "sent", "from_date": "2025-01-01"}',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code. Optioneel (standaard administratie wordt gebruikt).',
        },
        status: {
          type: 'string',
          enum: ['all', 'draft', 'sent', 'accepted', 'rejected', 'reviewed'],
          description: 'Status. Kies: "all" | "draft" | "sent" | "accepted" | "rejected" | "reviewed" (default: "all")',
        },
        customer_id: {
          type: 'string',
          description: 'Klant ID (GUID formaat). Gebruik search_relations om ID te vinden.',
        },
        from_date: {
          type: 'string',
          description: 'Begindatum. FORMAAT: "YYYY-MM-DD" (bijv. "2025-01-01"). Default: begin dit jaar.',
        },
        to_date: {
          type: 'string',
          description: 'Einddatum. FORMAAT: "YYYY-MM-DD" (bijv. "2025-12-31"). Default: vandaag.',
        },
        limit: {
          type: 'number',
          description: 'Maximum resultaten (1-500, default: 100).',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        quotations: { type: 'array' },
        count: { type: 'number' },
        totals: { type: 'object' },
        pipeline: { type: 'object', description: 'Pipeline statistieken per status' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['quotations', 'count', 'totals', 'pipeline', 'filters', 'division'],
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
    const status = (params.status as string) || 'all';

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (params.from_date && !dateRegex.test(params.from_date as string)) {
      return {
        error: `Ongeldig datumformaat voor from_date: "${params.from_date}". Gebruik YYYY-MM-DD formaat, bijvoorbeeld: "2025-01-01"`,
        hint: 'Datums moeten exact het formaat YYYY-MM-DD hebben, zoals "2025-01-15" voor 15 januari 2025.',
      };
    }
    if (params.to_date && !dateRegex.test(params.to_date as string)) {
      return {
        error: `Ongeldig datumformaat voor to_date: "${params.to_date}". Gebruik YYYY-MM-DD formaat, bijvoorbeeld: "2025-12-31"`,
        hint: 'Datums moeten exact het formaat YYYY-MM-DD hebben, zoals "2025-12-31" voor 31 december 2025.',
      };
    }

    const today = new Date();
    const defaultFromDate = new Date(today.getFullYear(), 0, 1);
    const fromDate = (params.from_date as string) || defaultFromDate.toISOString().split('T')[0];
    const toDate = (params.to_date as string) || today.toISOString().split('T')[0];
    const customerId = params.customer_id as string | undefined;

    const filters: string[] = [
      `QuotationDate ge datetime'${fromDate}'`,
      `QuotationDate le datetime'${toDate}'`,
    ];

    if (customerId) {
      filters.push(`OrderAccount eq guid'${customerId}'`);
    }

    // Status mapping per API docs: 5=Rejected, 20=Draft, 25=Open, 35=Processing, 50=Accepted
    if (status === 'draft') {
      filters.push(`Status eq 20`);
    } else if (status === 'sent') {
      filters.push(`Status eq 25`); // Open = sent to customer
    } else if (status === 'reviewed') {
      filters.push(`Status eq 35`); // Processing
    } else if (status === 'rejected') {
      filters.push(`Status eq 5`);
    } else if (status === 'accepted') {
      filters.push(`Status eq 50`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';

    // Note: API uses DueDate (not ValidUntil) and VATAmountFC (not VATAmountDC)
    const endpoint = `/${division}/crm/Quotations?$select=QuotationID,QuotationNumber,QuotationDate,DueDate,OrderAccount,OrderAccountName,Status,Currency,AmountDC,VATAmountFC,Description,CloseDate,ClosingDate,Created,Modified${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<{ d: Record<string, unknown> }>(connection, endpoint);
      const quotations = extractODataResults<Record<string, unknown>>(response?.d);

      let totalAmount = 0;
      let totalVat = 0;

      // Pipeline stats
      const pipeline: Record<string, { count: number; amount: number }> = {
        draft: { count: 0, amount: 0 },
        sent: { count: 0, amount: 0 },
        reviewed: { count: 0, amount: 0 },
        rejected: { count: 0, amount: 0 },
        accepted: { count: 0, amount: 0 },
      };

      const formattedQuotations = quotations.map((quote: Record<string, unknown>) => {
        const amount = (quote.AmountDC as number) || 0;
        const vat = (quote.VATAmountFC as number) || 0; // API uses VATAmountFC
        totalAmount += amount;
        totalVat += vat;

        const statusLabel = this.getStatusLabel(quote.Status as number);
        const statusKey = this.getStatusKey(quote.Status as number);
        if (pipeline[statusKey]) {
          pipeline[statusKey].count++;
          pipeline[statusKey].amount += amount;
        }

        return {
          quotation_id: quote.QuotationID,
          quotation_number: quote.QuotationNumber,
          quotation_date: this.formatDate(quote.QuotationDate as string),
          valid_until: this.formatDate(quote.DueDate as string), // API uses DueDate
          customer_id: quote.OrderAccount,
          customer_name: quote.OrderAccountName,
          status_code: quote.Status,
          status: statusLabel,
          currency: quote.Currency,
          amount: amount,
          vat: vat,
          total: amount + vat,
          description: quote.Description,
          close_date: this.formatDate(quote.CloseDate as string),
          created: this.formatDate(quote.Created as string),
          modified: this.formatDate(quote.Modified as string),
        };
      });

      return {
        quotations: formattedQuotations,
        count: formattedQuotations.length,
        totals: {
          total_amount: Math.round(totalAmount * 100) / 100,
          total_vat: Math.round(totalVat * 100) / 100,
          total_incl_vat: Math.round((totalAmount + totalVat) * 100) / 100,
        },
        pipeline: Object.entries(pipeline).map(([key, val]) => ({
          status: key,
          count: val.count,
          amount: Math.round(val.amount * 100) / 100,
        })),
        filters: { status, from_date: fromDate, to_date: toDate, customer_id: customerId },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen offertes: ${(error as Error).message}`,
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

  private getStatusLabel(status: number): string {
    // Status codes per API docs: 5=Rejected, 20=Draft, 25=Open, 35=Processing, 50=Accepted
    const labels: Record<number, string> = {
      5: 'Afgewezen',
      20: 'Concept',
      25: 'Open/Verzonden',
      35: 'In behandeling',
      50: 'Geaccepteerd',
    };
    return labels[status] || `Status ${status}`;
  }

  private getStatusKey(status: number): string {
    // Status codes per API docs: 5=Rejected, 20=Draft, 25=Open, 35=Processing, 50=Accepted
    const keys: Record<number, string> = {
      5: 'rejected',
      20: 'draft',
      25: 'sent',
      35: 'reviewed',
      50: 'accepted',
    };
    return keys[status] || 'draft';
  }
}

// Export all order tools
export const orderTools = [
  GetSalesOrdersTool,
  GetPurchaseOrdersTool,
  GetQuotationsTool,
];
