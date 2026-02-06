/**
 * Demo Response Generators
 *
 * Maps tool names to their demo response generators.
 * Each generator returns a response in the exact same format as the real tool.
 *
 * IMPORTANT: ALL tools must have a demo generator to prevent fallback to real API.
 */

import { ToolResult } from '../../types';

// Existing generators
import { generateListDivisionsResponse } from './divisions';
import { generateGetRelationsResponse, generateSearchRelationsResponse } from './relations';
import {
  generateGetSalesInvoicesResponse,
  generateGetPurchaseInvoicesResponse,
  generateGetOutstandingInvoicesResponse,
} from './invoices';
import { generateGetBankTransactionsResponse, generateGetCashflowForecastResponse } from './financial';

// New reporting generators
import {
  generateGetRevenueResponse,
  generateGetProfitLossResponse,
  generateGetAgingAnalysisResponse,
  generateGetAgingReceivablesResponse,
  generateGetAgingPayablesResponse,
  generateGetVATSummaryResponse,
  generateGetBudgetComparisonResponse,
  generateGetTransactionsResponse,
} from './reporting';

// GL accounts generators
import {
  generateGetGLAccountsResponse,
  generateGetTrialBalanceResponse,
} from './gl_accounts';

// Orders generators
import {
  generateGetSalesOrdersResponse,
  generateGetPurchaseOrdersResponse,
  generateGetQuotationsResponse,
} from './orders';

// Items generators
import {
  generateGetItemsResponse,
  generateGetStockPositionsResponse,
} from './items';

// Journal generators
import {
  generateGetJournalEntriesResponse,
  generateSearchTransactionsResponse,
} from './journals';

// Stub generators for remaining tools
import {
  // Projects
  generateGetProjectsResponse,
  generateGetTimeTransactionsResponse,
  generateGetProjectInvoicesResponse,
  generateGetWIPOverviewResponse,
  // Currencies
  generateGetCurrenciesResponse,
  generateGetCurrencyRatesResponse,
  // Cost Centers
  generateGetCostCentersResponse,
  generateGetCostCenterReportResponse,
  // Assets
  generateGetFixedAssetsResponse,
  generateGetDepreciationScheduleResponse,
  // Documents
  generateGetDocumentAttachmentsResponse,
  // Opportunities
  generateGetOpportunitiesResponse,
  generateGetSalesFunnelResponse,
  // Contracts
  generateGetSalesContractsResponse,
  generateGetPurchaseContractsResponse,
  generateGetRecurringRevenueResponse,
  // Prices
  generateGetSalesPricesResponse,
  generateGetPurchasePricesResponse,
  generateGetMarginAnalysisResponse,
  // Combo
  generateGetCustomer360Response,
  generateGetFinancialSnapshotResponse,
} from './stubs';

/**
 * Tool name to generator mapping
 *
 * EVERY registered MCP tool MUST have an entry here.
 */
const generators: Record<
  string,
  (params: Record<string, unknown>) => unknown
