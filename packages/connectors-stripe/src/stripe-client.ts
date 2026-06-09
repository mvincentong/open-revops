import Stripe from 'stripe';

import { requireStripeSecretKey } from './config.js';
import type { StripeBalanceTransactionLike } from './mapping.js';
import type { CreateCreditRequest, StripeCreditClient } from './port.js';

/** The SDK constructor's config object (derived so we don't couple to its type name). */
type StripeSdkConfig = NonNullable<ConstructorParameters<typeof Stripe>[1]>;

/**
 * Options for the Stripe-backed client. `secretKey` defaults to the environment
 * (the only supported source); tests pass a sandbox key read from their own env
 * variable so nothing is ever hardcoded.
 */
export interface StripeClientOptions {
  /** Overrides the env secret. Still env-sourced by callers — never a literal. */
  readonly secretKey?: string;
  /** Per-request network timeout handed to the SDK (ms). */
  readonly timeoutMs?: number;
  /** Pin a Stripe API version for reproducibility. */
  readonly apiVersion?: StripeSdkConfig['apiVersion'];
}

/**
 * Build a {@link StripeCreditClient} backed by the real Stripe SDK. This is the
 * ONLY module that imports `stripe`; vendor types are narrowed to
 * {@link StripeBalanceTransactionLike} before leaving here, so the SDK never
 * leaks into domain/agent code.
 *
 * `maxNetworkRetries` is pinned to 0 because our own `withRetry` layer owns
 * retries and backoff — we don't want the SDK retrying underneath us.
 */
export function createStripeCreditClient(options: StripeClientOptions = {}): StripeCreditClient {
  const secretKey = options.secretKey ?? requireStripeSecretKey();

  const stripe = new Stripe(secretKey, {
    maxNetworkRetries: 0,
    timeout: options.timeoutMs ?? 20_000,
    ...(options.apiVersion ? { apiVersion: options.apiVersion } : {}),
  });

  return {
    async applyCredit(request: CreateCreditRequest): Promise<StripeBalanceTransactionLike> {
      // A NEGATIVE customer-balance amount applies a credit (reduces what the
      // customer owes). The caller passes a positive magnitude; we own the sign.
      const txn = await stripe.customers.createBalanceTransaction(
        request.accountId,
        {
          amount: -Math.abs(request.amountCents),
          currency: request.currency,
          description: `OpenRevOps credit (${request.idempotencyKey})`,
        },
        { idempotencyKey: request.idempotencyKey },
      );

      // Narrow the vendor object to our structural type at the edge.
      return {
        id: txn.id,
        created: txn.created,
        amount: txn.amount,
        currency: txn.currency,
      };
    },
  };
}
