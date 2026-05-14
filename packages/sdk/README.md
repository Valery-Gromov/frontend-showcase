# SDK

Framework-agnostic SDK for HTTP requests and typed browser storage.

## What It Demonstrates

- `createHttpClient({ fetch })` with injectable transport.
- Normalized errors: `HTTP_ERROR`, `TIMEOUT_ERROR`, `NETWORK_ERROR`, `PARSE_ERROR`.
- Retry policy for idempotent requests with exponential backoff.
- `createTypedStorage({ prefix })` with JSON parsing, quota, unavailable-storage, and namespace
  clearing guards.

## Key Files

- `src/http/client.ts` — HTTP client factory and retry behavior.
- `src/http/types.ts` — public error and config types.
- `src/storage/typedStorade.ts` — typed storage implementation.
- `src/http/*.test.ts`, `src/storage/*.test.ts` — SDK test coverage.

## Running

```bash
pnpm --filter @frontend-showcase/sdk typecheck
pnpm --filter @frontend-showcase/sdk test
```

## Boundary

The SDK must not know about React, UI components, or app-specific API shapes. Apps inject mock or
real `fetch` implementations and translate SDK errors into domain messages.
