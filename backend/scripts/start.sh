#!/usr/bin/env bash
# Start script: run migrations (with failure resolution), then start the server.
# Run from backend/ (e.g. npm start). Single app DB only.
# Pattern aligned with Beacon backend/scripts/start.sh (single-DB path); kept bulletproof for deploy.

set -euo pipefail

# Only consider migration dirs that look like Prisma migrations (timestamp_name)
migration_dirs() {
  ls -t prisma/migrations 2>/dev/null | grep -E '^[0-9]+_' || true
}

resolve_failed_migrations() {
  echo "Checking for failed migrations..."
  FAILED=$(npx prisma migrate status 2>&1 | grep -i "failed\|P3018" || true)
  if [ -z "$FAILED" ]; then
    return 0
  fi
  echo "⚠️  Found failed migrations, attempting to resolve..."
  RESOLVER="scripts/resolve-migration.sh"
  for migration_dir in $(migration_dirs | head -10); do
    echo "Attempting to resolve: $migration_dir"
    if [ -f "$RESOLVER" ]; then
      bash "$RESOLVER" "$migration_dir" || {
        npx prisma migrate resolve --rolled-back "$migration_dir" 2>/dev/null && echo "✅ Resolved: $migration_dir (rolled back)" || true
      }
    else
      npx prisma migrate resolve --rolled-back "$migration_dir" 2>/dev/null && {
        echo "✅ Resolved: $migration_dir (marked as rolled back)"
      } || true
    fi
  done
}

echo "Running Prisma migrations (app DB)..."
echo ""

set +e
MIGRATE_OUTPUT=$(npx prisma migrate deploy 2>&1)
MIGRATE_EXIT=$?
set -e

echo "$MIGRATE_OUTPUT"
echo ""

if [ $MIGRATE_EXIT -ne 0 ]; then
  echo "❌ Migration failed (exit $MIGRATE_EXIT)"

  if echo "$MIGRATE_OUTPUT" | grep -q "P3018\|failed.*migration"; then
    echo ""
    echo "⚠️  Migration failed due to previous failed migration (P3018)"
    echo "Attempting to resolve automatically..."
    resolve_failed_migrations
    echo ""
    echo "Retrying migration deploy..."
    if ! npx prisma migrate deploy; then
      echo "❌ Migration still failing after resolution attempt"
      echo "Resolve manually in Render Shell:"
      echo "  cd backend && npx prisma migrate status   # see failed migration(s)"
      echo "  npx prisma migrate resolve --applied <migration-name>   # if tables exist"
      echo "  npx prisma migrate resolve --rolled-back <migration-name>   # if tables don't exist"
      echo "Or run: ./scripts/resolve-migration.sh <migration-name>"
      echo "See docs/RESOLVE_MIGRATION_ERROR.md"
      exit 1
    fi
  elif echo "$MIGRATE_OUTPUT" | grep -q "already exists\|relation.*already exists"; then
    echo ""
    echo "⚠️  Tables already exist - migration may have partially succeeded"
    LATEST=$(migration_dirs | head -1)
    if [ -z "$LATEST" ]; then
      echo "❌ No migration directories found; cannot mark any as applied."
      echo "Check prisma/migrations/ and database state. See docs/RESOLVE_MIGRATION_ERROR.md"
      exit 1
    fi
    echo "Marking $LATEST as applied and retrying..."
    npx prisma migrate resolve --applied "$LATEST" 2>/dev/null || true
    echo "Retrying migration deploy..."
    if ! npx prisma migrate deploy; then
      echo "❌ Still failing. Check database state in Render Shell (e.g. ./scripts/check-db.sh)."
      echo "See docs/RESOLVE_MIGRATION_ERROR.md"
      exit 1
    fi
  else
    echo "❌ Migration failed with a different error (see output above)"
    exit $MIGRATE_EXIT
  fi
fi

echo ""
echo "✅ Migrations applied successfully, starting server..."
exec node dist/index.js
