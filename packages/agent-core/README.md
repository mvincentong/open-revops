# @open-revops/agent-core

Planning, decision policy, and the execution graph for the agent loop.

## Purpose

`agent-core` composes the OpenRevOps agent loop on the deterministic golden path:

```
ingest → detect (leakage risk) → recommend (action + rationale + confidence)
       → enforce policy (decide)  → POST /api/agent/run response
```

It depends on the published interfaces of `@open-revops/demo-data` (the seeded
`golden_path_v1` scenario) and `@open-revops/policy-engine` (the guardrail matrix,
kill-switch, and `decide()`), not their internals.

## Public interface

- `ingest(scenario)` → `UsageSummary` — sum seeded usage events; carry the plan
  allowance and rate forward (pure, deterministic).
- `detect(summary)` → `LeakageDetection` — a transparent leakage-risk heuristic:
  `round2(clamp(overageRatio * LEAKAGE_SENSITIVITY, 0, LEAKAGE_RISK_CAP))`. The
  sensitivity is calibrated so the golden scenario reports `leakage_risk = 0.14`.
- `recommend(detection)` → `RecommendationOutcome` — the chosen action
  (`apply_credit`), calibrated confidence (`0.86`), expected KPI delta
  (`leakage_risk` `0.14 → 0.05`), alternatives considered, and a human rationale.
- `runGoldenPath(config?)` → `AgentRunResponse` — runs the full loop, routing the
  recommendation through the policy engine, and returns the exact
  `POST /api/agent/run` (v1) shape from
  [`docs/decision-trace-spec.md`](../../docs/decision-trace-spec.md). With the demo
  defaults (`DEMO_POLICY_CONFIG`, kill-switch ON) the status is `needs_approval`.

The policy engine is the safety core and is never bypassed
(see [`.claude/rules/10-security-and-secrets.md`](../../.claude/rules/10-security-and-secrets.md)).

## Scripts

`test`, `typecheck`, and `build` are wired up; the root commands invoke them via
`pnpm -r --if-present`. See [`CONTRIBUTING.md`](../../CONTRIBUTING.md).
