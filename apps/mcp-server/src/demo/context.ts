/**
 * Demo Mode Context - Multi-Industry Support
 *
 * Provides demo AuthContext and division info for App Store demonstrations.
 * Supports multiple industries via different demo API key suffixes:
 *
 * - exa_demo or exa_demo_bakkerij  → Bakkerij De Gouden Croissant B.V.
 * - exa_demo_it                    → TechVision Consultancy B.V.
 * - exa_demo_advocaat              → Van der Berg & Partners Advocaten
 * - exa_demo_aannemer              → Bouwbedrijf De Fundatie B.V.
 */

import { AuthContext, ConnectionInfo, DivisionInfo } from '../auth/api-key';

// ============================================
// DEMO KEY PARSING
// ============================================

/**
 * Demo API key prefix - any key starting with this is treated as demo mode
 */
export const DEMO_API_KEY_PREFIX = 'exa_demo';

/**
 * Supported demo industries
 */
export type DemoIndustry = 'bakkerij' | 'it' | 'advocaat' | 'aannemer';

/**
 * Check if an API key is a demo key
 */
export function isDemoApiKey(key: string | null | undefined): boolean {
  return key?.startsWith(DEMO_API_KEY_PREFIX) ?? false;
}

/**
 * Parse industry from demo API key
 * Examples:
 *   exa_demo           → 'bakkerij' (default)
 *   exa_demo_bakkerij  → 'bakkerij'
 *   exa_demo_it        → 'it'
 *   exa_demo_advocaat  → 'advocaat'
 *   exa_demo_aannemer  → 'aannemer'
 */
export function parseDemoIndustry(key: string | null | undefined): DemoIndustry {
  if (!key || !isDemoApiKey(key)) {
    return 'bakkerij'; // Default
  }

  const suffix = key.substring(DEMO_API_KEY_PREFIX.length);

  // Check for underscore-separated industry suffix
  if (suffix.startsWith('_')) {
    const industry = suffix.substring(1).toLowerCase();
    if (industry === 'it') return 'it';
    if (industry === 'advocaat' || industry === 'legal') return 'advocaat';
    if (industry === 'aannemer' || industry === 'bouw') return 'aannemer';
    if (industry === 'bakkerij' || industry === 'bakker') return 'bakkerij';
  }

  return 'bakkerij'; // Default for exa_demo or unknown suffix
}

// ============================================
// INDUSTRY CONFIGURATION
// ============================================

/**
 * Company information for a demo industry
 */
export interface DemoCompanyInfo {
  name: string;
  shortName: string;
  city: string;
  country: string;
  kvk: string;
  vat: string;
  address: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  iban: string;
  industry: DemoIndustry;
  description: string;
  employeeCount: number;
  annualRevenue: number; // Annual revenue in EUR
}

/**
 * Industry-specific configuration for demo data generation
 */
export interface IndustryConfig {
  company: DemoCompanyInfo;
  division: DivisionInfo;
  // Revenue breakdown categories (percentages must sum to 100)
  revenueCategories: { name: string; percentage: number; description: string }[];
  // Expense categories with typical percentages of revenue
  expenseProfiles: {
    costOfGoods: number; // % of revenue
    personnel: number; // % of revenue
    housing: number; // % of revenue
    marketing: number; // % of revenue
    other: number; // % of revenue
  };
  // Customer types for this industry
  customerTypes: { type: string; prefix: string; examples: string[] }[];
  // Supplier types for this industry
  supplierTypes: { type: string; prefix: string; examples: string[] }[];
  // Typical invoice descriptions
  invoiceDescriptions: {
    sales: string[];
    purchase: string[];
  };
  // GL account customizations
  glAccountNames: {
    revenue: string[];
    cogs: string[];
  };
}

// ============================================
// INDUSTRY CONFIGURATIONS
// ============================================

