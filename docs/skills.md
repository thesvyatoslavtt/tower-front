# Skills for Agents

> **Authoritative spec.** If `.claude/skills/*` drifts from this document, the **skills** are wrong — fix them or update this spec FIRST. Agents MUST run [`check-docs-sync`](../.claude/skills/check-docs-sync/SKILL.md) before declaring a task done.

Skills are "recipes" by which factory agents perform routine tasks in Tower v2. Each skill = a folder under `.claude/skills/<name>/` with a `SKILL.md` (triggers, steps, checklists) and optionally `templates/`, `references/`, `scripts/`.

Cross-links: [`.claude/skills/README.md`](../.claude/skills/README.md), [../CONTRIBUTING.md](../CONTRIBUTING.md), [code style](./code-style.md), [module CLAUDE.md template](./module-claude-template.md).

## What a skill is

A folder `.claude/skills/<name>/` containing:

- `SKILL.md` — required. Frontmatter (`name`, `description`) + sections: Trigger / Inputs / Pre-flight / Steps / Gotchas / Templates / Validation loop / Post-flight.
- `templates/` — optional. Boilerplate files the skill copies and parameterises.
- `references/` — optional. Long-form explanations the agent loads on demand.
- `scripts/` — optional. Small shell/node scripts the skill invokes when it would otherwise re-implement boilerplate logic.

## MVP skills (Tier 1 + Tier 2)

| Skill                  | Trigger                                                 | What it does                                                                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`add-module`**       | "create module X"                                       | Scaffolds `modules/<name>/{api,model,components,hooks,pages}/`, `index.ts`, `permissions.ts`, module's `CLAUDE.md` from a template (≤200 lines). Registers the module in `app/store.ts` and `app/router.tsx`.                         |
| **`add-page`**         | "add page X to module Y"                                | Creates `modules/<Y>/pages/<X>/`, `<X>.tsx` (default export for `React.lazy`), registers the route with `<RequirePermission>`, updates the Routes section in the module's `CLAUDE.md`.                                                |
| **`add-rtk-endpoint`** | "add endpoint X to module Y"                            | Extends `modules/<Y>/api/<y>Api.ts` via `injectEndpoints`. Adds the DTO + zod schema to `model/types.ts`. Correctly sets `providesTags`/`invalidatesTags`. In parallel, adds an MSW handler in `mocks/handlers/<y>.ts` and a fixture. |
| **`add-permission`**   | "add permission X" / "give role Y access to Z"          | Adds the key to `modules/<m>/permissions.ts` (or `shared/config/permissions.ts` for global ones), updates the `Role → Permission[]` matrix, `docs/rbac.md`, the module's `CLAUDE.md`, adds a test for `usePermission`.                |
| **`add-component`**    | "add component X"                                       | Creates `<X>.tsx` (named export) + `index.ts` in the correct folder (`shared/ui` vs `modules/<m>/components` vs `widgets`), following the strict component structure template. Runs the file-size rule.                               |
| **`add-widget`**       | "add widget X"                                          | Creates `widgets/<X>/`, verifies that the widget does not pull UI from modules (only types and permission keys), adds it to `widgets/index.ts`.                                                                                       |
| **`add-form`**         | "add form X"                                            | Scaffolds a form on `react-hook-form` + `zod` resolver, uses wrappers from `shared/ui/form/*`, with the DTO alongside, type via `z.infer`. Handles loading/error states via RTK Query mutation.                                       |
| **`add-table`**        | "add table X"                                           | Template on shadcn Table + sorting/filter/pagination, integration with an RTK Query query, skeleton state, empty state, RBAC-driven column filtering via `<Can/>`.                                                                    |
| **`add-msw-handler`**  | "mock endpoint X"                                       | Creates a handler + fixture in `mocks/`, ensures types match the module's DTO, registers it in `mocks/handlers/index.ts`.                                                                                                             |
| **`add-test`**         | "write a test for X"                                    | Picks a test type (Vitest for hooks/utilities, RTL for components, Playwright for e2e), creates a `*.test.tsx` alongside, uses test providers (Store/Router/Auth).                                                                    |
| **`split-large-file`** | "split file X" / automatically on a `max-lines` warning | Analyzes the file, extracts subcomponents / hooks / configs into adjacent files following the rules from CLAUDE.md.                                                                                                                   |

## Tier 3 (added later)

