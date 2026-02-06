/**
 * Demo Company Data
 *
 * Fictitious Dutch bakery business: Bakkerij De Gouden Croissant B.V.
 * Located in Amsterdam, serves hotels, restaurants, and local businesses.
 */

export const DEMO_COMPANY_INFO = {
  // Basic company info
  name: 'Bakkerij De Gouden Croissant B.V.',
  tradeName: 'De Gouden Croissant',
  legalForm: 'B.V.',

  // Location
  address: 'Broodstraat 42',
  postalCode: '1012 AB',
  city: 'Amsterdam',
  country: 'NL',
  countryName: 'Nederland',

  // Contact
  phone: '+31 20 123 4567',
  email: 'info@goudencroissant.nl',
  website: 'www.goudencroissant.nl',

  // Registration
  kvk: '12345678',
  vat: 'NL123456789B01',
  btw: 'NL123456789B01', // Dutch alias

  // Banking
  iban: 'NL91ABNA0417164300',
  bic: 'ABNANL2A',
  bank: 'ABN AMRO',

  // Division info
  divisionCode: 999999,
  divisionDescription: 'Bakkerij De Gouden Croissant B.V.',

  // Fiscal info
  fiscalYearStart: 1, // January
  currency: 'EUR',

  // Business description
  industry: 'Bakkerij en broodproducten',
  sbiCode: '1071', // SBI code for bakkerijen
  employees: 12,
  foundedYear: 2018,

  // Opening hours (for context in demo)
  openingHours: {
    weekdays: '06:00 - 18:00',
    saturday: '07:00 - 17:00',
    sunday: 'Gesloten',
  },

  // Business metrics (for demo context)
  metrics: {
    averageMonthlyRevenue: 45000,
    averageMonthlyExpenses: 32000,
    grossMargin: 0.35,
    mainProducts: ['Brood', 'Croissants', 'Taarten', 'Gebak', 'Broodjes'],
    mainCustomerSegments: ['Horeca', 'Retail', 'Catering'],
  },
};
