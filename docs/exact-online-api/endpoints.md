# Exact Online API Endpoints Reference

Complete list of all REST API endpoints organized by category.

**Total: 300+ endpoints across 40+ services**

## Legend

- `GET` - Retrieve records
- `POST` - Create records
- `PUT` - Update records
- `DELETE` - Delete records

---

## Accountancy

Accountant-specific features and client management.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `accountancy/AccountInvolvedAccounts` | GET, POST, PUT, DELETE | Accounts involved with accountancy |
| `accountancy/AccountOwners` | GET, POST, PUT, DELETE | Account ownership |
| `accountancy/InvolvedUserRoles` | GET, POST, PUT, DELETE | User roles for involved users |
| `accountancy/InvolvedUsers` | GET, POST, PUT, DELETE | Users involved with accounts |
| `accountancy/SolutionLinks` | GET, POST, PUT, DELETE | Solution links |
| `accountancy/TaskTypes` | GET, POST, PUT, DELETE | Types of tasks |

---

## Activities

CRM activities, tasks, and service management.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `activities/CommunicationNotes` | GET, POST | Communication notes |
| `activities/Complaints` | GET, POST | Customer complaints |
| `activities/Events` | GET, POST | Calendar events |
| `activities/ServiceRequests` | GET, POST | Service requests |
| `activities/Tasks` | GET, POST | Tasks |

---

## Assets

Fixed assets management.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `assets/AssetGroups` | GET | Asset groups |
| `assets/Assets` | GET | Fixed assets |
| `assets/DepreciationMethods` | GET, POST, PUT, DELETE | Depreciation methods |

---

## Budget

Budget management and scenarios.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `budget/Budgets` | GET | Budget data |
| `budget/BudgetScenarios` | GET | Budget scenarios (BETA) |

---

## Bulk

High-volume data retrieval (returns up to 1000 records per page).

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `bulk/Documents/DocumentAttachments` | GET | Bulk document attachments |
| `bulk/Documents/Documents` | GET | Bulk documents |
| `bulk/Financial/TransactionLines` | GET | Bulk transaction lines |

---

## Cashflow

Banking, payments, and cash management.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `cashflow/Banks` | GET | Bank definitions |
| `cashflow/DirectDebitMandates` | GET, POST, PUT, DELETE | Direct debit mandates |
| `cashflow/PaymentConditions` | GET, POST | Payment terms |
| `cashflow/Payments` | GET | Payments |
| `cashflow/ProcessPayments` | POST | Process payment batches |
| `cashflow/Receivables` | GET | Receivables |

---

## ContinuousMonitoring (BETA)

Monitoring and analytics indicators.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `continuousmonitoring/IndicatorBalances` | GET, POST, PUT, DELETE | Balance indicators |
| `continuousmonitoring/IndicatorDeviatingAmountEntereds` | GET, POST, PUT, DELETE | Amount deviation indicators |
| `continuousmonitoring/IndicatorDifferenceByPeriods` | GET, POST, PUT, DELETE | Period difference indicators |
| `continuousmonitoring/IndicatorDifferentVatCodes` | GET, POST, PUT, DELETE | VAT code difference indicators |
| `continuousmonitoring/IndicatorGLAccounts` | GET, POST, DELETE | GL account indicators |
| `continuousmonitoring/IndicatorLiquidities` | GET, POST, PUT, DELETE | Liquidity indicators |
| `continuousmonitoring/IndicatorSignals` | GET | Signal indicators |
| `continuousmonitoring/IndicatorStates` | GET | State indicators |
| `continuousmonitoring/IndicatorUsageOfJournals` | GET, POST, PUT, DELETE | Journal usage indicators |

---

## CRM

