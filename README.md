# Tower v2

Enterprise portal for Artkai employees. Full rewrite of the legacy tower prototype — for the original context and bootstrap rationale, see [docs/history/bootstrap-plan.md](docs/history/bootstrap-plan.md).

## Quickstart

```bash
yarn
yarn dev
```

## Commands

| Command          | What it does            |
| ---------------- | ----------------------- |
| `yarn dev`       | Vite dev server         |
| `yarn build`     | Production build        |
| `yarn lint`      | ESLint                  |
| `yarn typecheck` | TypeScript check        |
| `yarn test`      | Vitest                  |
| `yarn run check` | lint + typecheck + test |

## Documentation

- [CLAUDE.md](CLAUDE.md) — instructions for AI agents (entry point).
- [docs/code-style.md](docs/code-style.md) — full code style rules.
- [docs/architecture.md](docs/architecture.md) — layers, boundaries, data flow.
- [docs/rbac.md](docs/rbac.md) — roles, permissions, guards.
- [docs/auth.md](docs/auth.md) — auth provider abstraction.
- [docs/skills.md](docs/skills.md) — `.claude/skills/*` methodology and inventory.
- [docs/module-claude-template.md](docs/module-claude-template.md) — required `modules/<name>/CLAUDE.md` template.
- [docs/roadmap.md](docs/roadmap.md) — phase scope and PR breakdown.
- [CONTRIBUTING.md](CONTRIBUTING.md) — recipes and Docs sync policy.

### Historical

- [docs/history/bootstrap-plan.md](docs/history/bootstrap-plan.md) — original monolithic bootstrap plan (archived, frozen). Current rules live in `docs/*`.
