/**
 * Exact Online API Types
 */

/**
 * Division (Administratie) from Exact Online
 */
export interface Division {
  Code: number;
  CustomerCode: string;
  Description: string;
  HID: number;
  Main: boolean;
  Country: string;
  Currency: string;
  Current: boolean;
  Customer: string;
  CustomerName: string;
  Status: number;
}

/**
 * Relation (Relatie) - Customer or Supplier
 */
export interface Relation {
  ID: string;
  Code: string;
  Name: string;
  AddressLine1: string | null;
  AddressLine2: string | null;
  AddressLine3: string | null;
  Postcode: string | null;
  City: string | null;
  Country: string | null;
  Phone: string | null;
  Email: string | null;
  IsSupplier: boolean;
  IsCustomer: boolean;
  Status: 'A' | 'S' | 'V'; // Active, Suspended, Inactive
  VATNumber: string | null;
  ChamberOfCommerce: string | null;
}

/**
 * Sales Invoice Header
 */
export interface SalesInvoice {
  InvoiceID: string;
  InvoiceNumber: number;
  OrderNumber: number | null;
  Customer: string;
  CustomerName: string;
  InvoiceDate: string;
  DueDate: string;
  Currency: string;
  AmountDC: number; // Amount in Division Currency
  VATAmountDC: number;
  Status: number;
  StatusDescription: string;
  PaymentCondition: string;
  PaymentConditionDescription: string;
  Journal: string;
  JournalDescription: string;
}

/**
 * Sales Invoice Line
 */
export interface SalesInvoiceLine {
  ID: string;
  InvoiceID: string;
  LineNumber: number;
  Item: string | null;
  ItemCode: string | null;
  ItemDescription: string | null;
  Description: string;
  Quantity: number;
  UnitPrice: number;
  AmountDC: number;
  VATAmountDC: number;
  VATPercentage: number;
  GLAccount: string;
  GLAccountDescription: string;
}

/**
 * Purchase Invoice Header
 */
export interface PurchaseInvoice {
  ID: string;
  InvoiceNumber: string;
  Supplier: string;
  SupplierName: string;
  InvoiceDate: string;
  DueDate: string;
  Currency: string;
  AmountDC: number;
  VATAmountDC: number;
  Status: number;
  StatusDescription: string;
  PaymentCondition: string;
  Journal: string;
  Source: 'OCR' | 'Manual' | 'Import';
}

/**
 * Bank Transaction
 */
export interface BankTransaction {
  ID: string;
  BankAccount: string;
  BankAccountCode: string;
  BankAccountName: string;
  Date: string;
  AmountDC: number;
  Description: string;
  EntryNumber: number;
  FinancialPeriod: number;
  FinancialYear: number;
  Status: number;
}

/**
 * Bank Account
 */
export interface BankAccount {
  ID: string;
  BankAccount: string;
  BankAccountHolderName: string;
  BankName: string;
  IBAN: string;
  Currency: string;
  GLAccount: string;
  Description: string;
}

// =============================================================================
// REPORTING TYPES
// =============================================================================

/**
 * Profit & Loss Overview item from Exact Online
 * Endpoint: /financial/ProfitLossOverview
 */
export interface ProfitLossOverviewItem {
  GLAccount: string;
  GLAccountCode: string;
  GLAccountDescription: string;
  Amount: number;
  AmountCredit: number;
  AmountDebit: number;
  ReportingYear: number;
  ReportingPeriod: number;
}

/**
 * Revenue list item from Exact Online
 * Endpoint: /financial/RevenueListByYear
 */
export interface RevenueListItem {
  GLAccount: string;
  GLAccountCode: string;
  GLAccountDescription: string;
  Amount: number;
  Year: number;
}

/**
 * Aging item for receivables/payables
 * Endpoints: /financial/AgingReceivablesList, /financial/AgingPayablesList
 */
export interface AgingItem {
  AccountId: string;
  AccountCode: string;
  AccountName: string;
  Amount: number;
  DaysOutstanding: number;
  CurrencyCode: string;
  AgeGroup?: number;
}

/**
 * Aging grouped by age
 * Endpoints: /read/financial/AgingReceivablesListByAgeGroup, AgingPayablesListByAgeGroup
 */
export interface AgingByAgeGroupItem {
  AgeGroup: number;
  AmountPayable: number;
  NumberOfInvoices: number;
  CurrencyCode: string;
}

