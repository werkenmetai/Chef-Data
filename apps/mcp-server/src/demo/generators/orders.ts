/**
 * Demo Generators: Orders tools
 *
 * Returns demo data for sales orders, purchase orders, and quotations.
 */

import { getCurrentIndustryConfig } from '../context';
import { getSalesOrders, getPurchaseOrders, getQuotations } from '../data/orders';

/**
 * Generate response for get_sales_orders tool
 */
export function generateGetSalesOrdersResponse(
  params: Record<string, unknown>
): unknown {
  const status = params.status as 'open' | 'complete' | 'all' | undefined;
  const customerId = params.customer_id as string | undefined;
  const fromDate = params.from_date as string | undefined;
  const toDate = params.to_date as string | undefined;

  const orders = getSalesOrders({ status, customerId, fromDate, toDate });

  const totalValue = orders.reduce((sum, o) => sum + o.amount, 0);
  const openOrders = orders.filter((o) => o.status === 'open' || o.status === 'partial');

  return {
    orders: orders.map((o) => ({
      id: o.id,
      order_number: o.orderNumber,
      customer_id: o.customerId,
      customer_name: o.customerName,
      order_date: o.orderDate,
      delivery_date: o.deliveryDate,
      status: o.status,
      amount: o.amount,
      vat_amount: o.vatAmount,
      description: o.description,
      line_count: o.lines.length,
    })),
    count: orders.length,
    totals: {
      total_value: totalValue,
      open_value: openOrders.reduce((sum, o) => sum + o.amount, 0),
      open_count: openOrders.length,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: `${orders.length} verkooporders, waarvan ${openOrders.length} open (EUR ${openOrders.reduce((sum, o) => sum + o.amount, 0).toLocaleString('nl-NL')}).`,
    },
    related_tools: [
      { tool: 'get_sales_invoices', when: 'Voor gefactureerde orders' },
      { tool: 'get_quotations', when: 'Voor offertes' },
    ],
  };
}

/**
 * Generate response for get_purchase_orders tool
 */
export function generateGetPurchaseOrdersResponse(
  params: Record<string, unknown>
): unknown {
  const status = params.status as 'open' | 'complete' | 'all' | undefined;
  const supplierId = params.supplier_id as string | undefined;
  const fromDate = params.from_date as string | undefined;
  const toDate = params.to_date as string | undefined;

  const orders = getPurchaseOrders({ status, supplierId, fromDate, toDate });

  const totalValue = orders.reduce((sum, o) => sum + o.amount, 0);
  const openOrders = orders.filter((o) => o.status === 'open' || o.status === 'partial');

  return {
    orders: orders.map((o) => ({
      id: o.id,
      order_number: o.orderNumber,
      supplier_id: o.supplierId,
      supplier_name: o.supplierName,
      order_date: o.orderDate,
      expected_date: o.expectedDate,
      status: o.status,
      amount: o.amount,
      vat_amount: o.vatAmount,
      description: o.description,
      line_count: o.lines.length,
    })),
    count: orders.length,
    totals: {
      total_value: totalValue,
      open_value: openOrders.reduce((sum, o) => sum + o.amount, 0),
      open_count: openOrders.length,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: `${orders.length} inkooporders, waarvan ${openOrders.length} open (EUR ${openOrders.reduce((sum, o) => sum + o.amount, 0).toLocaleString('nl-NL')}).`,
    },
    related_tools: [
      { tool: 'get_purchase_invoices', when: 'Voor ontvangen facturen' },
      { tool: 'get_stock_positions', when: 'Voor voorraadbeheer' },
    ],
  };
}

/**
 * Generate response for get_quotations tool
 */
export function generateGetQuotationsResponse(
  params: Record<string, unknown>
): unknown {
  const status = params.status as 'open' | 'accepted' | 'rejected' | 'all' | undefined;
  const customerId = params.customer_id as string | undefined;

  const quotes = getQuotations({ status, customerId });

  const openQuotes = quotes.filter((q) => q.status === 'open');
  const totalPipelineValue = openQuotes.reduce((sum, q) => sum + q.amount, 0);
  const weightedPipeline = openQuotes.reduce(
    (sum, q) => sum + q.amount * (q.probability / 100),
    0
  );

  return {
    quotations: quotes.map((q) => ({
      id: q.id,
      quotation_number: q.quotationNumber,
      customer_id: q.customerId,
      customer_name: q.customerName,
      quotation_date: q.quotationDate,
      valid_until: q.validUntil,
      status: q.status,
      amount: q.amount,
      vat_amount: q.vatAmount,
      description: q.description,
      probability: q.probability,
    })),
    count: quotes.length,
    pipeline: {
      open_count: openQuotes.length,
      total_value: totalPipelineValue,
      weighted_value: Math.round(weightedPipeline),
      average_probability: openQuotes.length > 0
        ? Math.round(openQuotes.reduce((sum, q) => sum + q.probability, 0) / openQuotes.length)
        : 0,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: `${openQuotes.length} openstaande offertes, pipeline EUR ${totalPipelineValue.toLocaleString('nl-NL')} (gewogen: EUR ${Math.round(weightedPipeline).toLocaleString('nl-NL')}).`,
    },
    related_tools: [
      { tool: 'get_sales_orders', when: 'Voor geaccepteerde orders' },
      { tool: 'get_sales_funnel', when: 'Voor sales pipeline analyse' },
    ],
  };
}
