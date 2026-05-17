# CLAUDE.md — Tower v2

Master instructions for AI agents working in this repository. **This project is agent-driven** — humans rarely touch it. Rules below are HARD: a task is not done until every Workflow Rule and Invariant passes.

Topical docs live under [`docs/`](docs/) and **are the authoritative specification**: if `src/` drifts from `docs/*`, the **code** is wrong.

## TL;DR

- Stack: **Vite + React 19 + TS strict + Tailwind 4 + RTK Query + React Router 7**.
- Architecture: **module-per-domain** (`src/modules/<name>`), import boundaries enforced by ESLint (`eslint-plugin-boundaries`). Full picture — [`docs/architecture.md`](docs/architecture.md).
- RBAC: permission keys + `<Can/>` / `usePermission`. No direct role checks in UI. Spec — [`docs/rbac.md`](docs/rbac.md).
- Server state — RTK Query only, never duplicated in Redux.
- Forms — `react-hook-form` + `zod`.
- UI: shadcn/ui + Tailwind tokens (`bg-card`, `text-foreground`). No inline styles, no hardcoded hex.
- **Design is sourced from the `Desktop/artkai/tower` project** (https://tower-artkai.netlify.app), but **code is written against this app's rules**. See [`docs/architecture.md`](docs/architecture.md).

## Workflow Rules — ALWAYS FOLLOW

1. **Read first.** Before any task — `.memory/MEMORY.md`, `.memory/task_routing.md`, then any `docs/*.md` listed by task_routing for this task type. Inside a module — `modules/<name>/CLAUDE.md` first.
2. **`yarn run check` is green.** After every code change run `yarn run check` (lint + typecheck + test). Red = not done.
3. **`check-docs-sync` is green.** After every code change run the [`check-docs-sync`](.claude/skills/check-docs-sync/SKILL.md) skill. **The task is NOT done until it reports `All docs/code in sync.`** Every flagged item is a blocker, not a suggestion.
4. **`docs/*` is the source of truth.** If a discrepancy is found between `docs/*` and `src/`, the code is wrong — fix the code. If the design genuinely changed, update the relevant `docs/*` FIRST, then the code follows.
5. **Walk the Docs sync policy table.** Any code change must update every `.md` listed in [`CONTRIBUTING.md → Docs sync policy`](CONTRIBUTING.md). Drift between code and docs = task incomplete.
6. **CHANGELOG.md is append-only.** Every PR adds one entry.
7. **Never autocommit / autopush.** `git commit` and `git push` happen only when the user explicitly asks for it. Completing a task is not consent to commit.

## Invariants — DO NOT BREAK

1. **Import boundaries.** `app → widgets → modules → shared`. Modules MUST NOT depend on each other at UI/runtime — only types via the barrel. Importing a module's internals (`@/modules/<name>/api/...`) is forbidden — only `@/modules/<name>` (barrel). Enforced by `eslint-plugin-boundaries`.
2. **Folder structure.** Do not rename or relocate `app/`, `widgets/`, `modules/`, `shared/`, `mocks/`, `test/`. Pages live INSIDE modules (`modules/<m>/pages/`), never in a global `src/pages/`.
3. **Aliases only.** `@/...` everywhere. Never `../../../`.
4. **Named exports** for components and utilities. **Default export ONLY** for pages under `React.lazy` (`modules/<m>/pages/**`) — enforced by `import/no-default-export` with overrides.
5. **Typing.** TS strict, `noUncheckedIndexedAccess: true`, no `any` (ESLint error). Domain types live in `modules/<m>/model/types.ts` and are exported via the barrel.
6. **No TS `enum`.** Domain string sets — `as const` object + literal union. Repeated value ≥2 times in one module OR appearing in API/DTO → extract. Toggles use `Record<T, T>` maps, not ternaries.
7. **Forms — `react-hook-form` + `zod` ONLY.** No `useState` for form fields. No HTML5 `required` instead of validation. No hand-written dirty tracking.
8. **Server state — RTK Query ONLY.** Never duplicated into Redux slices. Redux slices are reserved for `auth` and `ui` (theme, sidebar) only.
9. **RBAC via guards, not role compares.** `<Can permission="X">`, `usePermission("X")`, `<RequirePermission permission="X">`. NEVER `role === "admin"` or anything that reads the raw role array in UI.
10. **Tokens only.** Colors via `var(--color-*)` or Tailwind theme classes (`bg-card`, `text-foreground`). No hardcoded hex outside `src/index.css` token definitions. No inline `style={{}}` unless the value is genuinely dynamic (e.g. `--progress: ${pct}%`).
11. **File and function size.** File ≤300 lines (soft, split early), 400 lines is a hard ESLint error. Function ≤80 lines (warn).
12. **Multi-line object literals.** Any object literal containing a nested object, array, or function literal MUST be written multi-line — one property per line, trailing comma on every line. Flat scalar-only objects under 100 chars may stay inline. See [`docs/code-style.md` → Object literals](docs/code-style.md). Enforced by ESLint `object-curly-newline` + `object-property-newline`.
13. **Comments — WHY only.** Never describe WHAT the code does. No commented-out code (git remembers). TODOs use `// TODO(scope): description`.
14. **Module CLAUDE.md is required.** Every `src/modules/<name>/` MUST have a `CLAUDE.md` following [`docs/module-claude-template.md`](docs/module-claude-template.md), ≤200 lines. `check-docs-sync` Check 1 enforces this.
15. **Docs are the source of truth.** Never modify `docs/*` to retroactively match drifted code. Either fix the code, or change `docs/*` FIRST as a deliberate spec update (then bring code in line).

## Code style (short)

- See **Invariants** above for the hard rules.
- No single-letter variables in callbacks: `employees.map((employee) => …)`.
- Component file structure: imports → local types → local constants → component (hooks → derived → handlers → early return → render).
- Blank line between logical sections; no >1 consecutive blank line (ESLint).

Full rules — [`docs/code-style.md`](docs/code-style.md).

## Commands

```
yarn dev          # vite dev server
yarn build        # tsc -b && vite build
yarn lint         # eslint
yarn typecheck    # tsc -b --noEmit
yarn test         # vitest run
yarn run check    # lint + typecheck + test
```

## Where things live

| Topic                              | Doc                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| Code style (full)                  | [`docs/code-style.md`](docs/code-style.md)                                           |
| Architecture / layers / boundaries | [`docs/architecture.md`](docs/architecture.md)                                       |
| RBAC (roles, permissions, guards)  | [`docs/rbac.md`](docs/rbac.md)                                                       |
| Auth abstraction                   | [`docs/auth.md`](docs/auth.md)                                                       |
| Skills (`.claude/skills/*`)        | [`docs/skills.md`](docs/skills.md)                                                   |
| Module-level `CLAUDE.md` template  | [`docs/module-claude-template.md`](docs/module-claude-template.md)                   |
| Roadmap and phase scope            | [`docs/roadmap.md`](docs/roadmap.md)                                                 |
| Pre-PR checklist                   | [`.memory/invariants_checklist.md`](.memory/invariants_checklist.md)                 |
| Doc-sync verifier (skill)          | [`.claude/skills/check-docs-sync/SKILL.md`](.claude/skills/check-docs-sync/SKILL.md) |
| Bootstrap plan (archived)          | [`docs/history/bootstrap-plan.md`](docs/history/bootstrap-plan.md)                   |
