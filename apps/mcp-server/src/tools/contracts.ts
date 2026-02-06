/**
 * Contract Tools (SCOPE-009)
 *
 * Tools for working with sales and purchase contracts.
 *
 * @see SCOPE-009 in operations/ROADMAP.md
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import { logger } from '../lib/logger';
import { buildGuidFilter } from '../exact/odata-query';
import type { ExactODataResponse } from '@exact-mcp/shared';

/**
 * Sales subscription/contract type
 */
interface SalesSubscription {
  ID: string;
  Number: number;
  OrderedBy: string | null;
  OrderedByName: string | null;
  Description: string | null;
  Currency: string;
  StartDate: string | null;
  EndDate: string | null;
  InvoiceTo: string | null;
  InvoiceToName: string | null;
  PaymentCondition: string | null;
  PaymentConditionDescription: string | null;
  Created: string;
  Modified: string;
}

/**
 * Sales subscription line
 * Note: API uses EntryID (not Subscription), FromDate/ToDate (not StartDate/EndDate)
 * ItemCode does NOT exist on this endpoint
 */
interface SalesSubscriptionLine {
  ID: string;
  EntryID: string; // Foreign key to Subscription (API uses EntryID, not Subscription)
  Item: string | null;
  ItemDescription: string | null;
  Quantity: number;
  UnitPrice: number;
  AmountDC: number;
  FromDate: string | null; // API uses FromDate, not StartDate
  ToDate: string | null; // API uses ToDate, not EndDate
}

/**
 * Purchase subscription type
 */
interface PurchaseSubscription {
  ID: string;
  Number: number;
  Supplier: string | null;
  SupplierName: string | null;
  Description: string | null;
  Currency: string;
  StartDate: string | null;
  EndDate: string | null;
  PaymentCondition: string | null;
  PaymentConditionDescription: string | null;
  Created: string;
  Modified: string;
}

/**
 * Get Sales Contracts Tool
 *
 * Retrieves recurring sales contracts/subscriptions.
 */
export class GetSalesContractsTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_sales_contracts',
    description:
      'Haal terugkerende verkoopcontracten/abonnementen op uit Exact Online. ' +
      'Gebruik voor: recurring revenue overzicht, abonnementenbeheer, contractverloop. ' +
      'Toont klant, waarde, start- en einddatum. ' +
      'VEREIST: Subscription module actief in Exact Online.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        account_id: {
          type: 'string',
          description: 'Filter op klant (account GUID). Optioneel.',
        },
        active_only: {
          type: 'boolean',
          description: 'Alleen actieve contracten (einddatum in toekomst of geen einddatum). Default: true',
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
        contracts: { type: 'array' },
        count: { type: 'number' },
        summary: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['contracts', 'count', 'summary', 'filters', 'division'],
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

    const accountId = params.account_id as string | undefined;
    const activeOnly = params.active_only !== false;
    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);

    const filters: string[] = [];

    if (accountId) {
      try {
        filters.push(buildGuidFilter('OrderedBy', accountId));
      } catch (error) {
        return { error: `Ongeldig account_id formaat: ${(error as Error).message}`, division };
      }
    }

    if (activeOnly) {
      const today = new Date().toISOString().split('T')[0];
      filters.push(`(EndDate eq null or EndDate ge datetime'${today}T00:00:00')`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';
    const endpoint = `/${division}/subscription/Subscriptions?$select=ID,Number,OrderedBy,OrderedByName,Description,Currency,StartDate,EndDate,InvoiceTo,InvoiceToName,PaymentCondition,PaymentConditionDescription,Created,Modified${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<ExactODataResponse<SalesSubscription>>(connection, endpoint);
      const contracts = extractODataResults<SalesSubscription>(response?.d as Record<string, unknown>);

      // Fetch subscription lines to calculate values
      const contractValues: Record<string, number> = {};
      for (const contract of contracts.slice(0, 50)) { // Limit line fetches
        // Note: API uses EntryID as foreign key, not Subscription
        const linesEndpoint = `/${division}/subscription/SubscriptionLines?$select=ID,EntryID,AmountDC&$filter=${buildGuidFilter('EntryID', contract.ID)}`;
        try {
          const linesResponse = await this.exactRequest<ExactODataResponse<SalesSubscriptionLine>>(connection, linesEndpoint);
          const lines = extractODataResults<SalesSubscriptionLine>(linesResponse?.d as Record<string, unknown>);
          contractValues[contract.ID] = lines.reduce((sum: number, line: SalesSubscriptionLine) => sum + (line.AmountDC || 0), 0);
        } catch (error) {
          logger.error('Fout bij ophalen contract lines', error instanceof Error ? error : undefined, { tool: 'GetSalesContracts', contractId: contract.ID });
          contractValues[contract.ID] = 0;
        }
      }

      // Calculate summary
      let totalValue = 0;
      const byCustomer: Record<string, { count: number; value: number }> = {};

      const formattedContracts = contracts.map((contract: SalesSubscription) => {
        const value = contractValues[contract.ID] || 0;
        totalValue += value;

        const customerName = contract.OrderedByName || 'Onbekend';
        if (!byCustomer[customerName]) {
          byCustomer[customerName] = { count: 0, value: 0 };
        }
        byCustomer[customerName].count++;
        byCustomer[customerName].value += value;

        return {
          id: contract.ID,
          number: contract.Number,
          customer_name: contract.OrderedByName,
          customer_id: contract.OrderedBy,
          description: contract.Description,
          currency: contract.Currency,
          monthly_value: Math.round(value * 100) / 100,
          start_date: this.formatDate(contract.StartDate),
          end_date: this.formatDate(contract.EndDate),
          invoice_to: contract.InvoiceToName,
          payment_condition: contract.PaymentConditionDescription,
          created: this.formatDate(contract.Created),
          status: this.getContractStatus(contract.EndDate),
        };
      });

      return {
        contracts: formattedContracts,
        count: formattedContracts.length,
        summary: {
          total_monthly_value: Math.round(totalValue * 100) / 100,
          total_annual_value: Math.round(totalValue * 12 * 100) / 100,
          by_customer: Object.entries(byCustomer)
            .map(([customer, data]) => ({
              customer,
              count: data.count,
              monthly_value: Math.round(data.value * 100) / 100,
            }))
            .sort((a, b) => b.monthly_value - a.monthly_value)
            .slice(0, 10),
        },
        filters: { account_id: accountId, active_only: activeOnly },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen verkoopcontracten: ${(error as Error).message}`,
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

  private getContractStatus(endDate: string | null | undefined): string {
    if (!endDate) return 'Onbepaalde tijd';
    const formattedDate = this.formatDate(endDate);
    if (!formattedDate) return 'Onbepaalde tijd';
    const end = new Date(formattedDate);
    const today = new Date();
    const daysUntilEnd = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilEnd < 0) return 'Verlopen';
    if (daysUntilEnd <= 30) return 'Verloopt binnenkort';
    return 'Actief';
  }
}

