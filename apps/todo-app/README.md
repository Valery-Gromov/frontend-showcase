# Todo App

Small UI sandbox used to manually exercise shared UI atoms and theme behavior.

## What It Demonstrates

- Basic use of `Button`, `Checkbox`, `TextInput`, `Select`, `Badge`, `Chip`, `Tooltip`, `Loader`,
  `Skeleton`, and `IconButton`.
- ThemeProvider integration and persisted theme preference.
- Lightweight interaction states for selection, filtering, loading, and empty results.

## Key Files

- `src/App.tsx` — sandbox interactions.
- `src/ThemeToggle.tsx` — theme mode switcher using the UI package.
- `src/themeStorage.ts` — typedStorage-backed theme adapter.

## Running

```bash
pnpm --filter @frontend-showcase/todo-app dev
```

## Trade-offs

This is not a data-heavy app. It exists as a fast manual check for the UI package while the real
architecture examples live in `product-catalog-admin`, `data-hub`, and `log-viewer`.
