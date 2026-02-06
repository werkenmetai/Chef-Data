/**
 * Demo Relations Data - Multi-Industry Support
 *
 * Generates realistic Dutch business relations based on the current demo industry.
 * Each industry has its own set of customers and suppliers.
 */

import { getCurrentIndustryConfig, DemoIndustry } from '../context';

export interface DemoRelation {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  vatNumber: string | null;
  kvkNumber: string | null;
  isCustomer: boolean;
  isSupplier: boolean;
  status: 'active' | 'blocked';
  relationshipType: 'C' | 'S' | 'P'; // Customer, Suspect, Prospect
  creditLimit?: number;
}

// ============================================
// BAKKERIJ RELATIONS
// ============================================

const BAKKERIJ_CUSTOMERS: DemoRelation[] = [
  {
    id: 'cust-001-hotel-krasnapolsky',
    code: 'KRAS001',
    name: 'Hotel Krasnapolsky',
    email: 'inkoop@krasnapolsky.nl',
    phone: '+31 20 554 9111',
    city: 'Amsterdam',
    country: 'NL',
    vatNumber: 'NL001234567B01',
    kvkNumber: '33000001',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 15000,
  },
  {
    id: 'cust-002-restaurant-vier-pilaren',
    code: 'VIER001',
    name: 'Restaurant De Vier Pilaren',
    email: 'info@vierpilarenrestaurant.nl',
    phone: '+31 20 623 4567',
    city: 'Amsterdam',
    country: 'NL',
    vatNumber: 'NL002345678B01',
    kvkNumber: '33000002',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 5000,
  },
  {
    id: 'cust-003-ah-centrum',
    code: 'AHCE001',
    name: 'Albert Heijn Centrum',
    email: 'filiaal.centrum@ah.nl',
    phone: '+31 20 620 1234',
    city: 'Amsterdam',
    country: 'NL',
    vatNumber: 'NL003456789B01',
    kvkNumber: '33000003',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 10000,
  },
  {
    id: 'cust-004-hotel-pulitzer',
    code: 'PULI001',
    name: 'Hotel Pulitzer Amsterdam',
    email: 'fb.purchasing@pulitzeramsterdam.com',
    phone: '+31 20 523 5235',
    city: 'Amsterdam',
    country: 'NL',
    vatNumber: 'NL005678901B01',
    kvkNumber: '33000005',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 12000,
  },
  {
    id: 'cust-005-kantoor-zuidas',
    code: 'ZUDA001',
    name: 'Kantoorcomplex Zuidas',
    email: 'facilitair@zuidaskantoren.nl',
    phone: '+31 20 570 1234',
    city: 'Amsterdam',
    country: 'NL',
    vatNumber: 'NL007890123B01',
    kvkNumber: '33000007',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 8000,
  },
  {
    id: 'cust-006-spar-jordaan',
    code: 'SPAR001',
    name: 'SPAR Jordaan',
    email: 'jordaan@spar.nl',
    phone: '+31 20 622 4321',
    city: 'Amsterdam',
    country: 'NL',
    vatNumber: 'NL011234567B01',
    kvkNumber: '33000012',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 5000,
  },
];

