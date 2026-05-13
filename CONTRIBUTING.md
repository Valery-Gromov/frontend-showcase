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

## Commits

- **One topic per commit.** A commit is a unit of explanation, not a save point. If a change touches two unrelated areas, split it into two commits — even if it means temporarily reverting part of a single file's diff to ship the first topic cleanly.
- Free form, imperative first line. Optional conventional prefixes: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `ci`.
- An optional scope in parentheses for monorepo packages or apps: `feat(sdk):`, `refactor(product-catalog-admin):`, `docs(repo):`.
- Short body explaining *why* (not *what*) when the diff alone is not self-evident.
- No emoji.

Examples of correct thematic splits:

- A single file diff that mixes a new feature and an unrelated typecheck fix becomes two commits.
- Adding a new package and wiring it into an app are two commits (`feat(<package>)` followed by `refactor(<app>)`).
- Translating existing docs and adding a brand-new doc are two commits (`chore(repo): translate...` and `docs(repo): add...`).

The `git log --oneline` view should read top-to-bottom as a story, with each line answering "what changed and why" without needing the diff.

## Before closing a task

- Run `pnpm -r typecheck`.
- Run `pnpm -r test`.
- If UI changes — sanity-check visually in at least one app.
- If organism behavior changes — update the relevant ADR or add a new one.
