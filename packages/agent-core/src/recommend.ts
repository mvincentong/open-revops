/**
 * Recommend — turn a leakage detection into a ranked, auditable recommendation:
 * the chosen action, a calibrated confidence, the expected KPI delta, the
 * alternatives weighed, and a human-readable rationale. Deterministic.
 *
 * On the golden path the single in-scope action is `apply_credit` (one trigger,
 * one recommendation, one action — see .claude/rules/00-scope-and-non-goals.md).
 */

import type { ActionType } from '@open-revops/policy-engine';

import type { LeakageDetection, RecommendationOutcome } from './types.js';

/** The single in-scope billing action on the golden path. */
export const RECOMMENDED_ACTION: ActionType = 'apply_credit';

/**
 * Calibrated confidence for the golden-path recommendation. Intentionally below
 * the 0.95 auto-execute threshold, so even with the kill-switch off this
 * irreversible action still routes to human approval.
 */
export const RECOMMENDATION_CONFIDENCE = 0.86;

/** Expected residual leakage risk after the credit is applied (modelled demo target). */
export const RESIDUAL_LEAKAGE_RISK = 0.05;

/**
 * Alternatives the agent weighed but did not choose. Listed verbatim in the
 * decision trace so the reasoning is auditable — a trace with only the winner is
 * incomplete (docs/decision-trace-spec.md).
 */
export const ALTERNATIVES_CONSIDERED: readonly string[] = ['change_plan_tier', 'invoice_alert_only'];

/** Human-readable rationale; matches the locked example (examples/agent-run/golden-path.json). */
export const GOLDEN_PATH_RATIONALE =
  'Usage pattern indicates recoverable leakage; a credit is the lowest-risk in-policy action. ' +
  'Confidence 0.86 is below the auto-execute threshold and the action is irreversible, so it ' +
  'routes to human approval.';

export function recommend(detection: LeakageDetection): RecommendationOutcome {
  return {
    recommendation: {
      actionType: RECOMMENDED_ACTION,
      confidence: RECOMMENDATION_CONFIDENCE,
      expectedKpiDelta: {
        metric: detection.metric,
        before: detection.leakageRisk,
        after: RESIDUAL_LEAKAGE_RISK,
      },
    },
    alternativesConsidered: ALTERNATIVES_CONSIDERED,
    rationale: GOLDEN_PATH_RATIONALE,
  };
}
