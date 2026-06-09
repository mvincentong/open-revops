import type { StripeBalanceTransactionLike } from './mapping.js';

/**
 * A single state-changing request the connector knows how to make. Expressed in
 * internal types; the edge adapter translates it into vendor SDK calls.
 */
export interface CreateCreditRequest {
  /** Stripe customer id to credit. */
  readonly accountId: string;
  /** Positive magnitude of the credit, in minor units. */
  readonly amountCents: number;
  /** ISO-4217 currency code. */
  readonly currency: string;
  /** Idempotency key derived from `run_id + action` — replays must not re-execute. */
  readonly idempotencyKey: string;
}

/**
 * The narrow port the connector core depends on. The rest of the system depends
 * on this interface, never on the Stripe SDK. The real implementation lives in
 * `stripe-client.ts`; unit tests inject a fake.
 */
export interface StripeCreditClient {
  applyCredit(request: CreateCreditRequest): Promise<StripeBalanceTransactionLike>;
}
