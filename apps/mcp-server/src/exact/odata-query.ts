/**
 * OData Query Builder for Exact Online API
 *
 * Provides a fluent interface for building OData queries.
 * Handles proper escaping and formatting for all data types.
 *
 * @see docs/exact-online-api/odata.md
 */

export type FilterOperator = 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le';
export type SortDirection = 'asc' | 'desc';

export interface ODataQueryOptions {
  filters?: string[];
  select?: string[];
  orderBy?: Array<{ field: string; direction: SortDirection }>;
  top?: number;
  skip?: number;
  expand?: string[];
}

export class ODataQueryBuilder {
  private filters: string[] = [];
  private selects: string[] = [];
  private orderBys: Array<{ field: string; direction: SortDirection }> = [];
  private topValue: number | null = null;
  private skipValue: number | null = null;
  private expands: string[] = [];

  /**
   * Create a new query builder, optionally from existing options
   */
  constructor(options?: ODataQueryOptions) {
    if (options) {
      this.filters = options.filters || [];
      this.selects = options.select || [];
      this.orderBys = options.orderBy || [];
      this.topValue = options.top ?? null;
      this.skipValue = options.skip ?? null;
      this.expands = options.expand || [];
    }
  }

  /**
   * Clone the current builder
   */
  clone(): ODataQueryBuilder {
    const builder = new ODataQueryBuilder();
    builder.filters = [...this.filters];
    builder.selects = [...this.selects];
    builder.orderBys = [...this.orderBys];
    builder.topValue = this.topValue;
    builder.skipValue = this.skipValue;
    builder.expands = [...this.expands];
    return builder;
  }

  // ===== FILTER METHODS =====

  /**
   * Add a raw filter expression
   */
  filter(condition: string): this {
    this.filters.push(condition);
    return this;
  }

  /**
   * Add an equality filter
   */
  where(field: string, value: string | number | boolean): this {
    return this.filter(`${field} eq ${this.formatValue(value)}`);
  }

  /**
   * Add a comparison filter
   */
  compare(field: string, operator: FilterOperator, value: string | number | boolean): this {
    return this.filter(`${field} ${operator} ${this.formatValue(value)}`);
  }

  /**
   * Add a GUID filter (automatically formats the GUID)
   */
  whereGuid(field: string, guid: string): this {
    return this.filter(`${field} eq guid'${this.sanitizeGuid(guid)}'`);
  }

  /**
   * Add a date filter
   */
  whereDate(field: string, operator: FilterOperator, date: Date | string): this {
    const dateStr = this.formatDate(date);
    return this.filter(`${field} ${operator} datetime'${dateStr}'`);
  }

  /**
   * Add a date range filter (inclusive start, exclusive end)
   */
  whereDateBetween(field: string, startDate: Date | string, endDate: Date | string): this {
    const start = this.formatDate(startDate);
    const end = this.formatDate(endDate);
    return this.filter(`${field} ge datetime'${start}' and ${field} lt datetime'${end}'`);
  }

  /**
   * Add a "starts with" filter
   */
  startsWith(field: string, value: string): this {
    return this.filter(`startswith(${field}, '${this.escapeString(value)}')`);
  }

  /**
   * Add an "ends with" filter
   */
  endsWith(field: string, value: string): this {
    return this.filter(`endswith(${field}, '${this.escapeString(value)}')`);
  }

  /**
   * Add a "contains" filter (substringof)
   * Note: Exact Online OData requires 'eq true' suffix for substringof()
   * @see P10-001 in operations/ROADMAP.md
   */
  contains(field: string, value: string): this {
    return this.filter(`substringof('${this.escapeString(value)}', ${field}) eq true`);
  }

  /**
   * Add a case-insensitive contains filter
   * Note: Exact Online OData requires 'eq true' suffix for substringof()
   * @see P10-001 in operations/ROADMAP.md
   */
  containsIgnoreCase(field: string, value: string): this {
    return this.filter(`substringof('${this.escapeString(value.toLowerCase())}', tolower(${field})) eq true`);
  }

  /**
   * Add a "not" condition
   */
  not(condition: string): this {
    return this.filter(`not(${condition})`);
  }

  /**
   * Add an "IN" filter (multiple OR conditions)
   */
  whereIn(field: string, values: Array<string | number>): this {
    if (values.length === 0) {
      return this;
    }
    if (values.length === 1) {
      return this.where(field, values[0]);
    }
    const conditions = values.map((v) => `${field} eq ${this.formatValue(v)}`);
    return this.filter(`(${conditions.join(' or ')})`);
  }

  /**
   * Add an "IN" filter for GUIDs
   */
  whereGuidIn(field: string, guids: string[]): this {
    if (guids.length === 0) {
      return this;
    }
    if (guids.length === 1) {
      return this.whereGuid(field, guids[0]);
    }
    const conditions = guids.map((g) => `${field} eq guid'${this.sanitizeGuid(g)}'`);
    return this.filter(`(${conditions.join(' or ')})`);
  }

  /**
   * Add a null check filter
   */
  whereNull(field: string): this {
    return this.filter(`${field} eq null`);
  }

