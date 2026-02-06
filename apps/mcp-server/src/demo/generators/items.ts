/**
 * Demo Generators: Items & Inventory tools
 *
 * Returns demo data for items and stock positions.
 */

import { getCurrentIndustryConfig } from '../context';
import { getItems, getStockPositions, getTotalStockValue } from '../data/items';

/**
 * Generate response for get_items tool
 */
export function generateGetItemsResponse(
  params: Record<string, unknown>
): unknown {
  const type = params.type as 'verkoop' | 'inkoop' | 'beide' | 'all' | undefined;
  const category = params.category as string | undefined;
  const isActive = params.is_active as boolean | undefined;

  const items = getItems({ type, category, isActive });

  // Group by category
  const byCategory: Record<string, number> = {};
  for (const item of items) {
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
  }

  // Sales items stats
  const salesItems = items.filter((i) => i.type === 'verkoop' || i.type === 'beide');
  const avgMargin = salesItems.length > 0
    ? salesItems.reduce((sum, i) => {
        const margin = i.salesPrice > 0 ? ((i.salesPrice - i.costPrice) / i.salesPrice) * 100 : 0;
        return sum + margin;
      }, 0) / salesItems.length
    : 0;

  return {
    items: items.map((i) => ({
      id: i.id,
      code: i.code,
      description: i.description,
      type: i.type,
      category: i.category,
      unit: i.unit,
      sales_price: i.salesPrice,
      cost_price: i.costPrice,
      vat_rate: i.vatRate,
      is_active: i.isActive,
      margin: i.salesPrice > 0
        ? Math.round(((i.salesPrice - i.costPrice) / i.salesPrice) * 100)
        : null,
    })),
    count: items.length,
    by_category: Object.entries(byCategory).map(([cat, count]) => ({
      category: cat,
      count,
    })),
    stats: {
      sales_items: salesItems.length,
      purchase_items: items.filter((i) => i.type === 'inkoop').length,
      average_margin: Math.round(avgMargin),
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: `${items.length} artikelen gevonden. Gem. marge op verkoopproducten: ${Math.round(avgMargin)}%.`,
    },
    related_tools: [
      { tool: 'get_stock_positions', when: 'Voor voorraadposities' },
      { tool: 'get_sales_orders', when: 'Voor orders met deze artikelen' },
    ],
  };
}

/**
 * Generate response for get_stock_positions tool
 */
export function generateGetStockPositionsResponse(
  params: Record<string, unknown>
): unknown {
  const warehouse = params.warehouse as string | undefined;
  const belowReorderPoint = params.below_reorder_point as boolean | undefined;

  const positions = getStockPositions({ warehouse, belowReorderPoint });
  const totalValue = getTotalStockValue();

  // Items below reorder point
  const lowStock = positions.filter((p) => p.availableQuantity <= p.reorderPoint);

  // Group by warehouse
  const byWarehouse: Record<string, { count: number; value: number }> = {};
  for (const pos of positions) {
    if (!byWarehouse[pos.warehouse]) {
      byWarehouse[pos.warehouse] = { count: 0, value: 0 };
    }
    byWarehouse[pos.warehouse].count++;
    byWarehouse[pos.warehouse].value += pos.stockValue;
  }

  return {
    positions: positions.map((p) => ({
      item_id: p.itemId,
      item_code: p.itemCode,
      item_description: p.itemDescription,
      warehouse: p.warehouse,
      quantity_in_stock: p.quantityInStock,
      reserved_quantity: p.reservedQuantity,
      available_quantity: p.availableQuantity,
      reorder_point: p.reorderPoint,
      unit: p.unit,
      stock_value: p.stockValue,
      below_reorder_point: p.availableQuantity <= p.reorderPoint,
    })),
    count: positions.length,
    totals: {
      total_stock_value: totalValue,
      items_below_reorder_point: lowStock.length,
    },
    by_warehouse: Object.entries(byWarehouse).map(([wh, data]) => ({
      warehouse: wh,
      item_count: data.count,
      stock_value: data.value,
    })),
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: `${positions.length} voorraadposities, totale waarde EUR ${totalValue.toLocaleString('nl-NL')}. ${lowStock.length} artikelen onder bestelpunt.`,
      alerts: lowStock.length > 0
        ? `Let op: ${lowStock.map((p) => p.itemDescription).join(', ')} onder bestelpunt.`
        : 'Alle voorraden boven bestelpunt.',
    },
    related_tools: [
      { tool: 'get_items', when: 'Voor artikeldetails' },
      { tool: 'get_purchase_orders', when: 'Voor lopende bestellingen' },
    ],
  };
}
