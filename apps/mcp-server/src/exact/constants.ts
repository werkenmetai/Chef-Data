/**
 * Exact Online API Constants
 *
 * Centralized constants for Exact Online status codes, types, and enums.
 * Using constants prevents bugs from incorrect magic numbers.
 *
 * @see P10-003 in operations/ROADMAP.md
 */

// ============================================================================
// ASSET STATUS CODES
// @see https://start.exactonline.nl/docs/HlpRestAPIResourcesDetails.aspx?name=AssetsAssets
// ============================================================================

export const AssetStatus = {
  /** Actief - Asset is in use */
  ACTIVE: 1,
  /** Niet gevalideerd - Asset not yet validated */
  NOT_VALIDATED: 2,
  /** Inactief - Asset is inactive */
  INACTIVE: 3,
  /** Afgeschreven - Asset is fully depreciated */
  DEPRECIATED: 4,
  /** Geblokkeerd - Asset is blocked */
  BLOCKED: 5,
  /** Verkocht - Asset has been sold */
  SOLD: 6,
} as const;

export type AssetStatusCode = typeof AssetStatus[keyof typeof AssetStatus];

export const AssetStatusLabels: Record<AssetStatusCode, string> = {
  [AssetStatus.ACTIVE]: 'Actief',
  [AssetStatus.NOT_VALIDATED]: 'Niet gevalideerd',
  [AssetStatus.INACTIVE]: 'Inactief',
  [AssetStatus.DEPRECIATED]: 'Afgeschreven',
  [AssetStatus.BLOCKED]: 'Geblokkeerd',
  [AssetStatus.SOLD]: 'Verkocht',
};

export function getAssetStatusLabel(status: number): string {
  return AssetStatusLabels[status as AssetStatusCode] || `Status ${status}`;
}

// ============================================================================
// DEPRECIATION METHOD CODES
// ============================================================================

export const DepreciationMethod = {
  /** Geen afschrijving */
  NONE: 0,
  /** Lineair - Straight line depreciation */
  LINEAR: 10,
  /** Degressief - Declining balance depreciation */
  DECLINING: 20,
} as const;

export type DepreciationMethodCode = typeof DepreciationMethod[keyof typeof DepreciationMethod];

export const DepreciationMethodLabels: Record<DepreciationMethodCode, string> = {
  [DepreciationMethod.NONE]: 'Geen afschrijving',
  [DepreciationMethod.LINEAR]: 'Lineair',
  [DepreciationMethod.DECLINING]: 'Degressief',
};

export function getDepreciationMethodLabel(method: number): string {
  return DepreciationMethodLabels[method as DepreciationMethodCode] || `Methode ${method}`;
}

// ============================================================================
// ITEM TYPE CODES
// @see https://start.exactonline.nl/docs/HlpRestAPIResourcesDetails.aspx?name=LogisticsItems
// ============================================================================

export const ItemType = {
  /** Voorraad - Stock item */
  STOCK: 1,
  /** Dienst - Service item */
  SERVICE: 2,
  /** Niet op voorraad - Non-stock item */
  NON_STOCK: 3,
  /** Serienummer - Serial number item */
  SERIAL: 4,
  /** Batch - Batch item */
  BATCH: 5,
} as const;

export type ItemTypeCode = typeof ItemType[keyof typeof ItemType];

export const ItemTypeLabels: Record<ItemTypeCode, string> = {
  [ItemType.STOCK]: 'Voorraad',
  [ItemType.SERVICE]: 'Dienst',
  [ItemType.NON_STOCK]: 'Niet op voorraad',
  [ItemType.SERIAL]: 'Serienummer',
  [ItemType.BATCH]: 'Batch',
};

export function getItemTypeLabel(type: number): string {
  return ItemTypeLabels[type as ItemTypeCode] || `Type ${type}`;
}

// ============================================================================
// INVOICE STATUS CODES
// @see https://start.exactonline.nl/docs/HlpRestAPIResourcesDetails.aspx?name=SalesInvoiceSalesInvoices
// ============================================================================

export const InvoiceStatus = {
  /** Open - Invoice is open */
  OPEN: 20,
  /** Gedeeltelijk betaald - Partially paid */
  PARTIAL: 30,
  /** Volledig betaald - Fully paid */
  PAID: 50,
} as const;

export type InvoiceStatusCode = typeof InvoiceStatus[keyof typeof InvoiceStatus];

export const InvoiceStatusLabels: Record<InvoiceStatusCode, string> = {
  [InvoiceStatus.OPEN]: 'Open',
  [InvoiceStatus.PARTIAL]: 'Gedeeltelijk betaald',
  [InvoiceStatus.PAID]: 'Volledig betaald',
};