`update-memory`, `pre-pr-check`, `review-pr`, `add-role` — operational and housekeeping skills. We create them once we have a live PR flow and more than one role wired through SSO.

## Skill principles

- **One skill = one operation.** No "universal" skills that do everything.
- **Every skill must update the module's `CLAUDE.md` and `MEMORY.md`** if it touches anything reflected in them (Public API, Routes, Permissions, Data flow).
- **Post-flight always includes `yarn run check`** (lint + typecheck + test). A skill is not considered done until the check is green.
- **Templates (`templates/`) keep boilerplate separate from instructions** — this yields deterministic results across different agents.

## Methodology — extract from hands-on tasks

We write skills **not ahead of time**, but **while it's fresh from real work** (Anthropic recommendation: "Extract from a hands-on task").

1. **Bootstrap proceeds without skills.** First we set up Vite, configs, the .md skeleton, the RBAC core.
2. On the first real application of a pattern (e.g. "create module people") — we write the first version of the skill while it's fresh.
3. Apply the skill to the next task of the same type → collect gotchas → iterate to v2.
4. After 3–5 applications, the skill stabilizes.

Iteration happens through the `Gotchas` section — every manual fix during agent review becomes a Gotcha in the responsible skill.

## `SKILL.md` template

```markdown
---
name: <skill-name>
description: <a single sentence for auto-triggering. Should contain the user's key phrases.>
---

## Trigger

Phrases that activate the skill.

## Inputs

What parameters are needed (module name, entity name, permission keys).

## Pre-flight checklist

- [ ] Module/file does not exist
- [ ] Name is in the correct case
- [ ] Dependencies installed

## Steps

1. Create `…` from the `templates/…` template
2. Register in `…`
3. Update `…`

## Gotchas ← required section

Concrete project-specific "gotchas" that the agent will get wrong
without explicit guidance. Updated after each real application.
Example:

- When adding an endpoint, always update `mocks/handlers/index.ts`,
  otherwise MSW won't pick up the handler.
- `providesTags` for a list endpoint must include `{ type: "X", id: "LIST" }`,
  otherwise a POST mutation will not invalidate the list.

## Templates / Scripts

Links to `templates/*.tsx`, `scripts/*.sh` inside the skill folder.

## Validation loop

What to run and what to do if it fails:

1. `yarn run check`
2. If ESLint fails on boundaries — check the imports, they must not bypass the barrel
3. If typecheck fails — verify that the DTO in `model/types.ts` matches the one in the MSW handler

## Post-flight checklist

- [ ] `yarn run check` is green
- [ ] Module's `CLAUDE.md` is updated (if Public API/Routes/Permissions were touched)
- [ ] `MEMORY.md` index is updated if a new file was added
- [ ] CHANGELOG.md is updated
```

## Best practices we adopt (agentskills.io)

- **SKILL.md ≤ 500 lines / 5000 tokens.** Our target is ≤200 lines so as not to bloat the agent's context.
- **Progressive disclosure.** Large content lives in `references/<topic>.md` next to the skill, with an explicit "Read references/X.md when …" — not "see references/ for details".
- **Add what the agent lacks, omit what it knows.** We don't explain what React/RTK Query is — only our project-specific rules and pitfalls.
- **Defaults, not menus.** One path is chosen (shadcn, RTK Query, react-hook-form, zod). Alternatives are mentioned only as an escape hatch.
- **Procedures, not declarations.** A skill teaches **how to approach** a class of tasks, not a finished answer for a single case.
- **Match specificity to fragility.** Prescriptive steps where order and format matter (RTK tags, route registration, RBAC guards); freedom where variations are acceptable (card markup).
- **Coherent unit.** `add-rtk-endpoint` includes creation of the MSW handler and fixture — this is one logical task, not three. A separate `add-msw-handler` is kept only for mocking external APIs without RTK.
- **Gotchas-driven iteration.** Every time we fix the agent manually, that fix goes into the `Gotchas` of the corresponding skill. This is the main way skills improve.
- **Bundled scripts.** When the agent reinvents the same logic across runs (validating a module name, generating a barrel) — we factor it out into `scripts/` inside the skill folder.

## What we check before merging a new skill

- `description` in the frontmatter — a short sentence with the user's key phrases. We test on several wordings that the agent actually picks up the skill.
- The skill does not duplicate what's already in `CLAUDE.md` / `CONTRIBUTING.md` — those hold general rules; the skill only holds the specifics of a particular operation.
