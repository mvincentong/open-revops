import { ApprovalRequiredError, InvalidCreditArgsError } from './errors.js';
import { deriveIdempotencyKey } from './idempotency.js';
import { mapBalanceTransactionToReceipt } from './mapping.js';
import type { CreateCreditRequest, StripeCreditClient } from './port.js';
import { resolveRetryOptions, withRetry, withTimeout, type RetryOptions } from './resilience.js';
import { APPLY_CREDIT_ACTION, type ApplyCreditArgs, type CreditReceipt } from './types.js';

const DEFAULT_CURRENCY = 'usd';

/** Dependencies for {@link applyCredit}. The client is injected so tests use a fake. */
export interface ApplyCreditDeps {
  /** Narrow vendor port; production passes a Stripe-backed adapter. */
  readonly client: StripeCreditClient;
  /** Optional resilience overrides (timeout, attempts, backoff, injectable sleep). */
  readonly retry?: Partial<RetryOptions>;
}

function validateArgs(args: ApplyCreditArgs): void {
  if (typeof args.runId !== 'string' || args.runId.trim().length === 0) {
    throw new InvalidCreditArgsError('runId must be a non-empty string');
  }
  if (typeof args.accountId !== 'string' || args.accountId.trim().length === 0) {
    throw new InvalidCreditArgsError('accountId must be a non-empty string');
  }
  if (
    typeof args.amountCents !== 'number' ||
    !Number.isInteger(args.amountCents) ||
    args.amountCents <= 0
  ) {
    throw new InvalidCreditArgsError('amountCents must be a positive integer (minor units)');
  }
  if (args.currency !== undefined && args.currency.trim().length === 0) {
    throw new InvalidCreditArgsError('currency, when provided, must be non-empty');
  }
}

/**
 * Apply a credit to an account, returning an auditable {@link CreditReceipt}.
 *
 * Order of operations enforces the write-path contract:
 *   1. Validate arguments — fail fast on bad input, before any side effect.
 *   2. **Approval gate** — refuse unless `approvalRecorded === true`. There is no
 *      bypass: the vendor is never called without a recorded approval.
 *   3. Derive an idempotency key from `run_id + action` so retries can't
 *      double-execute.
 *   4. Call the vendor through a per-attempt timeout and bounded retry/backoff.
 *   5. Map the vendor response to the internal receipt.
 *
 * @throws InvalidCreditArgsError when arguments are malformed.
 * @throws ApprovalRequiredError when no approval is recorded for the run.
 */
export async function applyCredit(
  args: ApplyCreditArgs,
  deps: ApplyCreditDeps,
): Promise<CreditReceipt> {
  validateArgs(args);

  // Approval gate (hard refusal, no bypass). Strict `!== true` rejects any
  // truthy-but-not-boolean value a hostile or buggy caller might pass.
  if (args.approvalRecorded !== true) {
    throw new ApprovalRequiredError(args.runId);
  }

  const idempotencyKey = deriveIdempotencyKey(args.runId, APPLY_CREDIT_ACTION);
  const request: CreateCreditRequest = {
    accountId: args.accountId,
    amountCents: args.amountCents,
    currency: args.currency ?? DEFAULT_CURRENCY,
    idempotencyKey,
  };

  const options = resolveRetryOptions(deps.retry);

  const txn = await withRetry(
    () => withTimeout(() => deps.client.applyCredit(request), options.timeoutMs, 'stripe.applyCredit'),
    options,
  );

  return mapBalanceTransactionToReceipt(txn);
}
