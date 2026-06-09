/**
 * Ingest — the first step of the agent loop. Normalises a (synthetic, seeded)
 * scenario into a flat `UsageSummary` the detector can score. Pure and
 * deterministic: it only sums the usage events and carries the plan allowance and
 * rate forward. No wall-clock and no network on the golden path (see
 * .claude/rules/20-determinism-and-demo-data.md).
 */

import type { Scenario } from '@open-revops/demo-data';

import type { UsageSummary } from './types.js';

export function ingest(scenario: Scenario): UsageSummary {
  const { account, usageEvents } = scenario;
  const totalUnits = usageEvents.reduce((sum, event) => sum + event.units, 0);

  return {
    accountId: account.accountId,
    scenarioId: scenario.scenarioId,
    metric: 'api_calls',
    totalUnits,
    includedUnits: account.plan.includedUnits,
    ratePerUnitCents: account.plan.ratePerUnitCents,
    planTier: account.plan.tier,
    eventCount: usageEvents.length,
  };
}