/**
 * Transaction line from Exact Online
 * Endpoint: /financialtransaction/TransactionLines
 */
export interface TransactionLineItem {
  ID: string;
  Date: string;
  FinancialYear: number;
  FinancialPeriod: number;
  JournalCode: string;
  Description: string;
  GLAccount: string;
  GLAccountCode: string;
  GLAccountDescription: string;
  AmountDC: number;
  VATAmountDC: number;
  VATCode: string;
  VATPercentage: number;
  EntryNumber: number;
  InvoiceNumber: number | null;
  CostCenter: string | null;
  CostCenterDescription: string | null;
  CostUnit: string | null;
  CostUnitDescription: string | null;
}

/**
 * Reporting balance item from Exact Online
 * Endpoint: /read/financial/ReportingBalance
 */
export interface ReportingBalanceItem {
  GLAccount: string;
  GLAccountCode: string;
  GLAccountDescription: string;
  BalanceType: 'B' | 'W'; // B = Balance sheet, W = P&L (Note: API uses BalanceType, not BalanceSide)
  AmountDebit: number;
  AmountCredit: number;
  Amount: number;
  ReportingYear: number;
  ReportingPeriod: number;
}

/**
 * VAT code from Exact Online
 * Endpoint: /vat/VATCodes
 */
export interface VATCodeItem {
  Code: string;
  Description: string;
  VATPercentages: string; // JSON array as string
}

/**
 * Budget item from Exact Online
 * Endpoint: /budget/Budgets
 */
export interface BudgetItem {
  GLAccount: string;
  GLAccountCode: string;
  GLAccountDescription: string;
  AmountDC: number;
  ReportingYear: number;
  ReportingPeriod: number;
}

// =============================================================================
// INVOICE & FINANCIAL TYPES
// =============================================================================

/**
 * Sales Invoice with extended fields (from SalesInvoices endpoint)
 * Endpoint: /salesinvoice/SalesInvoices
 */
export interface SalesInvoiceExtended {
  InvoiceID: string;
  InvoiceNumber: number;
  InvoiceTo: string;
  InvoiceToName: string;
  InvoiceDate: string;
  DueDate: string;
  Currency: string;
  AmountDC: number;
  VATAmountDC: number;
  OutstandingAmountDC: number;
  Status: number;
  Description: string;
  PaymentConditionDescription: string;
}

/**
 * Purchase entry (inkoopfactuur) from Exact Online
 * Endpoint: /purchaseentry/PurchaseEntries
 */
export interface PurchaseEntryItem {
  EntryID: string;
  EntryNumber: number;
  Supplier: string;
  SupplierName: string;
  EntryDate: string;
  DueDate: string;
  Currency: string;
  AmountDC: number;
  VATAmountDC: number;
  Description: string;
  PaymentCondition: string;
}

/**
 * Receivable (debiteur) from Exact Online
 * Endpoint: /financial/ReceivablesList
 */
export interface ReceivableItem {
  AccountId: string;
  AccountCode: string;
  AccountName: string;
  Amount: number;
  CurrencyCode: string;
  Description: string;
  DueDate: string | null;
  EntryNumber: number;
  InvoiceDate: string | null;
  InvoiceNumber: number | null;
  YourRef: string | null;
}

/**
 * Payable (crediteur) from Exact Online
 * Endpoint: /financial/PayablesList
 */
export interface PayableItem {
  AccountId: string;
  AccountCode: string;
  AccountName: string;
  Amount: number;
  CurrencyCode: string;
  Description: string;
  DueDate: string | null;
  EntryNumber: number;
  InvoiceDate: string | null;
  InvoiceNumber: string | null;
  YourRef: string | null;
}

/**
 * Bank entry line from Exact Online
 * Endpoint: /financialtransaction/BankEntryLines
 */
export interface BankEntryLineItem {
  ID: string;
  Date: string;
  BankAccount: string;
  Description: string;
  AmountDC: number;
  GLAccount: string;
  GLAccountDescription: string;
}

/**
 * GL Account from Exact Online
 * Endpoint: /financial/GLAccounts
 */
export interface GLAccountItem {
  ID: string;
  Code: string;
  Description: string;
  BalanceSide: 'B' | 'W';
  BalanceType: string;
  TypeDescription: string;
}

// =============================================================================
// CRM & MASTER DATA TYPES
// =============================================================================

/**
 * CRM Account (klant/leverancier) from Exact Online
 * Endpoint: /crm/Accounts
 * Note: More detailed than the existing Relation interface
 */
