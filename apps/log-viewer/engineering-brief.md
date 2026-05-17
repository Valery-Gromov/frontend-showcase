# Log Viewer Engineering Brief

## Purpose In The Showcase

`log-viewer` is the append-mostly stream case study in this portfolio. It demonstrates how to render and inspect a growing dataset when the total size is unknown, random page access is the wrong mental model, and the DOM must stay bounded while the in-memory window grows.

The app intentionally contrasts with `product-catalog-admin` and `data-hub`: the catalog is URL/page-state oriented, the dashboard is server-cache oriented, and `log-viewer` is cursor/scroll-state oriented.

## User Scenario

The user is an engineer or operator investigating live service activity. In a five-minute session they can:

- watch a virtualized stream of logs continue to receive newer rows;
- filter the stream by log level;
- pause auto-follow by scrolling away from the bottom;
- jump back to the newest events;
- fetch newer rows manually;
- click a row to pin its details while the stream keeps moving.

## Data Constraints

- The log backend is mocked in memory, but the app still calls it through `createHttpClient` and a fetch-compatible mock transport.
- Requests have 180-520 ms latency, a small 503 flake rate, and one retry for retryable statuses.
- The API uses opaque cursor pagination: `cursor`, `limit`, and optional `level` produce `{ items, nextCursor, serverHighWatermark }`.
- The stream is append-only for the demo. New rows are appended on every mock route hit.
- The total count is unknown and intentionally not displayed as a page count.
- Cursor position is sequence-based, so the client can fetch rows after the last loaded sequence without offset drift when newer rows arrive.
- The client deduplicates fetched rows by `id` and sorts by `sequence` before committing merged results.
- The loaded list grows in memory during a session, while the rendered DOM stays bounded by `@tanstack/react-virtual`.

## UX Constraints

- The viewer must render a large stream without creating one DOM node per loaded row.
- Live tail should keep the viewport near the newest row only while the user is near the bottom.
- Scrolling up must pause auto-follow so the viewport does not jump while the user reads older rows.
- The UI needs explicit "Fetch newer" and "Jump to now" controls.
- The selected row should remain pinned in the details pane while new rows arrive.
- Loading, refresh, error, loaded-count, follow-mode, and behind-count state should be visible.
- The app uses the shared theme system and supports persisted light/dark/system preference.
- URL shareability is not the main state model. The current implementation keeps level, cursor, follow mode, and pinned row in component state.

## State Ownership

- **URL**: not currently a source of truth for the log viewer. The level filter is user-facing state, but it is not encoded into `window.location.search` in the current app.
- **Server-state cache**: not used. The app owns request orchestration directly because the stream is a single scroll surface rather than multiple widgets sharing cached data.
- **Local component state**: level filter, loaded logs, current cursor, server high-watermark, load/error state, follow mode, and pinned row.
- **Mock backend state**: in-memory log database, high-watermark sequence, cursor encoding/decoding, level filtering, and live log appends.
- **typedStorage**: local-only theme preference under the `log-viewer:` prefix.

## Key Engineering Decisions

### Cursor pagination instead of offset/page pagination

- **Decision**: fetch logs by opaque cursor and limit.
- **Why**: append-mostly streams can change while the user is paging. Offset pagination can skip or duplicate rows when rows are inserted before the current offset.
- **Rejected alternatives**: page-number controls; offset/limit pagination; loading the entire dataset.
- **Trade-off**: the user cannot jump to "page 5" or know an exact total. That is acceptable for a live log stream, where the dominant workflow is inspect the current tail and scroll through the loaded window.

### Virtualized rendering with `@tanstack/react-virtual`

- **Decision**: keep loaded rows in memory but render only the visible window plus overscan.
- **Why**: the showcase is about bounded DOM cost for a stream that can grow beyond what should be rendered directly.
- **Rejected alternatives**: render every loaded row; hand-roll a virtualizer; use a heavyweight grid.
- **Trade-off**: browser find-in-page and DOM inspection only see the rendered window, and row height assumptions have to stay stable enough for the virtualizer.

### Direct request orchestration with a request-sequence guard

- **Decision**: call `fetchLogs` from component effects/handlers and use `useRequestSequence` to drop stale responses.
- **Why**: the app has one stream resource and simple request lifecycles. Explicit local orchestration keeps cursor, follow mode, and reset behavior easy to inspect.
- **Rejected alternatives**: TanStack Query infinite queries; a global state store; cancellation-only race handling.
- **Trade-off**: the component owns more state transitions than a cache library would, but the behavior is visible and avoids adding another app-level dependency.

