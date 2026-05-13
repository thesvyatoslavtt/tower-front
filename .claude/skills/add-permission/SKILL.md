---
name: add-permission
description: Declare a new permission key in the right place (module permissions.ts or shared/config/permissions.ts), update the Role→Permission matrix, and reflect it in docs/rbac.md and the module CLAUDE.md.
---

# add-permission

## Trigger

"add permission X", "give role Y access to Z".

## Inputs

- Permission key in `dot.case` namespace (e.g. `employees.viewSalary`).
- Owning module (or `shared` if cross-module).
- Roles that get it.

## Pre-flight

- [ ] [`docs/rbac.md`](../../../docs/rbac.md) read.
- [ ] Key follows `<scope>.<action>` naming.

## Steps

1. Add the key to `src/modules/<m>/permissions.ts` (or `src/shared/config/permissions.ts` for cross-module).
2. Update the `Role → Permission[]` matrix in `src/shared/config/rolePermissions.ts`.
3. Update `src/modules/<m>/CLAUDE.md → Permissions` section.
4. Update [`docs/rbac.md`](../../../docs/rbac.md) if the change touches model-level semantics.
5. Add or extend a unit test on `usePermission` covering the new key for at least one role.

## Gotchas

- Orphan permissions (declared but never used) are flagged by `check-docs-sync` Check 2 — either use the key in UI or remove it.

## Validation loop

1. `yarn run check` green.
2. `check-docs-sync` green — Check 2 enforces declared ↔ used parity.

## Post-flight

- [ ] `yarn run check` green.
- [ ] `check-docs-sync` green.
- [ ] `CHANGELOG.md` entry added.
