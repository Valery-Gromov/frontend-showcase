# ADR 0003 — URL as source of truth for the catalog query

- Date: 2026-04
- Status: Accepted

## Context

`apps/product-catalog-admin` needs a query state that is durable, shareable, and observable. The state shape covers:

- `search`, `brand[]`, `category[]`, `sae[]`, `status` (filters).
- `page`, `pageSize` (pagination).
- `sort = { field, direction } | null`.

Options considered for where this lives:

1. **In component state** (`useState`). Simplest; the URL is unaware. Reloading the page or sharing a link loses the state.
2. **In `typedStorage`**. Survives reloads on the same machine; not shareable. Two browsers on different tabs drift.
3. **In a React state library (Zustand / Redux)**. Same drawbacks as component state, plus a runtime dependency.
4. **In the URL** (`?search=...&page=2&sort=name:asc`). Shareable, reproducible, browser-history aware. Requires a parse / serialize layer.

## Decision

The URL is the **single source of truth** for catalog query state. The container reads it on mount and on `popstate`; user actions mutate it via `pushState` / `replaceState`. Component state is a *projection* of the URL — never the other way around.

Concretely:

- A `readProductQueryFromUrl(search): ProductQuery` and `writeProductQueryToUrl(query, mode): void` pair in [`features/productCatalog/model/queryState.ts`](../../apps/product-catalog-admin/src/features/productCatalog/model/queryState.ts).
- A request-sequence guard (`useRequestSequence`) gates async commits because the URL can change while a fetch is in flight.
- Personal UX preferences (e.g. `filtersOpen`) live in `typedStorage`, NOT in the URL: they should persist between sessions on this machine but should not appear in shared links.
- Selection is **not** in the URL (potentially thousands of IDs). It lives in component state and carries a `querySnapshot` that pins it to the query that produced it — see [ADR 0004](0004-selection-state-with-query-snapshot.md).

## Consequences

Pros:

- A pasted link reproduces the exact view, including sort and pagination.
- Browser back / forward works natively, including across query edits.
- Reload is a recovery action.
- Server logs become richer: the URL is the query.

Cons / boundaries:

- Every state mutation pays for URL serialization / parsing. Hot paths (typing in the search field) require a *draft* buffer plus apply-on-submit; otherwise typing rewrites history. The catalog uses a separate `filterDraft` for this.
- A confirmation flow is needed when an active selection would be invalidated by a URL change (back button, filter reset). The container shows a `QueryChangeConfirmDialog` and rolls back the URL via `replaceState` if the user cancels.
- Future query-shape changes need a migration story (we add new fields; we do not rename existing ones).

Revisit when:

- The query shape grows past what fits a URL (free-text rich filters, arbitrary boolean trees). At that point a server-side "saved view" with a short opaque ID becomes the URL parameter, and the rich shape lives behind it.
