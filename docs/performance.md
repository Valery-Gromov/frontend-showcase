# Performance Notes

This repository is a frontend showcase, so the performance goal is not "perfect scores"; the goal is
to show that each data-heavy pattern has an explicit budget and a clear reason for its trade-offs.

## Budgets

| Surface | Budget | Why |
| --- | --- | --- |
| `product-catalog-admin` query change | Keep stale async responses from committing; keep table interaction responsive while 500-1200ms mock latency is in flight | The catalog is deliberately slow-server-first, so correctness under latency matters more than pretending the network is fast |
| `data-hub` initial production JS | Split chart/query vendors from app code; keep app entry chunk small | Recharts is intentionally used, but it should not hide the dashboard logic inside one large bundle |
| `log-viewer` scroll | Keep rendered rows close to viewport size plus overscan | The point of the app is bounded DOM cost for an unbounded stream |
| Workspace verification | Keep `pnpm -r typecheck` + `pnpm test` comfortably under a minute on a laptop | The repo should remain easy to review and iterate on without monorepo orchestration overhead |

## What is measured today

- `pnpm -r typecheck` verifies every app/package TypeScript project.
- `pnpm test` runs all package/app test scripts, currently covering SDK HTTP/storage behavior,
  mock-network, reusable hooks, and catalog query/selection models.
- `pnpm --filter @frontend-showcase/data-hub build` checks dashboard production chunking:
  `react`, `query`, `charts`, and app entry are split by `apps/data-hub/vite.config.ts`.
- `pnpm --filter @frontend-showcase/log-viewer build` checks virtualizer/app chunking:
  `react`, `virtualizer`, and app entry are split by `apps/log-viewer/vite.config.ts`.

## App-specific notes

### Catalog

- Race protection is explicit: `useRequestSequence()` drops stale responses instead of trying to
  cancel every possible request source.
- URL state is serialized by pure functions and covered by tests; malformed `page`, `pageSize`, and
  `sort` values normalize to safe defaults.
- Selection count avoids guessing when `total` is unknown; `allMatching` with `total = null` returns
  `0` rather than presenting a false count.

### Data Hub

- TanStack Query owns freshness: `staleTime`, `refetchOnWindowFocus`, and a 30s refetch interval are
  configured in the app root.
- The dashboard keeps previous data during refetch (`placeholderData`) so filter changes do not blank
  the chart while the mock API is delayed.
- Recharts is isolated into a `charts` chunk so the app entry stays readable in build output.

### Log Viewer

- `@tanstack/react-virtual` renders only the visible row window plus overscan, not the full loaded log
  list.
- Cursor pagination uses an opaque cursor derived from sequence position. The UI does not expose page
  numbers because random access is not a correct model for append-only logs.
- Live tail only auto-follows while the user is near the bottom. Scrolling up pauses follow mode and
  prevents viewport jumps while inspecting older logs.

## Future measurement pass

When browser automation is available, capture:

- Lighthouse or Web Vitals smoke numbers for each app in production preview.
- Scroll FPS and long-task traces while `log-viewer` has 5,000+ loaded rows.
- Interaction latency for catalog filter apply, bulk action menu, and drawer open/close.
- Repeat screenshot capture for catalog light/dark, data-hub, and log-viewer after major visual
  changes; current PNGs live in `docs/assets/screenshots/`.
