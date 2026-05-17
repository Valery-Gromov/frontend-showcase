# Agent Handoff

This file is the stable starting point for new agent sessions. It exists to reduce context loss
between chats and keep the monorepo consistent.

## How To Start A New Agent Session

1. Read `README.md`, `docs/roadmap.md`, `docs/architecture.md`, `docs/dependency-graph.md`, and this file.
2. Pick a scope profile from `.cursor/rules/context-management.mdc`: `app`, `package`, or `cross-cutting`.
3. Read only the app/package/docs files required by that profile.
4. Before editing, check `git status --short`.
5. After editing, run the smallest meaningful verification first, then broader checks if the change crosses boundaries.
6. If the workspace changed, add a concise entry to this file.

## Current Project State

- `apps/product-catalog-admin`: URL-driven data-heavy catalog with SDK/mock-network, complex selection, drawer/edit flows, bulk actions, tests for query/selection models, and focused a11y polish.
- `apps/data-hub`: TanStack Query + Recharts analytics dashboard using SDK/mock-network and shared UI tokens.
- `apps/log-viewer`: cursor-paginated virtualized log stream using `@tanstack/react-virtual`.
- `apps/todo-app`: small UI sandbox.
- `packages/sdk`: injectable HTTP client with retry and typed storage.
- `packages/ui`: custom Material 3-inspired design system with atoms/molecules/organisms and ThemeProvider.
- `packages/hooks`: reusable hooks with tests.
- `packages/mock-network`: fetch-compatible mock transport with tests.

## Verification Baseline

Use these for final verification after cross-cutting changes:

```bash
pnpm -r typecheck
pnpm test
pnpm --filter @frontend-showcase/product-catalog-admin build
pnpm --filter @frontend-showcase/data-hub build
pnpm --filter @frontend-showcase/log-viewer build
```

## Recent Agent Entries

### 2026-05-17 — Log Viewer app case-study docs

- Scope profile: app.
- Changed: added `apps/log-viewer/engineering-brief.md` and rewrote
  `apps/log-viewer/README.md` as a shorter hiring-manager entry point.
- Changed: updated `docs/reuse-candidates.md` with Log Viewer reuse candidates from the audit:
  cursor stream/follow orchestration, append-only cursor mock scenario, virtualized inspector layout,
  and API error translation convention.
- Purpose: document `log-viewer` as a standalone showcase case study without changing app code.
- Verification: not run; documentation-only change pending user-requested verification.
- Commit: `3e94100 docs(log-viewer): add engineering brief and app readme`.

### 2026-05-17 — Log Viewer local cleanup and tests

- Scope profile: app.
- Changed: added app-local tests for stream merge/follow helpers and mock cursor route behavior.
- Changed: removed unused cursor state and unused mock-server level-options export.
- Changed: scoped log mock backend state per route factory and made `serverHighWatermark` reflect the
  active level filter so the behind count is query-scoped.
- Verification: `pnpm --filter @frontend-showcase/log-viewer test`, `pnpm --filter
  @frontend-showcase/log-viewer typecheck`, `pnpm --filter @frontend-showcase/log-viewer build`,
  and `pnpm hygiene` passed.
- Commit: `fix(log-viewer): add local stream tests and cleanup`.

### 2026-05-17 — Data Hub local cleanup and tests

- Scope profile: app.
- Changed: split Data Hub dashboard helpers into local feature components/formatters without
  creating shared abstractions.
- Changed: surfaced filter-options load errors, made stockout KPI delta semantics lower-is-better,
  disabled revenue-target decrement before the server minimum, and scoped analytics mock state per
  route factory.
- Changed: added app-local Vitest coverage for analytics mock filters, stale-snapshot cadence, and
  revenue-target minimum validation, plus focused component regressions for KPI direction and target
  decrement disabling.
- Verification: `pnpm --filter @frontend-showcase/data-hub typecheck`, `pnpm --filter
  @frontend-showcase/data-hub test`, `pnpm --filter @frontend-showcase/data-hub build`, and
  `pnpm hygiene` passed.

### 2026-05-17 — Data Hub app case-study docs

- Scope profile: app.
- Changed: added `apps/data-hub/engineering-brief.md` and rewrote
  `apps/data-hub/README.md` as a shorter hiring-manager entry point.
- Changed: updated `docs/reuse-candidates.md` with Data Hub reuse candidates from the audit:
  query-key/optimistic-mutation convention, theme toggle control, stale-snapshot mock scenario, and
  dashboard panel/KPI primitives.
- Purpose: document `data-hub` as a standalone showcase case study without changing app code.
- Verification: not run; documentation-only change pending user-requested verification.
- Commit: `docs(data-hub): add engineering brief and app readme`.

