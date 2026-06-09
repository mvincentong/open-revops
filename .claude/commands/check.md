---
description: Run the full local merge gate (lint, typecheck, test, build, secret scan) and report what would fail in CI
argument-hint: "[optional: package or path to focus on]"
allowed-tools: Bash(pnpm:*), Bash(gitleaks:*), Bash(corepack:*), Bash(node:*), Read, Grep
---

Run the OpenRevOps local merge gate and summarize results. This mirrors what CI enforces
(see `.github/workflows/`), so a green run here means CI should pass.

Focus (optional): `$ARGUMENTS` — if provided, scope tests/lint to that package or path.

Steps:

1. Ensure the toolchain is ready: `corepack enable` (Node version is pinned in `.nvmrc`).
2. Run, in order, and **do not stop at the first failure** — collect them all:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm build`
   - `pnpm secrets:scan` (gitleaks; if the binary is missing, say so and skip — CI still
     runs it).
3. Report a concise pass/fail table. For each failure, show the key error lines and the
   exact command to reproduce.
4. If everything passes, say so plainly and remind me to complete the PR checklist in
   `AGENTS.md` and the PR template before pushing.

Do not "fix" failures by weakening tests, skipping checks, or editing the secret-scan
config — surface them and propose a real fix.
