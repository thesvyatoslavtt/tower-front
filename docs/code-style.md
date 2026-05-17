# Code Style

> **Authoritative spec.** If code drifts from this document, the **code** is wrong — fix the code or update this spec FIRST (then the code). Agents MUST run [`check-docs-sync`](../.claude/skills/check-docs-sync/SKILL.md) before declaring a task done.

Mandatory rules for every PR in Tower v2. Factory agents follow them on every change. Cross-links: [architecture](./architecture.md), [RBAC](./rbac.md), [auth](./auth.md), [skills](./skills.md), [../CLAUDE.md](../CLAUDE.md), [../CONTRIBUTING.md](../CONTRIBUTING.md).

## File structure

```
src/widgets/Sidebar/
├── Sidebar.tsx         # named export
├── menuItems.ts        # data/config co-located with the component
├── Sidebar.test.tsx    # tests are co-located
└── index.ts            # re-export: export { Sidebar } from "./Sidebar"
```

- **Named exports for all components**, except pages (`src/modules/<m>/pages/**`) — where a **default export** is required so `React.lazy` can import them.
- A barrel `index.ts` at every level (`widgets/index.ts`, `modules/people/index.ts`, etc.).
- **Imports only via the `@/` alias** — no `../../../`. Configured in `vite.config.ts` + `tsconfig.json`.

## Import order

```ts
// 1. React and third-party libraries
import { useState } from "react";
import { useNavigate } from "react-router";

// 2. Internal via alias
import { EmployeeCard } from "@/modules/people";
import { Can } from "@/shared/lib/rbac";
import { Button } from "@/shared/ui/button";

// 3. Types (in a separate block)
import type { Employee } from "@/modules/people";
```

A blank line between groups. The ESLint rule `import/order` enforces this automatically.

## Naming

| Entity             | Style                      | Example                           |
| ------------------ | -------------------------- | --------------------------------- |
| Components         | PascalCase                 | `EmployeeCard.tsx`, `Sidebar.tsx` |
| Hooks              | camelCase + `use`          | `useCurrentUser`, `usePermission` |
| Constants          | SCREAMING_SNAKE_CASE       | `DEFAULT_PAGE_SIZE`, `ROUTES`     |
| Types / interfaces | PascalCase                 | `Employee`, `EmployeeCardProps`   |
| Utilities / fns    | camelCase                  | `formatDate`, `cn`                |
| Permission keys    | dot.case                   | `employees.viewSalary`            |
| Test files         | `*.test.tsx` / `*.test.ts` | co-located next to the code       |

## Identifier readability (hard rule)

**Single-letter and uninformative abbreviations are forbidden** for any variables, parameters, callback arguments, indices. A name must describe **what it is**, not "what's shorter".

```ts
// ❌ BAD
data.map((d) => d.name);
employees.filter((e) => e.status === "active");
users.forEach((u, i) => console.log(i, u));
arr.reduce((a, c) => a + c.salary, 0);
const res = await fetch(...);
const { d } = props;

// ✅ GOOD
employees.map((employee) => employee.name);
employees.filter((employee) => employee.status === "active");
users.forEach((user, index) => console.log(index, user));
employees.reduce((total, employee) => total + employee.salary, 0);
const response = await fetch(...);
const { data } = props;
```

Rules:

- In `map/filter/find/reduce/forEach` callbacks, use the **full element name in the singular**: `employees.map((employee) => ...)`.
- `reduce` accumulators are named by meaning (`total`, `sum`); `acc` only in general utilities in `shared/lib`.
- Indices — `index`, not `i`. Keys — `key`, not `k`. Events — `event`, not `e`.
- Intermediate variables — `response`, `result`, `payload`, not `res`, `r`, `p`.
- Abbreviations allowed only for commonly accepted domain acronyms: `id`, `url`, `dto`, `api`, `db` — and even then as part of a name (`employeeId`, not just `id` in a broad scope).
- Destructuring does not justify a short name: name the field properly from the start.

Enforced by ESLint `id-length` (min 2) and `@typescript-eslint/naming-convention`.

## Domain string constants

Any **domain set of strings** (theme, role, status, employee type, unit, permission scope) is declared as an `as const` object + a derived literal union. **TS `enum` is forbidden** (including `const enum`) — ESLint error via `no-restricted-syntax` on `TSEnumDeclaration`.

Reasons: enums drag in a runtime object (not tree-shakable), mix value/type, numeric enums are unsafe, they conflict with `erasableSyntaxOnly`, and the project has a consistent pattern (`ROUTES`).

