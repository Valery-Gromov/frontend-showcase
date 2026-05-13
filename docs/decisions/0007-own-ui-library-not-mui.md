# ADR 0007 — Hand-rolled UI library with Material 3-inspired tokens (no MUI rebase)

- Date: 2026-06
- Status: Accepted (forward-looking; the token system is the target of Phase 4)

## Context

The repository ships its own atom / molecule / organism layer in [`packages/ui`](../../packages/ui). The visual layer is currently inline-styled, which is fine for prototyping but limits the portfolio story. Three options were considered:

1. **Adopt MUI (Material UI)** wholesale. Drop the custom UI library, wrap MUI components, and write the organisms on top.
2. **Build a MUI clone**: copy MUI's API shape and visuals using own code. Demonstrates parity with a known library.
3. **Build an own library with Material 3-inspired design tokens** (color roles, type scale, spacing, elevation, density). Keep the existing API; only the styling layer changes.

## Decision

Adopt **option 3**.

- Use CSS variables for the token layer:
  - Color roles: `--color-primary`, `--color-on-primary`, `--color-surface`, `--color-on-surface`, ... — modeled after Material 3 role names without copying any code.
  - Type scale: `--font-size-body`, `--font-size-title`, `--font-size-display`.
  - Spacing scale: `--space-1` ... `--space-8`.
  - Elevation: `--elevation-1` ... `--elevation-5` as shadow stacks.
  - Density: a `--density: 0 | 1 | 2` slot used by atoms to switch padding.
- A `ThemeProvider` that reads `prefers-color-scheme`, persists the choice via `typedStorage`, and writes the right token set to `:root`.
- Per-component **CSS Modules** consuming the variables. No inline color literals in components.
- The atoms, molecules, and organisms keep their existing controlled API surface ([ADR 0002](0002-controlled-organisms.md)). Only the rendering and styling layer changes.

## Consequences

Pros:

- The portfolio story stays "I understand a design system end-to-end". MUI as a dependency would obscure that.
- Dark mode falls out for free once the token layer exists (swap variable values at `:root[data-theme=dark]`).
- Token-level changes — e.g. density, brand color — are repository-wide single-line edits.
- The library does not lock the apps into a third-party ecosystem.

Cons / boundaries:

- More work than `pnpm add @mui/material`. We accept this because the story IS the work.
- Accessibility primitives (date picker, dialog focus trap, popover positioning) are non-trivial. We will adopt headless libraries (e.g. Radix primitives) for these specifically, not for the visual layer. That is a different ADR if and when it happens.
- Visual parity with MUI is **not** a goal. The goal is "looks intentional and consistent", not "passes for MUI at a glance".

Revisit when:

- An app needs date pickers, autocomplete, or rich keyboard interaction. At that point bring in Radix primitives or similar — but keep the token layer authoritative.
- The token surface grows beyond what one person can keep in their head. At that point the tokens become their own package (`@frontend-showcase/tokens`) so they can be consumed without `ui` itself.
