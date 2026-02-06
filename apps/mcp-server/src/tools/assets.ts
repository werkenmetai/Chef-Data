/**
 * Fixed Assets Tools (SCOPE-005)
 *
 * Tools for working with fixed assets and depreciation.
 *
 * @see SCOPE-005 in operations/ROADMAP.md
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import { escapeODataString } from '../exact/odata-query';
import type { ExactODataResponse, ExactFixedAsset, ExactAssetDepreciation } from '@exact-mcp/shared';

/**
 * Get Fixed Assets Tool
 *
 * Retrieves fixed assets (materiele vaste activa).
 */
export class GetFixedAssetsTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_fixed_assets',
    description:
      'Haal vaste activa op uit Exact Online. ' +
      'Gebruik voor: inventaris, activa overzicht, afschrijvingsoverzicht, boekwaarde. ' +
      'Toont aanschafwaarde, afschrijvingen, boekwaarde en status.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        status: {
          type: 'string',
          enum: ['active', 'sold', 'scrapped', 'all'],
          description: 'Status filter: active (actief), sold (verkocht), scrapped (afgeschreven), all (alle). Default: active',
        },
        asset_group: {
          type: 'string',
          description: 'Filter op activagroep (GUID). Optioneel.',
        },
        search: {
          type: 'string',
          description: 'Zoek in code of omschrijving. Optioneel.',
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
        assets: { type: 'array' },
        count: { type: 'number' },
        summary: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['assets', 'count', 'summary', 'filters', 'division'],
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
    const assetGroup = params.asset_group as string | undefined;
    const search = params.search as string | undefined;
    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);

    const filters: string[] = [];

    // Status filter: 1=Active, 2=Not validated, 3=Inactive, 4=Depreciated, 5=Blocked, 6=Sold
    if (status === 'active') {
      filters.push('Status eq 1');
    } else if (status === 'sold') {
      filters.push('Status eq 6');
    } else if (status === 'scrapped') {
      // 'scrapped' maps to Depreciated (4) in Exact Online
      filters.push('Status eq 4');
    }

    if (assetGroup) {
      filters.push(`AssetGroup eq guid'${assetGroup}'`);
    }

    if (search) {
      const escapedSearch = escapeODataString(search);
      // Note: Exact Online OData requires 'eq true' suffix for substringof()
      filters.push(`(substringof('${escapedSearch}', Code) eq true or substringof('${escapedSearch}', Description) eq true)`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';
    // Note: Many fields from old code don't exist. Using only API-documented fields:
    // ID, Code, Description, AssetGroup, AssetGroupCode, Status, StartDate, EndDate,
    // InvestmentDate, InvestmentAmountDC, ResidualValue, DepreciatedAmount, Costcenter
    const endpoint = `/${division}/assets/Assets?$select=ID,Code,Description,AssetGroup,AssetGroupCode,Status,StartDate,EndDate,InvestmentDate,InvestmentAmountDC,ResidualValue,DepreciatedAmount,Costcenter${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<ExactODataResponse<ExactFixedAsset>>(connection, endpoint);
      const assets = extractODataResults<ExactFixedAsset>(response?.d as Record<string, unknown>);

      // Calculate summary using API-documented fields
      let totalInvestment = 0;
      let totalDepreciation = 0;
      const byStatus: Record<string, number> = {};

      const formattedAssets = assets.map((asset: ExactFixedAsset) => {
        const assetRecord = asset as unknown as Record<string, unknown>;
        const investment = (assetRecord.InvestmentAmountDC as number) || 0;
        const depreciated = (assetRecord.DepreciatedAmount as number) || 0;
        const bookValue = investment - depreciated;

        totalInvestment += investment;
        totalDepreciation += depreciated;

        const statusLabel = this.getStatusLabel(asset.Status);
        byStatus[statusLabel] = (byStatus[statusLabel] || 0) + 1;

        return {
          id: asset.ID,
          code: asset.Code,
          description: asset.Description,
          asset_group_code: assetRecord.AssetGroupCode,
          status: statusLabel,
          investment_date: this.formatDate(assetRecord.InvestmentDate as string),
          investment_amount: investment,
          residual_value: asset.ResidualValue || 0,
          depreciated_amount: depreciated,
          book_value: bookValue,
          start_date: this.formatDate(assetRecord.StartDate as string),
          end_date: this.formatDate(assetRecord.EndDate as string),
          cost_center: assetRecord.Costcenter,
        };
      });

      return {
        assets: formattedAssets,
        count: formattedAssets.length,
        summary: {
          total_investment: Math.round(totalInvestment * 100) / 100,
          total_depreciation: Math.round(totalDepreciation * 100) / 100,
          total_book_value: Math.round((totalInvestment - totalDepreciation) * 100) / 100,
          by_status: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
        },
        filters: { status, asset_group: assetGroup, search },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen vaste activa: ${(error as Error).message}`,
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
    // Exact Online Asset Status codes
    // @see MCP Tool vs Exact API Verificatie Tabel in operations/ROADMAP.md
    const labels: Record<number, string> = {
      1: 'Actief',
      2: 'Niet gevalideerd',
      3: 'Inactief',
      4: 'Afgeschreven',
      5: 'Geblokkeerd',
      6: 'Verkocht',
    };
    return labels[status] || `Status ${status}`;
  }
}

