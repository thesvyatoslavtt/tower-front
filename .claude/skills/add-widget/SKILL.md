---
name: add-widget
description: Add a cross-module widget under src/widgets/<Name>/. Widgets are thin compositions — they read module types and permission keys, never module UI or runtime.
---

# add-widget

## Trigger

"add widget X".

## Inputs

- Widget name (PascalCase).
- Which layers/modules it stitches.

## Pre-flight

- [ ] [`src/widgets/CLAUDE.md`](../../../src/widgets/CLAUDE.md) read.
- [ ] Widget will not import module UI components — only types and permission keys.
- [ ] Widget is genuinely cross-module; otherwise it lives in `modules/<m>/components` or `shared/ui`.

## Steps

1. Create `src/widgets/<Name>/<Name>.tsx` + `index.ts` barrel.
2. Import only from `@/shared/*`, `@/modules/<name>` (types/permission keys), `@/app/*` (typed hooks).
3. Update `src/widgets/CLAUDE.md` content list if the widget is significant.

## Gotchas

- ESLint `boundaries/element-types` will block UI imports from modules — design the widget to never need them.

## Validation loop

1. `yarn run check` green.
2. `check-docs-sync` green.

## Post-flight

- [ ] `yarn run check` green.
- [ ] `check-docs-sync` green.
- [ ] `CHANGELOG.md` entry added.
