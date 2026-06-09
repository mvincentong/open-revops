# Examples

Runnable examples of OpenRevOps in action. Each example uses **synthetic data only** and
must run without real credentials (sandbox/test keys where a connector is involved).

> Scaffold note: examples land alongside the packages they demonstrate. The first one will
> be the end-to-end agent run below.

## Planned

- **`agent-run/`** — the golden-path end-to-end flow: `POST /api/agent/run` →
  recommendation + decision trace → approval → Stripe **sandbox** execution → audit record
  + KPI delta. Mirrors [`docs/demo-script.md`](../docs/demo-script.md) and the schemas in
  [`docs/decision-trace-spec.md`](../docs/decision-trace-spec.md).

## Conventions

- No secrets, no real customer data — ever. Document any required env var in
  [`.env.example`](../.env.example) with a placeholder.
- Deterministic: seed via `DEMO_SEED` so an example produces identical output every run.
- Each example has its own `README.md` with the exact commands to run it.
