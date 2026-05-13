# Routing — when a Jira task belongs to tower-front

This file is consumed by the factory's LLM router. It decides, given a Jira task's
title + description + acceptance criteria, whether this repo is one of the targets.
It must NOT be read as instructions for implementing the task — that's `CLAUDE.md`.

## Repo summary

Agent-driven React 19 + Vite + TypeScript SPA. Module-per-domain architecture.
UI for an internal admin/HR system. No backend code here — all server I/O goes
through RTK Query endpoints against the API repo.

## Route to this repo when the task is about

- A user-facing screen, page, layout, navigation, or sidebar change.
- A new business module under `src/modules/*` or extending an existing one.
- A form (creation/edit) — implementation must use `react-hook-form` + `zod`.
- A data table, list, or detail view backed by an RTK Query endpoint.
- A change to RBAC visibility (showing/hiding UI by permission key).
- Theming, dark mode, design tokens, shadcn/ui primitives.
- A cross-module widget (header, sidebar, breadcrumbs) under `src/widgets/*`.
- Frontend tests (Vitest + Testing Library) for any of the above.
- MSW handlers/fixtures for endpoints this repo consumes.
- Documentation under `docs/*` that describes frontend rules or modules.

## Do NOT route to this repo when

- The task is about the API contract itself (schema, validation, auth issuance,
  DB migrations, background jobs). Route to the backend repo; this repo only
  consumes the contract once it exists.
- The task is mobile-only (iOS/Android native code).
- The task is infra/devops (Terraform, CI runners, k8s manifests).
- The task is about design assets in Figma without a concrete UI deliverable —
  the design source is the `tower` reference project, not this one.

## Co-routing — when this repo participates alongside others

These tasks usually need a backend PR first and a frontend PR after:

- "Add a new entity X with CRUD" → backend creates endpoints, then this repo
  adds the module, RTK endpoints, pages, RBAC keys.
- "Add a new role/permission" → backend updates RBAC issuance, then this repo
  declares the permission key (`add-permission` skill) and gates UI.
- "Expose field Y on existing entity" → backend extends DTO, then this repo
  updates the zod schema and renders it.

The factory should open the frontend PR with a `Depends on: <backend PR>` line
and keep it as draft until the backend PR is merged.

## Signals in the Jira task that strongly imply this repo

- Mentions of: page, screen, modal, dialog, form, table, list, sidebar, header,
  navigation, route, RBAC visibility, theme, dark mode, accessibility,
  responsive, browser, click, hover.
- Acceptance criteria phrased as user actions ("User can ...", "When the user
  clicks ...", "The page should show ...").
- Attachments: Figma links, screenshots, screen recordings.

## Signals that strongly imply NOT this repo

- Mentions of: migration, schema, query plan, index, cron, queue, worker,
  webhook receiver, JWT signing, password hashing, rate limit, audit log
  storage, S3, SQS, Lambda.
- Acceptance criteria phrased as API behavior ("Endpoint returns 4xx when ...",
  "Job runs every N minutes ...").

## Tiebreaker

When the router is uncertain, prefer routing to this repo only if at least one
"strong yes" signal is present AND no "strong no" signal is present. Otherwise
defer to a human and set the task to `Needs Human`.
