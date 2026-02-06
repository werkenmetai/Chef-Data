/**
 * Cost Center Tools (SCOPE-004)
 *
 * Tools for working with cost centers and cost center reporting.
 *
 * @see SCOPE-004 in operations/ROADMAP.md
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import { escapeODataString } from '../exact/odata-query';
import type { ExactODataResponse, ExactCostCenter } from '@exact-mcp/shared';

/**
 * Get Cost Centers Tool
 *
 * Retrieves cost centers (departments/divisions for cost allocation).
 */
export class GetCostCentersTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_cost_centers',
    description:
      'Haal kostenplaatsen op uit Exact Online. ' +
      'Gebruik voor: afdelingen, kostenplaatsen overzicht, cost allocation setup. ' +
      'Toont code, omschrijving en actief status.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        active_only: {
          type: 'boolean',
          description: 'Alleen actieve kostenplaatsen tonen. Default: true',
        },
        search: {
          type: 'string',
          description: 'Zoek in code of omschrijving. Optioneel.',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        cost_centers: { type: 'array' },
        count: { type: 'number' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['cost_centers', 'count', 'filters', 'division'],
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

    const activeOnly = params.active_only !== false;
    const search = params.search as string | undefined;

    const filters: string[] = [];

    if (activeOnly) {
      filters.push('Active eq true');
    }

    if (search) {
      const escapedSearch = escapeODataString(search);
      // Note: Exact Online OData requires 'eq true' suffix for substringof()
      filters.push(`(substringof('${escapedSearch}', Code) eq true or substringof('${escapedSearch}', Description) eq true)`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';
    // Note: Exact Online API is case-sensitive - 'Costcenters' not 'CostCenters'
    const endpoint = `/${division}/hrm/Costcenters?$select=ID,Code,Description,Active,Created,Modified${filterString}`;

    try {
      const response = await this.exactRequest<ExactODataResponse<ExactCostCenter>>(connection, endpoint);
      const costCenters = extractODataResults<ExactCostCenter>(response?.d as Record<string, unknown>);

      const formattedCostCenters = costCenters.map((cc: ExactCostCenter) => ({
        id: cc.ID,
        code: cc.Code,
        description: cc.Description,
        active: cc.Active,
        created: this.formatDate(cc.Created),
        modified: this.formatDate(cc.Modified),
      }));

      return {
        cost_centers: formattedCostCenters,
        count: formattedCostCenters.length,
        filters: { active_only: activeOnly, search },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen kostenplaatsen: ${(error as Error).message}`,
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
 * Transaction line type for cost center report
 */
interface TransactionLine {
  ID: string;
  Date: string;
  CostCenter: string | null;
  CostCenterDescription: string | null;
  GLAccount: string;
  GLAccountCode: string;
  GLAccountDescription: string;
  AmountDC: number;
  Description: string | null;
  FinancialYear: number;
  FinancialPeriod: number;
}

/**
 * Get Cost Center Report Tool
 *
 * Retrieves financial results per cost center.
 */
export class GetCostCenterReportTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_cost_center_report',
    description:
      'Haal resultaat per kostenplaats op uit Exact Online. ' +
      'Gebruik voor: afdelingsresultaat, kostenplaats analyse, budget vs. realisatie per afdeling. ' +
      'Toont totale kosten en opbrengsten per kostenplaats voor een periode.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        cost_center_code: {
          type: 'string',
          description: 'Filter op specifieke kostenplaats (code). Optioneel.',
        },
        year: {
          type: 'number',
          description: 'Boekjaar. Default: huidig jaar.',
        },
        period_from: {
          type: 'number',
          description: 'Startperiode (1-12). Default: 1.',
        },
        period_to: {
          type: 'number',
          description: 'Eindperiode (1-12). Default: 12.',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        cost_center_results: { type: 'array' },
        count: { type: 'number' },
        totals: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['cost_center_results', 'count', 'totals', 'filters', 'division'],
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

    const costCenterCode = params.cost_center_code as string | undefined;
    const year = (params.year as number) || new Date().getFullYear();
    const periodFrom = (params.period_from as number) || 1;
    const periodTo = (params.period_to as number) || 12;

    const filters: string[] = [
      `FinancialYear eq ${year}`,
      `FinancialPeriod ge ${periodFrom}`,
      `FinancialPeriod le ${periodTo}`,
      `CostCenter ne null`,
    ];

    if (costCenterCode) {
      const escapedCode = escapeODataString(costCenterCode);
      filters.push(`CostCenter eq '${escapedCode}'`);
    }

    const filterString = `&$filter=${encodeURIComponent(filters.join(' and '))}`;
    const endpoint = `/${division}/financialtransaction/TransactionLines?$select=ID,Date,CostCenter,CostCenterDescription,GLAccount,GLAccountCode,GLAccountDescription,AmountDC,Description,FinancialYear,FinancialPeriod${filterString}&$top=5000`;

    try {
      const response = await this.exactRequest<ExactODataResponse<TransactionLine>>(connection, endpoint);
      const transactions = extractODataResults<TransactionLine>(response?.d as Record<string, unknown>);

      // Aggregate by cost center
      const byCostCenter: Record<string, {
        code: string;
        description: string;
        debit: number;
        credit: number;
        transactions: number;
      }> = {};

      let totalDebit = 0;
      let totalCredit = 0;

      for (const tx of transactions) {
        const ccDesc = tx.CostCenterDescription || 'Geen kostenplaats';
        const ccCode = tx.CostCenter || '';
        const amount = tx.AmountDC || 0;

        if (!byCostCenter[ccDesc]) {
          byCostCenter[ccDesc] = {
            code: ccCode,
            description: ccDesc,
            debit: 0,
            credit: 0,
            transactions: 0,
          };
        }

        byCostCenter[ccDesc].transactions++;

        if (amount >= 0) {
          byCostCenter[ccDesc].credit += amount;
          totalCredit += amount;
        } else {
          byCostCenter[ccDesc].debit += Math.abs(amount);
          totalDebit += Math.abs(amount);
        }
      }

      const costCenterResults = Object.values(byCostCenter).map(cc => ({
        code: cc.code,
        description: cc.description,
        debit: Math.round(cc.debit * 100) / 100,
        credit: Math.round(cc.credit * 100) / 100,
        net_result: Math.round((cc.credit - cc.debit) * 100) / 100,
        transaction_count: cc.transactions,
      })).sort((a, b) => b.net_result - a.net_result);

      return {
        cost_center_results: costCenterResults,
        count: costCenterResults.length,
        totals: {
          total_debit: Math.round(totalDebit * 100) / 100,
          total_credit: Math.round(totalCredit * 100) / 100,
          net_result: Math.round((totalCredit - totalDebit) * 100) / 100,
        },
        filters: {
          cost_center_code: costCenterCode,
          year,
          period_from: periodFrom,
          period_to: periodTo,
        },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen kostenplaats rapport: ${(error as Error).message}`,
        division,
      };
    }
  }
}

// Export all cost center tools
export const costCenterTools = [
  GetCostCentersTool,
  GetCostCenterReportTool,
];
