# CLAUDE.md

Project memory for Claude Code (and other agent harnesses) working in **OpenRevOps**.

> **The operating contract is [`AGENTS.md`](./AGENTS.md). Read it first.** It defines scope,
> allowed sources/licenses, security and data handling, auditability, and the PR checklist.
> If anything here conflicts with `AGENTS.md`, `AGENTS.md` wins.

## What this project is

OpenRevOps is a **self-hostable decision-and-execution layer** between usage telemetry and
billing systems. The agent loop is:

```
ingest → detect risk/opportunity → recommend (rationale + confidence)
       → enforce policy + human approval gate → execute via connector → audit
```

It is **not** a payment processor and **not** an ERP/revenue-recognition replacement.
Stripe provides billing primitives; OpenRevOps provides the decision intelligence, policy
orchestration, and auditable approvals over them. Display name for the demo:
**Revenue War Room**.

## Non-negotiables (summary — full text in `AGENTS.md`)

- **No secrets, ever.** Read config from the environment. Never write real keys/tokens to
  tracked files. `.env` is gitignored; document variables in `.env.example` with
  placeholders only. A repo-local hook blocks edits to secret paths.
- **No real customer data / PII.** All demo and test data is **synthetic and seeded**.
- **Approval-safe.** Do not add code paths that bypass the human approval gate or the
  `POLICY_REQUIRE_APPROVAL_ALWAYS` kill-switch.
- **Auditable & deterministic.** Every action emits a decision trace + append-only audit
  record. Don't make golden-path output non-deterministic.
- **License-compatible reuse only** (MIT/BSD/ISC/Apache-2.0). When in doubt, don't copy.

## Repository map

```
apps/web         Next.js operator UI (recommendations, approvals, audit timeline)
apps/api         Agent API + orchestration
packages/
  agent-core         planning, decision policy, execution graph
  policy-engine      guardrails, approval gates, action thresholds
  connectors-stripe  billing / checkout / dispute action adapters
  connectors-exa     search / research context adapters
  connectors-storage DB / event-store / audit-log adapters
  domain-pricing     Outcome-to-Invoice domain logic
  domain-renewals    renewal-negotiation domain logic
  evals              replay / evaluation harness
  demo-data          synthetic accounts / usage events (deterministic)
docs/            architecture, threat-model, decision-trace-spec, policy-rules, …
```

Respect package boundaries: read a package's `README.md` and public interface before
editing, and depend on published interfaces rather than internals.

## Standardized commands

```bash
pnpm lint        # lint + format check        pnpm build       # build all packages
pnpm typecheck   # type checks                pnpm demo:seed   # seed synthetic data
pnpm test        # unit tests                 pnpm demo:reset  # reset demo state
pnpm dev         # run operator UI + API      pnpm secrets:scan  # gitleaks (local)
```

While the repo is in the scaffold phase these exit successfully as placeholders; they are
filled in as packages land.

## Working style

- **TDD where practical:** failing test → make it pass → refactor. Decision/policy logic
  must have unit tests; connectors need at least one sandbox integration test.
- Prefer small, reviewable diffs. Explain _why_, not just _what_.
- Keep `main` runnable end-to-end; put risky changes behind a flag.
- Before opening a PR, run `pnpm lint && pnpm typecheck && pnpm test` and complete the
  checklist in `AGENTS.md` and the PR template.

## Deeper guidance in this repo

- [`.claude/README.md`](./.claude/README.md) — how the Claude Code setup and plugins work.
- [`.claude/rules/`](./.claude/rules) — modular rules (scope, security, determinism,
  testing, connectors).
- [`.claude/skills/`](./.claude/skills) — task skills (decision traces, adding a connector,
  synthetic demo data).
- [`docs/`](./docs) — architecture, threat model, and specs.
