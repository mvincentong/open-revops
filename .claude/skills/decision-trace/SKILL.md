---
name: decision-trace
description: Use when writing or reviewing any agent action in OpenRevOps that recommends or executes a billing action - ensures every action emits a human-readable decision trace (problem, alternatives, choice, confidence) and an append-only audit record, per AGENTS.md and docs/decision-trace-spec.md
---

# Authoring a decision trace

## Overview

Every agent action in OpenRevOps must be **explainable and auditable**. Judges and operators
need to see _why_ the agent chose an action, and there must be a tamper-evident record that
it happened. A decision trace is the "why"; the audit record is the "what happened".

**Core principle:** no action without a trace, and no irreversible action without a recorded
approval. If you can't explain it, don't execute it.

**Announce at start:** "I'm using the decision-trace skill to make sure this action is
explainable and auditable."

Read [`docs/decision-trace-spec.md`](../../../docs/decision-trace-spec.md) for the canonical
schema and field-by-field redaction rules.

## A trace must capture

1. **Problem detected** — what signal triggered this (e.g. leakage-risk above threshold),
   with the inputs that led there.
2. **Alternatives considered** — the other actions the policy allowed, not just the winner.
3. **Chosen action + rationale** — what and why, in plain language.
4. **Confidence** — a calibrated score, plus the threshold it was compared against.
5. **Expected KPI delta** — metric, before, after.
6. **Policy outcome** — auto-execute / needs-approval / blocked, and which guardrail rule
   decided it.

## Steps

1. **Detect → record inputs.** Capture the (synthetic) inputs and the computed risk/score.
   Use stable, non-sensitive ids; **redact** keys, tokens, PII, and full account numbers.
2. **Enumerate alternatives.** Record every action the guardrail matrix permitted and why
   each was or wasn't chosen. A trace with only the winner is incomplete.
3. **State the decision.** Action type, rationale, confidence, threshold, expected KPI
   delta — human-readable.
4. **Run the policy gate.** Map to auto-execute / needs-approval / blocked. If approval is
   required, the trace is "pending" until a human approval event is recorded — **do not
   execute** before then.
5. **Execute, then append.** On approval, perform the connector action with an idempotency
   key, capture the receipt, and write an **append-only** audit record linking run → trace
   → approval → receipt. Never mutate prior records.
6. **Keep it deterministic.** On the golden path the same inputs must produce the same
   trace. No wall-clock or RNG leaking into the text.

## Red flags — stop and reconsider

- An action with no alternatives listed, or no confidence/threshold.
- Executing an irreversible action without a recorded approval event.
- A trace containing a raw secret, full PAN, or PII (redact it).
- Editing or deleting an existing audit record instead of appending a new one.
- Golden-path output that changes between runs.
