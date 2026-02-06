/**
 * Items & Inventory Tools
 *
 * Tools for working with Exact Online items (artikelen), inventory, and products.
 *
 * @see EXACT-011 in operations/ROADMAP.md
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import { escapeODataString } from '../exact/odata-query';
import type { ExactItem, ExactStockPosition, ExactODataResponse } from '@exact-mcp/shared';

/**
 * Get Items Tool
 */
export class GetItemsTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_items',
    description:
      'Haal artikelen/producten op uit Exact Online. ' +
      'Gebruik voor: productoverzicht, voorraad, prijzen, artikelgegevens. ' +
      'Kan filteren op type (voorraad/dienst), actief/inactief, en zoeken op naam/code.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        search: {
          type: 'string',
          description: 'Zoek in artikelcode of omschrijving.',
        },
        item_type: {
          type: 'string',
          enum: ['all', 'stock', 'service', 'non_stock', 'serial', 'batch'],
          description: 'Type: stock (voorraad), service (dienst), non_stock (niet op voorraad), serial (serienummer), batch, all. Default: all',
        },
        active_only: {
          type: 'boolean',
          description: 'Alleen actieve artikelen. Default: true',
        },
        item_group: {
          type: 'string',
          description: 'Filter op artikelgroep (GUID). Optioneel.',
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

    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);
    const search = params.search as string | undefined;
    const itemType = (params.item_type as string) || 'all';
    const activeOnly = params.active_only !== false; // default true
    const itemGroup = params.item_group as string | undefined;

    const filters: string[] = [];

    // Note: Items don't have a direct "active/inactive" field
    // IsSalesItem indicates if item can be sold (closest to "active" for sales context)
    if (activeOnly) {
      filters.push(`IsSalesItem eq true`);
    }

    if (search) {
      const escapedSearch = escapeODataString(search);
      // Note: Exact Online OData requires 'eq true' suffix for substringof()
      filters.push(`(substringof('${escapedSearch}', Code) eq true or substringof('${escapedSearch}', Description) eq true)`);
    }

    if (itemGroup) {
      filters.push(`ItemGroup eq guid'${itemGroup}'`);
    }

    // Item type: 1=Stock, 2=Service, 3=NonStock, 4=Serial, 5=Batch
    if (itemType === 'stock') {
      filters.push(`Type eq 1`);
    } else if (itemType === 'service') {
      filters.push(`Type eq 2`);
    } else if (itemType === 'non_stock') {
      filters.push(`Type eq 3`);
    } else if (itemType === 'serial') {
      filters.push(`Type eq 4`);
    } else if (itemType === 'batch') {
      filters.push(`Type eq 5`);
    }

    // API requires at least one filter - add Created filter as fallback
    if (filters.length === 0) {
      filters.push(`Created ge datetime'2000-01-01T00:00:00'`);
    }
    const filterString = `&$filter=${encodeURIComponent(filters.join(' and '))}`;

    // Note: Only use fields confirmed in Exact Online API docs
    // Removed: ItemGroupDescription, IsWebshopItem, SalesPrice, PurchasePrice, UnitDescription (don't exist)
    const endpoint = `/${division}/logistics/Items?$select=ID,Code,Description,IsSalesItem,IsPurchaseItem,IsStockItem,CostPriceStandard,StandardSalesPrice,Unit,Stock${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<ExactODataResponse<ExactItem>>(connection, endpoint);
      const items = extractODataResults<ExactItem>(response?.d as Record<string, unknown>);

      // Summary stats
      let totalStock = 0;
      let totalStockValue = 0;

      const formattedItems = items.map((item: ExactItem) => {
        const stock = item.Stock || 0;
        const costPrice = item.CostPriceStandard || 0;
        totalStock += stock;
        totalStockValue += stock * costPrice;

        const itemRecord = item as unknown as Record<string, unknown>;
        return {
          id: item.ID,
          code: item.Code,
          description: item.Description,
          is_sales_item: item.IsSalesItem,
          is_purchase_item: item.IsPurchaseItem,
          is_stock_item: item.IsStockItem,
          cost_price: costPrice,
          sales_price: itemRecord.StandardSalesPrice,
          unit: item.Unit,
          stock: stock,
          stock_value: Math.round(stock * costPrice * 100) / 100,
        };
      });

      return {
        items: formattedItems,
        count: formattedItems.length,
        summary: {
          total_stock_units: totalStock,
          total_stock_value: Math.round(totalStockValue * 100) / 100,
        },
        filters: { search, item_type: itemType, active_only: activeOnly, item_group: itemGroup },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen artikelen: ${(error as Error).message}`,
        division,
      };
    }
  }
}