> = {
  // ==========================================
  // CORE TOOLS (well-populated demo data)
  // ==========================================

  // Division management
  list_divisions: generateListDivisionsResponse,

  // Relations
  get_relations: generateGetRelationsResponse,
  search_relations: generateSearchRelationsResponse,

  // Invoices
  get_sales_invoices: generateGetSalesInvoicesResponse,
  get_purchase_invoices: generateGetPurchaseInvoicesResponse,
  get_outstanding_invoices: generateGetOutstandingInvoicesResponse,

  // Financial
  get_bank_transactions: generateGetBankTransactionsResponse,
  get_gl_accounts: generateGetGLAccountsResponse,
  get_trial_balance: generateGetTrialBalanceResponse,
  get_cashflow_forecast: generateGetCashflowForecastResponse,

  // ==========================================
  // REPORTING TOOLS
  // ==========================================
  get_profit_loss: generateGetProfitLossResponse,
  get_revenue: generateGetRevenueResponse,
  get_aging_analysis: generateGetAgingAnalysisResponse,
  get_transactions: generateGetTransactionsResponse,
  get_vat_summary: generateGetVATSummaryResponse,
  get_budget_comparison: generateGetBudgetComparisonResponse,
  get_aging_receivables: generateGetAgingReceivablesResponse,
  get_aging_payables: generateGetAgingPayablesResponse,

  // ==========================================
  // JOURNAL TOOLS
  // ==========================================
  get_journal_entries: generateGetJournalEntriesResponse,
  search_transactions: generateSearchTransactionsResponse,

  // ==========================================
  // ORDER TOOLS
  // ==========================================
  get_sales_orders: generateGetSalesOrdersResponse,
  get_purchase_orders: generateGetPurchaseOrdersResponse,
  get_quotations: generateGetQuotationsResponse,

  // ==========================================
  // ITEM & INVENTORY TOOLS
  // ==========================================
  get_items: generateGetItemsResponse,
  get_stock_positions: generateGetStockPositionsResponse,

  // ==========================================
  // PROJECT TOOLS (stub - bakery doesn't use)
  // ==========================================
  get_projects: generateGetProjectsResponse,
  get_time_transactions: generateGetTimeTransactionsResponse,
  get_project_invoices: generateGetProjectInvoicesResponse,
  get_wip_overview: generateGetWIPOverviewResponse,

  // ==========================================
  // CURRENCY TOOLS
  // ==========================================
  get_currencies: generateGetCurrenciesResponse,
  get_currency_rates: generateGetCurrencyRatesResponse,

  // ==========================================
  // COST CENTER TOOLS
  // ==========================================
  get_cost_centers: generateGetCostCentersResponse,
  get_cost_center_report: generateGetCostCenterReportResponse,

  // ==========================================
  // FIXED ASSET TOOLS
  // ==========================================
  get_fixed_assets: generateGetFixedAssetsResponse,
  get_depreciation_schedule: generateGetDepreciationScheduleResponse,

  // ==========================================
  // DOCUMENT TOOLS
  // ==========================================
  get_document_attachments: generateGetDocumentAttachmentsResponse,

  // ==========================================
  // CRM / OPPORTUNITY TOOLS
  // ==========================================
  get_opportunities: generateGetOpportunitiesResponse,
  get_sales_funnel: generateGetSalesFunnelResponse,

  // ==========================================
  // CONTRACT TOOLS
  // ==========================================
  get_sales_contracts: generateGetSalesContractsResponse,
  get_purchase_contracts: generateGetPurchaseContractsResponse,
  get_recurring_revenue: generateGetRecurringRevenueResponse,

  // ==========================================
  // PRICE TOOLS
  // ==========================================
  get_sales_prices: generateGetSalesPricesResponse,
  get_purchase_prices: generateGetPurchasePricesResponse,
  get_margin_analysis: generateGetMarginAnalysisResponse,

  // ==========================================
  // COMBO TOOLS (comprehensive overviews)
  // ==========================================
  get_customer_360: generateGetCustomer360Response,
  get_financial_snapshot: generateGetFinancialSnapshotResponse,
};

/**
 * Get a demo response for a tool call.
 * Returns null if the tool is not supported in demo mode.
 */
export function getDemoResponse(
  toolName: string,
  params: Record<string, unknown>
): ToolResult | null {
  const generator = generators[toolName];

  if (!generator) {
    // Tool not supported in demo mode
    return null;
  }

  try {
    const result = generator(params);
    const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);

    return {
      content: [{ type: 'text', text }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Demo mode error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Check if a tool is supported in demo mode
 */
export function isDemoToolSupported(toolName: string): boolean {
  return toolName in generators;
}

/**
 * Get list of supported demo tools
 */
export function getSupportedDemoTools(): string[] {
  return Object.keys(generators);
}

/**
 * Get count of demo tools
 */
export function getDemoToolCount(): number {
  return Object.keys(generators).length;
}
