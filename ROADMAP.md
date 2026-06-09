# Roadmap

This roadmap describes the intended direction for OpenRevOps. It is a living document —
milestones and ordering will change as the project and its contributors evolve. Nothing
here is a commitment or a guarantee of dates.

> **Status: scaffold / pre-build.** The repository currently ships the open-source
> governance, security, and tooling scaffold. Product code under `apps/` and `packages/`
> is built in the open.

## Guiding principles

- **Approval-safe by default.** Irreversible actions stay behind an explicit human gate.
- **Transparent.** Every action yields a human-readable decision trace and an append-only
  audit record.
- **Reproducible.** Core flows run end-to-end on synthetic data with a fixed seed.
- **Open core.** The decision-and-execution layer stays open source; any hosted control
  plane is optional and never required to run the product.

## v0.1 — Walking skeleton (the demo loop)

The smallest end-to-end slice that proves the agent loop.

- [ ] `agent-core`: ingest → detect → recommend pipeline (single trigger type).
- [ ] `policy-engine`: confidence thresholds + guardrail matrix + hard kill-switch.
- [ ] `connectors-stripe`: one sandbox action (e.g. apply credit) with idempotency.
- [ ] `connectors-storage`: append-only audit log + event store (local default).
- [ ] `demo-data`: deterministic synthetic accounts / usage events (seeded).
- [ ] `apps/web`: operator UI — recommendation, decision trace, approval gate, KPI panel.
- [ ] `apps/api`: orchestration endpoints (`/api/agent/run`, approval, audit).
- [ ] One-command local run; `pnpm demo:seed` / `pnpm demo:reset`.
- [ ] Golden-path scenario produces identical output every run.

**Exit criteria:** fresh clone → running demo in ≤ 15 minutes; end-to-end path succeeds
three consecutive runs; CI green on `main`.

## v0.2 — Hardening & extensibility

- [ ] `connectors-exa`: research/context retrieval feeding decision rationale.
- [ ] `evals`: replay harness scoring decision quality on fixed scenarios.
- [ ] Second action type behind the guardrail matrix.
- [ ] Redaction rules for sensitive fields in logs and traces.
- [ ] Retry/timeout/rate-limit behavior documented and tested for every connector.
- [ ] Failure-path demo scenario (approval denied / connector timeout).
- [ ] `domain-pricing`: Outcome-to-Invoice domain logic.

## v1.0 — Adoptable open core

- [ ] Stable connector interface contracts with a deprecation policy.
- [ ] Documented self-host deployment paths (local + one cloud reference).
- [ ] `domain-renewals`: renewal-negotiation domain logic.
- [ ] Backward-compatibility guarantees for core APIs (semver).
- [ ] Curated `good first issue` / `help wanted` backlog.

## Non-goals

These are intentionally **out of scope** (see [`AGENTS.md`](./AGENTS.md)):

- Multi-tenant admin or complex role hierarchies.
- Full ERP or revenue-recognition coverage.
- Multiple unrelated agent workflows in one release.
- Anything that requires proprietary benchmark data to function.

## Optional hosted layer (not part of OSS scope)

Potential future commercial layers that are **never required** to self-host the open core:
managed control plane, enterprise auth/governance/SLA, an opt-in aggregated benchmark
network, and managed connector operations.

## Contributing to the roadmap

Open a [discussion](./SUPPORT.md) or an issue to propose changes. Large changes should be
aligned in a discussion before implementation — see [`CONTRIBUTING.md`](./CONTRIBUTING.md).
