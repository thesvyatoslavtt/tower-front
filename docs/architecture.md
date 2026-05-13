# Architecture

> **Authoritative spec.** If `src/` drifts from this document, the **code** is wrong — fix the code or update this spec FIRST (then the code). Agents MUST run [`check-docs-sync`](../.claude/skills/check-docs-sync/SKILL.md) before declaring a task done.

Tower v2 uses a **modular architecture by business domain** (not FSD). Each business domain is a self-contained module with a public API exposed through a barrel. Strict boundaries like FSD, fewer layers, simpler for AI agents: one task = one folder.

Cross-links: [code style](./code-style.md), [RBAC](./rbac.md), [auth](./auth.md), [module CLAUDE.md template](./module-claude-template.md), [../CLAUDE.md](../CLAUDE.md).

## Layers

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

## Dependency graph

```
app → widgets → modules → shared
        ↑          ↑
        └──────────┘  (widgets may read module types and permission keys, not UI)
```

- `shared` knows nothing about modules.
- `modules` know nothing about `widgets` or `app`.
- Modules **do not import each other** at UI/runtime — only via types from the barrel.
- `widgets` may read modules' types and permission keys but not their UI components.

Enforced by `eslint-plugin-boundaries` in `eslint.config.js`.

## Modularity rules

Strictly enforced by ESLint `eslint-plugin-boundaries`.

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

## Why modular and not FSD

- In FSD `entities/features/widgets`, agents often get confused about which layer "filters on the employees page" belongs to. In the modular approach, it's just `modules/people/components/EmployeeFilters.tsx`.
- Fewer folders and barrels → less chance of making a mess.
- A single `add-module-feature` skill works for any domain.
- Recipes in `CONTRIBUTING.md` are shorter and more concrete.

## Data flow

- **Server state** — RTK Query (`baseApi.injectEndpoints` inside each module).
- **Global UI state** — Redux slice (`app/uiSlice.ts`: theme, sidebar collapsed).
- **Auth** — dedicated module + `authProvider` abstraction (mock → SSO). See [auth](./auth.md).
- **Local UI state** — `useState` / `useReducer` inside the component.

Business data is **never** duplicated into Redux.

## Routing

`src/app/router.tsx` holds the route map. A layout route renders `AppLayout` (Header + Sidebar + `<Outlet/>`). Protected routes are wrapped in `<RequirePermission permission="…">`. Pages are imported with `React.lazy` through each module's barrel (so the page's default export is reached via the module's public API).

## Theming

CSS variables in `src/index.css`, dark mode toggled via the `.dark` class on `<html>` by `ThemeProvider`. Components use Tailwind tokens (`bg-card`, `text-foreground`, `bg-primary`) which map to those CSS variables. **No hardcoded hex.** See [code style → Styling](./code-style.md).
