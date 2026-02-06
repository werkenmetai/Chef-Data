/**
 * Demo Invoice Data - Multi-Industry Support
 *
 * Generates realistic invoices based on current demo industry.
 * Each industry has appropriate customers, suppliers, and descriptions.
 *
 * IMPORTANT: All data is generated dynamically to ensure dates are always relative to "today".
 */

import { getCurrentIndustryConfig, DemoIndustry } from '../context';

export interface DemoSalesInvoice {
  id: string;
  invoiceNumber: number;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  amount: number;
  vatAmount: number;
  outstandingAmount: number;
  status: 'paid' | 'open' | 'overdue';
  description: string;
  paymentTerms: string;
}

export interface DemoPurchaseInvoice {
  id: string;
  entryNumber: number;
  supplierId: string;
  supplierName: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  amount: number;
  vatAmount: number;
  outstandingAmount: number;
  status: 'paid' | 'open' | 'overdue';
  description: string;
}

// Helper to create dates relative to today
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

interface InvoiceTemplate {
  id: string;
  invoiceNumber: number;
  partyId: string;
  partyName: string;
  invoiceDaysAgo: number;
  dueDaysAgo: number;
  amount: number;
  vatAmount: number;
  outstandingAmount: number;
  description: string;
  paymentTerms?: string;
}

// ============================================
// BAKKERIJ INVOICES
// ============================================

const BAKKERIJ_SALES: InvoiceTemplate[] = [
  // Paid (60%)
  { id: 'sinv-001', invoiceNumber: 2024001, partyId: 'cust-001-hotel-krasnapolsky', partyName: 'Hotel Krasnapolsky', invoiceDaysAgo: 45, dueDaysAgo: 15, amount: 6850.00, vatAmount: 1260.41, outstandingAmount: 0, description: 'Broodleveranties januari week 1-2', paymentTerms: '30 dagen netto' },
  { id: 'sinv-002', invoiceNumber: 2024002, partyId: 'cust-002-restaurant-vier-pilaren', partyName: 'Restaurant De Vier Pilaren', invoiceDaysAgo: 42, dueDaysAgo: 12, amount: 2450.00, vatAmount: 450.83, outstandingAmount: 0, description: 'Broodjes en gebak voor lunch service', paymentTerms: '30 dagen netto' },
  { id: 'sinv-003', invoiceNumber: 2024003, partyId: 'cust-003-ah-centrum', partyName: 'Albert Heijn Centrum', invoiceDaysAgo: 40, dueDaysAgo: 10, amount: 4680.00, vatAmount: 861.16, outstandingAmount: 0, description: 'Verse croissants en brood - week 3', paymentTerms: '30 dagen netto' },
  { id: 'sinv-004', invoiceNumber: 2024004, partyId: 'cust-004-hotel-pulitzer', partyName: 'Hotel Pulitzer Amsterdam', invoiceDaysAgo: 38, dueDaysAgo: 8, amount: 8900.00, vatAmount: 1637.57, outstandingAmount: 0, description: 'Ontbijtservice brood en gebak', paymentTerms: '30 dagen netto' },
  { id: 'sinv-005', invoiceNumber: 2024005, partyId: 'cust-005-kantoor-zuidas', partyName: 'Kantoorcomplex Zuidas', invoiceDaysAgo: 35, dueDaysAgo: 5, amount: 5270.00, vatAmount: 969.67, outstandingAmount: 0, description: 'Catering meeting rooms', paymentTerms: '30 dagen netto' },
  { id: 'sinv-006', invoiceNumber: 2024006, partyId: 'cust-006-spar-jordaan', partyName: 'SPAR Jordaan', invoiceDaysAgo: 33, dueDaysAgo: 3, amount: 2730.00, vatAmount: 502.31, outstandingAmount: 0, description: 'Verse broden en croissants', paymentTerms: '30 dagen netto' },
  // Open (25%)
  { id: 'sinv-007', invoiceNumber: 2024007, partyId: 'cust-001-hotel-krasnapolsky', partyName: 'Hotel Krasnapolsky', invoiceDaysAgo: 15, dueDaysAgo: -15, amount: 8060.00, vatAmount: 1483.06, outstandingAmount: 8060.00, description: 'Broodleveranties februari week 1-2', paymentTerms: '30 dagen netto' },
  { id: 'sinv-008', invoiceNumber: 2024008, partyId: 'cust-004-hotel-pulitzer', partyName: 'Hotel Pulitzer Amsterdam', invoiceDaysAgo: 12, dueDaysAgo: -18, amount: 8650.00, vatAmount: 1591.49, outstandingAmount: 8650.00, description: 'Ontbijt service februari', paymentTerms: '30 dagen netto' },
  { id: 'sinv-009', invoiceNumber: 2024009, partyId: 'cust-003-ah-centrum', partyName: 'Albert Heijn Centrum', invoiceDaysAgo: 8, dueDaysAgo: -22, amount: 4795.00, vatAmount: 882.27, outstandingAmount: 4795.00, description: 'Verse producten week 7', paymentTerms: '30 dagen netto' },
  // Overdue (15%)
  { id: 'sinv-010', invoiceNumber: 2024010, partyId: 'cust-002-restaurant-vier-pilaren', partyName: 'Restaurant De Vier Pilaren', invoiceDaysAgo: 50, dueDaysAgo: 20, amount: 3485.00, vatAmount: 641.15, outstandingAmount: 3485.00, description: 'Broodleveranties november - achterstallig', paymentTerms: '30 dagen netto' },
];

