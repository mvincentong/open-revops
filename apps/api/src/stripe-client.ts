/**
 * In-memory Stripe credit client — the default write-path adapter for the demo.
 *
 * It implements the narrow `StripeCreditClient` port from
 * `@open-revops/connectors-stripe` (so the real `applyCredit` orchestration,
 * including the approval gate and idempotency, runs unchanged) but performs no
 * network I/O and needs no `STRIPE_SECRET_KEY`. Behaviour is deterministic and
 * idempotent: the same idempotency key always yields the same balance
 * transaction, mirroring Stripe's own idempotency contract so retries can't
 * double-apply a credit.
 */

import type {
  CreateCreditRequest,
  StripeBalanceTransactionLike,
  StripeCreditClient,
} from '@open-revops/connectors-stripe';

import type { Clock } from './clock.js';

/**
 * Build a deterministic, idempotent in-memory Stripe credit client. The injected
 * clock supplies the transaction's `created` time (epoch seconds) so timestamps
 * stay reproducible.
 */
export function createInMemoryStripeClient(clock: Clock): StripeCreditClient {
  const byKey = new Map<string, StripeBalanceTransactionLike>();

  return {
    applyCredit(request: CreateCreditRequest): Promise<StripeBalanceTransactionLike> {
      const existing = byKey.get(request.idempotencyKey);
      if (existing) {
        return Promise.resolve(existing);
      }
      const txn: StripeBalanceTransactionLike = {
        id: `cbtxn_${request.idempotencyKey}`,
        created: Math.floor(Date.parse(clock.now()) / 1000),
        // Negative amount: a credit granted to the customer (Stripe's sign convention).
        amount: -request.amountCents,
        currency: request.currency,
      };
      byKey.set(request.idempotencyKey, txn);
      return Promise.resolve(txn);
    },
  };
}
