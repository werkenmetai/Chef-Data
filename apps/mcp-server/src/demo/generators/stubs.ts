/**
 * Demo Generators: Stub responses for remaining tools
 *
 * These return empty or minimal responses to prevent fallback to real API.
 * Tools that are less commonly used for demo purposes.
 */

import { getCurrentIndustryConfig } from '../context';

// ============================================
// PROJECTS & TIME TRACKING
// ============================================

/**
 * get_projects - Bakkerij heeft geen project-based business
 */
export function generateGetProjectsResponse(_params: Record<string, unknown>): unknown {
  return {
    message: `Geen projecten gevonden voor ${getCurrentIndustryConfig().company.name}`,
    count: 0,
    projects: [],
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      note: 'Bakkerij De Gouden Croissant werkt niet met projectadministratie. Dit is typisch voor retail/productie bedrijven.',
    },
    related_tools: [
      { tool: 'get_sales_orders', when: 'Voor orderoverzicht' },
    ],
  };
}

/**
 * get_time_transactions - Geen urenregistratie
 */
export function generateGetTimeTransactionsResponse(_params: Record<string, unknown>): unknown {
  return {
    message: `Geen uren geregistreerd voor ${getCurrentIndustryConfig().company.name}`,
    count: 0,
    time_entries: [],
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      note: 'Bakkerij personeel werkt niet met project-uren. Salarissen worden maandelijks verwerkt.',
    },
  };
}

/**
 * get_project_invoices - Geen projectfacturen
 */
export function generateGetProjectInvoicesResponse(_params: Record<string, unknown>): unknown {
  return {
    message: `Geen projectfacturen gevonden`,
    count: 0,
    invoices: [],
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      note: 'Geen projectadministratie actief.',
    },
    related_tools: [
      { tool: 'get_sales_invoices', when: 'Voor reguliere verkoopfacturen' },
    ],
  };
}

/**
 * get_wip_overview - Geen onderhanden werk
 */
export function generateGetWIPOverviewResponse(_params: Record<string, unknown>): unknown {
  return {
    message: `Geen onderhanden werk`,
    count: 0,
    wip_items: [],
    total_wip_value: 0,
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      note: 'Bakkerij heeft geen onderhanden projectwerk. Producten worden direct verkocht.',
    },
  };
}

// ============================================
// CURRENCIES
// ============================================

/**
 * get_currencies - Only EUR
 */
export function generateGetCurrenciesResponse(_params: Record<string, unknown>): unknown {
  return {
    currencies: [
      {
        code: 'EUR',
        description: 'Euro',
        is_default: true,
        symbol: '€',
      },
    ],
    count: 1,
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      note: 'Bakkerij opereert alleen in EUR (Nederlandse markt).',
    },
  };
}

/**
 * get_currency_rates - No foreign currencies
 */
export function generateGetCurrencyRatesResponse(_params: Record<string, unknown>): unknown {
  return {
    message: 'Geen valutakoersen nodig - alleen EUR transacties',
    rates: [],
    base_currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      note: 'Bakkerij heeft geen buitenlandse transacties.',
    },
  };
}

// ============================================
// COST CENTERS
// ============================================

/**
 * get_cost_centers - Simple bakery cost centers
 */
export function generateGetCostCentersResponse(_params: Record<string, unknown>): unknown {
  return {
    cost_centers: [
      { code: 'PROD', description: 'Productie', is_active: true },
      { code: 'VERK', description: 'Verkoop', is_active: true },
      { code: 'ALG', description: 'Algemeen', is_active: true },
    ],
    count: 3,
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      note: 'Simpele kostenplaats structuur voor MKB bakkerij.',
    },
  };
}

/**
 * get_cost_center_report - Basic report
 */
export function generateGetCostCenterReportResponse(_params: Record<string, unknown>): unknown {
  return {
    report: [
      { cost_center: 'PROD', description: 'Productie', budget: 150000, actual: 145000, variance: -5000 },
      { cost_center: 'VERK', description: 'Verkoop', budget: 50000, actual: 48000, variance: -2000 },
      { cost_center: 'ALG', description: 'Algemeen', budget: 30000, actual: 28500, variance: -1500 },
    ],
    totals: {
      budget: 230000,
      actual: 221500,
      variance: -8500,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: 'Kosten EUR 8.500 onder budget - goed kostenbeheer.',
    },
  };
}

// ============================================
// FIXED ASSETS
// ============================================

/**
 * get_fixed_assets - Bakery equipment
 */
