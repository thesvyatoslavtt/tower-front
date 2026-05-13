# `src/app` — App composition

## Purpose

Root composition: store, router, providers, the root `App`. No business logic.

## Contents

- `App.tsx` — root component: `<StoreProvider><ThemeProvider><AppRouter/></ThemeProvider></StoreProvider>`.
- `store.ts` — `configureStore` + `baseApi.middleware` + typed `useAppDispatch` / `useAppSelector`. Exports `RootState`, `AppDispatch`.
- `uiSlice.ts` — global UI state: `theme`, `sidebarCollapsed`. `THEME` (as const) + `NEXT_THEME` map.
- `router.tsx` — `createBrowserRouter` + `RouterProvider`. Route map with `AppLayout` as a layout route.
- `providers/StoreProvider.tsx`, `providers/ThemeProvider.tsx` — wrappers.

## Initialization order (in `App.tsx`)

1. `StoreProvider` — Redux + RTK Query.
2. `ThemeProvider` — reads `state.ui.theme`, toggles the `dark` class on `<html>`.
3. `AppRouter` — renders routes.

## Local rules

- `app/` holds **only** composition and global UI state. Any business state goes into a module via RTK Query.
- No business data in Redux slices.
- New provider → file in `providers/`, wrapped in `App.tsx`.
- New route → in `router.tsx`, `element` via `React.lazy` from a module's barrel.
- Protected route → wrapped in `<RequirePermission permission="…">` (once the RBAC core lands).

## What you MAY import

- `@/shared/*`, `@/widgets/*`, `@/modules/*` (only via the `@/modules/<name>` barrel).

## What you MAY NOT

- Module internals (`@/modules/people/api/...`) — only the barrel.
- Direct imports from `mocks/` (MSW is wired in `main.tsx` separately when added).

## Open TODOs

- `RequirePermission` guard not implemented yet (see [`docs/roadmap.md`](../../docs/roadmap.md) step 4 and [`docs/rbac.md`](../../docs/rbac.md)).
- `authProvider` abstraction (see [`docs/roadmap.md`](../../docs/roadmap.md) step 5 and [`docs/auth.md`](../../docs/auth.md)) — will be initialized in `App.tsx` after `StoreProvider`.
