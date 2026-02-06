#!/bin/bash
#
# DB-002: Migration Status Check Script
#
# Quick shell script to check migration status against D1 database.
# For full schema validation, use validate-schema.ts
#
# Usage:
#   ./scripts/check-migrations.sh [production|preview|local]
#
# Exit codes:
#   0 - All checks passed
#   1 - Issues detected
#   2 - Script error
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_ROOT/apps/auth-portal/migrations"
DATABASE="exact-mcp-db"
ENV="${1:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "DB-002: Migration Status Check"
echo "========================================"
echo "Environment: $ENV"
echo "Database: $DATABASE"
echo ""

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}ERROR: Migrations directory not found: $MIGRATIONS_DIR${NC}"
    exit 2
fi

# List migration files
echo "=== Migration Files ==="
migration_count=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)
echo "Found $migration_count migration files:"
ls -1 "$MIGRATIONS_DIR"/*.sql | while read f; do
    echo "  - $(basename "$f")"
done
echo ""

# Extract key columns that caused production issues (DB-001)
echo "=== Critical Columns Check ==="
echo "Checking for columns that caused DB-001 production errors..."
echo ""

# Define critical columns to check (from migrations 0003 and 0013)
CRITICAL_COLUMNS=(
    "users:onboarding_email_sent"
    "users:rate_limit_warning_sent"
    "connections:expiry_alert_sent"
    "connections:inactivity_alert_sent"
    "connections:refresh_token_expires_at"
)

# Function to check if a column exists
check_column() {
    local table=$1
    local column=$2
    local env_flag=""

    if [ "$ENV" != "local" ]; then
        env_flag="--env $ENV"
    fi

    result=$(npx wrangler d1 execute "$DATABASE" $env_flag \
        --command "SELECT COUNT(*) as cnt FROM pragma_table_info('$table') WHERE name='$column';" \
        --json 2>/dev/null || echo '[]')

    # Parse result
    count=$(echo "$result" | grep -o '"cnt":[0-9]*' | grep -o '[0-9]*' | head -1 || echo "0")

    if [ "$count" = "1" ]; then
        echo -e "  ${GREEN}[OK]${NC} $table.$column"
        return 0
    else
        echo -e "  ${RED}[MISSING]${NC} $table.$column"
        return 1
    fi
}

# Check each critical column
errors=0
for col_def in "${CRITICAL_COLUMNS[@]}"; do
    table="${col_def%%:*}"
    column="${col_def##*:}"
    if ! check_column "$table" "$column"; then
        ((errors++)) || true
    fi
done

echo ""

# Check critical tables
echo "=== Critical Tables Check ==="
CRITICAL_TABLES=(
    "users"
    "connections"
    "divisions"
    "api_keys"
    "api_usage"
    "sessions"
    "error_log"
    "email_queue"
    "security_events"
    "oauth_clients"
    "oauth_auth_codes"
    "oauth_tokens"
    "tos_acceptances"
    "system_settings"
    "support_conversations"
    "support_messages"
    "knowledge_articles"
    "support_patterns"
    "feedback"
    "feedback_campaigns"
)

check_table() {
    local table=$1
    local env_flag=""

    if [ "$ENV" != "local" ]; then
        env_flag="--env $ENV"
    fi

    result=$(npx wrangler d1 execute "$DATABASE" $env_flag \
        --command "SELECT name FROM sqlite_master WHERE type='table' AND name='$table';" \
        --json 2>/dev/null || echo '[]')

    if echo "$result" | grep -q "\"$table\""; then
        echo -e "  ${GREEN}[OK]${NC} $table"
        return 0
    else
        echo -e "  ${YELLOW}[NOT FOUND]${NC} $table"
        return 1
    fi
}

table_errors=0
for table in "${CRITICAL_TABLES[@]}"; do
    if ! check_table "$table"; then
        ((table_errors++)) || true
    fi
done

echo ""

# Summary
echo "========================================"
echo "Summary"
echo "========================================"

if [ $errors -gt 0 ]; then
    echo -e "${RED}CRITICAL: $errors missing column(s) detected${NC}"
    echo ""
    echo "These columns were missing in production (DB-001)."
    echo "Run the following migrations:"
    echo ""
    echo "  # Migration 0003 (automation fields)"
    echo "  wrangler d1 execute $DATABASE --env $ENV \\"
    echo "    --file=apps/auth-portal/migrations/0003_add_automation_fields.sql"
    echo ""
    echo "  # Migration 0013 (refresh token expiry)"
    echo "  wrangler d1 execute $DATABASE --env $ENV \\"
    echo "    --file=apps/auth-portal/migrations/0013_add_refresh_token_expiry.sql"
    echo ""
fi

if [ $table_errors -gt 0 ]; then
    echo -e "${YELLOW}WARNING: $table_errors table(s) not found${NC}"
    echo "Some tables might not have been created yet."
    echo ""
fi

if [ $errors -eq 0 ] && [ $table_errors -eq 0 ]; then
    echo -e "${GREEN}All critical checks passed!${NC}"
    echo "Schema appears to be in sync with migrations."
    exit 0
fi

# For full validation, recommend TypeScript script
echo ""
echo "For comprehensive schema validation, run:"
echo "  npx tsx scripts/validate-schema.ts --env $ENV --verbose"
echo ""

if [ $errors -gt 0 ]; then
    exit 1
else
    exit 0
fi