```ts
// ✅ GOOD
export const THEME = {
  light: "light",
  dark: "dark",
} as const;
export type Theme = (typeof THEME)[keyof typeof THEME];

// for binary/cyclic toggles — use a Record map, not a ternary
export const NEXT_THEME: Record<Theme, Theme> = {
  [THEME.light]: THEME.dark,
  [THEME.dark]: THEME.light,
};

dispatch(setTheme(NEXT_THEME[theme]));

// ❌ BAD
export enum Theme {
  Light = "light",
  Dark = "dark",
}
dispatch(setTheme(theme === "light" ? "dark" : "light"));
```

**When to extract:**

- The string has a domain meaning (theme / role / status / employee type / unit / permission scope) **AND**
- it is repeated ≥2 times within a single module **OR** appears in API/DTO.

**When to leave inline:**

- One-off technical literals: `aria-label`, test `data-testid`, UI section headings, button text.
- Any single literal with no domain meaning.

**Location:**

- Module-specific → `modules/<m>/model/constants.ts` (or next to the type in `model/types.ts`).
- Cross-module → `shared/config/<domain>.ts` (like `routes.ts`).
- The type is always exported from the same file as the object.

## Object literals — formatting

Object literals **must be written multi-line whenever they contain a nested object, array, or function literal**. One property per line. Trailing comma on every line (Prettier `trailingComma: "all"` enforces this when the object is multi-line — but the agent must initiate the line break).

**Bad** — readable on one screen but impossible to diff cleanly:

```ts
controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
```

**Good**:

```ts
controls: {
  matchers: {
    color: /(background|color)$/i,
    date: /Date$/i,
  },
},
```

**When a flat object is fine on one line:** all values are scalars (strings, numbers, booleans, `null`) AND the whole literal fits comfortably under `printWidth: 100`. Example: `const point = { x: 1, y: 2 };`.

**As soon as ANY value is itself an object, an array, a JSX node, or an arrow function:** break to multi-line.

Enforced by ESLint:

```js
"object-curly-newline": ["error", { multiline: true, consistent: true, minProperties: 2 }],
"object-property-newline": ["error", { allowAllPropertiesOnSameLine: false }],
```

## Component file structure (strict order)

```tsx
// 1. Imports (by groups, see above)
import { useState } from "react";
import { Button } from "@/shared/ui/button";
import type { Employee } from "@/modules/people";

// 2. Local types
interface EmployeeCardProps {
  employee: Employee;
  onSelect?: (id: string) => void;
}

// 3. Local constants (if needed)
const STATUS_LABELS: Record<Employee["status"], string> = {
  active: "Active",
  bench: "Bench",
  dismissed: "Dismissed",
};

// 4. Component
export function EmployeeCard({ employee, onSelect }: EmployeeCardProps) {
  // 4.1 — Hooks (useState, useQuery, useMemo, ...)
  const [isHovered, setIsHovered] = useState(false);

  // 4.2 — Derived values
  const statusLabel = STATUS_LABELS[employee.status];

  // 4.3 — Handlers
  const handleClick = () => {
    onSelect?.(employee.id);
  };

  // 4.4 — Early return (loading / empty / error)
  if (!employee) return null;

  // 4.5 — Render
  return <div onClick={handleClick}>{/* ... */}</div>;
}
```

## Blank-line discipline

- **No more than 1 consecutive blank line** anywhere in the file (ESLint `no-multiple-empty-lines: { max: 1 }`).
- **A blank line between logical sections** inside the component: between hooks and handlers, between handlers and `return`, between different `useEffect`s.
- **Inside JSX**: a blank line between major meaningful blocks (`<Header>` ↔ `<Main>` ↔ `<Footer>`).
- Inside a function — blank lines separate steps: validation → computation → side effect → return.

## Comments

**Default: none.** Good code is explained by names.

Comment only when:

- the **WHY** is non-obvious (business rule, workaround, counterintuitive trade-off);
- a regular expression or a complex formula;
- a TODO with context.

Forbidden:

- Comments describing **what** the code does (`// increment counter`).
- Commented-out code (delete it, git remembers).
- JSDoc on every function — only for the public API in `shared/`.

TODO format: `// TODO(scope): description` — scope makes them greppable. Example: `// TODO(rbac): move to a server-side check once SSO is connected`.

## File and function size

- `max-lines: 400` — **error** in ESLint.
- `max-lines-per-function: 80` — **warn** in ESLint.
- If a component crosses **200 lines** — split it:
  - Subcomponents → into adjacent sibling files (`EmployeeCard/Header.tsx`, `EmployeeCard/Stats.tsx`).
  - Handlers with heavy logic → into custom hooks (`useEmployeeActions`).
  - Configs/constants → into an adjacent `*.config.ts` (`EmployeeCard.config.ts`).

