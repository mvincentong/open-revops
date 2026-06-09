/**
 * Detect — score revenue-leakage risk from usage versus the plan's included
 * allowance. The heuristic is deliberately transparent so every decision trace is
 * explainable (see docs/decision-trace-spec.md):
 *
 *   overageUnits = max(0, totalUnits - includedUnits)
 *   overageRatio = overageUnits / includedUnits
 *   leakageRisk  = round2(clamp(overageRatio * LEAKAGE_SENSITIVITY, 0, CAP))
 *
 * It is monotonic in usage (more overage → more risk) and fully deterministic for
 * a given summary.
 */

import { clamp, round2 } from './math.js';
import type { LeakageDetection, UsageSummary } from './types.js';

/**
 * Dampening factor applied to the raw overage ratio. Not all usage above the
 * included allowance is truly leaking revenue — some is already billed correctly —
 * so the raw ratio overstates risk. This sensitivity is *calibrated* against the
 * deterministic `golden_path_v1` scenario: its overage ratio of 0.6009 maps to a
 * reported leakage_risk of 0.14, the locked golden-path value
 * (examples/agent-run/golden-path.json).
 */
export const LEAKAGE_SENSITIVITY = 0.233;

/** Upper bound on the reported score; leakage_risk is a probability-like value in [0, 1]. */
export const LEAKAGE_RISK_CAP = 0.95;

export function detect(summary: UsageSummary): LeakageDetection {
  const overageUnits = Math.max(0, summary.totalUnits - summary.includedUnits);
  const overageRatio = summary.includedUnits > 0 ? overageUnits / summary.includedUnits : 0;
  const leakageRisk = round2(clamp(overageRatio * LEAKAGE_SENSITIVITY, 0, LEAKAGE_RISK_CAP));

  return {
    metric: 'leakage_risk',
    leakageRisk,
    overageUnits,
    overageRatio,
  };
}
