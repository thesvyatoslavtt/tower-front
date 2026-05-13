---
name: add-form
description: Add a form using react-hook-form + zod. No useState for fields, no HTML5 required. Wrappers from shared/ui/form/*. DTO colocated with the zod schema, type via z.infer.
---

# add-form

## Trigger

"add form X", "create form for Y".

## Inputs

- Form purpose and target endpoint (RTK mutation).
- Field shape (will become the zod schema).

## Pre-flight

- [ ] [`docs/code-style.md → Forms`](../../../docs/code-style.md) read.
- [ ] Target RTK mutation exists (or add it first via `add-rtk-endpoint`).

## Steps

1. Define zod schema next to the component (or in `modules/<m>/model/types.ts` if shared).
2. `type FormValues = z.infer<typeof schema>`.
3. `useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: ... })`.
4. Use `Controller` (or RHF-friendly wrappers from `shared/ui/form/*`) for inputs — NEVER plain `useState`.
5. Wire submit to the RTK mutation; handle `isLoading` and `error` via mutation state.

## Gotchas

- ALL forms must use RHF + zod (Invariant 7). Manual `useState` for fields is a blocker.

## Validation loop

1. `yarn run check` green.
2. `check-docs-sync` green.

## Post-flight

- [ ] `yarn run check` green.
- [ ] `check-docs-sync` green.
- [ ] `CHANGELOG.md` entry added.
