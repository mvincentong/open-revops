# Architecture

OpenRevOps is a **self-hostable decision-and-execution layer** between usage telemetry and a
billing system. It turns signals into recommended billing actions, gates irreversible ones
behind human approval, executes through connectors, and records an auditable trail.

> Scaffold note: this describes the intended design. Packages under `packages/`/`apps/` are
> placeholders today; the contracts below are what they build toward.

## The agent loop

```
ingest → detect risk/opportunity → recommend (rationale + confidence)
       → enforce policy + human approval gate → execute via connector → audit
```

1. **Ingest** — pull account usage + contract/pricing context (synthetic on the golden
   path).
2. **Detect** — score risk/opportunity (e.g. leakage risk) with a transparent heuristic.
3. **Recommend** — produce a ranked recommendation with alternatives, rationale, and a
   calibrated confidence.
4. **Enforce policy** — the policy engine maps the recommendation to
   auto-execute / needs-approval / blocked via the guardrail matrix and kill-switch.
5. **Approve** — a human approves irreversible actions in the operator UI.
6. **Execute** — a connector performs the action with an idempotency key and returns a
   receipt.
7. **Audit** — an append-only record links run → trace → approval → receipt.

## Components

```text
apps/
  web/    Next.js operator UI — recommendation, decision trace, approval gate, KPI panel
  api/    Agent API + orchestration (run, approval, audit endpoints)
packages/
  agent-core/         planning, decision policy, execution graph
  policy-engine/      guardrails, approval gates, confidence thresholds, kill-switch
  connectors-stripe/  billing / checkout / dispute action adapters (write path)
  connectors-exa/     research / context retrieval (read path)
  connectors-storage/ event store + append-only audit log adapters
  domain-pricing/     Outcome-to-Invoice domain logic
  domain-renewals/    renewal-negotiation domain logic
  evals/              replay / evaluation harness scoring decision quality
  demo-data/          synthetic accounts / usage events (deterministic, seeded)
```

| Layer     | Technology (intended)                |
| --------- | ------------------------------------ |
| Frontend  | Next.js (deployable on Vercel)       |
| Agent API | Node/TypeScript orchestration        |
| Worker    | Async tool execution + retries (AWS) |
| Research  | Exa retrieval                        |
| Actions   | Stripe Billing / Checkout / Disputes |
| Audit     | Append-only decision + action log    |

## Data flow (request → action)

1. `POST /api/agent/run` with an account + scenario → agent produces a recommendation and a
   decision trace; status is `needs_approval` for gated actions.
2. Operator reviews the trace in the UI and approves/denies.
3. On approval, the orchestrator invokes the connector with an idempotency key.
4. The connector returns a receipt; the orchestrator appends an audit record and updates the
   KPI panel (before/after).

See [`decision-trace-spec.md`](./decision-trace-spec.md) for exact schemas,
[`policy-rules.md`](./policy-rules.md) for the guardrail matrix, and
[`connectors.md`](./connectors.md) for connector contracts.

## Design principles

- **Approval-safe by default** — irreversible actions need explicit approval; a kill-switch
  can force approval for everything.
- **Transparent** — every action is explainable (trace) and recorded (audit).
- **Reproducible** — the golden path runs on seeded synthetic data with identical output.
- **Extensible** — connectors and policy rules are modular adapters behind stable
  interfaces.