const BAKKERIJ_PURCHASES: InvoiceTemplate[] = [
  // Paid
  { id: 'pinv-001', invoiceNumber: 500001, partyId: 'supp-001-meelgroothandel', partyName: 'Meelgroothandel Van der Molen', invoiceDaysAgo: 45, dueDaysAgo: 15, amount: 8920.00, vatAmount: 1873.20, outstandingAmount: 0, description: 'Bloem en meelproducten januari' },
  { id: 'pinv-002', invoiceNumber: 500002, partyId: 'supp-002-zuivelfabriek', partyName: 'Zuivelfabriek De Koe', invoiceDaysAgo: 42, dueDaysAgo: 12, amount: 5160.00, vatAmount: 1083.60, outstandingAmount: 0, description: 'Boter, melk en room januari' },
  { id: 'pinv-003', invoiceNumber: 500003, partyId: 'supp-004-vastgoed', partyName: 'Vastgoed Centrum Amsterdam', invoiceDaysAgo: 35, dueDaysAgo: 5, amount: 6000.00, vatAmount: 1260.00, outstandingAmount: 0, description: 'Huur bedrijfspand januari' },
  { id: 'pinv-004', invoiceNumber: 500004, partyId: 'supp-003-vattenfall', partyName: 'Vattenfall Energie', invoiceDaysAgo: 33, dueDaysAgo: 3, amount: 3450.00, vatAmount: 724.50, outstandingAmount: 0, description: 'Elektriciteit en gas december' },
  // Open
  { id: 'pinv-005', invoiceNumber: 500005, partyId: 'supp-001-meelgroothandel', partyName: 'Meelgroothandel Van der Molen', invoiceDaysAgo: 12, dueDaysAgo: -18, amount: 9625.00, vatAmount: 2021.25, outstandingAmount: 9625.00, description: 'Bloem en meelproducten februari' },
  { id: 'pinv-006', invoiceNumber: 500006, partyId: 'supp-004-vastgoed', partyName: 'Vastgoed Centrum Amsterdam', invoiceDaysAgo: 5, dueDaysAgo: -25, amount: 6000.00, vatAmount: 1260.00, outstandingAmount: 6000.00, description: 'Huur bedrijfspand februari' },
  // Overdue
  { id: 'pinv-007', invoiceNumber: 500007, partyId: 'supp-003-vattenfall', partyName: 'Vattenfall Energie', invoiceDaysAgo: 50, dueDaysAgo: 20, amount: 3125.00, vatAmount: 656.25, outstandingAmount: 3125.00, description: 'Energie januari - narekening' },
];

// ============================================
// IT CONSULTANCY INVOICES
// ============================================

