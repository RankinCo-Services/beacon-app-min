# Multi-App Runbook (beacon-app-min)

Use this repo as a **template** to create new apps that run alongside the existing Beacon platform. Each new app gets its **own** Render services (one Postgres, API, frontend) and connects to the **existing** platform for identity/tenant context when you add auth later.

## Reusable prompt (minimal interaction)

To create a new **in-platform** app (runs inside Beacon at `/apps/<app>`) with minimal user interaction, use the reusable prompt in **rco-developer-docs**: [docs/CREATE_IN_PLATFORM_APP_PROMPT.mdc](https://github.com/RankinCo-Services/rco-developer-docs/blob/main/docs/CREATE_IN_PLATFORM_APP_PROMPT.mdc). Say: **"Create a new in-platform beacon-app-min app named \<APP_NAME\>."** The prompt instructs the AI to: create repo from template, clone, bootstrap with `--in-platform --no-prompt`, push; then add the app to the Beacon repo (appApis, app module, InPlatformAppPage, permissionSeeder) and set Render env vars. Prerequisites: `RENDER_API_KEY` and optionally `BEACON_FRONTEND_URL` in `scripts/.secrets` for zero-prompt bootstrap.

## Prerequisites

- `gh` (GitHub CLI), `jq`, `curl`
- `RENDER_API_KEY` — [Create one](https://dashboard.render.com/u/settings?add-api-key)
- GitHub org: **RankinCo-Services**. Render workspace: **RankinCo Services** (`tea-d5qerqf5r7bs738jbqmg`)

## One-time: Create new app from this template

1. **Create repo from template**  
   On GitHub: **Use this template** → Create a new repository (e.g. `RankinCo-Services/my-new-app`). Do **not** fork; use "Use this template" so the new repo has no shared history with beacon-app-min.

2. **Clone your new repo**
   ```bash
   git clone https://github.com/RankinCo-Services/my-new-app.git
   cd my-new-app
   ```

3. **Bootstrap Render resources** (one Postgres, API, frontend)
   ```bash
   # Optional: copy and fill scripts/.secrets.example -> scripts/.secrets (RENDER_API_KEY, optional DATABASE_URL)
   ./scripts/render-bootstrap-multi-app.sh my-new-app tea-d5qerqf5r7bs738jbqmg https://github.com/RankinCo-Services/my-new-app
   ```
   If you use `scripts/.secrets` with `RENDER_API_KEY` and (optionally) `DATABASE_URL`, you can add `--no-prompt` to avoid prompts.

4. **Push to trigger deploy**
   ```bash
   git push origin main
   ```
   Render will build and deploy. Once the API has `DATABASE_URL`, the frontend will show **Database: connected**.

## Fully automated (gh + bootstrap, one shot)

With `gh` (GitHub CLI) and `RENDER_API_KEY` set, you can create the repo from the template, clone it, and bootstrap Render in one flow:

```bash
# Create repo from template and clone (run from a directory where you want the clone, e.g. $HOME/GitHub)
gh repo create RankinCo-Services/my-new-app --template RankinCo-Services/beacon-app-min --private --clone
cd my-new-app

# Bootstrap Render (use scripts/.secrets with RENDER_API_KEY for --no-prompt, or export RENDER_API_KEY)
./scripts/render-bootstrap-multi-app.sh my-new-app tea-d5qerqf5r7bs738jbqmg https://github.com/RankinCo-Services/my-new-app --no-prompt

# Push to trigger deploy (template content is already on main)
git push origin main
```

Replace `my-new-app` with your app name. The script will create Postgres, API, and frontend on Render and set env (including DATABASE_URL from Render when available). Open the frontend URL once deploy completes and confirm **Database: connected**.

## Optional: Zero-prompt run (bootstrap only)

Create `scripts/.secrets` (do not commit):

```bash
export RENDER_API_KEY=...
# export DATABASE_URL=...   # optional; script will try connection-info first
```

Then:

```bash
./scripts/render-bootstrap-multi-app.sh my-new-app tea-d5qerqf5r7bs738jbqmg https://github.com/RankinCo-Services/my-new-app --no-prompt
```

If `DATABASE_URL` is not in secrets and connection-info is not ready yet, set it later in Render Dashboard on the API service and redeploy.

## What the script creates

| Resource    | Name             | Purpose                    |
|------------|------------------|----------------------------|
| Postgres   | `{APP_NAME}-db`  | App-only database          |
| Web service| `{APP_NAME}-api`| Backend (Express + Prisma) |
| Static site| `{APP_NAME}-frontend` | Vite + React frontend (omit with `--in-platform`) |

- **No** platform DB — this app uses only its own DB. When you add Beacon platform integration, you will point at the existing platform API (e.g. `PLATFORM_API_URL`).
- API: `rootDir=backend`, build `npm install && npx prisma migrate deploy && npm run build`, start `node dist/index.js`. `FRONTEND_URL` is set for CORS (app frontend URL, or Beacon frontend URL when `--in-platform`).
- Frontend: `rootDir=frontend`, build `npm install && npm run build`, publish `dist`. `VITE_API_URL` is set to the API URL. Omitted when `--in-platform`.

## In-platform (app runs inside Beacon frontend)

When the app’s UI runs as a **route inside the Beacon frontend** (e.g. `/apps/multi-app-test`), deploy only the app’s API and DB:

```bash
./scripts/render-bootstrap-multi-app.sh my-app tea-d5qerqf5r7bs738jbqmg https://github.com/RankinCo-Services/my-app --in-platform
```

The script creates **only** `{APP_NAME}-db` and `{APP_NAME}-api` (no frontend). It prompts for **BEACON_FRONTEND_URL** (Beacon frontend origin for CORS) or use `BEACON_FRONTEND_URL` in `scripts/.secrets` with `--no-prompt`.

**Then in the Beacon repo:**

1. Add the app module (e.g. `frontend/src/apps/<namespace>/`) and route `/apps/:appSlug`, and an entry in `frontend/src/config/appApis.ts` (API URL and display name).
2. On **Beacon frontend** (Render): set `VITE_<APP_NAMESPACE>_API_URL` = this app’s API URL (e.g. `https://my-app-api.onrender.com`). Redeploy Beacon frontend so the build picks it up.
3. On **app API** (Render): set `FRONTEND_URL` = Beacon frontend URL (e.g. `https://beacon-frontend-sy4c.onrender.com`) if not set by the script. Required for CORS when Beacon frontend calls the app API.
4. **Register the app in the platform** so it appears in the app launcher (see [Adding a new app to the Beacon platform](#adding-a-new-app-to-the-beacon-platform) below).

See Beacon **DEPLOYMENT.md** (in-platform apps env) for reference.

## Adding a new app to the Beacon platform

The Beacon app launcher shows only **apps that exist in the platform DB** and that the tenant is **subscribed** to. Restarting the Beacon API does **not** auto-discover new apps; the backend only seeds apps that are **hardcoded in the seeder** (today: `psa` and `multi-app-test`). To add a new app (e.g. `e2e-test`), use one of these:

### Option A: Seed the app (restart API and it appears)

1. In the **Beacon** repo, edit `backend/src/utils/permissionSeeder.ts`.
2. Add a block for your app (same pattern as `multi-app-test`): create/update `App` with `namespace`, `name`, `description`, `status: 'published'`, `launch_url`: **null for in-platform apps** (or from env for standalone, e.g. `E2E_TEST_LAUNCH_URL`), `version`.
3. Restart the **Beacon API** (or redeploy). On startup, `bootstrapPlatform` runs `seedPermissions`, which creates or updates the app.
4. In **Platform Admin → Subscriptions**, assign the app to the tenants that should see it in the launcher.

### Option B: Create the app in Platform Admin (no code change)

1. Log into Beacon as a platform admin.
2. Go to **Platform Admin → Apps**.
3. Click **Create app** and set:
   - **In-platform apps** (UI inside Beacon at `/apps/<namespace>`): **Namespace** (e.g. `simple-to-do` — must match Beacon’s `appApis.ts` and route), **Name**, **Description**, **Launch URL: leave blank**, **Status** = Published. The launcher opens the app by **namespace** (routes to `/apps/<namespace>`); Launch URL is not used.
   - **Standalone apps** (own frontend URL): **Namespace** (e.g. `e2e-test`), **Name**, **Description**, **Launch URL** = the app’s frontend URL (e.g. `https://e2e-test-frontend.onrender.com`), **Status** = Published.
4. In **Platform Admin → Subscriptions**, assign the app to the tenants that should see it.

**Note:** For **in-platform** apps, you still add the app module and route in the Beacon frontend and set env as in the In-platform section above; the Platform Admin App record is what makes the app appear in the launcher and allows subscriptions. The launcher routes by **namespace** to `/apps/<namespace>` for in-platform apps—do not set Launch URL for in-platform apps (leave it blank; you can clear an existing URL in Edit and Save).

## Verify

1. Open the frontend URL (e.g. `https://my-new-app-frontend.onrender.com`).
2. You should see **Beacon App (Min)** and **Database: connected** once the API has `DATABASE_URL` and has run migrations.

## Adding the Beacon layout (sidebar, breadcrumbs, tenant switcher)

To get the full Beacon layout instead of a minimal white page, follow [ADDING_BEACON_LAYOUT.md](ADDING_BEACON_LAYOUT.md): add **beacon-tenant** and **beacon-app-layout** as submodules, add dependencies, copy the layout entry files (`main.with-layout.tsx` → `main.tsx`, `App.with-layout.tsx` → `App.tsx`), set `VITE_PLATFORM_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, and on Render use a build-from-root command with `git submodule update --init --recursive` and publish `frontend/dist`.

## Adding platform integration later

When you add Beacon platform (identity, RBAC, tenant context):

- Set `PLATFORM_API_URL` (and optionally Clerk keys) on the API and frontend.
- Use `@beacon/tenant-ui` and `@beacon/app-layout` in the frontend; add tenant/auth middleware in the backend.
- Register the app in platform admin (Apps page). For **in-platform** apps leave Launch URL blank; for **standalone** apps set `launch_url` to this app’s frontend URL.
