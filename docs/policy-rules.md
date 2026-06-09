# Policy & guardrails

The policy engine decides, for each recommendation, whether it may **auto-execute**,
**requires approval**, or is **blocked**. It is the safety core of OpenRevOps and must never
be bypassed (see [`.claude/rules/10-security-and-secrets.md`](../.claude/rules/10-security-and-secrets.md)).

## Inputs

- **Action type** (e.g. `apply_credit`, `send_recovery_prompt`, `plan_migration`).
- **Confidence** — calibrated score in `[0, 1]` from the decision step.
- **Guardrail matrix** — per-action policy (below).
- **Kill-switch** — `POLICY_REQUIRE_APPROVAL_ALWAYS`. When `true`, **everything** requires
  approval regardless of confidence. Default for demos: `true`.
- **Auto-execute threshold** — `POLICY_AUTO_EXECUTE_CONFIDENCE` (e.g. `0.95`). An action may
  auto-execute only if the matrix allows it **and** confidence ≥ threshold **and** the
  kill-switch is off.

## Guardrail matrix (recommended defaults)

| Action type            | Auto-execute | Approval required | Blocked |
| ---------------------- | :----------: | :---------------: | :-----: |
| `apply_credit`         |      no      |        yes        |   no    |
| `send_recovery_prompt` |     yes      |        no         |   no    |
| `plan_migration`       |      no      |        yes        |   no    |
| `invoice_void_or_delete` |    no      |        no         |   yes   |

- **Blocked** actions never execute, period — even with an approval. They exist to make
  dangerous operations unreachable.
- Reversible, low-impact actions (e.g. an internal prompt) may auto-execute; anything
  irreversible or money-moving requires approval.

## Decision procedure

```
if action is BLOCKED        → status = blocked         (never executes)
elif kill_switch is on       → status = needs_approval
elif matrix requires approval→ status = needs_approval
elif confidence >= threshold → status = auto_executed
else                         → status = needs_approval
```

Every outcome is written to the decision trace with **which rule decided it**.

## Idempotency & execution

Approved actions execute through a connector with an idempotency key (`run_id + action`) so
retries can't double-apply. The connector returns a receipt that is appended to the audit
log. See [`connectors.md`](./connectors.md).

## Changing policy

Threshold and matrix changes affect golden-path output. Update the eval fixtures in the same
PR, call out the change, and get integration-owner sign-off.
