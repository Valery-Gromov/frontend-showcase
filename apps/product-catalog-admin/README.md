# Product Catalog Admin

Data-heavy admin case study for a B2B product catalog. The app is built to make state ownership visible: the URL owns the catalog query, the mock backend owns rows and version drift, and controlled shared UI components render without hidden business state.

See the full [engineering brief](engineering-brief.md) for requirements, constraints, and trade-offs.

## Why This App Exists In The Showcase

This app demonstrates the hard parts of admin UI that are easy to hide in small demos: slow requests, shareable filters, query invalidation, partial-success mutations, external data changes, and explicit state ownership.

## What It Demonstrates

- URL as the source of truth for filters, sorting, and pagination.
- Controlled table/filter/bulk UI wired from app-owned state.
- Pessimistic bulk mutations with partial-success handling.
- Race-condition protection with `useRequestSequence`.
- External-change detection and refresh notice.
- Create/edit drawer with dirty-state confirmation.
- Excel import flow where backend validation owns the result.
- SDK usage through `createHttpClient({ fetch: mockFetch })`.
- Catalog preferences persisted with `typedStorage`.

## Key Engineering Decisions

- The catalog query lives in the URL, not in a cache or global store. See [`docs/decisions/0003-url-as-source-of-truth.md`](../../docs/decisions/0003-url-as-source-of-truth.md).
- Selection uses the shared `SelectionState` contract and stays owned by the container. See [`docs/decisions/0004-selection-state-with-query-snapshot.md`](../../docs/decisions/0004-selection-state-with-query-snapshot.md).
- The app deliberately does not use TanStack Query; [`docs/comparison.md`](../../docs/comparison.md) contrasts this URL-driven approach with `data-hub` and `log-viewer`.
- Mock API behavior runs through `@frontend-showcase/mock-network` and the SDK instead of direct `setTimeout` mocks. See [`docs/decisions/0006-mock-network-package.md`](../../docs/decisions/0006-mock-network-package.md).

## Key Files

- `src/features/productCatalog/containers/ProductCatalogContainer.tsx` — state orchestration.
- `src/features/productCatalog/model/queryState.ts` — URL query parse/serialize logic.
- `src/features/productCatalog/model/selection.ts` — selected-count and active-selection rules.
- `src/features/productCatalog/api/mockProductCatalogApi.ts` — app API adapter over SDK.
- `src/features/productCatalog/api/mockServer.ts` — mock routes and in-memory catalog DB.
- `engineering-brief.md` — deeper constraints and decision record for this app.

## How It Uses Shared Packages

- `@frontend-showcase/ui`: controlled table, filter, bulk-action, form, theme, and status primitives.
- `@frontend-showcase/sdk`: HTTP client and typed storage.
- `@frontend-showcase/hooks`: request sequencing and external-change detection.
- `@frontend-showcase/mock-network`: fetch-compatible demo transport injected into the SDK.

## Running / Testing

```bash
pnpm --filter @frontend-showcase/product-catalog-admin dev
pnpm --filter @frontend-showcase/product-catalog-admin test
pnpm --filter @frontend-showcase/product-catalog-admin build
```

## Trade-offs

The app intentionally does not use TanStack Query. The catalog query is shareable and mutations are pessimistic with partial-success semantics, so a small explicit state machine is easier to inspect than a server-state cache.

The shared `SelectionState` contract includes `allMatching` for bulk endpoints and reusable UI, but the current catalog UI only exposes explicit row/page selection. A dedicated "select all matching filters" affordance would be a follow-up, not a documented shipped workflow.
