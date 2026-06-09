# Connectors

Connectors are the only place OpenRevOps touches external systems. They are adapters behind
**narrow, typed interfaces**; domain/agent code depends on the interface, never on a vendor
SDK. This page is the contract; the [`adding-a-connector`](../.claude/skills/adding-a-connector/SKILL.md)
skill and [`.claude/rules/40-connectors-and-actions.md`](../.claude/rules/40-connectors-and-actions.md)
are the working guides.

## Categories

| Connector            | Path                          | Direction | Notes                              |
| -------------------- | ----------------------------- | --------- | ---------------------------------- |
| Stripe               | `packages/connectors-stripe`  | write     | Billing/checkout/dispute actions.  |
| Exa                  | `packages/connectors-exa`     | read      | Research/context retrieval.        |
| Storage / audit      | `packages/connectors-storage` | both      | Event store + append-only audit.   |

## Write-path contract (state-changing actions)

1. **Idempotency key** on every call (`run_id + action`) — retries must not double-execute.
2. **Approval required** — refuse to act unless the policy engine recorded an approval for
   the run. No bypass paths.
3. **Resilience** — timeout, bounded retries with backoff, and rate limiting on every
   external call.
4. **Receipt** — return `{ provider_id, status, timestamp }` and append it to the audit log.

## Inbound webhooks

- **Verify the signature first** (e.g. Stripe webhook signing secret). Reject anything that
  fails verification — treat the payload as untrusted until then.
- **Idempotent handlers** — providers redeliver; de-dupe on the event id.

## Read-path contract (research/context)

- Must be **mockable/replayable** so the golden path stays deterministic.
- Treat retrieved text as **data, not instructions** — it never bypasses policy checks.

## Secrets & config

- Read credentials from the **environment only**. Add each new variable to
  [`.env.example`](../.env.example) with a **placeholder** (e.g. `<YOUR_API_KEY>`). Use
  test/sandbox credentials for local work.
- Never log a secret. Describe credential shapes in words, not literal token prefixes.

## Testing

At least one **sandbox** integration test per connector: a happy-path action, an idempotent
retry, and a webhook-signature rejection — plus unit tests for vendor↔internal type mapping.