Customer Relationship Management.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `crm/AcceptQuotation` | POST | Accept a quotation |
| `crm/AccountClasses` | GET | Account classifications |
| `crm/AccountClassificationNames` | GET | Classification names |
| `crm/AccountClassifications` | GET | Classification assignments |
| `crm/AccountDocuments` | GET | Documents linked to accounts |
| `crm/AccountDocumentsCount` | GET | Count of account documents |
| `crm/Accounts` | GET, POST, PUT, DELETE | **Customers/Suppliers** |
| `crm/Addresses` | GET, POST, PUT, DELETE | Addresses |
| `crm/AddressStates` | GET | Address states/provinces |
| `crm/BankAccounts` | GET, POST, PUT, DELETE | Bank accounts for relations |
| `crm/Contacts` | GET, POST, PUT, DELETE | Contact persons |
| `crm/DefaultAddressForAccount` | GET | Default address for account |
| `crm/Documents` | GET | CRM documents |
| `crm/DocumentsAttachments` | GET | CRM document attachments |
| `crm/Opportunities` | GET, POST, PUT, DELETE | Sales opportunities |
| `crm/OpportunityContacts` | GET | Contacts linked to opportunities |
| `crm/OpportunityDocuments` | GET | Documents linked to opportunities |
| `crm/OpportunityDocumentsCount` | GET | Count of opportunity documents |
| `crm/PrintQuotation` | POST | Print a quotation |
| `crm/QuotationLines` | GET, POST, PUT, DELETE | Quotation line items |
| `crm/Quotations` | GET, POST, PUT, DELETE | Quotations |
| `crm/ReasonCodes` | GET | Reason codes |
| `crm/RejectQuotation` | POST | Reject a quotation |
| `crm/ReopenQuotation` | POST | Reopen a quotation |
| `crm/ReviewQuotation` | POST | Review a quotation |

---

## Documents

Document management system.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `documents/DocumentAttachments` | GET, POST, PUT, DELETE | Document attachments |
| `documents/DocumentCategories` | GET | Document categories |
| `documents/DocumentFolders` | GET, POST, PUT, DELETE | Document folders |
| `documents/Documents` | GET, POST, PUT, DELETE | Documents |
| `documents/DocumentTypeCategories` | GET | Document type categories |
| `documents/DocumentTypeFolders` | GET, POST, PUT, DELETE | Document type folders |
| `documents/DocumentTypes` | GET | Document types |

---

## Financial

Core financial management.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `financial/AgingOverview` | GET | Aging overview |
| `financial/AgingOverviewByAccount` | GET | Aging by account |
| `financial/AgingPayablesList` | GET | Payables aging list |
| `financial/AgingPayablesListByAgeGroup` | GET | Payables by age group |
| `financial/AgingReceivablesList` | GET | Receivables aging list |
| `financial/AgingReceivablesListByAgeGroup` | GET | Receivables by age group |
| `financial/ExchangeRates` | GET, POST, PUT, DELETE | Currency exchange rates |
| `financial/FinancialPeriods` | GET | Financial periods |
| `financial/GLAccounts` | GET, POST, PUT, DELETE | **General Ledger accounts** |
| `financial/GLClassifications` | GET | GL classifications |
| `financial/GLSchemes` | GET | GL schemes |
| `financial/GLTransactionTypes` | GET | Transaction types |
| `financial/JournalStatusByFinancialPeriod` | GET | Journal status by period |
| `financial/JournalStatusList` | GET | Journal status list |
| `financial/Journals` | GET, POST, PUT, DELETE | **Journals** |
| `financial/OutstandingInvoicesOverview` | GET | Outstanding invoices overview |
| `financial/PayablesList` | GET | Payables list |
| `financial/PayablesListByAccount` | GET | Payables by account |
| `financial/PayablesListByAccountAndAgeGroup` | GET | Payables by account and age |
| `financial/PayablesListByAgeGroup` | GET | Payables by age group |
| `financial/ProfitLossOverview` | GET | Profit/Loss overview |
| `financial/ReceivablesList` | GET | Receivables list |
| `financial/ReceivablesListByAccount` | GET | Receivables by account |
| `financial/ReceivablesListByAccountAndAgeGroup` | GET | Receivables by account and age |
| `financial/ReceivablesListByAgeGroup` | GET | Receivables by age group |
| `financial/ReportingBalance` | GET | Reporting balance |
| `financial/Returns` | GET | Returns |
| `financial/RevenueList` | GET | Revenue list |
| `financial/RevenueListByYear` | GET | Revenue by year |
| `financial/RevenueListByYearAndStatus` | GET | Revenue by year and status |

---

## FinancialTransaction

Transaction entries.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `financialtransaction/BankEntries` | GET, POST | **Bank entries** |
| `financialtransaction/BankEntryLines` | GET, POST | Bank entry lines |
| `financialtransaction/CashEntries` | GET, POST | Cash entries |
| `financialtransaction/CashEntryLines` | GET, POST | Cash entry lines |
| `financialtransaction/TransactionLines` | GET | Transaction lines |
| `financialtransaction/Transactions` | GET | Transactions |

---

