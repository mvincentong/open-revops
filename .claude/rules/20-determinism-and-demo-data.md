# Rule: determinism and demo data

The live demo must produce the **same output every run**. Judges (and tests) rely on a
deterministic golden path.

## Synthetic data only

- All demo and test data is **synthetic and reproducible**. No PII, no real billing
  records, no scraped customer data — ever (see [`AGENTS.md`](../../AGENTS.md)).
- Synthetic fixtures live in `packages/demo-data`. Generate them from a **fixed seed**
  (`DEMO_SEED`), so the same inputs yield the same accounts, usage events, and KPIs.

## Determinism

- No wall-clock time, randomness, or network nondeterminism on the golden path. Inject a
  clock and a seeded RNG; freeze them in demo/test mode.
- External context (e.g. Exa results) that can vary must be **mockable/replayable** for the
  golden path. Live calls are fine for exploration but must have a deterministic fallback.
- The golden-path scenario has expected outputs (recommendation, approval state, KPI
  before/after, execution-receipt fields). Treat those as a contract.

## Changing expected outputs

- If a change alters golden-path output, **call it out explicitly** in the PR and get
  integration-owner sign-off. Update the expected values and the eval fixtures in the same
  PR. Silent drift in the demo is a release blocker.

## Reset

- `pnpm demo:seed` seeds a known clean state; `pnpm demo:reset` returns to it. Both must be
  safe to run repeatedly and must not depend on prior state.
