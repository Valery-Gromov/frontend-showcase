# ADR 0005 — Server-state library (TanStack Query) for `data-hub`

- Date: 2026-05
- Status: Accepted (forward-looking; `data-hub` is not yet implemented in code)

## Context

`apps/data-hub` will host a number of read-heavy widgets (charts, KPI tiles, recent activity) that share overlapping data. Several of them must show **stale-while-revalidate**: a previous value is acceptable while a refetch is in flight, but the value must update without explicit user action.

Hand-rolling this with `useEffect` + `useState` was tried in `apps/product-catalog-admin` and works — but the catalog has one main fetch and a small set of mutations. The data hub has five or more. The duplication would be visible.

Alternatives:

1. **Hand-rolled `useFetch` hooks per widget**, with a tiny home-grown cache. Same shape as the catalog. Linear cost in number of widgets.
2. **Redux Toolkit Query (RTK Query)**. Strong, but pulls in a Redux store the rest of the app does not need.
3. **TanStack Query (`@tanstack/react-query`)**. Library specifically for server state. Built-in stale time, refetch on focus, invalidation, optimistic mutations.
4. **SWR**. Smaller, similar shape. Less ergonomic mutation API; smaller ecosystem of devtools.

## Decision

`apps/data-hub` uses **TanStack Query** as the server-state cache.

Conventions:

- One `QueryClient` per app, created in `main.tsx`.
- Query keys are tuples of literal segments + parameters: `['analytics', 'kpis', { range }]`. Keys are produced by helper functions, never inline-literal in components.
- `staleTime` defaults to 30 seconds and is overridden per-query when needed. `gcTime` defaults to 5 minutes.
- Mutations follow the optimistic-update + rollback pattern documented in TanStack Query's own examples. Pessimistic mutations stay in the catalog admin.
- The custom SDK (`createHttpClient`) still issues the actual HTTP. TanStack Query owns *when* to call, not *how*.

`apps/product-catalog-admin` deliberately **does not** adopt TanStack Query. The reason is captured directly: see [ADR 0003](0003-url-as-source-of-truth.md). The catalog's source of truth is the URL, not a cache; introducing a cache there would create two sources of truth that drift.

## Consequences

Pros:

- Five widgets sharing the same fetch share one resolved value automatically.
- Refetch-on-focus and on reconnect feel "live" without extra code.
- Optimistic updates with rollback are a thin wrapper, not a hand-rolled state machine.
- React Query Devtools is genuinely useful for diagnosing freshness.

Cons / boundaries:

- Runtime weight: ~13 KB gzipped. Acceptable for an analytics app.
- The cache key IS the API. Refactors that change parameter shape touch every place that builds keys.
- Background refetch can mask bugs (a wrong value gets corrected before you notice). The repo enables logging in dev so this stays visible.
- Different conventions across two apps in the same monorepo means the comparison must be loud — see [`docs/comparison.md`](../comparison.md).

Revisit when:

- A second app wants the same patterns. At that point a tiny `@frontend-showcase/server-state` package extracting the conventions becomes interesting. Premature today.
