# Comparing data-heavy approaches

Three applications in this repository tackle "show a lot of changing data" from three different angles. The differences are deliberate. This document explains what each app chose, why, and what would have made the wrong choice expensive.

If you only read one part — read the [decision matrix](#decision-matrix) at the bottom.

| App | Pattern | Data style | Why this pattern |
| --- | --- | --- | --- |
| [`apps/product-catalog-admin`](../apps/product-catalog-admin) | URL as source of truth + hand-rolled async state | Filtered/sorted/paginated B2B catalog | Shareable links, deterministic state, complex selection that can outlive a single page |
| [`apps/data-hub`](../apps/data-hub) | Server-state cache (TanStack Query) | Dashboards with aggregates and charts | Many widgets depend on the same data, stale-while-revalidate matters more than URL shareability |
| [`apps/log-viewer`](../apps/log-viewer) | Cursor pagination + virtualization | Append-mostly log stream | Total size unknown / unbounded; offset pagination is wrong; the user mainly scrolls forward |

## 1. URL-driven state (`product-catalog-admin`)

### What it looks like

Query state — `search`, multi-select facets, status, page, page size, sort — is encoded into `?search=...&brand=A,B&page=3&sort=name:asc`. Component state is derived from the URL on mount and on `popstate`. User actions mutate the URL via `pushState` / `replaceState`; the URL becomes the next input.

### What it gives you

- Shareable links: paste into Slack, get the same filtered view.
- Free browser-history navigation (back / forward).
- "Reload the page" is a recovery action, not a destructive one.
- The state shape is observable from the address bar — easy to reproduce bug reports.

### What it costs

- Every state mutation has to round-trip through URL serialization / parsing — non-trivial schema if filters are rich.
- You need a separate "draft" buffer when filters apply on submit, not on every keystroke (otherwise typing rewrites history).
- The browser back button can race with in-flight requests — race-condition guard required.
- Selection cannot live in the URL (it can contain thousands of IDs); selection is a separate state with its own snapshot of the query.

### What this app actually solves

- **Race conditions**: `useRequestSequence` issues a token before each fetch; the result is dropped if a newer token has been issued.
- **Partial success on bulk**: the API returns `{ success: string[], failed: BulkFailure[] }`; the UI shows both outcomes, with details on demand.
- **External mutations**: a periodic version probe (`useExternalChangeDetector`) flips an "outdated" notice if the underlying data changed since the last fetch.
- **Complex selection**: `none | some | allMatching`. `allMatching` carries `excludedIds[]` and a `querySnapshot` so the selection survives pagination but stays scoped to the query that produced it.

### When you should NOT pick this

- When the query is huge (free-text filters, dozens of facets) — encoding into the URL is messy.
- When data is private and reading the URL is a leak (PII in query params).
- When the page is not the unit of sharing (a widget inside a parent app).

## 2. Server-state cache (`data-hub`)

### What it looks like

Every "ask the server" is wrapped in a `useQuery` keyed by an explicit cache key. The cache keeps the latest known value; refetches happen on focus, on a timer, and on invalidation. Mutations write to the server, then invalidate (or optimistically update) the relevant cache keys.

### What it gives you

- One source of truth for "what does the server know right now": every widget reading the same data sees the same value automatically.
- Stale-while-revalidate: the user sees the previous data instantly while the next fetch is in flight.
- Background revalidation on focus or reconnect — feels live without code.
- Optimistic updates with rollback are a small wrapper, not a custom state machine.

### What it costs

- The cache key is the API. Picking it badly turns every refactor into a hunt.
- The cache is opaque to the URL — bookmarks do not capture which slice of data is on screen.
- Long-running mutations require care: optimistic update + rollback + retry semantics.
- The library is meaningful runtime weight; using it for a single screen is overkill.

### Why `data-hub` specifically

- Five+ widgets read overlapping aggregates. Hand-rolling cache invalidation per widget would duplicate effort and introduce drift.
- A "30s freshness" SLA on every chart maps cleanly to query-level `staleTime`.
- URL state is irrelevant: nobody bookmarks "the dashboard at 14:23".

### When you should NOT pick this

- When there is exactly one screen and one fetch — `useEffect` is enough.
- When the URL really is the source of truth — pulling state out of the URL into a cache means two sources of truth, and they will drift.
- When mutations must be strictly pessimistic (banking, audited workflows) — optimistic patterns and TanStack-style caches push you in the other direction.

## 3. Cursor pagination + virtualization (`log-viewer`)

### What it looks like

The API serves `?cursor=<opaque>&limit=200` and returns `{ items, nextCursor }`. The client keeps an array of fetched items in component state, fetches the next page when scroll approaches the bottom, and renders only the visible window via `@tanstack/react-virtual`. "Live tail" appends new items at the top (or bottom) when paused; scrolling away pauses the auto-follow.

### What it gives you

- Constant DOM size regardless of how many rows are loaded.
- No "skip records" bug when items are inserted or removed during paging — cursor positions are stable.
- Memory cost scales with what is loaded, not with what could be loaded.
- The pattern is correct for unbounded data sources (logs, activity feeds, event streams).

### What it costs

- The cursor is opaque — you cannot jump to "page 5". For logs, that is acceptable; for a catalog, it is not.
- "Deep linking" to a specific row is hard. Workaround: a separate `?around=<id>` endpoint that returns a window centered on a row.
- Sticky scroll behavior ("stay at the bottom unless I scroll up") is fiddly to get right; we expose it as a small finite state machine.
- Virtualization changes how a11y, search-in-page, and devtools inspection feel — the trade-off is intentional.

### When you should NOT pick this

- When the user needs random access (pagination controls, "go to page N").
- When the total count is small (a few hundred rows) — virtualization adds complexity without benefit.
- When rows have wildly different heights and measuring them is expensive — the virtualizer will recalculate often.

## Decision matrix

| Question | Catalog admin | Data hub | Log viewer |
| --- | --- | --- | --- |
| Is the query shareable via a link? | Yes | No | Partial (filter only) |
| Is the dataset bounded? | Yes (thousands) | Yes (aggregates) | No (unbounded stream) |
| Does the URL define what is on screen? | Yes | No | Mostly no |
| Does the same fetch back many widgets? | No | Yes | No |
| Is random access required? | Yes | N/A | No |
| Are mutations optimistic-friendly? | No (pessimistic, partial-success) | Yes | Read-mostly |
| Does external mutation matter? | Yes (notice + refresh) | Yes (refetch on focus) | Yes (live tail) |
| Is virtualization required? | Optional | No | Yes |

## What would change with infinite engineering budget

- The catalog admin could add **server-driven views** (saved filter sets) backed by a tiny backend table — the URL stays the source of the *current* view, the server stores **named** views.
- The data hub could ship a thin **realtime channel** (WebSocket or SSE) for the most active charts and downgrade `staleTime`-based polling.
- The log viewer could persist the "cursor at last scroll" in `typedStorage` so reloading a tab returns the user to the same neighborhood instead of the top.

None of these are in scope for this repository — they are listed here as honest extension points, not aspirations.
