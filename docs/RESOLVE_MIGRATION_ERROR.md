# Resolving Failed Migration on Render

When a Prisma migration fails on Render (e.g. P3018 or "failed migration"), use this runbook to resolve it so the next deploy can succeed.

---

## 1. Open Render Shell

1. Go to [Render Dashboard](https://dashboard.render.com).
2. Open your **API** service (e.g. `my-app-api`).
3. Click **Shell** in the left sidebar.

---

## 2. Check migration status

From the Shell (you may need to `cd backend` if your build runs from repo root, or you may already be in the app root with `backend/` as subdir—check with `pwd`):

```bash
cd backend
npx prisma migrate status
```

Note which migration(s) show as **failed**.

---

## 3. Decide: rolled back or applied?

- **If the migration never ran successfully** (tables/columns don’t exist): mark it **rolled back** so Prisma will run it again on the next deploy.
- **If the migration partially ran** (tables or columns already exist): mark it **applied** so Prisma skips it.

### Option A: Mark as rolled back (tables don’t exist)

Use this when the migration failed before creating the objects. Replace `<migration_name>` with the folder name (e.g. `20260131000001_add_task`):

```bash
cd backend
npx prisma migrate resolve --rolled-back <migration_name>
```

Example:

```bash
npx prisma migrate resolve --rolled-back 20260131000001_add_task
```

Then exit the shell and **redeploy** (or push a commit). The migration will run again.

### Option B: Mark as applied (tables already exist)

Use this when the migration partially succeeded and the tables/columns are already there. Replace `<migration_name>` with the failed migration folder name:

```bash
cd backend
npx prisma migrate resolve --applied <migration_name>
```

Then run deploy again; Prisma will skip that migration.

---

## 4. Check if a table exists (to decide A vs B)

To see if a table was created:

```bash
cd backend
npx prisma db execute --stdin <<EOF
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'task';
EOF
```

If you get a row, the table exists → use **Option B** (mark as applied). If you get no rows → use **Option A** (mark as rolled back).

---

## 5. Scripts in backend/scripts/ (Render Shell)

From the Shell, `cd backend` first. Then:

- **Diagnose:** `./scripts/check-db.sh` — checks DATABASE_URL, connection, tables, and migration status.
- **Resolve one migration (smart):** `./scripts/resolve-migration.sh <migration_name>` — inspects the migration SQL and DB state, then marks **applied** (if the first table exists) or **rolled back** (if not). Use when you know the failed migration name from `npx prisma migrate status`.

Example:

```bash
cd backend
./scripts/check-db.sh
./scripts/resolve-migration.sh 20260131000001_add_task
```

Then redeploy.

---

## 6. Quick fix (when unsure)

1. In Render Shell: `cd backend` (if needed).
2. Run: `./scripts/check-db.sh` or `npx prisma migrate status` and note the **failed** migration name.
3. Run: `./scripts/resolve-migration.sh <that_name>` (preferred) or `npx prisma migrate resolve --rolled-back <that_name>`.
4. Exit and trigger a new deploy. If the migration runs and succeeds, you’re done.
5. If the next deploy fails with "already exists", open Shell again and run: `npx prisma migrate resolve --applied <that_name>`, then redeploy.

---

## Local development

- **Create migration (no DB):** From repo root: `./scripts/create-migration.sh <name>`.
- **Validate SQL:** `./scripts/validate-migration-sql.sh` (see [MIGRATION_SQL_RULES.md](MIGRATION_SQL_RULES.md)).
- **Apply locally:** In `backend/`: `npx prisma migrate deploy` (requires `DATABASE_URL`).
