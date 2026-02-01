#!/usr/bin/env bash
# Create a new Prisma migration without database connection.
# Run from repo root. Usage: ./scripts/create-migration.sh <migration-name>
# Example: ./scripts/create-migration.sh add_task_table

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND="$REPO_ROOT/backend"

if [ -z "${1:-}" ]; then
  echo "❌ Error: Migration name is required"
  echo ""
  echo "Usage: ./scripts/create-migration.sh <migration-name>"
  echo "Example: ./scripts/create-migration.sh add_task_table"
  exit 1
fi

MIGRATION_NAME="$1"

echo "📦 Creating Prisma migration: $MIGRATION_NAME"
echo ""

cd "$BACKEND"

if [ ! -f "prisma/schema.prisma" ]; then
  echo "❌ Error: backend/prisma/schema.prisma not found"
  exit 1
fi

echo "Validating schema..."
VALIDATION_OUTPUT=$(npx prisma format 2>&1)
if [ $? -ne 0 ]; then
  echo "❌ Schema validation failed. Fix errors in prisma/schema.prisma"
  echo "$VALIDATION_OUTPUT"
  exit 1
fi
echo "✅ Schema is valid"
echo ""

TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_DIR="prisma/migrations/${TIMESTAMP}_${MIGRATION_NAME}"
mkdir -p "$MIGRATION_DIR"

echo "Generating migration SQL (no database connection required)..."
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > "$MIGRATION_DIR/migration.sql" 2>&1

grep -v "┌\|│\|└\|Update available\|major update\|Run the following\|pris.ly" "$MIGRATION_DIR/migration.sql" > "$MIGRATION_DIR/migration.sql.tmp" 2>/dev/null && \
  mv "$MIGRATION_DIR/migration.sql.tmp" "$MIGRATION_DIR/migration.sql" || true

if [ ! -f "$MIGRATION_DIR/migration.sql" ]; then
  echo "❌ Failed to create migration file"
  rm -rf "$MIGRATION_DIR"
  exit 1
fi

if [ ! -s "$MIGRATION_DIR/migration.sql" ]; then
  echo "⚠️  Migration SQL file is empty (schema may already match)."
  read -p "Create empty migration anyway? (y/n): " CREATE_EMPTY
  if [ "$CREATE_EMPTY" != "y" ]; then
    rm -rf "$MIGRATION_DIR"
    echo "Migration cancelled."
    exit 1
  fi
  echo "-- Empty migration: no schema changes" > "$MIGRATION_DIR/migration.sql"
elif grep -q "Error\|error\|ERROR" "$MIGRATION_DIR/migration.sql"; then
  echo "❌ Error in migration SQL:"
  cat "$MIGRATION_DIR/migration.sql"
  rm -rf "$MIGRATION_DIR"
  exit 1
fi

echo "Validating migration SQL (idempotent patterns)..."
MIGRATION_PATH="$BACKEND/$MIGRATION_DIR/migration.sql"
if ! bash "$REPO_ROOT/scripts/validate-migration-sql.sh" --file "$MIGRATION_PATH"; then
  echo ""
  echo "⚠️  Migration has non-idempotent SQL. Auto-fix: ./scripts/validate-migration-sql.sh --fix --file $MIGRATION_PATH"
  echo "   See: docs/MIGRATION_SQL_RULES.md"
  if [ -t 0 ]; then
    read -p "Run --fix now? (y/n): " RUN_FIX
  else
    RUN_FIX="n"
  fi
  if [ "$RUN_FIX" = "y" ]; then
    bash "$REPO_ROOT/scripts/validate-migration-sql.sh" --fix --file "$MIGRATION_PATH" || true
    if ! bash "$REPO_ROOT/scripts/validate-migration-sql.sh" --file "$MIGRATION_PATH"; then
      echo "❌ Still invalid. Fix manually before deploy."
      exit 1
    fi
  else
    echo "❌ Fix before deploy. See docs/MIGRATION_SQL_RULES.md"
    exit 1
  fi
fi

echo ""
echo "✅ Migration created: $MIGRATION_DIR/migration.sql"
echo ""
echo "Next steps:"
echo "  1. Review: cat backend/$MIGRATION_DIR/migration.sql"
echo "  2. Commit and push; Render will apply on deploy."
echo "  3. See docs/RESOLVE_MIGRATION_ERROR.md if a migration fails on Render."