const BAKKERIJ_SUPPLIERS: DemoRelation[] = [
  {
    id: 'supp-001-meelgroothandel',
    code: 'MEEL001',
    name: 'Meelgroothandel Van der Molen',
    email: 'verkoop@meelvdmolen.nl',
    phone: '+31 33 456 7890',
    city: 'Amersfoort',
    country: 'NL',
    vatNumber: 'NL101234567B01',
    kvkNumber: '34000001',
    isCustomer: false,
    isSupplier: true,
    status: 'active',
    relationshipType: 'C',
  },
  {
    id: 'supp-002-zuivelfabriek',
    code: 'ZUIV001',
    name: 'Zuivelfabriek De Koe',
    email: 'orders@zuiveldekoe.nl',
    phone: '+31 515 432 100',
    city: 'Leeuwarden',
    country: 'NL',
    vatNumber: 'NL102345678B01',
    kvkNumber: '34000002',
    isCustomer: false,
    isSupplier: true,
    status: 'active',
    relationshipType: 'C',
  },
  {
    id: 'supp-003-vattenfall',
    code: 'VATT001',
    name: 'Vattenfall Energie',
    email: 'zakelijk@vattenfall.nl',
    phone: '+31 88 990 1000',
    city: 'Amsterdam',
    country: 'NL',
    vatNumber: 'NL103456789B01',
    kvkNumber: '34000003',
    isCustomer: false,
    isSupplier: true,
    status: 'active',
    relationshipType: 'C',
  },
  {
    id: 'supp-004-vastgoed',
    code: 'HUUR001',
    name: 'Vastgoed Centrum Amsterdam',
    email: 'huur@vastgoedcentrum.nl',
    phone: '+31 20 345 6789',
    city: 'Amsterdam',
    country: 'NL',
    vatNumber: 'NL105678901B01',
    kvkNumber: '34000005',
    isCustomer: false,
    isSupplier: true,
    status: 'active',
    relationshipType: 'C',
  },
];

// ============================================
// IT CONSULTANCY RELATIONS
// ============================================

const IT_CUSTOMERS: DemoRelation[] = [
  {
    id: 'it-cust-001-abn-amro',
    code: 'ABNA001',
    name: 'ABN AMRO Bank N.V.',
    email: 'it-procurement@abnamro.com',
    phone: '+31 20 628 9393',
    city: 'Amsterdam',
    country: 'NL',
    vatNumber: 'NL820646660B01',
    kvkNumber: '34334259',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 250000,
  },
  {
    id: 'it-cust-002-philips',
    code: 'PHIL001',
    name: 'Philips Nederland B.V.',
    email: 'vendor.management@philips.com',
    phone: '+31 40 279 1111',
    city: 'Eindhoven',
    country: 'NL',
    vatNumber: 'NL002086025B01',
    kvkNumber: '17004785',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 150000,
  },
  {
    id: 'it-cust-003-gemeente-utrecht',
    code: 'GEUT001',
    name: 'Gemeente Utrecht',
    email: 'ict@utrecht.nl',
    phone: '+31 30 286 0000',
    city: 'Utrecht',
    country: 'NL',
    vatNumber: null,
    kvkNumber: '30280076',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 100000,
  },
  {
    id: 'it-cust-004-fintech-innovators',
    code: 'FINT001',
    name: 'FinTech Innovators B.V.',
    email: 'tech@fintechinnovators.nl',
    phone: '+31 20 891 2345',
    city: 'Amsterdam',
    country: 'NL',
    vatNumber: 'NL856789012B01',
    kvkNumber: '75234567',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 50000,
  },
  {
    id: 'it-cust-005-logistiek-noord',
    code: 'LOGN001',
    name: 'Logistiek Bedrijf Noord B.V.',
    email: 'it@logistieknoord.nl',
    phone: '+31 50 316 7890',
    city: 'Groningen',
    country: 'NL',
    vatNumber: 'NL812345678B01',
    kvkNumber: '02012345',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 75000,
  },
];

const IT_SUPPLIERS: DemoRelation[] = [
  {
    id: 'it-supp-001-microsoft',
    code: 'MSFT001',
    name: 'Microsoft Nederland B.V.',
    email: 'partners@microsoft.nl',
    phone: '+31 20 500 1500',
    city: 'Schiphol',
    country: 'NL',
    vatNumber: 'NL008003850B01',
    kvkNumber: '30159909',
    isCustomer: false,
    isSupplier: true,
    status: 'active',
    relationshipType: 'C',
  },
  {
    id: 'it-supp-002-jetbrains',
    code: 'JETB001',
    name: 'JetBrains s.r.o.',
    email: 'sales@jetbrains.com',
    phone: '+420 2 4172 2501',
    city: 'Prague',
    country: 'CZ',
    vatNumber: 'CZ26502275',
    kvkNumber: null,
    isCustomer: false,
    isSupplier: true,
    status: 'active',
    relationshipType: 'C',
  },
  {
    id: 'it-supp-003-regus',
    code: 'REGU001',
    name: 'Regus Business Centre',
    email: 'utrecht@regus.com',
    phone: '+31 30 210 2800',
    city: 'Utrecht',
    country: 'NL',
    vatNumber: 'NL817896543B01',
    kvkNumber: '33123456',
    isCustomer: false,
    isSupplier: true,
    status: 'active',
    relationshipType: 'C',
  },
];

