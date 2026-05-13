---
name: split-large-file
description: Split a file that exceeds 300 lines (warn) or 400 lines (ESLint error) per docs/code-style.md. Extract subcomponents into sibling files, heavy handlers into hooks, configs into *.config.ts.
---

# split-large-file

## Trigger

"split file X", or automatically when `max-lines` warns/errors.

## Inputs

- File path.

## Pre-flight

- [ ] [`docs/code-style.md → File and function size`](../../../docs/code-style.md) read.
- [ ] The file is genuinely too large (not a fixture/snapshot that justifies the size).

## Steps

1. Identify subcomponents → extract each into `<Folder>/<Sub>.tsx` next to the parent.
2. Extract heavy handlers into `useFooActions.ts` hooks.
3. Extract constants/config into `Foo.config.ts`.
4. Keep parent file as a layout that composes the extracted pieces.
5. Re-export only through the barrel that already exposes this file.

## Gotchas

- ESLint `max-lines` is an error at 400 lines — the build will fail before split is done. Land split in the same commit as the addition that pushed past the limit.

## Validation loop

1. `yarn run check` green.
2. `check-docs-sync` green.

## Post-flight

- [ ] `yarn run check` green.
- [ ] `check-docs-sync` green.
- [ ] No behavioral changes (refactor only).
- [ ] `CHANGELOG.md` entry added.