/**
 * Get Stock Positions Tool
 */
export class GetStockPositionsTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_stock_positions',
    description:
      'Haal actuele voorraadposities op uit Exact Online. ' +
      'Gebruik voor: voorraadniveaus, waardebepaling, minimum voorraad check. ' +
      'Toont per artikel: voorraad, gereserveerd, beschikbaar, waarde.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        item_code: {
          type: 'string',
          description: 'Filter op artikelcode. Optioneel.',
        },
        warehouse: {
          type: 'string',
          description: 'Filter op magazijn (GUID). Optioneel.',
        },
        below_minimum: {
          type: 'boolean',
          description: 'Alleen artikelen onder minimum voorraad tonen.',
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
        positions: { type: 'array' },
        count: { type: 'number' },
        totals: { type: 'object' },
        alerts: { type: 'array', description: 'Artikelen onder minimum voorraad' },
        division: { type: 'number' },
      },
      required: ['positions', 'count', 'totals', 'alerts', 'division'],
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
    const itemCode = params.item_code as string | undefined;
    const warehouse = params.warehouse as string | undefined;
    const belowMinimum = params.below_minimum as boolean | undefined;

    const filters: string[] = [];

    if (itemCode) {
      filters.push(`ItemCode eq '${escapeODataString(itemCode)}'`);
    }

    if (warehouse) {
      filters.push(`Warehouse eq guid'${warehouse}'`);
    }

    // Build filter string (StockPositions may not require mandatory filter, but include for consistency)
    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';

    const endpoint = `/${division}/inventory/StockPositions?$select=ID,ItemId,Item,ItemCode,ItemDescription,Warehouse,WarehouseCode,WarehouseDescription,InStock,Reserved,PlanningIn,PlanningOut,UnitCost${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<ExactODataResponse<ExactStockPosition>>(connection, endpoint);
      const positions = extractODataResults<ExactStockPosition>(response?.d as Record<string, unknown>);

      let totalStock = 0;
      let totalValue = 0;
      const alerts: Array<{ item_code: string; item_description: string; alert: string; available: number }> = [];

      const formattedPositions = positions.map((pos: ExactStockPosition) => {
        const inStock = pos.InStock || 0;
        const reserved = pos.Reserved || 0;
        const planningIn = pos.PlanningIn || 0;
        const planningOut = pos.PlanningOut || 0;
        const unitCost = pos.UnitCost || 0;
        const available = inStock - reserved;

        totalStock += inStock;
        totalValue += inStock * unitCost;

        const position = {
          id: pos.ID,
          item_id: pos.ItemId || pos.Item,
          item_code: pos.ItemCode,
          item_description: pos.ItemDescription,
          warehouse_code: pos.WarehouseCode,
          warehouse_name: pos.WarehouseDescription,
          in_stock: inStock,
          reserved: reserved,
          available: available,
          planning_in: planningIn,
          planning_out: planningOut,
          projected: available + planningIn - planningOut,
          unit_cost: unitCost,
          stock_value: Math.round(inStock * unitCost * 100) / 100,
        };

        // Check for low stock (available <= 0 while in stock > 0 = fully reserved)
        if (available <= 0 && inStock > 0) {
          alerts.push({
            item_code: pos.ItemCode,
            item_description: pos.ItemDescription,
            alert: 'Volledig gereserveerd',
            available: available,
          });
        }

        return position;
      });

      // Filter for below minimum if requested
      const filteredPositions = belowMinimum
        ? formattedPositions.filter((p) => p.available <= 0)
        : formattedPositions;

      return {
        positions: filteredPositions,
        count: filteredPositions.length,
        totals: {
          total_stock_units: totalStock,
          total_stock_value: Math.round(totalValue * 100) / 100,
        },
        alerts,
        filters: { item_code: itemCode, warehouse, below_minimum: belowMinimum },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen voorraadposities: ${(error as Error).message}`,
        division,
      };
    }
  }
}

// Export all item tools
export const itemTools = [
  GetItemsTool,
  GetStockPositionsTool,
];