// ============================================
// ADVOCAAT RELATIONS
// ============================================

const ADVOCAAT_CUSTOMERS: DemoRelation[] = [
  {
    id: 'adv-cust-001-heineken',
    code: 'HEIN001',
    name: 'Heineken N.V.',
    email: 'legal@heineken.com',
    phone: '+31 20 523 9239',
    city: 'Amsterdam',
    country: 'NL',
    vatNumber: 'NL005049001B01',
    kvkNumber: '33011424',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 500000,
  },
  {
    id: 'adv-cust-002-postnl',
    code: 'POST001',
    name: 'PostNL N.V.',
    email: 'juridisch@postnl.nl',
    phone: '+31 88 868 6161',
    city: 'Den Haag',
    country: 'NL',
    vatNumber: 'NL809732073B01',
    kvkNumber: '27276904',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 200000,
  },
  {
    id: 'adv-cust-003-transport-jansen',
    code: 'TRAJ001',
    name: 'Transport Jansen B.V.',
    email: 'directie@transportjansen.nl',
    phone: '+31 70 356 7890',
    city: 'Den Haag',
    country: 'NL',
    vatNumber: 'NL823456789B01',
    kvkNumber: '27123456',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 50000,
  },
  {
    id: 'adv-cust-004-visser',
    code: 'VISS001',
    name: 'De heer J. Visser',
    email: 'j.visser@gmail.com',
    phone: '+31 6 1234 5678',
    city: 'Den Haag',
    country: 'NL',
    vatNumber: null,
    kvkNumber: null,
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 10000,
  },
  {
    id: 'adv-cust-005-gemeente-den-haag',
    code: 'GEDH001',
    name: 'Gemeente Den Haag',
    email: 'juridische.zaken@denhaag.nl',
    phone: '+31 70 353 5000',
    city: 'Den Haag',
    country: 'NL',
    vatNumber: null,
    kvkNumber: '27370652',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 150000,
  },
];

const ADVOCAAT_SUPPLIERS: DemoRelation[] = [
  {
    id: 'adv-supp-001-wolters-kluwer',
    code: 'WOLK001',
    name: 'Wolters Kluwer Nederland B.V.',
    email: 'klantenservice@wolterskluwer.nl',
    phone: '+31 172 641 400',
    city: 'Alphen aan den Rijn',
    country: 'NL',
    vatNumber: 'NL805932074B01',
    kvkNumber: '28027082',
    isCustomer: false,
    isSupplier: true,
    status: 'active',
    relationshipType: 'C',
  },
  {
    id: 'adv-supp-002-regus-denhaag',
    code: 'REGDH01',
    name: 'Regus Den Haag Parkstraat',
    email: 'denhaag@regus.com',
    phone: '+31 70 205 2000',
    city: 'Den Haag',
    country: 'NL',
    vatNumber: 'NL817896543B01',
    kvkNumber: '33123456',
    isCustomer: false,
    isSupplier: true,
    status: 'active',
    relationshipType: 'C',
  },
  {
    id: 'adv-supp-003-nova',
    code: 'NOVA001',
    name: 'Nederlandse Orde van Advocaten',
    email: 'contributie@advocatenorde.nl',
    phone: '+31 70 335 3535',
    city: 'Den Haag',
    country: 'NL',
    vatNumber: 'NL002981540B01',
    kvkNumber: '40408227',
    isCustomer: false,
    isSupplier: true,
    status: 'active',
    relationshipType: 'C',
  },
];

