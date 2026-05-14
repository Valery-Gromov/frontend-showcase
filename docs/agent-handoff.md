# Agent Handoff

This file is the stable starting point for new agent sessions. It exists to reduce context loss
between chats and keep the monorepo consistent.

## How To Start A New Agent Session

1. Read `README.md`, `docs/roadmap.md`, `docs/architecture.md`, `docs/dependency-graph.md`, and this file.
2. Pick a scope profile from `.cursor/rules/context-management.mdc`: `app`, `package`, or `cross-cutting`.
3. Read only the app/package/docs files required by that profile.
4. Before editing, check `git status --short`.
5. After editing, run the smallest meaningful verification first, then broader checks if the change crosses boundaries.
6. If the workspace changed, add a concise entry to this file.

## Current Project State

- `apps/product-catalog-admin`: URL-driven data-heavy catalog with SDK/mock-network, complex selection, drawer/edit flows, bulk actions, tests for query/selection models, and focused a11y polish.
- `apps/data-hub`: TanStack Query + Recharts analytics dashboard using SDK/mock-network and shared UI tokens.
- `apps/log-viewer`: cursor-paginated virtualized log stream using `@tanstack/react-virtual`.
- `apps/todo-app`: small UI sandbox.
- `packages/sdk`: injectable HTTP client with retry and typed storage.
- `packages/ui`: custom Material 3-inspired design system with atoms/molecules/organisms and ThemeProvider.
- `packages/hooks`: reusable hooks with tests.
- `packages/mock-network`: fetch-compatible mock transport with tests.

## Verification Baseline

Use these for final verification after cross-cutting changes:

```bash
pnpm -r typecheck
pnpm test
pnpm --filter @frontend-showcase/product-catalog-admin build
pnpm --filter @frontend-showcase/data-hub build
pnpm --filter @frontend-showcase/log-viewer build
```

## Recent Agent Entries

### 2026-05-14 — Context management rules and handoff setup

- Scope profile: cross-cutting.
- Changed: added `.cursor/rules/context-management.mdc`, `.cursor/rules/agent-handoff.mdc`,
  `docs/agent-handoff.md`, and updated `.gitignore` so `.cursor/rules/*.mdc` can be versioned.
- Purpose: make future agents choose explicit context scope, keep apps aware of package contracts, and document non-trivial workspace changes.
- Verification: not yet run; this is docs/rules-only.
- Commits: not yet committed.
- Next suggested step: run a repo hygiene pass for stale folders/build artifacts, then update this handoff with the result.