export interface CRMAccountItem {
  ID: string;
  Code: string;
  Name: string;
  Email: string | null;
  Phone: string | null;
  City: string | null;
  Country: string | null;
  VATNumber: string | null;
  ChamberOfCommerce: string | null;
  IsCustomer: boolean;
  IsSupplier: boolean;
  Status: 'C' | 'P' | 'S'; // C = Customer, P = Prospect, S = Suspect (relationship type, NOT active/inactive!)
  Blocked: boolean; // true = blocked/inactive, false = active
  CreditLine: number | null;
}

/**
 * Item (artikel) from Exact Online
 * Endpoint: /logistics/Items
 */
export interface ItemRecord {
  ID: string;
  Code: string;
  Description: string;
  Type: number; // 1=Stock, 2=Service, 3=NonStock, 4=Serial, 5=Batch
  ItemGroup: string | null;
  ItemGroupDescription: string | null;
  IsOnline: boolean;
  IsSalesItem: boolean;
  IsPurchaseItem: boolean;
  IsStockItem: boolean;
  CostPriceStandard: number;
  SalesPrice: number;
  PurchasePrice: number;
  Unit: string | null;
  UnitDescription: string | null;
  Stock: number;
  Created: string;
  Modified: string;
}

/**
 * Stock position from Exact Online
 * Endpoint: /inventory/StockPositions
 */
export interface StockPositionItem {
  ID: string;
  ItemId: string;
  Item: string;
  ItemCode: string;
  ItemDescription: string;
  Warehouse: string | null;
  WarehouseCode: string | null;
  WarehouseDescription: string | null;
  InStock: number;
  Reserved: number;
  PlanningIn: number;
  PlanningOut: number;
  UnitCost: number;
}

// =============================================================================
// EXACT SALES INVOICE TYPES (for invoices.ts)
// =============================================================================

/**
 * Exact Sales Invoice (verkoopfactuur) from Exact Online
 * Endpoint: /salesinvoice/SalesInvoices
 * Used by: GetSalesInvoicesTool
 */
export interface ExactSalesInvoice {
  InvoiceID: string;
  InvoiceNumber: number;
  InvoiceTo: string;
  InvoiceToName: string;
  InvoiceDate: string;
  DueDate: string;
  Currency: string;
  AmountDC: number;
  VATAmountDC: number;
  OutstandingAmountDC: number;
  Status: number;
  Description: string;
  PaymentConditionDescription: string;
}

/**
 * Exact Sales Invoice Line (factuurregels) from Exact Online
 * Endpoint: /salesinvoice/SalesInvoiceLines
 */
export interface ExactSalesInvoiceLine {
  ID: string;
  InvoiceID: string;
  LineNumber: number;
  Item: string | null;
  ItemCode: string | null;
  ItemDescription: string | null;
  Description: string;
  Quantity: number;
  UnitPrice: number;
  AmountDC: number;
  VATAmountDC: number;
  VATPercentage: number;
  GLAccount: string;
  GLAccountDescription: string;
}

/**
 * Exact Purchase Invoice (inkoopfactuur) from Exact Online
 * Endpoint: /purchaseentry/PurchaseEntries
 * Used by: GetPurchaseInvoicesTool
 */
export interface ExactPurchaseInvoice {
  EntryID: string;
  EntryNumber: number;
  Supplier: string;
  SupplierName: string;
  EntryDate: string;
  DueDate: string;
  Currency: string;
  AmountDC: number;
  VATAmountDC: number;
  Description: string;
  PaymentCondition: string;
}

// =============================================================================
// EXACT FINANCIAL TYPES (for financial.ts)
// =============================================================================

/**
 * Exact GL Account (grootboekrekening) from Exact Online
 * Endpoint: /financial/GLAccounts
 * Used by: GetGLAccountsTool
 */
export interface ExactGLAccount {
  ID: string;
  Code: string;
  Description: string;
  BalanceSide: 'B' | 'W';
  BalanceType: string;
  TypeDescription: string;
}

/**
 * Exact Journal Entry (journaalpost) from Exact Online
 * Endpoint: /generaljournalentry/GeneralJournalEntries
 */
export interface ExactJournalEntry {
  EntryID: string;
  EntryNumber: number;
  Journal: string;
  JournalCode: string;
  JournalDescription: string;
  Date: string;
  FinancialYear: number;
  FinancialPeriod: number;
  Description: string;
  Currency: string;
  Status: number;
  StatusDescription: string;
}

