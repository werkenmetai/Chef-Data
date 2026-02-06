/**
 * Projects & Time Tracking Tools
 *
 * Tools for working with Exact Online projects and time transactions.
 *
 * @see EXACT-011 in operations/ROADMAP.md
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import { escapeODataString } from '../exact/odata-query';
import type { ExactProject, ExactTimeTransaction, ExactODataResponse } from '@exact-mcp/shared';

/**
 * Get Projects Tool
 */
export class GetProjectsTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_projects',
    description:
      'Haal projecten op uit Exact Online. ' +
      'Gebruik voor: projectoverzicht, projectstatus, budgettering, projectmanagement. ' +
      'Kan filteren op status (actief/afgerond), klant, en projectmanager. ' +
      'TIP: Combineer met get_time_transactions voor urenregistratie per project. ' +
      'VEREIST: Project module actief in Exact Online.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        status: {
          type: 'string',
          enum: ['active', 'completed', 'archived', 'all'],
          description: 'Project status filter: active (actief), completed (afgerond), archived (gearchiveerd), all (alles). Default: active',
        },
        account_id: {
          type: 'string',
          description: 'Filter op klant (account GUID). Optioneel.',
        },
        search: {
          type: 'string',
          description: 'Zoek in projectcode of omschrijving.',
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
        projects: { type: 'array' },
        count: { type: 'number' },
        summary: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['projects', 'count', 'summary', 'filters', 'division'],
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
    const search = params.search as string | undefined;
    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);

    const filters: string[] = [];

    // Status filter: 0=Active, 1=Completed, 2=Archived
    if (status === 'active') {
      filters.push('Status eq 0');
    } else if (status === 'completed') {
      filters.push('Status eq 1');
    } else if (status === 'archived') {
      filters.push('Status eq 2');
    }
    // 'all' = no status filter

    if (accountId) {
      filters.push(`Account eq guid'${accountId}'`);
    }

    if (search) {
      const escapedSearch = escapeODataString(search);
      // Note: Exact Online OData requires 'eq true' suffix for substringof()
      filters.push(`(substringof('${escapedSearch}', Code) eq true or substringof('${escapedSearch}', Description) eq true)`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';

    // Note: API uses ManagerFullname (lowercase 'n')
    const endpoint = `/${division}/project/Projects?$select=ID,Code,Description,Account,AccountName,Type,TypeDescription,StartDate,EndDate,Manager,ManagerFullname,BudgetedAmount,BudgetedCosts,BudgetedHoursPerHourType,Status,Created,Modified${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<ExactODataResponse<ExactProject>>(connection, endpoint);
      const projects = extractODataResults<ExactProject>(response?.d as Record<string, unknown>);

      // Summary stats
      let totalBudgetedAmount = 0;
      let totalBudgetedCosts = 0;
      const statusCount: Record<string, number> = {};
      const typeCount: Record<string, number> = {};

      const formattedProjects = projects.map((project: ExactProject) => {
        const budgetedAmount = project.BudgetedAmount || 0;
        const budgetedCosts = project.BudgetedCosts || 0;
        totalBudgetedAmount += budgetedAmount;
        totalBudgetedCosts += budgetedCosts;

        const statusLabel = this.getStatusLabel(project.Status);
        statusCount[statusLabel] = (statusCount[statusLabel] || 0) + 1;

        const typeLabel = project.TypeDescription || this.getTypeLabel(project.Type);
        typeCount[typeLabel] = (typeCount[typeLabel] || 0) + 1;

        return {
          id: project.ID,
          code: project.Code,
          description: project.Description,
          customer: project.AccountName,
          customer_id: project.Account,
          type: typeLabel,
          type_code: project.Type,
          start_date: this.formatDate(project.StartDate),
          end_date: this.formatDate(project.EndDate),
          // Note: API uses ManagerFullname (lowercase 'n'), but type has ManagerFullName for backwards compat
          manager: (project as unknown as Record<string, unknown>).ManagerFullname as string || project.ManagerFullName,
          manager_id: project.Manager,
          budgeted_amount: budgetedAmount,
          budgeted_costs: budgetedCosts,
          budgeted_hours: project.BudgetedHoursPerHourType,
          status: statusLabel,
          status_code: project.Status,
          created: this.formatDate(project.Created),
          modified: this.formatDate(project.Modified),
        };
      });

      return {
        projects: formattedProjects,
        count: formattedProjects.length,
        summary: {
          total_budgeted_amount: Math.round(totalBudgetedAmount * 100) / 100,
          total_budgeted_costs: Math.round(totalBudgetedCosts * 100) / 100,
          by_status: Object.entries(statusCount).map(([status, count]) => ({ status, count })),
          by_type: Object.entries(typeCount).map(([type, count]) => ({ type, count })),
        },
        filters: { status, account_id: accountId, search },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen projecten: ${(error as Error).message}`,
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

  private getStatusLabel(status: number): string {
    const labels: Record<number, string> = {
      0: 'Actief',
      1: 'Afgerond',
      2: 'Gearchiveerd',
    };
    return labels[status] || `Status ${status}`;
  }

  private getTypeLabel(type: number): string {
    // Type codes per API docs: 1=Campaign, 2=Fixed Price, 3=Time&Material, 4=Non billable, 5=Prepaid
    const labels: Record<number, string> = {
      1: 'Campagne',
      2: 'Vast bedrag',
      3: 'Nacalculatie',
      4: 'Niet facturabel',
      5: 'Vooruitbetaald',
    };
    return labels[type] || `Type ${type}`;
  }
}

/**
 * Get Time Transactions Tool
 */
export class GetTimeTransactionsTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_time_transactions',
    description:
      'Haal urenregistraties op uit Exact Online. ' +
      'Gebruik voor: uren overzicht, projecturen, factureerbare uren, tijdsverantwoording. ' +
      'Kan filteren op periode, project, medewerker, en status. ' +
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
          description: 'Filter op project (GUID). Optioneel.',
        },
        employee_id: {
          type: 'string',
          description: 'Filter op medewerker (GUID). Optioneel.',
        },
        date_from: {
          type: 'string',
          description: 'Startdatum (YYYY-MM-DD). Optioneel.',
        },
        date_to: {
          type: 'string',
          description: 'Einddatum (YYYY-MM-DD). Optioneel.',
        },
        status: {
          type: 'string',
          enum: ['draft', 'submitted', 'approved', 'rejected', 'processed', 'all'],
          description: 'Status filter. Default: all',
        },
        limit: {
          type: 'number',
          description: 'Maximum aantal resultaten (1-1000). Default: 250',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        time_transactions: { type: 'array' },
        count: { type: 'number' },
        summary: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['time_transactions', 'count', 'summary', 'filters', 'division'],
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
    const employeeId = params.employee_id as string | undefined;
    const dateFrom = params.date_from as string | undefined;
    const dateTo = params.date_to as string | undefined;
    const status = (params.status as string) || 'all';
    const limit = Math.min(Math.max((params.limit as number) || 250, 1), 1000);

    const filters: string[] = [];

    if (projectId) {
      filters.push(`Project eq guid'${projectId}'`);
    }

    if (employeeId) {
      filters.push(`Employee eq guid'${employeeId}'`);
    }

    if (dateFrom) {
      filters.push(`Date ge datetime'${dateFrom}T00:00:00'`);
    }

    if (dateTo) {
      filters.push(`Date le datetime'${dateTo}T23:59:59'`);
    }

    // Status filter per API docs - uses HourStatus: 1=Draft, 2=Rejected, 10=Submitted, 20=Final
    if (status === 'draft') {
      filters.push('HourStatus eq 1');
    } else if (status === 'submitted') {
      filters.push('HourStatus eq 10');
    } else if (status === 'approved') {
      filters.push('HourStatus eq 20'); // Final = approved/processed
    } else if (status === 'rejected') {
      filters.push('HourStatus eq 2');
    } else if (status === 'processed') {
      filters.push('HourStatus eq 20'); // Final
    }
    // 'all' = no status filter

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';

    // Note: API uses Quantity (not Hours) and HourStatus (not Status)
    // Some fields like EmployeeFullName, HourType, CostCenter may not be in official docs but may still work
    const endpoint = `/${division}/project/TimeTransactions?$select=ID,Account,AccountName,Project,ProjectCode,ProjectDescription,Employee,EmployeeFullName,Date,Quantity,HourType,HourTypeDescription,CostCenter,CostCenterDescription,CostUnit,CostUnitDescription,Notes,HourStatus,Created,Modified${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<ExactODataResponse<ExactTimeTransaction>>(connection, endpoint);
      const transactions = extractODataResults<ExactTimeTransaction>(response?.d as Record<string, unknown>);

      // Summary stats
      let totalHours = 0;
      const hoursPerProject: Record<string, number> = {};
      const hoursPerEmployee: Record<string, number> = {};
      const statusCount: Record<string, number> = {};

      const formattedTransactions = transactions.map((tx: ExactTimeTransaction) => {
        // API uses Quantity field instead of Hours
        const hours = (tx as unknown as Record<string, unknown>).Quantity as number || tx.Hours || 0;
        totalHours += hours;

        if (tx.ProjectDescription) {
          hoursPerProject[tx.ProjectDescription] = (hoursPerProject[tx.ProjectDescription] || 0) + hours;
        }

        if (tx.EmployeeFullName) {
          hoursPerEmployee[tx.EmployeeFullName] = (hoursPerEmployee[tx.EmployeeFullName] || 0) + hours;
        }

        // API uses HourStatus field instead of Status
        const hourStatus = (tx as unknown as Record<string, unknown>).HourStatus as number || tx.Status;
        const statusLabel = this.getStatusLabel(hourStatus);
        statusCount[statusLabel] = (statusCount[statusLabel] || 0) + 1;

        return {
          id: tx.ID,
          date: this.formatDate(tx.Date),
          hours: hours,
          project_code: tx.ProjectCode,
          project_description: tx.ProjectDescription,
          project_id: tx.Project,
          customer_name: tx.AccountName,
          customer_id: tx.Account,
          employee: tx.EmployeeFullName,
          employee_id: tx.Employee,
          hour_type: tx.HourTypeDescription,
          hour_type_id: tx.HourType,
          cost_center: tx.CostCenterDescription,
          cost_unit: tx.CostUnitDescription,
          notes: tx.Notes,
          status: statusLabel,
          status_code: hourStatus, // API uses HourStatus
          created: this.formatDate(tx.Created),
          modified: this.formatDate(tx.Modified),
        };
      });

      return {
        time_transactions: formattedTransactions,
        count: formattedTransactions.length,
        summary: {
          total_hours: Math.round(totalHours * 100) / 100,
          by_project: Object.entries(hoursPerProject)
            .map(([project, hours]) => ({ project, hours: Math.round(hours * 100) / 100 }))
            .sort((a, b) => b.hours - a.hours)
            .slice(0, 10),
          by_employee: Object.entries(hoursPerEmployee)
            .map(([employee, hours]) => ({ employee, hours: Math.round(hours * 100) / 100 }))
            .sort((a, b) => b.hours - a.hours)
            .slice(0, 10),
          by_status: Object.entries(statusCount).map(([status, count]) => ({ status, count })),
        },
        filters: { project_id: projectId, employee_id: employeeId, date_from: dateFrom, date_to: dateTo, status },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen urenregistraties: ${(error as Error).message}`,
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

  private getStatusLabel(status: number): string {
    // HourStatus codes per API docs: 1=Draft, 2=Rejected, 10=Submitted, 20=Final
    const labels: Record<number, string> = {
      1: 'Concept',
      2: 'Afgekeurd',
      10: 'Ingediend',
      20: 'Verwerkt',
    };
    return labels[status] || `Status ${status}`;
  }
}

// Export all project tools
export const projectTools = [
  GetProjectsTool,
  GetTimeTransactionsTool,
];
