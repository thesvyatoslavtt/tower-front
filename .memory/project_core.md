# Project core

## Stack
- Vite 6 + React 19 + TypeScript strict (`noUncheckedIndexedAccess`).
- Tailwind 4 (via `@tailwindcss/vite`), CSS variables в `src/index.css`.
- Redux Toolkit + RTK Query (`@/shared/api/baseApi`).
- React Router 7 (data router в `@/app/router`).
- Forms: react-hook-form + zod (добавится с первой формой).
- Tests: Vitest + Testing Library; setup в `src/test/setup.ts`.
- Lint: ESLint 9 flat + `eslint-plugin-boundaries`.

## Commands
- `yarn dev` / `yarn build` / `yarn lint` / `yarn typecheck` / `yarn test` / `yarn check`.

## Paths
- Alias: `@/` → `src/`.
- App entry: `src/main.tsx` → `src/app/App.tsx`.
- Store: `src/app/store.ts` (+ `useAppDispatch`, `useAppSelector`).
- Router: `src/app/router.tsx`.
- Theme: `src/app/providers/ThemeProvider.tsx` + `src/app/uiSlice.ts`.
- Layout: `src/widgets/AppLayout`, `src/widgets/Header`, `src/widgets/Sidebar`.

## Module conventions
- `modules/<name>/index.ts` — единственный публичный API.
- Pages — default export (для `React.lazy`).
- Доменный server state — RTK Query, не Redux.