const IT_SALES: InvoiceTemplate[] = [
  // Paid (60%)
  { id: 'sinv-001', invoiceNumber: 2024001, partyId: 'it-cust-001-abn-amro', partyName: 'ABN AMRO Bank N.V.', invoiceDaysAgo: 45, dueDaysAgo: 15, amount: 48500.00, vatAmount: 10185.00, outstandingAmount: 0, description: 'Consultancy uren januari - Cloud migratie project', paymentTerms: '30 dagen netto' },
  { id: 'sinv-002', invoiceNumber: 2024002, partyId: 'it-cust-002-philips', partyName: 'Philips Nederland B.V.', invoiceDaysAgo: 42, dueDaysAgo: 12, amount: 32800.00, vatAmount: 6888.00, outstandingAmount: 0, description: 'Software development sprint 12-14', paymentTerms: '30 dagen netto' },
  { id: 'sinv-003', invoiceNumber: 2024003, partyId: 'it-cust-003-gemeente-utrecht', partyName: 'Gemeente Utrecht', invoiceDaysAgo: 40, dueDaysAgo: 10, amount: 24600.00, vatAmount: 5166.00, outstandingAmount: 0, description: 'Security audit en rapportage', paymentTerms: '30 dagen netto' },
  { id: 'sinv-004', invoiceNumber: 2024004, partyId: 'it-cust-004-fintech-innovators', partyName: 'FinTech Innovators B.V.', invoiceDaysAgo: 38, dueDaysAgo: 8, amount: 18500.00, vatAmount: 3885.00, outstandingAmount: 0, description: 'API integratie development', paymentTerms: '30 dagen netto' },
  { id: 'sinv-005', invoiceNumber: 2024005, partyId: 'it-cust-005-logistiek-noord', partyName: 'Logistiek Bedrijf Noord B.V.', invoiceDaysAgo: 35, dueDaysAgo: 5, amount: 15200.00, vatAmount: 3192.00, outstandingAmount: 0, description: 'Support & maintenance Q4', paymentTerms: '30 dagen netto' },
  { id: 'sinv-006', invoiceNumber: 2024006, partyId: 'it-cust-001-abn-amro', partyName: 'ABN AMRO Bank N.V.', invoiceDaysAgo: 33, dueDaysAgo: 3, amount: 52000.00, vatAmount: 10920.00, outstandingAmount: 0, description: 'Consultancy uren december', paymentTerms: '30 dagen netto' },
  // Open (25%)
  { id: 'sinv-007', invoiceNumber: 2024007, partyId: 'it-cust-002-philips', partyName: 'Philips Nederland B.V.', invoiceDaysAgo: 15, dueDaysAgo: -15, amount: 38400.00, vatAmount: 8064.00, outstandingAmount: 38400.00, description: 'Development sprint 15-17', paymentTerms: '30 dagen netto' },
  { id: 'sinv-008', invoiceNumber: 2024008, partyId: 'it-cust-003-gemeente-utrecht', partyName: 'Gemeente Utrecht', invoiceDaysAgo: 12, dueDaysAgo: -18, amount: 28500.00, vatAmount: 5985.00, outstandingAmount: 28500.00, description: 'Training workshop Azure februari', paymentTerms: '30 dagen netto' },
  { id: 'sinv-009', invoiceNumber: 2024009, partyId: 'it-cust-004-fintech-innovators', partyName: 'FinTech Innovators B.V.', invoiceDaysAgo: 8, dueDaysAgo: -22, amount: 21500.00, vatAmount: 4515.00, outstandingAmount: 21500.00, description: 'Doorontwikkeling platform', paymentTerms: '30 dagen netto' },
  // Overdue (15%)
  { id: 'sinv-010', invoiceNumber: 2024010, partyId: 'it-cust-005-logistiek-noord', partyName: 'Logistiek Bedrijf Noord B.V.', invoiceDaysAgo: 55, dueDaysAgo: 25, amount: 18700.00, vatAmount: 3927.00, outstandingAmount: 18700.00, description: 'Project uitloop november - achterstallig', paymentTerms: '30 dagen netto' },
];

