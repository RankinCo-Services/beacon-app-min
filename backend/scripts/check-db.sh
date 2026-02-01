#!/usr/bin/env bash
# Check database state and migration status. Run from backend/ (e.g. in Render Shell).
# Pattern aligned with Beacon backend/scripts/check-db.sh; generic (no app-specific table names).

set -euo pipefail

echo "🔍 Checking database state..."
echo ""

echo "1. DATABASE_URL set?"
if [ -z "${DATABASE_URL:-}" ]; then
  echo "   ❌ DATABASE_URL is not set"
else
  echo "   ✅ DATABASE_URL is set"
fi

echo ""
echo "2. Database connection..."
if npx prisma db execute --stdin <<< "SELECT 1 AS ok;" > /dev/null 2>&1; then
  echo "   ✅ Connection works"
else
  echo "   ❌ Connection failed (check DATABASE_URL)"
fi

echo ""
echo "3. Tables in public schema..."
TABLES=$(npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;" 2>/dev/null || echo "")
if [ -n "$TABLES" ]; then
  echo "$TABLES"
else
  echo "   (none or query failed)"
fi

echo ""
echo "4. Migration status..."
npx prisma migrate status 2>&1 || true

echo ""
echo "✅ Database check complete"
