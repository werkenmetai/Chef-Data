/**
 * Demo Items & Inventory Data
 *
 * Products and stock positions for the bakery.
 */

/**
 * Item (product) interface
 */
export interface DemoItem {
  id: string;
  code: string;
  description: string;
  type: 'verkoop' | 'inkoop' | 'beide';
  category: string;
  unit: string;
  salesPrice: number;
  costPrice: number;
  vatRate: number; // 9% for food, 21% for services
  isActive: boolean;
}

/**
 * Stock position interface
 */
export interface DemoStockPosition {
  itemId: string;
  itemCode: string;
  itemDescription: string;
  warehouse: string;
  quantityInStock: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  unit: string;
  stockValue: number;
}

/**
 * Demo items - bakery products and ingredients
 */
export const DEMO_ITEMS: DemoItem[] = [
  // Verkoop producten - Brood
  {
    id: 'item-001',
    code: 'BROOD-001',
    description: 'Croissants (per 10)',
    type: 'verkoop',
    category: 'Brood',
    unit: 'doos',
    salesPrice: 15.00,
    costPrice: 6.50,
    vatRate: 9,
    isActive: true,
  },
  {
    id: 'item-002',
    code: 'BROOD-002',
    description: 'Volkoren brood',
    type: 'verkoop',
    category: 'Brood',
    unit: 'stuk',
    salesPrice: 3.50,
    costPrice: 1.20,
    vatRate: 9,
    isActive: true,
  },
  {
    id: 'item-003',
    code: 'BROOD-003',
    description: 'Wit brood',
    type: 'verkoop',
    category: 'Brood',
    unit: 'stuk',
    salesPrice: 3.00,
    costPrice: 1.00,
    vatRate: 9,
    isActive: true,
  },
  {
    id: 'item-004',
    code: 'BROOD-004',
    description: 'Broodjes assortiment (per 10)',
    type: 'verkoop',
    category: 'Brood',
    unit: 'doos',
    salesPrice: 18.00,
    costPrice: 7.50,
    vatRate: 9,
    isActive: true,
  },
  {
    id: 'item-005',
    code: 'BROOD-005',
    description: 'Stokbrood',
    type: 'verkoop',
    category: 'Brood',
    unit: 'stuk',
    salesPrice: 2.50,
    costPrice: 0.90,
    vatRate: 9,
    isActive: true,
  },

  // Verkoop producten - Gebak
  {
    id: 'item-006',
    code: 'GEBAK-001',
    description: 'Petit fours (per 20)',
    type: 'verkoop',
    category: 'Gebak',
    unit: 'doos',
    salesPrice: 35.00,
    costPrice: 14.00,
    vatRate: 9,
    isActive: true,
  },
  {
    id: 'item-007',
    code: 'GEBAK-002',
    description: 'Taartpunt (per stuk)',
    type: 'verkoop',
    category: 'Gebak',
    unit: 'stuk',
    salesPrice: 4.50,
    costPrice: 1.80,
    vatRate: 9,
    isActive: true,
  },
  {
    id: 'item-008',
    code: 'GEBAK-003',
    description: 'Muffins (per 6)',
    type: 'verkoop',
    category: 'Gebak',
    unit: 'doos',
    salesPrice: 15.70,
    costPrice: 6.30,
    vatRate: 9,
    isActive: true,
  },
  {
    id: 'item-009',
    code: 'GEBAK-004',
    description: 'Brownies (per 12)',
    type: 'verkoop',
    category: 'Gebak',
    unit: 'doos',
    salesPrice: 24.00,
    costPrice: 9.60,
    vatRate: 9,
    isActive: true,
  },
  {
    id: 'item-010',
    code: 'GEBAK-005',
    description: 'Appeltaart (heel)',
    type: 'verkoop',
    category: 'Gebak',
    unit: 'stuk',
    salesPrice: 21.00,
    costPrice: 8.50,
    vatRate: 9,
    isActive: true,
  },
  {
    id: 'item-011',
    code: 'GEBAK-006',
    description: 'Koekjes (per 20)',
    type: 'verkoop',
    category: 'Gebak',
    unit: 'doos',
    salesPrice: 12.60,
    costPrice: 5.00,
    vatRate: 9,
    isActive: true,
  },

  // Inkoop producten - Grondstoffen
  {
    id: 'item-012',
    code: 'GROND-001',
    description: 'Tarwebloem (25kg)',
    type: 'inkoop',
    category: 'Grondstoffen',
    unit: 'zak',
    salesPrice: 0,
    costPrice: 32.00,
    vatRate: 9,
    isActive: true,
  },
  {
    id: 'item-013',
    code: 'GROND-002',
    description: 'Volkorenmeel (25kg)',
    type: 'inkoop',
    category: 'Grondstoffen',
    unit: 'zak',
    salesPrice: 0,
    costPrice: 28.00,
    vatRate: 9,
    isActive: true,
  },
  {
    id: 'item-014',
    code: 'GROND-003',
    description: 'Roggemeel (25kg)',
    type: 'inkoop',
    category: 'Grondstoffen',
    unit: 'zak',
    salesPrice: 0,
    costPrice: 26.00,
    vatRate: 9,
    isActive: true,
  },
  {
    id: 'item-015',
    code: 'GROND-004',
    description: 'Gist (500g)',
    type: 'inkoop',
    category: 'Grondstoffen',
    unit: 'pak',
    salesPrice: 0,
    costPrice: 6.00,
    vatRate: 9,
    isActive: true,
  },
  {
    id: 'item-016',
    code: 'GROND-005',
    description: 'Suiker (25kg)',
    type: 'inkoop',
    category: 'Grondstoffen',
    unit: 'zak',
    salesPrice: 0,
    costPrice: 22.00,
    vatRate: 9,
    isActive: true,
  },

  // Inkoop producten - Zuivel
  {
    id: 'item-017',
    code: 'ZUIVEL-001',
    description: 'Roomboter (10kg)',
    type: 'inkoop',
    category: 'Zuivel',
    unit: 'pak',
    salesPrice: 0,
    costPrice: 45.00,
    vatRate: 9,
    isActive: true,
  },
  {
    id: 'item-018',
    code: 'ZUIVEL-002',
    description: 'Slagroom (5L)',
    type: 'inkoop',
    category: 'Zuivel',
    unit: 'pak',
    salesPrice: 0,
    costPrice: 15.00,
    vatRate: 9,
    isActive: true,
  },
  {
    id: 'item-019',
    code: 'ZUIVEL-003',
    description: 'Volle melk (10L)',
    type: 'inkoop',
    category: 'Zuivel',
    unit: 'pak',
    salesPrice: 0,
    costPrice: 15.00,
    vatRate: 9,
    isActive: true,
  },

  // Inkoop producten - Eieren
  {
    id: 'item-020',
    code: 'EIEREN-001',
    description: 'Scharreleieren (tray 30)',
    type: 'inkoop',
    category: 'Eieren',
    unit: 'tray',
    salesPrice: 0,
    costPrice: 12.00,
    vatRate: 9,
    isActive: true,
  },
  {
    id: 'item-021',
    code: 'EIEREN-002',
    description: 'Biologische eieren (tray 30)',
    type: 'inkoop',
    category: 'Eieren',
    unit: 'tray',
    salesPrice: 0,
    costPrice: 25.00,
    vatRate: 9,
    isActive: true,
  },

  // Verpakking
  {
    id: 'item-022',
    code: 'VERPAK-001',
    description: 'Broodzakken (1000 st)',
    type: 'inkoop',
    category: 'Verpakking',
    unit: 'doos',
    salesPrice: 0,
    costPrice: 25.00,
    vatRate: 21,
    isActive: true,
  },
  {
    id: 'item-023',
    code: 'VERPAK-002',
    description: 'Taartdozen (100 st)',
    type: 'inkoop',
    category: 'Verpakking',
    unit: 'doos',
    salesPrice: 0,
    costPrice: 18.00,
    vatRate: 21,
    isActive: true,
  },
  {
    id: 'item-024',
    code: 'VERPAK-003',
    description: 'Etiketten (rol 1000)',
    type: 'inkoop',
    category: 'Verpakking',
    unit: 'rol',
    salesPrice: 0,
    costPrice: 10.00,
    vatRate: 21,
    isActive: true,
  },
];

