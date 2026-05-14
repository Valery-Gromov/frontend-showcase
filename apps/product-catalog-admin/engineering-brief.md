# Product Catalog Admin Engineering Brief

## Purpose In The Showcase

`product-catalog-admin` is the data-heavy admin case study in this portfolio. It demonstrates how to build a React screen where URL state, slow network responses, mutable backend data, partial-success mutations, and reusable controlled UI components have to work together without hidden state.

The app is intentionally hand-rolled instead of using a server-state cache. That makes the state ownership and race-condition handling visible, which is the point of this showcase case.

## User Scenario

The user is a catalog operations specialist responsible for maintaining a B2B product catalog. In a five-minute review they can:

- open a shareable filtered catalog URL;
- search and filter by product attributes;
- sort and page through results while the server responds slowly;
- select rows and run bulk actions that may partially fail;
- create or edit a product in a drawer;
- upload an Excel file for backend-owned import handling;
- see that the underlying catalog changed and refresh the table.

## Data Constraints

- The mock catalog is finite and in-memory for the demo, but it behaves like a backend-owned dataset rather than local fixture data.
- Requests intentionally have 500-1200 ms latency through `createMockFetch`.
- The list endpoint returns page data and `total: null`; the UI must not depend on an exact total.
- Pagination is page-based, not cursor-based, because catalog users need random access semantics like previous/next pages.
- The backend can mutate outside the current UI session. A version probe detects drift and shows an outdated-data notice.
- Bulk actions return per-row success and failure lists. The UI must handle full success, partial success, and full failure.
- Product create/edit/import endpoints can reject work with validation, conflict, or file-type errors.
- Concurrent fetches can resolve out of order, so stale responses must be ignored.

## UX Constraints

- The catalog query is shareable and recoverable from the URL.
- Filter edits use a draft buffer and apply button, so typing does not rewrite browser history.
- Browser back/forward updates the query and refetches the table.
- Query changes that would invalidate an active selection require confirmation.
- Table refresh keeps the current query and marks the catalog fresh after a successful fetch.
- Bulk failures are visible in a toast and can be expanded into row-level details.
- The edit/create drawer protects dirty form state with a discard confirmation.
- The drawer traps focus, restores previous focus on close, and closes through Escape.
- Theme mode is controlled by the shared `ThemeProvider` and persisted through app-provided typed storage.
- The table avoids assuming a known total; pagination uses whether the current page is full to decide if "Next" is available.

## State Ownership

- **URL**: source of truth for `search`, `brand`, `category`, `sae`, `status`, `page`, `pageSize`, and `sort`.
- **Local component state**: filter draft, active rows, load state, selection, toast state, dialogs, drawer state, import panel state, and pending query-change confirmation.
- **Mock backend state**: product rows, catalog version, create/edit/import side effects, external mutations, and bulk-action conflict simulation.
- **Server-state cache**: intentionally not used in this app; `data-hub` demonstrates that pattern instead.
- **typedStorage**: local-only UX preferences, specifically theme mode and whether the filter panel is open.

## Key Engineering Decisions

### URL as the catalog query source of truth

- **Decision**: parse the initial query from `window.location.search`, write query changes with `pushState` / `replaceState`, and listen to `popstate`.
- **Why**: filtered catalog views must be shareable, reloadable, and easy to reproduce in bug reports.
- **Rejected alternatives**: component-only state loses reload/share behavior; `typedStorage` is machine-local; Redux/Zustand adds a dependency without solving shareability.
- **Trade-off**: URL serialization/parsing becomes part of every query change, so the app keeps a separate filter draft for manual apply.

### Explicit request sequencing

- **Decision**: use `useRequestSequence` around table fetches and refreshes.
- **Why**: URL changes, refreshes, and slow mock latency can produce overlapping requests.
- **Rejected alternatives**: accepting last-resolved response risks showing stale rows; abort-only handling would require every transport path to support abort semantics.
- **Trade-off**: the container owns a small async state machine instead of delegating freshness to a cache library.

### Pessimistic mutations with partial-success handling

- **Decision**: wait for create/edit/import/bulk responses before updating the table, then refresh from the backend.
- **Why**: catalog mutations can fail per row or conflict with external changes, so optimistic updates would hide important failure states.
- **Rejected alternatives**: optimistic table edits with rollback; single success/failure bulk status.
- **Trade-off**: interactions feel more conservative, but the result is auditable and easier to reason about.

