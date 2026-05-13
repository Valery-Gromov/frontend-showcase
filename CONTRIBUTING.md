# Contributing

This is a portfolio repository, not an open-source product. External PRs are not expected. This file exists for two reasons:

1. Document the **local rules** to follow when changing anything inside.
2. Capture **architectural boundaries** so they do not drift over time.

## Local workflow

```bash
pnpm install
pnpm -r typecheck
pnpm -r test
```

Each app and package has its own `package.json` with `dev`, `build`, `typecheck`, `test`, and `lint` scripts.

## Language

- **All text in this repository is written in English.** This includes code, comments, identifiers, commit messages, documentation, and tests. No Russian (or any other non-English language) in committed files.
- The only exceptions are loanwords already common in English technical writing and quoted external system names.

## Architectural rules

See [`docs/dependency-graph.md`](docs/dependency-graph.md). In short:

- An app **does not** import another app.
- `sdk` **does not** import `ui` or `hooks`.
- `hooks` **does not** import `ui`.
- `ui` **does not** import an app.
- The organisms in `ui` (`DataTable`, `FilterBar`, `BulkActionBar`) are controlled, with no hidden state, no business logic, and no network calls.

A violation either means a bug or means a new ADR is required in [`docs/decisions/`](docs/decisions/).

## Code style

- TypeScript `strict` + `noUncheckedIndexedAccess` (see [`tsconfig.base.json`](tsconfig.base.json)).
- No emoji in code or commit messages.
- Comments only when the code itself cannot convey intent or trade-offs.
- UI atom and molecule files do not carry business names (`Brand`, `Product`, etc.); they stay generic.

## Commit style

Free form, imperative first line. Optional conventional prefixes (`feat:`, `fix:`, `docs:`, `chore:`).

## Before closing a task

- Run `pnpm -r typecheck`.
- Run `pnpm -r test`.
- If UI changes — sanity-check visually in at least one app.
- If organism behavior changes — update the relevant ADR or add a new one.