const IT_PURCHASES: InvoiceTemplate[] = [
  // Paid
  { id: 'pinv-001', invoiceNumber: 500001, partyId: 'it-supp-001-microsoft', partyName: 'Microsoft Nederland B.V.', invoiceDaysAgo: 45, dueDaysAgo: 15, amount: 12500.00, vatAmount: 2625.00, outstandingAmount: 0, description: 'Azure cloud services januari' },
  { id: 'pinv-002', invoiceNumber: 500002, partyId: 'it-supp-002-jetbrains', partyName: 'JetBrains s.r.o.', invoiceDaysAgo: 42, dueDaysAgo: 12, amount: 4800.00, vatAmount: 1008.00, outstandingAmount: 0, description: 'IDE licenties 2024' },
  { id: 'pinv-003', invoiceNumber: 500003, partyId: 'it-supp-003-regus', partyName: 'Regus Business Centre', invoiceDaysAgo: 35, dueDaysAgo: 5, amount: 8500.00, vatAmount: 1785.00, outstandingAmount: 0, description: 'Kantoorhuur januari' },
  // Open
  { id: 'pinv-004', invoiceNumber: 500004, partyId: 'it-supp-001-microsoft', partyName: 'Microsoft Nederland B.V.', invoiceDaysAgo: 12, dueDaysAgo: -18, amount: 14200.00, vatAmount: 2982.00, outstandingAmount: 14200.00, description: 'Azure cloud services februari' },
  { id: 'pinv-005', invoiceNumber: 500005, partyId: 'it-supp-003-regus', partyName: 'Regus Business Centre', invoiceDaysAgo: 5, dueDaysAgo: -25, amount: 8500.00, vatAmount: 1785.00, outstandingAmount: 8500.00, description: 'Kantoorhuur februari' },
  // Overdue
  { id: 'pinv-006', invoiceNumber: 500006, partyId: 'it-supp-001-microsoft', partyName: 'Microsoft Nederland B.V.', invoiceDaysAgo: 50, dueDaysAgo: 20, amount: 3800.00, vatAmount: 798.00, outstandingAmount: 3800.00, description: 'Extra licenties december - nabetaling' },
];

// ============================================
// ADVOCAAT INVOICES
// ============================================

const ADVOCAAT_SALES: InvoiceTemplate[] = [
  // Paid (60%)
  { id: 'sinv-001', invoiceNumber: 2024001, partyId: 'adv-cust-001-heineken', partyName: 'Heineken N.V.', invoiceDaysAgo: 45, dueDaysAgo: 15, amount: 68500.00, vatAmount: 14385.00, outstandingAmount: 0, description: 'Juridisch advies overname januari', paymentTerms: '30 dagen netto' },
  { id: 'sinv-002', invoiceNumber: 2024002, partyId: 'adv-cust-002-postnl', partyName: 'PostNL N.V.', invoiceDaysAgo: 42, dueDaysAgo: 12, amount: 42800.00, vatAmount: 8988.00, outstandingAmount: 0, description: 'Arbeidsrechtelijke procedure', paymentTerms: '30 dagen netto' },
  { id: 'sinv-003', invoiceNumber: 2024003, partyId: 'adv-cust-003-transport-jansen', partyName: 'Transport Jansen B.V.', invoiceDaysAgo: 40, dueDaysAgo: 10, amount: 12600.00, vatAmount: 2646.00, outstandingAmount: 0, description: 'Contracten review transportovereenkomsten', paymentTerms: '30 dagen netto' },
  { id: 'sinv-004', invoiceNumber: 2024004, partyId: 'adv-cust-004-visser', partyName: 'De heer J. Visser', invoiceDaysAgo: 38, dueDaysAgo: 8, amount: 4850.00, vatAmount: 1018.50, outstandingAmount: 0, description: 'Ontslagprocedure begeleiding', paymentTerms: '14 dagen netto' },
  { id: 'sinv-005', invoiceNumber: 2024005, partyId: 'adv-cust-005-gemeente-den-haag', partyName: 'Gemeente Den Haag', invoiceDaysAgo: 35, dueDaysAgo: 5, amount: 35200.00, vatAmount: 7392.00, outstandingAmount: 0, description: 'Advisering bestemmingsplan', paymentTerms: '30 dagen netto' },
  { id: 'sinv-006', invoiceNumber: 2024006, partyId: 'adv-cust-001-heineken', partyName: 'Heineken N.V.', invoiceDaysAgo: 33, dueDaysAgo: 3, amount: 58000.00, vatAmount: 12180.00, outstandingAmount: 0, description: 'Due diligence onderzoek december', paymentTerms: '30 dagen netto' },
  // Open (25%)
  { id: 'sinv-007', invoiceNumber: 2024007, partyId: 'adv-cust-002-postnl', partyName: 'PostNL N.V.', invoiceDaysAgo: 15, dueDaysAgo: -15, amount: 48500.00, vatAmount: 10185.00, outstandingAmount: 48500.00, description: 'Procesvoering rechtbank februari', paymentTerms: '30 dagen netto' },
  { id: 'sinv-008', invoiceNumber: 2024008, partyId: 'adv-cust-003-transport-jansen', partyName: 'Transport Jansen B.V.', invoiceDaysAgo: 12, dueDaysAgo: -18, amount: 15800.00, vatAmount: 3318.00, outstandingAmount: 15800.00, description: 'Juridisch advies expansie', paymentTerms: '30 dagen netto' },
  { id: 'sinv-009', invoiceNumber: 2024009, partyId: 'adv-cust-005-gemeente-den-haag', partyName: 'Gemeente Den Haag', invoiceDaysAgo: 8, dueDaysAgo: -22, amount: 28500.00, vatAmount: 5985.00, outstandingAmount: 28500.00, description: 'Bezwaarprocedure begeleiding', paymentTerms: '30 dagen netto' },
  // Overdue (15%)
  { id: 'sinv-010', invoiceNumber: 2024010, partyId: 'adv-cust-004-visser', partyName: 'De heer J. Visser', invoiceDaysAgo: 55, dueDaysAgo: 25, amount: 3250.00, vatAmount: 682.50, outstandingAmount: 3250.00, description: 'Restant honorarium november', paymentTerms: '14 dagen netto' },
];

