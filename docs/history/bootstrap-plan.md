# Tower v2 — Bootstrap Plan (archived)

> **Archived bootstrap plan, frozen on 2026-05-12.** Current rules live under [`docs/*`](../). Kept here only for historical context — do not edit, do not link as a current source. For the live documents see [`docs/code-style.md`](../code-style.md), [`docs/architecture.md`](../architecture.md), [`docs/rbac.md`](../rbac.md), [`docs/auth.md`](../auth.md), [`docs/skills.md`](../skills.md), [`docs/roadmap.md`](../roadmap.md), [`docs/module-claude-template.md`](../module-claude-template.md).

## Context

Inside Artkai there is a prototype `Desktop/artkai/tower` (live: https://tower-artkai.netlify.app) — an enterprise portal for employees: people directory, finance, projects, recruiting, admin, etc. The project was entirely written by AI without architectural oversight: PersonPage = 4421 lines, duplicated permission systems (RoleContext + config/permissions.ts), 17 roles, mocks scattered across 50+ files, prop drilling, inline styles mixed with Tailwind.

The task is to rewrite it "from scratch, properly" using AI agents from the adjacent factory project. At the start we are building three screens: **Header, Sidebar (with menu), People Directory** + navigation from Active Employees to **Employee Detail**. We then expand iteratively. The architecture and `.md` context must be designed with the assumption that the code is written by agents — meaning there must be clear invariants, recipes for adding features, and a single source of truth for types/roles/permission keys.

## Stack

| Layer       | Choice                                                              | Rationale                                                                                     |
| ----------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Build       | **Vite 5 + React 19 + TS strict**                                   | Speed, compatibility with the factory stack.                                                  |
| Routing     | **React Router 7 (data routers)**                                   | Loader/action API, convenient guards.                                                         |
| State / API | **Redux Toolkit + RTK Query**                                       | User's request; tag-based invalidation, cache, code splitting.                                |
| Mock API    | **MSW (Mock Service Worker)**                                       | We write endpoints as in prod, mocks for dev/test. Backend is plugged in by swapping baseUrl. |
| UI          | **shadcn/ui + Tailwind 4 + Radix + lucide-react**                   | Compatible with tower, easy to reuse the visual layer.                                        |
| Forms       | **react-hook-form + zod**                                           | Typed schemas, shared validation with RTK Query DTOs.                                         |
| Tests       | **Vitest + Testing Library + Playwright (e2e)**                     | Standard.                                                                                     |
| Lint/Format | **ESLint 9 + Prettier + lint-staged + Husky**                       | Strict rules, agents run `npm run check`.                                                     |
| Auth        | **`authProvider` abstraction** (stub → Google SSO / Supabase later) | Decision deferred; interface is fixed.                                                        |
| Permissions | **RBAC via permission keys + `<Can/>` + `usePermission`**           | Flexible, testable, explicit.                                                                 |
| Deploy      | **Netlify** (like tower)                                            | preview branches, SPA redirects.                                                              |

## Architecture — modular by domains

We chose a **modular architecture** (rather than FSD). Each business domain = a self-contained module with a public API exposed via a barrel. This gives strict boundaries (like FSD) but with fewer layers and is simpler for AI agents: one task = one folder.

```
src/
├── app/                       # Application composition
│   ├── providers/             # StoreProvider, RouterProvider, ThemeProvider, AuthProvider, ErrorBoundary
│   ├── router.tsx             # route map + guards
│   ├── store.ts               # configureStore
│   └── App.tsx
│
├── shared/                    # Reusable, with no knowledge of domains
│   ├── ui/                    # shadcn components + wrappers (Button, Dialog, Table, FormField)
│   ├── lib/                   # cn(), general-purpose hooks
│   │   └── rbac/              # Can, usePermission, RequirePermission
│   ├── api/                   # baseApi, baseQueryWithReauth, authProvider (abstraction)
│   ├── config/                # env, ROUTES, permission keys, base Role→Permission[] matrix
│   └── types/                 # global types (UserId, Role, Permission, ApiError)
│
├── modules/                   # ★ BUSINESS DOMAINS. Each module is a black box.
│   ├── auth/
│   │   ├── api/
│   │   ├── model/             # types.ts, schemas (zod), slice (if needed)
│   │   ├── components/
│   │   ├── hooks/             # useCurrentUser, useLogin
│   │   ├── pages/             # LoginPage
│   │   └── index.ts           # PUBLIC API of the module
│   │
│   ├── people/
│   │   ├── api/               # peopleApi.ts (RTK Query endpoints)
│   │   ├── model/             # Employee type, zod schemas, selectors
│   │   ├── components/        # EmployeeCard, EmployeeFilters, EmployeeStatusBadge
│   │   ├── hooks/             # useEmployeeFilters, useEmployeeActions
│   │   ├── pages/
│   │   │   ├── PeopleDirectoryPage/
│   │   │   └── EmployeeDetailPage/
│   │   │       ├── EmployeeDetailPage.tsx
│   │   │       └── tabs/      # OverviewTab, SalaryTab (lazy)
│   │   ├── permissions.ts     # which permission keys the module declares
│   │   └── index.ts
│   │
│   ├── finance/               # (future)
│   ├── projects/              # (future)
│   ├── recruiting/            # (future)
│   └── admin/                 # (future)
│
├── widgets/                   # Cross-module UI compositions
│   ├── AppLayout/             # Shell: Header + Sidebar + <Outlet/>
│   ├── Header/
│   └── Sidebar/               # reads menuItems (filters by permissions)
│
└── mocks/                     # MSW
    ├── browser.ts
    ├── handlers/
    │   ├── people.ts
    │   └── auth.ts
    └── fixtures/
        ├── employees.ts
        └── users.ts
```

### Modularity rules (strictly enforced by ESLint `eslint-plugin-boundaries`)

1. **A module is a black box.** From the outside, you can import **only from `modules/<name>/index.ts`** (the barrel). Direct imports into internals (`modules/people/api/...`) are forbidden.
2. **Modules do not depend on each other directly.** If you need data from another domain — only via:
   - public **types** from the barrel (`import type { Employee } from "@/modules/people"`),
   - or RTK Query tags/cache.
   - **No** UI components from one module inside another.
3. **The dependency graph is one-directional:**

   ```
   app  →  widgets  →  modules  →  shared
                       (parallel, no cross-imports)
   ```

   - `shared` does not know about modules.
   - `modules` do not know about `widgets` and `app`.
   - `widgets` can read modules' types and permission keys but not their UI.

4. **Pages live inside modules** (`modules/people/pages/...`), not in a global `src/pages/`. `app/router.tsx` lazy-imports them through the public barrel.
5. **Permissions.** The base `Role → Permission[]` matrix lives in `shared/config/permissions.ts`. Each module can **extend** it via its own `modules/<name>/permissions.ts`, which is merged into a single dictionary at `AuthProvider` initialization. This allows adding a module without touching the central file.
6. **Widgets are thin compositions.** `Sidebar` knows only `menuItems` (an array of `{ label, path, permission, icon }`) and filters by permissions. No business logic.
7. **Pages are thin.** A page assembles module components and widgets; all logic is in module hooks.

### Why modular and not FSD

- In FSD `entities/features/widgets`, agents often get confused about which layer "filters on the employees page" belongs to. In the modular approach, it's just `modules/people/components/EmployeeFilters.tsx`.
- Fewer folders and barrels → less chance of making a mess.
- A single `add-module-feature` skill works for any domain.
- Recipes in `CONTRIBUTING.md` are shorter and more concrete.

## RBAC: roles and permissions

### Model

```ts
// shared/types/rbac.ts
export type Role =
  | "super_admin"
  | "exec"
  | "hr"
  | "recruiter"
  | "finance"
  | "pm"
  | "delivery_lead"
  | "employee";

export type Permission =
  | "employees.view"
  | "employees.viewAll"
  | "employees.edit"
  | "employees.viewSalary"
  | "employees.editSalary"
  | "employees.viewSensitive"
  | "projects.view"
  | "projects.edit"
  | "finance.view"
  | "admin.access";
// ...
```

- `shared/config/rolePermissions.ts` — a dictionary `Record<Role, Permission[]>`. **Single source of truth.**
- The API returns `{ user, roles: Role[] }`. Permissions are computed on the client from roles (and cached in Redux).
- No separate boolean flags in the UI — only `permission keys`.

### Usage

```tsx
// hook
const canEditSalary = usePermission("employees.editSalary");

// component-guard (render-prop)
<Can permission="employees.editSalary" fallback={null}>
  <SalaryEditor />
</Can>

// route-guard
<Route element={<RequirePermission permission="admin.access" />}>
  <Route path="/admin/*" element={<AdminLayout />} />
</Route>

// menu items
const items = useFilteredMenu(MENU_ITEMS); // filters by permission
```

### Authorization (stub → SSO)

`shared/api/authProvider.ts`:

```ts
export interface AuthProvider {
  login(): Promise<Session>;
  logout(): Promise<void>;
  getSession(): Promise<Session | null>;
  refresh(): Promise<Session>;
}
```

At the start — `mockAuthProvider` (localStorage + a role switcher for development and demo convenience). A Google SSO implementation is added without UI changes.

`baseQueryWithReauth` — the standard RTK Query pattern: 401 → `refresh()` → retry.

## Design source: the `tower` project

**We take the visuals from the existing `Desktop/artkai/tower`** (live: https://tower-artkai.netlify.app) — we reuse ready-made compositions, screen layouts, colors, typography, icons, paddings, states (hover/active/empty/loading), card/table/modal shapes. This saves design effort and preserves visual continuity.

**But the code is rewritten from scratch following the rules of the new app** — no copy-pasting of files. That is:

- **What we copy:** look-and-feel and UX behavior. We open a screen in tower, see how it looks/works, and reproduce it in the new architecture.
- **What we do NOT copy:**
  - the file/folder structure of tower (it's an FSD mess with mock contexts);
  - inline styles, local hardcoded colors — only theme tokens (`bg-card`, `text-foreground`);
  - single-file mega-components (PersonPage 4421 lines) — we split by size rules (≤300 lines);
  - duplicated permission systems — only our RBAC (`<Can/>` / `usePermission`);
  - mocks in Redux/Context — only MSW;
  - custom wrappers over Radix — we use shadcn/ui as-is + our wrappers in `shared/ui`.
- **The new app's rules take priority** on any conflict: module boundaries, named exports, RBAC via permission keys, RTK Query for server state, react-hook-form + zod for forms, naming conventions, file size, import order, no "what" comments.
- **Icons:** `lucide-react` (as in tower) — 1:1 mapping where possible.
- **Tailwind tokens** are migrated as theme tokens in `tailwind.config` + CSS variables (light/dark), not as hardcoded values.
- **shadcn components** are installed anew via the CLI (`npx shadcn@latest add ...`), not copied from tower — versions and APIs may have diverged.

**The `add-page` / `add-component` skill must, during pre-flight, record a reference to a tower screen** (URL + screenshot/description) and reference it in the PR description so the reviewer can cross-check the visuals.

## MVP scope (phase 1)

| #   | Artifact                                                                  | Files                                                                                                                  |
| --- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | Project skeleton + configs                                                | `vite.config.ts`, `tsconfig`, `eslint`, `tailwind`, `index.css`                                                        |
| 2   | Providers + router + store                                                | `app/providers/*`, `app/router.tsx`, `app/store.ts`                                                                    |
| 3   | `baseApi` (RTK Query) + MSW bootstrap                                     | `shared/api/baseApi.ts`, `mocks/browser.ts`, `mocks/handlers/*`                                                        |
| 4   | RBAC: types, dictionary, `<Can/>`, `usePermission`, `RequirePermission`   | `shared/types/rbac.ts`, `shared/config/permissions.ts`, `shared/lib/rbac/*`                                            |
| 5   | Auth abstraction + `mockAuthProvider` + auth module                       | `shared/api/authProvider.ts`, `modules/auth/*`                                                                         |
| 6   | **Widget: Header**                                                        | search (Cmd+K stub), notifications (stub), role switcher (dev only), theme toggle, user menu                           |
| 7   | **Widget: Sidebar**                                                       | logo, menu (filtered by permission), active item, mobile overlay, user card                                            |
| 8   | **Page: PeopleDirectory** (`modules/people/pages/PeopleDirectoryPage`)    | KPI cards, filters (search/unit/type), Active Employees table, Former section (collapsible), row click → `/people/:id` |
| 9   | **Page: EmployeeDetail** (MVP, `modules/people/pages/EmployeeDetailPage`) | Overview tab only: name, contacts, unit, position, status, manager. Other tabs — stubs with TODO                       |
| 10  | MSW fixtures                                                              | 18 employees (as in tower U01–U18), several roles                                                                      |
| 11  | Netlify deploy + `_redirects` for SPA                                     | `public/_redirects`                                                                                                    |

Out of scope for phase 1: Finance, Projects, Sales, Recruiting, Admin, Performance, 360, Offboarding, Equipment, Documents — but the architecture and RBAC must allow adding them "via a recipe" (see CONTRIBUTING.md).

## Documentation for AI agents (`.md` context)

Black Memory moves **inside the repo** — `.memory/` is committed to git.

```
tower-v2/
├── README.md                     # human-facing
├── CLAUDE.md                     # master instructions for agents: invariants, workflow, links
├── ARCHITECTURE.md               # layers, import rules, providers, data flow
├── CONTRIBUTING.md               # recipes: "How to add a page / feature / RTK endpoint / permission / role"
├── CHANGELOG.md                  # append-only
├── docs/
│   ├── rbac.md                   # roles, permissions, how to add them
│   ├── auth.md                   # current stub + SSO plan
│   ├── api-conventions.md        # naming endpoints, DTO, error shape
│   ├── ui-guidelines.md          # shadcn patterns, themes, accessibility
│   └── testing.md                # unit/e2e approaches
├── .memory/                      # Black Memory (in-repo)
│   ├── MEMORY.md                 # index (what is where)
│   ├── project_core.md           # stack, commands, paths, key components
│   ├── task_routing.md           # task type → which .md to read
│   ├── invariants_checklist.md   # checklist before PR (import rules, RBAC, types)
│   ├── glossary.md               # terms: Unit, Type, Probation, Allocation...
│   └── feedback/                 # accumulated review feedback memory
└── .claude/
    ├── settings.json             # permissions allowlist + hooks
    ├── hooks/send-usage.sh       # as in other projects (analytics)
    └── skills/                   # see the "Skills for agents" section below
        ├── add-module/
        ├── add-page/
        ├── add-rtk-endpoint/
        ├── add-permission/
        ├── add-component/
        ├── add-widget/
        ├── add-form/
        ├── add-table/
        ├── add-msw-handler/
        ├── add-test/
        └── split-large-file/
```

## Skills for agents (`.claude/skills/`)

Skills are "recipes" by which factory agents perform routine tasks. Each skill = a folder with a `SKILL.md` (triggers, steps, checklists) and optionally `templates/` (boilerplate).

**Structure of `.claude/skills/<name>/SKILL.md`** (required sections):

1. **Trigger** — user phrases that activate the skill.
2. **Inputs** — what parameters are needed.
3. **Pre-flight checklist** — what to verify BEFORE taking action.
4. **Steps** — step-by-step recipe with paths to files and templates.
5. **Post-flight checklist** — what must be present in the output (lint/typecheck/module's CLAUDE.md updated, etc.).

### MVP skills (created up front, Tier 1 + Tier 2)

| Skill                  | Trigger                                                 | What it does                                                                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`add-module`**       | "create module X"                                       | Scaffolds `modules/<name>/{api,model,components,hooks,pages}/`, `index.ts`, `permissions.ts`, module's `CLAUDE.md` from a template (≤200 lines). Registers the module in `app/store.ts` and `app/router.tsx`.                         |
| **`add-page`**         | "add page X to module Y"                                | Creates `modules/<Y>/pages/<X>/`, `<X>.tsx` (default export for `React.lazy`), registers the route with `<RequirePermission>`, updates the Routes section in the module's `CLAUDE.md`.                                                |
| **`add-rtk-endpoint`** | "add endpoint X to module Y"                            | Extends `modules/<Y>/api/<y>Api.ts` via `injectEndpoints`. Adds the DTO + zod schema to `model/types.ts`. Correctly sets `providesTags`/`invalidatesTags`. In parallel, adds an MSW handler in `mocks/handlers/<y>.ts` and a fixture. |
| **`add-permission`**   | "add permission X" / "give role Y access to Z"          | Adds the key to `modules/<m>/permissions.ts` (or `shared/config/permissions.ts` for global ones), updates the `Role → Permission[]` matrix, `docs/rbac.md`, the module's `CLAUDE.md`, adds a test for `usePermission`.                |
| **`add-component`**    | "add component X"                                       | Creates `<X>.tsx` (named export) + `index.ts` in the correct folder (`shared/ui` vs `modules/<m>/components` vs `widgets`), following the strict component structure template from CLAUDE.md. Runs the file-size rule.                |
| **`add-widget`**       | "add widget X"                                          | Creates `widgets/<X>/`, verifies that the widget does not pull UI from modules (only types and permission keys), adds it to `widgets/index.ts`.                                                                                       |
| **`add-form`**         | "add form X"                                            | Scaffolds a form on `react-hook-form` + `zod` resolver, uses wrappers from `shared/ui/form/*`, with the DTO alongside, type via `z.infer`. Handles loading/error states via RTK Query mutation.                                       |
| **`add-table`**        | "add table X"                                           | Template on shadcn Table + sorting/filter/pagination, integration with an RTK Query query, skeleton state, empty state, RBAC-driven column filtering via `<Can/>`.                                                                    |
| **`add-msw-handler`**  | "mock endpoint X"                                       | Creates a handler + fixture in `mocks/`, ensures types match the module's DTO, registers it in `mocks/handlers/index.ts`.                                                                                                             |
| **`add-test`**         | "write a test for X"                                    | Picks a test type (Vitest for hooks/utilities, RTL for components, Playwright for e2e), creates a `*.test.tsx` alongside, uses test providers (Store/Router/Auth).                                                                    |
| **`split-large-file`** | "split file X" / automatically on a `max-lines` warning | Analyzes the file, extracts subcomponents / hooks / configs into adjacent files following the rules from CLAUDE.md.                                                                                                                   |

### Tier 3 skills (added later)

`update-memory`, `pre-pr-check`, `review-pr`, `add-role` — operational/housekeeping. We create them once we have a live PR flow and more than one role in SSO.

### Principles of our skills

- **One skill = one operation.** No "universal" skills that do everything.
- **Every skill must update the module's `CLAUDE.md` and `MEMORY.md`** if it touches anything reflected in them (Public API, Routes, Permissions, Data flow).
- **Post-flight always includes `npm run check`** (lint + typecheck + test). A skill is not considered done until the check is green.
- **Templates (`templates/`) keep boilerplate separate from instructions** — this yields deterministic results across different agents.

### Methodology for authoring skills (per [agentskills.io](https://agentskills.io/skill-creation/best-practices))

We write skills **not ahead of time**, but **while it's fresh from real work** — Anthropic's recommendation "Extract from a hands-on task".

**Process:**

1. **Bootstrap proceeds without skills.** First we set up Vite, configs, the .md skeleton, the RBAC core.
2. On the first real application of a pattern (e.g. "create module people") — we write the first version of the skill while it's fresh.
3. Apply the skill to the next task of the same type → collect gotchas → iterate to v2.
4. After 3–5 applications, the skill stabilizes.

**Structure of each `.claude/skills/<name>/SKILL.md`:**

```markdown
---
name: <skill-name>
description: <a single sentence for auto-triggering. Should contain the user's key phrases.>
---

## Trigger

Phrases that activate the skill.

## Inputs

What parameters are needed (module name, entity name, permission keys).

## Pre-flight checklist

- [ ] Module/file does not exist
- [ ] Name is in the correct case
- [ ] Dependencies installed

## Steps

1. Create `…` from the `templates/…` template
2. Register in `…`
3. Update `…`

## Gotchas ← required section

Concrete project-specific "gotchas" that the agent will get wrong
without explicit guidance. Updated after each real application.
Example:

- When adding an endpoint, always update `mocks/handlers/index.ts`,
  otherwise MSW won't pick up the handler.
- `providesTags` for a list endpoint must include `{ type: "X", id: "LIST" }`,
  otherwise a POST mutation will not invalidate the list.

## Templates / Scripts

Links to `templates/*.tsx`, `scripts/*.sh` inside the skill folder.

## Validation loop

What to run and what to do if it fails:

1. `npm run check`
2. If ESLint fails on boundaries — check the imports, they must not bypass the barrel
3. If typecheck fails — verify that the DTO in `model/types.ts` matches the one in the MSW handler

## Post-flight checklist

- [ ] `npm run check` is green
- [ ] Module's `CLAUDE.md` is updated (if Public API/Routes/Permissions were touched)
- [ ] `MEMORY.md` index is updated if a new file was added
- [ ] CHANGELOG.md is updated
```

**Key rules from agentskills.io that we follow:**

- **SKILL.md ≤ 500 lines / 5000 tokens.** Our target is ≤200 lines so as not to bloat the agent's context.
- **Progressive disclosure.** Large content → in `references/<topic>.md` next to the skill + an explicit "Read references/X.md when …", not "see references/ for details".
- **Add what the agent lacks, omit what it knows.** We don't explain what React/RTK Query is — only our project-specific rules and pitfalls.
- **Defaults, not menus.** One path is chosen (shadcn, RTK Query, react-hook-form, zod). Alternatives are mentioned only as an escape hatch.
- **Procedures, not declarations.** A skill teaches **how to approach** a class of tasks, not a finished answer for a single case.
- **Match specificity to fragility.** Prescriptive steps — where order and format matter (RTK tags, route registration, RBAC guards). Freedom — where variations are acceptable (card markup).
- **Coherent unit.** `add-rtk-endpoint` includes creation of the MSW handler and fixture — this is one logical task, not three. A separate `add-msw-handler` is kept only for mocking external APIs without RTK.
- **Gotchas-driven iteration.** Every time we fix the agent manually, that fix goes into the `Gotchas` of the corresponding skill. This is the main way skills improve.
- **Bundled scripts.** If, across several runs, the agent reinvents the same logic (validating a module name, generating a barrel) — we factor it out into `scripts/` inside the skill folder.

**What we check separately before shipping each skill:**

- `description` in the frontmatter — a short sentence with the user's key phrases. We test on several wordings that the agent actually picks up the skill (see [Optimizing skill descriptions](https://agentskills.io/skill-creation/optimizing-descriptions)).
- The skill does not duplicate what's already in `CLAUDE.md` / `CONTRIBUTING.md` — those hold general rules; the skill only holds the specifics of a particular operation.

**Artifact after phase 1:** all 11 skills (Tier 1 + Tier 2) are written based on **real experience** of applying them, have non-empty `Gotchas`, and are validated on at least two different tasks of the same type.

**Principle:** `.memory/MEMORY.md` — a short index with file descriptions (≤150 characters per entry). The content itself lives in separate `.md` files. The factory agent, at the start of a task, reads `MEMORY.md` → `task_routing.md` → the relevant docs.

### Module-level documentation

In **every** module, `modules/<name>/CLAUDE.md` is mandatory (≤ 200 lines). It's the local context the agent reads **first** when working inside the module — before the global `CLAUDE.md`/`ARCHITECTURE.md`.

```
modules/people/
├── CLAUDE.md       # ← required, ≤200 lines
├── api/
├── model/
├── components/
├── hooks/
├── pages/
├── permissions.ts
└── index.ts
```

**Template `modules/<name>/CLAUDE.md`:**

```markdown
# Module: <name>

## Purpose

1–2 sentences: which business domain the module owns.

## Public API (what index.ts exports)

- Components: `EmployeeCard`, `EmployeeStatusBadge`
- Hooks: `useCurrentUser`, `useEmployees`
- Types: `Employee`, `EmployeeStatus`
- Pages (for the router): `PeopleDirectoryPage`, `EmployeeDetailPage`

## Permissions declared by the module

- `employees.view` — view the list
- `employees.viewSalary` — sees the Salary column
- (full list + default roles — in `./permissions.ts`)

## Routes

- `/people` → `PeopleDirectoryPage` (requires `employees.view`)
- `/people/:id` → `EmployeeDetailPage` (requires `employees.view`)

## Data flow

- API: RTK Query (`peopleApi`), tags `Employee` / `Employee-LIST`.
- Source of truth is the backend; local state is for UI filters only.
- No duplication of server state in Redux.

## Dependencies

- shared/ui, shared/lib/rbac
- modules/auth → types only (`Role`, `CurrentUser`)
- Does NOT depend on other modules via UI/runtime

## What's inside (map)

- `api/peopleApi.ts` — endpoints
- `model/types.ts` — DTO + zod schemas
- `components/` — domain components (≤300 lines each)
- `hooks/` — module hooks
- `pages/PeopleDirectoryPage/` — list
- `pages/EmployeeDetailPage/` — detail + `tabs/`

## Local rules (if any)

- Salary-related UI is always wrapped in `<Can permission="employees.viewSalary">`.
- Former employees are shown in a separate collapsible section.

## Open TODOs / known limitations

- Search is currently client-side — will move to server-side once the backend is connected.
```

**A similar `CLAUDE.md` (≤200 lines) is required for:**

- `src/shared/CLAUDE.md` — what lives in shared, rules for adding to it.
- `src/widgets/CLAUDE.md` — what counts as a widget, when to extract one.
- `src/app/CLAUDE.md` — providers, initialization order, the router.
- `src/mocks/CLAUDE.md` — how to add handlers and fixtures.

**The 200-line limit** is intentional: if a module outgrows it, we split into sub-documents (`docs/people-onboarding.md`, etc.) and leave links in `CLAUDE.md`. This keeps the agent's context compact.

## Critical files to create/implement

- `vite.config.ts`, `tsconfig.json`, `tailwind` setup, `src/index.css`
- `src/app/router.tsx` — route map with guards
- `src/app/providers/StoreProvider.tsx`, `AuthProvider.tsx`, `ThemeProvider.tsx`
- `src/shared/api/baseApi.ts` — RTK Query base slice
- `src/shared/api/authProvider.ts` + `src/shared/api/mockAuthProvider.ts`
- `src/shared/types/rbac.ts`, `src/shared/config/permissions.ts`
- `src/shared/lib/rbac/Can.tsx`, `usePermission.ts`, `RequirePermission.tsx`
- `src/modules/auth/model/userSlice.ts`, `hooks/useCurrentUser.ts`, `index.ts`
- `src/modules/people/api/peopleApi.ts`, `model/types.ts`, `permissions.ts`, `index.ts`
- `src/widgets/Header/Header.tsx`
- `src/widgets/Sidebar/Sidebar.tsx`, `menuItems.ts`
- `src/modules/people/pages/PeopleDirectoryPage/*`
- `src/modules/people/pages/EmployeeDetailPage/*` (+ `tabs/OverviewTab.tsx`)
- `src/mocks/handlers/employees.ts`, `src/mocks/fixtures/employees.ts`, `src/mocks/browser.ts`
- `public/_redirects`

## Work plan (for the factory — each task = a separate PR)

1. **Bootstrap**: vite + ts + tailwind + eslint + prettier + husky. Hello world.
2. **AI config**: create `CLAUDE.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `.memory/*`, `.claude/skills/*`.
3. **Store + Router + Theme + Layout shell**.
4. **RBAC core**: types, dictionary, `<Can/>`, `usePermission`, `RequirePermission`. Unit tests.
5. **Auth abstraction + mockAuthProvider + userSlice + role switcher (dev only)**.
6. **MSW + baseApi**, endpoint `GET /me`.
7. **Widget Header**.
8. **Widget Sidebar** (with menu filtering by permissions).
9. **Employee entity + endpoints `GET /employees`, `GET /employees/:id`** + fixtures.
10. **Page PeopleDirectory** (search, filters, KPI, table).
11. **Page EmployeeDetail** (Overview tab + placeholders for the rest).
12. **Netlify deploy + e2e smoke (Playwright)**.

## My preferences and notes

- **RTK Query, not axios+thunks.** The requested stack + tag-based invalidation solves 90% of CRUD tasks without extra logic.
- **MSW is mandatory.** The alternative (static mocks in Redux) would lead to the same mess as in tower (50+ data files). MSW forces an API-first approach.
- **No global Contexts for business data** (like `EquipmentRegisterContext`, `LeaveRequestsContext` in tower) — everything via RTK Query. We keep Context only for Theme/Auth/i18n.
- **We split PersonPage from day one.** In tower it's 4421 lines. For us: `EmployeeDetailPage` = layout + lazy-loaded `tabs/*.tsx`, each < 300 lines. Each tab is a separate widget with its own endpoints.
- **Permission keys are namespaced strings**, not enums. Easier to add without migrations.
- **Strict ESLint rules** on import boundaries (`eslint-plugin-boundaries`) and file size (`max-lines: 400`). Otherwise agents quickly degrade quality.
- **CHANGELOG is mandatory** — factory agents write an entry on every PR; easy to audit what they did.
- **Feature flags are not needed at the start** — no real traffic. We'll add them when production appears.
- **i18n is not baked in now** (en-only), but we name strings meaningfully so they can be moved to i18next later without a refactor.

## Code Style and rules (borrowed from `brain-ai-front`, adapted to our stack)

These rules will go into `CLAUDE.md` + `CONTRIBUTING.md` of the new project. Factory agents must follow them on every PR.

### File structure

```
src/widgets/Sidebar/
├── Sidebar.tsx         # named export
├── menuItems.ts        # data/config co-located with the component
├── Sidebar.test.tsx    # tests are co-located
└── index.ts            # re-export: export { Sidebar } from "./Sidebar"
```

- **Named exports for all components**, except pages (`src/pages/**`) — where a **default export** is required for `React.lazy`.
- A barrel `index.ts` at every level (`widgets/index.ts`, `entities/employee/index.ts`, etc.).
- **Imports only via the `@/` alias** — no `../../../`. Config in `vite.config.ts` + `tsconfig.json`.

### Import order

```ts
// 1. React and third-party libraries
import { useState } from "react";
import { useNavigate } from "react-router";

// 2. Internal via alias (top layers first, then lower)
import { EmployeeCard } from "@/entities/employee";
import { Can } from "@/shared/lib/rbac";
import { Button } from "@/shared/ui/button";

// 3. Types (in a separate block)
import type { Employee } from "@/entities/employee";
```

A blank line between groups. The ESLint rule `import/order` enforces this automatically.

### Naming

| Entity              | Style                      | Example                           |
| ------------------- | -------------------------- | --------------------------------- |
| Components          | PascalCase                 | `EmployeeCard.tsx`, `Sidebar.tsx` |
| Hooks               | camelCase + `use`          | `useCurrentUser`, `usePermission` |
| Constants           | SCREAMING_SNAKE_CASE       | `DEFAULT_PAGE_SIZE`, `ROUTES`     |
| Types/interfaces    | PascalCase                 | `Employee`, `EmployeeCardProps`   |
| Utilities/functions | camelCase                  | `formatDate`, `cn`                |
| Permission keys     | dot.case                   | `employees.viewSalary`            |
| Test files          | `*.test.tsx` / `*.test.ts` | co-located next to the code       |

### Name readability (a hard rule)

**Single-letter and uninformative abbreviations are forbidden** for any variables, parameters, callback arguments, indices, etc. A name must tell **what it is**, not "what's shorter".

```ts
// ❌ BAD
data.map((d) => d.name);
employees.filter((e) => e.status === "active");
users.forEach((u, i) => console.log(i, u));
arr.reduce((a, c) => a + c.salary, 0);
const res = await fetch(...);
const { d } = props;

// ✅ GOOD
employees.map((employee) => employee.name);
employees.filter((employee) => employee.status === "active");
users.forEach((user, index) => console.log(index, user));
employees.reduce((total, employee) => total + employee.salary, 0);
const response = await fetch(...);
const { data } = props;
```

Rules:

- In `map/filter/find/reduce/forEach` callbacks, use the **full element name in the singular**: `employees.map((employee) => ...)`, `projects.find((project) => ...)`.
- `reduce` accumulators are named by meaning: `total`, `acc` is acceptable only in very general utilities in `shared/lib`.
- Indices — `index`, not `i`. Keys — `key`, not `k`. Events — `event`, not `e`.
- Intermediate variables — `response`, `result`, `payload`, not `res`, `r`, `p`.
- Abbreviations are allowed only for **commonly accepted domain acronyms**: `id`, `url`, `dto`, `api`, `db`. And even then — as part of a name (`employeeId`, not just `id` in a broad scope).
- Destructuring does not justify a short name: `const { d: data } = obj` — no, name the field `data` from the start.

ESLint enforcement:

```jsonc
{
  "id-length": ["error", { "min": 2, "exceptions": ["_"] }],
  "@typescript-eslint/naming-convention": [
    "error",
    { "selector": "variableLike", "format": ["camelCase", "PascalCase", "UPPER_CASE"] },
  ],
}
```

The goal — code should read like a description of the task. If a name is unclear without context — rename.

### Domain string constants

Any **domain set of strings** (theme, role, status, employee type, unit, permission scope, etc.) is declared as an `as const` object + a derived literal union. **TS `enum` is forbidden** (including `const enum`) — ESLint error via `no-restricted-syntax` on `TSEnumDeclaration`.

Reasons: enums drag in a runtime object (not tree-shakable), mix value/type, numeric enums are unsafe, they live poorly with `erasableSyntaxOnly`, and the project already has a consistent pattern (`ROUTES` in `shared/config/routes.ts`).

```ts
// ✅ GOOD
export const THEME = {
  light: "light",
  dark: "dark",
} as const;
export type Theme = (typeof THEME)[keyof typeof THEME];

// for binary/cyclic toggles — use a map, not a ternary
export const NEXT_THEME: Record<Theme, Theme> = {
  [THEME.light]: THEME.dark,
  [THEME.dark]: THEME.light,
};

dispatch(setTheme(NEXT_THEME[theme]));

// ❌ BAD
export enum Theme {
  Light = "light",
  Dark = "dark",
}
dispatch(setTheme(theme === "light" ? "dark" : "light"));
```

**When to extract:**

- The string has a domain meaning (theme / role / status / employee type / unit / permission scope) **AND**
- it is repeated ≥2 times within a single module **OR** appears in API/DTO.

**When to leave inline:**

- One-off technical literals: `aria-label`, test `data-testid`, UI section headings, button text.
- Any single literal with no domain meaning.

**Location:**

- Module-specific → `modules/<m>/model/constants.ts` (or next to the type in `model/types.ts`).
- Cross-module → `shared/config/<domain>.ts` (like `routes.ts`).
- The type is always exported from the same file as the object.

### Component file structure (strict order)

```tsx
// 1. Imports (by groups, see above)
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import type { Employee } from "@/entities/employee";

// 2. Local types
interface EmployeeCardProps {
  employee: Employee;
  onSelect?: (id: string) => void;
}

// 3. Local constants (if needed)
const STATUS_LABELS: Record<Employee["status"], string> = {
  active: "Active",
  bench: "Bench",
  dismissed: "Dismissed",
};

// 4. Component
export function EmployeeCard({ employee, onSelect }: EmployeeCardProps) {
  // 4.1 — Hooks (useState, useQuery, useMemo, ...)
  const [isHovered, setIsHovered] = useState(false);

  // 4.2 — Derived values
  const statusLabel = STATUS_LABELS[employee.status];

  // 4.3 — Handlers
  const handleClick = () => {
    onSelect?.(employee.id);
  };

  // 4.4 — Early return (loading/empty/error)
  if (!employee) return null;

  // 4.5 — Render
  return <div onClick={handleClick}>{/* ... */}</div>;
}
```

### Indentation and logical blocks

- **A blank line between logical sections** inside the component: between hooks and handlers, between a group of handlers and `return`, between different `useEffect`s.
- **Inside JSX**: a blank line between major meaningful blocks (`<Header>` ↔ `<Main>` ↔ `<Footer>`).
- Inside a function — blank lines separate the steps (validation → computation → side effect → return).
- No more than **1 consecutive blank line** (ESLint: `no-multiple-empty-lines: { max: 1 }`).

### Comments

**By default there are no comments.** Good code is explained by names.

You should comment only when:

- the **WHY** is non-obvious (a business rule, a workaround for a bug, a counterintuitive trade-off);
- a regular expression or a complex formula;
- a TODO with context (`// TODO(rbac): move to a server-side check once SSO is connected`).

Forbidden:

- Comments describing **what** the code does (`// increment counter`).
- Commented-out code (delete it, git remembers).
- JSDoc on every function — only for the public API in `shared/`.

TODO format: `// TODO(scope): description` — scope lets you grep.

### File size and component splitting

- `max-lines: 300` (ESLint warn), 400 — error.
- `max-lines-per-function: 80`.
- If a component crosses 200 lines — split it:
  - Subcomponents → into adjacent files (`EmployeeCard/Header.tsx`, `EmployeeCard/Stats.tsx`).
  - Handlers with heavy logic → into custom hooks (`useEmployeeActions`).
  - Configs/constants → into an adjacent file (`EmployeeCard.config.ts`).

**PersonPage in tower = 4421 lines = anti-pattern.** Our `EmployeeDetailPage` = layout + lazy tabs, each tab < 250 lines.

### Styling (Tailwind + shadcn)

- Use `cn()` from `shared/lib/utils.ts` for conditional classes.
- **No inline styles** (`style={{ ... }}`), except when the value is genuinely dynamic (e.g. `--progress: ${pct}%`).
- Colors — only via theme tokens (`text-foreground`, `bg-card`), no hardcoded hex.
- Long `className`s are split into lines via `cn()`:
  ```tsx
  <div className={cn(
    "flex items-center gap-2 rounded-md border p-3",
    "hover:bg-accent transition-colors",
    isActive && "border-primary bg-accent",
  )}>
  ```
- Animations/keyframes — via Tailwind config, not inline CSS.

### Forms

- **All forms — `react-hook-form` + `zod` resolver.** No `useState` for fields.
- A single shared catalog of wrappers in `shared/ui/form/*` (`FormField`, `FormInput`, `FormSelect`).
- The DTO for the API and the zod schema live side by side; types are derived via `z.infer`.

### API layer (RTK Query)

```ts
export const employeeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEmployees: build.query<Employee[], EmployeeFilters>({
      query: (filters) => ({ url: "/employees", params: filters }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Employee" as const, id })), "Employee"]
          : ["Employee"],
    }),
    getEmployee: build.query<Employee, string>({
      query: (id) => `/employees/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Employee", id }],
    }),
  }),
});