/**
 * Exact Bank Entry (bankboeking) from Exact Online
 * Endpoint: /financialtransaction/BankEntryLines
 * Used by: GetBankTransactionsTool
 */
export interface ExactBankEntry {
  ID: string;
  Date: string;
  BankAccount: string;
  Description: string;
  AmountDC: number;
  GLAccount: string;
  GLAccountDescription: string;
}

// =============================================================================
// OUTSTANDING INVOICES RESULT TYPES (for invoices.ts)
// =============================================================================

/**
 * Mapped receivable item for output
 * Note: Some fields are optional because fallback method produces fewer fields
 */
export interface MappedReceivable {
  invoice_number: number | null;
  entry_number?: number;
  customer_code?: string;
  customer_name: string;
  invoice_date: string | undefined;
  due_date: string | undefined;
  amount: number;
  currency: string;
  description?: string;
  your_ref?: string | null;
  days_overdue: number;
  status: 'overdue' | 'pending';
}

/**
 * Mapped payable item for output
 * Note: Some fields are optional because fallback method produces fewer fields
 */
export interface MappedPayable {
  invoice_number?: string | null;
  entry_number: number;
  supplier_code?: string;
  supplier_name: string;
  invoice_date: string | undefined;
  due_date: string | undefined;
  amount: number;
  currency: string;
  description?: string;
  your_ref?: string | null;
  days_overdue: number;
  status: 'overdue' | 'pending';
}

/**
 * Outstanding invoices results structure
 */
export interface OutstandingInvoicesResult {
  receivables: MappedReceivable[];
  payables: MappedPayable[];
  summary: {
    total_receivable: number;
    total_payable: number;
    net_position: number;
    currency?: string;
  };
  count?: {
    receivables: number;
    payables: number;
  };
  filters?: {
    type: string;
    customer_id: string | undefined;
    supplier_id: string | undefined;
    overdue_only: boolean;
    min_days_overdue: number | undefined;
  };
  // Smart context for AI assistants
  suggestions?: (string | null)[];
  context?: {
    summary: string;
    net_position_meaning?: string;
    action_items?: string;
  };
  related_tools?: Array<{ tool: string; when: string }>;
}

/**
 * Fallback sales invoice response (when ReceivablesList not available)
 */
export interface FallbackSalesInvoice {
  InvoiceID: string;
  InvoiceNumber: number;
  InvoiceToName: string;
  InvoiceDate: string;
  DueDate: string;
  Currency: string;
  AmountDC: number;
  OutstandingAmountDC: number;
}

/**
 * Fallback purchase entry response (when PayablesList not available)
 */
export interface FallbackPurchaseEntry {
  EntryID: string;
  EntryNumber: number;
  SupplierName: string;
  EntryDate: string;
  DueDate: string;
  Currency: string;
  AmountDC: number;
}

// =============================================================================
// TRIAL BALANCE TYPES (for financial.ts)
// =============================================================================

/**
 * Trial balance entry for output
 */
export interface TrialBalanceEntry {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  balance: number;
}

// =============================================================================
// GENERIC ODATA RESPONSE WRAPPER
// =============================================================================

/**
 * Generic OData response wrapper for Exact Online API
 */
export interface ExactODataResponse<T> {
  d: {
    results: T[];
    __next?: string;
  };
}

// =============================================================================
// RELATIONS TYPES (for relations.ts)
// =============================================================================

/**
 * Exact Account (relatie/klant/leverancier) from Exact Online
 * Endpoint: /crm/Accounts
 * Used by: GetRelationsTool, SearchRelationsTool
 */
export interface ExactAccount {
  ID: string;
  Code: string;
  Name: string;
  Email: string | null;
  Phone: string | null;
  City: string | null;
  Country: string | null;
  VATNumber: string | null;
  ChamberOfCommerce: string | null;
  IsCustomer: boolean;
  IsSupplier: boolean;
  Status: 'C' | 'P' | 'S'; // C = Customer, P = Prospect, S = Suspect (relationship type, NOT active/inactive!)
  Blocked: boolean; // true = blocked/inactive, false = active
  CreditLine: number | null;
}

/**
 * Exact Contact (contactpersoon) from Exact Online
 * Endpoint: /crm/Contacts
 * Used by: GetContactsTool (future)
 */
