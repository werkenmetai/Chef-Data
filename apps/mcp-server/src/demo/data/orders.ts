/**
 * Demo Orders Data
 *
 * Sales orders, purchase orders, and quotations for the bakery.
 */

// Helper to create dates
function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Sales Order interface
 */
export interface DemoSalesOrder {
  id: string;
  orderNumber: number;
  customerId: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  status: 'open' | 'partial' | 'complete' | 'cancelled';
  amount: number;
  vatAmount: number;
  description: string;
  lines: {
    itemCode: string;
    itemDescription: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
}

/**
 * Purchase Order interface
 */
export interface DemoPurchaseOrder {
  id: string;
  orderNumber: number;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDate: string;
  status: 'open' | 'partial' | 'complete' | 'cancelled';
  amount: number;
  vatAmount: number;
  description: string;
  lines: {
    itemCode: string;
    itemDescription: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
}

/**
 * Quotation interface
 */
export interface DemoQuotation {
  id: string;
  quotationNumber: number;
  customerId: string;
  customerName: string;
  quotationDate: string;
  validUntil: string;
  status: 'open' | 'accepted' | 'rejected' | 'expired';
  amount: number;
  vatAmount: number;
  description: string;
  probability: number;
}

/**
 * Demo sales orders
 */
export const DEMO_SALES_ORDERS: DemoSalesOrder[] = [
  {
    id: 'so-001',
    orderNumber: 2024100,
    customerId: 'cust-001-hotel-krasnapolsky',
    customerName: 'Hotel Krasnapolsky',
    orderDate: daysAgo(2),
    deliveryDate: daysFromNow(1),
    status: 'open',
    amount: 2450.00,
    vatAmount: 220.50,
    description: 'Wekelijkse broodlevering - week 9',
    lines: [
      { itemCode: 'BROOD-001', itemDescription: 'Croissants (per 10)', quantity: 50, unitPrice: 15.00, lineTotal: 750 },
      { itemCode: 'BROOD-002', itemDescription: 'Volkoren brood', quantity: 100, unitPrice: 3.50, lineTotal: 350 },
      { itemCode: 'BROOD-003', itemDescription: 'Wit brood', quantity: 100, unitPrice: 3.00, lineTotal: 300 },
      { itemCode: 'GEBAK-001', itemDescription: 'Petit fours (per 20)', quantity: 30, unitPrice: 35.00, lineTotal: 1050 },
    ],
  },
  {
    id: 'so-002',
    orderNumber: 2024101,
    customerId: 'cust-005-hotel-pulitzer',
    customerName: 'Hotel Pulitzer Amsterdam',
    orderDate: daysAgo(1),
    deliveryDate: daysFromNow(2),
    status: 'open',
    amount: 3200.00,
    vatAmount: 288.00,
    description: 'Ontbijtservice februari',
    lines: [
      { itemCode: 'BROOD-001', itemDescription: 'Croissants (per 10)', quantity: 80, unitPrice: 15.00, lineTotal: 1200 },
      { itemCode: 'BROOD-004', itemDescription: 'Broodjes assortiment (per 10)', quantity: 60, unitPrice: 18.00, lineTotal: 1080 },
      { itemCode: 'GEBAK-002', itemDescription: 'Taartpunt (per stuk)', quantity: 100, unitPrice: 4.50, lineTotal: 450 },
      { itemCode: 'GEBAK-003', itemDescription: 'Muffins (per 6)', quantity: 30, unitPrice: 15.70, lineTotal: 470 },
    ],
  },
  {
    id: 'so-003',
    orderNumber: 2024102,
    customerId: 'cust-008-catering-amsterdam',
    customerName: 'Catering Service Amsterdam',
    orderDate: daysAgo(5),
    deliveryDate: daysAgo(2),
    status: 'complete',
    amount: 1850.00,
    vatAmount: 166.50,
    description: 'Bedrijfsevenement catering',
    lines: [
      { itemCode: 'BROOD-004', itemDescription: 'Broodjes assortiment (per 10)', quantity: 50, unitPrice: 18.00, lineTotal: 900 },
      { itemCode: 'GEBAK-004', itemDescription: 'Brownies (per 12)', quantity: 25, unitPrice: 24.00, lineTotal: 600 },
      { itemCode: 'GEBAK-001', itemDescription: 'Petit fours (per 20)', quantity: 10, unitPrice: 35.00, lineTotal: 350 },
    ],
  },
  {
    id: 'so-004',
    orderNumber: 2024103,
    customerId: 'cust-003-ah-centrum',
    customerName: 'Albert Heijn Centrum',
    orderDate: daysAgo(3),
    deliveryDate: daysFromNow(0),
    status: 'partial',
    amount: 1680.00,
    vatAmount: 151.20,
    description: 'Dagverse producten',
    lines: [
      { itemCode: 'BROOD-001', itemDescription: 'Croissants (per 10)', quantity: 40, unitPrice: 15.00, lineTotal: 600 },
      { itemCode: 'BROOD-002', itemDescription: 'Volkoren brood', quantity: 150, unitPrice: 3.50, lineTotal: 525 },
      { itemCode: 'BROOD-003', itemDescription: 'Wit brood', quantity: 150, unitPrice: 3.00, lineTotal: 450 },
      { itemCode: 'GEBAK-005', itemDescription: 'Appeltaart (heel)', quantity: 5, unitPrice: 21.00, lineTotal: 105 },
    ],
  },
  {
    id: 'so-005',
    orderNumber: 2024104,
    customerId: 'cust-007-kantoor-zuidas',
    customerName: 'Kantoorcomplex Zuidas',
    orderDate: daysAgo(7),
    deliveryDate: daysAgo(5),
    status: 'complete',
    amount: 980.00,
    vatAmount: 88.20,
    description: 'Meeting catering',
    lines: [
      { itemCode: 'BROOD-004', itemDescription: 'Broodjes assortiment (per 10)', quantity: 30, unitPrice: 18.00, lineTotal: 540 },
      { itemCode: 'GEBAK-003', itemDescription: 'Muffins (per 6)', quantity: 20, unitPrice: 15.70, lineTotal: 314 },
      { itemCode: 'GEBAK-006', itemDescription: 'Koekjes (per 20)', quantity: 10, unitPrice: 12.60, lineTotal: 126 },
    ],
  },
];

/**
 * Demo purchase orders
 */
export const DEMO_PURCHASE_ORDERS: DemoPurchaseOrder[] = [
  {
    id: 'po-001',
    orderNumber: 5000100,
    supplierId: 'supp-001-meelgroothandel',
    supplierName: 'Meelgroothandel Van der Molen',
    orderDate: daysAgo(3),
    expectedDate: daysFromNow(2),
    status: 'open',
    amount: 3200.00,
    vatAmount: 288.00,
    description: 'Bloem en meelproducten februari',
    lines: [
      { itemCode: 'GROND-001', itemDescription: 'Tarwebloem (25kg)', quantity: 50, unitPrice: 32.00, lineTotal: 1600 },
      { itemCode: 'GROND-002', itemDescription: 'Volkorenmeel (25kg)', quantity: 30, unitPrice: 28.00, lineTotal: 840 },
      { itemCode: 'GROND-003', itemDescription: 'Roggemeel (25kg)', quantity: 20, unitPrice: 26.00, lineTotal: 520 },
      { itemCode: 'GROND-004', itemDescription: 'Gist (500g)', quantity: 40, unitPrice: 6.00, lineTotal: 240 },
    ],
  },
  {
    id: 'po-002',
    orderNumber: 5000101,
    supplierId: 'supp-002-zuivelfabriek',
    supplierName: 'Zuivelfabriek De Koe',
    orderDate: daysAgo(2),
    expectedDate: daysFromNow(1),
    status: 'open',
    amount: 1650.00,
    vatAmount: 148.50,
    description: 'Zuivelproducten week 9',
    lines: [
      { itemCode: 'ZUIVEL-001', itemDescription: 'Roomboter (10kg)', quantity: 20, unitPrice: 45.00, lineTotal: 900 },
      { itemCode: 'ZUIVEL-002', itemDescription: 'Slagroom (5L)', quantity: 30, unitPrice: 15.00, lineTotal: 450 },
      { itemCode: 'ZUIVEL-003', itemDescription: 'Volle melk (10L)', quantity: 20, unitPrice: 15.00, lineTotal: 300 },
    ],
  },
  {
    id: 'po-003',
    orderNumber: 5000102,
    supplierId: 'supp-006-eieren',
    supplierName: 'Eiergroothandel Hendriks',
    orderDate: daysAgo(5),
    expectedDate: daysAgo(2),
    status: 'complete',
    amount: 850.00,
    vatAmount: 76.50,
    description: 'Eieren februari',
    lines: [
      { itemCode: 'EIEREN-001', itemDescription: 'Scharreleieren (tray 30)', quantity: 50, unitPrice: 12.00, lineTotal: 600 },
      { itemCode: 'EIEREN-002', itemDescription: 'Biologische eieren (tray 30)', quantity: 10, unitPrice: 25.00, lineTotal: 250 },
    ],
  },
  {
    id: 'po-004',
    orderNumber: 5000103,
    supplierId: 'supp-004-verpakking',
    supplierName: 'Verpakkingscentrale Nederland',
    orderDate: daysAgo(10),
    expectedDate: daysAgo(5),
    status: 'complete',
    amount: 620.00,
    vatAmount: 130.20,
    description: 'Verpakkingsmaterialen Q1',
    lines: [
      { itemCode: 'VERPAK-001', itemDescription: 'Broodzakken (1000 st)', quantity: 10, unitPrice: 25.00, lineTotal: 250 },
      { itemCode: 'VERPAK-002', itemDescription: 'Taartdozen (100 st)', quantity: 15, unitPrice: 18.00, lineTotal: 270 },
      { itemCode: 'VERPAK-003', itemDescription: 'Etiketten (rol 1000)', quantity: 10, unitPrice: 10.00, lineTotal: 100 },
    ],
  },
];

/**
 * Demo quotations
 */
export const DEMO_QUOTATIONS: DemoQuotation[] = [
  {
    id: 'quot-001',
    quotationNumber: 2024200,
    customerId: 'cust-013-prospect-hotel',
    customerName: 'NH Hotel Schiphol',
    quotationDate: daysAgo(5),
    validUntil: daysFromNow(25),
    status: 'open',
    amount: 4500.00,
    vatAmount: 405.00,
    description: 'Ontbijtservice contract - jaaraanbod',
    probability: 60,
  },
  {
    id: 'quot-002',
    quotationNumber: 2024201,
    customerId: 'cust-007-kantoor-zuidas',
    customerName: 'Kantoorcomplex Zuidas',
    quotationDate: daysAgo(10),
    validUntil: daysFromNow(20),
    status: 'open',
    amount: 2800.00,
    vatAmount: 252.00,
    description: 'Cateringcontract Q2-Q4 2024',
    probability: 75,
  },
  {
    id: 'quot-003',
    quotationNumber: 2024202,
    customerId: 'cust-002-restaurant-vier-pilaren',
    customerName: 'Restaurant De Vier Pilaren',
    quotationDate: daysAgo(15),
    validUntil: daysAgo(1),
    status: 'expired',
    amount: 1200.00,
    vatAmount: 108.00,
    description: 'Uitbreiding broodleveranties',
    probability: 40,
  },
  {
    id: 'quot-004',
    quotationNumber: 2024203,
    customerId: 'cust-001-hotel-krasnapolsky',
    customerName: 'Hotel Krasnapolsky',
    quotationDate: daysAgo(20),
    validUntil: daysAgo(5),
    status: 'accepted',
    amount: 5200.00,
    vatAmount: 468.00,
    description: 'Evenementcatering Valentijnsdag',
    probability: 100,
  },
];

/**
 * Get sales orders with filters
 */
export function getSalesOrders(params: {
  status?: 'open' | 'complete' | 'all';
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}): DemoSalesOrder[] {
  const { status = 'all', customerId, fromDate, toDate } = params;

  let orders = DEMO_SALES_ORDERS;

  if (status === 'open') {
    orders = orders.filter((o) => o.status === 'open' || o.status === 'partial');
  } else if (status === 'complete') {
    orders = orders.filter((o) => o.status === 'complete');
  }

  if (customerId) {
    orders = orders.filter((o) => o.customerId === customerId);
  }

  if (fromDate) {
    orders = orders.filter((o) => o.orderDate >= fromDate);
  }
  if (toDate) {
    orders = orders.filter((o) => o.orderDate <= toDate);
  }

  return orders;
}

/**
 * Get purchase orders with filters
 */
export function getPurchaseOrders(params: {
  status?: 'open' | 'complete' | 'all';
  supplierId?: string;
  fromDate?: string;
  toDate?: string;
}): DemoPurchaseOrder[] {
  const { status = 'all', supplierId, fromDate, toDate } = params;

  let orders = DEMO_PURCHASE_ORDERS;

  if (status === 'open') {
    orders = orders.filter((o) => o.status === 'open' || o.status === 'partial');
  } else if (status === 'complete') {
    orders = orders.filter((o) => o.status === 'complete');
  }

  if (supplierId) {
    orders = orders.filter((o) => o.supplierId === supplierId);
  }

  if (fromDate) {
    orders = orders.filter((o) => o.orderDate >= fromDate);
  }
  if (toDate) {
    orders = orders.filter((o) => o.orderDate <= toDate);
  }

  return orders;
}

/**
 * Get quotations with filters
 */
export function getQuotations(params: {
  status?: 'open' | 'accepted' | 'rejected' | 'all';
  customerId?: string;
}): DemoQuotation[] {
  const { status = 'all', customerId } = params;

  let quotes = DEMO_QUOTATIONS;

  if (status !== 'all') {
    quotes = quotes.filter((q) => q.status === status);
  }

  if (customerId) {
    quotes = quotes.filter((q) => q.customerId === customerId);
  }

  return quotes;
}
