#!/usr/bin/env bash
# Create migration, commit, and push. Run from repo root.
# Usage: ./scripts/migrate.sh <migration-name> [commit-message]
# Example: ./scripts/migrate.sh add_task_table "Add task table"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -z "${1:-}" ]; then
  echo "❌ Error: Migration name is required"
  echo "Usage: ./scripts/migrate.sh <migration-name> [commit-message]"
  exit 1
fi

MIGRATION_NAME="$1"
COMMIT_MSG="${2:-Add migration: $MIGRATION_NAME}"

echo "🚀 Migration workflow: $MIGRATION_NAME"
echo ""

if ! "$SCRIPT_DIR/create-migration.sh" "$MIGRATION_NAME"; then
  echo "❌ Failed to create migration"
  exit 1
fi

echo ""
echo "Step 2: Committing..."
cd "$REPO_ROOT"
if git status --porcelain backend/prisma/migrations/ 2>/dev/null | grep -q .; then
  git add backend/prisma/migrations/
  git commit -m "$COMMIT_MSG"
  echo "✅ Migration committed"
else
  echo "⚠️  No new migration files to commit"
fi

echo ""
echo "Step 3: Push to trigger deploy (Render will run prisma migrate deploy on start)."
echo "  git push origin main"
