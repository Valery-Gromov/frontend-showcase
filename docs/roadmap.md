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
- `apps/data-hub`: architecture notes only (C4 diagrams), no application code yet.
- Phase 4 — UI design system uplift: Material 3-inspired token layer (`tokens.css`), `ThemeProvider` with `prefers-color-scheme` + persisted preference, CSS Modules across atoms, molecules and organisms, app-level stylesheets rebased onto the same tokens (no hex literals outside `tokens.css`). Implementation record: [`docs/design-system-phase4.md`](design-system-phase4.md).
- Phase 7 — `docs/comparison.md` (catalog vs. dashboard vs. log viewer).
- Phase 8 — full ADR set in `docs/decisions/` (0001–0007).
- Phase 9 (initial slice) — Vitest set up at root, tests for SDK `httpClient` / `typedStorage` and `mock-network` (27 tests), GitHub Actions CI running `typecheck` + `test`.

## Next

- Phase 5 — `apps/data-hub` as a real analytics dashboard on TanStack Query + Recharts.
- Phase 6 — `apps/log-viewer` with cursor pagination + `@tanstack/react-virtual`.
- Phase 9 (rest) — hooks tests (`@testing-library/react` + jsdom), container-level tests in `apps/product-catalog-admin`.
- Phase 10 — final polish (a11y audit, screenshots, performance notes).

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
