---
description: Scaffold a new workspace package or app under the OpenRevOps monorepo conventions
argument-hint: "<kind: package|app> <name>  e.g. package connectors-foo"
allowed-tools: Bash(ls:*), Bash(pnpm:*), Read, Write, Edit
---

Scaffold a new workspace member following this repo's conventions. Arguments: `$ARGUMENTS`
(first token = `package` or `app`; second token = the directory name, e.g. `connectors-foo`
or `worker`).

Before creating anything:

1. Confirm the kind and name, and that it fits the **scope** in
   `.claude/rules/00-scope-and-non-goals.md` (don't scaffold out-of-scope surface area).
2. Pick the directory: `packages/<name>` for a package, `apps/<name>` for an app. Refuse if
   it already exists.

Create:

1. `<dir>/package.json` with:
   - `"name": "@open-revops/<name>"`, `"version": "0.0.0"`, `"private": true`,
     `"license": "Apache-2.0"`, `"type": "module"`, and a one-line `description`.
   - An empty `"scripts": {}` for now (the standardized `lint`/`typecheck`/`test`/`build`
     scripts are wired in as real code lands; root commands use `pnpm -r --if-present`).
2. `<dir>/README.md` stating the package's **purpose** and its **public interface** (what
   other packages may depend on). For a `connectors-*` package, link the connector contract
   in `.claude/rules/40-connectors-and-actions.md`.

After creating:

1. Run `pnpm install` so the workspace picks up the new member, and confirm it resolves.
2. Remind me to add a CODEOWNERS entry in `.github/CODEOWNERS` if ownership differs from the
   defaults, and to note the addition in `CHANGELOG.md`.

Keep it minimal — a placeholder that builds green, not speculative implementation.
