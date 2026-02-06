/**
 * Legal compliance constants
 * Version numbers should be updated when legal documents change materially
 */

// Terms of Service
export const TOS_VERSION = '1.1';
export const TOS_EFFECTIVE_DATE = '2026-02-04';

// Privacy Policy
export const PRIVACY_VERSION = '1.0';
export const PRIVACY_EFFECTIVE_DATE = '2026-01-24';

// Data Processing Agreement
export const DPA_VERSION = '1.1';
export const DPA_EFFECTIVE_DATE = '2026-02-04';

// Plan Limits - for display purposes (rate limiting uses @exact-mcp/shared)
// See packages/shared/src/types/plans.ts for the single source of truth
export const PLAN_LIMITS = {
  free: { apiCalls: 200, divisions: 2, apiKeys: 3 },
  starter: { apiCalls: 750, divisions: 3, apiKeys: 5 },
  pro: { apiCalls: 2500, divisions: 10, apiKeys: 10 },
  enterprise: { apiCalls: Infinity, divisions: Infinity, apiKeys: Infinity },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

// Company Information
export const COMPANY_NAME = 'Chef Data B.V.';
export const COMPANY_ADDRESS = 'Marconistraat 23, 1223BP Hilversum';
export const COMPANY_KVK = '96120924';
export const COMPANY_BTW = 'NL867477702B01';
export const COMPANY_EMAIL = 'support@praatmetjeboekhouding.nl';
export const PRIVACY_EMAIL = 'privacy@praatmetjeboekhouding.nl';
export const WEBSITE_URL = 'praatmetjeboekhouding.nl';

// Exact Online App Store
// TODO: Update with actual App Store URL after publication
export const EXACT_APP_STORE_URL = 'https://apps.exactonline.nl/nl/app/praat-met-je-boekhouding';
export const EXACT_APP_STORE_ENABLED = false; // Set to true when App Store listing is live
