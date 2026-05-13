# `src/widgets` — Cross-module UI compositions

## Purpose

Cross-module UI compositions that render in the app layout or stitch several modules together on a single surface. **Thin** — no business logic.

## Contents

- `AppLayout/` — shell: `Header` + `Sidebar` + `<Outlet/>`. Layout route in `app/router.tsx`.
- `Header/` — top bar: theme toggle (now); later: Cmd+K search, notifications, user menu, role switcher (dev).
- `Sidebar/` — navigation. Reads `MENU_ITEMS` (label/path/icon, later + `permission`), filters by permissions, knows nothing about business data.

## Local rules

- **A widget is a thin composition.** State and logic live inside modules (via module hooks and RTK Query). A widget just calls them and lays things out.
- **A widget reads only types and permission keys from modules**, never UI or runtime logic. No `EmployeeCard` inside `Header`.
- Sidebar menu — data (`menuItems.ts`), not code. Permission filtering goes through the future `usePermission` / `Can`.
- Colors — theme tokens only (`var(--color-*)` / Tailwind).

## What you MAY import

- `@/shared/*`
- `@/modules/<name>` (only via the barrel, only types and permission keys)
- `@/app/*` (typed hooks `useAppDispatch` / `useAppSelector`, `uiSlice` actions)

## What you MAY NOT

- Module internals (`@/modules/people/api/...`) — only the barrel.
- Module UI components (`EmployeeCard`, etc.) — widgets do **not** build out of them.

## When to extract a component into `widgets`

- It's used in multiple layout points or routes **AND** doesn't belong to a single domain.
- Otherwise it lives in `shared/ui` (cross-domain primitive) or `modules/<m>/components` (domain-specific).

## Open TODOs

- Sidebar permission filtering — after the RBAC core (see [`docs/roadmap.md`](../../docs/roadmap.md) step 4).
- Header: Cmd+K search, notifications, user menu, role switcher (dev) — see [`docs/roadmap.md`](../../docs/roadmap.md) step 6.
