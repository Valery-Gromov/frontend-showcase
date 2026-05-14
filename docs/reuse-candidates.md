# Reuse Candidates

Working register for patterns that appear useful across apps but are not yet promoted into shared package APIs.

Use this file after app audits to separate "this could be shared" from "this should be shared now". A candidate should move into `packages/*` only after at least two real consumers make the shared boundary cheaper than local ownership.

## Review Criteria

- Does the pattern appear in more than one app?
- Is the behavior generic, or does it encode app/domain rules?
- Which package would own it: `packages/hooks`, `packages/ui`, `packages/sdk`, or `packages/mock-network`?
- Would extraction reduce duplicated complexity without hiding important showcase logic?
- What tests would protect the shared API?
- What would be lost if the code stayed local?

## Product Catalog Admin

Source: `apps/product-catalog-admin` app audit on 2026-05-14.

### URL Query With Guarded Popstate Confirmation

- **Where it appears**: `apps/product-catalog-admin/src/features/productCatalog/model/queryState.ts` and `ProductCatalogContainer.tsx`.
- **Pattern**: parse/serialize URL query state, push/replace history, listen to `popstate`, and ask for confirmation before applying a URL change that invalidates local state.
- **Potential target package**: `packages/hooks`.
- **Why it could be shared**: the repo already has `useUrlQueryState`; a guarded confirmation layer may become useful if another app needs URL-owned state plus dirty/selection protection.
- **Why not extract now**: the current invalidation rule is catalog-specific because it depends on active selection and URL rollback semantics.
- **Next evidence needed**: another app with URL-owned state that needs a comparable confirm-or-rollback flow.

### Drawer Focus Trap And Focus Restore

- **Where it appears**: `apps/product-catalog-admin/src/features/productCatalog/components/ProductEditorDrawer.tsx`.
- **Pattern**: capture previous focus, move focus into the drawer, trap Tab/Shift+Tab, close on Escape, and restore focus on unmount.
- **Potential target package**: `packages/ui`.
- **Why it could be shared**: a generic drawer/dialog primitive would keep modal accessibility consistent across apps.
- **Why not extract now**: there is only one production-style drawer consumer; extracting now would force a public API before enough use cases are known.
- **Next evidence needed**: a second drawer/dialog with the same focus behavior in another app, or a planned shared modal primitive in `packages/ui`.

### Domain Mock Server With Version Drift And Partial Bulk Results

- **Where it appears**: `apps/product-catalog-admin/src/features/productCatalog/api/mockServer.ts`.
- **Pattern**: app-owned in-memory dataset, version probing for external changes, partial-success mutation results, and route handlers behind `createMockFetch`.
- **Potential target package**: `packages/mock-network`.
- **Why it could be shared**: route-level scenario helpers could reduce repeated mock-server plumbing across apps.
- **Why not extract now**: product data, selection resolution, and bulk conflicts are domain behavior. `packages/mock-network` should stay transport-level unless multiple apps repeat the same scenario primitives.
- **Next evidence needed**: another app needing version drift or partial-success helpers with domain-neutral shape.