export interface ExactContact {
  ID: string;
  Account: string;
  AccountName: string | null;
  FirstName: string | null;
  LastName: string | null;
  FullName: string | null;
  Email: string | null;
  Phone: string | null;
  Mobile: string | null;
  JobTitleDescription: string | null;
  IsMainContact: boolean;
}

// =============================================================================
// ITEMS & INVENTORY TYPES (for items.ts)
// =============================================================================

/**
 * Exact Item (artikel) from Exact Online
 * Endpoint: /logistics/Items
 * Used by: GetItemsTool
 */
export interface ExactItem {
  ID: string;
  Code: string;
  Description: string;
  Type: number; // 1=Stock, 2=Service, 3=NonStock, 4=Serial, 5=Batch
  ItemGroup: string | null;
  ItemGroupDescription: string | null;
  IsOnline: boolean;
  IsSalesItem: boolean;
  IsPurchaseItem: boolean;
  IsStockItem: boolean;
  CostPriceStandard: number;
  SalesPrice: number;
  PurchasePrice: number;
  Unit: string | null;
  UnitDescription: string | null;
  Stock: number;
  Created: string;
  Modified: string;
}

/**
 * Exact Item Group (artikelgroep) from Exact Online
 * Endpoint: /logistics/ItemGroups
 * Used by: GetItemGroupsTool (future)
 */
export interface ExactItemGroup {
  ID: string;
  Code: string;
  Description: string;
  GLCosts: string | null;
  GLRevenue: string | null;
  GLStock: string | null;
}

/**
 * Exact Stock Position (voorraadpositie) from Exact Online
 * Endpoint: /inventory/StockPositions
 * Used by: GetStockPositionsTool
 */
export interface ExactStockPosition {
  ID: string;
  ItemId: string;
  Item: string;
  ItemCode: string;
  ItemDescription: string;
  Warehouse: string | null;
  WarehouseCode: string | null;
  WarehouseDescription: string | null;
  InStock: number;
  Reserved: number;
  PlanningIn: number;
  PlanningOut: number;
  UnitCost: number;
}

// =============================================================================
// PROJECT TYPES (for projects.ts)
// =============================================================================

/**
 * Exact Project from Exact Online
 * Endpoint: /project/Projects
 * Used by: GetProjectsTool
 */
export interface ExactProject {
  ID: string;
  Code: string;
  Description: string;
  Account: string | null;
  AccountName: string | null;
  Type: number; // Per API docs: 1=Campaign, 2=Fixed Price, 3=Time&Material, 4=Non billable, 5=Prepaid
  TypeDescription: string | null;
  StartDate: string | null;
  EndDate: string | null;
  Manager: string | null;
  ManagerFullName: string | null; // Note: API may use lowercase 'n' (ManagerFullname) - handle both in code
  BudgetedAmount: number | null;
  BudgetedCosts: number | null;
  BudgetedHoursPerHourType: number | null;
  Status: number; // 0=Active, 1=Completed, 2=Archived
  Created: string;
  Modified: string;
}

/**
 * Exact Project WBS (Work Breakdown Structure element) from Exact Online
 * Endpoint: /project/ProjectWBS (if available) or derived from ProjectPlanning
 * Used by: GetProjectWBSTool (future)
 */
export interface ExactProjectWBS {
  ID: string;
  Project: string;
  ProjectCode: string | null;
  ProjectDescription: string | null;
  PartOf: string | null; // Parent WBS element
  Code: string;
  Description: string;
  Type: number;
  BudgetedAmount: number | null;
  BudgetedHours: number | null;
  StartDate: string | null;
  EndDate: string | null;
}

/**
 * Exact Time Transaction (urenregistratie) from Exact Online
 * Endpoint: /project/TimeTransactions
 * Used by: GetTimeTransactionsTool
 */
export interface ExactTimeTransaction {
  ID: string;
  Account: string | null;
  AccountName: string | null;
  Project: string | null;
  ProjectCode: string | null;
  ProjectDescription: string | null;
  Employee: string;
  EmployeeFullName: string | null; // May not be documented but often works
  Date: string;
  Hours: number; // Legacy - API actually uses Quantity
  Quantity?: number; // Per API docs: this is the actual hours field
  HourType: string | null; // May not be documented but often works
  HourTypeDescription: string | null;
  CostCenter: string | null; // May not be documented but often works
  CostCenterDescription: string | null;
  CostUnit: string | null;
  CostUnitDescription: string | null;
  Notes: string | null;
  Status: number; // Legacy - API actually uses HourStatus
  HourStatus?: number; // Per API docs: 1=Draft, 2=Rejected, 10=Submitted, 20=Final
  Created: string;
  Modified: string;
}