const BAKKERIJ_CONFIG: IndustryConfig = {
  company: {
    name: 'Bakkerij De Gouden Croissant B.V.',
    shortName: 'De Gouden Croissant',
    city: 'Amsterdam',
    country: 'NL',
    kvk: '12345678',
    vat: 'NL123456789B01',
    address: 'Broodstraat 42',
    postalCode: '1012 AB',
    phone: '+31 20 123 4567',
    email: 'info@goudencroissant.nl',
    website: 'www.goudencroissant.nl',
    iban: 'NL91ABNA0417164300',
    industry: 'bakkerij',
    description: 'Ambachtelijke bakkerij met bezorgservice voor horeca en retail',
    employeeCount: 15,
    annualRevenue: 1500000,
  },
  division: {
    code: 999999,
    name: 'Bakkerij De Gouden Croissant B.V.',
    isDefault: true,
    isActive: true,
  },
  revenueCategories: [
    { name: 'brood', percentage: 55, description: 'Omzet brood' },
    { name: 'gebak', percentage: 25, description: 'Omzet gebak en taarten' },
    { name: 'catering', percentage: 15, description: 'Omzet catering' },
    { name: 'overig', percentage: 5, description: 'Overige opbrengsten' },
  ],
  expenseProfiles: {
    costOfGoods: 35,
    personnel: 35,
    housing: 10,
    marketing: 3,
    other: 10,
  },
  customerTypes: [
    { type: 'hotel', prefix: 'cust-hotel', examples: ['Hotel Krasnapolsky', 'Hotel Pulitzer Amsterdam', 'NH Hotel Schiphol'] },
    { type: 'restaurant', prefix: 'cust-rest', examples: ['Restaurant De Vier Pilaren', 'Brasserie Nel', 'Grand Cafe Corso'] },
    { type: 'retail', prefix: 'cust-retail', examples: ['Albert Heijn Centrum', 'SPAR Jordaan'] },
    { type: 'catering', prefix: 'cust-cater', examples: ['Catering Service Amsterdam', 'Kantoorcomplex Zuidas'] },
  ],
  supplierTypes: [
    { type: 'grondstoffen', prefix: 'supp-grond', examples: ['Meelgroothandel Van der Molen', 'Zuivelfabriek De Koe', 'Eiergroothandel Hendriks'] },
    { type: 'verpakking', prefix: 'supp-verpak', examples: ['Verpakkingscentrale Nederland'] },
    { type: 'energie', prefix: 'supp-util', examples: ['Vattenfall Energie'] },
    { type: 'vastgoed', prefix: 'supp-vastg', examples: ['Vastgoed Centrum Amsterdam'] },
  ],
  invoiceDescriptions: {
    sales: [
      'Broodleveranties week {week}',
      'Ontbijtservice {month}',
      'Catering evenement',
      'Gebak en taarten',
      'Verse croissants en brood',
      'Lunch catering',
    ],
    purchase: [
      'Bloem en meelproducten {month}',
      'Boter, melk en room',
      'Verse eieren',
      'Verpakkingsmaterialen',
      'Huur bedrijfspand {month}',
      'Elektriciteit en gas',
    ],
  },
  glAccountNames: {
    revenue: ['Omzet brood', 'Omzet gebak en taarten', 'Omzet catering', 'Overige opbrengsten'],
    cogs: ['Inkoop grondstoffen', 'Inkoop verpakkingen', 'Voorraadverschillen'],
  },
};