## General

General system data.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `general/Currencies` | GET | Currency definitions |

---

## GeneralJournalEntry

Manual journal entries.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `generaljournalentry/GeneralJournalEntries` | GET, POST | Journal entries |
| `generaljournalentry/GeneralJournalEntryLines` | GET, POST | Journal entry lines |

---

## HRM

Human Resource Management.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `hrm/AbsenceRegistrations` | GET | Absence registrations |
| `hrm/AbsenceRegistrationTransactions` | GET | Absence transactions |
| `hrm/Costcenters` | GET, POST, PUT, DELETE | Cost centers |
| `hrm/Costunits` | GET, POST, PUT, DELETE | Cost units |
| `hrm/Departments` | GET | Departments |
| `hrm/Divisions` | GET | Divisions (same as System) |
| `hrm/JobGroups` | GET | Job groups |
| `hrm/JobTitles` | GET | Job titles |
| `hrm/LeaveRegistrations` | GET | Leave registrations |
| `hrm/Schedules` | GET | Work schedules |

---

## Inventory

Stock and warehouse management.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `inventory/BatchNumbers` | GET | Batch numbers |
| `inventory/ItemWarehousePlanningDetails` | GET | Warehouse planning details |
| `inventory/ItemWarehouses` | GET, POST, PUT, DELETE | Item warehouse assignments |
| `inventory/ItemWarehouseStorageLocations` | GET | Storage locations by item |
| `inventory/ProcessStockCount` | POST | Process stock count |
| `inventory/SerialNumbers` | GET | Serial numbers |
| `inventory/StockBatchNumbers` | GET, POST, DELETE | Stock batch numbers |
| `inventory/StockCountLines` | GET, POST, PUT, DELETE | Stock count lines |
| `inventory/StockCounts` | GET, POST, PUT, DELETE | Stock counts |
| `inventory/StockSerialNumbers` | GET, POST, DELETE | Stock serial numbers |
| `inventory/StorageLocations` | GET | Storage locations |
| `inventory/Warehouses` | GET, POST, PUT, DELETE | Warehouses |

---

## Logistics

Items, pricing, and logistics.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `logistics/AccountItems` | GET | Account-specific items |
| `logistics/ItemDetailsByID` | GET | Item details by ID |
| `logistics/ItemGroups` | GET | Item groups |
| `logistics/Items` | GET, POST, PUT, DELETE | **Items/Products** |
| `logistics/ItemVersions` | GET | Item versions |
| `logistics/SalesItemPrice` | GET | Sales item price |
| `logistics/SalesItemPrices` | GET, POST, PUT, DELETE | Sales item prices |
| `logistics/StockPosition` | GET | Current stock position |
| `logistics/SupplierItem` | GET, POST, PUT, DELETE | Supplier-item links (**Edition restricted!**) |
| `logistics/Units` | GET | Units of measure |

> **Note:** `logistics/SupplierItem` requires Manufacturing or Wholesale Distribution edition. Returns 403 Forbidden in standard editions. Use `logistics/Items` with `PurchasePrice` field as alternative.

---

## Mailbox

Email integration.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `mailbox/DefaultMailbox` | GET | Default mailbox |
| `mailbox/Mailboxes` | GET, POST, PUT, DELETE | Mailboxes |
| `mailbox/MailMessageAttachments` | GET, POST | Mail attachments |
| `mailbox/MailMessagesReceived` | GET | Received messages |
| `mailbox/MailMessagesSent` | GET, POST | Sent messages |
| `mailbox/PreferredMailbox` | GET | Preferred mailbox |
| `mailbox/PreferredMailboxForOperation` | GET | Preferred mailbox for operation |

---

## Manufacturing

Production management.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `manufacturing/ByProductReceipts` | GET, POST | By-product receipts |
| `manufacturing/ByProductReversals` | GET, POST | By-product reversals |
| `manufacturing/MaterialIssues` | GET, POST | Material issues |
| `manufacturing/MaterialReversals` | GET, POST | Material reversals |
| `manufacturing/OperationResources` | GET, POST, PUT, DELETE | Operation resources |
| `manufacturing/Operations` | GET, POST, PUT, DELETE | Operations |
| `manufacturing/ProductionAreas` | GET, POST, PUT, DELETE | Production areas |
| `manufacturing/ShopOrderMaterialPlans` | GET, POST, PUT, DELETE | Material plans |
| `manufacturing/ShopOrderReceipts` | GET, POST | Shop order receipts |
| `manufacturing/ShopOrderReversals` | GET, POST | Shop order reversals |
| `manufacturing/ShopOrderRoutingStepPlans` | GET, POST, PUT, DELETE | Routing step plans |
| `manufacturing/ShopOrders` | GET, POST, PUT, DELETE | **Shop orders** |
| `manufacturing/SubOrderReceipts` | GET, POST | Sub-order receipts |
| `manufacturing/SubOrderReversals` | GET, POST | Sub-order reversals |
| `manufacturing/TimeTransactions` | GET, POST, PUT, DELETE | Time transactions |
| `manufacturing/Workcenters` | GET, POST, PUT, DELETE | Work centers |

