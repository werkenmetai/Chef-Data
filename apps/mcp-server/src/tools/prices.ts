/**
 * Price List Tools (SCOPE-010)
 *
 * Tools for working with sales and purchase prices.
 *
 * @see SCOPE-010 in operations/ROADMAP.md
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import { escapeODataString } from '../exact/odata-query';
import type { ExactODataResponse, ExactSalesPrice, ExactItem } from '@exact-mcp/shared';

/**
 * Get Sales Prices Tool
 *
 * Retrieves sales prices (verkoopprijzen) per item/customer.
 */
export class GetSalesPricesTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_sales_prices',
    description:
      'Haal verkoopprijzen op uit Exact Online. ' +
      'Gebruik voor: prijslijsten, klantspecifieke prijzen, staffelprijzen. ' +
      'Kan filteren op artikel en klant.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        item_id: {
          type: 'string',
          description: 'Filter op artikel (GUID). Optioneel.',
        },
        account_id: {
          type: 'string',
          description: 'Filter op klant voor klantspecifieke prijzen (GUID). Optioneel.',
        },
        search: {
          type: 'string',
          description: 'Zoek in artikelcode of omschrijving. Optioneel.',
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
        prices: { type: 'array' },
        count: { type: 'number' },
        summary: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['prices', 'count', 'summary', 'filters', 'division'],
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

    const itemId = params.item_id as string | undefined;
    const accountId = params.account_id as string | undefined;
    const search = params.search as string | undefined;
    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);

    const filters: string[] = [];

    if (itemId) {
      filters.push(`Item eq guid'${itemId}'`);
    }

    if (accountId) {
      filters.push(`Account eq guid'${accountId}'`);
    }

    if (search) {
      const escapedSearch = escapeODataString(search);
      // Note: Exact Online OData requires 'eq true' suffix for substringof()
      filters.push(`(substringof('${escapedSearch}', ItemCode) eq true or substringof('${escapedSearch}', ItemDescription) eq true)`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';
    // Note: NumberOfItemPerUnit → NumberOfItemsPerUnit (with 's')
    const endpoint = `/${division}/logistics/SalesItemPrices?$select=ID,Item,ItemCode,ItemDescription,Account,AccountName,Currency,DefaultItemUnit,DefaultItemUnitDescription,NumberOfItemsPerUnit,Price,Quantity,StartDate,EndDate,Created,Modified${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<ExactODataResponse<ExactSalesPrice>>(connection, endpoint);
      const prices = extractODataResults<ExactSalesPrice>(response?.d as Record<string, unknown>);

      // Calculate summary
      const byItem: Record<string, { min: number; max: number; count: number }> = {};
      let totalPrices = 0;

      const formattedPrices = prices.map((price: ExactSalesPrice) => {
        const priceValue = price.Price || 0;
        totalPrices++;

        const itemCode = price.ItemCode || 'Onbekend';
        if (!byItem[itemCode]) {
          byItem[itemCode] = { min: priceValue, max: priceValue, count: 0 };
        }
        byItem[itemCode].min = Math.min(byItem[itemCode].min, priceValue);
        byItem[itemCode].max = Math.max(byItem[itemCode].max, priceValue);
        byItem[itemCode].count++;

        return {
          id: price.ID,
          item_code: price.ItemCode,
          item_description: price.ItemDescription,
          item_id: price.Item,
          customer_name: price.AccountName,
          customer_id: price.Account,
          price: priceValue,
          currency: price.Currency,
          quantity_from: price.Quantity,
          unit: price.DefaultItemUnitDescription,
          unit_quantity: (price as unknown as Record<string, unknown>).NumberOfItemsPerUnit as number,
          start_date: this.formatDate(price.StartDate),
          end_date: this.formatDate(price.EndDate),
          is_customer_specific: !!price.Account,
        };
      });

      return {
        prices: formattedPrices,
        count: formattedPrices.length,
        summary: {
          total_price_entries: totalPrices,
          items_with_prices: Object.keys(byItem).length,
          customer_specific_prices: formattedPrices.filter((p: { is_customer_specific: boolean }) => p.is_customer_specific).length,
          price_ranges: Object.entries(byItem)
            .map(([item, data]) => ({
              item,
              min_price: data.min,
              max_price: data.max,
              price_variations: data.count,
            }))
            .slice(0, 20),
        },
        filters: { item_id: itemId, account_id: accountId, search },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen verkoopprijzen: ${(error as Error).message}`,
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
 * Get Purchase Prices Tool
 *
 * Retrieves purchase prices from Items (standard purchase price per article).
 * Note: Uses /logistics/Items endpoint instead of /logistics/SupplierItem
 * because SupplierItem requires additional scopes not available in standard editions.
 *
 * @see LESSONS-LEARNED.md - SupplierItem endpoint scope issue
 */
export class GetPurchasePricesTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_purchase_prices',
    description:
      'Haal inkoopprijzen op uit Exact Online. ' +
      'Toont de standaard inkoopprijs (PurchasePrice) en kostprijs (CostPriceStandard) per artikel. ' +
      'Gebruik voor: kostprijsoverzicht, inkoopprijzen per artikel.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        item_id: {
          type: 'string',
          description: 'Filter op artikel (GUID). Optioneel.',
        },
        purchase_items_only: {
          type: 'boolean',
          description: 'Alleen inkoopbare artikelen tonen (IsPurchaseItem=true). Default: true',
        },
        search: {
          type: 'string',
          description: 'Zoek in artikelcode of omschrijving. Optioneel.',
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
        prices: { type: 'array' },
        count: { type: 'number' },
        summary: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['prices', 'count', 'summary', 'filters', 'division'],
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

    const itemId = params.item_id as string | undefined;
    const purchaseItemsOnly = params.purchase_items_only !== false; // Default true
    const search = params.search as string | undefined;
    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);

    const filters: string[] = [];

    // Filter only purchasable items by default
    if (purchaseItemsOnly) {
      filters.push('IsPurchaseItem eq true');
    }

    if (itemId) {
      filters.push(`ID eq guid'${itemId}'`);
    }

    if (search) {
      const escapedSearch = escapeODataString(search);
      // Note: Exact Online OData requires 'eq true' suffix for substringof()
      filters.push(`(substringof('${escapedSearch}', Code) eq true or substringof('${escapedSearch}', Description) eq true)`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';
    // Use /logistics/Items endpoint which works with standard scopes
    // Note: PurchasePrice, SalesPrice, Currency don't exist - use CostPriceStandard, StandardSalesPrice
    const endpoint = `/${division}/logistics/Items?$select=ID,Code,Description,CostPriceStandard,StandardSalesPrice,Unit,UnitDescription,IsPurchaseItem,IsStockItem,ItemGroup,ItemGroupDescription,Created,Modified${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<ExactODataResponse<ExactItem>>(connection, endpoint);
      const items = extractODataResults<ExactItem>(response?.d as Record<string, unknown>);

      // Calculate summary statistics
      let totalPurchasePrice = 0;
      let totalCostPrice = 0;
      let itemsWithPurchasePrice = 0;
      let itemsWithCostPrice = 0;
      const byGroup: Record<string, { count: number; totalPurchasePrice: number }> = {};

      const formattedPrices = items.map((item: ExactItem) => {
        const itemRecord = item as unknown as Record<string, unknown>;
        // Use CostPriceStandard as purchase price (PurchasePrice field doesn't exist)
        const costPrice = item.CostPriceStandard || 0;
        const salesPrice = (itemRecord.StandardSalesPrice as number) || 0;

        if (costPrice > 0) {
          totalPurchasePrice += costPrice;
          itemsWithPurchasePrice++;
          totalCostPrice += costPrice;
          itemsWithCostPrice++;
        }

        // Group statistics
        const groupName = item.ItemGroupDescription || 'Geen groep';
        if (!byGroup[groupName]) {
          byGroup[groupName] = { count: 0, totalPurchasePrice: 0 };
        }
        byGroup[groupName].count++;
        byGroup[groupName].totalPurchasePrice += costPrice;

        return {
          id: item.ID,
          item_code: item.Code,
          item_description: item.Description,
          purchase_price: costPrice, // Using CostPriceStandard as purchase price
          cost_price_standard: costPrice,
          sales_price: salesPrice,
          currency: 'EUR', // Items endpoint doesn't include currency, default to EUR
          unit: item.UnitDescription || item.Unit,
          item_group: item.ItemGroupDescription,
          is_purchase_item: item.IsPurchaseItem,
          is_stock_item: item.IsStockItem,
          // Calculate markup if both prices exist
          markup_percentage: costPrice > 0 && salesPrice > 0
            ? Math.round(((salesPrice - costPrice) / costPrice) * 1000) / 10
            : null,
        };
      });

      return {
        prices: formattedPrices,
        count: formattedPrices.length,
        summary: {
          total_items: formattedPrices.length,
          items_with_purchase_price: itemsWithPurchasePrice,
          items_with_cost_price: itemsWithCostPrice,
          average_purchase_price: itemsWithPurchasePrice > 0
            ? Math.round((totalPurchasePrice / itemsWithPurchasePrice) * 100) / 100
            : 0,
          average_cost_price: itemsWithCostPrice > 0
            ? Math.round((totalCostPrice / itemsWithCostPrice) * 100) / 100
            : 0,
          by_group: Object.entries(byGroup)
            .map(([group, data]) => ({
              group,
              item_count: data.count,
              avg_purchase_price: data.count > 0
                ? Math.round((data.totalPurchasePrice / data.count) * 100) / 100
                : 0,
            }))
            .sort((a, b) => b.item_count - a.item_count)
            .slice(0, 10),
        },
        filters: { item_id: itemId, purchase_items_only: purchaseItemsOnly, search },
        division,
        note: 'Toont standaard inkoopprijzen per artikel. Voor leveranciersspecifieke prijzen is een uitgebreidere Exact Online editie vereist.',
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen inkoopprijzen: ${(error as Error).message}`,
        division,
      };
    }
  }
}