### Selection as a controlled shared UI contract

- **Decision**: consume the shared `SelectionState = none | some | allMatching` contract and keep actual selection in the catalog container.
- **Why**: table and bulk-action UI stay generic, while the app decides how selection interacts with query changes and bulk endpoints.
- **Rejected alternatives**: hidden selection state inside `DataTable`; a boolean `selectAll` plus IDs.
- **Trade-off**: the app must explicitly handle all selection modes. In the current UI, explicit row/page selection is reachable; the `allMatching` shape is supported by the shared type and mock bulk endpoint, but there is no dedicated "select all matching filters" UI affordance yet.

### External-change detection instead of automatic overwrite

- **Decision**: poll `getCatalogVersion` through `useExternalChangeDetector` and show a refresh notice when the version changes.
- **Why**: a catalog admin should not have table rows replaced while reviewing or editing.
- **Rejected alternatives**: silent polling refresh; WebSocket/SSE; ignoring external changes.
- **Trade-off**: the user must click refresh, but there is no hidden overwrite of the current table.

### Fetch-compatible mock transport through the SDK

- **Decision**: app API functions call `createHttpClient`, which receives `createMockFetch(createCatalogMockRoutes())`.
- **Why**: the app exercises the same SDK contract a real backend would use, while still running locally.
- **Rejected alternatives**: direct in-app `setTimeout` mocks; MSW for this small demo.
- **Trade-off**: the mock route table is app-owned, while latency and route plumbing are reusable infrastructure.

### Controlled shared UI organisms

- **Decision**: use `DataTable`, `FilterBar`, and `BulkActionBar` as controlled components.
- **Why**: the app owns business state, and the UI package stays app-agnostic.
- **Rejected alternatives**: product-specific table/filter components inside `packages/ui`; UI organisms with hidden sort/filter state.
- **Trade-off**: the container has more wiring, but the ownership boundary is explicit.

## Package Usage

- `@frontend-showcase/ui`: `ThemeProvider`, table, filter, bulk-action, form, badge, button, select, and status primitives. The package owns generic rendering only.
- `@frontend-showcase/sdk`: `createHttpClient` for API calls and `createTypedStorage` for theme/catalog preferences.
- `@frontend-showcase/hooks`: `useRequestSequence` for stale-response protection and `useExternalChangeDetector` for backend-version drift detection.
- `@frontend-showcase/mock-network`: dev/demo fetch transport with latency and route handling, injected into the SDK from the app API adapter.

## Non-Functional Requirements

- A11y: dialogs and drawer use dialog roles, live status text announces refresh state, drawer focus is trapped and restored, disabled rows carry disabled reasons.
- Performance: table fetches are paged, stale async responses are dropped, and default page size stays small.
- Testability: query parsing/serialization and selection helpers are pure functions with Vitest coverage.
- Maintainability: app-specific API and model logic live under `features/productCatalog`; generic UI, hooks, SDK, and mock transport stay in packages.
- No hidden state: URL owns query state; controlled organisms emit events rather than storing business state.
- No unnecessary dependencies: this app intentionally avoids TanStack Query, state libraries, and MSW because the showcase value is the explicit state flow.

## Out Of Scope

- Real backend authentication, authorization, or persistence.
- Full Excel parsing in the browser; the mock backend accepts or rejects by file name.
- Virtualized rows; this case study is about URL/page state, not unbounded scrolling.
- Exact total counts; the list endpoint currently returns `total: null`.
- Automatic background table replacement when external changes are detected.
- A server-side saved-view resource for complex queries.
- Implementing a new shared abstraction from this app without validating reuse across another consumer.

## Acceptance Criteria

- A URL with filters, page, and sort reconstructs the same catalog query on reload.
- Applying filters, sorting, pagination, and browser back/forward produce table refetches without accepting stale responses.
- Active selection is cleared only after user confirmation when a query change would invalidate it.
- Bulk actions display success, partial-success, and failure outcomes without pretending every row succeeded.
- Create/edit/import flows surface validation or conflict failures and refresh the table after successful mutation.
- External catalog mutations show an outdated-data notice, and manual refresh clears it after a successful fetch.
- Theme and filter-panel preferences persist locally without polluting shareable URLs.
- The app consumes shared package contracts without importing another app or changing package APIs.