// =============================================================================
// PROJECT BILLING TYPES (SCOPE-002)
// =============================================================================

/**
 * Exact Project Invoice (projectfactuur) from Exact Online
 * Endpoint: /project/InvoiceTerms or /project/ProjectHourBudgets
 * Used by: GetProjectInvoicesTool
 */
export interface ExactProjectInvoice {
  ID: string;
  Project: string;
  ProjectCode: string | null;
  ProjectDescription: string | null;
  Account: string | null;
  AccountName: string | null;
  InvoiceDate: string | null;
  Amount: number;
  VATAmount: number | null;
  Description: string | null;
  Status: number; // Invoice status
}

/**
 * Exact Project WIP (Work In Progress) from Exact Online
 * Endpoint: /project/CostsByProject or derived from TimeTransactions
 * Used by: GetWIPOverviewTool
 */
export interface ExactProjectWIP {
  Project: string;
  ProjectCode: string | null;
  ProjectDescription: string | null;
  Account: string | null;
  AccountName: string | null;
  HoursBudgeted: number;
  HoursRealized: number;
  CostsBudgeted: number;
  CostsRealized: number;
  RevenueBudgeted: number;
  RevenueRealized: number;
}

// =============================================================================
// CURRENCY TYPES (SCOPE-003)
// =============================================================================

/**
 * Exact Currency from Exact Online
 * Endpoint: /financial/Currencies
 * Used by: GetCurrenciesTool
 */
export interface ExactCurrency {
  Code: string;
  Description: string;
  IsDefault: boolean;
  Symbol: string;
  Active: boolean;
}

/**
 * Exact Exchange Rate from Exact Online
 * Endpoint: /financial/ExchangeRates
 * Used by: GetCurrencyRatesTool
 */
export interface ExactExchangeRate {
  ID: string;
  SourceCurrency: string;
  TargetCurrency: string;
  StartDate: string;
  Rate: number;
  Created: string;
}

// =============================================================================
// COST CENTER TYPES (SCOPE-004)
// =============================================================================

/**
 * Exact Cost Center from Exact Online
 * Endpoint: /hrm/CostCenters
 * Used by: GetCostCentersTool
 */
export interface ExactCostCenter {
  ID: string;
  Code: string;
  Description: string;
  Active: boolean;
  Created: string;
  Modified: string;
}

/**
 * Cost Center Transaction from Exact Online
 * Endpoint: /financialtransaction/TransactionLines with CostCenter filter
 * Used by: GetCostCenterReportTool
 */
export interface ExactCostCenterTransaction {
  ID: string;
  Date: string;
  CostCenter: string;
  CostCenterDescription: string | null;
  GLAccount: string;
  GLAccountCode: string;
  GLAccountDescription: string;
  AmountDC: number;
  Description: string | null;
}

// =============================================================================
// FIXED ASSETS TYPES (SCOPE-005)
// =============================================================================

/**
 * Exact Fixed Asset (vast actief) from Exact Online
 * Endpoint: /assets/Assets
 * Used by: GetFixedAssetsTool
 */
export interface ExactFixedAsset {
  ID: string;
  Code: string;
  Description: string;
  AssetGroup: string | null;
  AssetGroupDescription: string | null;
  Status: number; // 10=Active, 20=Sold, 30=Scrapped
  StatusDescription: string | null;
  PurchaseDate: string | null;
  StartDateDepreciation: string | null;
  EndDateDepreciation: string | null;
  PurchaseValue: number;
  ResidualValue: number;
  DepreciationMethod: number; // 0=None, 10=Linear, 20=Declining
  DepreciationPercentage: number | null;
  AnnualDepreciationAmount: number;
  TotalDepreciation: number;
  BookValue: number;
  GLAccount: string | null;
  Supplier: string | null;
  SupplierName: string | null;
  InvoiceNumber: string | null;
  SerialNumber: string | null;
  Created: string;
  Modified: string;
}

/**
 * Exact Asset Depreciation (afschrijving) from Exact Online
 * Endpoint: /assets/DepreciationSchedules
 * Used by: GetDepreciationScheduleTool
 */
