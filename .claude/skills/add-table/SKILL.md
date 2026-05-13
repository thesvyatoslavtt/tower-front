---
name: add-table
description: Add a data table built on shadcn Table + RTK Query, with skeleton/empty/error states and RBAC-filtered columns via <Can/>.
---

# add-table

## Trigger

"add table X", "list view for Y".

## Inputs

- Module + entity.
- Columns (label, accessor, optional permission gate).

## Pre-flight

- [ ] RTK Query list endpoint exists (or add it first via `add-rtk-endpoint`).
- [ ] [`docs/code-style.md → Styling`](../../../docs/code-style.md) read for token usage.

## Steps

1. Use shadcn `Table` primitives from `shared/ui`.
2. Wire data with the RTK query hook; use `isLoading` for `Skeleton`, `isError` for error state, `data.length === 0` for empty state.
3. Permission-gated columns wrapped in `<Can permission="...">`.
4. Sorting/filtering/pagination — client-side initially, server-side when the endpoint supports it (set `refetchOnMountOrArgChange: true`).

## Gotchas

_(populated after first real use)_

## Validation loop

1. `yarn run check` green.
2. `check-docs-sync` green.

## Post-flight

- [ ] `yarn run check` green.
- [ ] `check-docs-sync` green.
- [ ] `CHANGELOG.md` entry added.
