# Changelog

Append-only. Every PR must add an entry.

## [Unreleased]

### Added

- **US-002 — Ported legacy Home and People Directory UI primitives into `src/shared/ui/`** with colocated `*.mock.ts` and `*.stories.tsx` per component: `PageHeader`, `StatBox`, `ExportButton`, `AIPanel`, `Drawer`. Storybook-only; no module/page/router wiring (deferred to a follow-up story).
- Semantic color tokens (`--color-positive`, `--color-negative`, `--color-warning`, `--color-info`, `--color-purple`, `--color-teal`) in `src/index.css` for both light and dark themes — required by the legacy palette referenced by ported components.
- **Hard doc-sync gate for agents.** New skill [`.claude/skills/check-docs-sync/SKILL.md`](.claude/skills/check-docs-sync/SKILL.md) — 6 semantic checks (modules ↔ module CLAUDE.md, RBAC keys, routes, code-style ↔ ESLint, memory index, stack ↔ package.json). Task is not done until it reports `All docs/code in sync.` Modeled on the brain-ai-front pattern.
- All 11 Tier-1+2 skill stubs filled in with Trigger/Inputs/Pre-flight/Steps/Gotchas/Validation loop/Post-flight — every one requires `check-docs-sync` to pass before declaring done.
- `docs/*` (7 files) now carry an "Authoritative spec" header — if code drifts, code is wrong.
- `CLAUDE.md` restructured: explicit **Workflow Rules — ALWAYS FOLLOW** (7 hard procedural rules including running `check-docs-sync`) + **Invariants — DO NOT BREAK** (14 numbered architectural invariants).

### Changed

- `CONTRIBUTING.md` Docs sync policy preamble — declares `docs/*` as the source of truth and points at `check-docs-sync` as the hard gate.

### Removed

- `scripts/docs-sync-check.sh` and the bash-side doc-sync pre-commit step — useless for agents (bash hooks don't fire for them) and replaced by the agent-runnable `check-docs-sync` skill. `.husky/pre-commit` now only runs `lint-staged`.

- **Docs split**: extracted topical documents under [`docs/`](docs/) — `code-style.md`, `architecture.md`, `rbac.md`, `auth.md`, `skills.md`, `module-claude-template.md`, `roadmap.md`. Each is self-contained and ≤300 lines (RAG-friendly).

### Changed

- `PLAN.md` archived to [`docs/history/bootstrap-plan.md`](docs/history/bootstrap-plan.md) with a frozen header. It is no longer a live source of truth; live rules live in `docs/*`.
- Root `ARCHITECTURE.md` removed — content folded into [`docs/architecture.md`](docs/architecture.md).
- `CLAUDE.md` rewired: replaced "see PLAN.md" with a topical-doc map; added a "Where things live" table.
- `README.md`, `CONTRIBUTING.md` (Docs sync policy table), `.memory/MEMORY.md`, `.memory/task_routing.md`, `.memory/project_core.md`, `.memory/invariants_checklist.md`, sub-`CLAUDE.md` files, `.claude/skills/README.md`, `scripts/docs-sync-check.sh` — all repointed at the new `docs/*` locations.
- All `.md` documentation translated to English; the project is English-only going forward (code identifiers, comments, docs, commit messages).
- **Docs sync policy** in [CONTRIBUTING.md](CONTRIBUTING.md): "code change → which `.md` to update" table, short bullet in [CLAUDE.md](CLAUDE.md) Workflow, checkbox in [.memory/invariants_checklist.md](.memory/invariants_checklist.md), pre-commit hook `scripts/docs-sync-check.sh` (warn-only).
- ESLint expanded: `max-lines` 400 (error), `@typescript-eslint/naming-convention`, `import/no-default-export` with overrides for `pages/**` and config files; `no-restricted-syntax` bans TS `enum` (use `as const` + literal union instead).
- Sub-`CLAUDE.md` per layer: [src/app/CLAUDE.md](src/app/CLAUDE.md), [src/shared/CLAUDE.md](src/shared/CLAUDE.md), [src/widgets/CLAUDE.md](src/widgets/CLAUDE.md).
- `THEME` / `NEXT_THEME` (as const) in `src/app/uiSlice.ts` — example of a domain string constant.
- Bootstrap: Vite 7 + React 19 + TS strict + Tailwind 4.
- ESLint 9 flat config with `eslint-plugin-boundaries` (import boundaries app→widgets→modules→shared).
- Prettier + lint-staged + Husky.
- Redux Toolkit store + RTK Query `baseApi`.
- React Router 7 data router with `AppLayout` (Header + Sidebar + `<Outlet/>`).
- ThemeProvider (light/dark via CSS variables).
- AI docs: `CLAUDE.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `.memory/*`, `.claude/skills/*` (scaffolding).