export interface ExactAssetDepreciation {
  ID: string;
  Asset: string;
  AssetCode: string | null;
  AssetDescription: string | null;
  FinancialYear: number;
  FinancialPeriod: number;
  Amount: number;
  AmountResidual: number;
}

// =============================================================================
// DOCUMENT TYPES (SCOPE-006)
// =============================================================================

/**
 * Exact Document Attachment from Exact Online
 * Endpoint: /documents/DocumentAttachments
 * Used by: GetDocumentAttachmentsTool
 */
export interface ExactDocumentAttachment {
  ID: string;
  Attachment: string; // Base64 or URL
  AttachmentFileName: string;
  AttachmentFileSize: number;
  AttachmentUrl: string | null;
  Document: string;
  FileName: string;
  FileSize: number;
  Created: string;
  Creator: string | null;
}

// =============================================================================
// CRM OPPORTUNITY TYPES (SCOPE-007)
// =============================================================================

/**
 * Exact Opportunity (verkoopkans) from Exact Online
 * Endpoint: /crm/Opportunities
 * Used by: GetOpportunitiesTool
 */
export interface ExactOpportunity {
  ID: string;
  Name: string;
  Account: string | null;
  AccountName: string | null;
  ActionDate: string | null;
  AmountDC: number;
  CloseDate: string | null;
  Created: string;
  Modified: string;
  Owner: string | null;
  OwnerFullName: string | null;
  Probability: number; // 0-100
  Stage: string | null;
  StageDescription: string | null;
  Status: number; // 1=Open, 2=Won, 3=Lost
  StatusDescription: string | null;
  ReasonCode: string | null;
  ReasonCodeDescription: string | null;
  Campaign: string | null;
  CampaignDescription: string | null;
  Notes: string | null;
}

// =============================================================================
// CONTRACT TYPES (SCOPE-009)
// =============================================================================

/**
 * Exact Sales Contract from Exact Online
 * Endpoint: /salesorder/SalesOrderHeaders with Type=Contract
 * Used by: GetSalesContractsTool
 */
export interface ExactSalesContract {
  ID: string;
  Number: number;
  Account: string;
  AccountName: string | null;
  Description: string | null;
  Currency: string;
  AmountDC: number;
  Status: number;
  StatusDescription: string | null;
  StartDate: string | null;
  EndDate: string | null;
  InvoiceTo: string | null;
  InvoiceToName: string | null;
  PaymentCondition: string | null;
  PaymentConditionDescription: string | null;
  Created: string;
  Modified: string;
}

/**
 * Exact Purchase Contract from Exact Online
 * Endpoint: /purchaseorder/PurchaseOrders with Type=Contract
 * Used by: GetPurchaseContractsTool
 */
export interface ExactPurchaseContract {
  ID: string;
  Number: number;
  Supplier: string;
  SupplierName: string | null;
  Description: string | null;
  Currency: string;
  AmountDC: number;
  Status: number;
  StatusDescription: string | null;
  StartDate: string | null;
  EndDate: string | null;
  PaymentCondition: string | null;
  PaymentConditionDescription: string | null;
  Created: string;
  Modified: string;
}

// =============================================================================
// PRICE LIST TYPES (SCOPE-010)
// =============================================================================

/**
 * Exact Sales Price (verkoopprijs) from Exact Online
 * Endpoint: /logistics/SalesItemPrices
 * Used by: GetSalesPricesTool
 */
export interface ExactSalesPrice {
  ID: string;
  Item: string;
  ItemCode: string | null;
  ItemDescription: string | null;
  Account: string | null;
  AccountName: string | null;
  Currency: string;
  DefaultItemUnit: string | null;
  DefaultItemUnitDescription: string | null;
  NumberOfItemPerUnit: number;
  Price: number;
  Quantity: number;
  StartDate: string | null;
  EndDate: string | null;
  Created: string;
  Modified: string;
}

/**
 * Exact Purchase Price (inkoopprijs) from Exact Online
 * Endpoint: /logistics/SupplierItem
 * Used by: GetPurchasePricesTool
 */
export interface ExactPurchasePrice {
  ID: string;
  Item: string;
  ItemCode: string | null;
  ItemDescription: string | null;
  Supplier: string;
  SupplierName: string | null;
  Currency: string;
  PurchasePrice: number;
  PurchaseLeadTime: number | null;
  MinimumQuantity: number | null;
  MainSupplier: boolean;
  Created: string;
  Modified: string;
}
