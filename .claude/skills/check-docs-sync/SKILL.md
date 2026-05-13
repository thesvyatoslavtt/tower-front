---
name: check-docs-sync
description: Verify that docs/* (the authoritative spec) matches the implementation in src/, .memory/, modules' CLAUDE.md, and eslint.config.js. Blocking gate — task is not done until this skill reports "All docs/code in sync."
---

# Check Docs/Code Sync

Verify that `docs/*` (the **authoritative specification**) matches the actual code, configuration, and meta-docs.

**IMPORTANT:** `docs/*` is the source of truth. If a discrepancy is found, the **CODE / lower-tier doc must be updated to match `docs/*`**, not the other way around. If the design genuinely changed, the change goes into `docs/*` FIRST, then the code follows.

The task is not complete until this skill reports `All docs/code in sync.` Any failure listed below is a blocker.

## When to run

- After completing any code change in `src/`.
- After modifying `eslint.config.js`, `package.json`, or any `docs/*.md`.
- Before declaring an agent task done.
- Before opening a PR.

## Inputs

None. The skill operates on the current working tree.

## Pre-flight

- [ ] Working tree exists (we are inside the repo root).
- [ ] `yarn run check` is green (lint + typecheck + test). If not — fix that first; this skill only runs against a clean baseline.

## Checks

Run all six checks. For each finding, output a concrete `Fix:` action.

### Check 1 — Modules ↔ `modules/<name>/CLAUDE.md`

For every directory in `src/modules/*`:

1. A `CLAUDE.md` MUST exist following [`docs/module-claude-template.md`](../../../docs/module-claude-template.md). Hard cap: ≤200 lines.
2. The `Public API` section MUST list every export from `src/modules/<name>/index.ts`. No extras, no missing.
3. The `Permissions` section MUST list every key from `src/modules/<name>/permissions.ts`.
4. The `Routes` section MUST list every route the module registers in `src/app/router.tsx`.
5. The `Data flow` section MUST mention every RTK endpoint declared in `src/modules/<name>/api/*Api.ts` and every tag they read/write.
6. Open TODOs section MUST NOT reference `PLAN.md` (use [`docs/roadmap.md`](../../../docs/roadmap.md)).

`Fix:` Edit `src/modules/<name>/CLAUDE.md`. If the module just got a new export/route/permission/endpoint and the doc is stale, update the doc. If the code shipped something the spec did not call for, revert or re-spec in `docs/*` first.

### Check 2 — RBAC (`docs/rbac.md`)

1. Every `<Can permission="X">`, `usePermission("X")`, `<RequirePermission permission="X">` in `src/` uses a permission key X that exists in either `src/shared/config/permissions.ts` or some `src/modules/<m>/permissions.ts`.
2. Every key declared in `permissions.ts` files is either used in `src/` OR mentioned in `docs/rbac.md` (otherwise → orphan, flag).
3. The `Role` and `Permission` type shape in `src/shared/types/rbac.ts` (once it exists) matches the model section of `docs/rbac.md`.

`Fix:` Add missing keys, remove orphans, or update `docs/rbac.md` if a new key was approved.

### Check 3 — Routes (`app/router.tsx` ↔ module CLAUDE.md ↔ `docs/roadmap.md`)

1. Every route registered in `src/app/router.tsx` is documented in the owning module's `CLAUDE.md → Routes` section.
2. Every route guard (`<RequirePermission>`) references a permission key that passes Check 2.
3. Routes for features marked "shipped" in `docs/roadmap.md` actually exist in `router.tsx`. Routes marked "phase 1 not done" do NOT exist in `router.tsx` (or are placeholders that explicitly say "TODO roadmap step N").

`Fix:` Add the route to the module CLAUDE.md, register the route, or update the roadmap.

### Check 4 — Code style ↔ ESLint (`docs/code-style.md` ↔ `eslint.config.js`)

1. Every rule listed in `docs/code-style.md → ESLint enforcement` table has a matching key in `eslint.config.js → rules`. No rule listed that isn't enforced.
2. Every rule active in `eslint.config.js` (non-trivial — i.e. not from `recommended` presets) is mentioned in `docs/code-style.md`.
3. The hard limits in `docs/code-style.md` (e.g. `max-lines: 400 error`, `max-lines-per-function: 80 warn`) match the actual ESLint config values.
4. Grep `src/` for `enum ` declarations — if any exist (other than in a comment / string), this is a Domain-string-constants violation. The rule says: use `as const` + literal union. Flag.
5. Grep `src/` for hardcoded hex colors (`#[0-9a-fA-F]{3,8}`) inside `.tsx` / `.css` (excluding `index.css` token definitions). Flag any.

`Fix:` Reconcile rules in code-style doc with eslint.config.js; fix offending code.

### Check 5 — Memory index (`.memory/MEMORY.md`)

1. Every `.md` file under `.memory/` (except `MEMORY.md` itself) is listed in `.memory/MEMORY.md`.
2. Every `.md` file under `docs/` is listed in `.memory/MEMORY.md → Topical docs index`.
3. Every layer with a sub-`CLAUDE.md` (`src/app/`, `src/shared/`, `src/widgets/`, future `src/mocks/`, each `src/modules/*/`) is mentioned somewhere in `.memory/*` (either MEMORY.md index or task_routing.md).
4. Each `.memory/*.md` entry is ≤150 characters.

`Fix:` Add the entry, or shorten the description.

### Check 6 — Stack ↔ `package.json` (`.memory/project_core.md`)

1. Every "notable" dependency in `package.json` (anything we wrote about in our docs — React, Vite, Tailwind, Redux Toolkit, RTK Query, React Router, MSW, RHF, zod, Vitest, ESLint, Playwright when added) is reflected in `.memory/project_core.md → Stack`.
2. Major version mentioned in the doc matches `package.json` (e.g. doc says "Vite 7" → `package.json` has `"vite": "^7.x.x"`).

`Fix:` Update `.memory/project_core.md`.

## Output format

Print a Markdown report to the user. Mark each check pass/fail with `[x]` / `[ ]`. For every fail, write a precise `Fix:` line with file path and (where relevant) line number.

```
## Docs/Code Sync Report

### Check 1 — Modules
- [x] src/modules/people — CLAUDE.md present, Public API matches index.ts, Routes match router.tsx
- [ ] src/modules/auth — CLAUDE.md missing `getCurrentUser` from Public API; index.ts exports it
  Fix: src/modules/auth/CLAUDE.md → add `useCurrentUser` to Public API section

### Check 2 — RBAC
- [x] All used permission keys declared
- [ ] `employees.viewSalary` declared in src/modules/people/permissions.ts but never used in src/
  Fix: either use it (e.g. wrap SalaryEditor in <Can>) or remove from permissions.ts and docs/rbac.md

### Check 3 — Routes
- [x] All routes in src/app/router.tsx documented

### Check 4 — Code style ↔ ESLint
- [x] All rules listed in docs/code-style.md present in eslint.config.js
- [ ] `enum` found in src/modules/people/model/types.ts:18 — Domain-string-constants violation
  Fix: replace `enum EmployeeStatus { ... }` with `as const` object + literal union per docs/code-style.md

### Check 5 — Memory index
- [x] All .memory/*.md and docs/*.md listed in MEMORY.md

### Check 6 — Stack ↔ package.json
- [x] Stack section in .memory/project_core.md matches package.json

### Actions required
1. Edit src/modules/auth/CLAUDE.md — add useCurrentUser to Public API.
2. Replace enum in src/modules/people/model/types.ts:18 with `as const` + literal union.
3. Decide on employees.viewSalary (use it or remove).
```

If every check passes:

```
## Docs/Code Sync Report

All docs/code in sync.
```

## Gotchas

- Do not lower the bar to make the check pass. Missing doc → add the doc. Orphan permission → use it or drop it. Don't "soften" the spec to match the implementation.
- "Notable" in Check 6 means "anything mentioned in our docs". Don't list every transitive dependency.
- `docs/history/bootstrap-plan.md` is archived — do not include it in cross-references except where explicitly historical.
- Sub-`CLAUDE.md` files at layer level (`src/app/CLAUDE.md`, `src/shared/CLAUDE.md`, `src/widgets/CLAUDE.md`) follow a similar template but are NOT required to enumerate Public API the same way modules do.

## Templates / Scripts

None yet. Future iteration may add `scripts/check-docs-sync.ts` to automate parts of Check 1, Check 4, and Check 5. For now this is a procedural skill the agent executes by reading files.

## Validation loop

1. After running the checks, if **any** failed → produce the report and stop. Do not declare the parent task done.
2. The agent (or user) addresses every `Fix:` action.
3. Re-run `check-docs-sync`.
4. Repeat until the report reads `All docs/code in sync.`

## Post-flight

- [ ] Report printed.
- [ ] If all green — parent task may proceed to completion.
- [ ] If anything red — parent task is BLOCKED until red items are resolved.
