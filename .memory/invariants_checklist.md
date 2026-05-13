# Invariants checklist (before PR)

> Full rules — [`docs/code-style.md`](../docs/code-style.md). Architecture — [`docs/architecture.md`](../docs/architecture.md).

- [ ] `yarn run check` is green (lint + typecheck + test).
- [ ] File < 300 lines? If not — split it.
- [ ] Imports via `@/`, sorted by groups, blank line between groups.
- [ ] Named export (default only for pages under `React.lazy`).
- [ ] No inline `style={{}}` without real necessity.
- [ ] Colors via theme tokens (`var(--color-*)` or Tailwind classes), not hardcoded hex.
- [ ] No comments describing _what_ the code does.
- [ ] No single-letter names in callbacks (`employees.map((employee) => …)`).
- [ ] Domain string sets (theme/role/status/...) — `as const` object + literal union, never `enum`. Values repeated ≥2 times are extracted.
- [ ] All forms — `react-hook-form` + `zod`.
- [ ] RBAC checks — via `<Can/>` / `usePermission`, not direct role comparisons.
- [ ] Server state — RTK Query only, never duplicated into Redux/state.
- [ ] Module imports — only via `@/modules/<name>` (barrel), never into internals.
- [ ] CHANGELOG.md is updated.
- [ ] Walked through the **Docs sync policy** table in CONTRIBUTING.md — every affected `.md` is updated (`modules/<name>/CLAUDE.md`, `docs/*`, `.memory/*`, etc.).
- [ ] For visual tasks — PR description links the reference screen in tower.