export function generateGetFixedAssetsResponse(_params: Record<string, unknown>): unknown {
  return {
    assets: [
      {
        id: 'asset-001',
        code: 'OVEN-001',
        description: 'Industriële bakoven',
        category: 'Machines',
        purchase_date: '2020-03-15',
        purchase_value: 45000,
        current_value: 27000,
        depreciation_method: 'Lineair',
        useful_life_years: 10,
      },
      {
        id: 'asset-002',
        code: 'MIXER-001',
        description: 'Deegmixer 50L',
        category: 'Machines',
        purchase_date: '2021-06-01',
        purchase_value: 12000,
        current_value: 8400,
        depreciation_method: 'Lineair',
        useful_life_years: 10,
      },
      {
        id: 'asset-003',
        code: 'KOEL-001',
        description: 'Walk-in koelcel',
        category: 'Machines',
        purchase_date: '2019-01-10',
        purchase_value: 18000,
        current_value: 9000,
        depreciation_method: 'Lineair',
        useful_life_years: 10,
      },
      {
        id: 'asset-004',
        code: 'BUS-001',
        description: 'Bestelbus Mercedes Sprinter',
        category: 'Vervoermiddelen',
        purchase_date: '2022-09-01',
        purchase_value: 32000,
        current_value: 24000,
        depreciation_method: 'Lineair',
        useful_life_years: 8,
      },
    ],
    count: 4,
    totals: {
      purchase_value: 107000,
      current_value: 68400,
      accumulated_depreciation: 38600,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: 'Vaste activa EUR 68.400 boekwaarde. Hoofdzakelijk bakkerij equipment.',
    },
  };
}

/**
 * get_depreciation_schedule - Depreciation forecast
 */
export function generateGetDepreciationScheduleResponse(_params: Record<string, unknown>): unknown {
  const currentYear = new Date().getFullYear();
  return {
    schedule: [
      { year: currentYear, depreciation: 15000, remaining_value: 53400 },
      { year: currentYear + 1, depreciation: 15000, remaining_value: 38400 },
      { year: currentYear + 2, depreciation: 15000, remaining_value: 23400 },
      { year: currentYear + 3, depreciation: 15000, remaining_value: 8400 },
      { year: currentYear + 4, depreciation: 8400, remaining_value: 0 },
    ],
    totals: {
      current_value: 68400,
      annual_depreciation: 15000,
      years_remaining: 5,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: 'Jaarlijkse afschrijving EUR 15.000. Volledige afschrijving in 5 jaar.',
    },
  };
}

// ============================================
// DOCUMENTS
// ============================================

/**
 * get_document_attachments - Sample attachments
 */
export function generateGetDocumentAttachmentsResponse(_params: Record<string, unknown>): unknown {
  return {
    attachments: [
      {
        id: 'doc-001',
        filename: 'factuur-2024001.pdf',
        file_type: 'application/pdf',
        size_bytes: 125000,
        created_date: '2024-01-15',
        entity_type: 'SalesInvoice',
        entity_id: 'sinv-001',
      },
      {
        id: 'doc-002',
        filename: 'inkoopfactuur-meelgroothandel.pdf',
        file_type: 'application/pdf',
        size_bytes: 98000,
        created_date: '2024-01-20',
        entity_type: 'PurchaseInvoice',
        entity_id: 'pinv-001',
      },
    ],
    count: 2,
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      note: 'Demo bijlagen - download niet beschikbaar in demo mode.',
    },
  };
}

// ============================================
// OPPORTUNITIES / CRM
// ============================================

/**
 * get_opportunities - Simple bakery opportunities
 */
export function generateGetOpportunitiesResponse(_params: Record<string, unknown>): unknown {
  return {
    opportunities: [
      {
        id: 'opp-001',
        name: 'NH Hotel Schiphol - Jaarcontract',
        customer_name: 'NH Hotel Schiphol',
        stage: 'Offerte',
        probability: 60,
        expected_revenue: 54000,
        expected_close_date: '2024-03-15',
      },
      {
        id: 'opp-002',
        name: 'Zuidas Kantoren - Catering uitbreiding',
        customer_name: 'Kantoorcomplex Zuidas',
        stage: 'Onderhandeling',
        probability: 75,
        expected_revenue: 33600,
        expected_close_date: '2024-02-28',
      },
    ],
    count: 2,
    pipeline: {
      total_value: 87600,
      weighted_value: 57600,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: 'Sales pipeline EUR 87.600 (gewogen EUR 57.600).',
    },
  };
}

