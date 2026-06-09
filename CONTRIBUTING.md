# Contributing to OpenRevOps

Thanks for your interest in contributing! OpenRevOps is open source under
[Apache-2.0](./LICENSE), and we welcome issues, discussions, and pull requests.

Please also read [`AGENTS.md`](./AGENTS.md) — it is the operating contract for **both
humans and AI coding agents** (scope, allowed sources, security, and the PR checklist).

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating you
agree to uphold it.

## Ways to contribute

- **Report bugs** and **request features** via the issue templates.
- **Improve docs** in [`docs/`](./docs).
- **Pick up an issue** labeled `good first issue` or `help wanted`.
- **Open a discussion** before large changes so we can align on design.

## Local setup

Prerequisites:

- **Node 22+** — the pinned version is in [`.nvmrc`](./.nvmrc) (`nvm use` / `fnm use`).
- **pnpm 10+** — enable via `corepack enable`.
- A **Stripe test-mode** account for connector work (sandbox keys only).

```bash
git clone https://github.com/mvincentong/open-revops.git
cd open-revops
corepack enable
cp .env.example .env      # fill in TEST keys; never commit .env
pnpm install
```

## Standardized command surface

Every package exposes the same scripts so contributors and CI behave identically:

| Command          | Purpose                                  |
| ---------------- | ---------------------------------------- |
| `pnpm lint`      | Lint + format check                      |
| `pnpm typecheck` | Type checks                              |
| `pnpm test`      | Unit tests                               |
| `pnpm build`     | Build all packages                       |
| `pnpm demo:seed` | Seed deterministic synthetic demo data   |
| `pnpm demo:reset`| Reset demo to a clean known state        |
| `pnpm dev`       | Run the operator UI + API locally        |

If a package adds custom scripts, document them in that package's `README.md`.

## Branching and commits

- Branch from `main`: `git switch -c <type>/<short-description>`
  (e.g. `feat/stripe-credit-action`, `fix/audit-redaction`).
- We use **[Conventional Commits](https://www.conventionalcommits.org/)**:
  - `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`, `build:`, `perf:`
  - Example: `feat(policy-engine): add confidence threshold gate`
- Keep PRs small and focused. One logical change per PR.

## Test-driven development

Write a failing test first, make it pass, then refactor. Decision logic and policy gates
**must** have unit tests; connectors **must** have at least one integration test against
the Stripe sandbox. Do not weaken or skip tests to make CI green.

## Pull request requirements

Before requesting review, make sure:

- [ ] `pnpm lint && pnpm typecheck && pnpm test` pass locally.
- [ ] New/changed behavior is covered by tests.
- [ ] No secrets, credentials, or real customer/PII data are included.
- [ ] Demo data stays synthetic and reproducible.
- [ ] Docs and `CHANGELOG.md` are updated where relevant.
- [ ] You completed the checklist in the PR template and [`AGENTS.md`](./AGENTS.md).

CI runs lint, typecheck, tests, build, secret scanning, CodeQL, and a dependency review.
All checks must be green before merge. At least one CODEOWNER review is required.

## Reporting security issues

Do **not** open public issues for vulnerabilities. Follow [`SECURITY.md`](./SECURITY.md).

## Working with Claude Code / agents

This repo ships a committed Claude Code configuration and pre-wires the Superpowers and ECC
plugins (you'll be prompted to trust them on first open). See
[`.claude/README.md`](./.claude/README.md). Agent contributions must follow
[`AGENTS.md`](./AGENTS.md) like any other contributor.

## License of contributions

By contributing, you agree that your contributions are licensed under the project's
[Apache-2.0](./LICENSE) license (per Section 5 of the license). No separate CLA is required.