`PersonPage` in tower = 4421 lines = anti-pattern. Our `EmployeeDetailPage` = layout + lazy tabs, each tab < 250 lines.

## Styling (Tailwind + shadcn)

- Use `cn()` from `@/shared/lib/utils` for conditional classes.
- **No inline `style={{}}`**, except when the value is genuinely dynamic (e.g. `--progress: ${pct}%`).
- Colors — only via theme tokens (`text-foreground`, `bg-card`, `bg-primary`). **No hardcoded hex.**
- Long `className` strings are split via `cn()`:
  ```tsx
  <div className={cn(
    "flex items-center gap-2 rounded-md border p-3",
    "hover:bg-accent transition-colors",
    isActive && "border-primary bg-accent",
  )}>
  ```
- Animations / keyframes — via Tailwind config, not inline CSS.

## Forms

- **All forms — `react-hook-form` + `zod` resolver.** No `useState` for fields.
- A single shared catalog of wrappers in `shared/ui/form/*` (`FormField`, `FormInput`, `FormSelect`).
- The DTO for the API and the zod schema live side by side in `modules/<m>/model/`. Types are derived via `z.infer<typeof schema>`.

## API layer (RTK Query)

```ts
export const peopleApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEmployees: build.query<Employee[], EmployeeFilters>({
      query: (filters) => ({ url: "/employees", params: filters }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Employee" as const, id })), "Employee"]
          : ["Employee"],
    }),
    getEmployee: build.query<Employee, string>({
      query: (id) => `/employees/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Employee", id }],
    }),
  }),
});

export const { useGetEmployeesQuery, useGetEmployeeQuery } = peopleApi;
```

Rules:

- Endpoints are co-located in `modules/<m>/api/`.
- Tags are typed: `type: "Employee" as const`.
- List queries whose data changes often → `refetchOnMountOrArgChange: true`.
- DTOs in `modules/<m>/model/types.ts`.

## Hooks and state

- **Local state** — `useState` / `useReducer`.
- **Server state** — RTK Query only (we do not duplicate it into local state).
- **Global state** — Redux slices only for `auth` and `ui` (theme, sidebar collapsed). Business data is **never** duplicated into Redux.
- `useCallback` only when the handler is passed down into a memoized child.

## Functions

- **Arrow functions** for components and utilities (hoisting cases are rare).
- Destructure props directly in the signature.
- Early return instead of nested `if`s.

## Types

- `strict: true` in `tsconfig`. `noUncheckedIndexedAccess: true`.
- No `any` (ESLint error). When unavoidable — `unknown` + narrow.
- `interface` for public props; `type` for unions / intersections — consistently.
- Domain types — in `modules/<m>/model/types.ts`, exported via the barrel.

## ESLint enforcement

| Rule                                                     | Effect                                                                                 |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `boundaries/element-types`                               | Enforces the dependency graph `app → widgets → modules → shared`; barrel-only imports. |
| `import/order`                                           | 3-group order with `newlines-between: "always"`; `@/**` group placed after externals.  |
| `import/no-default-export`                               | Forbids default exports — **override**: pages and `*.config.*` files may use default.  |
| `@typescript-eslint/no-explicit-any`                     | `any` is an error. Use `unknown` and narrow.                                           |
| `@typescript-eslint/consistent-type-imports`             | `import type {...}` for type-only imports.                                             |
| `@typescript-eslint/no-unused-vars`                      | Unused vars are errors; underscore prefix (`_foo`) allowed.                            |
| `@typescript-eslint/naming-convention`                   | `variableLike` in camelCase/PascalCase/UPPER_CASE; `typeLike` in PascalCase.           |
| `no-multiple-empty-lines` `{ max: 1 }`                   | At most one consecutive blank line.                                                    |
| `max-lines` `{ max: 400 }` **error**                     | Hard cap per file.                                                                     |
| `max-lines-per-function` `{ max: 80 }` **warn**          | Soft cap per function.                                                                 |
| `id-length` `{ min: 2 }`                                 | Forbids 1-letter identifiers; `_` excepted.                                            |
| `no-restricted-syntax` on `TSEnumDeclaration`            | TS `enum` is banned — use `as const` + literal union (see Domain string constants).    |
| `react-hooks/*` + `react-refresh/only-export-components` | Standard React Hooks rules and Fast Refresh hygiene.                                   |

For any new rule, sync `docs/code-style.md` ↔ `CLAUDE.md` ↔ `.memory/invariants_checklist.md` ↔ `eslint.config.js`.

## Pre-PR checklist

See [`.memory/invariants_checklist.md`](../.memory/invariants_checklist.md) for the single, authoritative checklist agents run before opening a PR.