/**
 * get_sales_funnel - Funnel overview
 */
export function generateGetSalesFunnelResponse(_params: Record<string, unknown>): unknown {
  return {
    stages: [
      { stage: 'Lead', count: 3, value: 25000 },
      { stage: 'Gekwalificeerd', count: 2, value: 42000 },
      { stage: 'Offerte', count: 1, value: 54000 },
      { stage: 'Onderhandeling', count: 1, value: 33600 },
    ],
    totals: {
      total_opportunities: 7,
      total_value: 154600,
      conversion_rate: 28,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: '7 opportunities in funnel. Conversie 28%.',
    },
  };
}

// ============================================
// CONTRACTS
// ============================================

/**
 * get_sales_contracts - Recurring customer contracts
 */
export function generateGetSalesContractsResponse(_params: Record<string, unknown>): unknown {
  return {
    contracts: [
      {
        id: 'contract-001',
        customer_name: 'Hotel Krasnapolsky',
        description: 'Wekelijkse broodleveranties',
        start_date: '2023-01-01',
        end_date: '2024-12-31',
        status: 'active',
        monthly_value: 2500,
        annual_value: 30000,
      },
      {
        id: 'contract-002',
        customer_name: 'Hotel Pulitzer Amsterdam',
        description: 'Ontbijtservice',
        start_date: '2023-06-01',
        end_date: '2024-05-31',
        status: 'active',
        monthly_value: 3200,
        annual_value: 38400,
      },
    ],
    count: 2,
    totals: {
      active_contracts: 2,
      total_annual_value: 68400,
      total_monthly_value: 5700,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: '2 actieve contracten, maandelijkse waarde EUR 5.700.',
    },
  };
}

/**
 * get_purchase_contracts - Supplier contracts
 */
export function generateGetPurchaseContractsResponse(_params: Record<string, unknown>): unknown {
  return {
    contracts: [
      {
        id: 'pcontract-001',
        supplier_name: 'Meelgroothandel Van der Molen',
        description: 'Jaarcontract bloem en meel',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'active',
        monthly_value: 3000,
      },
    ],
    count: 1,
    totals: {
      active_contracts: 1,
      total_monthly_value: 3000,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
  };
}

/**
 * get_recurring_revenue - MRR/ARR
 */
export function generateGetRecurringRevenueResponse(_params: Record<string, unknown>): unknown {
  return {
    mrr: 5700,
    arr: 68400,
    contracts_count: 2,
    churn_rate: 0,
    growth_rate: 12,
    by_customer: [
      { customer: 'Hotel Pulitzer Amsterdam', mrr: 3200 },
      { customer: 'Hotel Krasnapolsky', mrr: 2500 },
    ],
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: 'MRR EUR 5.700, ARR EUR 68.400. 12% groei YoY.',
    },
  };
}

// ============================================
// PRICES
// ============================================

/**
 * get_sales_prices - Price list
 */
export function generateGetSalesPricesResponse(_params: Record<string, unknown>): unknown {
  return {
    prices: [
      { item_code: 'BROOD-001', description: 'Croissants (per 10)', price: 15.00, unit: 'doos' },
      { item_code: 'BROOD-002', description: 'Volkoren brood', price: 3.50, unit: 'stuk' },
      { item_code: 'GEBAK-001', description: 'Petit fours (per 20)', price: 35.00, unit: 'doos' },
      { item_code: 'GEBAK-005', description: 'Appeltaart (heel)', price: 21.00, unit: 'stuk' },
    ],
    count: 4,
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    related_tools: [
      { tool: 'get_items', when: 'Voor volledige artikellijst' },
    ],
  };
}

/**
 * get_purchase_prices - Supplier prices
 */
export function generateGetPurchasePricesResponse(_params: Record<string, unknown>): unknown {
  return {
    prices: [
      { item_code: 'GROND-001', description: 'Tarwebloem (25kg)', supplier: 'Meelgroothandel Van der Molen', price: 32.00 },
      { item_code: 'ZUIVEL-001', description: 'Roomboter (10kg)', supplier: 'Zuivelfabriek De Koe', price: 45.00 },
      { item_code: 'EIEREN-001', description: 'Scharreleieren (tray 30)', supplier: 'Eiergroothandel Hendriks', price: 12.00 },
    ],
    count: 3,
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
  };
}

/**
 * get_margin_analysis - Product margins
 */
