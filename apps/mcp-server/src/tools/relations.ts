/**
 * Relations Tools
 *
 * Tools for working with Exact Online relations (customers, suppliers, contacts).
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import { escapeODataString } from '../exact/odata-query';
import type { ExactAccount, ExactODataResponse } from '@exact-mcp/shared';

/**
 * Get Relations Tool
 */
export class GetRelationsTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_relations',
    description:
      // WAT
      'Haal lijst van klanten en/of leveranciers (relaties) op met contactgegevens. ' +
      // WANNEER - Vraag-mapping
      'GEBRUIK BIJ: "toon alle klanten", "lijst van leveranciers", "klantenbestand", ' +
      '"hoeveel klanten hebben we", "contactgegevens", "KvK nummers", "BTW nummers". ' +
      // HOE - Filter guidance
      'KIES type=customer voor: alleen klanten, klantenlijst, debiteuren. ' +
      'KIES type=supplier voor: alleen leveranciers, crediteuren. ' +
      'KIES type=both (default) voor: alle relaties. ' +
      'KIES active_only=false voor: ook geblokkeerde/inactieve relaties. ' +
      // WAT JE KRIJGT
      'RESULTAAT: naam, code, email, telefoon, stad, KvK, BTW per relatie. ' +
      // WAT NIET
      'NIET VOOR: specifieke relatie zoeken op naam (gebruik search_relations), ' +
      'openstaande facturen per klant (gebruik get_outstanding_invoices).',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code. Optioneel: zonder = standaard administratie.',
        },
        type: {
          type: 'string',
          enum: ['customer', 'supplier', 'both'],
          description:
            'customer = alleen klanten/debiteuren. ' +
            'supplier = alleen leveranciers/crediteuren. ' +
            'both (default) = alle relaties.',
        },
        active_only: {
          type: 'boolean',
          description:
            'true (default) = alleen actieve relaties. ' +
            'false = ook geblokkeerde/inactieve relaties tonen.',
        },
        limit: {
          type: 'number',
          description:
            'Max aantal resultaten (1-1000). Default: 100. ' +
            'Gebruik hoger voor complete export, lager voor snelheid.',
        },
      },
      required: [],
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
    const type = (params.type as string) || 'both';
    const activeOnly = params.active_only !== false;
    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 1000);

    // Build OData filter
    const filters: string[] = [];

    // Active filter - Blocked field determines if account is active or blocked
    if (activeOnly) {
      filters.push('Blocked eq false');
    }

    // Type filter - Note: IsCustomer field does NOT exist!
    // Customer status is in Status field: A=None, S=Suspect, P=Prospect, C=Customer
    // For 'both' we don't filter on type - we want ALL accounts
    if (type === 'customer') {
      // Status C/P/S means some form of customer relationship (not A=None)
      filters.push(`(Status eq 'C' or Status eq 'P' or Status eq 'S')`);
    } else if (type === 'supplier') {
      filters.push('IsSupplier eq true');
    }
    // type='both' - NO filter needed, we want all accounts

    const filterString = filters.length > 0 ? filters.join(' and ') : '';

    // Build endpoint
    // DEBUG: Try multiple endpoints to find which one works
    // Previous attempts:
    // - /crm/Accounts?$top=5 → 0 results
    // - /bulk/CRM/Accounts?$top=5 → 0 results
    // - /sync/CRM/Accounts?$top=5 → Testing
    // Current: Try /read/crm/Accounts (like financial endpoints use /read/)
    const filterParam = filterString ? `&$filter=${encodeURIComponent(filterString)}` : '';

    // DEBUG: Build full URL to see exactly what we're calling
    const endpoint = `/${division}/crm/Accounts?$top=${limit}${filterParam}`;
    const baseUrl = this.getExactApiUrl(connection.region);
    const fullUrl = `${baseUrl}${endpoint}`;

    try {
      // Use exactRequest which handles token refresh properly
      const response = await this.exactRequest<{ d: Record<string, unknown>; error?: { message?: { value?: string } } }>(
        connection,
        endpoint
      );

      // Check for OData error in response
      if (response?.error) {
        return {
          error: response.error.message?.value || 'Unknown OData error',
          _debug: {
            full_url: fullUrl,
            odata_error: response.error,
          },
        };
      }

      // Use central helper to handle both OData formats
      const relations = extractODataResults<ExactAccount>(response.d);

      return {
        relations: relations.map((r: ExactAccount) => ({
          id: r.ID,
          code: r.Code,
          name: r.Name,
          email: r.Email,
          phone: r.Phone,
          city: r.City,
          country: r.Country,
          vat_number: r.VATNumber,
          kvk_number: r.ChamberOfCommerce,
          is_customer: r.Status === 'C' || r.Status === 'P' || r.Status === 'S',
          is_supplier: r.IsSupplier,
          status: r.Blocked ? 'blocked' : 'active',
          relationship_type: r.Status,
        })),
        count: relations.length,
        division,
        filter: { type, active_only: activeOnly },
        _debug: {
          full_url: fullUrl,
          response_keys: response ? Object.keys(response) : [],
          d_keys: response?.d ? Object.keys(response.d) : [],
          extracted_count: relations.length,
        },
      };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Unknown error',
        _debug: {
          full_url: fullUrl,
          error_type: err instanceof Error ? err.constructor.name : typeof err,
          error_message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }
}

