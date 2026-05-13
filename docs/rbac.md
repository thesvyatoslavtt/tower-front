# RBAC: Roles and Permissions

> **Authoritative spec.** If `src/` drifts from this document, the **code** is wrong — fix the code or update this spec FIRST (then the code). Agents MUST run [`check-docs-sync`](../.claude/skills/check-docs-sync/SKILL.md) before declaring a task done.

Role-based access control in Tower v2. Permissions are namespaced strings, computed on the client from roles, and used in the UI via `<Can/>`, `usePermission`, and `<RequirePermission/>`.

Cross-links: [auth](./auth.md), [architecture](./architecture.md), [code style](./code-style.md), [`.claude/skills/add-permission/SKILL.md`](../.claude/skills/add-permission/SKILL.md).

## Model

```ts
// src/shared/types/rbac.ts
export type Role =
  | "super_admin"
  | "exec"
  | "hr"
  | "recruiter"
  | "finance"
  | "pm"
  | "delivery_lead"
  | "employee";

export type Permission =
  | "employees.view"
  | "employees.viewAll"
  | "employees.edit"
  | "employees.viewSalary"
  | "employees.editSalary"
  | "employees.viewSensitive"
  | "projects.view"
  | "projects.edit"
  | "finance.view"
  | "admin.access";
// ...
```

- Location: `src/shared/types/rbac.ts` (to be created in roadmap step 4).
- The base `Role → Permission[]` matrix lives in `src/shared/config/rolePermissions.ts` as a `Record<Role, Permission[]>`. **Single source of truth.**
- Permission keys are namespaced strings (dot.case): `employees.viewSalary`. No enums, no booleans in the UI — only keys.

## Computation

- The API returns `{ user, roles: Role[] }`.
- The client computes the effective `Permission[]` from the user's roles using the base matrix merged with each module's contributions.
- The computed set is cached in Redux (auth slice) and used by `usePermission`, `<Can/>`, `<RequirePermission/>`, and `useFilteredMenu`.

## Usage

```tsx
// Hook
const canEditSalary = usePermission("employees.editSalary");

// Component guard (render-prop)
<Can permission="employees.editSalary" fallback={null}>
  <SalaryEditor />
</Can>

// Route guard
<Route element={<RequirePermission permission="admin.access" />}>
  <Route path="/admin/*" element={<AdminLayout />} />
</Route>

// Menu items — filtered by permission
const items = useFilteredMenu(MENU_ITEMS);
```

Never compare roles directly in components (`if (role === "hr")` is forbidden). Always go through a permission key.

## Adding a permission

Each module declares the permission keys it owns in `src/modules/<m>/permissions.ts`. This file extends the central matrix at startup, so a new module can be added without touching `shared/config/rolePermissions.ts`.

When adding a permission, the following must be updated atomically (same PR):

- `src/modules/<m>/permissions.ts` — declare the new key and which default roles get it.
- `src/shared/config/rolePermissions.ts` — only if the permission is cross-module (`admin.access` and similar).
- `src/modules/<m>/CLAUDE.md` — the **Permissions declared by the module** section.
- `docs/rbac.md` (this file) — if the change affects the model section.
- `CHANGELOG.md` — append entry.
- A test for `usePermission` covering the new key.

The dedicated skill that automates this flow is [`.claude/skills/add-permission/SKILL.md`](../.claude/skills/add-permission/SKILL.md).

## Current state

Spec only. Implementation lands in roadmap step 4 (see [roadmap](./roadmap.md)). When code arrives, it must conform to this doc, and any change in code must update this doc (per `CONTRIBUTING.md` Docs sync policy).
