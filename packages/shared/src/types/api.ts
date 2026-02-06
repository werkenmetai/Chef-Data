/**
 * API Configuration and Common Types
 */

/**
 * Supported Exact Online regions
 */
export type ExactRegion = 'NL' | 'BE' | 'UK' | 'DE' | 'US' | 'ES' | 'FR';

/**
 * Region configuration with endpoints
 */
export interface ExactRegionConfig {
  code: ExactRegion;
  name: string;
  domain: string;
  apiBaseUrl: string;
  authUrl: string;
  tokenUrl: string;
}

/**
 * OAuth token data
 */
export interface ExactTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | string;
  region: ExactRegion;
}

/**
 * Rate limit information from API headers
 */
export interface ExactRateLimitInfo {
  minutelyLimit: number;
  minutelyRemaining: number;
  minutelyReset: Date;
  dailyLimit: number;
  dailyRemaining: number;
  dailyReset: Date;
}

/**
 * OData query options
 */
export interface ODataQueryParams {
  $filter?: string;
  $select?: string;
  $orderby?: string;
  $top?: number;
  $skip?: number;
  $expand?: string;
}

/**
 * Standard OData response wrapper
 */
export interface ODataResponse<T> {
  d: {
    results: T[];
    __next?: string;
  };
}

/**
 * Single entity OData response
 */
export interface ODataSingleResponse<T> {
  d: T;
}

/**
 * Common API error response
 */
export interface ExactErrorResponse {
  error: {
    code: string;
    message: {
      lang: string;
      value: string;
    };
  };
}

/**
 * Invoice status codes in Exact Online
 */
export const InvoiceStatus = {
  Draft: 10,
  Submitted: 20,
  Sent: 35,
  Printed: 40,
  Booked: 50,
  Paid: 55,
  Cancelled: 60,
} as const;

export type InvoiceStatusCode = typeof InvoiceStatus[keyof typeof InvoiceStatus];

/**
 * Relation status codes
 */
export const RelationStatus = {
  Active: 'C',
  Blocked: 'B',
  Passive: 'N',
} as const;

export type RelationStatusCode = typeof RelationStatus[keyof typeof RelationStatus];

/**
 * Account classification
 */
export interface AccountClassification {
  ID: string;
  Code: string;
  Description: string;
  Division: number;
  Parent?: string;
  Type: 'BalanceSheet' | 'ProfitLoss' | 'CostCenter' | 'CostUnit';
}

/**
 * GL Account (Grootboekrekening)
 */
export interface GLAccount {
  ID: string;
  Code: string;
  Description: string;
  Type: number;
  TypeDescription: string;
  BalanceSide: 'D' | 'C';
  BalanceType: 'B' | 'W';
  Blocked: boolean;
  Class_01?: string;
  Class_02?: string;
  Class_03?: string;
  Class_04?: string;
  Class_05?: string;
  Compress: boolean;
  Costcenter?: string;
  Costunit?: string;
  PercentageVAT?: number;
  VATCode?: string;
}

/**
 * Journal entry types
 */
export const JournalType = {
  OpeningBalance: 10,
  Bank: 12,
  Cash: 20,
  SalesInvoice: 30,
  SalesCreditNote: 31,
  PurchaseInvoice: 40,
  PurchaseCreditNote: 41,
  General: 70,
  YearEnd: 80,
  Revaluation: 82,
  VATReturn: 83,
  ExchangeRateDiff: 84,
  PaymentDiff: 85,
  Settlement: 90,
} as const;

export type JournalTypeCode = typeof JournalType[keyof typeof JournalType];

/**
 * VAT Code (BTW Code)
 */
export interface VATCode {
  ID: string;
  Code: string;
  Description: string;
  Type: 'S' | 'P' | 'N' | 'E' | 'Z' | 'R' | 'I';
  VATPercentages: VATPercentage[];
}

/**
 * VAT Percentage
 */
export interface VATPercentage {
  ID: string;
  Code: string;
  Created: string;
  Percentage: number;
  StartDate: string;
  EndDate?: string;
  Type: number;
  VATCode: string;
}