### Follow mode derived from scroll position

- **Decision**: treat "near the bottom" as live-follow mode and pause follow when the user scrolls away.
- **Why**: log viewers should not move the viewport while someone is reading older entries, but should keep the tail visible during active monitoring.
- **Rejected alternatives**: always auto-scroll; never auto-scroll; require a manual pause toggle only.
- **Trade-off**: the threshold is a small heuristic, so it should be covered by focused tests if the behavior becomes more complex.

### Click-to-pin details instead of expanding rows

- **Decision**: clicking a row pins full details in a side pane.
- **Why**: virtualized rows should stay compact and stable in height, while details need enough room for timestamps, service, trace id, and message text.
- **Rejected alternatives**: expandable variable-height rows; modal details; inline JSON blobs.
- **Trade-off**: only one row is pinned at a time, and the pinned row is cleared when the level filter resets the stream.

### Fetch-compatible mock transport through the SDK

- **Decision**: app API functions call `createHttpClient`, which receives `createMockFetch(createLogMockRoutes())`.
- **Why**: the app exercises the same SDK boundary a production API would use while still running locally without a backend.
- **Rejected alternatives**: direct in-component fake data; direct function calls that bypass HTTP semantics; MSW for this small showcase.
- **Trade-off**: app-owned route state stays local, while latency, flake, route matching, and normalized HTTP errors come from shared infrastructure.

### Theme preference through shared provider plus app storage

- **Decision**: wrap the app in `ThemeProvider` and provide a `typedStorage` adapter scoped to `log-viewer:`.
- **Why**: the theme system stays shared, while persistence remains app-owned and isolated.
- **Rejected alternatives**: local-only theme state; CSS-only `prefers-color-scheme`; a global browser storage key shared by every app.
- **Trade-off**: every app currently has a small duplicated `ThemeToggle` component until a stable shared control API is chosen.

## Package Usage

- `@frontend-showcase/ui`: `ThemeProvider`, `Badge`, `Button`, `Select`, `Skeleton`, `IconButton`, `useTheme`, and shared design tokens.
- `@frontend-showcase/sdk`: `createHttpClient` for API calls and `createTypedStorage` for theme preference persistence.
- `@frontend-showcase/hooks`: `useRequestSequence` to prevent stale async responses from committing after a newer request starts.
- `@frontend-showcase/mock-network`: dev/demo fetch transport with latency, flake rate, route matching, and parsed query params.

## Non-Functional Requirements

- A11y: controls are labeled, status text uses `aria-live`, the pinned detail pane has an accessible label, and row buttons are keyboard-focusable.
- Performance: virtualization bounds rendered row count, cursor pagination avoids total-count work, and manual chunking separates the virtualizer in the production build.
- Testability: cursor parsing, log merge/dedupe, follow threshold, and mock route behavior can be tested as pure or route-level logic if split from the component.
- Maintainability: API, mock server, types, and UI stay within `features/logs`; shared packages remain app-agnostic.
- No hidden state: stream state is visible in the component, backend simulation is isolated in `mockServer.ts`, and typed storage only owns theme preference.
- No unnecessary dependencies: the app uses a proven virtualizer and does not add a data-cache library or grid framework for a single scroll stream.

## Out Of Scope

- Real backend persistence, auth, tenancy, or log retention policies.
- WebSocket/SSE realtime transport; the demo uses polling against a mock HTTP endpoint.
- Deep linking to a specific row or an `around=<id>` endpoint.
- URL-owned log query state.
- Full-text search, structured query syntax, saved filters, or multi-service filtering.
- Random access pagination, exact total counts, or "go to page" controls.
- Persisting cursor or scroll position across reloads.
- Extracting stream/follow abstractions into shared packages before another app needs them.

## Acceptance Criteria

- The app loads logs through SDK-backed API functions and mock-network routes.
- The API uses cursor pagination and returns `nextCursor` plus `serverHighWatermark`.
- The viewer renders rows through `@tanstack/react-virtual` instead of one DOM node per loaded row.
- Newer rows can be fetched manually and by live-tail polling while follow mode is active.
- Scrolling away from the bottom pauses auto-follow, and "Jump to now" resumes it.
- Level changes reset logs, cursor, pinned row, and follow mode.
- Clicking a row pins details without changing row height.
- Theme mode persists locally through `typedStorage`.
- The app consumes shared package contracts without importing another app or changing package APIs.
