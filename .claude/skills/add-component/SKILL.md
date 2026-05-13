---
name: add-component
description: Add a React component in the right layer (shared/ui vs modules/<m>/components vs widgets), following docs/code-style.md component file structure, named export, ≤300 lines.
---

# add-component

## Trigger

"add component X", "create component X".

## Inputs

- Component name (PascalCase).
- Target layer: `shared/ui` / `modules/<m>/components` / `widgets`.

## Pre-flight

- [ ] [`docs/code-style.md → Component file structure`](../../../docs/code-style.md) read.
- [ ] Layer choice justified ([`docs/architecture.md`](../../../docs/architecture.md) for layer semantics).
- [ ] If shared/ui — does NOT pull in RTK Query or store; fully controlled props.

## Steps

1. Create `<layer>/<Name>/<Name>.tsx` + `<layer>/<Name>/index.ts` re-exporting via barrel.
2. Follow strict component file structure: imports → local types → local constants → component (hooks → derived → handlers → early return → render).
3. Named export. Default export only if the file is a page.
4. Colors via Tailwind tokens or `var(--color-*)`. Use `cn()` from `@/shared/lib/utils`.

## Gotchas

_(populated after first real use)_

## Validation loop

1. `yarn run check` green (ESLint will catch boundary violations, `max-lines`, naming, etc.).
2. `check-docs-sync` green.

## Post-flight

- [ ] `yarn run check` green.
- [ ] `check-docs-sync` green.
- [ ] `CHANGELOG.md` entry added.
