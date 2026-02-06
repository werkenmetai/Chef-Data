/**
 * OData Query Builder Tests
 *
 * Tests for the OData query building utilities including:
 * - escapeODataString() - escaping single quotes
 * - buildSubstringFilter() - single field substring search with 'eq true' suffix
 * - buildSubstringFilterMultiple() - multi-field substring search with 'eq true' suffix
 * - ODataQueryBuilder.contains() - substringof filter with 'eq true' suffix
 * - ODataQueryBuilder.containsIgnoreCase() - case-insensitive substringof with 'eq true' suffix
 *
 * IMPORTANT: These tests prevent regression of the P10-001 bug where substringof()
 * filters without 'eq true' suffix cause HTTP 400 errors from Exact Online API.
 *
 * @see P10-001 in operations/ROADMAP.md
 */

import { describe, it, expect } from 'vitest';
import {
  escapeODataString,
  buildSubstringFilter,
  buildSubstringFilterMultiple,
  ODataQueryBuilder,
  query,
} from '../exact/odata-query';

describe('escapeODataString', () => {
  it('should return empty string for empty input', () => {
    expect(escapeODataString('')).toBe('');
  });

  it('should return empty string for null/undefined input', () => {
    expect(escapeODataString(null as any)).toBe('');
    expect(escapeODataString(undefined as any)).toBe('');
  });

  it('should pass through normal strings unchanged', () => {
    expect(escapeODataString('Bakker')).toBe('Bakker');
    expect(escapeODataString('Test Company')).toBe('Test Company');
    expect(escapeODataString('ABC-123')).toBe('ABC-123');
  });

  it('should escape single quotes by doubling them', () => {
    expect(escapeODataString("O'Brien")).toBe("O''Brien");
    expect(escapeODataString("McDonald's")).toBe("McDonald''s");
  });

  it('should escape multiple single quotes', () => {
    expect(escapeODataString("It's John's")).toBe("It''s John''s");
    expect(escapeODataString("'''")).toBe("''''''");
  });

  it('should handle strings with only single quotes', () => {
    expect(escapeODataString("'")).toBe("''");
    expect(escapeODataString("''")).toBe("''''");
  });

  it('should preserve other special characters', () => {
    expect(escapeODataString('Hello "World"')).toBe('Hello "World"');
    expect(escapeODataString('Test & Co')).toBe('Test & Co');
    expect(escapeODataString('100%')).toBe('100%');
  });

  it('should handle unicode characters', () => {
    expect(escapeODataString('Caf\u00e9')).toBe('Caf\u00e9');
    expect(escapeODataString('\u4e2d\u6587')).toBe('\u4e2d\u6587');
  });
});

describe('buildSubstringFilter', () => {
  it('should build filter with eq true suffix for normal string', () => {
    const result = buildSubstringFilter('bakker', 'Name');
    expect(result).toBe("substringof('bakker', Name) eq true");
  });

  it('should contain eq true suffix - CRITICAL for Exact Online compatibility', () => {
    const result = buildSubstringFilter('test', 'Description');
    expect(result).toContain('eq true');
    expect(result).toMatch(/substringof\([^)]+\) eq true$/);
  });

  it('should escape single quotes in search term', () => {
    const result = buildSubstringFilter("O'Brien", 'Name');
    expect(result).toBe("substringof('O''Brien', Name) eq true");
  });

  it('should handle empty search term', () => {
    const result = buildSubstringFilter('', 'Name');
    expect(result).toBe("substringof('', Name) eq true");
  });

  it('should handle various field names', () => {
    expect(buildSubstringFilter('test', 'Code')).toBe("substringof('test', Code) eq true");
    expect(buildSubstringFilter('test', 'Description')).toBe("substringof('test', Description) eq true");
    expect(buildSubstringFilter('test', 'CustomerName')).toBe("substringof('test', CustomerName) eq true");
  });

  it('should handle complex search terms', () => {
    const result = buildSubstringFilter("John's \"Company\" & Co", 'Name');
    expect(result).toBe("substringof('John''s \"Company\" & Co', Name) eq true");
    expect(result).toContain('eq true');
  });
});

