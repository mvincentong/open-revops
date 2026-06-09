<div align="center">

# OpenRevOps

**Open-source revenue agents for usage-based companies.**

_OpenRevOps detects revenue leakage, recommends a billing action, asks for approval,
executes through Stripe, and records an audit trail._

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![CI](https://github.com/mvincentong/open-revops/actions/workflows/ci.yml/badge.svg)](https://github.com/mvincentong/open-revops/actions/workflows/ci.yml)
[![CodeQL](https://github.com/mvincentong/open-revops/actions/workflows/codeql.yml/badge.svg)](https://github.com/mvincentong/open-revops/actions/workflows/codeql.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

> Powers the **Revenue War Room** demo — an approval-safe agent that detects revenue
> leakage, chooses the best intervention, and executes billing actions under policy.

</div>

---

> [!NOTE]
> **Project status: scaffold / pre-build.** This repository currently contains the
> open-source governance, security, and tooling scaffold. The product packages under
> `packages/` and `apps/` are intentionally empty placeholders — implementation is built
> in the open during the build sprint. The directory tree below describes the **intended**
> architecture, not shipped code. See [`ROADMAP.md`](./ROADMAP.md) for milestones.

## The problem

Usage-based and hybrid pricing has made billing operationally heavy: many rates, usage
dimensions, credits, commitments, and frequent pricing changes. The result is **revenue
leakage** — under-monetized usage, margin compression, and failed-payment loss — that
manual RevOps teams catch too slowly. This isn't a dashboard problem; it's a cashflow and
margin-protection problem.

## What OpenRevOps is

OpenRevOps is a **self-hostable decision-and-execution layer** that sits between usage
telemetry and your billing system. It is built around a transparent, auditable agent loop:

```
ingest → detect risk/opportunity → recommend (with rationale + confidence)
       → enforce policy + human approval gate → execute via connector → audit
```

It is **not** a payment processor and **not** a replacement for your ERP or
revenue-recognition stack. Stripe provides the billing primitives; OpenRevOps provides the
**decision intelligence, policy/guardrail orchestration, and auditable approvals** over
those primitives.

### Principles

- **Approval-safe by default.** Irreversible actions require an explicit human approval
  gate. There is a hard kill-switch to require approval for _everything_.
- **Transparent.** Every action produces a human-readable decision trace and an
  append-only audit record.
- **Reproducible.** Core demo flows run end-to-end on **synthetic data** with a fixed
  seed — no private corpus required.
- **Extensible.** Connectors and policy rules are modular adapters.

## Architecture (intended)

```text
open-revops/
  apps/
    web/                       # Next.js operator UI (recommendations, approvals, audit timeline)
    api/                       # Agent API + orchestration
  packages/
    agent-core/                # Planning, decision policy, execution graph
    policy-engine/             # Guardrails, approval gates, action thresholds
    connectors-stripe/         # Billing / checkout / dispute action adapters
    connectors-exa/            # Search / research context adapters
    connectors-storage/        # DB / event-store / audit-log adapters
    domain-pricing/            # Outcome-to-Invoice domain logic
    domain-renewals/           # Renewal-negotiation domain logic
    evals/                     # Replay / evaluation harness for agent decisions
    demo-data/                 # Synthetic accounts / usage events (deterministic)
  docs/                        # Architecture, threat model, decision-trace spec, demo script
```

| Layer       | Technology (intended)                |
| ----------- | ------------------------------------ |
| Frontend    | Next.js (deployable on Vercel)       |
| Agent API   | Node/TypeScript orchestration        |
| Worker      | Async tool execution + retries (AWS) |
| Research    | Exa retrieval                        |
| Actions     | Stripe Billing / Checkout / Disputes |
| Audit       | Append-only decision + action log    |

See [`docs/architecture.md`](./docs/architecture.md) and
[`docs/threat-model.md`](./docs/threat-model.md).

## Quickstart

> Prerequisites: **Node 22+** (`.nvmrc`), **pnpm 10+** (via `corepack enable`), and a
> **Stripe test-mode** account. Use sandbox/test keys only.

```bash
git clone https://github.com/mvincentong/open-revops.git
cd open-revops

# Use the pinned Node version and package manager
nvm use            # or: fnm use
corepack enable

# Configure environment (never commit your .env)
cp .env.example .env   # then fill in TEST keys

# Install workspace dependencies
pnpm install
```

The standardized command surface every package exposes (see
[CONTRIBUTING](./CONTRIBUTING.md)):

```bash
pnpm lint          # lint + format check
pnpm typecheck     # type checks
pnpm test          # unit tests
pnpm build         # build all packages
pnpm demo:seed     # seed deterministic synthetic data (once implemented)
pnpm demo:reset    # reset demo to a clean state
pnpm dev           # run the operator UI + API locally
```

> While the repo is in the scaffold phase these scripts are placeholders that exit
> successfully; they are filled in as packages land.

## Security

Security is a first-class concern because this project touches billing actions:

- **No secrets in the repo.** Secrets are read from the environment only. `.env` is
  gitignored; `.env.example` documents required variables. Secret scanning runs in CI.
- **Webhook verification.** Stripe webhook signatures are verified before processing.
- **Approval gate.** Irreversible actions are gated behind explicit human approval.
- **Audit trail.** Append-only decision/action records with redaction of sensitive fields.

Found a vulnerability? **Do not open a public issue.** See [`SECURITY.md`](./SECURITY.md)
for private disclosure via GitHub Security Advisories.

## Contributing

We welcome contributions! Please read:

- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — local setup, branch/commit style, PR checklist
- [`AGENTS.md`](./AGENTS.md) — rules for AI coding agents **and** humans (scope, sources,
  prohibited copying, security/data handling)
- [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- [`docs/`](./docs) — architecture and specs

This repo is pre-wired for [Claude Code](https://claude.com/claude-code) with the
[Superpowers](https://github.com/obra/superpowers) and [ECC](https://github.com/affaan-m/ecc)
plugins. See [`.claude/README.md`](./.claude/README.md) for how that works and the trust
prompt you will see on first open.

## License

[Apache-2.0](./LICENSE) © 2026 OpenRevOps Contributors. See [`NOTICE`](./NOTICE) for
third-party attributions.
