/**
 * Tool Registry
 *
 * Manages MCP tools and their execution.
 */

import { Env, ToolDefinition, ToolResult } from '../types';
import { AuthContext } from '../auth/api-key';
import { logger } from '../lib/logger';
import { getDemoResponse } from '../demo';
import { ListDivisionsTool } from '../tools/divisions';
import { GetRelationsTool, SearchRelationsTool } from '../tools/relations';
import { GetSalesInvoicesTool, GetPurchaseInvoicesTool, GetOutstandingInvoicesTool } from '../tools/invoices';
import { GetBankTransactionsTool, GetGLAccountsTool, GetTrialBalanceTool, GetCashflowForecastTool } from '../tools/financial';
import {
  GetProfitLossTool,
  GetRevenueTool,
  GetAgingAnalysisTool,
  GetTransactionsTool,
  GetVATSummaryTool,
  GetBudgetComparisonTool,
  GetAgingReceivablesTool,
  GetAgingPayablesTool,
} from '../tools/reporting';
import { GetGeneralJournalEntriesTool, GetTransactionLinesTool } from '../tools/journals';
import { GetSalesOrdersTool, GetPurchaseOrdersTool, GetQuotationsTool } from '../tools/orders';
import { GetItemsTool, GetStockPositionsTool } from '../tools/items';
import { GetProjectsTool, GetTimeTransactionsTool } from '../tools/projects';
import { GetProjectInvoicesTool, GetWIPOverviewTool } from '../tools/billing';
import { GetCurrenciesTool, GetCurrencyRatesTool } from '../tools/currencies';
import { GetCostCentersTool, GetCostCenterReportTool } from '../tools/costcenters';
import { GetFixedAssetsTool, GetDepreciationScheduleTool } from '../tools/assets';
import { GetDocumentAttachmentsTool, GetDocumentContentTool } from '../tools/documents';
import { GetOpportunitiesTool, GetSalesFunnelTool } from '../tools/opportunities';
import { GetSalesContractsTool, GetPurchaseContractsTool, GetRecurringRevenueTool } from '../tools/contracts';
import { GetSalesPricesTool, GetPurchasePricesTool, GetMarginAnalysisTool } from '../tools/prices';
import { GetCustomer360Tool, GetFinancialSnapshotTool } from '../tools/combo';
import { reportToolError } from '../lib/error-reporter';

// Base interface for all tools
export interface Tool {
  definition: ToolDefinition;
  execute(
    params: Record<string, unknown>,
    env: Env,
    ctx: ExecutionContext,
    authContext: AuthContext | null
  ): Promise<ToolResult>;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    // Register all available tools

    // Division management
    this.registerTool(new ListDivisionsTool());

    // Relations (customers, suppliers)
    this.registerTool(new GetRelationsTool());
    this.registerTool(new SearchRelationsTool());

    // Invoices
    this.registerTool(new GetSalesInvoicesTool());
    this.registerTool(new GetPurchaseInvoicesTool());
    this.registerTool(new GetOutstandingInvoicesTool());

    // Financial
    this.registerTool(new GetBankTransactionsTool());
    this.registerTool(new GetGLAccountsTool());
    this.registerTool(new GetTrialBalanceTool());
    this.registerTool(new GetCashflowForecastTool());

    // Reporting & Analytics
    this.registerTool(new GetProfitLossTool());
    this.registerTool(new GetRevenueTool());
    this.registerTool(new GetAgingAnalysisTool());
    this.registerTool(new GetTransactionsTool());
    this.registerTool(new GetVATSummaryTool());
    this.registerTool(new GetBudgetComparisonTool());
    this.registerTool(new GetAgingReceivablesTool());
    this.registerTool(new GetAgingPayablesTool());

    // Journal entries & advanced transaction search (EXACT-011)
    this.registerTool(new GetGeneralJournalEntriesTool());
    this.registerTool(new GetTransactionLinesTool());

