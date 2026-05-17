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

## Data Hub

Source: `apps/data-hub` app audit on 2026-05-17.

### Query Key Factory And Optimistic Mutation Convention

- Source app: `data-hub`
- Current locations:
  - `apps/data-hub/src/features/analytics/api/analyticsApi.ts`
  - `apps/data-hub/src/features/analytics/AnalyticsDashboard.tsx`
- Proposed target: `packages/hooks`
- Rationale: TanStack Query tuple key factories plus the cancel/snapshot/set/rollback/invalidate mutation shape are easy to repeat incorrectly once a second server-state-cache app exists.
- Status: deferred
- Why not extract now: `data-hub` is currently the only TanStack Query consumer, and extracting a Query-specific hook would add package-level dependency and API commitments before there is a second real use case.
- Risk: a premature helper could hide cache-key shape, make mutation behavior less explicit, or pull TanStack Query into `packages/hooks` for one app.
- Suggested verification: add hook-level tests with a QueryClient test harness and an app smoke test that confirms optimistic update, rollback, and invalidation behavior.

### Theme Mode Toggle Control

- Source app: `data-hub`
- Current locations:
  - `apps/data-hub/src/app/ThemeToggle.tsx`
  - `apps/log-viewer/src/app/ThemeToggle.tsx`
  - `apps/product-catalog-admin/src/app/ThemeToggle.tsx`
  - `apps/todo-app/src/ThemeToggle.tsx`
- Proposed target: `packages/ui`
- Rationale: the mode cycle and accessible labels are duplicated across apps that already consume the shared `ThemeProvider` and `IconButton`.
- Status: candidate
- Why not extract now: icon treatment differs between apps (`SYS/L/D` text in some apps, symbolic icons in others), so a shared component needs a small API decision rather than a blind copy.
- Risk: centralizing the control could make app headers less flexible if the component hard-codes icons, labels, or density.
- Suggested verification: UI typecheck plus app builds for every consumer, and a focused render test for accessible labels and mode cycling if the shared component is added.

### Analytics Mock Stale Snapshot Scenario

- Source app: `data-hub`
- Current locations:
  - `apps/data-hub/src/features/analytics/api/mockServer.ts`
- Proposed target: `packages/mock-network`
- Rationale: request-count-triggered stale responses and mutable mock resource state are useful demo primitives for data freshness scenarios beyond analytics.
- Status: deferred
- Why not extract now: the current implementation is tightly tied to analytics filters, generated series, and revenue target conflicts. `packages/mock-network` should stay transport-level until a second app needs domain-neutral stale-snapshot helpers.
- Risk: extracting scenario behavior into mock-network could blur the package boundary between generic transport and app-owned fake backend behavior.
- Suggested verification: mock-network route tests for deterministic stale cadence and app-level smoke verification that stale status appears after the configured cadence.

### Dashboard Panel And KPI Card Primitives

- Source app: `data-hub`
- Current locations:
  - `apps/data-hub/src/features/analytics/AnalyticsDashboard.tsx`
  - `apps/data-hub/src/features/analytics/AnalyticsDashboard.module.css`
- Proposed target: `packages/ui`
- Rationale: KPI cards, titled panels, skeleton-preserving loading states, and meter rows are common dashboard UI building blocks that could become shared atoms or molecules if another app needs them.
- Status: deferred
- Why not extract now: the current components encode analytics-specific copy, number formatting, delta semantics, and layout density. One dashboard is not enough evidence for a stable shared API.
- Risk: premature extraction could create generic-looking UI components that still leak analytics assumptions, especially around positive/negative delta meaning.
- Suggested verification: visual checks in `data-hub`, UI package typecheck, and consumer screenshots across light/dark themes if promoted.
