/**
 * CRM Opportunity Tools (SCOPE-007)
 *
 * Tools for working with sales opportunities and pipeline.
 *
 * @see SCOPE-007 in operations/ROADMAP.md
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import { escapeODataString } from '../exact/odata-query';
import type { ExactODataResponse, ExactOpportunity } from '@exact-mcp/shared';

/**
 * Get Opportunities Tool
 *
 * Retrieves sales opportunities from CRM.
 */
export class GetOpportunitiesTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_opportunities',
    description:
      'Haal verkoopkansen (opportunities) op uit Exact Online CRM. ' +
      'Gebruik voor: sales pipeline, opportunity overzicht, forecast, conversie analyse. ' +
      'Kan filteren op status, eigenaar en klant.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        status: {
          type: 'string',
          enum: ['open', 'won', 'lost', 'all'],
          description: 'Status filter: open (actief), won (gewonnen), lost (verloren), all (alle). Default: open',
        },
        account_id: {
          type: 'string',
          description: 'Filter op klant (account GUID). Optioneel.',
        },
        owner_id: {
          type: 'string',
          description: 'Filter op eigenaar (GUID). Optioneel.',
        },
        search: {
          type: 'string',
          description: 'Zoek in opportunity naam. Optioneel.',
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
        opportunities: { type: 'array' },
        count: { type: 'number' },
        summary: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['opportunities', 'count', 'summary', 'filters', 'division'],
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

    const status = (params.status as string) || 'open';
    const accountId = params.account_id as string | undefined;
    const ownerId = params.owner_id as string | undefined;
    const search = params.search as string | undefined;
    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);

    const filters: string[] = [];

    // Status filter: 1=Open, 2=Won, 3=Lost (API uses OpportunityStatus)
    if (status === 'open') {
      filters.push('OpportunityStatus eq 1');
    } else if (status === 'won') {
      filters.push('OpportunityStatus eq 2');
    } else if (status === 'lost') {
      filters.push('OpportunityStatus eq 3');
    }

    if (accountId) {
      filters.push(`Account eq guid'${accountId}'`);
    }

    if (ownerId) {
      filters.push(`Owner eq guid'${ownerId}'`);
    }

    if (search) {
      const escapedSearch = escapeODataString(search);
      // Note: Exact Online OData requires 'eq true' suffix for substringof()
      filters.push(`substringof('${escapedSearch}', Name) eq true`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';
    // Note: Stage→OpportunityStage, Status→OpportunityStatus, StatusDescription doesn't exist
    const endpoint = `/${division}/crm/Opportunities?$select=ID,Name,Account,AccountName,ActionDate,AmountDC,CloseDate,Created,Modified,Owner,OwnerFullName,Probability,OpportunityStage,OpportunityStageDescription,OpportunityStatus,ReasonCode,ReasonCodeDescription,Campaign,CampaignDescription,Notes${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<ExactODataResponse<ExactOpportunity>>(connection, endpoint);
      const opportunities = extractODataResults<ExactOpportunity>(response?.d as Record<string, unknown>);

      // Calculate summary
      let totalValue = 0;
      let totalWeightedValue = 0;
      const byStatus: Record<string, { count: number; value: number }> = {};
      const byStage: Record<string, { count: number; value: number }> = {};
      const byOwner: Record<string, { count: number; value: number }> = {};

      const formattedOpportunities = opportunities.map((opp: ExactOpportunity) => {
        const oppRecord = opp as unknown as Record<string, unknown>;
        const amount = opp.AmountDC || 0;
        const probability = opp.Probability || 0;
        const weightedValue = amount * (probability / 100);

        totalValue += amount;
        totalWeightedValue += weightedValue;

        // Note: API uses OpportunityStatus not Status
        const statusLabel = this.getStatusLabel(oppRecord.OpportunityStatus as number);
        if (!byStatus[statusLabel]) {
          byStatus[statusLabel] = { count: 0, value: 0 };
        }
        byStatus[statusLabel].count++;
        byStatus[statusLabel].value += amount;

        // Note: API uses OpportunityStageDescription not StageDescription
        const stageName = (oppRecord.OpportunityStageDescription as string) || 'Geen fase';
        if (!byStage[stageName]) {
          byStage[stageName] = { count: 0, value: 0 };
        }
        byStage[stageName].count++;
        byStage[stageName].value += amount;

        const ownerName = opp.OwnerFullName || 'Geen eigenaar';
        if (!byOwner[ownerName]) {
          byOwner[ownerName] = { count: 0, value: 0 };
        }
        byOwner[ownerName].count++;
        byOwner[ownerName].value += amount;

        return {
          id: opp.ID,
          name: opp.Name,
          account_name: opp.AccountName,
          account_id: opp.Account,
          amount: amount,
          probability: probability,
          weighted_value: Math.round(weightedValue * 100) / 100,
          stage: oppRecord.OpportunityStageDescription,
          status: statusLabel,
          owner: opp.OwnerFullName,
          owner_id: opp.Owner,
          action_date: this.formatDate(opp.ActionDate),
          close_date: this.formatDate(opp.CloseDate),
          reason: opp.ReasonCodeDescription,
          campaign: opp.CampaignDescription,
          notes: opp.Notes,
          created: this.formatDate(opp.Created),
        };
      });

      return {
        opportunities: formattedOpportunities,
        count: formattedOpportunities.length,
        summary: {
          total_value: Math.round(totalValue * 100) / 100,
          total_weighted_value: Math.round(totalWeightedValue * 100) / 100,
          average_probability: formattedOpportunities.length > 0
            ? Math.round((formattedOpportunities.reduce((sum: number, o: { probability: number }) => sum + o.probability, 0) / formattedOpportunities.length) * 10) / 10
            : 0,
          by_status: Object.entries(byStatus).map(([status, data]) => ({
            status,
            count: data.count,
            value: Math.round(data.value * 100) / 100,
          })),
          by_stage: Object.entries(byStage)
            .map(([stage, data]) => ({
              stage,
              count: data.count,
              value: Math.round(data.value * 100) / 100,
            }))
            .sort((a, b) => b.value - a.value),
          by_owner: Object.entries(byOwner)
            .map(([owner, data]) => ({
              owner,
              count: data.count,
              value: Math.round(data.value * 100) / 100,
            }))
            .sort((a, b) => b.value - a.value),
        },
        filters: { status, account_id: accountId, owner_id: ownerId, search },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen opportunities: ${(error as Error).message}`,
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
      1: 'Open',
      2: 'Gewonnen',
      3: 'Verloren',
    };
    return labels[status] || `Status ${status}`;
  }
}

