import { InvalidVendorResponseError } from './errors.js';
import type { CreditReceipt } from './types.js';

/**
 * Structural subset of a Stripe `CustomerBalanceTransaction` that this connector
 * depends on. Declaring our own shape (rather than importing the SDK type) keeps
 * vendor types at the edge: only `stripe-client.ts` touches the real SDK, and it
 * narrows the SDK object down to this before anything else sees it.
 */
export interface StripeBalanceTransactionLike {
  /** Vendor object id, e.g. `cbtxn_...`. */
  readonly id: string;
  /** Creation time as a Unix epoch in **seconds** (Stripe's convention). */
  readonly created: number;
  /** Amount in minor units; negative means a credit was granted to the customer. */
  readonly amount: number;
  /** ISO-4217 currency code. */
  readonly currency: string;
}

/**
 * Map a (already narrowed) Stripe balance transaction to the internal
 * {@link CreditReceipt}. A returned balance transaction is durably committed by
 * Stripe at the moment of the response, so it maps to a `succeeded` receipt;
 * failures surface as thrown errors upstream, never as a receipt.
 */
export function mapBalanceTransactionToReceipt(
  txn: StripeBalanceTransactionLike,
): CreditReceipt {
  if (typeof txn.id !== 'string' || txn.id.trim().length === 0) {
    throw new InvalidVendorResponseError('missing balance-transaction id');
  }
  if (typeof txn.created !== 'number' || !Number.isFinite(txn.created)) {
    throw new InvalidVendorResponseError('missing or non-finite "created" timestamp');
  }

  return {
    provider_id: txn.id,
    status: 'succeeded',
    // Stripe timestamps are epoch seconds; the audit log uses ISO-8601 UTC.
    timestamp: new Date(txn.created * 1000).toISOString(),
  };
}
