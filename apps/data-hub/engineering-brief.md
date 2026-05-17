# Data Hub Engineering Brief

## Purpose In The Showcase

`data-hub` is the analytics-dashboard case study in this portfolio. It demonstrates how to build a React screen where multiple widgets read overlapping server data, cached freshness matters more than URL shareability, and optimistic mutation behavior can be expressed without hand-rolling a custom request state machine.

The app intentionally contrasts with `product-catalog-admin`: the catalog makes URL state and explicit request sequencing visible, while `data-hub` uses TanStack Query as the server-state owner.

## User Scenario

The user is a commercial or operations lead reviewing business health. In a five-minute review they can:

- filter analytics by date range, brand, and category;
- scan KPI cards for revenue, orders, conversion, and stockouts;
- inspect a revenue trend chart and revenue breakdown;
- manually refresh the dashboard while background refresh also runs;
- see when the server returns a stale snapshot;
- adjust a revenue target and see an optimistic update that rolls back on server conflict.

## Data Constraints

- The analytics backend is mocked in memory, but the app still calls it through `createHttpClient` and a fetch-compatible mock transport.
- Requests have 450-1100 ms latency and a small 503 flake rate, with one retry for retryable statuses.
- Dashboard data is aggregate-oriented: KPIs, time series, breakdown rows, and snapshot metadata are returned as one dashboard response for the selected filters.
- The dashboard uses a finite set of filters: `7d | 30d | 90d`, known brands, and known categories.
- `total` is not relevant because the dashboard does not render a pageable result set.
- Pagination and cursor state are out of scope; the data shape is chart/aggregate data, not an inspectable table.
- Every fifth dashboard response is intentionally marked stale and has an older `snapshotAt`, so the UI can surface freshness instead of pretending every response is current.
- The revenue target is mutable backend state and may reject updates with validation or conflict errors.
- Dashboard filters are debounced for 250 ms before they become query parameters, reducing rapid cache churn from immediate control changes.

## UX Constraints

- The dashboard should keep showing the previous dashboard response while a refetch is in flight.
- The user needs an explicit refresh action, plus automatic refetching on interval and window focus.
- Stale snapshots must be visible through status copy and badge state.
- Initial loading should reserve layout with skeletons instead of shifting the dashboard.
- Filter controls should stay responsive while dashboard data refreshes in the background.
- The revenue target should update optimistically and roll back when the server rejects the mutation.
- Mutation and load errors should be shown inline in the dashboard, not hidden in the console.
- Theme mode is controlled by the shared `ThemeProvider` and persisted via app-provided typed storage.
- URL shareability is not required for this app; the meaningful source of truth is the server-state cache.

## State Ownership

- **URL**: intentionally not a source of truth for dashboard filters or chart state.
- **Server-state cache**: TanStack Query owns filter options, dashboard snapshots, revenue target data, stale-while-revalidate behavior, invalidation, and optimistic mutation rollback.
- **Local component state**: current filter controls before the debounce delay, derived chart subtitle text, and local rendering state.
- **Mock backend state**: analytics route responses, request-count-based stale snapshots, and mutable revenue target state.
- **typedStorage**: local-only theme preference under the `data-hub:` prefix.

## Key Engineering Decisions

### TanStack Query as the server-state owner

- **Decision**: create one `QueryClient` in `main.tsx`, use tuple query keys from `analyticsQueryKeys`, and let TanStack Query own cache freshness, retries, background refresh, and invalidation.
- **Why**: the dashboard has several widgets reading the same dashboard response and a separate revenue-target resource. A server-state cache keeps those reads coherent without duplicating `useEffect` state machines.
- **Rejected alternatives**: hand-rolled `useEffect` fetch state per widget; Redux Toolkit Query with a Redux store the app does not otherwise need; URL-owned state as used by the catalog.
- **Trade-off**: cache-key shape becomes an important API, and the dashboard does not get bookmarkable filter state.

### One dashboard response for aggregate widgets

- **Decision**: fetch KPIs, time series, breakdown, filters echo, and snapshot metadata from `/analytics/dashboard`.
- **Why**: the widgets describe the same filtered business slice, so one response avoids drift between KPI and chart values.
- **Rejected alternatives**: one request per widget; precomputing everything in component state after independent API calls.
- **Trade-off**: a widget cannot refresh independently from the rest of the dashboard, but the case study keeps coherence and cache behavior easy to inspect.

### Debounced filters before query key changes

