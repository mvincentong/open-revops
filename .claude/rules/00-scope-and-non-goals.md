# Rule: scope and non-goals

OpenRevOps is deliberately narrow. Staying in scope is what makes the demo shippable and
the codebase reviewable.

## In scope (MVP)

- The agent loop: **ingest → detect → recommend → approve → execute → audit**.
- Exactly **one** of each, kept narrow on purpose: one trigger type, one recommendation
  type, one Stripe sandbox action, one approval gate, one KPI panel.
- Modular connectors (Stripe, Exa, storage) behind stable interfaces.
- A policy/guardrail engine with confidence thresholds and a kill-switch.
- Deterministic synthetic demo data and a replay/eval harness.

## Out of scope (do not build)

- Multi-tenant admin or complex role hierarchies.
- Full ERP or revenue-recognition coverage.
- Multiple unrelated agent workflows in one release.
- Anything that requires proprietary benchmark data to function.

## Package boundaries

- Read a package's `README.md` and public interface **before** editing it. Depend on
  published interfaces; do not reach into another package's internals.
- Lock cross-cutting contracts (API request/response, event/audit schema, UI data model)
  **before** parallel work. Changing a locked schema needs integration-owner sign-off
  (see [`.github/CODEOWNERS`](../../.github/CODEOWNERS)).
- Cross-cutting config (`.github/`, root tooling, CI) is owned centrally — coordinate
  before changing it.

## When unsure

If a change might be out of scope, irreversible, or schema-breaking: **stop and open a
discussion/issue** rather than guessing. A small, well-scoped slice beats a broad one that
breaks the golden path.