const ADVOCAAT_PURCHASES: InvoiceTemplate[] = [
  // Paid
  { id: 'pinv-001', invoiceNumber: 500001, partyId: 'adv-supp-001-wolters-kluwer', partyName: 'Wolters Kluwer Nederland B.V.', invoiceDaysAgo: 45, dueDaysAgo: 15, amount: 2850.00, vatAmount: 598.50, outstandingAmount: 0, description: 'Juridische databanken januari' },
  { id: 'pinv-002', invoiceNumber: 500002, partyId: 'adv-supp-002-regus-denhaag', partyName: 'Regus Den Haag Parkstraat', invoiceDaysAgo: 35, dueDaysAgo: 5, amount: 12500.00, vatAmount: 2625.00, outstandingAmount: 0, description: 'Kantoorhuur januari' },
  { id: 'pinv-003', invoiceNumber: 500003, partyId: 'adv-supp-003-nova', partyName: 'Nederlandse Orde van Advocaten', invoiceDaysAgo: 40, dueDaysAgo: 10, amount: 8400.00, vatAmount: 0, outstandingAmount: 0, description: 'NOvA contributie 2024' },
  // Open
  { id: 'pinv-004', invoiceNumber: 500004, partyId: 'adv-supp-001-wolters-kluwer', partyName: 'Wolters Kluwer Nederland B.V.', invoiceDaysAgo: 12, dueDaysAgo: -18, amount: 2850.00, vatAmount: 598.50, outstandingAmount: 2850.00, description: 'Juridische databanken februari' },
  { id: 'pinv-005', invoiceNumber: 500005, partyId: 'adv-supp-002-regus-denhaag', partyName: 'Regus Den Haag Parkstraat', invoiceDaysAgo: 5, dueDaysAgo: -25, amount: 12500.00, vatAmount: 2625.00, outstandingAmount: 12500.00, description: 'Kantoorhuur februari' },
  // Overdue
  { id: 'pinv-006', invoiceNumber: 500006, partyId: 'adv-supp-001-wolters-kluwer', partyName: 'Wolters Kluwer Nederland B.V.', invoiceDaysAgo: 50, dueDaysAgo: 20, amount: 1850.00, vatAmount: 388.50, outstandingAmount: 1850.00, description: 'Extra modules december' },
];

// ============================================
// AANNEMER INVOICES
// ============================================

