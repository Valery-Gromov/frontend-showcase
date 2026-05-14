# UI

Custom React UI library with Material 3-inspired tokens and controlled data-heavy organisms.

## What It Demonstrates

- Atoms: Button, Checkbox, TextInput, Select, Badge, Chip, Tooltip, Loader, Skeleton, IconButton.
- Molecules: SearchField, FilterSelect, TableHeaderCell, BulkSelectionSummary, status/empty helpers.
- Organisms: DataTable, FilterBar, BulkActionBar.
- CSS variables for color roles, typography, spacing, radius, elevation, focus ring, and density.
- ThemeProvider with light/dark/system mode and app-provided storage adapter.

## Key Files

- `src/styles/tokens.css` — design tokens.
- `src/theme/ThemeProvider.tsx` — theme and density provider.
- `src/organisms/DataTable.tsx` — generic controlled table.
- `src/organisms/FilterBar.tsx` — generic controlled filter surface.
- `src/organisms/BulkActionBar.tsx` — generic controlled bulk action surface.

## Running

```bash
pnpm --filter @frontend-showcase/ui typecheck
```

## Boundary

The UI package owns generic rendering and interaction primitives only. It must not import the SDK or
know app-specific business rules, APIs, routes, or product domains.
