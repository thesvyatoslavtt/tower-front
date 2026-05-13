---
name: add-rtk-endpoint
description: Add a new RTK Query endpoint to a module's api/, with DTO + zod schema, correct providesTags/invalidatesTags, paired MSW handler and fixture, and module CLAUDE.md Data flow section updated.
---

# add-rtk-endpoint

## Trigger

"add endpoint X to module Y", "add RTK query/mutation for X".

## Inputs

- Module name.
- Endpoint name (`getEmployees`, `createEmployee`).
- HTTP method + URL.
- Tag (typically the module's entity name + optional `LIST`).
- DTO shape.

## Pre-flight

- [ ] Module exists.
- [ ] [`docs/code-style.md → API layer`](../../../docs/code-style.md) read.
- [ ] `src/shared/api/baseApi.ts` already declares the relevant `tagTypes`.

## Steps

1. Add DTO + zod schema in `src/modules/<m>/model/types.ts`. Type via `z.infer`.
2. Extend `src/modules/<m>/api/<m>Api.ts` via `injectEndpoints` (do NOT create a separate api slice).
3. Tag correctly: typed `type: "Entity" as const`. For list queries that change often → `refetchOnMountOrArgChange: true`.
4. Add MSW handler in `src/mocks/handlers/<m>.ts` returning the same DTO; register in `src/mocks/handlers/index.ts`.
5. Add a fixture in `src/mocks/fixtures/<m>.ts` if needed.
6. Update `src/modules/<m>/CLAUDE.md → Data flow`.

## Gotchas

- A list endpoint's `providesTags` MUST include `{ type, id: "LIST" }`, otherwise a POST mutation will not invalidate the list.
- New tags MUST be added to `baseApi.tagTypes`, otherwise RTK Query logs a warning.

## Validation loop

1. `yarn run check` green (typecheck catches DTO drift between handler and consumer).
2. `check-docs-sync` green — Check 1 (modules) verifies the Data flow doc lists this endpoint.

## Post-flight

- [ ] `yarn run check` green.
- [ ] `check-docs-sync` green.
- [ ] `CHANGELOG.md` entry added.