const IT_CONFIG: IndustryConfig = {
  company: {
    name: 'TechVision Consultancy B.V.',
    shortName: 'TechVision',
    city: 'Utrecht',
    country: 'NL',
    kvk: '23456789',
    vat: 'NL234567890B01',
    address: 'Innovatielaan 100',
    postalCode: '3511 AB',
    phone: '+31 30 234 5678',
    email: 'info@techvision.nl',
    website: 'www.techvision.nl',
    iban: 'NL91RABO0123456789',
    industry: 'it',
    description: 'IT consultancy gespecialiseerd in cloud migratie en software development',
    employeeCount: 25,
    annualRevenue: 2800000,
  },
  division: {
    code: 888888,
    name: 'TechVision Consultancy B.V.',
    isDefault: true,
    isActive: true,
  },
  revenueCategories: [
    { name: 'consultancy', percentage: 60, description: 'Consultancy uren' },
    { name: 'development', percentage: 25, description: 'Software development' },
    { name: 'support', percentage: 10, description: 'Support & maintenance' },
    { name: 'training', percentage: 5, description: 'Training en workshops' },
  ],
  expenseProfiles: {
    costOfGoods: 5, // Low for services
    personnel: 55, // High for consultancy
    housing: 8,
    marketing: 5,
    other: 12,
  },
  customerTypes: [
    { type: 'enterprise', prefix: 'cust-ent', examples: ['ABN AMRO Bank', 'Philips Nederland', 'KLM Royal Dutch Airlines'] },
    { type: 'mkb', prefix: 'cust-mkb', examples: ['Logistiek Bedrijf Noord', 'Webshop Solutions', 'Marketing Bureau Creatief'] },
    { type: 'overheid', prefix: 'cust-gov', examples: ['Gemeente Utrecht', 'Rijkswaterstaat', 'Belastingdienst'] },
    { type: 'startup', prefix: 'cust-start', examples: ['FinTech Innovators', 'GreenTech Solutions', 'AI Labs Amsterdam'] },
  ],
  supplierTypes: [
    { type: 'cloud', prefix: 'supp-cloud', examples: ['Microsoft Azure', 'Amazon Web Services', 'Google Cloud'] },
    { type: 'software', prefix: 'supp-soft', examples: ['JetBrains', 'Atlassian', 'GitHub'] },
    { type: 'hardware', prefix: 'supp-hw', examples: ['Dell Technologies', 'Apple Nederland'] },
    { type: 'kantoor', prefix: 'supp-office', examples: ['Regus Kantoren', 'Vitens Waterbedrijf'] },
  ],
  invoiceDescriptions: {
    sales: [
      'Consultancy uren {month}',
      'Software development sprint {sprint}',
      'Cloud migratie project',
      'Support & maintenance Q{quarter}',
      'Training workshop Azure',
      'Security audit',
      'API integratie project',
    ],
    purchase: [
      'Azure cloud services {month}',
      'Software licenties',
      'Laptops en monitors',
      'Kantoorhuur {month}',
      'Trainingen en certificeringen',
    ],
  },
  glAccountNames: {
    revenue: ['Consultancy omzet', 'Development omzet', 'Support & maintenance', 'Training omzet'],
    cogs: ['Cloud kosten', 'Software licenties', 'Hardware'],
  },
};

const ADVOCAAT_CONFIG: IndustryConfig = {
  company: {
    name: 'Van der Berg & Partners Advocaten',
    shortName: 'Van der Berg',
    city: 'Den Haag',
    country: 'NL',
    kvk: '34567890',
    vat: 'NL345678901B01',
    address: 'Parkstraat 15',
    postalCode: '2514 JD',
    phone: '+31 70 345 6789',
    email: 'info@vdbergadvocaten.nl',
    website: 'www.vdbergadvocaten.nl',
    iban: 'NL91INGB0001234567',
    industry: 'advocaat',
    description: 'Advocatenkantoor gespecialiseerd in ondernemingsrecht en arbeidsrecht',
    employeeCount: 18,
    annualRevenue: 3200000,
  },
  division: {
    code: 777777,
    name: 'Van der Berg & Partners Advocaten',
    isDefault: true,
    isActive: true,
  },
  revenueCategories: [
    { name: 'ondernemingsrecht', percentage: 45, description: 'Ondernemingsrecht' },
    { name: 'arbeidsrecht', percentage: 30, description: 'Arbeidsrecht' },
    { name: 'vastgoedrecht', percentage: 15, description: 'Vastgoedrecht' },
    { name: 'procesvoering', percentage: 10, description: 'Procesvoering' },
  ],
  expenseProfiles: {
    costOfGoods: 3, // Very low for legal services
    personnel: 60, // Very high - lawyers are expensive
    housing: 10, // Premium location
    marketing: 4,
    other: 10,
  },
  customerTypes: [
    { type: 'corporate', prefix: 'cust-corp', examples: ['Heineken N.V.', 'PostNL', 'Randstad Holding'] },
    { type: 'mkb', prefix: 'cust-mkb', examples: ['Bakkerij Koopmans', 'IT Solutions BV', 'Transport Jansen'] },
    { type: 'particulier', prefix: 'cust-part', examples: ['De heer Visser', 'Mevrouw De Groot', 'Familie Bakker'] },
    { type: 'overheid', prefix: 'cust-gov', examples: ['Gemeente Den Haag', 'Provincie Zuid-Holland'] },
  ],
  supplierTypes: [
    { type: 'juridisch', prefix: 'supp-jur', examples: ['Wolters Kluwer', 'Legal Intelligence', 'Dirkzwager Advocaten'] },
    { type: 'kantoor', prefix: 'supp-office', examples: ['Regus Den Haag', 'Konica Minolta'] },
    { type: 'it', prefix: 'supp-it', examples: ['Microsoft 365', 'Clio Legal Software'] },
    { type: 'overig', prefix: 'supp-misc', examples: ['Advocatenblad', 'NOvA contributie'] },
  ],
  invoiceDescriptions: {
    sales: [
      'Juridisch advies {month}',
      'Arbeidsrechtelijke procedure',
      'Due diligence onderzoek',
      'Contracten review',
      'Procesvoering rechtbank',
      'Advisering fusie/overname',
      'Vastgoedtransactie begeleiding',
    ],
    purchase: [
      'Juridische databanken {month}',
      'Kantoorhuur {month}',
      'Legal software licenties',
      'Beroepsaansprakelijkheidsverzekering',
      'NOvA contributie',
    ],
  },
  glAccountNames: {
    revenue: ['Omzet ondernemingsrecht', 'Omzet arbeidsrecht', 'Omzet vastgoedrecht', 'Omzet procesvoering'],
    cogs: ['Uitbesteed werk', 'Juridische databanken', 'Deurwaarderskosten'],
  },
};

