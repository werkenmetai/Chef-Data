/**
 * Bulk Endpoint Utilities for Exact Online API
 *
 * Exact Online provides bulk endpoints that allow fetching up to 1000 records per page
 * instead of the standard 60 records per page. This significantly reduces the number
 * of API calls needed for large data sets.
 *
 * Regular endpoint: /api/v1/{division}/crm/Accounts
 * Bulk endpoint:    /api/v1/{division}/bulk/CRM/Accounts
 *
 * @see https://support.exactonline.com/community/s/knowledge-base#All-All-DNO-Content-bulk-api
 */

/** Page size for standard endpoints */
export const STANDARD_PAGE_SIZE = 60;

/** Page size for bulk endpoints */
export const BULK_PAGE_SIZE = 1000;

/**
 * Service names that support bulk endpoints.
 * The key is the lowercase service name, the value is the proper casing for bulk URL.
 */
export const BULK_SUPPORTED_SERVICES: Record<string, string> = {
  crm: 'CRM',
  financial: 'Financial',
  financialtransaction: 'FinancialTransaction',
  logistics: 'Logistics',
  salesorder: 'SalesOrder',
  purchaseorder: 'PurchaseOrder',
  project: 'Project',
  hrm: 'HRM',
  payroll: 'Payroll',
  manufacturing: 'Manufacturing',
  inventory: 'Inventory',
  cashflow: 'Cashflow',
  budget: 'Budget',
  assets: 'Assets',
  activities: 'Activities',
  documents: 'Documents',
  mailbox: 'Mailbox',
  users: 'Users',
  sync: 'Sync',
};

/**
 * Entities that commonly have large result sets and benefit from bulk endpoints.
 * This is a reference list - most entities in supported services work with bulk.
 */
export const BULK_RECOMMENDED_ENTITIES: ReadonlyArray<string> = [
  // CRM
  'Accounts',
  'Contacts',
  'Addresses',
  // Financial
  'GLAccounts',
  'GLTransactionLines',
  'Journals',
  'ReportingBalance',
  // Logistics
  'Items',
  'ItemWarehouses',
  'StockPositions',
  // SalesOrder
  'SalesOrderLines',
  'GoodsDeliveryLines',
  // PurchaseOrder
  'PurchaseOrderLines',
  'GoodsReceiptLines',
  // Financial Transaction
  'TransactionLines',
  'BankEntryLines',
  // Project
  'TimeTransactions',
  'CostTransactions',
  'Projects',
  // HRM
  'Employees',
  'Absences',
  // Inventory
  'StockCounts',
  'WarehouseTransfers',
];

/**
 * Configuration for when to recommend bulk endpoints
 */
export interface BulkRecommendationConfig {
  /** Minimum expected records to recommend bulk (default: 100) */
  minExpectedRecords?: number;
  /** Always use bulk regardless of expected size */
  forceBulk?: boolean;
}

/**
 * Result of bulk endpoint conversion
 */
export interface BulkEndpointResult {
  /** The bulk endpoint path */
  endpoint: string;
  /** Whether bulk is supported for this endpoint */
  supported: boolean;
  /** The service name in proper case */
  service: string;
  /** The entity name */
  entity: string;
}

/**
 * Get the bulk endpoint URL for a given division, service, and entity.
 *
 * @param division - The Exact Online division number
 * @param service - The service name (e.g., 'crm', 'financial')
 * @param entity - The entity name (e.g., 'Accounts', 'GLAccounts')
 * @returns The bulk endpoint path
 *
 * @example
 * ```typescript
 * const endpoint = getBulkEndpoint(12345, 'crm', 'Accounts');
 * // Returns: '/api/v1/12345/bulk/CRM/Accounts'
 * ```
 */
export function getBulkEndpoint(
  division: number,
  service: string,
  entity: string
): string {
  const serviceName = getProperServiceCase(service);
  return `/api/v1/${division}/bulk/${serviceName}/${entity}`;
}

/**
 * Convert a regular endpoint to its bulk equivalent.
 *
 * @param endpoint - The regular endpoint (e.g., 'crm/Accounts' or '/api/v1/12345/crm/Accounts')
 * @returns The bulk endpoint result with metadata
 *
 * @example
 * ```typescript
 * const result = convertToBulkEndpoint('crm/Accounts');
 * // Returns: { endpoint: 'bulk/CRM/Accounts', supported: true, service: 'CRM', entity: 'Accounts' }
 *
 * const result2 = convertToBulkEndpoint('/api/v1/12345/financial/GLAccounts');
 * // Returns: { endpoint: '/api/v1/12345/bulk/Financial/GLAccounts', supported: true, ... }
 * ```
 */