  /**
   * Add a not-null check filter
   */
  whereNotNull(field: string): this {
    return this.filter(`${field} ne null`);
  }

  // ===== SELECT METHODS =====

  /**
   * Select specific fields
   */
  select(...fields: string[]): this {
    this.selects.push(...fields);
    return this;
  }

  /**
   * Clear selection (returns all fields)
   */
  clearSelect(): this {
    this.selects = [];
    return this;
  }

  // ===== ORDER METHODS =====

  /**
   * Add ordering (ascending)
   */
  orderBy(field: string): this {
    this.orderBys.push({ field, direction: 'asc' });
    return this;
  }

  /**
   * Add ordering (descending)
   */
  orderByDesc(field: string): this {
    this.orderBys.push({ field, direction: 'desc' });
    return this;
  }

  /**
   * Add ordering with explicit direction
   */
  order(field: string, direction: SortDirection): this {
    this.orderBys.push({ field, direction });
    return this;
  }

  /**
   * Clear ordering
   */
  clearOrder(): this {
    this.orderBys = [];
    return this;
  }

  // ===== PAGINATION METHODS =====

  /**
   * Set maximum number of results
   */
  top(n: number): this {
    this.topValue = n;
    return this;
  }

  /**
   * Alias for top()
   */
  limit(n: number): this {
    return this.top(n);
  }

  /**
   * Skip N results
   */
  skip(n: number): this {
    this.skipValue = n;
    return this;
  }

  /**
   * Alias for skip()
   */
  offset(n: number): this {
    return this.skip(n);
  }

  /**
   * Set page (1-indexed)
   */
  page(pageNumber: number, pageSize: number): this {
    this.topValue = pageSize;
    this.skipValue = (pageNumber - 1) * pageSize;
    return this;
  }

  // ===== EXPAND METHODS =====

  /**
   * Expand related entities
   */
  expand(...entities: string[]): this {
    this.expands.push(...entities);
    return this;
  }

  /**
   * Clear expansions
   */
  clearExpand(): this {
    this.expands = [];
    return this;
  }

  // ===== BUILD METHODS =====

  /**
   * Build the query string (without leading ?)
   */
  build(): string {
    const params: string[] = [];

    if (this.filters.length > 0) {
      params.push(`$filter=${this.filters.join(' and ')}`);
    }

    if (this.selects.length > 0) {
      params.push(`$select=${this.selects.join(',')}`);
    }

    if (this.orderBys.length > 0) {
      const orderStr = this.orderBys.map((o) => `${o.field} ${o.direction}`).join(',');
      params.push(`$orderby=${orderStr}`);
    }

    if (this.topValue !== null) {
      params.push(`$top=${this.topValue}`);
    }

    if (this.skipValue !== null && this.skipValue > 0) {
      params.push(`$skip=${this.skipValue}`);
    }

    if (this.expands.length > 0) {
      params.push(`$expand=${this.expands.join(',')}`);
    }

    return params.join('&');
  }

  /**
   * Build the query string with leading ?
   */
  toQueryString(): string {
    const query = this.build();
    return query ? `?${query}` : '';
  }

  /**
   * Get query as URL search params
   */
  toParams(): Record<string, string> {
    const params: Record<string, string> = {};

    if (this.filters.length > 0) {
      params['$filter'] = this.filters.join(' and ');
    }

    if (this.selects.length > 0) {
      params['$select'] = this.selects.join(',');
    }

    if (this.orderBys.length > 0) {
      params['$orderby'] = this.orderBys.map((o) => `${o.field} ${o.direction}`).join(',');
    }

    if (this.topValue !== null) {
      params['$top'] = String(this.topValue);
    }

    if (this.skipValue !== null && this.skipValue > 0) {
      params['$skip'] = String(this.skipValue);
    }

    if (this.expands.length > 0) {
      params['$expand'] = this.expands.join(',');
    }

    return params;
  }

  /**
   * Reset all query options
   */
  reset(): this {
    this.filters = [];
    this.selects = [];
    this.orderBys = [];
    this.topValue = null;
    this.skipValue = null;
    this.expands = [];
    return this;
  }

  // ===== HELPER METHODS =====

