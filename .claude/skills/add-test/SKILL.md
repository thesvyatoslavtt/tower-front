---
name: add-test
description: Add a unit/component test (Vitest + Testing Library) or e2e test (Playwright). Picks the right kind and colocates the test file with the code.
---

# add-test

## Trigger

"write a test for X", "add test coverage for Y".

## Inputs

- Target file or behavior.
- Test kind: unit / component / e2e.

## Pre-flight

- [ ] Test layer chosen: hook/util → Vitest; component → Vitest + RTL; user flow → Playwright.
- [ ] `src/test/setup.ts` already wires `@testing-library/jest-dom`.

## Steps

1. **Unit/component:** create `*.test.tsx` colocated with the code.
2. Wrap rendered components in required providers (Store/Router/Auth). For shared/ui — no provider needed unless the component genuinely depends on one.
3. **E2E (later):** add under `e2e/`, use Playwright fixtures.

## Gotchas

_(populated after first real use)_

## Validation loop

1. `yarn run check` green (includes `vitest run`).
2. `check-docs-sync` green.

## Post-flight

- [ ] `yarn run check` green.
- [ ] `check-docs-sync` green.
- [ ] `CHANGELOG.md` entry added.
