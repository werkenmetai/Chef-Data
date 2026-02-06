/**
 * Demo Mode Module
 *
 * Entry point for demo mode functionality.
 * Demo API keys (exa_demo*) return realistic fake data for App Store demonstrations.
 *
 * Usage:
 * - API key starting with "exa_demo" triggers demo mode
 * - All tool calls return pre-generated realistic data
 * - No real Exact Online API calls are made
 * - No database lookups or rate limiting
 */

// Re-export context utilities
export {
  DEMO_API_KEY_PREFIX,
  isDemoApiKey,
  parseDemoIndustry,
  setCurrentDemoIndustry,
  getCurrentDemoIndustry,
  getCurrentIndustryConfig,
  getIndustryConfig,
  getIndustryConfigFromKey,
  INDUSTRY_CONFIGS,
  DEMO_COMPANY,
  DEMO_DIVISION,
  DEMO_CONNECTION,
  DEMO_AUTH_CONTEXT,
  createDemoAuthContext,
  type DemoAuthContext,
  type DemoIndustry,
  type IndustryConfig,
  type DemoCompanyInfo,
} from './context';

// Re-export demo data
export {
  DEMO_RELATIONS,
  getCustomers,
  getSuppliers,
  searchRelations,
} from './data/relations';

export {
  getSalesInvoices,
  getPurchaseInvoices,
  getOutstandingInvoices,
} from './data/invoices';

export {
  DEMO_BANK_TRANSACTIONS,
  getBankTransactions,
  getCurrentBalance,
} from './data/transactions';

// Re-export generators
export { getDemoResponse } from './generators';