/**
 * Search Relations Tool
 */
export class SearchRelationsTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'search_relations',
    description:
      // WAT
      'Zoek een SPECIFIEKE klant of leverancier op naam, code, KvK of BTW-nummer. ' +
      // WANNEER - Vraag-mapping
      'GEBRUIK BIJ: "zoek klant [naam]", "vind leverancier [naam]", "wie is [naam]", ' +
      '"klant met KvK [nummer]", "bedrijf met BTW [nummer]", "gegevens van [naam]". ' +
      // HOE - Filter guidance
      'KIES search_field=name voor: zoeken op bedrijfsnaam (standaard, meest gebruikt). ' +
      'KIES search_field=code voor: zoeken op klantcode/leverancierscode. ' +
      'KIES search_field=kvk voor: zoeken op KvK-nummer (8 cijfers). ' +
      'KIES search_field=vat voor: zoeken op BTW-nummer (NL123456789B01). ' +
      'KIES search_field=all (default) voor: zoeken in alle velden. ' +
      // WAT JE KRIJGT
      'RESULTAAT: volledige gegevens van gevonden relatie(s). ' +
      // WAT NIET
      'NIET VOOR: lijst van alle klanten (gebruik get_relations), ' +
      'openstaande facturen (gebruik get_outstanding_invoices met customer_id).',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code. Verplicht voor zoeken.',
        },
        query: {
          type: 'string',
          description:
            'Zoekterm. Voorbeelden: "Bakker", "KLANT001", "12345678", "NL123456789B01". ' +
            'Minimaal 2 karakters voor effectieve zoekresultaten.',
        },
        search_field: {
          type: 'string',
          enum: ['name', 'code', 'kvk', 'vat'],
          description:
            'name (default) = zoek op bedrijfsnaam (bevat, niet exact). ' +
            'code = zoek op klant/leverancierscode (exact). ' +
            'kvk = zoek op KvK-nummer (exact). ' +
            'vat = zoek op BTW-nummer (exact).',
        },
      },
      required: ['division', 'query'],
    },
    annotations: DEFAULT_TOOL_ANNOTATIONS,
  };

  async run(params: Record<string, unknown>): Promise<unknown> {
    const division = params.division as number;
    const query = params.query as string;
    const searchField = (params.search_field as string) || 'all';

    const connection = this.getConnection();
    if (!connection) {
      return { error: 'Geen Exact Online connectie gevonden.' };
    }

    // Build search filter
    // @see EXACT-004 in operations/ROADMAP.md - OData injection prevention
    let filter: string;
    const searchTerm = escapeODataString(query);

    // Note: Exact Online OData requires 'eq true' suffix for substringof()
    // @see MCP Tool vs Exact API Verificatie Tabel in operations/ROADMAP.md
    // Note: Complex OR filters with substringof may fail - use simple filters only
    switch (searchField) {
      case 'name':
        filter = `substringof('${searchTerm}', Name) eq true`;
        break;
      case 'code':
        filter = `Code eq '${searchTerm}'`;
        break;
      case 'kvk':
        filter = `ChamberOfCommerce eq '${searchTerm}'`;
        break;
      case 'vat':
        filter = `VATNumber eq '${searchTerm}'`;
        break;
      default:
        // 'all' mode: search by name only to avoid complex OR filter issues
        // Complex OR filters with substringof often fail in Exact Online OData
        filter = `substringof('${searchTerm}', Name) eq true`;
    }

    // Note: IsCustomer field does NOT exist - use Status field instead
    // Note: CreditLine may not exist on all accounts - removed to avoid errors
    const endpoint = `/${division}/crm/Accounts?$select=ID,Code,Name,Email,Phone,City,Country,VATNumber,ChamberOfCommerce,IsSupplier,Status,Blocked&$filter=${encodeURIComponent(filter)}&$top=50`;

    const response = await this.exactRequest<ExactODataResponse<ExactAccount>>(
      connection,
      endpoint
    );

    const relations = extractODataResults<ExactAccount>(response.d as Record<string, unknown>);

    return {
      results: relations.map((r: ExactAccount) => ({
        id: r.ID,
        code: r.Code,
        name: r.Name,
        email: r.Email,
        phone: r.Phone,
        city: r.City,
        country: r.Country,
        vat_number: r.VATNumber,
        kvk_number: r.ChamberOfCommerce,
        // IsCustomer doesn't exist - derive from Status: C=Customer, P=Prospect, S=Suspect
        is_customer: r.Status === 'C' || r.Status === 'P' || r.Status === 'S',
        is_supplier: r.IsSupplier,
        status: r.Blocked ? 'blocked' : 'active', // Blocked field determines active/blocked
        relationship_type: r.Status, // C=Customer, S=Suspect, P=Prospect
      })),
      count: relations.length,
      query,
      search_field: searchField,
    };
  }
}