---

## OpeningBalance

Opening balance management.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `openingbalance/CurrentYear/AfterEntry` | GET | Current year after entry |
| `openingbalance/CurrentYear/Processed` | GET | Current year processed |
| `openingbalance/PreviousYear/AfterEntry` | GET | Previous year after entry |
| `openingbalance/PreviousYear/Processed` | GET | Previous year processed |

---

## Payroll

Payroll management.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `payroll/ActiveEmployments` | GET | Active employments |
| `payroll/Employees` | GET | Employees |
| `payroll/EmploymentContractFlexPhases` | GET | Contract flex phases |
| `payroll/EmploymentContracts` | GET | Employment contracts |
| `payroll/EmploymentEndReasons` | GET | End reasons |
| `payroll/EmploymentOrganizations` | GET | Organizations |
| `payroll/Employments` | GET | Employments |
| `payroll/EmploymentSalaries` | GET | Salaries |
| `payroll/TaxEmploymentEndFlexCodes` | GET | Tax flex codes |

---

## Project

Project management and time tracking.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `project/CostEntryExpensesByProject` | GET | Cost expenses by project |
| `project/CostEntryRecentAccounts` | GET | Recent cost accounts |
| `project/CostEntryRecentAccountsByProject` | GET | Recent accounts by project |
| `project/CostEntryRecentCostTypes` | GET | Recent cost types |
| `project/CostEntryRecentCostTypesByProject` | GET | Recent cost types by project |
| `project/CostEntryRecentExpensesByProject` | GET | Recent expenses by project |
| `project/CostEntryRecentProjects` | GET | Recent cost entry projects |
| `project/CostsByDate` | GET | Costs by date |
| `project/CostsById` | GET | Costs by ID |
| `project/CostTransactions` | GET, POST, PUT, DELETE | Cost transactions |
| `project/CostTypes` | GET | Cost types |
| `project/HourCostTypes` | GET | Hour cost types |
| `project/HourEntryActivitiesByProject` | GET | Hour activities by project |
| `project/HourEntryRecentAccounts` | GET | Recent hour accounts |
| `project/HourEntryRecentAccountsByProject` | GET | Recent accounts by project |
| `project/HourEntryRecentActivitiesByProject` | GET | Recent activities by project |
| `project/HourEntryRecentHourTypes` | GET | Recent hour types |
| `project/HourEntryRecentHourTypesByProject` | GET | Recent hour types by project |
| `project/HourEntryRecentProjects` | GET | Recent hour projects |
| `project/HoursByDate` | GET | Hours by date |
| `project/HoursById` | GET | Hours by ID |
| `project/HourTypes` | GET | Hour types |
| `project/InvoiceTerms` | GET, POST, PUT, DELETE | Invoice terms |
| `project/ProjectBudgetTypes` | GET | Project budget types |
| `project/ProjectHourBudgets` | GET, POST, PUT, DELETE | Hour budgets |
| `project/ProjectPlanning` | GET, POST, PUT, DELETE | Project planning |
| `project/ProjectPlanningRecurring` | GET, POST, PUT, DELETE | Recurring planning |
| `project/ProjectRestrictionEmployees` | GET, POST, PUT, DELETE | Employee restrictions |
| `project/ProjectRestrictionItems` | GET, POST, PUT, DELETE | Item restrictions |
| `project/ProjectRestrictionRebillings` | GET, POST, PUT, DELETE | Rebilling restrictions |
| `project/Projects` | GET, POST, PUT, DELETE | **Projects** |
| `project/TimeAndBillingAccountDetails` | GET | Account details |
| `project/TimeAndBillingActivitiesAndExpenses` | GET | Activities and expenses |
| `project/TimeAndBillingEntryAccounts` | GET | Entry accounts |
| `project/TimeAndBillingEntryProjects` | GET | Entry projects |
| `project/TimeCorrections` | GET, POST, PUT, DELETE | Time corrections |
| `project/TimeTransactions` | GET, POST, PUT, DELETE | Time transactions |

