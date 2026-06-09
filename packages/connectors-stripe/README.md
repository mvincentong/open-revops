# @open-revops/connectors-stripe

Stripe billing action adapters (write path). This package implements the **`apply_credit`**
action behind a narrow, typed, approval-gated interface. Domain and agent code depend on
this package's exported interface — never on the Stripe SDK directly.

Contract: [`docs/connectors.md`](../../docs/connectors.md) and
[`.claude/rules/40-connectors-and-actions.md`](../../.claude/rules/40-connectors-and-actions.md).

## Public interface

```ts
import {
  applyCredit,
  createStripeCreditClient,
  type ApplyCreditArgs,
  type CreditReceipt,
} from '@open-revops/connectors-stripe';

// Production: the client reads STRIPE_SECRET_KEY from the environment (only).
const client = createStripeCreditClient();

const receipt: CreditReceipt = await applyCredit(
  {
    runId: 'run_123', // ties the action to a recorded decision + approval
    accountId: 'cus_...', // Stripe customer id
    amountCents: 500, // positive magnitude of credit, in minor units
    approvalRecorded: true, // MUST be true — there is no bypass
    currency: 'usd', // optional, defaults to 'usd'
  },
  { client },
);
// → { provider_id, status: 'succeeded', timestamp } — append this to the audit log.
```

`applyCredit(args, deps)` is the single write-path entry point. `deps.client` is the narrow
`StripeCreditClient` port (injected so it can be faked in tests); `deps.retry` optionally
overrides the timeout / attempts / backoff.

### How the write-path contract is enforced

- **Idempotency.** Every call derives its key from `run_id + action`
  (`deriveIdempotencyKey`), so retries — ours or the caller's — never double-apply a credit.
- **Approval gate (no bypass).** `applyCredit` refuses with `ApprovalRequiredError` unless
  `approvalRecorded === true`; the vendor is never contacted without a recorded approval.
- **Resilience.** Each vendor call runs under a per-attempt timeout and a bounded retry with
  exponential backoff (`resilience.ts`). Only transient failures (timeouts, connection
  errors, HTTP 429/5xx) are retried; retries reuse the same idempotency key. The SDK's own
  network retries are disabled so this layer owns retry behaviour.
- **Receipt.** Returns `{ provider_id, status, timestamp }` for the append-only audit log.
- **Vendor types at the edge.** Only `stripe-client.ts` imports the Stripe SDK; it narrows
  the vendor object to an internal type and `mapping.ts` maps it to the `CreditReceipt`.

### Secrets

`createStripeCreditClient()` reads `STRIPE_SECRET_KEY` from the environment only — never
hardcoded, never from a tracked file. Use a **test-mode** key locally. See
[`.env.example`](../../.env.example).

## Scripts

```bash
pnpm --filter @open-revops/connectors-stripe test       # unit tests (always run)
pnpm --filter @open-revops/connectors-stripe typecheck
pnpm --filter @open-revops/connectors-stripe build
```

### Sandbox integration test

`src/stripe-credit.integration.test.ts` runs against the Stripe sandbox **only** when
`STRIPE_TEST_SECRET_KEY` (a Stripe test-mode secret key) is set; otherwise it logs a clear
skip note. It covers a happy-path credit and an idempotent retry. To run it:

```bash
STRIPE_TEST_SECRET_KEY=<your-stripe-test-secret-key> \
  pnpm --filter @open-revops/connectors-stripe test
```
