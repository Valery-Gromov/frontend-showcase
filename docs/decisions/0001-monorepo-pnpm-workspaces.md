# ADR 0001 — Monorepo on pnpm workspaces, level 1

- Date: 2026-03
- Status: Accepted

## Context

The repository is a portfolio that hosts several applications (`product-catalog-admin`, `data-hub`, `log-viewer`, `todo-app`) and several shared packages (`sdk`, `ui`, `hooks`, `mock-network`). A dependency-management and build model is required.

Alternatives:

1. **pnpm workspaces, level 1**: a single root `package.json` + `pnpm-workspace.yaml`; each app and package has its own `package.json` and `tsconfig.json`; workspace dependencies via `workspace:*`. No project references, no dedicated config package.
2. **pnpm workspaces, level 2**: the same plus TypeScript project references, a dedicated config package (`@frontend-showcase/config`), and unified lint / typecheck / build scripts.
3. **turborepo / nx**: a pipeline orchestrator with caching and filtering.

## Decision

Adopt **level 1**.

- `pnpm-workspace.yaml` for routing.
- Per-app/per-package `package.json` + `tsconfig.json`.
- A root `tsconfig.base.json` as the shared baseline (`strict`, `noUncheckedIndexedAccess`, `moduleResolution: bundler`).
- Workspace dependencies expressed as `"@frontend-showcase/ui": "workspace:*"`.

## Consequences

Pros:

- Minimal infrastructure and minimal magic.
- Each app is runnable and understandable in isolation (`pnpm --filter @frontend-showcase/X dev`).
- Easy to read for someone who has never seen the repository before.

Cons / boundaries:

- No incremental TypeScript build (no project references). Not noticeable at the current size.
- No shared lint configuration. Once the rule set grows — revisit level 2.
- No distributed build cache. Not needed for four apps.

Revisit when:

- The number of apps grows past six and `typecheck`/`test` time exceeds one minute — consider level 2.
- turborepo / nx is not introduced until there is real pain with incremental builds.
