# `src/shared` — Shared layer

## Purpose

Reusable primitives and infrastructure. **Knows nothing about domains** (no `Employee`, `Project`, etc.).

## Contents

- `ui/` — shadcn components and thin wrappers (Button, Dialog, Table, FormField, ...). Empty for now — filled in with the first UI piece.
- `lib/` — general utilities: `cn()`, hooks.
  - `lib/rbac/` (planned) — `Can`, `usePermission`, `RequirePermission`.
- `api/` — `baseApi` (RTK Query), `authProvider` abstraction (planned).
- `config/` — env, `ROUTES`, permission keys, base `Role → Permission[]` matrix (planned).
- `types/` — global types (`UserId`, `Role`, `Permission`, `ApiError`) — planned.

## Local rules

- **No domain types** in `shared/`. If a type is needed in two modules, it's either genuinely cross-domain (`UserId`, `ApiError`) — and goes into `shared/types/` — or it's a sign to import the type from the owning module's barrel rather than duplicating it.
- **No references to modules, app, widgets, mocks.** `shared` imports `shared` only.
- Colors — theme tokens only (`var(--color-*)` / Tailwind). No hex in `shared/ui`.
- A `shared/ui` component must be fully controlled (controlled props, no hidden state) and must not pull in RTK Query / the store.

## What you MAY import

- `@/shared/*` (within the layer).

## What you MAY NOT

- `@/app/*`, `@/widgets/*`, `@/modules/*`, `@/mocks/*` — enforced by `eslint-plugin-boundaries`.

## When something moves here

- A utility or hook is used by **two or more** modules/widgets → extract to `shared/lib`.
- A UI primitive (button, input, dialog) → `shared/ui`.
- If the candidate drags in domain types, that's a signal the right place is a module, not shared.
