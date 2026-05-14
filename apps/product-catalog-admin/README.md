# Product Catalog Admin

Data-heavy admin app for a B2B product catalog.

## What It Demonstrates

- URL as the source of truth for filters, sorting, and pagination.
- Selection model with `none | some | allMatching` and query snapshots.
- Pessimistic bulk mutations with partial-success handling.
- Race-condition protection with `useRequestSequence`.
- External-change detection and refresh notice.
- SDK usage through `createHttpClient({ fetch: mockFetch })`.
- Catalog preferences persisted with `typedStorage`.

## Key Files

- `src/features/productCatalog/containers/ProductCatalogContainer.tsx` — state orchestration.
- `src/features/productCatalog/model/queryState.ts` — URL query parse/serialize logic.
- `src/features/productCatalog/model/selection.ts` — selected-count and active-selection rules.
- `src/features/productCatalog/api/mockProductCatalogApi.ts` — app API adapter over SDK.
- `src/features/productCatalog/api/mockServer.ts` — mock routes and in-memory catalog DB.

## Running / Testing

```bash
pnpm --filter @frontend-showcase/product-catalog-admin dev
pnpm --filter @frontend-showcase/product-catalog-admin test
pnpm --filter @frontend-showcase/product-catalog-admin build
```

## Trade-offs

The app intentionally does not use TanStack Query. The catalog query is shareable, selection is
coupled to the URL snapshot, and mutations are pessimistic with partial-success semantics, so a
small explicit state machine is easier to inspect than a server-state cache.
