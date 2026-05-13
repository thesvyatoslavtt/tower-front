# Roadmap

> **Authoritative spec for phase scope.** Features marked "shipped" must exist in `src/`; features marked "not done" must NOT exist (placeholders OK if explicitly tagged). [`check-docs-sync`](../.claude/skills/check-docs-sync/SKILL.md) Check 3 enforces this.

## Status

Living document. Current focus: **phase 1**.
Snapshot date: **2026-05-12**.

Cross-links: [architecture](./architecture.md), [RBAC](./rbac.md), [auth](./auth.md), [skills](./skills.md), [code style](./code-style.md).

## Phase 1 — MVP scope

Three screens end-to-end: **Header, Sidebar (with menu), People Directory** + navigation to **Employee Detail**.

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

## Out of scope for phase 1

Finance, Projects, Sales, Recruiting, Admin, Performance, 360, Offboarding, Equipment, Documents.

The architecture and RBAC must allow adding any of them via a recipe (see [../CONTRIBUTING.md](../CONTRIBUTING.md) and [skills](./skills.md)) without touching the core.

## Work plan (PR breakdown)

Each task = a separate PR.

1. **Bootstrap**: vite + ts + tailwind + eslint + prettier + husky. Hello world.
2. **AI config**: create `CLAUDE.md`, `CONTRIBUTING.md`, `docs/*` topical docs, `.memory/*`, `.claude/skills/*`.
3. **Store + Router + Theme + Layout shell**.
4. **RBAC core**: types, dictionary, `<Can/>`, `usePermission`, `RequirePermission`. Unit tests.
5. **Auth abstraction + `mockAuthProvider` + `userSlice` + role switcher (dev only)**.
6. **MSW + `baseApi`**, endpoint `GET /me`.
7. **Widget Header**.
8. **Widget Sidebar** (with menu filtering by permissions).
9. **Employee entity + endpoints `GET /employees`, `GET /employees/:id`** + fixtures.
10. **Page PeopleDirectory** (search, filters, KPI, table).
11. **Page EmployeeDetail** (Overview tab + placeholders for the rest).
12. **Netlify deploy + e2e smoke (Playwright)**.

## Phase 1 verification

1. `yarn dev` → opens `/people`, shows a table of 18 employees.
2. Clicking a row → `/people/U01` → Overview with data.
3. In dev mode the role switcher changes the role; the menu in the Sidebar changes; the salary column appears/disappears.
4. `yarn lint` + `yarn typecheck` + `yarn test` are green.
5. Playwright smoke: login (mock) → directory → detail → logout.
6. `.memory/MEMORY.md` + all key `.md` files are present and index each other.
7. Deployed to a Netlify preview, SPA redirect works.

## Future phases

Phase 2+ will be appended here as we close phase 1.
