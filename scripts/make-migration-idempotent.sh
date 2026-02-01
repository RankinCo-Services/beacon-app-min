#!/usr/bin/env bash
# Make migration SQL idempotent: DROP TABLE IF EXISTS, wrap ALTER in DO $$.
# Run from repo root. Usage: ./scripts/make-migration-idempotent.sh --file backend/prisma/migrations/.../migration.sql

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FILE=""

for i in "$@"; do
  if [ "$i" = "--file" ]; then :; elif [ "${PREV:-}" = "--file" ]; then FILE="$i"; fi
  PREV="$i"
done

if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Usage: $0 --file path/to/migration.sql" >&2
  exit 1
fi

cd "$REPO_ROOT"

if grep -qE 'DROP TABLE "[^"]+"' "$FILE" 2>/dev/null; then
  if ! grep -qE 'DROP TABLE IF EXISTS ' "$FILE" 2>/dev/null; then
    sed -i.bak -E 's/DROP TABLE "([^"]+)"/DROP TABLE IF EXISTS "\1"/g' "$FILE"
    rm -f "$FILE.bak"
    echo "  Fixed: DROP TABLE -> DROP TABLE IF EXISTS" >&2
  fi
fi

if grep -qE 'ALTER TABLE "[^"]+" ADD COLUMN ' "$FILE" 2>/dev/null; then
  if ! grep -q 'information_schema.columns' "$FILE" 2>/dev/null; then
    if command -v perl >/dev/null 2>&1; then
      perl -i.bak -0pe 's/^(\s*)ALTER TABLE "([^"]+)" ADD COLUMN "([^"]+)" ([^\n]+;\s*)$/DO \$body\$ BEGIN\n  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '\''public'\'' AND table_name = '\''$2'\'' AND column_name = '\''$3'\'') THEN\n    ALTER TABLE "$2" ADD COLUMN "$3" $4\n  END IF;\nEND \$body\$;\n/gm' "$FILE"
      rm -f "$FILE.bak"
      echo "  Fixed: ALTER TABLE ADD COLUMN -> DO \$\$ block" >&2
    else
      echo "  perl not found; wrap ALTER TABLE ADD COLUMN manually. See docs/MIGRATION_SQL_RULES.md" >&2
    fi
  fi
fi

if grep -qE 'ALTER TABLE "[^"]+" ADD CONSTRAINT ' "$FILE" 2>/dev/null; then
  if ! grep -q 'pg_constraint' "$FILE" 2>/dev/null; then
    if command -v perl >/dev/null 2>&1; then
      perl -i.bak -0pe 's/^(\s*)ALTER TABLE "([^"]+)" ADD CONSTRAINT "([^"]+)" ([^\n]+;\s*)$/DO \$body\$ BEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '\''$3'\'') THEN\n    ALTER TABLE "$2" ADD CONSTRAINT "$3" $4\n  END IF;\nEND \$body\$;\n/gm' "$FILE"
      rm -f "$FILE.bak"
      echo "  Fixed: ALTER TABLE ADD CONSTRAINT -> DO \$\$ block" >&2
    else
      echo "  perl not found; wrap ALTER TABLE ADD CONSTRAINT manually." >&2
    fi
  fi
fi

echo "Idempotency updates done. Re-validate: ./scripts/validate-migration-sql.sh --file $FILE"
