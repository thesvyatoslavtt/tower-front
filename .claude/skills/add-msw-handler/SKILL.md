---
name: add-msw-handler
description: Add or extend an MSW handler for an external API not owned by a module's RTK endpoint. For module endpoints, the handler is created by add-rtk-endpoint instead.
---

# add-msw-handler

## Trigger

"mock endpoint X", "add MSW handler for X" (when X is NOT part of an RTK module endpoint).

## Inputs

- URL and HTTP method.
- Response shape.

## Pre-flight

- [ ] Confirm this is not already covered by `add-rtk-endpoint` (preferred when the endpoint belongs to a module).
- [ ] `src/mocks/CLAUDE.md` read (once it exists).

## Steps

1. Add handler to `src/mocks/handlers/<topic>.ts`.
2. Register in `src/mocks/handlers/index.ts`.
3. Add fixture in `src/mocks/fixtures/` if response needs sample data.

## Gotchas

- Forgetting to register the handler in `index.ts` silently drops it. Always re-export.

## Validation loop

1. `yarn run check` green.
2. `check-docs-sync` green.

## Post-flight

- [ ] `yarn run check` green.
- [ ] `check-docs-sync` green.
- [ ] `CHANGELOG.md` entry added.
