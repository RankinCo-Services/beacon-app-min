# beacon-app-min

Minimal Beacon multi-app stub: **app-only** backend (one Postgres, Express + Prisma) and frontend (Vite + React) with a health check that shows **Database: connected** or **not connected**.

Use this repo as a **template** to create new apps that deploy only app-specific Render services (one Postgres, API, and optionally frontend) and can connect to an existing Beacon platform for identity and tenant context.

**New apps from this template include the Beacon layout by default** (sidebar, breadcrumbs, tenant switcher, user profile). Set `VITE_PLATFORM_API_URL` and `VITE_CLERK_PUBLISHABLE_KEY` on the frontend (Render env or `.secrets` when running the bootstrap script) so the layout works; until then the app shows a short config message.

## Quick start (from template)

1. On GitHub: **Use this template** → Create a new repository (e.g. `RankinCo-Services/my-app`).
2. Clone and run the bootstrap script:
   ```bash
   git clone https://github.com/RankinCo-Services/my-app.git && cd my-app
   git submodule update --init --recursive
   ./scripts/render-bootstrap-multi-app.sh my-app <OWNER_ID> https://github.com/RankinCo-Services/my-app
   ```
3. Push `main` to trigger Render deploy. On the **frontend** service in Render, set **VITE_PLATFORM_API_URL** (Beacon platform API URL) and **VITE_CLERK_PUBLISHABLE_KEY** (same Clerk key as Beacon) so the sidebar and auth work. Open the frontend URL and confirm **Database: connected** and the Beacon sidebar.

**In-platform (app runs inside Beacon frontend):** Use `--in-platform` to create only `-db` and `-api` (no frontend). Then add the app module + route in the Beacon repo, set `VITE_<APP_NAMESPACE>_API_URL` on Beacon frontend and `FRONTEND_URL` on the app API (Beacon frontend URL for CORS). See [docs/MULTI_APP_RUNBOOK.md](docs/MULTI_APP_RUNBOOK.md) § In-platform.

See [docs/MULTI_APP_RUNBOOK.md](docs/MULTI_APP_RUNBOOK.md) for full steps, secrets, and zero-prompt usage. For layout env and optional minimal (no-sidebar) setup, see [docs/ADDING_BEACON_LAYOUT.md](docs/ADDING_BEACON_LAYOUT.md).

## Local development

```bash
# Backend
cd backend && npm install && npx prisma migrate deploy && npm run dev

# Frontend (another terminal)
cd frontend && npm install && npm run dev
```

Frontend proxies `/api` to `http://localhost:3000`. Open http://localhost:5173 and ensure the app DB is running and **Database: connected** appears.

## Layout

- `backend/` — Express + Prisma (app DB only), `GET /api/health` returns `{ database: 'connected' | 'not connected' }`.
- `frontend/` — Vite + React with **Beacon layout by default** (sidebar, tenant switcher); dashboard shows DB status. Submodules: `beacon-tenant`, `beacon-app-layout`.
- `scripts/render-bootstrap-multi-app.sh` — Creates Render Postgres, web service, static site (build from repo root with submodules); sets env and SPA rewrite. Optional `PLATFORM_API_URL` and `CLERK_PUBLISHABLE_KEY` in secrets for layout.
- `scripts/.secrets.example` — Example for `RENDER_API_KEY`, optional `DATABASE_URL`, and optional `PLATFORM_API_URL` / `CLERK_PUBLISHABLE_KEY` for layout.

## Migrations

Create and validate Prisma migrations without a database connection. On Render, `npm start` runs `backend/scripts/start.sh`, which applies migrations and resolves common failures (P3018, "already exists") before starting the server. Pattern aligned with Beacon `backend/scripts/start.sh` (single-DB path).

- **Create migration:** `./scripts/create-migration.sh <name>` (e.g. `add_task_table`)
- **Create + commit:** `./scripts/migrate.sh <name> ["commit message"]`
- **Validate SQL (idempotent):** `./scripts/validate-migration-sql.sh` or `--all` / `--fix --file path`
- **In Render Shell (from backend/):** `./scripts/check-db.sh` (diagnose), `./scripts/resolve-migration.sh <name>` (resolve one failed migration by DB state)
- **Docs:** [docs/MIGRATION_SQL_RULES.md](docs/MIGRATION_SQL_RULES.md), [docs/RESOLVE_MIGRATION_ERROR.md](docs/RESOLVE_MIGRATION_ERROR.md)
