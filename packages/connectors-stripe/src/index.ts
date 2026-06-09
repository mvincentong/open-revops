/**
 * @open-revops/connectors-stripe — write-path Stripe adapters.
 *
 * Public surface for the `apply_credit` action. Domain/agent code depends on
 * these exports, never on the Stripe SDK directly. See README.md and
 * `.claude/rules/40-connectors-and-actions.md` for the connector contract.
 */

export { applyCredit, type ApplyCreditDeps } from './apply-credit.js';
export { deriveIdempotencyKey } from './idempotency.js';
export {
  mapBalanceTransactionToReceipt,
  type StripeBalanceTransactionLike,
} from './mapping.js';
export type { CreateCreditRequest, StripeCreditClient } from './port.js';
export {
  DEFAULT_RETRY_OPTIONS,
  TimeoutError,
  defaultIsRetryable,
  resolveRetryOptions,
  type RetryOptions,
} from './resilience.js';
export {
  createStripeCreditClient,
  type StripeClientOptions,
} from './stripe-client.js';
export { STRIPE_SECRET_KEY_ENV, requireStripeSecretKey } from './config.js';
export {
  ApprovalRequiredError,
  InvalidCreditArgsError,
  InvalidVendorResponseError,
} from './errors.js';
export {
  APPLY_CREDIT_ACTION,
  type ApplyCreditArgs,
  type CreditAction,
  type CreditReceipt,
  type ReceiptStatus,
} from './types.js';
