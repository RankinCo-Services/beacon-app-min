# Migration SQL Rules (Idempotent / Safe for Deploy)

Migrations must be **idempotent** so they can be re-run without failing when objects already exist. This avoids deploy failures when a migration is retried.

---

## Rules

1. **CREATE TABLE** → use `CREATE TABLE IF NOT EXISTS "Name" (...)`  
2. **CREATE INDEX / CREATE UNIQUE INDEX** → use `IF NOT EXISTS`  
3. **ALTER TABLE ADD COLUMN** → wrap in `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE ...) THEN ALTER TABLE ...; END IF; END $$;`  
4. **ALTER TABLE ADD CONSTRAINT** → wrap in `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='...') THEN ...; END IF; END $$;`  
5. **DROP TABLE** → use `DROP TABLE IF EXISTS "Name"`

---

## Scripts (run from repo root)

- **Create migration (no DB required):**  
  `./scripts/create-migration.sh <name>`  
  Example: `./scripts/create-migration.sh add_task_table`

- **Validate SQL (newest migration):**  
  `./scripts/validate-migration-sql.sh`

- **Validate all:**  
  `./scripts/validate-migration-sql.sh --all`

- **Auto-fix CREATE TABLE/INDEX only:**  
  `./scripts/validate-migration-sql.sh --fix [--file path]`

- **Full workflow (create + commit):**  
  `./scripts/migrate.sh <name> ["commit message"]`

---

## Start script (migration failure resolution)

On Render, `npm start` runs `backend/scripts/start.sh`, which:

1. Runs `prisma migrate deploy`.
2. If deploy fails with **P3018** (failed migration): runs `resolve-migration.sh` for each failed migration (or marks rolled back), then retries deploy. Resolver checks DB state and marks **applied** or **rolled back** accordingly.
3. If **"already exists"**: marks the latest migration as applied and retries deploy.
4. Then starts the server.

**Backend scripts (run from `backend/` in Render Shell):**

- `./scripts/check-db.sh` — diagnose connection, tables, and migration status.
- `./scripts/resolve-migration.sh <name>` — resolve one failed migration by checking DB state.

If resolution fails, use **Render Shell** and the runbook: [RESOLVE_MIGRATION_ERROR.md](RESOLVE_MIGRATION_ERROR.md).
