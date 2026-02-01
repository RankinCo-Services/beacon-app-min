#!/usr/bin/env bash
# Generic migration resolution for Render Shell and start.sh.
# Resolves any failed migration by checking database state (table existence).
# Run from backend/. Usage: ./scripts/resolve-migration.sh <migration-name>
# Pattern aligned with Beacon backend/scripts/resolve-migration.sh (generic case).

set -euo pipefail

MIGRATION_NAME="${1:-}"

if [ -z "$MIGRATION_NAME" ]; then
  echo "Usage: $0 <migration-name>" >&2
  echo "Example: $0 20260131000001_add_task" >&2
  exit 1
fi

echo "🔍 Checking migration: $MIGRATION_NAME"
echo ""

if [ ! -d "prisma/migrations/$MIGRATION_NAME" ]; then
  echo "❌ Migration directory not found: prisma/migrations/$MIGRATION_NAME" >&2
  exit 1
fi

MIGRATION_SQL="prisma/migrations/$MIGRATION_NAME/migration.sql"
if [ ! -f "$MIGRATION_SQL" ]; then
  echo "❌ Migration SQL not found: $MIGRATION_SQL" >&2
  exit 1
fi

echo "📊 Checking migration status..."
MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || true)

if echo "$MIGRATION_STATUS" | grep -q "$MIGRATION_NAME.*applied"; then
  echo "✅ Migration is already applied"
  exit 0
fi

# Extract first table name from CREATE TABLE "TableName" or CREATE TABLE IF NOT EXISTS "TableName"
FIRST_TABLE=$(grep -E 'CREATE TABLE (IF NOT EXISTS )?"[^"]+"' "$MIGRATION_SQL" | head -1 | sed -E 's/.*CREATE TABLE (IF NOT EXISTS )?"([^"]+)".*/\2/')

if [ -n "$FIRST_TABLE" ]; then
  echo "🔍 Checking if table \"$FIRST_TABLE\" exists..."
  TABLE_COUNT=$(npx prisma db execute --stdin <<EOF 2>/dev/null | grep -oE '[0-9]+' | head -1 | tr -d ' \t\r\n' || echo "0"
SELECT COUNT(*) AS count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = '$FIRST_TABLE';
EOF
)
  TABLE_COUNT=${TABLE_COUNT:-0}
  if [ "${TABLE_COUNT}" -gt 0 ]; then
    echo "   Table exists - marking migration as applied"
    npx prisma migrate resolve --applied "$MIGRATION_NAME"
    echo "✅ Resolved: $MIGRATION_NAME (marked as applied)"
  else
    echo "   Table does not exist - marking as rolled back (will retry on next deploy)"
    npx prisma migrate resolve --rolled-back "$MIGRATION_NAME"
    echo "✅ Resolved: $MIGRATION_NAME (marked as rolled back)"
  fi
else
  echo "⚠️  No CREATE TABLE found in migration - marking as rolled back (will retry on next deploy)"
  npx prisma migrate resolve --rolled-back "$MIGRATION_NAME"
  echo "✅ Resolved: $MIGRATION_NAME (marked as rolled back)"
fi

echo ""
echo "✅ Resolution complete"
