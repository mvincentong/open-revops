# OpenRevOps documentation

> **Status: scaffold.** These documents describe the **intended** design and contracts.
> They are written before/while the product code lands so contributors share one source of
> truth. Where a doc gets ahead of the code, treat it as the target, not a claim of done.

| Doc                                                | What it covers                                            |
| -------------------------------------------------- | --------------------------------------------------------- |
| [`architecture.md`](./architecture.md)             | System components, the agent loop, and data flow.         |
| [`threat-model.md`](./threat-model.md)             | Assets, trust boundaries, threats, and mitigations.       |
| [`decision-trace-spec.md`](./decision-trace-spec.md) | Schemas for run/recommendation/approval/audit records.  |
| [`policy-rules.md`](./policy-rules.md)             | Guardrail matrix, confidence thresholds, kill-switch.     |
| [`connectors.md`](./connectors.md)                 | Connector contracts (Stripe/Exa/storage).                 |
| [`deployment.md`](./deployment.md)                 | Local and cloud deployment paths.                         |
| [`demo-script.md`](./demo-script.md)               | The 4-minute stage flow and a fallback.                   |
| [`parallel-work-plan.md`](./parallel-work-plan.md) | v0.1 workstreams, contracts, and integration order.       |

See also the operating contract [`AGENTS.md`](../AGENTS.md), the project rules in
[`.claude/rules/`](../.claude/rules), and the [`ROADMAP.md`](../ROADMAP.md).