/**
 * Get Purchase Contracts Tool
 *
 * Retrieves recurring purchase contracts.
 */
export class GetPurchaseContractsTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_purchase_contracts',
    description:
      'Haal terugkerende inkoopcontracten op uit Exact Online. ' +
      'Gebruik voor: terugkerende kosten overzicht, leverancierscontracten, contractbeheer. ' +
      'Toont leverancier, waarde, start- en einddatum. ' +
      'VEREIST: Purchase Orders module actief in Exact Online.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        supplier_id: {
          type: 'string',
          description: 'Filter op leverancier (GUID). Optioneel.',
        },
        active_only: {
          type: 'boolean',
          description: 'Alleen actieve contracten. Default: true',
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
        contracts: { type: 'array' },
        count: { type: 'number' },
        summary: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['contracts', 'count', 'summary', 'filters', 'division'],
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

    const supplierId = params.supplier_id as string | undefined;
    const activeOnly = params.active_only !== false;
    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);

    // Note: Exact Online may not have a direct PurchaseSubscriptions endpoint
    // We'll try purchaseorder/PurchaseOrders with recurring flag or subscription endpoint
    const filters: string[] = [];

    if (supplierId) {
      try {
        filters.push(buildGuidFilter('Supplier', supplierId));
      } catch (error) {
        return { error: `Ongeldig supplier_id formaat: ${(error as Error).message}`, division };
      }
    }

    if (activeOnly) {
      const today = new Date().toISOString().split('T')[0];
      filters.push(`(EndDate eq null or EndDate ge datetime'${today}T00:00:00')`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';

    // Use purchase orders endpoint
    try {
      const endpoint = `/${division}/purchaseorder/PurchaseOrders?$select=ID,PurchaseOrderNumber,Supplier,SupplierName,Description,Currency,OrderDate,ReceiptDate,PaymentCondition,PaymentConditionDescription,Created,Modified${filterString}&$top=${limit}`;

      const response = await this.exactRequest<ExactODataResponse<PurchaseSubscription>>(connection, endpoint);
      const contracts = extractODataResults<PurchaseSubscription>(response?.d as Record<string, unknown>);

      // Calculate summary
      let totalCount = contracts.length;
      const bySupplier: Record<string, number> = {};

      const formattedContracts = contracts.map((contract: PurchaseSubscription) => {
        const supplierName = contract.SupplierName || 'Onbekend';
        bySupplier[supplierName] = (bySupplier[supplierName] || 0) + 1;

        return {
          id: contract.ID,
          number: contract.Number,
          supplier_name: contract.SupplierName,
          supplier_id: contract.Supplier,
          description: contract.Description,
          currency: contract.Currency,
          start_date: this.formatDate(contract.StartDate),
          end_date: this.formatDate(contract.EndDate),
          payment_condition: contract.PaymentConditionDescription,
          created: this.formatDate(contract.Created),
        };
      });

      return {
        contracts: formattedContracts,
        count: formattedContracts.length,
        summary: {
          total_contracts: totalCount,
          by_supplier: Object.entries(bySupplier)
            .map(([supplier, count]) => ({ supplier, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
        },
        filters: { supplier_id: supplierId, active_only: activeOnly },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen inkoopcontracten: ${(error as Error).message}`,
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
}

/**
 * Get Recurring Revenue Tool
 *
 * Calculates MRR/ARR overview from subscriptions.
 */
export class GetRecurringRevenueTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_recurring_revenue',
    description:
      'Bereken MRR (Monthly Recurring Revenue) en ARR overzicht uit Exact Online. ' +
      'Gebruik voor: SaaS metrics, recurring revenue analyse, churn analyse. ' +
      'Toont MRR, ARR, aantal actieve abonnementen en trend. ' +
      'VEREIST: Subscription module actief in Exact Online.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        mrr: { type: 'number' },
        arr: { type: 'number' },
        active_subscriptions: { type: 'number' },
        summary: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['mrr', 'arr', 'active_subscriptions', 'summary', 'division'],
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

    try {
      const today = new Date().toISOString().split('T')[0];
      const filter = encodeURIComponent(`(EndDate eq null or EndDate ge datetime'${today}T00:00:00')`);
      const endpoint = `/${division}/subscription/Subscriptions?$select=ID,Number,OrderedByName,Currency,StartDate,EndDate&$filter=${filter}&$top=1000`;

      const response = await this.exactRequest<ExactODataResponse<SalesSubscription>>(connection, endpoint);
      const subscriptions = extractODataResults<SalesSubscription>(response?.d as Record<string, unknown>);

      // Fetch subscription lines to calculate MRR
      let totalMRR = 0;
      const customerMRR: Record<string, number> = {};

      for (const sub of subscriptions.slice(0, 100)) {
        // Note: API uses EntryID as foreign key, not Subscription
        const linesEndpoint = `/${division}/subscription/SubscriptionLines?$select=ID,EntryID,AmountDC&$filter=${buildGuidFilter('EntryID', sub.ID)}`;
        try {
          const linesResponse = await this.exactRequest<ExactODataResponse<SalesSubscriptionLine>>(connection, linesEndpoint);
          const lines = extractODataResults<SalesSubscriptionLine>(linesResponse?.d as Record<string, unknown>);
          const subValue = lines.reduce((sum: number, line: SalesSubscriptionLine) => sum + (line.AmountDC || 0), 0);
          totalMRR += subValue;

          const customer = sub.OrderedByName || 'Onbekend';
          customerMRR[customer] = (customerMRR[customer] || 0) + subValue;
        } catch (error) {
          logger.error('Fout bij ophalen subscription lines', error instanceof Error ? error : undefined, { tool: 'GetRecurringRevenue', subscriptionId: sub.ID });
        }
      }

      // Calculate metrics
      const activeCount = subscriptions.length;
      const arr = totalMRR * 12;
      const averageMRR = activeCount > 0 ? totalMRR / activeCount : 0;

      // Top customers by MRR
      const topCustomers = Object.entries(customerMRR)
        .map(([customer, mrr]) => ({ customer, mrr: Math.round(mrr * 100) / 100 }))
        .sort((a, b) => b.mrr - a.mrr)
        .slice(0, 10);

      return {
        mrr: Math.round(totalMRR * 100) / 100,
        arr: Math.round(arr * 100) / 100,
        active_subscriptions: activeCount,
        summary: {
          average_mrr_per_subscription: Math.round(averageMRR * 100) / 100,
          currency: 'EUR',
          top_customers: topCustomers,
          calculation_note: 'MRR berekend op basis van actieve abonnementen in Exact Online',
        },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij berekenen recurring revenue: ${(error as Error).message}`,
        division,
      };
    }
  }
}

// Export all contract tools
export const contractTools = [
  GetSalesContractsTool,
  GetPurchaseContractsTool,
  GetRecurringRevenueTool,
];