export const { useGetEmployeesQuery, useGetEmployeeQuery } = employeeApi;
```

Rules:

- Endpoints are co-located in `entities/<entity>/api/`.
- Tags are typed (`type: "Employee" as const`).
- List queries whose data changes often → `refetchOnMountOrArgChange: true`.
- DTOs in `entities/<entity>/model/types.ts`.

### Hooks and state

- **Local state** — `useState`/`useReducer`.
- **Server state** — RTK Query (we do not duplicate it into local state).
- **Global state** — Redux slices only for: `auth`, `ui` (theme, sidebar collapsed). Business data is **never** duplicated in slices.
- Custom hooks — `arrow function` style, memoize handlers via `useCallback` only when they are passed down into memoized components.

### Functions

- **Arrow functions** for components and utilities, except when hoisting is needed (rare).
- Destructure props in the signature.
- Early return instead of nested `if`s.

### Types

- `strict: true` in `tsconfig`. `noUncheckedIndexedAccess: true`.
- No `any` (ESLint error). When necessary — `unknown` + narrow.
- `interface` for public props, `type` for unions/intersections — consistently.
- Domain types — in `entities/<entity>/model/types.ts`, exported via the barrel.

### ESLint enforcement (key rules)

```jsonc
{
  "no-multiple-empty-lines": ["error", { "max": 1 }],
  "max-lines": ["warn", 300],
  "max-lines-per-function": ["warn", 80],
  "import/order": ["error", { "newlines-between": "always", "groups": [...] }],
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/consistent-type-imports": "error",
  "boundaries/element-types": "error"   // FSD import boundaries
}
```

`prettier` + `prettier-plugin-tailwindcss` for auto-sorting classes. Husky pre-commit: `lint-staged` → `eslint --fix` + `prettier --write`.

### Agent checklist before PR (moved into `.memory/invariants_checklist.md`)

- [ ] Is the file < 300 lines? If not — split into subcomponents.
- [ ] Imports via `@/`, sorted by groups.
- [ ] Named export (default only for pages).
- [ ] No inline `style={{}}` without a real need.
- [ ] No comments describing _what_ the code does.
- [ ] All forms — on `react-hook-form` + `zod`.
- [ ] RBAC check via `<Can/>` / `usePermission`, not via direct role comparison.
- [ ] Server data — only via RTK Query, not duplicated in Redux/state.
- [ ] `npm run check` (lint + typecheck + test) is green.
- [ ] CHANGELOG updated.

## Verification (how to check that phase 1 is done)

1. `npm run dev` → opens `/people`, shows a table of 18 employees.
2. Clicking a row → `/people/U01` → Overview with data.
3. In dev mode the role switcher changes the role; the menu in the Sidebar changes; the salary column appears/disappears.
4. `npm run lint` + `npm run typecheck` + `npm run test` are green.
5. Playwright smoke: login (mock) → directory → detail → logout.
6. `.memory/MEMORY.md` + all key `.md` files are present and index each other.
7. Deployed to a Netlify preview, SPA redirect works.
