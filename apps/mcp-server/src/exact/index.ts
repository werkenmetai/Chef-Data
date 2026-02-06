/**
 * Exact Online API Module
 *
 * Exports all components for interacting with the Exact Online REST API.
 */

// Main client - classes and functions
export { ExactClient, ExactAPIError } from './client';
// Main client - types
export type { ExactClientConfig, ExactAPIResponse, RequestOptions, CurrentUser, Division } from './client';

// Authentication - Token Manager (advanced)
export { TokenManager, TokenError } from './token-manager';
export type { TokenManagerConfig, TokenData } from './token-manager';

// Authentication - Helper functions
export {
  buildAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  isTokenExpired,
  calculateExpiresAt,
  generateState,
  AuthError,
} from './auth';
export type { AuthConfig, TokenResponse } from './auth';

// Rate limiting
export { RateLimiter } from './rate-limiter';
export type { RateLimitInfo, RateLimiterConfig } from './rate-limiter';

// Circuit breaker
export { CircuitBreaker } from './circuit-breaker';
export type { CircuitState, CircuitBreakerConfig } from './circuit-breaker';

// Regions
export {
  REGION_CONFIGS,
  getRegionConfig,
  detectRegion,
  getAllRegions,
  DEFAULT_REGION,
} from './regions';
export type { ExactRegion, RegionConfig } from './regions';

// Pagination
export { PaginationHelper, PaginationCursor } from './pagination';
export type { PaginatedResponse, PaginationOptions, PaginationProgress } from './pagination';

// OData query building
export {
  ODataQueryBuilder,
  query,
  QueryPresets,
  escapeODataString,
  buildSubstringFilter,
  buildSubstringFilterMultiple,
} from './odata-query';
export type { ODataQueryOptions, FilterOperator, SortDirection } from './odata-query';

// Exact Online constants and status codes
export {
  AssetStatus,
  AssetStatusLabels,
  getAssetStatusLabel,
  DepreciationMethod,
  DepreciationMethodLabels,
  getDepreciationMethodLabel,
  ItemType,
  ItemTypeLabels,
  getItemTypeLabel,
  InvoiceStatus,
  InvoiceStatusLabels,
  getInvoiceStatusLabel,
  AccountStatus,
  AccountStatusLabels,
  getAccountStatusLabel,
  OpportunityStatus,
  OpportunityStatusLabels,
  getOpportunityStatusLabel,
  ProjectStatus,
  ProjectStatusLabels,
  getProjectStatusLabel,
  BalanceSide,
  BalanceSideLabels,
  JournalType,
  JournalTypeLabels,
  getJournalTypeLabel,
} from './constants';
export type {
  AssetStatusCode,
  DepreciationMethodCode,
  ItemTypeCode,
  InvoiceStatusCode,
  AccountStatusCode,
  OpportunityStatusCode,
  ProjectStatusCode,
  BalanceSideCode,
  JournalTypeCode,
} from './constants';

// Health checks
export { checkExactApiHealth, checkMultipleConnections } from './health';
export type { HealthCheckResult } from './health';

// Bulk endpoint utilities
export {
  getBulkEndpoint,
  convertToBulkEndpoint,
  isBulkSupported,
  isBulkEndpoint,
  getProperServiceCase,
  shouldUseBulk,
  calculateApiCalls,
  getPageSize,
  buildBulkParams,
  STANDARD_PAGE_SIZE,
  BULK_PAGE_SIZE,
  BULK_SUPPORTED_SERVICES,
  BULK_RECOMMENDED_ENTITIES,
} from './bulk';
export type { BulkRecommendationConfig, BulkEndpointResult } from './bulk';
