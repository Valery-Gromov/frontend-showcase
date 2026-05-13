# ADR 0002 — Controlled organisms with no hidden state

- Date: 2026-04
- Status: Accepted

## Context

The reusable organisms in [`packages/ui/src/organisms`](../../packages/ui/src/organisms) — `DataTable`, `FilterBar`, `BulkActionBar` — are the most expensive surfaces in the repository. They sit on the boundary between "design system" and "feature", and their API shape drives how every consuming app is written.

Two failure modes were already visible in earlier iterations:

1. **Hidden state inside the organism.** A `DataTable` that owns its own `selection: SelectionState` looks like it works in isolation, but in a real screen it forces the parent to mirror the state back via `onSelectionChange` and to fight with the organism's internal source of truth. Bulk actions, "select all matching", and URL-driven state all become subtly wrong.
2. **Network calls inside the organism.** A `FilterBar` that owns `fetch('/products/options')` couples the design system to the API and makes it untestable.

Alternatives considered:

1. **Uncontrolled organisms** (state inside) with optional `defaultValue` / `onChange`. Easy to wire up; expensive to debug.
2. **Controlled organisms** (no state inside) with `props in` / `events out`. Verbose at the call site; predictable everywhere.
3. **Hybrid** (some props controlled, some uncontrolled). Worst of both worlds — you have to memorize which is which.

## Decision

Every organism in `packages/ui` is **fully controlled**:

- Every visible state lives in a prop the parent passes in (`selection`, `sort`, `value`, `loadState`, ...).
- The organism emits events (`onSelectionChange`, `onSortChange`, `onApply`, ...) and the parent decides what to do.
- The organism does not call `useState` for anything that is observable from outside. Local, pure-render state (e.g. `useId`) is allowed.
- The organism does not fetch. Data is passed as `rows`, `options`, etc.

Knock-on rules:

- An organism's props type is the contract; if a story needs a new behavior, the contract changes — not a hidden flag.
- The selection model is the same shape (`SelectionState`) wherever it appears; see [ADR 0004](0004-selection-state-with-query-snapshot.md).
- Loading / error / empty states are part of the controlled API (`loadState: 'idle' | 'loading' | 'refreshing' | 'error' | 'success'`), not derived from props by guesswork.

## Consequences

Pros:

- The same organism slots into very different container shapes — `product-catalog-admin` with URL-driven state and `data-hub` with TanStack Query both use `DataTable` unchanged.
- Bulk actions, race-condition guards, and "outdated data" notices all live in the container where they belong, with no organism cooperation required.
- Tests for organisms become pure props-in / DOM-out — no API mocks, no `act()` gymnastics for state transitions.
- Code review can verify "is this controlled?" mechanically: search for `useState` in `packages/ui/src/organisms` — if it appears, that is a smell.

Cons / boundaries:

- Container code is larger. We accept this as a feature: the complexity is visible, not hidden.
- A naive consumer who only needs a quick table writes more wiring than with an uncontrolled library. The `apps/todo-app` sandbox demonstrates this is still cheap.
- Cross-cutting interactions (e.g. "scroll to selected row after sort") become container concerns; we live with this for now.

Revisit when:

- An organism grows enough internal complexity that the controlled API has dozens of props. At that point split the organism into smaller pieces rather than introducing hidden state.
