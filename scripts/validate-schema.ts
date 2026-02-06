#!/usr/bin/env npx tsx
/**
 * DB-002: Schema Validation Pre-Deploy Check
 *
 * This script validates that the D1 database schema matches the expected schema
 * from migrations. Prevents production errors from unapplied migrations.
 *
 * Usage:
 *   npx tsx scripts/validate-schema.ts [options]
 *
 * Options:
 *   --dry-run          Only analyze migrations, don't check database
 *   --env <name>       Environment name (production, preview, local)
 *   --database <name>  D1 database name (default: exact-mcp-db)
 *   --verbose          Show detailed output
 *   --json             Output results as JSON
 *
 * Exit codes:
 *   0 - Schema is in sync
 *   1 - Schema mismatch detected
 *   2 - Script error (file not found, parse error, etc.)
 *
 * @see operations/ROADMAP.md - DB-002
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// =============================================================================
// Configuration
// =============================================================================

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const MIGRATIONS_DIR = join(PROJECT_ROOT, 'apps/auth-portal/migrations');
const DEFAULT_DATABASE = 'exact-mcp-db';

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  primaryKey?: boolean;
  references?: string;
}

interface Index {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
}

interface Table {
  name: string;
  columns: Map<string, Column>;
  indexes: string[];
}

interface ExpectedSchema {
  tables: Map<string, Table>;
  indexes: Map<string, Index>;
  views: string[];
}

interface ActualSchema {
  tables: Map<string, Set<string>>; // table -> columns
  indexes: Set<string>;
}

interface ValidationResult {
  success: boolean;
  missingTables: string[];
  missingColumns: Map<string, string[]>;
  missingIndexes: string[];
  extraTables: string[];
  warnings: string[];
}

interface Options {
  dryRun: boolean;
  env: string;
  database: string;
  verbose: boolean;
  json: boolean;
}

// =============================================================================
// Migration Parser
// =============================================================================

/**
 * Parse SQL migrations to extract expected schema
 */
function parseMigrations(migrationsDir: string): ExpectedSchema {
  const schema: ExpectedSchema = {
    tables: new Map(),
    indexes: new Map(),
    views: [],
  };

  if (!existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  // Read all migration files in order
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const content = readFileSync(join(migrationsDir, file), 'utf-8');
    parseMigrationFile(content, schema, file);
  }

  return schema;
}

/**
 * Parse a single migration file and update schema
 */
function parseMigrationFile(
  content: string,
  schema: ExpectedSchema,
  filename: string
): void {
  // Remove comments and normalize whitespace
  const normalized = content
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();

  // Parse CREATE TABLE statements
  const createTableRegex =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\);/gi;
  let match;

  while ((match = createTableRegex.exec(normalized)) !== null) {
    const tableName = match[1].toLowerCase();
    const columnsBlock = match[2];

    if (!schema.tables.has(tableName)) {
      schema.tables.set(tableName, {
        name: tableName,
        columns: new Map(),
        indexes: [],
      });
    }

    const table = schema.tables.get(tableName)!;
    parseColumns(columnsBlock, table);
  }

  // Parse ALTER TABLE ADD COLUMN statements
  const alterTableRegex =
    /ALTER\s+TABLE\s+(\w+)\s+ADD\s+(?:COLUMN\s+)?(\w+)\s+([^;]+);/gi;

  while ((match = alterTableRegex.exec(normalized)) !== null) {
    const tableName = match[1].toLowerCase();
    const columnName = match[2].toLowerCase();
    const columnDef = match[3].trim();

    if (!schema.tables.has(tableName)) {
      // Table might be created in a later migration or doesn't exist yet
      schema.tables.set(tableName, {
        name: tableName,
        columns: new Map(),
        indexes: [],
      });
    }

    const table = schema.tables.get(tableName)!;
    table.columns.set(columnName, parseColumnDef(columnName, columnDef));
  }

  // Parse CREATE INDEX statements
  const createIndexRegex =
    /CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\)/gi;

  while ((match = createIndexRegex.exec(normalized)) !== null) {
    const isUnique = !!match[1];
    const indexName = match[2].toLowerCase();
    const tableName = match[3].toLowerCase();
    const columns = match[4].split(',').map((c) => c.trim().toLowerCase());

    schema.indexes.set(indexName, {
      name: indexName,
      table: tableName,
      columns,
      unique: isUnique,
    });

    // Also add to table's index list
    if (schema.tables.has(tableName)) {
      schema.tables.get(tableName)!.indexes.push(indexName);
    }
  }

  // Parse CREATE VIEW statements
  const createViewRegex =
    /CREATE\s+VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+AS/gi;

  while ((match = createViewRegex.exec(normalized)) !== null) {
    const viewName = match[1].toLowerCase();
    if (!schema.views.includes(viewName)) {
      schema.views.push(viewName);
    }
  }
}

