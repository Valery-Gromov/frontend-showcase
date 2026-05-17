# Log Viewer

## Why This App Exists In The Showcase

`log-viewer` is the append-mostly stream case study. It shows how to handle a growing dataset when total count is unknown, page numbers are misleading, and the UI needs to stay responsive while the user inspects live data.

For the full rationale, see [`engineering-brief.md`](engineering-brief.md). For the portfolio-wide comparison with the catalog and dashboard approaches, see [`docs/comparison.md`](../../docs/comparison.md).

## What It Demonstrates

- Cursor pagination through `GET /logs?cursor=...&limit=200&level=...`.
- Virtualized rendering with `@tanstack/react-virtual`.
- Live tail with pause-on-scroll-up and explicit "Jump to now".
- Manual newer-row fetches over the same cursor path.
- Click-to-pin details without changing virtual row height.
- SDK + mock-network integration behind a fetch-compatible API boundary.

## Key Engineering Decisions

- Cursor state stays local because it represents a moving stream position, not a shareable page.
- `useRequestSequence` drops stale async responses instead of introducing a server-state cache for one stream resource.
- The mock backend appends live rows on route hits and returns an opaque sequence cursor.
- Shared design tokens and `ThemeProvider` own visual consistency; app code owns log-specific behavior.
- Production build chunking splits the virtualizer dependency from app code. See [`docs/performance.md`](../../docs/performance.md).

## Key Files

- `src/features/logs/LogViewer.tsx` - stream state, virtualizer wiring, follow mode, and pinned details.
- `src/features/logs/api/logApi.ts` - SDK-backed log API wrapper.
- `src/features/logs/api/mockServer.ts` - app-owned mock log route, cursor handling, and live appends.
- `src/features/logs/model/types.ts` - log API and row types.
- `src/app/themeStorage.ts` - app-scoped theme persistence through `typedStorage`.
- `vite.config.ts` - production chunk split for React and the virtualizer.

## How It Uses Shared Packages

- `@frontend-showcase/ui`: controls, badges, skeletons, theme provider, theme hook, and design tokens.
- `@frontend-showcase/sdk`: `createHttpClient` for requests and `createTypedStorage` for theme persistence.
- `@frontend-showcase/hooks`: `useRequestSequence` for stale response protection.
- `@frontend-showcase/mock-network`: demo/test-style fetch transport with latency, flake rate, and route matching.

## Running / Testing

```bash
pnpm --filter @frontend-showcase/log-viewer dev
pnpm --filter @frontend-showcase/log-viewer typecheck
pnpm --filter @frontend-showcase/log-viewer test
pnpm --filter @frontend-showcase/log-viewer build
```

App-local tests cover stream merge/follow helpers and mock cursor route behavior.

## Trade-offs

- The app does not expose page numbers or exact totals because cursor pagination is the correct model for an unbounded stream.
- The URL does not currently own filter/cursor state; reload starts a fresh stream session.
- Polling is used instead of WebSocket/SSE so the showcase stays focused on cursor, virtualization, and follow behavior.
- The loaded array grows during a session even though the DOM stays bounded; persistence and retention policies are out of scope.