---

## Purchase

Purchase management.

### PurchaseEntry

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `purchaseentry/PurchaseEntries` | GET, POST, PUT, DELETE | **Purchase entries** |
| `purchaseentry/PurchaseEntryLines` | GET, POST, PUT, DELETE | Purchase entry lines |

### PurchaseOrder

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `purchaseorder/GoodsReceiptLines` | GET, POST | Goods receipt lines |
| `purchaseorder/GoodsReceipts` | GET, POST | Goods receipts |
| `purchaseorder/PurchaseOrderLines` | GET, POST, DELETE | Purchase order lines |
| `purchaseorder/PurchaseOrders` | GET, POST, DELETE | **Purchase orders** |

---

## Sales

Sales management.

### Sales

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `sales/PriceLists` | GET | Price lists |
| `sales/SalesPriceListDetails` | GET | Price list details |
| `sales/ShippingMethods` | GET | Shipping methods |

### SalesEntry

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `salesentry/SalesEntries` | GET, POST, PUT, DELETE | **Sales entries** |
| `salesentry/SalesEntryLines` | GET, POST, PUT, DELETE | Sales entry lines |

### SalesInvoice

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `salesinvoice/InvoiceSalesOrders` | POST | Invoice sales orders |
| `salesinvoice/Layouts` | GET | Invoice layouts |
| `salesinvoice/PrintedSalesInvoices` | POST | Print sales invoices |
| `salesinvoice/SalesInvoiceLines` | GET, POST, PUT, DELETE | **Invoice lines** |
| `salesinvoice/SalesInvoices` | GET, POST, PUT, DELETE | **Sales invoices** |
| `salesinvoice/SalesOrderID` | POST | Sales order by ID |

### SalesOrder

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `salesorder/GoodsDeliveries` | GET, POST, PUT | Goods deliveries |
| `salesorder/GoodsDeliveryLines` | GET, POST, PUT | Delivery lines |
| `salesorder/PrintedSalesOrders` | POST | Print sales orders |
| `salesorder/SalesOrderLines` | GET, POST, PUT, DELETE | **Order lines** |
| `salesorder/SalesOrders` | GET, POST, PUT, DELETE | **Sales orders** |

---

## Subscription

Recurring invoicing.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `subscription/SubscriptionLines` | GET, POST, PUT, DELETE | Subscription lines |
| `subscription/SubscriptionLineTypes` | GET | Line types |
| `subscription/SubscriptionReasonCodes` | GET | Reason codes |
| `subscription/SubscriptionRestrictionEmployees` | GET, POST, DELETE | Employee restrictions |
| `subscription/SubscriptionRestrictionItems` | GET, POST, DELETE | Item restrictions |
| `subscription/Subscriptions` | GET, POST, PUT, DELETE | **Subscriptions** |
| `subscription/SubscriptionTypes` | GET | Subscription types |

---

## System

System information.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `system/AccountantInfo` | GET | Accountant information |
| `system/AvailableFeatures` | GET | Available features |
| `system/Divisions` | GET | **Divisions (administraties)** |
| `system/GetMostRecentlyUsedDivisions` | GET | Recent divisions |
| `system/Me` | GET | **Current user info** |

---

## Users

User management.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `users/UserHasRights` | GET | Check user rights |
| `users/UserRoles` | GET | User roles |
| `users/UserRolesPerDivision` | GET | Roles per division |
| `users/Users` | GET | Users |

---

## VAT

Tax management.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `vat/VATCodes` | GET, POST, PUT, DELETE | **VAT codes** |
| `vat/VatPercentages` | GET | VAT percentages |

---

## Workflow (BETA)

Workflow management.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `workflow/RequestAttachments` | GET | Request attachments |

---

## Notes

1. **Edition Restrictions**: Some endpoints are only available in certain Exact Online editions (Manufacturing, Professional, etc.)
2. **BETA Features**: Endpoints marked BETA may change without notice
3. **Bulk Endpoints**: Use `bulk/*` endpoints for large data exports (1000 records/page vs 60)
4. **Required Fields**: Check the official documentation for required fields when POSTing