### 2026-05-15 — Product catalog all-matching pagination fix

- Scope profile: app.
- Changed: `allMatching` selection now survives pagination without opening the clear-selection
  confirmation dialog. Explicit page-only `some` selection still asks before page changes.
- Changed: added a focused test for selection invalidation rules in catalog query orchestration.
- Verification: product catalog test/typecheck/build passed, temporary Playwright smoke confirmed
  all-matching selection remains active on Page 2, and full `pnpm verify` plus `pnpm hygiene` passed.

### 2026-05-15 — Data table tooltip clipping fix

- Scope profile: package/app boundary fix.
- Changed: `DataTable` frame no longer clips overflowing children, so row/header tooltips are not cut
  by the table border.
- Verification: `@frontend-showcase/ui` typecheck passed and product catalog build passed.

### 2026-05-15 — Product catalog UI bug fixes

- Scope profile: app/package boundary fix.
- Changed: `allMatching` is now a server/query selection mode. It sends `querySnapshot` with no
  client-collected ids, so the mock server resolves all rows matching the current filters across
  pages. Header checkbox remains page-only `some` selection.
- Changed: row checkboxes are disabled in `allMatching` mode, header checkbox clears selection, and
  the summary no longer renders "except N excluded" copy.
- Changed: catalog toast notifications now have a dismiss button.
- Changed: catalog bulk actions submit `allMatching` as query intent, not as a page-sized id list.
- Changed: product editor drawer closes on backdrop click while preserving the existing dirty-form
  confirmation path.
- Verification: product catalog build passed, temporary Playwright smoke passed for all-matching
  summary/disabled row checkboxes/dismissible toast/drawer backdrop close, and full `pnpm verify`
  passed.

### 2026-05-14 — Product catalog all-matching selection hardening

- Scope profile: app.
- Changed: added a reachable "Select all matching filters" workflow for `SelectionState.allMatching`
  and local selection helpers with tests.
- Changed: extracted a local `ConfirmDialog` used by query-change and discard-changes confirmations.
- Changed: extracted catalog URL/query orchestration into local `useProductCatalogQuery` hook.
- Changed: updated product catalog docs to stop describing `allMatching` as type-only.
- Verification: catalog test/typecheck/build passed, screenshot smoke at `http://127.0.0.1:5174/`
  passed, and full `pnpm verify` passed.

### 2026-05-14 — Reuse candidate register

- Scope profile: cross-cutting.
- Changed: added `docs/reuse-candidates.md` as a shared register for app audit findings that might
  become package abstractions later.
- Purpose: collect reuse candidates across apps before deciding what belongs in `packages/*`.
- Verification: `pnpm hygiene` passed.

### 2026-05-14 — Product catalog app case-study docs

- Scope profile: app.
- Changed: added `apps/product-catalog-admin/engineering-brief.md` and rewrote
  `apps/product-catalog-admin/README.md` as a shorter hiring-manager entry point.
- Purpose: document the catalog app as a standalone showcase case study without changing app code.
- Note: follow-up code work added a "Select all matching filters" affordance, so
  `SelectionState.allMatching` is now reachable from the catalog UI.
- Verification: `pnpm hygiene` passed.
- Commit: included in `docs(product-catalog-admin): add engineering brief and app readme`.

### 2026-05-14 — Context management rules and handoff setup

- Scope profile: cross-cutting.
- Changed: added `.cursor/rules/context-management.mdc`, `.cursor/rules/agent-handoff.mdc`,
  `docs/agent-handoff.md`, and updated `.gitignore` so `.cursor/rules/*.mdc` can be versioned.
- Purpose: make future agents choose explicit context scope, keep apps aware of package contracts, and document non-trivial workspace changes.
- Verification: `pnpm hygiene` passed after adding the hygiene script and workspace README coverage.
- Commits: `576d926 chore(agents): add context and handoff rules`; hygiene automation commit pending.
- Next suggested step: use `pnpm verify` before final handoff on future cross-cutting changes.

### 2026-05-14 — Repo hygiene automation

- Scope profile: cross-cutting.
- Changed: added `scripts/repo-hygiene.mjs`, `pnpm hygiene`, `pnpm verify`, and wired CI to `pnpm verify`.
- Changed: removed empty stale directories `apps/admin-app` and `packages/config`.
- Changed: added missing workspace READMEs for `product-catalog-admin`, `todo-app`, `sdk`, `ui`,
  `hooks`, and `mock-network`.
- Verification: `pnpm verify` passed (hygiene, workspace typecheck, 47 tests).
- Commits: not yet committed.
- Next suggested step: run `pnpm verify`, then commit the hygiene automation and README coverage.
