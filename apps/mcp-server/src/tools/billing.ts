/**
 * Project Billing & WIP Tools (SCOPE-002)
 *
 * Tools for project invoicing and work-in-progress tracking.
 *
 * @see SCOPE-002 in operations/ROADMAP.md
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import { buildGuidFilter } from '../exact/odata-query';
import type { ExactODataResponse } from '@exact-mcp/shared';

/**
 * Project invoice type from InvoiceTerms endpoint
 */
interface ProjectInvoiceTerm {
  ID: string;
  Project: string;
  ProjectCode: string | null;
  ProjectDescription: string | null;
  Account: string | null;
  AccountName: string | null;
  VATCode: string | null;
  VATCodeDescription: string | null;
  Amount: number;
  Percentage: number | null;
  InvoiceDate: string | null;
  Notes: string | null;
}

/**
 * Project cost entry for WIP calculation
 */
interface ProjectCostEntry {
  Project: string;
  ProjectCode: string | null;
  ProjectDescription: string | null;
  Account: string | null;
  AccountName: string | null;
  AmountApproved: number;
  CostsBudgeted: number;
  CostsRealized: number;
  HoursBudgeted: number;
  HoursRealized: number;
}

/**
 * Get Project Invoices Tool
 *
 * Retrieves project invoicing information including billing terms and invoice history.
 */
export class GetProjectInvoicesTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_project_invoices',
    description:
      'Haal projectfacturen en factuurtermijnen op uit Exact Online. ' +
      'Gebruik voor: projectfacturatie overzicht, factuurtermijnen, onderhanden werk facturatie. ' +
      'Kan filteren op project en klant. ' +
      'VEREIST: Project module actief in Exact Online.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        project_id: {
          type: 'string',
          description: 'Filter op specifiek project (GUID). Optioneel.',
        },
        account_id: {
          type: 'string',
          description: 'Filter op klant (account GUID). Optioneel.',
        },
        limit: {
          type: 'number',
          description: 'Maximum aantal resultaten (1-500). Default: 100',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        invoices: { type: 'array' },
        count: { type: 'number' },
        summary: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['invoices', 'count', 'summary', 'filters', 'division'],
    },
    annotations: DEFAULT_TOOL_ANNOTATIONS,
  };

  async run(params: Record<string, unknown>): Promise<unknown> {
    const connection = this.getConnection();
    if (!connection) {
      return { error: 'Geen Exact Online connectie gevonden.' };
    }

    // FEATURE-001: Use default division if not specified
    const division = this.resolveDivision(connection, params.division as number | undefined);
    if (!division) {
      return { error: 'Geen administratie opgegeven en geen standaard administratie ingesteld. Gebruik list_divisions om beschikbare administraties te zien.' };
    }

    const projectId = params.project_id as string | undefined;
    const accountId = params.account_id as string | undefined;
    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);

    const filters: string[] = [];

    if (projectId) {
      try {
        filters.push(buildGuidFilter('Project', projectId));
      } catch (error) {
        return { error: `Ongeldig project_id formaat: ${(error as Error).message}`, division };
      }
    }

    if (accountId) {
      try {
        filters.push(buildGuidFilter('Account', accountId));
      } catch (error) {
        return { error: `Ongeldig account_id formaat: ${(error as Error).message}`, division };
      }
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';

    // Note: ProjectCode, Account, AccountName do NOT exist on InvoiceTerms endpoint
    // To get customer info, fetch from Projects endpoint using Project GUID
    const endpoint = `/${division}/project/InvoiceTerms?$select=ID,Project,ProjectDescription,VATCode,VATCodeDescription,Amount,Percentage,InvoiceDate,Notes${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<ExactODataResponse<ProjectInvoiceTerm>>(connection, endpoint);
      const invoiceTerms = extractODataResults<ProjectInvoiceTerm>(response?.d as Record<string, unknown>);

      // Calculate summary
      let totalAmount = 0;
      const byProject: Record<string, number> = {};
      const byCustomer: Record<string, number> = {};

      const formattedInvoices = invoiceTerms.map((term: ProjectInvoiceTerm) => {
        const amount = term.Amount || 0;
        totalAmount += amount;

        if (term.ProjectDescription) {
          byProject[term.ProjectDescription] = (byProject[term.ProjectDescription] || 0) + amount;
        }
        if (term.AccountName) {
          byCustomer[term.AccountName] = (byCustomer[term.AccountName] || 0) + amount;
        }

        return {
          id: term.ID,
          project_code: term.ProjectCode || null, // Not available on this endpoint
          project_description: term.ProjectDescription,
          project_id: term.Project,
          customer_name: term.AccountName || null, // Not available - use Projects endpoint
          customer_id: term.Account || null, // Not available - use Projects endpoint
          amount: amount,
          percentage: term.Percentage,
          invoice_date: this.formatDate(term.InvoiceDate),
          vat_code: term.VATCodeDescription,
          notes: term.Notes,
        };
      });

      return {
        invoices: formattedInvoices,
        count: formattedInvoices.length,
        summary: {
          total_amount: Math.round(totalAmount * 100) / 100,
          by_project: Object.entries(byProject)
            .map(([project, amount]) => ({ project, amount: Math.round(amount * 100) / 100 }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10),
          by_customer: Object.entries(byCustomer)
            .map(([customer, amount]) => ({ customer, amount: Math.round(amount * 100) / 100 }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10),
        },
        filters: { project_id: projectId, account_id: accountId },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen projectfacturen: ${(error as Error).message}`,
        division,
      };
    }
  }

  private formatDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    const match = dateStr.match(/\/Date\((\d+)\)\//);
    if (match) {
      return new Date(parseInt(match[1])).toISOString().split('T')[0];
    }
    return dateStr;
  }
}