/**
 * Parse column definitions from a CREATE TABLE statement
 */
function parseColumns(columnsBlock: string, table: Table): void {
  // Split by comma, but not inside parentheses
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of columnsBlock) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    parts.push(current.trim());
  }

  for (const part of parts) {
    const trimmed = part.trim();

    // Skip constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, etc.)
    if (/^(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT)/i.test(trimmed)) {
      continue;
    }

    // Parse column definition
    const match = trimmed.match(/^(\w+)\s+(.+)$/i);
    if (match) {
      const columnName = match[1].toLowerCase();
      const columnDef = match[2];
      table.columns.set(columnName, parseColumnDef(columnName, columnDef));
    }
  }
}

/**
 * Parse a single column definition
 */
function parseColumnDef(name: string, def: string): Column {
  const upperDef = def.toUpperCase();

  // Determine type (first word)
  const typeMatch = def.match(/^(\w+)/);
  const type = typeMatch ? typeMatch[1].toUpperCase() : 'TEXT';

  // Check for PRIMARY KEY
  const primaryKey = upperDef.includes('PRIMARY KEY');

  // Check for NOT NULL or nullable
  const nullable = !upperDef.includes('NOT NULL') && !primaryKey;

  // Extract default value
  let defaultValue: string | undefined;
  const defaultMatch = def.match(/DEFAULT\s+([^,\s]+|'[^']*'|\([^)]+\))/i);
  if (defaultMatch) {
    defaultValue = defaultMatch[1];
  }

  // Extract references
  let references: string | undefined;
  const refMatch = def.match(/REFERENCES\s+(\w+)/i);
  if (refMatch) {
    references = refMatch[1].toLowerCase();
  }

  return { name, type, nullable, defaultValue, primaryKey, references };
}

// =============================================================================
// D1 Database Schema Query
// =============================================================================

/**
 * Get actual schema from D1 database using wrangler
 */
function getActualSchema(database: string, env: string): ActualSchema {
  const schema: ActualSchema = {
    tables: new Map(),
    indexes: new Set(),
  };

  try {
    // Get list of tables
    const tablesCmd = buildWranglerCommand(
      database,
      env,
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';"
    );

    const tablesOutput = execSync(tablesCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const tables = parseWranglerOutput(tablesOutput);

    for (const row of tables) {
      const tableName = (row.name || row[0] || '').toLowerCase();
      if (!tableName) continue;

      schema.tables.set(tableName, new Set());

      // Get columns for each table
      const columnsCmd = buildWranglerCommand(
        database,
        env,
        `PRAGMA table_info('${tableName}');`
      );

      try {
        const columnsOutput = execSync(columnsCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        const columns = parseWranglerOutput(columnsOutput);

        for (const col of columns) {
          const columnName = (col.name || col[1] || '').toLowerCase();
          if (columnName) {
            schema.tables.get(tableName)!.add(columnName);
          }
        }
      } catch {
        // Table might not exist or be accessible
      }
    }

    // Get list of indexes
    const indexesCmd = buildWranglerCommand(
      database,
      env,
      "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';"
    );

    const indexesOutput = execSync(indexesCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const indexes = parseWranglerOutput(indexesOutput);

    for (const row of indexes) {
      const indexName = (row.name || row[0] || '').toLowerCase();
      if (indexName) {
        schema.indexes.add(indexName);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to query D1 database: ${message}`);
  }

  return schema;
}

/**
 * Build wrangler D1 execute command
 */
function buildWranglerCommand(database: string, env: string, sql: string): string {
  const envFlag = env !== 'local' ? ` --env ${env}` : '';
  // Use --json for parseable output
  return `npx wrangler d1 execute ${database}${envFlag} --command "${sql.replace(/"/g, '\\"')}" --json`;
}

/**
 * Parse wrangler D1 output
 */
function parseWranglerOutput(output: string): Record<string, unknown>[] {
  try {
    // Try to parse as JSON first
    const json = JSON.parse(output);
    if (Array.isArray(json)) {
      // Direct array of results
      return json[0]?.results || json;
    }
    if (json.result && Array.isArray(json.result)) {
      return json.result[0]?.results || [];
    }
    return json.results || [];
  } catch {
    // Fallback: parse text output
    const lines = output
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('[') && !l.startsWith('{'));
    return lines.map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      const result: Record<string, unknown> = {};
      parts.forEach((p, i) => {
        result[i] = p;
        if (i === 0) result.name = p;
      });
      return result;
    });
  }
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate schema by comparing expected vs actual
 */
function validateSchema(
  expected: ExpectedSchema,
  actual: ActualSchema
): ValidationResult {
  const result: ValidationResult = {
    success: true,
    missingTables: [],
    missingColumns: new Map(),
    missingIndexes: [],
    extraTables: [],
    warnings: [],
  };

  // Check for missing tables
  for (const [tableName] of expected.tables) {
    if (!actual.tables.has(tableName)) {
      result.missingTables.push(tableName);
      result.success = false;
    }
  }

  // Check for missing columns in existing tables
  for (const [tableName, table] of expected.tables) {
    if (!actual.tables.has(tableName)) continue;

    const actualColumns = actual.tables.get(tableName)!;
    const missingCols: string[] = [];

    for (const [columnName] of table.columns) {
      if (!actualColumns.has(columnName)) {
        missingCols.push(columnName);
      }
    }

    if (missingCols.length > 0) {
      result.missingColumns.set(tableName, missingCols);
      result.success = false;
    }
  }

  // Check for missing indexes
  for (const [indexName] of expected.indexes) {
    if (!actual.indexes.has(indexName)) {
      result.missingIndexes.push(indexName);
      // Indexes are warnings, not failures (they can be created later)
      result.warnings.push(`Missing index: ${indexName}`);
    }
  }

  // Check for extra tables (could be stale)
  for (const tableName of actual.tables.keys()) {
    if (
      !expected.tables.has(tableName) &&
      !tableName.startsWith('sqlite_') &&
      !tableName.startsWith('_cf_')
    ) {
      result.extraTables.push(tableName);
      result.warnings.push(`Unexpected table in database: ${tableName}`);
    }
  }

  return result;
}

// =============================================================================
// Output Formatting
// =============================================================================

/**
 * Print schema summary
 */
function printSchemaSummary(schema: ExpectedSchema, verbose: boolean): void {
  console.log('\n=== Expected Schema (from migrations) ===\n');
  console.log(`Tables: ${schema.tables.size}`);
  console.log(`Indexes: ${schema.indexes.size}`);
  console.log(`Views: ${schema.views.length}`);

  if (verbose) {
    console.log('\nTables:');
    for (const [name, table] of schema.tables) {
      console.log(`  - ${name} (${table.columns.size} columns)`);
      for (const [colName, col] of table.columns) {
        const flags: string[] = [];
        if (col.primaryKey) flags.push('PK');
        if (!col.nullable) flags.push('NOT NULL');
        if (col.defaultValue) flags.push(`DEFAULT ${col.defaultValue}`);
        const flagStr = flags.length ? ` [${flags.join(', ')}]` : '';
        console.log(`      ${colName}: ${col.type}${flagStr}`);
      }
    }

    console.log('\nIndexes:');
    for (const [name, index] of schema.indexes) {
      const unique = index.unique ? ' (UNIQUE)' : '';
      console.log(`  - ${name} ON ${index.table}(${index.columns.join(', ')})${unique}`);
    }
  }
}

/**
 * Print validation results
 */
function printValidationResults(
  result: ValidationResult,
  verbose: boolean
): void {
  console.log('\n=== Validation Results ===\n');

  if (result.success && result.warnings.length === 0) {
    console.log('Schema is in sync with migrations.');
    return;
  }

  if (result.missingTables.length > 0) {
    console.log('MISSING TABLES:');
    for (const table of result.missingTables) {
      console.log(`  - ${table}`);
    }
    console.log('');
  }

  if (result.missingColumns.size > 0) {
    console.log('MISSING COLUMNS:');
    for (const [table, columns] of result.missingColumns) {
      console.log(`  ${table}:`);
      for (const col of columns) {
        console.log(`    - ${col}`);
      }
    }
    console.log('');
  }

  if (result.missingIndexes.length > 0 && verbose) {
    console.log('MISSING INDEXES (warning):');
    for (const index of result.missingIndexes) {
      console.log(`  - ${index}`);
    }
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('WARNINGS:');
    for (const warning of result.warnings) {
      console.log(`  - ${warning}`);
    }
    console.log('');
  }

  if (!result.success) {
    console.log('\n*** SCHEMA VALIDATION FAILED ***');
    console.log('Run the missing migrations before deploying.');
    console.log('\nMigration commands:');

    // Suggest migration commands
    const migrationFiles = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(
        `  wrangler d1 execute ${DEFAULT_DATABASE} --file=apps/auth-portal/migrations/${file}`
      );
    }
  }
}

/**
 * Print results as JSON
 */
function printJsonResults(
  expected: ExpectedSchema,
  result: ValidationResult | null
): void {
  const output = {
    timestamp: new Date().toISOString(),
    schema: {
      tables: Array.from(expected.tables.entries()).map(([name, table]) => ({
        name,
        columns: Array.from(table.columns.keys()),
        indexes: table.indexes,
      })),
      indexes: Array.from(expected.indexes.keys()),
      views: expected.views,
    },
    validation: result
      ? {
          success: result.success,
          missingTables: result.missingTables,
          missingColumns: Object.fromEntries(result.missingColumns),
          missingIndexes: result.missingIndexes,
          extraTables: result.extraTables,
          warnings: result.warnings,
        }
      : null,
  };

  console.log(JSON.stringify(output, null, 2));
}

// =============================================================================
// CLI
// =============================================================================

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    dryRun: false,
    env: 'production',
    database: DEFAULT_DATABASE,
    verbose: false,
    json: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--env':
        options.env = args[++i] || 'production';
        break;
      case '--database':
        options.database = args[++i] || DEFAULT_DATABASE;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--json':
        options.json = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
DB-002: Schema Validation Pre-Deploy Check

Usage:
  npx tsx scripts/validate-schema.ts [options]

Options:
  --dry-run          Only analyze migrations, don't check database
  --env <name>       Environment name (production, preview, local)
  --database <name>  D1 database name (default: exact-mcp-db)
  --verbose, -v      Show detailed output
  --json             Output results as JSON
  --help, -h         Show this help message

Examples:
  # Check production database
  npx tsx scripts/validate-schema.ts --env production

  # Only analyze migrations (no database check)
  npx tsx scripts/validate-schema.ts --dry-run --verbose

  # Output as JSON for CI/CD
  npx tsx scripts/validate-schema.ts --json

Exit codes:
  0 - Schema is in sync
  1 - Schema mismatch detected
  2 - Script error
`);
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const options = parseArgs();

  try {
    if (!options.json) {
      console.log('DB-002: Schema Validation Pre-Deploy Check');
      console.log('==========================================');
      console.log(`Environment: ${options.env}`);
      console.log(`Database: ${options.database}`);
      console.log(`Dry run: ${options.dryRun}`);
    }

    // Parse migrations
    const expected = parseMigrations(MIGRATIONS_DIR);

    if (options.dryRun) {
      if (options.json) {
        printJsonResults(expected, null);
      } else {
        printSchemaSummary(expected, options.verbose);
        console.log('\n[Dry run - database not checked]');
      }
      process.exit(0);
    }

    // Get actual schema from database
    if (!options.json) {
      console.log('\nQuerying D1 database...');
    }

    const actual = getActualSchema(options.database, options.env);

    if (!options.json) {
      console.log(`Found ${actual.tables.size} tables, ${actual.indexes.size} indexes`);
    }

    // Validate
    const result = validateSchema(expected, actual);

    if (options.json) {
      printJsonResults(expected, result);
    } else {
      if (options.verbose) {
        printSchemaSummary(expected, true);
      }
      printValidationResults(result, options.verbose);
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (options.json) {
      console.log(
        JSON.stringify({
          error: true,
          message,
          timestamp: new Date().toISOString(),
        })
      );
    } else {
      console.error(`\nError: ${message}`);
    }

    process.exit(2);
  }
}

main();