const AANNEMER_CONFIG: IndustryConfig = {
  company: {
    name: 'Bouwbedrijf De Fundatie B.V.',
    shortName: 'De Fundatie',
    city: 'Rotterdam',
    country: 'NL',
    kvk: '45678901',
    vat: 'NL456789012B01',
    address: 'Havenweg 88',
    postalCode: '3089 JK',
    phone: '+31 10 456 7890',
    email: 'info@defundatie.nl',
    website: 'www.defundatie.nl',
    iban: 'NL91ABNA0987654321',
    industry: 'aannemer',
    description: 'Bouwbedrijf gespecialiseerd in nieuwbouw woningen en renovatie',
    employeeCount: 35,
    annualRevenue: 4500000,
  },
  division: {
    code: 666666,
    name: 'Bouwbedrijf De Fundatie B.V.',
    isDefault: true,
    isActive: true,
  },
  revenueCategories: [
    { name: 'nieuwbouw', percentage: 50, description: 'Nieuwbouw projecten' },
    { name: 'renovatie', percentage: 30, description: 'Renovatie projecten' },
    { name: 'onderhoud', percentage: 15, description: 'Onderhoud contracten' },
    { name: 'overig', percentage: 5, description: 'Kleine klussen' },
  ],
  expenseProfiles: {
    costOfGoods: 50, // High - materials
    personnel: 25, // Construction workers
    housing: 5, // Lower - mostly on site
    marketing: 2,
    other: 8,
  },
  customerTypes: [
    { type: 'projectontwikkelaar', prefix: 'cust-proj', examples: ['AM Vastgoed', 'BPD Ontwikkeling', 'Heijmans Vastgoed'] },
    { type: 'woningcorporatie', prefix: 'cust-corp', examples: ['Woonstad Rotterdam', 'Havensteder', 'Vestia'] },
    { type: 'particulier', prefix: 'cust-part', examples: ['Familie Pietersen', 'De heer Van Dijk', 'Mevrouw Smit'] },
    { type: 'zakelijk', prefix: 'cust-zak', examples: ['Supermarkt Keten', 'Autodealer Zuid', 'Fitness Centrum'] },
  ],
  supplierTypes: [
    { type: 'bouwmaterialen', prefix: 'supp-mat', examples: ['Bouwmaat', 'Stiho Bouwgroep', 'BigMat Nederland'] },
    { type: 'machines', prefix: 'supp-mach', examples: ['Boels Verhuur', 'Loxam Rental', 'Ramirent'] },
    { type: 'onderaannemers', prefix: 'supp-sub', examples: ['Elektra Installaties', 'Loodgietersbedrijf Stromen', 'Dakdekker Van Dam'] },
    { type: 'transport', prefix: 'supp-trans', examples: ['Containerdienst Rotterdam', 'Kraan Verhuur West'] },
  ],
  invoiceDescriptions: {
    sales: [
      'Termijn {termijn} - Project {project}',
      'Nieuwbouw woning {adres}',
      'Renovatie kantoorpand',
      'Meerwerk - extra werkzaamheden',
      'Onderhoudscontract Q{quarter}',
      'Oplevering fase {fase}',
    ],
    purchase: [
      'Bouwmaterialen project {project}',
      'Betonlevering',
      'Steigermateriaal huur',
      'Onderaanneming elektra',
      'Kraanverhuur {dagen} dagen',
      'Containerafvoer',
    ],
  },
  glAccountNames: {
    revenue: ['Omzet nieuwbouw', 'Omzet renovatie', 'Omzet onderhoud', 'Overige omzet'],
    cogs: ['Bouwmaterialen', 'Onderaannemers', 'Machinehuur', 'Transport'],
  },
};