    // Orders & Quotations (EXACT-011)
    this.registerTool(new GetSalesOrdersTool());
    this.registerTool(new GetPurchaseOrdersTool());
    this.registerTool(new GetQuotationsTool());

    // Items & Inventory (EXACT-011)
    this.registerTool(new GetItemsTool());
    this.registerTool(new GetStockPositionsTool());

    // Projects & Time Tracking (EXACT-011)
    this.registerTool(new GetProjectsTool());
    this.registerTool(new GetTimeTransactionsTool());

    // Project Billing (SCOPE-002)
    this.registerTool(new GetProjectInvoicesTool());
    this.registerTool(new GetWIPOverviewTool());

    // Currencies (SCOPE-003)
    this.registerTool(new GetCurrenciesTool());
    this.registerTool(new GetCurrencyRatesTool());

    // Cost Centers (SCOPE-004)
    this.registerTool(new GetCostCentersTool());
    this.registerTool(new GetCostCenterReportTool());

    // Fixed Assets (SCOPE-005)
    this.registerTool(new GetFixedAssetsTool());
    this.registerTool(new GetDepreciationScheduleTool());

    // Documents (SCOPE-006, P23)
    this.registerTool(new GetDocumentAttachmentsTool());
    this.registerTool(new GetDocumentContentTool()); // P23: Document download - killer feature

    // CRM Opportunities (SCOPE-007)
    this.registerTool(new GetOpportunitiesTool());
    this.registerTool(new GetSalesFunnelTool());

    // Contracts (SCOPE-009)
    this.registerTool(new GetSalesContractsTool());
    this.registerTool(new GetPurchaseContractsTool());
    this.registerTool(new GetRecurringRevenueTool());

    // Prices (SCOPE-010)
    this.registerTool(new GetSalesPricesTool());
    this.registerTool(new GetPurchasePricesTool());
    this.registerTool(new GetMarginAnalysisTool());

    // Combo Tools (OPT-002) - Combined data for common use cases
    this.registerTool(new GetCustomer360Tool());
    this.registerTool(new GetFinancialSnapshotTool());
  }

  private registerTool(tool: Tool): void {
    this.tools.set(tool.definition.name, tool);
  }

  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((tool) => tool.definition);
  }

  async callTool(
    name: string,
    params: Record<string, unknown>,
    env: Env,
    ctx: ExecutionContext,
    authContext: AuthContext | null
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Unknown tool "${name}". Use tools/list to see available tools.`,
          },
        ],
        isError: true,
      };
    }

    // DEMO MODE: Check if using demo API key and return fake data
    // Demo mode skips real Exact Online API calls for App Store demonstrations
    if (authContext?.isDemoMode) {
      const demoResponse = getDemoResponse(name, params);
      if (demoResponse) {
        logger.info(`Tool ${name} executed (demo mode)`, { tool: name, demoMode: true });
        return demoResponse;
      }

      // Tool not supported in demo mode - return helpful error
      return {
        content: [
          {
            type: 'text',
            text: `Demo mode: Tool "${name}" is niet beschikbaar in de demo. ` +
                  `Ondersteunde demo tools: list_divisions, get_relations, search_relations, ` +
                  `get_sales_invoices, get_purchase_invoices, get_outstanding_invoices, ` +
                  `get_bank_transactions, get_cashflow_forecast.`,
          },
        ],
        isError: true,
      };
    }

    try {
      const startTime = Date.now();
      const result = await tool.execute(params, env, ctx, authContext);
      const duration = Date.now() - startTime;

      // Log execution metrics
      logger.info(`Tool ${name} executed`, { tool: name, durationMs: duration });

      return result;
    } catch (error) {
      logger.error(`Tool ${name} error`, error instanceof Error ? error : undefined, { tool: name });

      // Report tool error to support system
      if (error instanceof Error) {
        reportToolError(
          env,
          ctx,
          name,
          error,
          authContext?.userId,
          authContext?.apiKeyId
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool "${name}": ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          },
        ],
        isError: true,
      };
    }
  }
}
