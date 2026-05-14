# Roadmap

This document tracks what is done, what is in progress, and what is planned. The complete uplift plan lives in `.cursor/plans/portfolio-showcase-uplift_*.plan.md`.

## Done

- Monorepo on pnpm workspaces, root `package.json`, `tsconfig.base.json`.
- Per-app/per-package `package.json` and `tsconfig.json`, workspace dependencies.
- `packages/sdk`: `httpClient` (injectable `fetch` + retry), `typedStorage`.
- `packages/ui`: atoms, molecules, organisms (`DataTable`, `FilterBar`, `BulkActionBar`) on CSS Modules + Material 3-inspired design tokens, with a `ThemeProvider` (light / dark / system, density slot) — see ADR 0007.
- `packages/hooks`: `useUrlQueryState`, `useDebouncedValue`, `useRequestSequence`, `useExternalChangeDetector`.
- `packages/mock-network`: `createMockFetch(routes, { latency, flakyChance })`.
- `apps/todo-app`: sandbox for the UI atoms.
- `apps/product-catalog-admin`: data-heavy admin running over the SDK + mock network, with `useRequestSequence` and `useExternalChangeDetector` integrated, `typedStorage` persisting `filtersOpen`.
- `apps/data-hub`: real analytics dashboard on TanStack Query + Recharts, using SDK + mock-network,
  shared UI tokens, background refresh, stale snapshot notice, and optimistic revenue-target mutation.
- `apps/log-viewer`: virtualized append-only log stream with cursor pagination, level filtering,
  live tail, pause-on-scroll-up, jump-to-now, and click-to-pin details.
- Phase 4 — UI design system uplift: Material 3-inspired token layer (`tokens.css`), `ThemeProvider` with `prefers-color-scheme` + persisted preference, CSS Modules across atoms, molecules and organisms, app-level stylesheets rebased onto the same tokens (no hex literals outside `tokens.css`). Implementation record: [`docs/design-system-phase4.md`](design-system-phase4.md).
- Phase 7 — `docs/comparison.md` (catalog vs. dashboard vs. log viewer).
- Phase 8 — full ADR set in `docs/decisions/` (0001–0007).
- Phase 9 — Vitest set up at root, tests for SDK `httpClient` / `typedStorage`,
  `mock-network`, reusable hooks, and catalog query/selection models (47 tests).
  GitHub Actions CI runs workspace `typecheck` + all package/app test scripts.
- Phase 10 — focused catalog a11y polish (drawer focus trap, bulk menu semantics, live status text),
  README screenshots, and [`docs/performance.md`](performance.md).

## Next

- Phase 9 (optional hardening) — container-level tests in `apps/product-catalog-admin` and focused
  helper tests for `data-hub` / `log-viewer` if their pure logic is split further.
- Continue optional hardening only where it clarifies the showcase: catalog container tests,
  keyboard interaction tests, and fresh screenshots after visual changes.

## Monorepo complexity levels

Fixed here so the project does not drift into overengineering.

### Level 1 — sensible starter (current)

- `pnpm-workspace.yaml`
- root `package.json`
- root `tsconfig.base.json`
- per-app/per-package `package.json` and `tsconfig.json`
- workspace dependencies between packages
- no project references

### Level 2 — solid showcase (reconsider later)

- project references
- a dedicated config package
- shared lint rules
- unified typecheck / build scripts

### Level 3 — overengineering (do NOT go here)

- turborepo / nx without a real need
- a too-complex shared infra layer
- abstractions for their own sake
- dozens of aliases
- premature automation