/**
 * Demo stock positions
 */
export const DEMO_STOCK_POSITIONS: DemoStockPosition[] = [
  // Verkoop producten voorraad (laag, vers product)
  {
    itemId: 'item-001',
    itemCode: 'BROOD-001',
    itemDescription: 'Croissants (per 10)',
    warehouse: 'Hoofdmagazijn',
    quantityInStock: 25,
    reservedQuantity: 10,
    availableQuantity: 15,
    reorderPoint: 20,
    unit: 'doos',
    stockValue: 162.50,
  },
  {
    itemId: 'item-006',
    itemCode: 'GEBAK-001',
    itemDescription: 'Petit fours (per 20)',
    warehouse: 'Hoofdmagazijn',
    quantityInStock: 15,
    reservedQuantity: 5,
    availableQuantity: 10,
    reorderPoint: 10,
    unit: 'doos',
    stockValue: 210.00,
  },

  // Grondstoffen voorraad
  {
    itemId: 'item-012',
    itemCode: 'GROND-001',
    itemDescription: 'Tarwebloem (25kg)',
    warehouse: 'Hoofdmagazijn',
    quantityInStock: 45,
    reservedQuantity: 0,
    availableQuantity: 45,
    reorderPoint: 30,
    unit: 'zak',
    stockValue: 1440.00,
  },
  {
    itemId: 'item-013',
    itemCode: 'GROND-002',
    itemDescription: 'Volkorenmeel (25kg)',
    warehouse: 'Hoofdmagazijn',
    quantityInStock: 25,
    reservedQuantity: 0,
    availableQuantity: 25,
    reorderPoint: 15,
    unit: 'zak',
    stockValue: 700.00,
  },
  {
    itemId: 'item-014',
    itemCode: 'GROND-003',
    itemDescription: 'Roggemeel (25kg)',
    warehouse: 'Hoofdmagazijn',
    quantityInStock: 12,
    reservedQuantity: 0,
    availableQuantity: 12,
    reorderPoint: 10,
    unit: 'zak',
    stockValue: 312.00,
  },
  {
    itemId: 'item-015',
    itemCode: 'GROND-004',
    itemDescription: 'Gist (500g)',
    warehouse: 'Koeling',
    quantityInStock: 50,
    reservedQuantity: 0,
    availableQuantity: 50,
    reorderPoint: 30,
    unit: 'pak',
    stockValue: 300.00,
  },
  {
    itemId: 'item-016',
    itemCode: 'GROND-005',
    itemDescription: 'Suiker (25kg)',
    warehouse: 'Hoofdmagazijn',
    quantityInStock: 18,
    reservedQuantity: 0,
    availableQuantity: 18,
    reorderPoint: 10,
    unit: 'zak',
    stockValue: 396.00,
  },

  // Zuivel voorraad (koeling)
  {
    itemId: 'item-017',
    itemCode: 'ZUIVEL-001',
    itemDescription: 'Roomboter (10kg)',
    warehouse: 'Koeling',
    quantityInStock: 15,
    reservedQuantity: 5,
    availableQuantity: 10,
    reorderPoint: 10,
    unit: 'pak',
    stockValue: 675.00,
  },
  {
    itemId: 'item-018',
    itemCode: 'ZUIVEL-002',
    itemDescription: 'Slagroom (5L)',
    warehouse: 'Koeling',
    quantityInStock: 20,
    reservedQuantity: 0,
    availableQuantity: 20,
    reorderPoint: 15,
    unit: 'pak',
    stockValue: 300.00,
  },
  {
    itemId: 'item-019',
    itemCode: 'ZUIVEL-003',
    itemDescription: 'Volle melk (10L)',
    warehouse: 'Koeling',
    quantityInStock: 12,
    reservedQuantity: 0,
    availableQuantity: 12,
    reorderPoint: 10,
    unit: 'pak',
    stockValue: 180.00,
  },

  // Eieren
  {
    itemId: 'item-020',
    itemCode: 'EIEREN-001',
    itemDescription: 'Scharreleieren (tray 30)',
    warehouse: 'Koeling',
    quantityInStock: 35,
    reservedQuantity: 10,
    availableQuantity: 25,
    reorderPoint: 20,
    unit: 'tray',
    stockValue: 420.00,
  },

  // Verpakking
  {
    itemId: 'item-022',
    itemCode: 'VERPAK-001',
    itemDescription: 'Broodzakken (1000 st)',
    warehouse: 'Hoofdmagazijn',
    quantityInStock: 8,
    reservedQuantity: 0,
    availableQuantity: 8,
    reorderPoint: 5,
    unit: 'doos',
    stockValue: 200.00,
  },
  {
    itemId: 'item-023',
    itemCode: 'VERPAK-002',
    itemDescription: 'Taartdozen (100 st)',
    warehouse: 'Hoofdmagazijn',
    quantityInStock: 12,
    reservedQuantity: 0,
    availableQuantity: 12,
    reorderPoint: 8,
    unit: 'doos',
    stockValue: 216.00,
  },
];