// ============================================
// INDUSTRY CONFIG ACCESS
// ============================================

/**
 * Map of all industry configurations
 */
export const INDUSTRY_CONFIGS: Record<DemoIndustry, IndustryConfig> = {
  bakkerij: BAKKERIJ_CONFIG,
  it: IT_CONFIG,
  advocaat: ADVOCAAT_CONFIG,
  aannemer: AANNEMER_CONFIG,
};

/**
 * Get the configuration for a specific industry
 */
export function getIndustryConfig(industry: DemoIndustry): IndustryConfig {
  return INDUSTRY_CONFIGS[industry];
}

/**
 * Get the configuration based on a demo API key
 */
export function getIndustryConfigFromKey(key: string | null | undefined): IndustryConfig {
  const industry = parseDemoIndustry(key);
  return getIndustryConfig(industry);
}

// ============================================
// BACKWARDS COMPATIBILITY EXPORTS
// ============================================

// Default to bakery for backwards compatibility
export const DEMO_COMPANY = BAKKERIJ_CONFIG.company;
export const DEMO_DIVISION = BAKKERIJ_CONFIG.division;

/**
 * Demo connection info - simulates a valid Exact Online connection
 */
export function createDemoConnection(industry: DemoIndustry = 'bakkerij'): ConnectionInfo {
  const config = getIndustryConfig(industry);
  return {
    id: `demo-connection-${industry}`,
    region: 'NL',
    accessToken: 'demo-access-token',
    refreshToken: 'demo-refresh-token',
    tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    divisions: [config.division],
  };
}

export const DEMO_CONNECTION: ConnectionInfo = createDemoConnection('bakkerij');

/**
 * Demo AuthContext - used when demo API key is detected
 */
export const DEMO_AUTH_CONTEXT: AuthContext = {
  userId: 'demo-user-001',
  email: 'demo@praatmetjeboekhouding.nl',
  plan: 'enterprise',
  apiKeyId: 'demo-api-key-001',
  connections: [DEMO_CONNECTION],
};

/**
 * Extended AuthContext with demo mode flag and industry
 */
export interface DemoAuthContext extends AuthContext {
  isDemoMode: true;
  demoIndustry: DemoIndustry;
}

/**
 * Create a demo AuthContext with the isDemoMode flag set
 */
export function createDemoAuthContext(apiKey?: string): DemoAuthContext {
  const industry = parseDemoIndustry(apiKey);

  return {
    ...DEMO_AUTH_CONTEXT,
    connections: [createDemoConnection(industry)],
    isDemoMode: true,
    demoIndustry: industry,
  };
}

// ============================================
// CURRENT INDUSTRY CONTEXT (Thread-local-like)
// ============================================

// This will be set per-request to track the current demo industry
let currentDemoIndustry: DemoIndustry = 'bakkerij';

/**
 * Set the current demo industry for this request
 */
export function setCurrentDemoIndustry(industry: DemoIndustry): void {
  currentDemoIndustry = industry;
}

/**
 * Get the current demo industry
 */
export function getCurrentDemoIndustry(): DemoIndustry {
  return currentDemoIndustry;
}

/**
 * Get the current industry configuration
 */
export function getCurrentIndustryConfig(): IndustryConfig {
  return getIndustryConfig(currentDemoIndustry);
}
