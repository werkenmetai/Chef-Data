/**
 * Demo Generators: get_relations, search_relations
 *
 * Returns demo relation data for Bakkerij De Gouden Croissant.
 */

import { getCurrentIndustryConfig } from '../context';
import { getRelations, searchRelations, DemoRelation } from '../data/relations';

/**
 * Map internal DemoRelation to tool output format
 */
function mapRelation(r: DemoRelation) {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    email: r.email,
    phone: r.phone,
    city: r.city,
    country: r.country,
    vat_number: r.vatNumber,
    kvk_number: r.kvkNumber,
    is_customer: r.isCustomer,
    is_supplier: r.isSupplier,
    status: r.status,
    relationship_type: r.relationshipType,
  };
}

/**
 * Generate response for get_relations tool
 */
export function generateGetRelationsResponse(
  params: Record<string, unknown>
): unknown {
  const type = (params.type as 'customer' | 'supplier' | 'both') || 'both';
  const activeOnly = params.active_only !== false;
  const limit = Math.min(Math.max((params.limit as number) || 100, 1), 1000);

  const relations = getRelations({ type, activeOnly, limit });
  const mappedRelations = relations.map(mapRelation);

  return {
    relations: mappedRelations,
    count: mappedRelations.length,
    division: getCurrentIndustryConfig().division.code,
    filter: { type, active_only: activeOnly },
    _demo: true,
    _debug: {
      full_url: `[DEMO] https://start.exactonline.nl/api/v1/${getCurrentIndustryConfig().division.code}/crm/Accounts`,
      response_keys: ['d'],
      d_keys: ['results'],
      extracted_count: mappedRelations.length,
    },
  };
}

/**
 * Generate response for search_relations tool
 */
export function generateSearchRelationsResponse(
  params: Record<string, unknown>
): unknown {
  const query = params.query as string;
  const searchField = (params.search_field as 'name' | 'code' | 'kvk' | 'vat' | 'all') || 'all';

  if (!query) {
    return {
      error: 'Zoekterm (query) is verplicht.',
      results: [],
      count: 0,
    };
  }

  const relations = searchRelations(query, searchField);
  const mappedRelations = relations.map((r) => ({
    ...mapRelation(r),
    credit_limit: r.creditLimit,
  }));

  return {
    results: mappedRelations,
    count: mappedRelations.length,
    query,
    search_field: searchField,
    _demo: true,
  };
}
