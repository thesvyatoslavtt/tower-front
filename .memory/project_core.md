# Project core

## Stack

- Vite 7 + React 19 + TypeScript strict (`noUncheckedIndexedAccess`).
- Tailwind 4 (via `@tailwindcss/vite`), CSS variables in `src/index.css`.
- Redux Toolkit + RTK Query (`@/shared/api/baseApi`).
- React Router 7 (data router in `@/app/router`).
- Forms: react-hook-form + zod (added with the first form).
- Tests: Vitest + Testing Library; setup in `src/test/setup.ts`.
- Lint: ESLint 9 flat + `eslint-plugin-boundaries`.

## Commands

- `yarn dev` / `yarn build` / `yarn lint` / `yarn typecheck` / `yarn test` / `yarn run check`.

## Paths

- Alias: `@/` → `src/`.
- App entry: `src/main.tsx` → `src/app/App.tsx`.
- Store: `src/app/store.ts` (+ `useAppDispatch`, `useAppSelector`).
- Router: `src/app/router.tsx`.
- Theme: `src/app/providers/ThemeProvider.tsx` + `src/app/uiSlice.ts`.
- Layout: `src/widgets/AppLayout`, `src/widgets/Header`, `src/widgets/Sidebar`.

## Module conventions

- `modules/<name>/index.ts` — the only public API.
- Pages — default export (for `React.lazy`).
- Domain server state — RTK Query, not Redux.

## Where the rules live

- Code style + ESLint rules → [`docs/code-style.md`](../docs/code-style.md)
- Architecture, layers, dependency graph, theming → [`docs/architecture.md`](../docs/architecture.md)
- RBAC spec → [`docs/rbac.md`](../docs/rbac.md)
- Auth abstraction → [`docs/auth.md`](../docs/auth.md)
- Skills inventory + methodology → [`docs/skills.md`](../docs/skills.md)
- Module-level CLAUDE.md template → [`docs/module-claude-template.md`](../docs/module-claude-template.md)
- Roadmap / phase scope → [`docs/roadmap.md`](../docs/roadmap.md)
- Archived bootstrap plan (do not treat as live) → [`docs/history/bootstrap-plan.md`](../docs/history/bootstrap-plan.md)