export function getInvoiceStatusLabel(status: number): string {
  return InvoiceStatusLabels[status as InvoiceStatusCode] || `Status ${status}`;
}

// ============================================================================
// ACCOUNT/RELATION STATUS CODES
// @see https://start.exactonline.nl/docs/HlpRestAPIResourcesDetails.aspx?name=CRMAccounts
// ============================================================================

export const AccountStatus = {
  /** Customer - Klant */
  CUSTOMER: 'C',
  /** Suspect - Suspect (lead) */
  SUSPECT: 'S',
  /** Prospect - Prospect */
  PROSPECT: 'P',
} as const;

export type AccountStatusCode = typeof AccountStatus[keyof typeof AccountStatus];

export const AccountStatusLabels: Record<AccountStatusCode, string> = {
  [AccountStatus.CUSTOMER]: 'Klant',
  [AccountStatus.SUSPECT]: 'Suspect',
  [AccountStatus.PROSPECT]: 'Prospect',
};

export function getAccountStatusLabel(status: string): string {
  return AccountStatusLabels[status as AccountStatusCode] || `Status ${status}`;
}

// ============================================================================
// OPPORTUNITY STATUS CODES
// @see https://start.exactonline.nl/docs/HlpRestAPIResourcesDetails.aspx?name=CRMOpportunities
// ============================================================================

export const OpportunityStatus = {
  /** Open - Opportunity is open */
  OPEN: 1,
  /** Gewonnen - Won */
  WON: 2,
  /** Verloren - Lost */
  LOST: 3,
} as const;

export type OpportunityStatusCode = typeof OpportunityStatus[keyof typeof OpportunityStatus];

export const OpportunityStatusLabels: Record<OpportunityStatusCode, string> = {
  [OpportunityStatus.OPEN]: 'Open',
  [OpportunityStatus.WON]: 'Gewonnen',
  [OpportunityStatus.LOST]: 'Verloren',
};

export function getOpportunityStatusLabel(status: number): string {
  return OpportunityStatusLabels[status as OpportunityStatusCode] || `Status ${status}`;
}

// ============================================================================
// PROJECT STATUS CODES
// @see https://start.exactonline.nl/docs/HlpRestAPIResourcesDetails.aspx?name=ProjectProjects
// ============================================================================

export const ProjectStatus = {
  /** Actief - Active */
  ACTIVE: 'A',
  /** Afgerond - Completed */
  COMPLETED: 'C',
  /** Pauze - On hold */
  ON_HOLD: 'P',
} as const;

export type ProjectStatusCode = typeof ProjectStatus[keyof typeof ProjectStatus];

export const ProjectStatusLabels: Record<ProjectStatusCode, string> = {
  [ProjectStatus.ACTIVE]: 'Actief',
  [ProjectStatus.COMPLETED]: 'Afgerond',
  [ProjectStatus.ON_HOLD]: 'Pauze',
};

export function getProjectStatusLabel(status: string): string {
  return ProjectStatusLabels[status as ProjectStatusCode] || `Status ${status}`;
}

// ============================================================================
// GL ACCOUNT BALANCE SIDE
// @see https://start.exactonline.nl/docs/HlpRestAPIResourcesDetails.aspx?name=FinancialGLAccounts
// ============================================================================

export const BalanceSide = {
  /** Debit - Balans (activa, passiva) */
  DEBIT: 'D',
  /** Credit - W&V (winst & verlies) */
  CREDIT: 'W',
} as const;

export type BalanceSideCode = typeof BalanceSide[keyof typeof BalanceSide];

export const BalanceSideLabels: Record<BalanceSideCode, string> = {
  [BalanceSide.DEBIT]: 'Balans',
  [BalanceSide.CREDIT]: 'Winst & Verlies',
};

// ============================================================================
// JOURNAL TYPE CODES
// @see https://start.exactonline.nl/docs/HlpRestAPIResourcesDetails.aspx?name=FinancialJournals
// ============================================================================

export const JournalType = {
  /** Bank/Kas */
  CASH_BANK: 10,
  /** Verkoop */
  SALES: 20,
  /** Inkoop */
  PURCHASE: 21,
  /** Memoriaal */
  GENERAL: 90,
} as const;

export type JournalTypeCode = typeof JournalType[keyof typeof JournalType];

export const JournalTypeLabels: Record<JournalTypeCode, string> = {
  [JournalType.CASH_BANK]: 'Bank/Kas',
  [JournalType.SALES]: 'Verkoop',
  [JournalType.PURCHASE]: 'Inkoop',
  [JournalType.GENERAL]: 'Memoriaal',
};

export function getJournalTypeLabel(type: number): string {
  return JournalTypeLabels[type as JournalTypeCode] || `Type ${type}`;
}
