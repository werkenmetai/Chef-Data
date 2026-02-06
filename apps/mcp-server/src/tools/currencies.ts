/**
 * Currency & Exchange Rate Tools (SCOPE-003)
 *
 * Tools for working with currencies and exchange rates.
 *
 * @see SCOPE-003 in operations/ROADMAP.md
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import type { ExactODataResponse, ExactCurrency, ExactExchangeRate } from '@exact-mcp/shared';

/**
 * Get Currencies Tool
 *
 * Retrieves available currencies in the administration.
 */
export class GetCurrenciesTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_currencies',
    description:
      'Haal valuta overzicht op uit Exact Online. ' +
      'Gebruik voor: beschikbare valuta, valuta instellingen, multicurrency administratie. ' +
      'Toont valutacode, naam, symbool en of het de standaard valuta is.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        active_only: {
          type: 'boolean',
          description: 'Alleen actieve valuta tonen. Default: true',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        currencies: { type: 'array' },
        count: { type: 'number' },
        default_currency: { type: 'string' },
        division: { type: 'number' },
      },
      required: ['currencies', 'count', 'default_currency', 'division'],
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

    // Note: Currencies endpoint doesn't have Active/IsDefault/Symbol fields
    // Available fields: Code, Description, AmountPrecision, PricePrecision, Created, Modified
    const endpoint = `/${division}/general/Currencies?$select=Code,Description,AmountPrecision,PricePrecision`;

    try {
      const response = await this.exactRequest<ExactODataResponse<ExactCurrency>>(connection, endpoint);
      const currencies = extractODataResults<ExactCurrency>(response?.d as Record<string, unknown>);

      const formattedCurrencies = currencies.map((currency: ExactCurrency) => {
        const curr = currency as unknown as Record<string, unknown>;
        return {
          code: currency.Code,
          name: currency.Description,
          amount_precision: curr.AmountPrecision,
          price_precision: curr.PricePrecision,
        };
      });

      return {
        currencies: formattedCurrencies,
        count: formattedCurrencies.length,
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen valuta: ${(error as Error).message}`,
        division,
      };
    }
  }
}

/**
 * Get Currency Rates Tool
 *
 * Retrieves exchange rates between currencies.
 */
export class GetCurrencyRatesTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_currency_rates',
    description:
      'Haal wisselkoersen op uit Exact Online. ' +
      'Gebruik voor: wisselkoers historie, valuta conversie, multicurrency rapportage. ' +
      'Kan filteren op bron- en doelvaluta en periode.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        source_currency: {
          type: 'string',
          description: 'Bronvaluta code (bijv. USD). Optioneel.',
        },
        target_currency: {
          type: 'string',
          description: 'Doelvaluta code (bijv. EUR). Optioneel.',
        },
        date_from: {
          type: 'string',
          description: 'Startdatum (YYYY-MM-DD). Optioneel.',
        },
        date_to: {
          type: 'string',
          description: 'Einddatum (YYYY-MM-DD). Optioneel.',
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
        rates: { type: 'array' },
        count: { type: 'number' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['rates', 'count', 'filters', 'division'],
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

    const sourceCurrency = params.source_currency as string | undefined;
    const targetCurrency = params.target_currency as string | undefined;
    const dateFrom = params.date_from as string | undefined;
    const dateTo = params.date_to as string | undefined;
    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);

    // Validate currency codes (ISO 4217: 3 uppercase letters)
    const currencyRegex = /^[A-Z]{3}$/;
    if (sourceCurrency && !currencyRegex.test(sourceCurrency)) {
      return { error: 'Ongeldige bronvaluta code. Gebruik ISO 4217 formaat (bijv. EUR, USD).' };
    }
    if (targetCurrency && !currencyRegex.test(targetCurrency)) {
      return { error: 'Ongeldige doelvaluta code. Gebruik ISO 4217 formaat (bijv. EUR, USD).' };
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateFrom && !dateRegex.test(dateFrom)) {
      return { error: 'Ongeldige startdatum. Gebruik YYYY-MM-DD formaat.' };
    }
    if (dateTo && !dateRegex.test(dateTo)) {
      return { error: 'Ongeldige einddatum. Gebruik YYYY-MM-DD formaat.' };
    }

    const filters: string[] = [];

    if (sourceCurrency) {
      filters.push(`SourceCurrency eq '${sourceCurrency}'`);
    }

    if (targetCurrency) {
      filters.push(`TargetCurrency eq '${targetCurrency}'`);
    }

    if (dateFrom) {
      filters.push(`StartDate ge datetime'${dateFrom}'`);
    }

    if (dateTo) {
      filters.push(`StartDate le datetime'${dateTo}'`);
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';
    const endpoint = `/${division}/financial/ExchangeRates?$select=ID,SourceCurrency,TargetCurrency,StartDate,Rate,Created${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<ExactODataResponse<ExactExchangeRate>>(connection, endpoint);
      const rates = extractODataResults<ExactExchangeRate>(response?.d as Record<string, unknown>);

      // Group by currency pair for summary
      const pairRates: Record<string, { latest: number; count: number }> = {};

      const formattedRates = rates.map((rate: ExactExchangeRate) => {
        const pair = `${rate.SourceCurrency}/${rate.TargetCurrency}`;
        if (!pairRates[pair]) {
          pairRates[pair] = { latest: rate.Rate, count: 0 };
        }
        pairRates[pair].count++;

        return {
          id: rate.ID,
          source_currency: rate.SourceCurrency,
          target_currency: rate.TargetCurrency,
          pair: pair,
          rate: rate.Rate,
          start_date: this.formatDate(rate.StartDate),
          created: this.formatDate(rate.Created),
        };
      });

      return {
        rates: formattedRates,
        count: formattedRates.length,
        summary: {
          pairs: Object.entries(pairRates).map(([pair, data]) => ({
            pair,
            latest_rate: data.latest,
            rate_count: data.count,
          })),
        },
        filters: {
          source_currency: sourceCurrency,
          target_currency: targetCurrency,
          date_from: dateFrom,
          date_to: dateTo,
        },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen wisselkoersen: ${(error as Error).message}`,
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

// Export all currency tools
export const currencyTools = [
  GetCurrenciesTool,
  GetCurrencyRatesTool,
];
