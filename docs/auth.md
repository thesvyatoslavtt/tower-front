# Auth

> **Authoritative spec.** If `src/` drifts from this document, the **code** is wrong — fix the code or update this spec FIRST (then the code). Agents MUST run [`check-docs-sync`](../.claude/skills/check-docs-sync/SKILL.md) before declaring a task done.

Auth in Tower v2 is hidden behind a **pluggable provider abstraction**. The current implementation is a localStorage-backed mock with a dev-only role switcher; future implementations (Google SSO, Supabase, etc.) plug in by swapping the provider — **no UI rewrite**.

Cross-links: [RBAC](./rbac.md), [architecture](./architecture.md), [roadmap](./roadmap.md).

## Goal

- One stable interface (`AuthProvider`) that the rest of the app depends on.
- Real implementations are swappable: `mockAuthProvider` today, `googleAuthProvider` or `supabaseAuthProvider` tomorrow.
- The auth module (`src/modules/auth/*`) owns the UI (LoginPage, role switcher, user menu hook); it consumes the provider through the abstraction.

## `AuthProvider` interface

```ts
// src/shared/api/authProvider.ts
export interface AuthProvider {
  login(): Promise<Session>;
  logout(): Promise<void>;
  getSession(): Promise<Session | null>;
  refresh(): Promise<Session>;
}
```

Where `Session` carries `{ user, roles, accessToken, expiresAt }` (exact shape lives next to the interface).

## `mockAuthProvider`

- Location: `src/shared/api/mockAuthProvider.ts`.
- Stores the active session in `localStorage`.
- Exposes a **dev-only role switcher** so demos can flip between roles without re-login.
- Drives MSW handlers that return `{ user, roles }` from fixtures (see `src/mocks/handlers/auth.ts`).

## `baseQueryWithReauth`

Standard RTK Query pattern for transparent re-authentication:

1. The request runs through the base query.
2. If the response is **401**, the wrapper calls `authProvider.refresh()`.
3. On success — the original request is retried once.
4. On failure — the wrapper dispatches a logout and surfaces the error.

Used as the base query inside `src/shared/api/baseApi.ts`. Every module's `injectEndpoints` inherits it.

## Where it lives

- `src/shared/api/authProvider.ts` — the interface + a small `setAuthProvider` / `getAuthProvider` registry.
- `src/shared/api/mockAuthProvider.ts` — the dev implementation.
- `src/modules/auth/*` — UI: `LoginPage`, `useCurrentUser`, `userSlice`, dev role switcher.

## Initialization

`app/App.tsx` mounts providers in order:

1. `StoreProvider` (Redux store ready).
2. `AuthProvider` provider initializes the chosen `AuthProvider` implementation and merges all module permission contributions into the global matrix (see [RBAC](./rbac.md)).
3. `ThemeProvider`, `RouterProvider`, `ErrorBoundary` follow.

By the time the router renders, a session (or `null`) is known and the permission matrix is complete.

## Current state

Spec only. The stub (`mockAuthProvider` + interface + `baseQueryWithReauth`) lands in roadmap step 5; real SSO arrives later. See [roadmap](./roadmap.md).