/**
 * Get Sales Funnel Tool
 *
 * Retrieves sales funnel analysis with conversion rates.
 */
export class GetSalesFunnelTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_sales_funnel',
    description:
      'Haal sales funnel analyse op uit Exact Online CRM. ' +
      'Gebruik voor: funnel overzicht, conversiepercentages, pipeline analyse. ' +
      'Toont aantal en waarde per fase met conversieratio.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        date_from: {
          type: 'string',
          description: 'Startdatum (YYYY-MM-DD). Optioneel.',
        },
        date_to: {
          type: 'string',
          description: 'Einddatum (YYYY-MM-DD). Optioneel.',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        funnel_stages: { type: 'array' },
        totals: { type: 'object' },
        conversion_rates: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['funnel_stages', 'totals', 'conversion_rates', 'filters', 'division'],
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

    const dateFrom = params.date_from as string | undefined;
    const dateTo = params.date_to as string | undefined;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateFrom && !dateRegex.test(dateFrom)) {
      return { error: 'Ongeldige startdatum. Gebruik YYYY-MM-DD formaat.' };
    }
    if (dateTo && !dateRegex.test(dateTo)) {
      return { error: 'Ongeldige einddatum. Gebruik YYYY-MM-DD formaat.' };
    }

    const filters: string[] = [];

    if (dateFrom) {
      filters.push(`Created ge datetime'${dateFrom}'`);
    }

    if (dateTo) {
      filters.push(`Created le datetime'${dateTo}'`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';
    // Note: Stage→OpportunityStage, Status→OpportunityStatus
    const endpoint = `/${division}/crm/Opportunities?$select=ID,AmountDC,Probability,OpportunityStage,OpportunityStageDescription,OpportunityStatus,Created&$top=5000${filterString}`;

    try {
      const response = await this.exactRequest<ExactODataResponse<ExactOpportunity>>(connection, endpoint);
      const opportunities = extractODataResults<ExactOpportunity>(response?.d as Record<string, unknown>);

      // Aggregate by stage
      const byStage: Record<string, {
        stage: string;
        count: number;
        value: number;
        won: number;
        lost: number;
        open: number;
      }> = {};

      let totalOpen = 0;
      let totalWon = 0;
      let totalLost = 0;
      let totalOpenValue = 0;
      let totalWonValue = 0;

      for (const opp of opportunities) {
        const oppRecord = opp as unknown as Record<string, unknown>;
        const stageName = (oppRecord.OpportunityStageDescription as string) || 'Geen fase';
        const amount = opp.AmountDC || 0;
        const status = oppRecord.OpportunityStatus as number;

        if (!byStage[stageName]) {
          byStage[stageName] = {
            stage: stageName,
            count: 0,
            value: 0,
            won: 0,
            lost: 0,
            open: 0,
          };
        }

        byStage[stageName].count++;
        byStage[stageName].value += amount;

        if (status === 1) {
          byStage[stageName].open++;
          totalOpen++;
          totalOpenValue += amount;
        } else if (status === 2) {
          byStage[stageName].won++;
          totalWon++;
          totalWonValue += amount;
        } else if (status === 3) {
          byStage[stageName].lost++;
          totalLost++;
        }
      }

      // Calculate funnel with conversion rates
      const funnelStages = Object.values(byStage)
        .map(stage => ({
          stage: stage.stage,
          count: stage.count,
          value: Math.round(stage.value * 100) / 100,
          open: stage.open,
          won: stage.won,
          lost: stage.lost,
          win_rate: stage.count > 0 ? Math.round((stage.won / stage.count) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      const totalCount = opportunities.length;
      const overallWinRate = totalCount > 0 ? (totalWon / totalCount) * 100 : 0;

      return {
        funnel_stages: funnelStages,
        totals: {
          total_opportunities: totalCount,
          total_open: totalOpen,
          total_won: totalWon,
          total_lost: totalLost,
          total_open_value: Math.round(totalOpenValue * 100) / 100,
          total_won_value: Math.round(totalWonValue * 100) / 100,
        },
        conversion_rates: {
          overall_win_rate: Math.round(overallWinRate * 10) / 10,
          open_to_won_rate: totalOpen > 0 ? Math.round((totalWon / (totalOpen + totalWon + totalLost)) * 1000) / 10 : 0,
        },
        filters: { date_from: dateFrom, date_to: dateTo },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen sales funnel: ${(error as Error).message}`,
        division,
      };
    }
  }
}

// Export all opportunity tools
export const opportunityTools = [
  GetOpportunitiesTool,
  GetSalesFunnelTool,
];