// ============================================
// AANNEMER RELATIONS
// ============================================

const AANNEMER_CUSTOMERS: DemoRelation[] = [
  {
    id: 'aan-cust-001-am-vastgoed',
    code: 'AMVA001',
    name: 'AM Vastgoed B.V.',
    email: 'projecten@am.nl',
    phone: '+31 30 609 6111',
    city: 'Utrecht',
    country: 'NL',
    vatNumber: 'NL001856243B01',
    kvkNumber: '32094563',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 500000,
  },
  {
    id: 'aan-cust-002-woonstad',
    code: 'WOON001',
    name: 'Woonstad Rotterdam',
    email: 'onderhoud@woonstad.nl',
    phone: '+31 10 421 8888',
    city: 'Rotterdam',
    country: 'NL',
    vatNumber: 'NL001458374B01',
    kvkNumber: '24068956',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 300000,
  },
  {
    id: 'aan-cust-003-pietersen',
    code: 'PIET001',
    name: 'Familie Pietersen',
    email: 'a.pietersen@gmail.com',
    phone: '+31 6 2345 6789',
    city: 'Rotterdam',
    country: 'NL',
    vatNumber: null,
    kvkNumber: null,
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 75000,
  },
  {
    id: 'aan-cust-004-supermarkt',
    code: 'SUPK001',
    name: 'Supermarkt Keten Zuid B.V.',
    email: 'vastgoed@supermarktketen.nl',
    phone: '+31 10 456 7890',
    city: 'Rotterdam',
    country: 'NL',
    vatNumber: 'NL856432109B01',
    kvkNumber: '24567890',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 200000,
  },
  {
    id: 'aan-cust-005-havensteder',
    code: 'HAVE001',
    name: 'Havensteder',
    email: 'projecten@havensteder.nl',
    phone: '+31 10 275 5000',
    city: 'Rotterdam',
    country: 'NL',
    vatNumber: 'NL001234890B01',
    kvkNumber: '24117891',
    isCustomer: true,
    isSupplier: false,
    status: 'active',
    relationshipType: 'C',
    creditLimit: 400000,
  },
];

const AANNEMER_SUPPLIERS: DemoRelation[] = [
  {
    id: 'aan-supp-001-bouwmaat',
    code: 'BOUW001',
    name: 'Bouwmaat Rotterdam',
    email: 'zakelijk@bouwmaat.nl',
    phone: '+31 10 456 1234',
    city: 'Rotterdam',
    country: 'NL',
    vatNumber: 'NL805234567B01',
    kvkNumber: '24098765',
    isCustomer: false,
    isSupplier: true,
    status: 'active',
    relationshipType: 'C',
  },
  {
    id: 'aan-supp-002-boels',
    code: 'BOEL001',
    name: 'Boels Verhuur B.V.',
    email: 'rotterdam@boels.nl',
    phone: '+31 10 411 2000',
    city: 'Rotterdam',
    country: 'NL',
    vatNumber: 'NL001456789B01',
    kvkNumber: '14027491',
    isCustomer: false,
    isSupplier: true,
    status: 'active',
    relationshipType: 'C',
  },
  {
    id: 'aan-supp-003-elektra',
    code: 'ELEK001',
    name: 'Elektra Installaties Rotterdam',
    email: 'info@elektrainstallaties.nl',
    phone: '+31 10 234 5678',
    city: 'Rotterdam',
    country: 'NL',
    vatNumber: 'NL812345670B01',
    kvkNumber: '24567123',
    isCustomer: false,
    isSupplier: true,
    status: 'active',
    relationshipType: 'C',
  },
  {
    id: 'aan-supp-004-containerdienst',
    code: 'CONT001',
    name: 'Containerdienst Rotterdam',
    email: 'planning@containerdienstrotterdam.nl',
    phone: '+31 10 890 1234',
    city: 'Rotterdam',
    country: 'NL',
    vatNumber: 'NL823456781B01',
    kvkNumber: '24234567',
    isCustomer: false,
    isSupplier: true,
    status: 'active',
    relationshipType: 'C',
  },
];