describe('buildSubstringFilterMultiple', () => {
  it('should return empty string for empty fields array', () => {
    expect(buildSubstringFilterMultiple('test', [])).toBe('');
  });

  it('should return single filter for single field', () => {
    const result = buildSubstringFilterMultiple('bakker', ['Name']);
    expect(result).toBe("substringof('bakker', Name) eq true");
  });

  it('should build OR filter for multiple fields', () => {
    const result = buildSubstringFilterMultiple('bakker', ['Code', 'Name', 'Description']);
    expect(result).toBe(
      "(substringof('bakker', Code) eq true or substringof('bakker', Name) eq true or substringof('bakker', Description) eq true)"
    );
  });

  it('should contain eq true for EACH field - CRITICAL for Exact Online compatibility', () => {
    const result = buildSubstringFilterMultiple('test', ['Code', 'Name', 'Description']);

    // Count occurrences of 'eq true' - should match number of fields
    const eqTrueCount = (result.match(/eq true/g) || []).length;
    expect(eqTrueCount).toBe(3);
  });

  it('should escape single quotes in search term for all fields', () => {
    const result = buildSubstringFilterMultiple("O'Brien", ['Code', 'Name']);
    expect(result).toBe(
      "(substringof('O''Brien', Code) eq true or substringof('O''Brien', Name) eq true)"
    );
  });

  it('should handle empty search term with multiple fields', () => {
    const result = buildSubstringFilterMultiple('', ['Code', 'Name']);
    expect(result).toBe(
      "(substringof('', Code) eq true or substringof('', Name) eq true)"
    );
  });

  it('should wrap multiple conditions in parentheses', () => {
    const result = buildSubstringFilterMultiple('test', ['A', 'B']);
    expect(result).toMatch(/^\(.*\)$/);
  });
});

describe('ODataQueryBuilder.contains', () => {
  it('should build contains filter with eq true suffix', () => {
    const builder = new ODataQueryBuilder();
    builder.contains('Name', 'bakker');
    const result = builder.build();

    expect(result).toBe("$filter=substringof('bakker', Name) eq true");
  });

  it('should contain eq true suffix - CRITICAL for Exact Online compatibility', () => {
    const builder = query().contains('Description', 'test');
    const result = builder.build();

    expect(result).toContain('eq true');
    expect(result).toMatch(/substringof\([^)]+\) eq true/);
  });

  it('should escape single quotes in search value', () => {
    const builder = query().contains('Name', "O'Brien");
    const result = builder.build();

    expect(result).toBe("$filter=substringof('O''Brien', Name) eq true");
  });

  it('should handle empty search value', () => {
    const builder = query().contains('Name', '');
    const result = builder.build();

    expect(result).toBe("$filter=substringof('', Name) eq true");
  });

  it('should combine with other filters using AND', () => {
    const builder = query()
      .contains('Name', 'bakker')
      .where('Status', 'C');
    const result = builder.build();

    expect(result).toBe("$filter=substringof('bakker', Name) eq true and Status eq 'C'");
    expect(result).toContain('eq true');
  });
});

describe('ODataQueryBuilder.containsIgnoreCase', () => {
  it('should build case-insensitive contains filter with eq true suffix', () => {
    const builder = query().containsIgnoreCase('Name', 'BAKKER');
    const result = builder.build();

    expect(result).toBe("$filter=substringof('bakker', tolower(Name)) eq true");
  });

  it('should contain eq true suffix - CRITICAL for Exact Online compatibility', () => {
    const builder = query().containsIgnoreCase('Description', 'TEST');
    const result = builder.build();

    expect(result).toContain('eq true');
    // Use a simpler pattern since tolower() adds nested parentheses
    expect(result).toMatch(/substringof\(.+\) eq true/);
  });

  it('should convert search value to lowercase', () => {
    const builder = query().containsIgnoreCase('Name', 'BaKkEr');
    const result = builder.build();

    expect(result).toContain("substringof('bakker'");
    expect(result).toContain('tolower(Name)');
  });

  it('should escape single quotes in search value', () => {
    const builder = query().containsIgnoreCase('Name', "O'BRIEN");
    const result = builder.build();

    expect(result).toBe("$filter=substringof('o''brien', tolower(Name)) eq true");
  });

  it('should handle empty search value', () => {
    const builder = query().containsIgnoreCase('Name', '');
    const result = builder.build();

    expect(result).toBe("$filter=substringof('', tolower(Name)) eq true");
  });

  it('should combine with other filters using AND', () => {
    const builder = query()
      .containsIgnoreCase('Name', 'BAKKER')
      .where('IsCustomer', true);
    const result = builder.build();

    expect(result).toBe("$filter=substringof('bakker', tolower(Name)) eq true and IsCustomer eq true");
    expect(result).toContain('eq true');
  });
});

