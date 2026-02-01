# Beacon layout (default) and optional minimal mode

**New apps from this template use the Beacon layout by default**: sidebar, breadcrumbs, tenant switcher, user profile. The template includes **beacon-tenant** and **beacon-app-layout** as submodules and the layout entry files (`main.tsx`, `App.tsx`).

## What you need for the layout to work

1. **Submodules** — When you create a new repo from the template and clone it, run:
   ```bash
   git submodule update --init --recursive
   ```
   The bootstrap script uses a build from repo root that runs this automatically on Render.

2. **Environment variables** — Set these on the **frontend** (local `.env` or Render → frontend service):
   | Variable | Purpose | Example |
   |----------|---------|---------|
   | `VITE_PLATFORM_API_URL` | Platform API (tenant list, tenant context, subscriptions). **Required for layout.** | `https://beacon-api-xxx.onrender.com` |
   | `VITE_CLERK_PUBLISHABLE_KEY` | Same Clerk key as the Beacon platform (so users are already signed in). | `pk_live_...` or `pk_test_...` |
   | `VITE_API_URL` | Your app’s own API (health, app data). Set by the bootstrap script. | `https://my-app-api.onrender.com` |

   For **zero-prompt bootstrap**, add to `scripts/.secrets` (do not commit):
   ```bash
   export PLATFORM_API_URL=https://beacon-api-xxx.onrender.com
   export CLERK_PUBLISHABLE_KEY=pk_live_... or pk_test_...
   ```
   The bootstrap script will set `VITE_PLATFORM_API_URL` and `VITE_CLERK_PUBLISHABLE_KEY` on the frontend service when these are present.

3. **Render frontend build** — The bootstrap script configures the static site to build from repo **root** with:
   - **Root directory:** `.`
   - **Build command:** `git submodule update --init --recursive && cd frontend && npm install && npm run build`
   - **Publish directory:** `frontend/dist`

If `VITE_PLATFORM_API_URL` or `VITE_CLERK_PUBLISHABLE_KEY` is missing, the app shows a short message asking you to set them instead of crashing.

## Local development (with layout)

```bash
# Backend
cd backend && npm install && npx prisma migrate deploy && npm run dev

# Frontend (from repo root so submodules are present)
cd frontend && npm install && npm run dev
```

Create `frontend/.env` with `VITE_PLATFORM_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, and `VITE_API_URL` (e.g. `http://localhost:3000`).

## Existing apps (created before layout was default)

If your app (e.g. **e2e-test**) was created from the template before the Beacon layout became the default, add the sidebar as follows:

1. From your app repo root: add submodules and init:
   ```bash
   git submodule add https://github.com/RankinCo-Services/beacon-tenant.git beacon-tenant
   git submodule add https://github.com/RankinCo-Services/beacon-app-layout.git beacon-app-layout
   git submodule update --init --recursive
   ```
2. Replace `frontend/src/main.tsx` and `frontend/src/App.tsx` with the layout versions from the current [beacon-app-min](https://github.com/RankinCo-Services/beacon-app-min) template (or copy from `main.with-layout.tsx` / `App.with-layout.tsx` in the template).
3. In `frontend/package.json`, add the layout dependencies: `@beacon/app-layout` (`file:../beacon-app-layout`), `@beacon/tenant-ui` (`file:../beacon-tenant/packages/tenant-ui`), `@clerk/clerk-react`, `axios`, `lucide-react`, `react-router-dom`, `sonner`, `zustand`. Run `cd frontend && npm install`.
4. On **Render → frontend service**: set **VITE_PLATFORM_API_URL** (Beacon platform API URL) and **VITE_CLERK_PUBLISHABLE_KEY** (same Clerk key as Beacon). Set **Root directory** to `.`, **Build command** to `git submodule update --init --recursive && cd frontend && npm install && npm run build`, **Publish directory** to `frontend/dist`. Save and redeploy.

After redeploy, the app will show the Beacon sidebar.

## Optional: minimal mode (no sidebar)

If you want the original minimal app (no Beacon sidebar, no auth), you can switch back:

1. Replace `frontend/src/main.tsx` with the contents of `frontend/src/main.minimal.tsx` (if present) or a simple entry that only renders your app component.
2. Replace `frontend/src/App.tsx` with a minimal component that only fetches and displays DB status (see `frontend/src/App.minimal.tsx` if present).
3. In `frontend/package.json`, remove the `@beacon/app-layout` and `@beacon/tenant-ui` (and related) dependencies if you no longer need them.
4. On Render, you can change the frontend build back to **rootDir:** `frontend`, **Build command:** `npm install && npm run build`, **Publish:** `dist`.

The template keeps `main.with-layout.tsx` and `App.with-layout.tsx` as reference; the default `main.tsx` and `App.tsx` are now the layout versions.

## App backend (optional auth)

The minimal app backend has no auth. To enforce tenant context and subscription for API calls, add `@beacon/tenant` to the backend, use `verifyClerkJwt` and tenant/subscription checks, and point the backend at the platform DB or platform API. That is separate from “layout”; the layout only requires the frontend and env vars above.
