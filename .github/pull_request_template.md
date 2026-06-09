<!--
Thanks for contributing to OpenRevOps! Keep PRs small and focused (one logical change).
Read AGENTS.md and CONTRIBUTING.md before opening. Use Conventional Commit style for the
PR title (e.g. "feat(policy-engine): add confidence threshold gate").
-->

## What & why

<!-- What does this change, and why? Link issues with "Closes #123". -->

## How

<!-- Brief notes on the approach. Call out any schema / interface / golden-path changes. -->

## Checklist

- [ ] Stays within declared **scope** and package ownership (`AGENTS.md`).
- [ ] `pnpm lint && pnpm typecheck && pnpm test` pass locally.
- [ ] New/changed behavior is covered by **tests** (decision/policy logic; connector
      integration tests where relevant).
- [ ] **No secrets** or real customer data / PII added; config read from the environment;
      new env vars documented in `.env.example` with placeholders.
- [ ] Demo data stays **synthetic and reproducible**; golden-path output changes are called
      out and signed off.
- [ ] **Decision-trace / audit** behavior preserved (or changes documented).
- [ ] Reused code is **license-compatible** (MIT/BSD/ISC/Apache-2.0) and attributed.
- [ ] Docs and `CHANGELOG.md` updated where relevant.
- [ ] The approval gate / kill-switch is **not** bypassed.

## Screenshots / decision trace (if UI or agent behavior changed)

<!-- Redact secrets and PII. -->
