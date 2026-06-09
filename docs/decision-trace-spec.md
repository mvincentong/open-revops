# Decision-trace & audit spec

Every agent action produces two artifacts: a human-readable **decision trace** (why) and an
append-only **audit record** (what happened). This document defines their shape. See the
[`decision-trace`](../.claude/skills/decision-trace/SKILL.md) skill for authoring guidance.

> These schemas are the **contract** locked before parallel work. Changing them requires
> integration-owner sign-off (see [`.github/CODEOWNERS`](../.github/CODEOWNERS)). Versions
> are explicit so connectors and the UI can evolve safely.

## Redaction (applies to every record)

- Never store raw secrets, full account numbers, or PII. Use stable, non-sensitive ids.
- Redact before persistence, not after. A trace that "will be redacted later" is a leak.

## `POST /api/agent/run` — request (v1)

```json
{
  "account_id": "acct_demo_001",
  "scenario_id": "golden_path_v1",
  "run_mode": "dry_run"
}
```

## `POST /api/agent/run` — response (v1)

```json
{
  "run_id": "run_001",
  "status": "needs_approval",
  "recommendation": {
    "action_type": "apply_credit",
    "confidence": 0.86,
    "expected_kpi_delta": {
      "metric": "leakage_risk",
      "before": 0.14,
      "after": 0.05
    }
  },
  "alternatives_considered": ["change_plan_tier", "invoice_alert_only"],
  "rationale": "Usage pattern indicates recoverable leakage; credit is the lowest-risk action under policy."
}
```

`status` is one of `auto_executed | needs_approval | blocked`. `alternatives_considered`
must list every action the guardrail matrix permitted — a trace with only the winner is
incomplete.

## Approval — payload (v1)

```json
{
  "run_id": "run_001",
  "approved_by": "demo_operator",
  "decision": "approve",
  "notes": "Proceed for demo"
}
```

`decision` is `approve | deny`. No irreversible action executes without a stored `approve`
event for that `run_id`.

## Audit record (v1, append-only)

```json
{
  "timestamp": "2026-06-09T12:34:56Z",
  "run_id": "run_001",
  "event_type": "action_executed",
  "actor": "demo_operator",
  "connector": "stripe",
  "idempotency_key": "run_001:apply_credit",
  "result": "success"
}
```

`event_type` examples: `run_started`, `recommendation_made`, `approval_requested`,
`approval_recorded`, `action_executed`, `action_failed`. Records are **appended**, never
edited or deleted. The chain for one run links: `run → recommendation/trace → approval →
execution receipt`.

## Determinism

On the golden path, identical inputs must yield an identical trace (modulo the injected
timestamp). No wall-clock or unseeded randomness in the rendered text. See
[`.claude/rules/20-determinism-and-demo-data.md`](../.claude/rules/20-determinism-and-demo-data.md).
