# Demo script

A tight, reliable stage flow for the **Revenue War Room** demo. The golden path is
deterministic (see [`.claude/rules/20-determinism-and-demo-data.md`](../.claude/rules/20-determinism-and-demo-data.md)),
so the same run produces the same result every time.

## Before you present

- [ ] `pnpm demo:reset` to a known clean state.
- [ ] Pre-seeded sandbox entities exist (test customer, plan, events).
- [ ] `pnpm demo:seed` with the fixed `DEMO_SEED`.
- [ ] A 60–90s backup recording is ready in case of network/API issues.

## 4-minute live flow

1. **Set the scene (~30s).** Show an account with synthetic usage and current pricing.
   One sentence on the pain: usage-based billing leaks revenue faster than RevOps can catch.
2. **Run the agent (~60s).** Trigger `POST /api/agent/run`. Show the **decision trace**:
   problem detected → alternatives considered → chosen action + confidence.
3. **Show tool use (~30s).** Point out the inputs (usage data + Exa context) and the prepared
   Stripe action — the agent did real work, not a canned response.
4. **Pause at the guardrail (~30s).** The action is irreversible, so it stops at the
   **approval gate**. This is the trust story: nothing money-moving happens without a human.
5. **Approve & execute (~45s).** Approve; a **Stripe sandbox** action executes and returns a
   receipt, which is appended to the audit log.
6. **Show the outcome (~30s).** The KPI panel updates **before → after** (e.g. leakage risk
   0.14 → 0.05). Close on measurable impact.

## 90-second fallback

If the network or an API is flaky, switch to the backup recording and narrate:
"agent runs → trace → approval gate → sandbox execution → KPI delta." Same story,
compressed. Decide the switch on the first failed live call; don't debug on stage.

## Talking points (judge Q&A)

- **Why now:** AI pricing complexity is rising faster than revenue-ops capacity, creating
  avoidable leakage.
- **Why agentic:** it doesn't just report — it chooses and executes the best action under
  policy.
- **Why not Stripe alone:** Stripe provides primitives; OpenRevOps adds decisioning,
  approvals, and cross-signal orchestration.
- **Why OSS:** teams self-host transparent decision infrastructure and extend connectors
  without lock-in.
- **What's live vs mocked:** the run/trace/approval/Stripe-sandbox execution are live; the
  risk score is a heuristic and some external context may be replayed for reliability.