- **Decision**: keep filters in local state and pass a 250 ms debounced copy to the dashboard query key.
- **Why**: filter controls should feel immediate, but the cache should not create a new entry for every rapid intermediate change.
- **Rejected alternatives**: fetch on every control event; require an Apply button like the catalog filter draft.
- **Trade-off**: the chart lags a fraction of a second behind the control value, which is acceptable for dashboard filters.

### Stale-while-revalidate with visible freshness

- **Decision**: use `placeholderData: previous => previous`, `staleTime: 30_000`, `refetchInterval: 30_000`, refetch on window focus, and a visible snapshot/stale status row.
- **Why**: dashboard users need continuity while new data loads, but they also need to know when the visible snapshot is stale.
- **Rejected alternatives**: blank the dashboard during each refresh; silently replace data with no status; build a custom polling loop.
- **Trade-off**: a user may briefly see old values while refetching, but the status row makes that behavior explicit.

### Optimistic revenue-target mutation with rollback

- **Decision**: cancel revenue-target queries, store the previous value, write an optimistic target into the cache, roll back on error, and invalidate after settlement.
- **Why**: the target update is low-risk and easy to reverse, making it a good showcase for optimistic mutation behavior.
- **Rejected alternatives**: pessimistic mutation that waits for the server before changing the UI; local-only target state.
- **Trade-off**: the UI can show a target that the server later rejects, so rollback and inline error messaging are required.

### Fetch-compatible mock transport through the SDK

- **Decision**: app API functions call `createHttpClient`, which receives `createMockFetch(createAnalyticsMockRoutes())`.
- **Why**: the app exercises the same SDK boundary a production API would use while still running locally without a backend.
- **Rejected alternatives**: direct in-component mock data; direct route function calls that bypass HTTP semantics; MSW for this small showcase.
- **Trade-off**: the mock route table stays app-owned, while latency, flake, routing, and normalized HTTP errors come from shared infrastructure.

### Recharts for chart rendering

- **Decision**: use Recharts for the revenue trend chart.
- **Why**: the showcase is about state and data handling, not rebuilding a chart engine.
- **Rejected alternatives**: hand-rolled SVG charts; a heavier BI/charting framework.
- **Trade-off**: the app accepts a charting dependency and keeps chart customization focused.

## Package Usage

- `@frontend-showcase/ui`: `ThemeProvider`, `Badge`, `Button`, `Select`, `Skeleton`, `IconButton`, `useTheme`, and design tokens. The app uses shared primitives while keeping dashboard business logic local.
- `@frontend-showcase/sdk`: `createHttpClient` for API calls and `createTypedStorage` for theme preference persistence.
- `@frontend-showcase/hooks`: `useDebouncedValue` for filter-to-query-key debounce.
- `@frontend-showcase/mock-network`: dev/demo fetch transport with latency, flake rate, route matching, parsed query params, and JSON body handling.

## Non-Functional Requirements

- A11y: filters are labeled, status updates use `aria-live`, the target progress meter has an accessible label, and icon-only theme control has an accessible label.
- Performance: one dashboard response feeds multiple widgets, filter changes are debounced, previous data is retained during refresh, and chart rendering is delegated to Recharts.
- Testability: API functions, query keys, mock routes, and pure mock-data builders can be tested without rendering the app.
- Maintainability: API, mock server, types, and dashboard UI are separated under `features/analytics`; shared packages remain app-agnostic.
- No hidden state: query cache owns server data, component state owns only local controls, and typed storage owns only theme preference.
- No unnecessary dependencies: TanStack Query and Recharts are used where their domain value is visible; the app does not add a global client-state store.

## Out Of Scope

- Real backend persistence, auth, or multi-tenant access control.
- URL-owned dashboard filters or shareable dashboard links.
- Cursor pagination, table virtualization, or row-level drill-down.
- WebSocket/SSE realtime channels; the demo uses interval and focus refetching.
- Independent per-widget API resources.
- React Query Devtools wiring.
- Extracting shared TanStack Query conventions before another app needs them.

## Acceptance Criteria

- The dashboard loads filter options, KPIs, trend data, breakdown data, snapshot status, and revenue target through SDK-backed API functions.
- Changing range, brand, or category produces a debounced dashboard query and keeps the previous dashboard visible during refresh.
- Manual refresh, interval refresh, and refetch-on-focus are supported by TanStack Query behavior.
- A stale server response is visible as a stale snapshot notice with snapshot time.
- Revenue target updates optimistically, rolls back on conflict or validation failure, and invalidates the target query after settlement.
- Theme mode persists locally through `typedStorage` without becoming part of dashboard data state.
- The app consumes shared package contracts without importing another app or changing package APIs.
