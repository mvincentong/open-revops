import type { CreditAction } from './types.js';

/**
 * Derive the idempotency key for a state-changing call from the run id + action.
 *
 * Stripe (and our retry layer) use this key so that re-sending the same logical
 * request never double-executes — a credit is applied at most once per run +
 * action, no matter how many times the call is retried (see
 * `.claude/rules/40-connectors-and-actions.md`).
 */
export function deriveIdempotencyKey(runId: string, action: CreditAction): string {
  const normalized = runId.trim();
  if (normalized.length === 0) {
    throw new Error('Cannot derive an idempotency key: runId is empty.');
  }
  return `${normalized}:${action}`;
}