// ============================================
// INDUSTRY DATA MAP
// ============================================

const INDUSTRY_RELATIONS: Record<DemoIndustry, { customers: DemoRelation[]; suppliers: DemoRelation[] }> = {
  bakkerij: { customers: BAKKERIJ_CUSTOMERS, suppliers: BAKKERIJ_SUPPLIERS },
  it: { customers: IT_CUSTOMERS, suppliers: IT_SUPPLIERS },
  advocaat: { customers: ADVOCAAT_CUSTOMERS, suppliers: ADVOCAAT_SUPPLIERS },
  aannemer: { customers: AANNEMER_CUSTOMERS, suppliers: AANNEMER_SUPPLIERS },
};

// ============================================
// PUBLIC API
// ============================================

/**
 * Get all relations for the current industry
 */
function getIndustryRelations(): DemoRelation[] {
  const config = getCurrentIndustryConfig();
  const data = INDUSTRY_RELATIONS[config.company.industry];
  return [...data.customers, ...data.suppliers];
}

/**
 * All demo relations combined (backwards compat export)
 */
export const DEMO_RELATIONS: DemoRelation[] = [...BAKKERIJ_CUSTOMERS, ...BAKKERIJ_SUPPLIERS];

/**
 * Get customers for current industry (optionally filtered)
 */
export function getCustomers(activeOnly = true): DemoRelation[] {
  const config = getCurrentIndustryConfig();
  const data = INDUSTRY_RELATIONS[config.company.industry];
  return data.customers.filter(
    (r) => r.isCustomer && (!activeOnly || r.status === 'active')
  );
}

/**
 * Get suppliers for current industry (optionally filtered)
 */
export function getSuppliers(activeOnly = true): DemoRelation[] {
  const config = getCurrentIndustryConfig();
  const data = INDUSTRY_RELATIONS[config.company.industry];
  return data.suppliers.filter(
    (r) => r.isSupplier && (!activeOnly || r.status === 'active')
  );
}

/**
 * Get all relations with optional filters
 */
export function getRelations(params: {
  type?: 'customer' | 'supplier' | 'both';
  activeOnly?: boolean;
  limit?: number;
}): DemoRelation[] {
  const { type = 'both', activeOnly = true, limit = 100 } = params;

  let relations = getIndustryRelations();

  // Filter by type
  if (type === 'customer') {
    relations = relations.filter((r) => r.isCustomer);
  } else if (type === 'supplier') {
    relations = relations.filter((r) => r.isSupplier);
  }

  // Filter by status
  if (activeOnly) {
    relations = relations.filter((r) => r.status === 'active');
  }

  // Apply limit
  return relations.slice(0, limit);
}

/**
 * Search relations by name, code, KvK, or VAT number
 */
export function searchRelations(
  query: string,
  searchField: 'name' | 'code' | 'kvk' | 'vat' | 'all' = 'all'
): DemoRelation[] {
  const lowerQuery = query.toLowerCase();
  const relations = getIndustryRelations();

  return relations.filter((r) => {
    switch (searchField) {
      case 'name':
        return r.name.toLowerCase().includes(lowerQuery);
      case 'code':
        return r.code.toLowerCase() === lowerQuery;
      case 'kvk':
        return r.kvkNumber?.toLowerCase() === lowerQuery;
      case 'vat':
        return r.vatNumber?.toLowerCase() === lowerQuery;
      default:
        return (
          r.name.toLowerCase().includes(lowerQuery) ||
          r.code.toLowerCase().includes(lowerQuery) ||
          r.kvkNumber?.toLowerCase().includes(lowerQuery) ||
          r.vatNumber?.toLowerCase().includes(lowerQuery)
        );
    }
  });
}
