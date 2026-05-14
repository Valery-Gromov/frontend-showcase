# Hooks

Reusable React hooks for state orchestration patterns shared by data-heavy apps.

## What It Demonstrates

- `useUrlQueryState` — typed state synced with `window.location.search`.
- `useDebouncedValue` — delayed value propagation for input-driven requests.
- `useRequestSequence` — latest-request token used to drop stale async responses.
- `useExternalChangeDetector` — polling-based external-state fingerprint detection.

## Key Files

- `src/useUrlQueryState.ts`
- `src/useDebouncedValue.ts`
- `src/useRequestSequence.ts`
- `src/useExternalChangeDetector.ts`
- `src/*.test.tsx`

## Running

```bash
pnpm --filter @frontend-showcase/hooks typecheck
pnpm --filter @frontend-showcase/hooks test
```

## Boundary

Hooks may depend on React, but they must not import `packages/ui`, app code, or domain-specific
types. They encode generic orchestration rules only.
