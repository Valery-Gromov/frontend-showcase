# ADR 0004 — `SelectionState` with `querySnapshot` for `allMatching`

- Date: 2026-04
- Status: Accepted

## Context

Bulk-edit screens routinely offer three selection modes:

1. **None** — nothing selected.
2. **Some** — a small explicit list of rows.
3. **All matching** — "everything that matches the current filter", possibly with a few rows explicitly excluded.

Naively this is modeled as `ids: string[]` plus a `selectAll: boolean`. That model breaks in three places:

- When the user paginates after "select all", later pages do not auto-extend the selection unless the UI does extra work.
- When the user changes the query while the selection is active, `selectAll` silently re-targets a different set of rows — a real footgun for destructive bulk actions.
- The server cannot honor "select all matching" without seeing the *exact* filter the user agreed to.

## Decision

Model selection as a discriminated union ([`packages/ui/src/organisms/DataTable.tsx`](../../packages/ui/src/organisms/DataTable.tsx)):

```ts
type SelectionState =
  | { mode: 'none' }
  | { mode: 'some'; ids: string[] }
  | { mode: 'allMatching'; excludedIds: string[]; querySnapshot: unknown };
```

Rules:

- `some` carries the explicit ID list. Adding the last row of the page must NOT auto-promote to `allMatching`.
- `allMatching` carries `excludedIds[]` and a `querySnapshot` (typed `unknown` in the library, narrowed by the consumer to its own query shape).
- The container — not the organism — decides what to do when the underlying query changes while the selection is `allMatching`. The catalog shows a confirmation dialog and rolls back the URL change on cancel.
- Bulk action handlers receive the entire `SelectionState`. The server-side handler resolves `allMatching` against `querySnapshot`, applies `excludedIds`, and returns a per-row partial-success result.

## Consequences

Pros:

- Bulk actions are auditable: every action carries the exact selection intent, not a "what was on screen at the time" approximation.
- The query snapshot acts as a contract: if the user changes filters after selecting, the UI must decide to keep or drop the selection — no silent re-targeting.
- The same shape works for both small explicit selections and unbounded "all matching" selections without inflating the wire format.

Cons / boundaries:

- The consumer must reason about three modes everywhere it touches selection. We accept this — a helper (`isSelectionActive`, `getSelectedCount`) keeps the call sites short.
- `querySnapshot: unknown` is loosely typed inside the library because the library does not know the query shape. Each consumer casts at the boundary; the type safety lives in the container.
- The server has to understand the query shape to resolve `allMatching`. For the mock that is trivial; for a real backend that is a real endpoint contract.

Revisit when:

- A real backend constraints the size of `excludedIds` (e.g. URL/body limits). At that point either the wire format gains pagination of its own or the selection becomes a server-side resource (`POST /selections`).
