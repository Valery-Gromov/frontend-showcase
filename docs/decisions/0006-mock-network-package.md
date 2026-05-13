# ADR 0006 — Standalone `packages/mock-network` instead of in-app `delay()`

- Date: 2026-05
- Status: Accepted

## Context

In `apps/product-catalog-admin` the mock API originally lived inside the app: functions like `fetchProducts` and `executeBulkAction` used `setTimeout` to imitate latency, used randomness for partial success, and held the "database" as a module-level array. See [`apps/product-catalog-admin/src/features/productCatalog/api/mockProductCatalogApi.ts`](../../apps/product-catalog-admin/src/features/productCatalog/api/mockProductCatalogApi.ts).

Problems:

1. The SDK (`httpClient`) sits next door, yet it is not used — the "I have my own SDK" story is invisible.
2. Each next application (`data-hub`, `log-viewer`) duplicates the same latency / race logic.
3. Tests cannot reuse the same mock without copy-paste.
4. Switching an app to a real API would require rewriting the call sites because they do not go through a `fetch`-shaped transport.

Alternatives:

1. **Keep as is**: in-app mocks. Simple and works, but does not scale.
2. **MSW (Mock Service Worker)**: a strong solution that intercepts real `fetch`. Extra runtime and tooling weight just for a demo.
3. **Standalone `packages/mock-network` with `createMockFetch(routes)`**: returns a `fetch`-compatible function that plugs into `createHttpClient({ fetch })` from the SDK. The app runs against the real API style.

## Decision

Adopt **option 3**.

- A new package `packages/mock-network`.
- `createMockFetch(routes, options)` returns a function compatible with the global `fetch`. It imitates:
  - latency 500–1200 ms (configurable).
  - out-of-order responses (concurrent calls may return in reverse order).
  - random 5xx (opt-in).
  - partial success on bulk operations.
  - periodic "external" mutations of the database (to demonstrate the stale-data notice).
- The SDK extends `createHttpClient({ fetch })`: `fetch` becomes injectable; the default is the global `fetch`, and in dev/demo it is `mockFetch`.

## Consequences

Pros:

- The app speaks the real API style (`httpClient.get('/products')`, `httpClient.post('/products/bulk')`). Switching to a real backend is one constructor parameter.
- The SDK is actually used — the story holds together.
- SDK tests can use `createMockFetch` to exercise error cases.
- Every app shares one infrastructure for imitation.

Cons / boundaries:

- `mock-network` must not be imported from production code in apps (it is dev-only). Enforced by the rules in [`docs/dependency-graph.md`](../dependency-graph.md).
- It is still an in-memory mock. Not a substitute for a real server — but that is by design.

Revisit when:

- Cross-tab synchronization or network-level simulation (offline / flaky network) is needed — consider MSW.