/**
 * Get Margin Analysis Tool
 *
 * Calculates margin analysis comparing sales vs purchase prices.
 */
export class GetMarginAnalysisTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_margin_analysis',
    description:
      'Bereken marge-analyse door verkoop- en inkoopprijzen te vergelijken. ' +
      'Gebruik voor: bruto marge per artikel, winstgevendheid, prijsstrategie. ' +
      'Toont verkoopprijs, inkoopprijs en berekende marge.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        item_id: {
          type: 'string',
          description: 'Filter op specifiek artikel (GUID). Optioneel.',
        },
        min_margin_percentage: {
          type: 'number',
          description: 'Filter op minimum marge percentage. Optioneel.',
        },
        max_margin_percentage: {
          type: 'number',
          description: 'Filter op maximum marge percentage (voor lage marge items). Optioneel.',
        },
        limit: {
          type: 'number',
          description: 'Maximum aantal resultaten (1-200). Default: 100',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        items: { type: 'array' },
        count: { type: 'number' },
        summary: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['items', 'count', 'summary', 'filters', 'division'],
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

    const itemId = params.item_id as string | undefined;
    const minMarginPct = params.min_margin_percentage as number | undefined;
    const maxMarginPct = params.max_margin_percentage as number | undefined;
    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 200);

    try {
      // Fetch items with sales and purchase prices
      const itemFilters: string[] = [];
      if (itemId) {
        itemFilters.push(`ID eq guid'${itemId}'`);
      }
      const itemFilterString = itemFilters.length > 0 ? `&$filter=${encodeURIComponent(itemFilters.join(' and '))}` : '';

      // Note: SalesPrice, PurchasePrice don't exist - use StandardSalesPrice, CostPriceStandard
      const itemsEndpoint = `/${division}/logistics/Items?$select=ID,Code,Description,StandardSalesPrice,CostPriceStandard${itemFilterString}&$top=${limit * 2}`;
      const itemsResponse = await this.exactRequest<ExactODataResponse<ExactItem>>(connection, itemsEndpoint);
      const items = extractODataResults<ExactItem>(itemsResponse?.d as Record<string, unknown>);

      // Calculate margins
      let totalMarginPct = 0;
      let itemsWithMargin = 0;
      const marginDistribution = { high: 0, medium: 0, low: 0, negative: 0 };

      const marginItems = items
        .map((item: ExactItem) => {
          const itemRecord = item as unknown as Record<string, unknown>;
          const salesPrice = (itemRecord.StandardSalesPrice as number) || 0;
          const purchasePrice = item.CostPriceStandard || 0;

          if (salesPrice === 0 && purchasePrice === 0) {
            return null; // Skip items without prices
          }

          const marginAmount = salesPrice - purchasePrice;
          const marginPct = salesPrice > 0 ? (marginAmount / salesPrice) * 100 : 0;

          // Apply filters
          if (minMarginPct !== undefined && marginPct < minMarginPct) return null;
          if (maxMarginPct !== undefined && marginPct > maxMarginPct) return null;

          // Update stats
          if (salesPrice > 0 || purchasePrice > 0) {
            totalMarginPct += marginPct;
            itemsWithMargin++;

            if (marginPct < 0) marginDistribution.negative++;
            else if (marginPct < 20) marginDistribution.low++;
            else if (marginPct < 40) marginDistribution.medium++;
            else marginDistribution.high++;
          }

          return {
            item_code: item.Code,
            item_description: item.Description,
            item_id: item.ID,
            sales_price: salesPrice,
            purchase_price: purchasePrice,
            margin_amount: Math.round(marginAmount * 100) / 100,
            margin_percentage: Math.round(marginPct * 10) / 10,
            margin_category: marginPct < 0 ? 'Negatief' : marginPct < 20 ? 'Laag' : marginPct < 40 ? 'Medium' : 'Hoog',
          };
        })
        .filter(Boolean)
        .slice(0, limit);

      const avgMarginPct = itemsWithMargin > 0 ? totalMarginPct / itemsWithMargin : 0;

      return {
        items: marginItems,
        count: marginItems.length,
        summary: {
          average_margin_percentage: Math.round(avgMarginPct * 10) / 10,
          items_analyzed: itemsWithMargin,
          margin_distribution: {
            high_margin_40_plus: marginDistribution.high,
            medium_margin_20_40: marginDistribution.medium,
            low_margin_0_20: marginDistribution.low,
            negative_margin: marginDistribution.negative,
          },
          warning: marginDistribution.negative > 0 ? `${marginDistribution.negative} artikelen met negatieve marge gevonden` : null,
        },
        filters: {
          item_id: itemId,
          min_margin_percentage: minMarginPct,
          max_margin_percentage: maxMarginPct,
        },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij marge-analyse: ${(error as Error).message}`,
        division,
      };
    }
  }
}

// Export all price tools
export const priceTools = [
  GetSalesPricesTool,
  GetPurchasePricesTool,
  GetMarginAnalysisTool,
];
