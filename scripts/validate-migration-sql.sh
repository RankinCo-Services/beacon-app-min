#!/usr/bin/env bash
# Validate migration SQL for idempotent patterns. Run from repo root.
# Usage: ./scripts/validate-migration-sql.sh [--all|--file path] [--fix]
# See docs/MIGRATION_SQL_RULES.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="$REPO_ROOT/backend/prisma/migrations"

CHECK_ALL=false
CHECK_FILE=""
DO_FIX=false
PREV=""

for a in "$@"; do
  case "$a" in
    --all)    CHECK_ALL=true ;;
    --fix)    DO_FIX=true ;;
    --file)   : ;;
    *)
      if [ "$PREV" = "--file" ]; then CHECK_FILE="$a"; fi
      ;;
  esac
  PREV="$a"
done

get_files() {
  if [ -n "$CHECK_FILE" ]; then
    [ -f "$CHECK_FILE" ] && echo "$CHECK_FILE"
    return
  fi
  if [ "$CHECK_ALL" = "true" ]; then
    find "$MIGRATIONS_DIR" -name "migration.sql" 2>/dev/null | sort
    return
  fi
  newest=$(find "$MIGRATIONS_DIR" -mindepth 1 -maxdepth 1 -type d ! -name _archive 2>/dev/null | sort -r | head -1)
  if [ -n "$newest" ] && [ -f "$newest/migration.sql" ]; then
    echo "$newest/migration.sql"
  fi
}

do_fix() {
  local f="$1"
  [ ! -f "$f" ] && return 1
  local changed=0
  if grep -E 'CREATE TABLE "' "$f" 2>/dev/null | grep -vq 'IF NOT EXISTS'; then
    sed -i.bak -E 's/CREATE TABLE ("[^"]+")/CREATE TABLE IF NOT EXISTS \1/g' "$f" 2>/dev/null || sed -E 's/CREATE TABLE ("[^"]+")/CREATE TABLE IF NOT EXISTS \1/g' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    rm -f "$f.bak"
    changed=1
  fi
  if grep -E 'CREATE UNIQUE INDEX "' "$f" 2>/dev/null | grep -vq 'IF NOT EXISTS'; then
    sed -i.bak -E 's/CREATE UNIQUE INDEX ("[^"]+")/CREATE UNIQUE INDEX IF NOT EXISTS \1/g' "$f" 2>/dev/null || true
    rm -f "$f.bak"
    changed=1
  fi
  if grep -E 'CREATE INDEX "' "$f" 2>/dev/null | grep -vq 'IF NOT EXISTS'; then
    sed -i.bak -E 's/CREATE INDEX ("[^"]+")/CREATE INDEX IF NOT EXISTS \1/g' "$f" 2>/dev/null || true
    rm -f "$f.bak"
    changed=1
  fi
  [ "$changed" -eq 1 ] && return 0 || return 1
}

validate_one() {
  local f="$1" err=0
  [ ! -f "$f" ] && return 0
  base=$(basename "$(dirname "$f")")
  body=$(cat "$f")
  if echo "$body" | grep -qE 'CREATE TABLE "[^"]+"\s*\('; then
    echo "$body" | grep -qE 'CREATE TABLE IF NOT EXISTS ' || { echo "  $base: CREATE TABLE without IF NOT EXISTS" >&2; err=$((err+1)); }
  fi
  echo "$body" | grep -E 'CREATE UNIQUE INDEX "' | grep -vq 'IF NOT EXISTS' 2>/dev/null && { echo "  $base: CREATE UNIQUE INDEX without IF NOT EXISTS" >&2; err=$((err+1)); }
  echo "$body" | grep -E 'CREATE INDEX "' | grep -vq 'IF NOT EXISTS' 2>/dev/null && { echo "  $base: CREATE INDEX without IF NOT EXISTS" >&2; err=$((err+1)); }
  if echo "$body" | grep -qE 'ALTER TABLE "[^"]+" ADD COLUMN '; then
    echo "$body" | grep -qi 'information_schema\.column' || { echo "  $base: ALTER ADD COLUMN without guard" >&2; err=$((err+1)); }
  fi
  if echo "$body" | grep -qE 'ALTER TABLE "[^"]+" ADD CONSTRAINT '; then
    echo "$body" | grep -q 'pg_constraint' || { echo "  $base: ALTER ADD CONSTRAINT without guard" >&2; err=$((err+1)); }
  fi
  if echo "$body" | grep -qE 'DROP TABLE "[^"]+"'; then
    echo "$body" | grep -qE 'DROP TABLE IF EXISTS ' || { echo "  $base: DROP TABLE without IF EXISTS" >&2; err=$((err+1)); }
  fi
  return $err
}

cd "$REPO_ROOT"
[ ! -d "$MIGRATIONS_DIR" ] && echo "No backend/prisma/migrations." && exit 0

FILES=()
while IFS= read -r line; do [ -n "$line" ] && FILES+=("$line"); done < <(get_files)
[ ${#FILES[@]} -eq 0 ] && echo "No migration.sql to validate." && exit 0

if [ "$DO_FIX" = "true" ]; then
  for f in "${FILES[@]}"; do do_fix "$f" && echo "Fixed: $f"; done
fi

ERRORS=0
for f in "${FILES[@]}"; do validate_one "$f" || ERRORS=$((ERRORS+1)); done
[ "${ERRORS:-0}" -gt 0 ] && echo "See docs/MIGRATION_SQL_RULES.md. Auto-fix: ./scripts/validate-migration-sql.sh --fix [--file path]" >&2 && exit 1

echo "Migration SQL validation passed (idempotent patterns)."
exit 0