const AANNEMER_SALES: InvoiceTemplate[] = [
  // Paid (60%)
  { id: 'sinv-001', invoiceNumber: 2024001, partyId: 'aan-cust-001-am-vastgoed', partyName: 'AM Vastgoed B.V.', invoiceDaysAgo: 45, dueDaysAgo: 15, amount: 185000.00, vatAmount: 38850.00, outstandingAmount: 0, description: 'Termijn 3 - Nieuwbouwproject Alexanderpolder', paymentTerms: '30 dagen netto' },
  { id: 'sinv-002', invoiceNumber: 2024002, partyId: 'aan-cust-002-woonstad', partyName: 'Woonstad Rotterdam', invoiceDaysAgo: 42, dueDaysAgo: 12, amount: 78500.00, vatAmount: 16485.00, outstandingAmount: 0, description: 'Renovatie complex Kralingen fase 2', paymentTerms: '30 dagen netto' },
  { id: 'sinv-003', invoiceNumber: 2024003, partyId: 'aan-cust-003-pietersen', partyName: 'Familie Pietersen', invoiceDaysAgo: 40, dueDaysAgo: 10, amount: 42000.00, vatAmount: 8820.00, outstandingAmount: 0, description: 'Aanbouw woning - eindafrekening', paymentTerms: '14 dagen netto' },
  { id: 'sinv-004', invoiceNumber: 2024004, partyId: 'aan-cust-004-supermarkt', partyName: 'Supermarkt Keten Zuid B.V.', invoiceDaysAgo: 38, dueDaysAgo: 8, amount: 125000.00, vatAmount: 26250.00, outstandingAmount: 0, description: 'Verbouwing filiaal Hillegersberg', paymentTerms: '30 dagen netto' },
  { id: 'sinv-005', invoiceNumber: 2024005, partyId: 'aan-cust-005-havensteder', partyName: 'Havensteder', invoiceDaysAgo: 35, dueDaysAgo: 5, amount: 95000.00, vatAmount: 19950.00, outstandingAmount: 0, description: 'Onderhoudscontract Q4 2023', paymentTerms: '30 dagen netto' },
  { id: 'sinv-006', invoiceNumber: 2024006, partyId: 'aan-cust-001-am-vastgoed', partyName: 'AM Vastgoed B.V.', invoiceDaysAgo: 33, dueDaysAgo: 3, amount: 165000.00, vatAmount: 34650.00, outstandingAmount: 0, description: 'Termijn 4 - Nieuwbouwproject Alexanderpolder', paymentTerms: '30 dagen netto' },
  // Open (25%)
  { id: 'sinv-007', invoiceNumber: 2024007, partyId: 'aan-cust-002-woonstad', partyName: 'Woonstad Rotterdam', invoiceDaysAgo: 15, dueDaysAgo: -15, amount: 92000.00, vatAmount: 19320.00, outstandingAmount: 92000.00, description: 'Renovatie complex Kralingen fase 3', paymentTerms: '30 dagen netto' },
  { id: 'sinv-008', invoiceNumber: 2024008, partyId: 'aan-cust-005-havensteder', partyName: 'Havensteder', invoiceDaysAgo: 12, dueDaysAgo: -18, amount: 85000.00, vatAmount: 17850.00, outstandingAmount: 85000.00, description: 'Onderhoudscontract Q1 2024', paymentTerms: '30 dagen netto' },
  { id: 'sinv-009', invoiceNumber: 2024009, partyId: 'aan-cust-004-supermarkt', partyName: 'Supermarkt Keten Zuid B.V.', invoiceDaysAgo: 8, dueDaysAgo: -22, amount: 45000.00, vatAmount: 9450.00, outstandingAmount: 45000.00, description: 'Meerwerk verbouwing', paymentTerms: '30 dagen netto' },
  // Overdue (15%)
  { id: 'sinv-010', invoiceNumber: 2024010, partyId: 'aan-cust-003-pietersen', partyName: 'Familie Pietersen', invoiceDaysAgo: 55, dueDaysAgo: 25, amount: 8500.00, vatAmount: 1785.00, outstandingAmount: 8500.00, description: 'Meerwerk aanbouw - achterstallig', paymentTerms: '14 dagen netto' },
];

