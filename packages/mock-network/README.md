# Mock Network

Fetch-compatible mock transport for apps and tests.

## What It Demonstrates

- `createMockFetch(routes, options)` returns a function compatible with `fetch`.
- Declarative route matching by method and path pattern.
- Parsed query params, path params, and JSON request body in route handlers.
- Configurable latency and flaky 503 responses.
- Integration with the SDK through `createHttpClient({ fetch: mockFetch })`.

## Key Files

- `src/createMockFetch.ts` — transport implementation.
- `src/path.ts` — route pattern matching.
- `src/types.ts` — public route and option types.
- `src/createMockFetch.test.ts` — route behavior tests.

## Running

```bash
pnpm --filter @frontend-showcase/mock-network typecheck
pnpm --filter @frontend-showcase/mock-network test
```

## Boundary

This package is demo/test infrastructure. It must stay app-agnostic; apps define their own route
tables and inject the resulting fetch function into the SDK.
