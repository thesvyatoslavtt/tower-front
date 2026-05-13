---
name: add-page
description: Add a new page to an existing module — file under modules/<m>/pages/<PageName>/, default export for React.lazy, route registered in app/router.tsx with the right RBAC guard, Routes section of module CLAUDE.md updated.
---

# add-page

## Trigger

"add page X to module Y", "create page X".

## Inputs

- Module name (already exists).
- Page name (PascalCase, ending in `Page`: `PeopleDirectoryPage`).
- Route path.
- Required permission key (must exist in the module's `permissions.ts`).

## Pre-flight

- [ ] Module `src/modules/<m>/` exists.
- [ ] Permission key is declared in `src/modules/<m>/permissions.ts` (or [`docs/rbac.md`](../../../docs/rbac.md)).
- [ ] [`docs/architecture.md → Routing`](../../../docs/architecture.md) read.
- [ ] Tower reference checked (https://tower-artkai.netlify.app) — visual and behavior.

## Steps

1. Create `src/modules/<m>/pages/<PageName>/<PageName>.tsx` with **default export**.
2. `index.ts` in the page folder re-exports it for the module barrel.
3. Register lazy route in `src/app/router.tsx`, wrapped in `<RequirePermission permission="...">` if guarded.
4. Update `src/modules/<m>/CLAUDE.md → Routes` and `Public API` (if exposing the page).
5. Update [`docs/roadmap.md`](../../../docs/roadmap.md) if this closes a roadmap step.

## Gotchas

_(populated after first real use)_

## Validation loop

1. `yarn run check` green.
2. `check-docs-sync` green — Check 3 (routes) will fail until module CLAUDE.md Routes section is updated.

## Post-flight

- [ ] `yarn run check` green.
- [ ] `check-docs-sync` green.
- [ ] Tower reference URL in PR description.
- [ ] `CHANGELOG.md` entry added.
