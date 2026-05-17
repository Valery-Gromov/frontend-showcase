# Data Hub

Analytics dashboard case study for server-state caching, stale-while-revalidate UX, chart rendering, and optimistic mutation behavior.

For the full rationale, read [`engineering-brief.md`](engineering-brief.md). For the cross-app comparison, read [`docs/comparison.md`](../../docs/comparison.md) and ADR [`0005-tanstack-query-for-data-hub.md`](../../docs/decisions/0005-tanstack-query-for-data-hub.md).

## Why This App Exists In The Showcase

`data-hub` demonstrates the opposite data ownership choice from the catalog admin. The dashboard does not need shareable URL state; it needs one coherent server-state cache feeding KPI cards, a revenue chart, a breakdown panel, freshness status, and a mutable revenue target.

## What It Demonstrates

- TanStack Query cache keys, stale time, placeholder data, refetch-on-focus, interval refresh, invalidation, and optimistic rollback.
- Recharts as the charting layer for revenue trend visualization.
- SDK transport injection through `createHttpClient({ fetch: createMockFetch(...) })`.
- Mock latency, retryable 503s, stale snapshots, and conflict-prone target updates.
- Shared UI tokens and primitives with persisted theme preference.

## Key Engineering Decisions

- Server-state cache owns API data; local component state owns only filter controls before debounce.
- Dashboard widgets use one aggregate response so KPIs, chart, breakdown, and snapshot metadata cannot drift.
- Filters are debounced before they become query-key input.
- Previous dashboard data remains visible during refresh, while the status row exposes refresh and stale snapshot state.
- Revenue target updates optimistically, rolls back on server rejection, and invalidates after settlement.

## Key Files

- [`src/main.tsx`](src/main.tsx) — QueryClient and ThemeProvider wiring.
- [`src/features/analytics/AnalyticsDashboard.tsx`](src/features/analytics/AnalyticsDashboard.tsx) — dashboard queries, mutation, filters, chart, and panels.
- [`src/features/analytics/api/analyticsApi.ts`](src/features/analytics/api/analyticsApi.ts) — SDK-backed API adapter and query keys.
- [`src/features/analytics/api/mockServer.ts`](src/features/analytics/api/mockServer.ts) — analytics routes, stale snapshot simulation, and revenue-target mutation behavior.
- [`src/app/themeStorage.ts`](src/app/themeStorage.ts) — typedStorage adapter for theme persistence.

## How It Uses Shared Packages

- `@frontend-showcase/ui`: ThemeProvider, Badge, Button, Select, Skeleton, IconButton, `useTheme`, and design tokens.
- `@frontend-showcase/sdk`: HTTP client and typed local storage.
- `@frontend-showcase/hooks`: `useDebouncedValue` for filter-to-query debounce.
- `@frontend-showcase/mock-network`: fetch-compatible mock API with latency, flake rate, query parsing, and JSON body handling.

## Running / Testing

```bash
pnpm --filter @frontend-showcase/data-hub dev
pnpm --filter @frontend-showcase/data-hub typecheck
pnpm --filter @frontend-showcase/data-hub test
pnpm --filter @frontend-showcase/data-hub build
```

App-local tests cover analytics mock route behavior and focused component regressions. Shared contract coverage also lives in `packages/sdk`, `packages/hooks`, and `packages/mock-network`.

## Trade-offs

- Dashboard filters are not encoded in the URL; this keeps server-state ownership clean but gives up bookmarkable dashboard slices.
- The dashboard fetches one aggregate response, so widgets stay coherent but cannot refetch independently.
- TanStack Query and Recharts add runtime dependencies because they demonstrate domain-specific value in this app.
- Mock data is deterministic enough for a showcase, but it is not a production analytics backend.