const AANNEMER_PURCHASES: InvoiceTemplate[] = [
  // Paid
  { id: 'pinv-001', invoiceNumber: 500001, partyId: 'aan-supp-001-bouwmaat', partyName: 'Bouwmaat Rotterdam', invoiceDaysAgo: 45, dueDaysAgo: 15, amount: 48500.00, vatAmount: 10185.00, outstandingAmount: 0, description: 'Bouwmaterialen project Alexanderpolder' },
  { id: 'pinv-002', invoiceNumber: 500002, partyId: 'aan-supp-002-boels', partyName: 'Boels Verhuur B.V.', invoiceDaysAgo: 42, dueDaysAgo: 12, amount: 12800.00, vatAmount: 2688.00, outstandingAmount: 0, description: 'Machinehuur januari' },
  { id: 'pinv-003', invoiceNumber: 500003, partyId: 'aan-supp-003-elektra', partyName: 'Elektra Installaties Rotterdam', invoiceDaysAgo: 35, dueDaysAgo: 5, amount: 28500.00, vatAmount: 5985.00, outstandingAmount: 0, description: 'Elektra werkzaamheden complex Kralingen' },
  { id: 'pinv-004', invoiceNumber: 500004, partyId: 'aan-supp-004-containerdienst', partyName: 'Containerdienst Rotterdam', invoiceDaysAgo: 38, dueDaysAgo: 8, amount: 4850.00, vatAmount: 1018.50, outstandingAmount: 0, description: 'Containerafvoer januari' },
  // Open
  { id: 'pinv-005', invoiceNumber: 500005, partyId: 'aan-supp-001-bouwmaat', partyName: 'Bouwmaat Rotterdam', invoiceDaysAgo: 12, dueDaysAgo: -18, amount: 52000.00, vatAmount: 10920.00, outstandingAmount: 52000.00, description: 'Bouwmaterialen februari' },
  { id: 'pinv-006', invoiceNumber: 500006, partyId: 'aan-supp-002-boels', partyName: 'Boels Verhuur B.V.', invoiceDaysAgo: 5, dueDaysAgo: -25, amount: 15200.00, vatAmount: 3192.00, outstandingAmount: 15200.00, description: 'Machinehuur februari' },
  // Overdue
  { id: 'pinv-007', invoiceNumber: 500007, partyId: 'aan-supp-003-elektra', partyName: 'Elektra Installaties Rotterdam', invoiceDaysAgo: 50, dueDaysAgo: 20, amount: 18500.00, vatAmount: 3885.00, outstandingAmount: 18500.00, description: 'Meerwerk elektra december' },
];

// ============================================
// INDUSTRY DATA MAP
// ============================================

const INDUSTRY_INVOICES: Record<DemoIndustry, { sales: InvoiceTemplate[]; purchases: InvoiceTemplate[] }> = {
  bakkerij: { sales: BAKKERIJ_SALES, purchases: BAKKERIJ_PURCHASES },
  it: { sales: IT_SALES, purchases: IT_PURCHASES },
  advocaat: { sales: ADVOCAAT_SALES, purchases: ADVOCAAT_PURCHASES },
  aannemer: { sales: AANNEMER_SALES, purchases: AANNEMER_PURCHASES },
};

// ============================================
// PUBLIC API
// ============================================

function generateSalesInvoices(): DemoSalesInvoice[] {
  const config = getCurrentIndustryConfig();
  const templates = INDUSTRY_INVOICES[config.company.industry].sales;

  return templates.map((t) => ({
    id: t.id,
    invoiceNumber: t.invoiceNumber,
    customerId: t.partyId,
    customerName: t.partyName,
    invoiceDate: daysAgo(t.invoiceDaysAgo),
    dueDate: t.dueDaysAgo >= 0 ? daysAgo(t.dueDaysAgo) : daysFromNow(-t.dueDaysAgo),
    currency: 'EUR',
    amount: t.amount,
    vatAmount: t.vatAmount,
    outstandingAmount: t.outstandingAmount,
    status: t.outstandingAmount === 0 ? 'paid' : (t.dueDaysAgo > 0 ? 'overdue' : 'open'),
    description: t.description,
    paymentTerms: t.paymentTerms || '30 dagen netto',
  }));
}

