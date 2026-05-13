# Factory integration

This document describes the **factory contract** — the set of files in this repo
that lets an external agent factory (LangGraph orchestrator + ephemeral VM
workers + Langfuse observability) pick up a Jira task, decide whether this repo
is one of its targets, and produce a pull request without human babysitting.

This file is informational. The authoritative machine-readable contract lives in
[`.factory/manifest.yaml`](../.factory/manifest.yaml).

## Mental model

```
Jira webhook ─▶ Factory orchestrator (LangGraph)
                  │
                  ├─ shallow-clone `.factory/` from every repo bound to the Jira key
                  ├─ LLM router reads `.factory/routing.md` for each
                  ├─ decides which repos need a change
                  │
                  └─ for each target repo:
                       ├─ spin up ephemeral VM (Fargate / Firecracker)
                       ├─ full-clone repo
                       ├─ install `.factory/claude-settings.json` into ~/.claude/
                       ├─ run Claude Code headless (`-p`, `bypassPermissions`)
                       ├─ agent uses `.claude/skills/*` to do the work
                       ├─ run `yarn run factory:gate` → `.factory/report.json`
                       ├─ if green: open PR via PR template, comment in Jira
                       └─ destroy VM
```

The repo's job is only to be **describable, deterministic, and gated**. The
orchestrator, secrets, Langfuse, and Jira side live outside this repo.

## What we added and why

### `.factory/manifest.yaml`

The single machine-readable description of this repo for the factory.

- `jira.keys` — which Jira project keys may route work here. Routing starts here:
  the factory looks up repos by Jira key before doing anything else.
- `stack` — node major, package manager, framework. The factory uses this to
  pick the right VM image and to fail fast if the worker is misconfigured.
- `commands` — canonical command names (`install`, `typecheck`, `lint`, `test`,
  `build`, `check`, `docs_sync`, `gate`). The orchestrator never hard-codes
  these per-repo; it always reads them here.
- `outputs` — what artifact this repo produces. Today: `pull_request` with a
  `factory/` branch prefix and a Jira-derived title.
- `domains` — coarse-grained list (auth, rbac, ui, modules, widgets) the LLM
  router uses to decide if a task fits. Per-module index lives elsewhere
  (eventually `src/modules/<name>/module.json`).
- `ai_entrypoint` — explicit pointers to `CLAUDE.md`, `docs/*`, `.memory/*`,
  routing.md, capabilities.json, claude-settings.json. Removes guesswork.
- `skills_allowed` — whitelist of skills the agent may invoke in this repo.
  Disallowed skills are blocked at the orchestrator level, not by the agent's
  conscience.
- `gates` — ordered acceptance checks. The orchestrator aborts on the first
  failure. Mirrored in `scripts/factory-gate.mjs`.
- `limits` — wallclock, self-review iterations, files/LOC ceilings. Prevents
  runaway loops and oversized PRs.
- `protected_paths` — files the agent may not touch unless the Jira task
  explicitly targets them (`.factory/**`, `.github/**`, lockfiles, configs).
  Enforced post-diff by the orchestrator.

### `.factory/routing.md`

Plain-language guide for the factory's LLM router: when does a Jira task belong
to this repo, when not, and what signals are decisive. Kept in prose rather than
YAML because routing is a judgement call — the router needs context, not a
checklist.

### `.factory/capabilities.json`

Machine-readable index of every skill under `.claude/skills/*` with a short
description and the expected inputs. The orchestrator uses this to:

- present the agent with a typed list of available actions;
- emit per-skill metrics to Langfuse (which skills are invoked, success rate);
- block invocation of skills outside the whitelist.

Eventually generated from skill frontmatter; today maintained by hand.

### `.factory/claude-settings.json`

The Claude Code settings the orchestrator copies into `~/.claude/settings.json`
**inside the VM**. It is intentionally different from the developer-facing
[`.claude/settings.json`](../.claude/settings.json):

- `defaultMode: "bypassPermissions"` — no interactive prompts in headless mode.
  Safety comes from VM isolation + the `deny` list below, not from per-call
  consent.
- `deny` — hard blocks for destructive ops (`git push --force`, `git reset
--hard`, `rm -rf`, `sudo`, ssh, writing to `.env`, editing `.factory/`,
  `.github/`, lockfiles, configs). `deny` overrides `bypassPermissions`.
- `env` — `CI=true`, `FORCE_COLOR=0`, `GIT_TERMINAL_PROMPT=0`, `HUSKY=0` so the
  agent never hits TTY-only behaviour or interactive prompts.

### `scripts/factory-gate.mjs`

A dependency-free Node script that runs the `gates:` list from `manifest.yaml`
in order and writes a structured report to `.factory/report.json`:

```json
{
  "overall_status": "passed" | "failed" | "errored",
  "failed_at": "<gate id or null>",
  "gates": [{ "id", "command", "exit_code", "status", "duration_ms", "stdout_tail", "stderr_tail" }]
}
```

The orchestrator reads this file instead of parsing CLI output. Runnable
locally via `yarn run factory:gate` to preview what the factory will see.

### `scripts/check-env.mjs`

Pre-build sanity check: Node major within `ALLOWED_NODE_MAJORS`, every required
env var present, optional vars from `.env.example` warned about. Fails the
`env` gate early with a human message instead of letting `vite build` produce
a confusing `undefined` deep in the bundle.

### `.github/pull_request_template.md`

The PR template the factory fills in. Mandatory fields:

- Jira key + link;
- Langfuse trace URL;
- Agent run id;
- Skills invoked;
- Invariants checklist (mirrors `.memory/invariants_checklist.md`);
- Test plan and risk/rollback.

Humans opening PRs may delete unused sections, but Jira key + gate report link
must stay — it's the only way to correlate a PR with the agent run that made it.

### `.github/CODEOWNERS`

Protects the factory contract itself. Any change to `.factory/`, `.github/`,
`scripts/factory-*.mjs`, `CLAUDE.md`, `docs/`, `.memory/`, `eslint.config.js`,
or `tsconfig*.json` requires explicit human review — these files **define** what
"correct" means for the agent.

### `.nvmrc` + `engines` + `packageManager` in `package.json`

Determinism. The VM image, your laptop, and CI must agree on the Node major and
the Yarn version, otherwise "green locally, red in factory" becomes inevitable.

### New `package.json` scripts

- `check:ci` — same as `check`, kept as a separate name so headless tooling can
  rely on a stable identifier without our dev shorthand changing under it.
- `docs:sync` — placeholder that today exits 0. In CI it will be wired to
  `claude run check-docs-sync --json`. Local `factory:gate` still runs it so
  the report shape stays identical.
- `factory:gate` — runs the gate orchestrator described above.
- `factory:env` — runs `scripts/check-env.mjs` standalone for debugging.

## What this repo deliberately does NOT do

The factory contract stops at the repo boundary. The following live outside:

- **Orchestration** — LangGraph graph nodes (`fetch_manifests`, `route`,
  `spawn_workers`, `implement`, `self_review`, `gate`, `open_pr`,
  `update_jira`) live in the factory service repo, not here.
- **Secrets** — no `.env` is committed. The orchestrator mints short-lived
  GitHub App tokens and Jira service-account tokens per VM.
- **Network policy** — VM egress is firewalled to GitHub, npm registry, Jira,
  and Langfuse. The repo does not enforce this; the VM image does.
- **Trace emission** — Langfuse trace creation is wrapped around the Claude
  Code CLI by the orchestrator. The repo only declares
  `observability.langfuse_project` in the manifest so traces are tagged.
- **Jira state transitions** — the orchestrator moves the issue after gates
  pass. The agent never touches Jira directly.

## How to validate the contract locally

```bash
# 1. Verify environment matches the factory's expectation.
yarn run factory:env

# 2. Run the full gate pipeline (install → env → typecheck → lint → test → build → docs_sync).
yarn run factory:gate
cat .factory/report.json | jq '.overall_status, .gates[].id'
```

If both pass, the factory will be able to ship a PR from this repo. If either
fails, the factory would mark the Jira task as `Needs Human` with the report
attached — same failure mode you see locally.

## Updating the contract

| Change you're making                  | Files to update                                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| New skill in `.claude/skills/<name>/` | `.factory/manifest.yaml` → `skills_allowed`; `.factory/capabilities.json` → add entry                                      |
| New required env var                  | `.env.example`; `scripts/check-env.mjs` → `REQUIRED_ENV`                                                                   |
| New gate (e.g. e2e)                   | `.factory/manifest.yaml` → `gates`; ensure `package.json` script exists                                                    |
| Node major bump                       | `.nvmrc`; `package.json` → `engines.node`; `scripts/check-env.mjs` → `ALLOWED_NODE_MAJORS`                                 |
| New protected file                    | `.factory/manifest.yaml` → `protected_paths`; `.factory/claude-settings.json` → `deny` if applicable; `.github/CODEOWNERS` |
| New Jira project key                  | `.factory/manifest.yaml` → `jira.keys`; tell the factory orchestrator about the mapping                                    |

After any change here: run `yarn run factory:gate` locally, confirm green, then
open a PR. The PR will route through `CODEOWNERS` for human review because
`.factory/**` is explicitly protected.
