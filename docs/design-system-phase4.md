# Phase 4 — Design system uplift (implementation record)

This note is the **ground truth** for what landed in Phase 4. It complements [ADR 0007: own UI library, Material 3-inspired tokens](decisions/0007-own-ui-library-not-mui.md). For the **portfolio-wide** plan, see `.cursor/plans/portfolio-showcase-uplift_*.plan.md`.

## Scope (what was implemented)

- **Token layer** — [`packages/ui/src/styles/tokens.css`](../packages/ui/src/styles/tokens.css): Material 3–inspired **color roles**, type scale, spacing (`--space-1` … `--space-8`), radius, elevation (`--elevation-1` … `--elevation-5`), motion, focus ring, and a **`--density` slot** (0 / 1 / 2 via `html[data-density]`).
- **Global base** — [`packages/ui/src/styles/base.css`](../packages/ui/src/styles/base.css) + [`index.css`](../packages/ui/src/styles/index.css): box-sizing, body colors/fonts from tokens, `:focus-visible` outline from tokens.
- **Theme** — [`packages/ui/src/theme/ThemeProvider.tsx`](../packages/ui/src/theme/ThemeProvider.tsx), [`types.ts`](../packages/ui/src/theme/types.ts): `ThemeMode = light | dark | system`, `ResolvedTheme`, `Density`, optional `ThemeStorageAdapter`; subscribes to `prefers-color-scheme`; sets `data-theme` and `data-density` on `<html>`; SSR-safe (no `window`/`document` until `useEffect`).
- **`packages/ui` does not depend on `@frontend-showcase/sdk`.** Apps pass a small `{ get, set }` adapter that wraps `createTypedStorage` (see below).
- **Explicit stylesheet export** — [`packages/ui/package.json`](../packages/ui/package.json) `exports["./styles"]` → `src/styles/index.css`. Apps must `import '@frontend-showcase/ui/styles'`.
- **CSS Modules** — every atom / molecule / organism that had inline styles now has a co-located `*.module.css` reading `var(--*)` only (no hex in component files; literals live in `tokens.css` only).
- **TypeScript** — [`packages/ui/src/styles/css-modules.d.ts`](../packages/ui/src/styles/css-modules.d.ts) declares `*.module.css`. It is pulled into consumers via `/// <reference path="./styles/css-modules.d.ts" />` at the top of [`packages/ui/src/index.ts`](../packages/ui/src/index.ts) so app `tsc` resolves CSS module imports.
- **Apps**
  - [`apps/product-catalog-admin/src/main.tsx`](../apps/product-catalog-admin/src/main.tsx): `ThemeProvider` + `themeStorage` from [`apps/product-catalog-admin/src/app/themeStorage.ts`](../apps/product-catalog-admin/src/app/themeStorage.ts); global stylesheet import; [`styles.css`](../apps/product-catalog-admin/src/styles.css) uses tokens only (no `#hex`).
  - [`apps/todo-app/src/main.tsx`](../apps/todo-app/src/main.tsx): same pattern; [`themeStorage.ts`](../apps/todo-app/src/themeStorage.ts); [`styles.css`](../apps/todo-app/src/styles.css) token-only.
  - Theme toggle: [`apps/product-catalog-admin/src/app/ThemeToggle.tsx`](../apps/product-catalog-admin/src/app/ThemeToggle.tsx) (used from header), [`apps/todo-app/src/ThemeToggle.tsx`](../apps/todo-app/src/ThemeToggle.tsx).

## Thematic commits (three slices)

On branch `showcase`, Phase 4 is three commits (newest first):

1. `feat(ui): migrate molecules and organisms to CSS Modules and tokens`
2. `feat(ui): migrate atoms to CSS Modules and tokens`
3. `feat(ui): introduce Material 3-inspired design tokens, ThemeProvider, dark mode`

Verify exact hashes with:

```bash
git log --oneline -5
```

## Contract for future work (do **not** redo without reason)

- **Controlled organisms** — `DataTable`, `FilterBar`, `BulkActionBar` keep ADR 0002: props in, events out; no hidden sort/selection/query state inside the package.
- **Styling** — Prefer **CSS Modules + tokens**. Do not reintroduce inline colors in `packages/ui`. Raw hex/rgb stays in `tokens.css` (and similar token files if split later).
- **New apps** — Wire like existing apps: `import '@frontend-showcase/ui/styles'`, wrap root in `<ThemeProvider storage={...}>`, namespace `typedStorage` per app, avoid app-level hex for surfaces/borders/text (use `var(--color-*)`).
- **Dependencies** — Do not add `@frontend-showcase/sdk` to `packages/ui` for theme persistence; keep the storage adapter indirection.
- **Out of scope for Phase 4** (still true unless a new ADR says otherwise): Headless primitives (e.g. Radix) for dialogs/focus traps; dedicated density toggle in the UI; splitting tokens into a separate npm package.

## Next portfolio phases (from roadmap)

- Phase 5 — `apps/data-hub` (TanStack Query + Recharts + mock routes).
- Phase 6 — `apps/log-viewer` (cursor pagination + `@tanstack/react-virtual`).
- Phase 9 (rest) — hooks + container tests; Phase 10 — a11y, screenshots, performance notes.
