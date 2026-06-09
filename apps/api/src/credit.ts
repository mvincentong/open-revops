/**
 * Credit sizing — derive the magnitude of the `apply_credit` action from the same
 * deterministic, synthetic golden-path data the agent reasons over. The credit
 * recovers the over-billed overage: `overageUnits * ratePerUnitCents`. Pure and
 * reproducible (seeded data, no wall clock), so the demo is stable.
 */

import { detect, ingest } from '@open-revops/agent-core';
import { generateGoldenPath } from '@open-revops/demo-data';

/**
 * Compute the golden-path credit magnitude in minor units (cents). Always a
 * positive integer because the golden scenario's usage overruns the included
 * allowance and rates are whole-cent.
 */
export function computeGoldenCreditAmountCents(): number {
  const summary = ingest(generateGoldenPath());
  const detection = detect(summary);
  return detection.overageUnits * summary.ratePerUnitCents;
}
