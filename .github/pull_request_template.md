<!--
This template is filled in by the agent factory. Human PRs may delete unused
sections, but the Jira key and the gate report link MUST stay.
-->

## Jira

- Key: `<TWR-XXXX>`
- Link: <https://artkai.atlassian.net/browse/TWR-XXXX>

## Summary

<!-- 1–3 bullets describing the user-visible change. Reviewers should be able
to understand the intent without opening the diff. -->

-
-

## Scope

- Modules touched: `<auth | rbac | ui | modules/* | widgets/*>`
- New permission keys: `<none | key1, key2>`
- New routes: `<none | /path>`
- New RTK endpoints: `<none | module.endpointName>`

## Factory metadata

<!-- Filled in by the orchestrator. Keep these fields for traceability. -->

- Agent run id: `<run-id>`
- Langfuse trace: `<url>`
- Gate report: `.factory/report.json` (artifact attached to the run)
- Skills invoked: `<add-page, add-rtk-endpoint, ...>`
- Self-review iterations: `<n>`

## Invariants checklist

<!-- Each box must be ticked. If a box does not apply, write N/A and a reason. -->

- [ ] `yarn run check` is green locally and in CI
- [ ] `check-docs-sync` reports "All docs/code in sync"
- [ ] No new `any`, no TS `enum`, no `useState` for form fields
- [ ] No role compares in UI — RBAC goes through `<Can/>` / `usePermission`
- [ ] Server state lives in RTK Query, not Redux slices
- [ ] No hardcoded hex colors outside `src/index.css`
- [ ] No file >300 lines added; existing files not pushed past 400
- [ ] `CHANGELOG.md` has a new entry
- [ ] Module `CLAUDE.md` updated for every touched module

## Test plan

<!-- What was tested and how. For UI changes, include the path the user takes. -->

-
-

## Risk and rollback

- Risk: `<low | medium | high>`
- Rollback: revert this PR; no data migration involved.
