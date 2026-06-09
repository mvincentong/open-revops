# Rule: testing and CI

## Test-driven development

Write a failing test first, make it pass, then refactor. In particular:

- **Decision and policy logic must have unit tests** — thresholds, guardrail-matrix
  outcomes, approval gating, and kill-switch behavior.
- **Connectors need at least one integration test** against the Stripe **sandbox**
  (idempotency, webhook-signature verification, retry/timeout behavior).
- Don't weaken, skip (`.skip`), or delete tests to make CI green. If a test is wrong, fix
  the test deliberately and say why in the PR.

## The merge gate

Every PR must pass, locally and in CI:

1. Lint + format (`pnpm lint`).
2. Type checks (`pnpm typecheck`).
3. Unit tests (`pnpm test`).
4. Build (`pnpm build`).
5. Integration test for any connector you touched.
6. Secret scan — no keys/tokens/passwords (`pnpm secrets:scan` / CI gitleaks).
7. Dependency review + CodeQL (CI).

Run `pnpm lint && pnpm typecheck && pnpm test` before requesting review.

## Keep `main` runnable

- `main` must run end-to-end at all times. Put risky or half-finished work behind a flag.
- Prefer small, reviewable diffs over large ones. One logical change per PR.

## Scaffold phase

While packages are still placeholders, the standardized scripts exit successfully as
no-ops. As real code lands, wire each package's `lint`/`typecheck`/`test`/`build` scripts so
the root commands and CI exercise them automatically (`pnpm -r --if-present …`).