describe('ODataQueryBuilder chaining', () => {
  it('should support fluent API chaining', () => {
    const result = query()
      .contains('Name', 'test')
      .where('Status', 'C')
      .select('ID', 'Name', 'Code')
      .orderBy('Name')
      .top(10)
      .build();

    expect(result).toContain("$filter=substringof('test', Name) eq true and Status eq 'C'");
    expect(result).toContain('$select=ID,Name,Code');
    expect(result).toContain('$orderby=Name asc');
    expect(result).toContain('$top=10');
  });

  it('should combine multiple contains filters', () => {
    const result = query()
      .contains('Name', 'bakker')
      .contains('Description', 'food')
      .build();

    expect(result).toBe(
      "$filter=substringof('bakker', Name) eq true and substringof('food', Description) eq true"
    );

    // Both filters must have eq true
    const eqTrueCount = (result.match(/eq true/g) || []).length;
    expect(eqTrueCount).toBe(2);
  });
});

describe('ODataQueryBuilder other filter methods', () => {
  it('startsWith should NOT have eq true suffix (different OData behavior)', () => {
    const result = query().startsWith('Name', 'Bak').build();
    expect(result).toBe("$filter=startswith(Name, 'Bak')");
    // startswith() is a boolean function that works without eq true
    expect(result).not.toContain('eq true');
  });

  it('endsWith should NOT have eq true suffix (different OData behavior)', () => {
    const result = query().endsWith('Name', 'BV').build();
    expect(result).toBe("$filter=endswith(Name, 'BV')");
    // endswith() is a boolean function that works without eq true
    expect(result).not.toContain('eq true');
  });

  it('startsWith should escape single quotes', () => {
    const result = query().startsWith('Name', "O'").build();
    expect(result).toBe("$filter=startswith(Name, 'O''')");
  });

  it('endsWith should escape single quotes', () => {
    const result = query().endsWith('Name', "'s").build();
    expect(result).toBe("$filter=endswith(Name, '''s')");
  });
});

describe('Regression prevention for P10-001', () => {
  /**
   * These tests explicitly verify that the substringof bug (P10-001) cannot recur.
   * The bug was: substringof() without 'eq true' suffix causes HTTP 400 from Exact Online.
   */

  it('buildSubstringFilter must always end with "eq true"', () => {
    const testCases = ['', 'test', "O'Brien", 'Test Company', 'ABC-123'];

    for (const term of testCases) {
      const result = buildSubstringFilter(term, 'Name');
      expect(result).toMatch(/eq true$/);
    }
  });

  it('buildSubstringFilterMultiple must have "eq true" for every field', () => {
    const fields = ['Code', 'Name', 'Description', 'CustomerName'];
    const result = buildSubstringFilterMultiple('test', fields);

    const eqTrueCount = (result.match(/eq true/g) || []).length;
    expect(eqTrueCount).toBe(fields.length);
  });

  it('ODataQueryBuilder.contains must always produce "eq true" suffix', () => {
    const testCases = ['', 'test', "O'Brien", 'Test Company'];

    for (const term of testCases) {
      const result = query().contains('Field', term).build();
      expect(result).toMatch(/eq true/);
    }
  });

  it('ODataQueryBuilder.containsIgnoreCase must always produce "eq true" suffix', () => {
    const testCases = ['', 'TEST', "O'BRIEN", 'Test Company'];

    for (const term of testCases) {
      const result = query().containsIgnoreCase('Field', term).build();
      expect(result).toMatch(/eq true/);
    }
  });
});