export function generateGetMarginAnalysisResponse(_params: Record<string, unknown>): unknown {
  return {
    analysis: [
      { item_code: 'BROOD-001', description: 'Croissants (per 10)', sales_price: 15.00, cost_price: 6.50, margin: 8.50, margin_percentage: 56.7 },
      { item_code: 'GEBAK-001', description: 'Petit fours (per 20)', sales_price: 35.00, cost_price: 14.00, margin: 21.00, margin_percentage: 60.0 },
      { item_code: 'BROOD-002', description: 'Volkoren brood', sales_price: 3.50, cost_price: 1.20, margin: 2.30, margin_percentage: 65.7 },
    ],
    summary: {
      average_margin_percentage: 60.8,
      highest_margin_item: 'Volkoren brood (65.7%)',
      lowest_margin_item: 'Croissants (56.7%)',
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: 'Gemiddelde marge 60.8%. Hoogste marge op volkoren brood.',
    },
  };
}

// ============================================
// COMBO TOOLS
// ============================================

/**
 * get_customer_360 - Customer overview
 */
export function generateGetCustomer360Response(params: Record<string, unknown>): unknown {
  const customerId = params.customer_id as string;

  // Return demo data for Hotel Krasnapolsky
  return {
    customer: {
      id: customerId || 'cust-001-hotel-krasnapolsky',
      name: 'Hotel Krasnapolsky',
      code: 'KRAS001',
      email: 'inkoop@krasnapolsky.nl',
      phone: '+31 20 554 9111',
      address: 'Dam 9, 1012 JS Amsterdam',
      status: 'active',
      payment_terms: '30 dagen netto',
    },
    financial_summary: {
      ytd_revenue: 28500,
      outstanding_balance: 2890,
      overdue_amount: 0,
      credit_limit: 10000,
      credit_available: 7110,
    },
    recent_invoices: [
      { invoice_number: 2024022, date: '2024-01-20', amount: 2890, status: 'open' },
      { invoice_number: 2024013, date: '2024-01-08', amount: 2680, status: 'paid' },
      { invoice_number: 2024001, date: '2024-01-02', amount: 2450, status: 'paid' },
    ],
    recent_orders: [
      { order_number: 2024100, date: '2024-01-28', amount: 2450, status: 'open' },
    ],
    stats: {
      total_orders: 15,
      avg_order_value: 2650,
      payment_score: 95,
      relationship_since: '2022-01-15',
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: 'Top klant - YTD omzet EUR 28.500. Goede betaalhistorie (score 95).',
    },
  };
}

/**
 * get_financial_snapshot - Company financial overview
 */
export function generateGetFinancialSnapshotResponse(_params: Record<string, unknown>): unknown {
  return {
    company: getCurrentIndustryConfig().company.name,
    period: 'YTD ' + new Date().getFullYear(),
    profit_loss: {
      revenue: 310000,
      cost_of_goods: 108500,
      gross_profit: 201500,
      operating_expenses: 168500,
      net_profit: 33000,
      net_margin: 10.6,
    },
    balance_sheet: {
      total_assets: 207400,
      total_liabilities: 62700,
      equity: 144700,
      current_ratio: 3.1,
    },
    cash_flow: {
      operating: 45000,
      investing: -5000,
      financing: -8000,
      net_change: 32000,
      current_balance: 95000,
    },
    receivables: {
      total_outstanding: 18500,
      overdue: 4845,
      average_days: 28,
    },
    payables: {
      total_outstanding: 9670,
      overdue: 1900,
      average_days: 15,
    },
    key_metrics: {
      gross_margin: 65.0,
      net_margin: 10.6,
      current_ratio: 3.1,
      quick_ratio: 2.8,
      debt_to_equity: 0.43,
    },
    currency: 'EUR',
    division: getCurrentIndustryConfig().division.code,
    _demo: true,
    context: {
      summary: 'Gezonde financiële positie. Netto marge 10.6%, current ratio 3.1.',
      highlights: [
        'Sterke liquiditeit (current ratio 3.1)',
        'Gezonde marge (bruto 65%, netto 10.6%)',
        'Lage schuldenlast (debt/equity 0.43)',
      ],
    },
    related_tools: [
      { tool: 'get_profit_loss', when: 'Voor gedetailleerde W&V' },
      { tool: 'get_trial_balance', when: 'Voor volledige balans' },
      { tool: 'get_cashflow_forecast', when: 'Voor liquiditeitsprognose' },
    ],
  };
}
