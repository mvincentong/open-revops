/**
 * Presentation helpers for the operator UI. Pure functions — no wall-clock or randomness,
 * so rendered output stays deterministic on the golden path.
 */

import type { ActionType, RunStatus } from './types';

/** Format a 0–1 confidence as a whole-number percentage, e.g. 0.86 -> "86%". */
export function toPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** Format a risk score to two decimals, e.g. 0.14 -> "0.14". */
export function formatScore(value: number): string {
  return value.toFixed(2);
}

/** Human-readable label for a recommended action type. */
export function actionLabel(action: ActionType | string): string {
  switch (action) {
    case 'apply_credit':
      return 'Apply credit';
    case 'change_plan_tier':
      return 'Change plan tier';
    case 'invoice_alert_only':
      return 'Invoice alert only';
    default:
      return action;
  }
}

/** Human-readable label for a run status. */
export function statusLabel(status: RunStatus): string {
  switch (status) {
    case 'auto_executed':
      return 'Auto-executed';
    case 'needs_approval':
      return 'Needs approval';
    case 'blocked':
      return 'Blocked';
    default:
      return status;
  }
}

/**
 * Reduction between a before/after metric as a signed percentage of the before value.
 * e.g. before 0.14, after 0.05 -> "-64%". Returns "0%" when before is 0.
 */
export function reductionPercent(before: number, after: number): string {
  if (before === 0) return '0%';
  const change = ((after - before) / before) * 100;
  const rounded = Math.round(change);
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}