function generatePurchaseInvoices(): DemoPurchaseInvoice[] {
  const config = getCurrentIndustryConfig();
  const templates = INDUSTRY_INVOICES[config.company.industry].purchases;

  return templates.map((t) => ({
    id: t.id,
    entryNumber: t.invoiceNumber,
    supplierId: t.partyId,
    supplierName: t.partyName,
    invoiceDate: daysAgo(t.invoiceDaysAgo),
    dueDate: t.dueDaysAgo >= 0 ? daysAgo(t.dueDaysAgo) : daysFromNow(-t.dueDaysAgo),
    currency: 'EUR',
    amount: t.amount,
    vatAmount: t.vatAmount,
    outstandingAmount: t.outstandingAmount,
    status: t.outstandingAmount === 0 ? 'paid' : (t.dueDaysAgo > 0 ? 'overdue' : 'open'),
    description: t.description,
  }));
}

export function getSalesInvoices(params: {
  status?: 'open' | 'paid' | 'all';
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): DemoSalesInvoice[] {
  const { status = 'all', customerId, fromDate, toDate, limit = 100 } = params;

  let invoices = generateSalesInvoices();

  if (status === 'open') {
    invoices = invoices.filter((inv) => inv.outstandingAmount > 0);
  } else if (status === 'paid') {
    invoices = invoices.filter((inv) => inv.outstandingAmount === 0);
  }

  if (customerId) {
    invoices = invoices.filter((inv) => inv.customerId === customerId);
  }

  if (fromDate) {
    invoices = invoices.filter((inv) => inv.invoiceDate >= fromDate);
  }
  if (toDate) {
    invoices = invoices.filter((inv) => inv.invoiceDate <= toDate);
  }

  return invoices.slice(0, limit);
}

export function getPurchaseInvoices(params: {
  status?: 'open' | 'paid' | 'all';
  supplierId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}): DemoPurchaseInvoice[] {
  const { status = 'all', supplierId, fromDate, toDate, limit = 100 } = params;

  let invoices = generatePurchaseInvoices();

  if (status === 'open') {
    invoices = invoices.filter((inv) => inv.outstandingAmount > 0);
  } else if (status === 'paid') {
    invoices = invoices.filter((inv) => inv.outstandingAmount === 0);
  }

  if (supplierId) {
    invoices = invoices.filter((inv) => inv.supplierId === supplierId);
  }

  if (fromDate) {
    invoices = invoices.filter((inv) => inv.invoiceDate >= fromDate);
  }
  if (toDate) {
    invoices = invoices.filter((inv) => inv.invoiceDate <= toDate);
  }

  return invoices.slice(0, limit);
}

export function getOutstandingInvoices(params: {
  type?: 'receivable' | 'payable' | 'both';
  customerId?: string;
  supplierId?: string;
  overdueOnly?: boolean;
  minDaysOverdue?: number;
}): {
  receivables: DemoSalesInvoice[];
  payables: DemoPurchaseInvoice[];
} {
  const { type = 'both', customerId, supplierId, overdueOnly = false, minDaysOverdue } = params;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  let receivables: DemoSalesInvoice[] = [];
  let payables: DemoPurchaseInvoice[] = [];

  if (type === 'receivable' || type === 'both') {
    receivables = generateSalesInvoices().filter((inv) => {
      if (inv.outstandingAmount === 0) return false;
      if (customerId && inv.customerId !== customerId) return false;
      if (overdueOnly && inv.dueDate >= todayStr) return false;

      if (minDaysOverdue) {
        const dueDate = new Date(inv.dueDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue < minDaysOverdue) return false;
      }

      return true;
    });
  }

  if (type === 'payable' || type === 'both') {
    payables = generatePurchaseInvoices().filter((inv) => {
      if (inv.outstandingAmount === 0) return false;
      if (supplierId && inv.supplierId !== supplierId) return false;
      if (overdueOnly && inv.dueDate >= todayStr) return false;

      if (minDaysOverdue) {
        const dueDate = new Date(inv.dueDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue < minDaysOverdue) return false;
      }

      return true;
    });
  }

  return { receivables, payables };
}
