# In-platform app navigation (wiring sidebar to Beacon)

When your app runs **inside Beacon** at `/apps/<namespace>` (in-platform), the **Beacon platform owns the sidebar**. To show your app’s sections and tabs in the primary, secondary, and tertiary nav (instead of a single “Dashboard” tab), you wire things up in **two places**: your app repo and the Beacon repo. This doc is the runbook so you (or an AI) can do it without re-deriving the steps.

## Contract (@beacon/app-layout)

The layout consumes three structures (see `beacon-app-layout/src/navigation.ts`):

- **`navigation`** — `NavSection[]`: primary sidebar sections. Each section has `id`, `name`, `path`, `icon`, `tabs` (array of `{ id, label, path, icon?, activePaths?, hasMenu? }`).
- **`level2Navigation`** — `Level2Nav[]`: secondary tabs (e.g. TopTabBar). Each entry has `sectionPath` (path prefix for that section) and `tabs`.
- **`level3Navigation`** — `Level3Nav[]`: tertiary tabs (e.g. under “Application Settings”). Each entry has `parentPath` and `tabs`.

Beacon passes these into `NavigationProvider`; the layout renders primary/secondary/tertiary from them. For in-platform apps, Beacon decides **what** to pass: when the user is on `/apps/<namespace>`, Beacon can pass your app’s nav (with paths prefixed by `/apps/<namespace>`).

---

## Part 1: In your app repo (beacon-app-min–style app)

Your app defines its own nav and routes so it can run **standalone** (e.g. grc frontend with its own sidebar) and so Beacon has a single source of truth to mirror.

### 1.1 Define navigation

In **`frontend/src/config/navigation.ts`**:

- Export **`navigation`**: array of `NavSection` (one per main area: Home, Programs, Risk, etc.). Use paths **relative to your app root** (e.g. `/`, `/programs`, `/risk-assessments`). Each section’s `tabs` are the primary tabs for that section.
- Export **`level2Navigation`**: array of `Level2Nav` — one entry per section that has second-level tabs; `sectionPath` is that section’s path, `tabs` are the level-2 tabs.
- Export **`level3Navigation`**: array of `Level3Nav` — e.g. for “Application Settings”; `parentPath` is the settings path, `tabs` are the settings sub-tabs.

Use the same types/shape as `@beacon/app-layout` (or copy the interfaces from `beacon-app-layout/src/navigation.ts`). Use `lucide-react` icons.

### 1.2 Routes and pages

- In **`frontend/src/App.tsx`** (or your layout entry), define **routes** for every path in your nav (index, list, detail, settings tabs, etc.).
- Create **one page component per route** (e.g. `pages/HomePage.tsx`, `pages/programs/ProgramsListPage.tsx`). Each page can be a “Coming soon” stub at first (its own heading + “Coming soon” in that file). Do **not** use a single shared “Coming soon” component for every route; use real pages so you can test integration and later replace content per page.

When the app runs standalone, it uses this same `navigation` / `level2Navigation` / `level3Navigation` in its own `NavigationProvider` and `AppLayout`.

---

## Part 2: In the Beacon repo

Beacon is the **consuming app**: it supplies the nav to the layout and renders your app’s UI at `/apps/<namespace>/*`. Paths in Beacon must be prefixed with `/apps/<namespace>` (e.g. `/apps/grc`, `/apps/grc/programs`).

### 2.1 App nav config (paths under `/apps/<namespace>`)

Create **`frontend/src/config/<namespace>Navigation.ts`** (e.g. `grcNavigation.ts`):

- Define the **same structure** as your app’s nav (same sections, same tabs, same level2/level3).
- **Prefix every path** with `/apps/<namespace>` (e.g. `/apps/grc`, `/apps/grc/programs`, `/apps/grc/administration/settings/programs`). A small helper like `const BASE = '/apps/grc'; function p(path) { return path === '/' ? BASE : BASE + path; }` keeps this consistent.
- Export **`<namespace>Navigation`** (e.g. `grcNavigation`), **`<namespace>Level2Navigation`**, **`<namespace>Level3Navigation`** (or similar names). Use Beacon’s existing `NavSection` / `Level2Nav` / `Level3Nav` types from `frontend/src/config/navigation.ts`.