/**
 * Get items with filters
 */
export function getItems(params: {
  type?: 'verkoop' | 'inkoop' | 'beide' | 'all';
  category?: string;
  isActive?: boolean;
}): DemoItem[] {
  const { type = 'all', category, isActive = true } = params;

  let items = DEMO_ITEMS;

  if (type !== 'all') {
    items = items.filter((i) => i.type === type || i.type === 'beide');
  }

  if (category) {
    items = items.filter((i) =>
      i.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  if (isActive !== undefined) {
    items = items.filter((i) => i.isActive === isActive);
  }

  return items;
}

/**
 * Get stock positions with filters
 */
export function getStockPositions(params: {
  warehouse?: string;
  belowReorderPoint?: boolean;
}): DemoStockPosition[] {
  const { warehouse, belowReorderPoint } = params;

  let positions = DEMO_STOCK_POSITIONS;

  if (warehouse) {
    positions = positions.filter((p) =>
      p.warehouse.toLowerCase().includes(warehouse.toLowerCase())
    );
  }

  if (belowReorderPoint) {
    positions = positions.filter((p) => p.availableQuantity <= p.reorderPoint);
  }

  return positions;
}

/**
 * Get total stock value
 */
export function getTotalStockValue(): number {
  return DEMO_STOCK_POSITIONS.reduce((sum, p) => sum + p.stockValue, 0);
}
