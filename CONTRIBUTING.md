# Contributing — Tower v2

Recipes for common tasks. Details — `.claude/skills/<name>/SKILL.md`.

## Base rules

- Before a PR: `yarn run check` is green.
- CHANGELOG.md — one entry per PR.
- File > 300 lines — split it (hard cap 400, ESLint error).
- You've walked through the **Docs sync policy** table below — every affected `.md` is updated.
- See [CLAUDE.md](CLAUDE.md), [docs/architecture.md](docs/architecture.md), [docs/code-style.md](docs/code-style.md).

## Docs sync policy

**This project is agent-driven.** The hard gate is the [`check-docs-sync`](.claude/skills/check-docs-sync/SKILL.md) skill — agents MUST run it after every code change and the task is NOT done until it reports `All docs/code in sync.` The table below is the lookup the skill uses; walk it manually when planning, run the skill to verify.

**`docs/*` is the authoritative spec.** If code drifts from `docs/*`, the **code** is wrong. Either fix the code or update `docs/*` FIRST (deliberate spec change), then the code follows.

| Code change                                               | Must update                                                                                                                |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| New/changed export in `modules/<m>/index.ts` (Public API) | `modules/<m>/CLAUDE.md` (Public API section), `CHANGELOG.md`                                                               |
| New route or guard change                                 | `modules/<m>/CLAUDE.md` (Routes); `docs/architecture.md` — if a new routing pattern; `CHANGELOG.md`                        |
| New/changed permission key                                | `modules/<m>/permissions.ts`, `modules/<m>/CLAUDE.md` (Permissions), `docs/rbac.md`, `CHANGELOG.md`                        |
| New RTK endpoint / DTO                                    | `modules/<m>/CLAUDE.md` (Data flow), `CHANGELOG.md`                                                                        |
| Data flow / architectural pattern change                  | `docs/architecture.md`, `.memory/project_core.md`, `CHANGELOG.md`                                                          |
| New/changed dependency in `package.json`                  | `.memory/project_core.md` (Stack); `README.md` — if it affects quickstart/commands; `CHANGELOG.md`                         |
| New ESLint / code style rule                              | `docs/code-style.md`, `CLAUDE.md` (short summary), `.memory/invariants_checklist.md`, `CHANGELOG.md`                       |
| New skill / change to an existing one                     | `.claude/skills/<name>/SKILL.md`, `docs/skills.md`, `CONTRIBUTING.md` (recipes), `.memory/task_routing.md`, `CHANGELOG.md` |
| New phase milestone hit / roadmap shift                   | `docs/roadmap.md`, `CHANGELOG.md`                                                                                          |
| New `CLAUDE.md` (layer or module)                         | `.memory/MEMORY.md` (index), `CHANGELOG.md`                                                                                |
| New file in `.memory/`                                    | `.memory/MEMORY.md` (index)                                                                                                |
| New domain term                                           | `.memory/glossary.md`                                                                                                      |
| New MSW handler / fixture                                 | `src/mocks/CLAUDE.md` (once it exists), `CHANGELOG.md`                                                                     |

**Enforcement:** the [`check-docs-sync`](.claude/skills/check-docs-sync/SKILL.md) skill is the hard gate. Run it after every code change; treat any flagged item as a blocker. There is no pre-commit hook for doc-sync because the project is agent-driven and bash hooks don't fire for agents.

## Recipes (stubs — filled in after the first real application, see [docs/skills.md](docs/skills.md) → "Methodology")

### Add a module

Skill `add-module`. See `.claude/skills/add-module/SKILL.md`.

### Add a page

Skill `add-page`.

### Add an RTK endpoint

Skill `add-rtk-endpoint`. Don't forget `providesTags` / `invalidatesTags` and an MSW handler.

### Add a permission

Skill `add-permission`. Update `modules/<m>/permissions.ts` and `docs/rbac.md`.

### Add a component / widget / form / table / MSW handler / test

Skills `add-component`, `add-widget`, `add-form`, `add-table`, `add-msw-handler`, `add-test`.

### Split a large file

Skill `split-large-file`.

## Design source

Visuals are sourced from `Desktop/artkai/tower` (https://tower-artkai.netlify.app). When working on a page or component — link to the reference screen in the PR description.