  private formatValue(value: string | number | boolean): string {
    if (typeof value === 'string') {
      return `'${this.escapeString(value)}'`;
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return String(value);
  }

  private escapeString(value: string): string {
    // OData uses '' to escape single quotes
    return value.replace(/'/g, "''");
  }

  private sanitizeGuid(guid: string): string {
    // Remove any existing guid prefix and clean up
    return guid.replace(/^guid['"]?/i, '').replace(/['"]$/g, '');
  }

  private formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      // Assume ISO format or accept as-is
      if (date.includes('T')) {
        return date;
      }
      return `${date}T00:00:00`;
    }
    return date.toISOString().replace('Z', '');
  }
}

/**
 * Factory function for creating query builders
 */
export function query(options?: ODataQueryOptions): ODataQueryBuilder {
  return new ODataQueryBuilder(options);
}

/**
 * Escape a string value for use in OData $filter queries
 * Prevents OData injection attacks by escaping single quotes
 *
 * @see EXACT-004 in operations/ROADMAP.md
 * @example
 * // Safe usage:
 * const filter = `substringof('${escapeODataString(userInput)}', Name)`;
 */
export function escapeODataString(value: string): string {
  if (!value) return '';
  // OData uses '' to escape single quotes
  return value.replace(/'/g, "''");
}

/**
 * RFC 4122 GUID regex pattern
 * Matches: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate a GUID string against RFC 4122 format
 * Prevents OData injection attacks by rejecting malformed GUIDs
 *
 * @param guid - The GUID string to validate
 * @returns The validated GUID (lowercase, trimmed)
 * @throws Error if GUID format is invalid
 *
 * @see MCP-AUDIT-W06 - GUID injection vulnerability fix
 * @example
 * // Safe usage:
 * const filter = `Account eq guid'${validateGuid(accountId)}'`;
 *
 * // Will throw on injection attempt:
 * validateGuid("00000000-0000-0000-0000-000000000000' or '1'='1")
 */
export function validateGuid(guid: string): string {
  if (!guid) {
    throw new Error('GUID is required but was empty or undefined');
  }

  const trimmed = guid.trim().toLowerCase();

  if (!GUID_REGEX.test(trimmed)) {
    throw new Error(`Invalid GUID format: "${guid}". Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`);
  }

  return trimmed;
}

/**
 * Build a safe GUID filter for OData queries
 * Validates the GUID and returns the properly formatted filter string
 *
 * @param field - The field name to filter on
 * @param guid - The GUID value (will be validated)
 * @returns Formatted filter string: "Field eq guid'xxxxxxxx-...'"
 * @throws Error if GUID format is invalid
 *
 * @see MCP-AUDIT-W06 - GUID injection vulnerability fix
 * @example
 * const filter = buildGuidFilter('Account', accountId);
 * // Returns: "Account eq guid'12345678-1234-1234-1234-123456789abc'"
 */
export function buildGuidFilter(field: string, guid: string): string {
  const validatedGuid = validateGuid(guid);
  return `${field} eq guid'${validatedGuid}'`;
}

/**
 * Build a substringof filter for Exact Online OData
 *
 * IMPORTANT: Exact Online requires `eq true` suffix for substringof() filters.
 * Standard OData allows `substringof('x', Field)` but Exact requires `substringof('x', Field) eq true`
 *
 * @param searchTerm - The search term (will be escaped)
 * @param field - The field to search in
 * @returns Properly formatted substringof filter
 *
 * @see P10-001 in operations/ROADMAP.md
 * @example
 * // Single field search
 * buildSubstringFilter('bakker', 'Name')
 * // Returns: "substringof('bakker', Name) eq true"
 *
 * // Multiple fields (use buildSubstringFilterMultiple instead)
 */
export function buildSubstringFilter(searchTerm: string, field: string): string {
  const escaped = escapeODataString(searchTerm);
  return `substringof('${escaped}', ${field}) eq true`;
}

/**
 * Build a substringof filter for multiple fields (OR condition)
 *
 * @param searchTerm - The search term (will be escaped)
 * @param fields - Array of fields to search in
 * @returns Properly formatted substringof filter with OR conditions
 *
 * @see P10-001 in operations/ROADMAP.md
 * @example
 * buildSubstringFilterMultiple('bakker', ['Code', 'Name', 'Description'])
 * // Returns: "(substringof('bakker', Code) eq true or substringof('bakker', Name) eq true or substringof('bakker', Description) eq true)"
 */
export function buildSubstringFilterMultiple(searchTerm: string, fields: string[]): string {
  if (fields.length === 0) return '';
  if (fields.length === 1) return buildSubstringFilter(searchTerm, fields[0]);

  const escaped = escapeODataString(searchTerm);
  const conditions = fields.map(field => `substringof('${escaped}', ${field}) eq true`);
  return `(${conditions.join(' or ')})`;
}

/**
 * Common query presets
 */
export const QueryPresets = {
  /**
   * Query for active customers
   */
  activeCustomers(): ODataQueryBuilder {
    return query()
      .where('Status', 'C')
      .where('IsCustomer', true)
      .select('ID', 'Code', 'Name', 'Email', 'Phone')
      .orderBy('Name');
  },

  /**
   * Query for unpaid invoices
   */
  unpaidInvoices(): ODataQueryBuilder {
    return query()
      .compare('Status', 'ne', 50)
      .compare('AmountDC', 'gt', 0)
      .select('InvoiceID', 'InvoiceNumber', 'CustomerName', 'AmountDC', 'DueDate')
      .orderBy('DueDate');
  },

  /**
   * Query for recent transactions
   */
  recentTransactions(daysAgo: number = 30): ODataQueryBuilder {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    return query()
      .whereDate('Date', 'ge', startDate)
      .orderByDesc('Date')
      .limit(1000);
  },

  /**
   * Query for items by group
   */
  itemsByGroup(groupGuid: string): ODataQueryBuilder {
    return query()
      .whereGuid('ItemGroup', groupGuid)
      .select('ID', 'Code', 'Description', 'SalesPrice')
      .orderBy('Code');
  },
};