export function convertToBulkEndpoint(endpoint: string): BulkEndpointResult {
  // Handle full URL path with division
  const fullPathMatch = endpoint.match(
    /^(\/api\/v1\/\d+)\/([a-zA-Z]+)\/([a-zA-Z]+)$/
  );
  if (fullPathMatch) {
    const [, prefix, service, entity] = fullPathMatch;
    const serviceLower = service.toLowerCase();
    const supported = serviceLower in BULK_SUPPORTED_SERVICES;
    const properService = supported
      ? BULK_SUPPORTED_SERVICES[serviceLower]
      : service;

    return {
      endpoint: `${prefix}/bulk/${properService}/${entity}`,
      supported,
      service: properService,
      entity,
    };
  }

  // Handle relative endpoint (service/Entity format)
  const relativeMatch = endpoint.match(/^([a-zA-Z]+)\/([a-zA-Z]+)$/);
  if (relativeMatch) {
    const [, service, entity] = relativeMatch;
    const serviceLower = service.toLowerCase();
    const supported = serviceLower in BULK_SUPPORTED_SERVICES;
    const properService = supported
      ? BULK_SUPPORTED_SERVICES[serviceLower]
      : service;

    return {
      endpoint: `bulk/${properService}/${entity}`,
      supported,
      service: properService,
      entity,
    };
  }

  // Cannot parse endpoint - return as-is
  return {
    endpoint,
    supported: false,
    service: '',
    entity: '',
  };
}

/**
 * Check if a service supports bulk endpoints.
 *
 * @param service - The service name (case-insensitive)
 * @returns True if the service supports bulk endpoints
 */
export function isBulkSupported(service: string): boolean {
  return service.toLowerCase() in BULK_SUPPORTED_SERVICES;
}

/**
 * Check if an endpoint is already a bulk endpoint.
 *
 * @param endpoint - The endpoint to check
 * @returns True if it's a bulk endpoint
 */
export function isBulkEndpoint(endpoint: string): boolean {
  return /\/bulk\//i.test(endpoint);
}

/**
 * Get the proper case for a service name in bulk endpoints.
 *
 * @param service - The service name (case-insensitive)
 * @returns The proper case for the service name
 */
export function getProperServiceCase(service: string): string {
  const serviceLower = service.toLowerCase();
  return BULK_SUPPORTED_SERVICES[serviceLower] || service;
}

/**
 * Determine if bulk should be used based on expected result size.
 *
 * @param expectedRecords - The expected number of records
 * @param config - Optional configuration
 * @returns True if bulk endpoint should be used
 *
 * @example
 * ```typescript
 * // Default threshold is 100 records
 * shouldUseBulk(50);   // false
 * shouldUseBulk(150);  // true
 *
 * // Custom threshold
 * shouldUseBulk(50, { minExpectedRecords: 30 });  // true
 *
 * // Force bulk
 * shouldUseBulk(10, { forceBulk: true });  // true
 * ```
 */
export function shouldUseBulk(
  expectedRecords: number,
  config: BulkRecommendationConfig = {}
): boolean {
  if (config.forceBulk) {
    return true;
  }

  const threshold = config.minExpectedRecords ?? 100;
  return expectedRecords >= threshold;
}

/**
 * Calculate the number of API calls needed for standard vs bulk endpoints.
 *
 * @param recordCount - The total number of records to fetch
 * @returns Object with call counts for both endpoint types
 *
 * @example
 * ```typescript
 * const calls = calculateApiCalls(5000);
 * // Returns: { standard: 84, bulk: 5, savings: 79 }
 * ```
 */
export function calculateApiCalls(recordCount: number): {
  standard: number;
  bulk: number;
  savings: number;
} {
  const standardCalls = Math.ceil(recordCount / STANDARD_PAGE_SIZE);
  const bulkCalls = Math.ceil(recordCount / BULK_PAGE_SIZE);

  return {
    standard: standardCalls,
    bulk: bulkCalls,
    savings: standardCalls - bulkCalls,
  };
}

/**
 * Get the appropriate page size based on whether bulk is being used.
 *
 * @param useBulk - Whether bulk endpoint is being used
 * @param requestedSize - Optional requested page size (will be capped)
 * @returns The page size to use
 */
export function getPageSize(useBulk: boolean, requestedSize?: number): number {
  const maxSize = useBulk ? BULK_PAGE_SIZE : STANDARD_PAGE_SIZE;

  if (requestedSize) {
    return Math.min(requestedSize, maxSize);
  }

  return maxSize;
}

/**
 * Build bulk endpoint URL parameters.
 *
 * @param options - Optional pagination and query options
 * @returns OData query parameters for bulk requests
 */
export function buildBulkParams(options: {
  pageSize?: number;
  skip?: number;
  select?: string[];
  filter?: string;
  orderBy?: string;
}): Record<string, string> {
  const params: Record<string, string> = {};

  // Default to max bulk page size
  const pageSize = Math.min(options.pageSize ?? BULK_PAGE_SIZE, BULK_PAGE_SIZE);
  params['$top'] = String(pageSize);

  if (options.skip && options.skip > 0) {
    params['$skip'] = String(options.skip);
  }

  if (options.select && options.select.length > 0) {
    params['$select'] = options.select.join(',');
  }

  if (options.filter) {
    params['$filter'] = options.filter;
  }

  if (options.orderBy) {
    params['$orderby'] = options.orderBy;
  }

  return params;
}
