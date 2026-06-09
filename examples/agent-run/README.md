# Example: golden-path agent run

The end-to-end flow OpenRevOps is built around, on **synthetic data**:

```
detect leakage risk → recommend a credit → pause at approval gate
                    → execute Stripe (sandbox) → append audit record → KPI delta
```

[`golden-path.json`](./golden-path.json) is the concrete **data contract** for this run —
the request, the recommendation + decision trace, the approval, and the append-only audit
records, using the schemas in [`docs/decision-trace-spec.md`](../../docs/decision-trace-spec.md)
and the locked demo defaults (`apply_credit`; `leakage_risk` 0.14 → 0.05). The demo and the
`evals` harness assert against these exact values, so the golden path is deterministic.

## What it shows

| Step | Artifact in `golden-path.json` | Notes                                            |
| ---- | ------------------------------ | ------------------------------------------------ |
| 1    | `request`                      | One account + scenario, `run_mode: dry_run`.     |
| 2    | `response`                     | Recommendation, alternatives, confidence, KPIs.  |
| 3    | `approval`                     | Human approves the irreversible action.          |
| 4    | `audit_log[]`                  | Append-only: recommendation → approval → action. |

## Running it (once the apps land)

```bash
pnpm demo:reset          # known clean state
pnpm demo:seed           # deterministic synthetic data (DEMO_SEED)
pnpm dev                 # operator UI + agent API
# POST the request body from golden-path.json to /api/agent/run, approve in the UI,
# and confirm the response + audit records match this file.
```

> Scaffold note: the runner is not implemented yet (`apps/web`, `apps/api` are
> placeholders). This example currently serves as the **executable specification** of the
> golden path — see [`ROADMAP.md`](../../ROADMAP.md) v0.1.

## Rules

No secrets, no real customer data — Stripe runs in **sandbox/test mode** only. Output must be
identical every run (see [`.claude/rules/20-determinism-and-demo-data.md`](../../.claude/rules/20-determinism-and-demo-data.md)).
