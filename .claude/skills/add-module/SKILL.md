---
name: add-module
description: Scaffold a new business-domain module under src/modules/<name>/ — folders, barrel, permissions stub, module CLAUDE.md from docs/module-claude-template.md, and register it in the app.
---

# add-module

## Trigger

"create module X", "add module X", "scaffold a new domain X".

## Inputs

- Module name (kebab-case, singular noun: `people`, `finance`, `recruiting`).
- One-sentence purpose.

## Pre-flight

- [ ] `src/modules/<name>/` does NOT already exist.
- [ ] Name matches `^[a-z][a-z0-9-]*$`.
- [ ] [`docs/architecture.md`](../../../docs/architecture.md) modularity rules read.
- [ ] [`docs/module-claude-template.md`](../../../docs/module-claude-template.md) template read.

## Steps

1. Create folder tree: `src/modules/<name>/{api,model,components,hooks,pages}/` + `permissions.ts` + `index.ts`.
2. `index.ts` — empty barrel with TODO comment.
3. `permissions.ts` — empty `as const` object + derived `Permission` union (see [`docs/code-style.md → Domain string constants`](../../../docs/code-style.md)).
4. `CLAUDE.md` — copy from [`docs/module-claude-template.md`](../../../docs/module-claude-template.md), fill Purpose, ≤200 lines.
5. Register in `src/app/router.tsx` if the module ships any routes (lazy-import via barrel).
6. Update `.memory/MEMORY.md` (Topical docs index → add module CLAUDE.md reference).

## Gotchas

_(populated after first real use)_

## Validation loop

1. `yarn run check` — must be green.
2. Run [`check-docs-sync`](../check-docs-sync/SKILL.md) — must report `All docs/code in sync.`

## Post-flight

- [ ] `yarn run check` green.
- [ ] `check-docs-sync` green. **Task is NOT done otherwise.**
- [ ] `CHANGELOG.md` entry added.