Keep this file in sync with your app’s `frontend/src/config/navigation.ts` when you add or change sections/tabs.

### 2.2 Use this nav when the user is on your app

In **`frontend/src/components/layout/SubscriptionAwareLayout.tsx`**:

- Import your app’s nav exports (e.g. `grcNavigation`, `grcLevel2Navigation`, `grcLevel3Navigation`).
- In the `useMemo` that builds `nav`: when `onInPlatformApp && inPlatformAppSlug === '<namespace>'`, set the sidebar to **launcher + your app’s sections** (e.g. `[...launcherOnlyNavigation, ...grcNavigation]`), not the single “Dashboard” section.
- Build **level2** and **level3** similarly: when `inPlatformAppSlug === '<namespace>'`, use your app’s level2/level3; otherwise use Beacon’s default.
- Pass these into `NavigationProvider` (`navigation={nav}`, `level2Navigation={level2}`, `level3Navigation={level3}`).

Result: when the user is on any `/apps/<namespace>/*` route, the primary/secondary/tertiary sidebars show your app’s nav (with correct paths under `/apps/<namespace>`).

### 2.3 Route to your app’s pages

Beacon already has a route like **`apps/:appSlug/*`** that renders `InPlatformAppPage`. So `/apps/grc` and `/apps/grc/programs` both hit `InPlatformAppPage` with `appSlug === 'grc'`.

- In **`frontend/src/apps/InPlatformAppPage.tsx`**, for your app’s slug render an **app router component** (e.g. `GrcAppRouter`) instead of a single dashboard component.
- Create **`frontend/src/apps/<namespace>/GrcAppRouter.tsx`** (or `<Namespace>AppRouter.tsx`): it uses **`useLocation().pathname`** and, based on the path, renders the **correct page component** for that route (e.g. `/apps/grc` → Home, `/apps/grc/programs` → Programs list, `/apps/grc/administration/settings/programs` → Programs settings tab).
- Create **one page component per route** under **`frontend/src/apps/<namespace>/pages/`** (e.g. `GrcHomePage.tsx`, `GrcProgramsPage.tsx`, …). Each page is its own file with its own “Coming soon” (or real) content so you can test each route and later build it out.

No submodule and no separate UI package are required: the app repo stays independent (its own nav + routes + pages for standalone), and Beacon holds a **copy** of the nav (with `/apps/<namespace>` prefix) plus the in-platform page components and router.

---

## Checklist (next in-platform app with nav)

**In the new app repo (from beacon-app-min):**

- [ ] `frontend/src/config/navigation.ts`: define `navigation`, `level2Navigation`, `level3Navigation` (paths relative to app root).
- [ ] `frontend/src/App.tsx`: add routes for every nav path.
- [ ] `frontend/src/pages/**`: one page per route; each with its own content (e.g. “Coming soon”).

**In Beacon:**

- [ ] `frontend/src/config/<namespace>Navigation.ts`: same nav with all paths prefixed by `/apps/<namespace>`; export level2/level3 as well.
- [ ] `frontend/src/components/layout/SubscriptionAwareLayout.tsx`: when `inPlatformAppSlug === '<namespace>'`, use that app’s nav and level2/level3.
- [ ] `frontend/src/apps/<namespace>/GrcAppRouter.tsx`: switch on `pathname` and render the right page component.
- [ ] `frontend/src/apps/<namespace>/pages/*`: one component per route (e.g. GrcHomePage, GrcProgramsPage, …).
- [ ] `frontend/src/apps/InPlatformAppPage.tsx`: for `<namespace>`, render the app router (e.g. `<GrcAppRouter />`).

After that, the primary/secondary/tertiary nav and routing for `/apps/<namespace>/*` will work; you can refine nav structure (what’s in primary vs secondary vs tertiary) in both the app’s `navigation.ts` and Beacon’s `<namespace>Navigation.ts` in sync.