/**
 * Get Depreciation Schedule Tool
 *
 * Retrieves depreciation schedule for assets.
 */
export class GetDepreciationScheduleTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_depreciation_schedule',
    description:
      'Haal afschrijvingsschema op uit Exact Online. ' +
      'Gebruik voor: afschrijvingsplanning, jaarlijkse afschrijvingen, activa verloop. ' +
      'Toont afschrijvingen per periode per activum.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        asset_id: {
          type: 'string',
          description: 'Filter op specifiek activum (GUID). Optioneel.',
        },
        year: {
          type: 'number',
          description: 'Boekjaar. Default: huidig jaar.',
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
        depreciation_entries: { type: 'array' },
        count: { type: 'number' },
        summary: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['depreciation_entries', 'count', 'summary', 'filters', 'division'],
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

    const assetId = params.asset_id as string | undefined;
    const year = (params.year as number) || new Date().getFullYear();
    const limit = Math.min(Math.max((params.limit as number) || 250, 1), 1000);

    const filters: string[] = [`FinancialYear eq ${year}`];

    if (assetId) {
      filters.push(`Asset eq guid'${assetId}'`);
    }

    const filterString = `&$filter=${encodeURIComponent(filters.join(' and '))}`;
    const endpoint = `/${division}/assets/DepreciationSchedules?$select=ID,Asset,AssetCode,AssetDescription,FinancialYear,FinancialPeriod,Amount,AmountResidual${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<ExactODataResponse<ExactAssetDepreciation>>(connection, endpoint);
      const schedules = extractODataResults<ExactAssetDepreciation>(response?.d as Record<string, unknown>);

      // Calculate summary
      let totalDepreciation = 0;
      const byAsset: Record<string, { code: string; description: string; total: number }> = {};
      const byPeriod: Record<number, number> = {};

      const formattedSchedules = schedules.map((schedule: ExactAssetDepreciation) => {
        const amount = schedule.Amount || 0;
        totalDepreciation += amount;

        const assetCode = schedule.AssetCode || schedule.Asset;
        if (!byAsset[assetCode]) {
          byAsset[assetCode] = {
            code: assetCode,
            description: schedule.AssetDescription || '',
            total: 0
          };
        }
        byAsset[assetCode].total += amount;

        byPeriod[schedule.FinancialPeriod] = (byPeriod[schedule.FinancialPeriod] || 0) + amount;

        return {
          id: schedule.ID,
          asset_id: schedule.Asset,
          asset_code: schedule.AssetCode,
          asset_description: schedule.AssetDescription,
          year: schedule.FinancialYear,
          period: schedule.FinancialPeriod,
          depreciation_amount: amount,
          residual_value: schedule.AmountResidual || 0,
        };
      });

      return {
        depreciation_entries: formattedSchedules,
        count: formattedSchedules.length,
        summary: {
          total_depreciation: Math.round(totalDepreciation * 100) / 100,
          year,
          by_asset: Object.values(byAsset).map(a => ({
            code: a.code,
            description: a.description,
            total: Math.round(a.total * 100) / 100,
          })),
          by_period: Object.entries(byPeriod).map(([period, amount]) => ({
            period: parseInt(period),
            amount: Math.round(amount * 100) / 100,
          })).sort((a, b) => a.period - b.period),
        },
        filters: { asset_id: assetId, year },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen afschrijvingsschema: ${(error as Error).message}`,
        division,
      };
    }
  }
}

// Export all asset tools
export const assetTools = [
  GetFixedAssetsTool,
  GetDepreciationScheduleTool,
];
