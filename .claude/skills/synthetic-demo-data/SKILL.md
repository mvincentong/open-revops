---
name: synthetic-demo-data
description: Use when creating or changing demo/test data, fixtures, or the golden-path scenario in OpenRevOps (packages/demo-data, evals) - keeps all data synthetic, seeded, and deterministic so the demo and tests produce identical output every run and never contain PII or real billing records
---

# Synthetic, deterministic demo data

## Overview

The OpenRevOps demo must produce the **same output every run**, using data that is **100%
synthetic**. This keeps the demo trustworthy, the tests stable, and the repo free of PII or
real billing records.

**Core principle:** same seed in → same accounts, usage, recommendation, and KPIs out. If
output drifts between runs, the demo is broken.

**Announce at start:** "I'm using the synthetic-demo-data skill to keep fixtures synthetic
and deterministic."

See [`.claude/rules/20-determinism-and-demo-data.md`](../../rules/20-determinism-and-demo-data.md).

## Rules

1. **Synthetic only.** Invent accounts, usage events, and amounts. **Never** copy real
   customer data, PII, or billing records — not even "anonymized" production rows.
2. **Seed everything.** Generate fixtures from `DEMO_SEED`. Inject a seeded RNG and a fixed
   clock; do not call wall-clock time or unseeded randomness on the golden path.
3. **Stable identifiers.** Use readable, fixed ids (`acct_demo_001`, `run_001`). Don't
   generate ids from time or randomness that changes per run.
4. **One golden path, with expected outputs.** The scenario has a contract: expected
   recommendation, approval state, KPI before/after, and execution-receipt fields. Encode
   those expectations in `evals` fixtures.
5. **Reset is idempotent.** `pnpm demo:seed` / `pnpm demo:reset` must be safe to run
   repeatedly and must not depend on prior state.

## When you change a fixture

- If the change alters golden-path output, **update the expected values in the same PR**,
  call it out explicitly, and get integration-owner sign-off. Silent demo drift is a
  release blocker.
- Add a failure-path scenario too where useful (approval denied, connector timeout) — but
  keep it equally deterministic.

## Red flags — stop and reconsider

- A fixture sourced from anything real, or containing anything that looks like PII.
- Wall-clock time or unseeded `Math.random()` reaching the golden path.
- Expected-output fixtures left stale after a logic change.
- `demo:reset` that only works from a clean checkout.
