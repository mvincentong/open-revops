/**
 * Internal, vendor-agnostic types for the Stripe credit connector.
 *
 * Nothing here references the Stripe SDK: domain and agent code depend on these
 * types, never on vendor shapes (see `.claude/rules/40-connectors-and-actions.md`).
 * Vendor types live at the edge in `stripe-client.ts` and are mapped to the
 * `CreditReceipt` below.
 */

/**
 * The single write-path action this connector performs. Used both as the public
 * action label and as the second half of the idempotency key (`run_id + action`).
 */
export const APPLY_CREDIT_ACTION = 'apply_credit' as const;

/** The action label type — kept narrow so callers can't ask for anything else. */
export type CreditAction = typeof APPLY_CREDIT_ACTION;

/**
 * Terminal status of an executed action, normalized away from vendor vocabulary
 * so a provider swap doesn't ripple into the audit log or UI.
 */
export type ReceiptStatus = 'succeeded' | 'pending' | 'failed';

/**
 * Structured execution receipt. Returned to the caller and written verbatim to
 * the append-only audit log. Field names are snake_case to match the audit
 * record / decision-trace schema (`docs/decision-trace-spec.md`).
 */
export interface CreditReceipt {
  /** Stable, non-sensitive vendor object id (e.g. a Stripe balance-transaction id). */
  readonly provider_id: string;
  readonly status: ReceiptStatus;
  /** ISO-8601 UTC timestamp of when the vendor recorded the action. */
  readonly timestamp: string;
}

/**
 * Arguments for applying a credit, expressed in internal types only.
 *
 * `amountCents` is the positive magnitude of credit to apply (minor units); the
 * edge adapter is responsible for translating that into the vendor's sign
 * convention. `approvalRecorded` must be a literal `true` — see the approval
 * gate in `apply-credit.ts`.
 */
export interface ApplyCreditArgs {
  /** Agent run id; ties this action to a recorded decision + approval. */
  readonly runId: string;
  /** Internal account id (maps to a Stripe customer id at the edge). */
  readonly accountId: string;
  /** Positive magnitude of the credit to apply, in minor units (e.g. cents). */
  readonly amountCents: number;
  /** Whether the policy engine recorded a human approval for this run. */
  readonly approvalRecorded: boolean;
  /** ISO-4217 currency code; defaults to `usd` when omitted. */
  readonly currency?: string;
}
