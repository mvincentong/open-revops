import Stripe from 'stripe';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { applyCredit } from './apply-credit.js';
import { createStripeCreditClient } from './stripe-client.js';
import type { StripeCreditClient } from './port.js';
import type { ApplyCreditArgs } from './types.js';

/**
 * Sandbox integration test for the apply_credit write path.
 *
 * It runs ONLY when `STRIPE_TEST_SECRET_KEY` (a Stripe **test-mode** secret key)
 * is present in the environment, and logs a clear skip note otherwise. This is
 * the sanctioned gating for credential-dependent sandbox tests (the task brief
 * and `.claude/rules/30-testing-and-ci.md`) — not a `.skip` used to dodge CI.
 * The pure logic (idempotency, approval gate, mapping, timeout, bounded retry)
 * is fully covered by the unit tests, which always run.
 *
 * Coverage here: a happy-path credit, and an idempotent retry (re-issuing the
 * SAME run id returns the SAME provider id — no double credit).
 */
const secretKey = process.env.STRIPE_TEST_SECRET_KEY?.trim();

if (!secretKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '\n[connectors-stripe] SKIPPING Stripe sandbox integration tests: ' +
      'set STRIPE_TEST_SECRET_KEY (a Stripe test-mode secret key) to run them. ' +
      'Unit tests already cover idempotency, the approval gate, mapping, timeout, and retries.\n',
  );
}

describe.skipIf(!secretKey)('apply_credit · Stripe sandbox', () => {
  // Guaranteed defined by skipIf above. Construction is deferred to beforeAll so
  // that a skipped suite performs no side effects at collection time.
  const testKey = secretKey as string;

  let stripe: Stripe;
  let client: StripeCreditClient;
  let customerId: string;

  beforeAll(async () => {
    stripe = new Stripe(testKey, { maxNetworkRetries: 0, timeout: 20_000 });
    client = createStripeCreditClient({ secretKey: testKey });

    const customer = await stripe.customers.create({
      description: 'OpenRevOps connectors-stripe integration test (safe to delete)',
    });
    customerId = customer.id;
  }, 20_000);

  afterAll(async () => {
    if (customerId) {
      // Best-effort cleanup of the throwaway test customer.
      await stripe.customers.del(customerId).catch(() => undefined);
    }
  }, 20_000);

  it(
    'applies a credit and returns a succeeded receipt',
    async () => {
      const args: ApplyCreditArgs = {
        runId: `it-happy-${Date.now()}`,
        accountId: customerId,
        amountCents: 500,
        approvalRecorded: true,
        currency: 'usd',
      };

      const receipt = await applyCredit(args, { client });

      expect(receipt.status).toBe('succeeded');
      expect(receipt.provider_id).toMatch(/.+/);
      expect(Number.isNaN(Date.parse(receipt.timestamp))).toBe(false);
    },
    20_000,
  );

  it(
    'is idempotent: replaying the same run id returns the same provider id (no double credit)',
    async () => {
      const args: ApplyCreditArgs = {
        runId: `it-idem-${Date.now()}`,
        accountId: customerId,
        amountCents: 750,
        approvalRecorded: true,
        currency: 'usd',
      };

      const first = await applyCredit(args, { client });
      // Same args → same derived idempotency key → Stripe returns the same object.
      const second = await applyCredit(args, { client });

      expect(second.provider_id).toBe(first.provider_id);
    },
    20_000,
  );
});