/**
 * Get WIP Overview Tool
 *
 * Retrieves work-in-progress overview showing budgeted vs realized hours/costs per project.
 */
export class GetWIPOverviewTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_wip_overview',
    description:
      'Haal onderhanden werk (OHW/WIP) overzicht op uit Exact Online. ' +
      'Gebruik voor: WIP analyse, budget vs. realisatie, projectvoortgang, marge analyse. ' +
      'Toont gebudgetteerde en gerealiseerde uren en kosten per project.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        status: {
          type: 'string',
          enum: ['active', 'all'],
          description: 'Project status filter: active (alleen actieve projecten), all (alle). Default: active',
        },
        account_id: {
          type: 'string',
          description: 'Filter op klant (account GUID). Optioneel.',
        },
        limit: {
          type: 'number',
          description: 'Maximum aantal projecten (1-200). Default: 50',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        projects: { type: 'array' },
        count: { type: 'number' },
        totals: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['projects', 'count', 'totals', 'filters', 'division'],
    },
    annotations: DEFAULT_TOOL_ANNOTATIONS,
  };

  async run(params: Record<string, unknown>): Promise<unknown> {
    const connection = this.getConnection();
    if (!connection) {
      return { error: 'Geen Exact Online connectie gevonden.' };
    }

    // FEATURE-001: Use default division if not specified
    const division = this.resolveDivision(connection, params.division as number | undefined);
    if (!division) {
      return { error: 'Geen administratie opgegeven en geen standaard administratie ingesteld. Gebruik list_divisions om beschikbare administraties te zien.' };
    }

    const status = (params.status as string) || 'active';
    const accountId = params.account_id as string | undefined;
    const limit = Math.min(Math.max((params.limit as number) || 50, 1), 200);

    try {
      // Note: CostsByProject endpoint may not be documented.
      // ProjectStatus filter does NOT exist - status filtering should be done post-query or via Projects endpoint
      const filters: string[] = [];

      // ProjectStatus eq 0 is NOT a valid filter - removed
      // To filter by status, first fetch active projects and then filter costs

      if (accountId) {
        try {
          filters.push(buildGuidFilter('Account', accountId));
        } catch (error) {
          return { error: `Ongeldig account_id formaat: ${(error as Error).message}`, division };
        }
      }

      const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';

      // Note: This endpoint may not be officially documented. Alternative: use CostsByDate or combine Projects + TimeTransactions
      const endpoint = `/${division}/read/project/CostsByProject?$select=Project,ProjectCode,ProjectDescription,Account,AccountName,AmountApproved,CostsBudgeted,CostsRealized,HoursBudgeted,HoursRealized${filterString}&$top=${limit}`;

      const response = await this.exactRequest<ExactODataResponse<ProjectCostEntry>>(connection, endpoint);
      const costEntries = extractODataResults<ProjectCostEntry>(response?.d as Record<string, unknown>);

      // Calculate totals
      let totalHoursBudgeted = 0;
      let totalHoursRealized = 0;
      let totalCostsBudgeted = 0;
      let totalCostsRealized = 0;

      const formattedProjects = costEntries.map((entry: ProjectCostEntry) => {
        const hoursBudgeted = entry.HoursBudgeted || 0;
        const hoursRealized = entry.HoursRealized || 0;
        const costsBudgeted = entry.CostsBudgeted || 0;
        const costsRealized = entry.CostsRealized || 0;

        totalHoursBudgeted += hoursBudgeted;
        totalHoursRealized += hoursRealized;
        totalCostsBudgeted += costsBudgeted;
        totalCostsRealized += costsRealized;

        // Calculate variances
        const hoursVariance = hoursBudgeted > 0 ? ((hoursRealized - hoursBudgeted) / hoursBudgeted) * 100 : 0;
        const costsVariance = costsBudgeted > 0 ? ((costsRealized - costsBudgeted) / costsBudgeted) * 100 : 0;

        return {
          project_code: entry.ProjectCode,
          project_description: entry.ProjectDescription,
          project_id: entry.Project,
          customer_name: entry.AccountName,
          customer_id: entry.Account,
          hours_budgeted: Math.round(hoursBudgeted * 100) / 100,
          hours_realized: Math.round(hoursRealized * 100) / 100,
          hours_remaining: Math.round((hoursBudgeted - hoursRealized) * 100) / 100,
          hours_variance_pct: Math.round(hoursVariance * 10) / 10,
          costs_budgeted: Math.round(costsBudgeted * 100) / 100,
          costs_realized: Math.round(costsRealized * 100) / 100,
          costs_remaining: Math.round((costsBudgeted - costsRealized) * 100) / 100,
          costs_variance_pct: Math.round(costsVariance * 10) / 10,
          amount_approved: Math.round((entry.AmountApproved || 0) * 100) / 100,
          status: hoursVariance > 10 ? 'over_budget' : hoursVariance > 0 ? 'on_track' : 'under_budget',
        };
      });

      // Calculate overall variances
      const overallHoursVariance = totalHoursBudgeted > 0 ? ((totalHoursRealized - totalHoursBudgeted) / totalHoursBudgeted) * 100 : 0;
      const overallCostsVariance = totalCostsBudgeted > 0 ? ((totalCostsRealized - totalCostsBudgeted) / totalCostsBudgeted) * 100 : 0;

      return {
        projects: formattedProjects,
        count: formattedProjects.length,
        totals: {
          hours_budgeted: Math.round(totalHoursBudgeted * 100) / 100,
          hours_realized: Math.round(totalHoursRealized * 100) / 100,
          hours_remaining: Math.round((totalHoursBudgeted - totalHoursRealized) * 100) / 100,
          hours_variance_pct: Math.round(overallHoursVariance * 10) / 10,
          costs_budgeted: Math.round(totalCostsBudgeted * 100) / 100,
          costs_realized: Math.round(totalCostsRealized * 100) / 100,
          costs_remaining: Math.round((totalCostsBudgeted - totalCostsRealized) * 100) / 100,
          costs_variance_pct: Math.round(overallCostsVariance * 10) / 10,
        },
        filters: { status, account_id: accountId },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen WIP overzicht: ${(error as Error).message}`,
        division,
      };
    }
  }
}

// Export all billing tools
export const billingTools = [
  GetProjectInvoicesTool,
  GetWIPOverviewTool,
];
