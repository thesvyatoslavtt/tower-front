# Module-Level `CLAUDE.md` Template

> **Authoritative spec.** Every `modules/<name>/CLAUDE.md` MUST conform to this template. Agents MUST run [`check-docs-sync`](../.claude/skills/check-docs-sync/SKILL.md) before declaring a task done — Check 1 enforces this.

Every module under `src/modules/<name>/` must have its own `CLAUDE.md`, ≤200 lines, copied from the template below. It's the FIRST doc an agent reads when working inside the module — earlier than the global [../CLAUDE.md](../CLAUDE.md) or `docs/*`.

Cross-links: [architecture](./architecture.md), [code style](./code-style.md), [RBAC](./rbac.md), [skills](./skills.md).

## Required location

```
modules/people/
├── CLAUDE.md       # ← required, ≤200 lines
├── api/
├── model/
├── components/
├── hooks/
├── pages/
├── permissions.ts
└── index.ts
```

## Template

```markdown
# Module: <name>

## Purpose

1–2 sentences: which business domain the module owns.

## Public API (what index.ts exports)

- Components: `EmployeeCard`, `EmployeeStatusBadge`
- Hooks: `useCurrentUser`, `useEmployees`
- Types: `Employee`, `EmployeeStatus`
- Pages (for the router): `PeopleDirectoryPage`, `EmployeeDetailPage`

## Permissions declared by the module

- `employees.view` — view the list
- `employees.viewSalary` — sees the Salary column
- (full list + default roles — in `./permissions.ts`)

## Routes

- `/people` → `PeopleDirectoryPage` (requires `employees.view`)
- `/people/:id` → `EmployeeDetailPage` (requires `employees.view`)

## Data flow

- API: RTK Query (`peopleApi`), tags `Employee` / `Employee-LIST`.
- Source of truth is the backend; local state is for UI filters only.
- No duplication of server state in Redux.

## Dependencies

- shared/ui, shared/lib/rbac
- modules/auth → types only (`Role`, `CurrentUser`)
- Does NOT depend on other modules via UI/runtime

## What's inside (map)

- `api/peopleApi.ts` — endpoints
- `model/types.ts` — DTO + zod schemas
- `components/` — domain components (≤300 lines each)
- `hooks/` — module hooks
- `pages/PeopleDirectoryPage/` — list
- `pages/EmployeeDetailPage/` — detail + `tabs/`

## Local rules (if any)

- Salary-related UI is always wrapped in `<Can permission="employees.viewSalary">`.
- Former employees are shown in a separate collapsible section.

## Open TODOs / known limitations

- Search is currently client-side — will move to server-side once the backend is connected.
```

## Analogous `CLAUDE.md` is required for

- `src/shared/CLAUDE.md` — what lives in `shared`, rules for adding to it. _(exists)_
- `src/widgets/CLAUDE.md` — what counts as a widget, when to extract one. _(exists)_
- `src/app/CLAUDE.md` — providers, initialization order, the router. _(exists)_
- `src/mocks/CLAUDE.md` — how to add handlers and fixtures. _(added with MSW bootstrap; see [roadmap](./roadmap.md))_

## The 200-line cap

The 200-line limit is **intentional**: if a module's `CLAUDE.md` outgrows it, split into sub-documents under `docs/` (e.g. `docs/people-onboarding.md`) and link from the module's `CLAUDE.md`. This keeps the agent's context compact and ensures the first file the agent reads stays scannable.
