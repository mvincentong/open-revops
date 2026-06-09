import { generateGoldenPath } from '@open-revops/demo-data';
import { describe, expect, it } from 'vitest';

import { LEAKAGE_RISK_CAP, detect } from './detect.js';
import { ingest } from './ingest.js';
import {
  ALTERNATIVES_CONSIDERED,
  RECOMMENDATION_CONFIDENCE,
  RECOMMENDED_ACTION,
  RESIDUAL_LEAKAGE_RISK,
  recommend,
} from './recommend.js';
import { DEMO_POLICY_CONFIG, GOLDEN_RUN_ID, runGoldenPath } from './run.js';
import type { UsageSummary } from './types.js';

const summaryWith = (overrides: Partial<UsageSummary>): UsageSummary => ({
  accountId: 'acct_test',
  scenarioId: 'test',
  metric: 'api_calls',
  totalUnits: 0,
  includedUnits: 10_000,
  ratePerUnitCents: 5,
  planTier: 'growth',
  eventCount: 1,
  ...overrides,
});

describe('ingest()', () => {
  it('sums the seeded usage events and carries the plan allowance forward', () => {
    const summary = ingest(generateGoldenPath());

    expect(summary.accountId).toBe('acct_demo_001');
    expect(summary.scenarioId).toBe('golden_path_v1');
    expect(summary.includedUnits).toBe(10_000);
    expect(summary.eventCount).toBe(30);
    // The golden scenario is designed as recoverable leakage: usage > included.
    expect(summary.totalUnits).toBeGreaterThan(summary.includedUnits);
  });
});

describe('detect()', () => {
  it('scores the golden scenario at leakage_risk exactly 0.14', () => {
    const detection = detect(ingest(generateGoldenPath()));

    expect(detection.metric).toBe('leakage_risk');
    expect(detection.leakageRisk).toBe(0.14);
    expect(detection.overageUnits).toBeGreaterThan(0);
  });

  it('reports zero risk when usage is at or below the included allowance', () => {
    expect(detect(summaryWith({ totalUnits: 5_000 })).leakageRisk).toBe(0);
    expect(detect(summaryWith({ totalUnits: 10_000 })).leakageRisk).toBe(0);
  });

  it('is monotonic — more overage never lowers the risk', () => {
    const low = detect(summaryWith({ totalUnits: 12_000 })).leakageRisk;
    const high = detect(summaryWith({ totalUnits: 18_000 })).leakageRisk;
    expect(high).toBeGreaterThanOrEqual(low);
  });

  it('caps the score for extreme overage', () => {
    expect(detect(summaryWith({ totalUnits: 10_000_000 })).leakageRisk).toBe(LEAKAGE_RISK_CAP);
  });
});

describe('recommend()', () => {
  it('recommends apply_credit with the calibrated confidence, KPI delta, and alternatives', () => {
    const outcome = recommend(detect(ingest(generateGoldenPath())));

    expect(outcome.recommendation.actionType).toBe('apply_credit');
    expect(outcome.recommendation.actionType).toBe(RECOMMENDED_ACTION);
    expect(outcome.recommendation.confidence).toBe(0.86);
    expect(outcome.recommendation.confidence).toBe(RECOMMENDATION_CONFIDENCE);
    expect(outcome.recommendation.expectedKpiDelta).toEqual({
      metric: 'leakage_risk',
      before: 0.14,
      after: 0.05,
    });
    expect(RESIDUAL_LEAKAGE_RISK).toBe(0.05);
    expect(outcome.alternativesConsidered).toEqual(['change_plan_tier', 'invoice_alert_only']);
    expect(outcome.alternativesConsidered).toEqual(ALTERNATIVES_CONSIDERED);
    expect(outcome.rationale).toMatch(/recoverable leakage/i);
  });
});

describe('runGoldenPath()', () => {
  it('returns the exact golden-path POST /api/agent/run response (v1)', () => {
    const response = runGoldenPath();

    // Exact golden numbers + shape per docs/decision-trace-spec.md and
    // examples/agent-run/golden-path.json.
    expect(response.run_id).toBe('run_001');
    expect(response.run_id).toBe(GOLDEN_RUN_ID);
    expect(response.status).toBe('needs_approval');
    expect(response.recommendation).toEqual({
      action_type: 'apply_credit',
      confidence: 0.86,
      expected_kpi_delta: { metric: 'leakage_risk', before: 0.14, after: 0.05 },
    });
    expect(response.alternatives_considered).toEqual(['change_plan_tier', 'invoice_alert_only']);
    expect(typeof response.rationale).toBe('string');
    expect(response.rationale.length).toBeGreaterThan(0);
  });

  it('routes to needs_approval because the demo kill-switch is on', () => {
    expect(DEMO_POLICY_CONFIG.killSwitch).toBe(true);
    expect(runGoldenPath().status).toBe('needs_approval');
  });

  it('still needs approval for this irreversible action even with the kill-switch off', () => {
    // apply_credit requires approval in the guardrail matrix, and confidence 0.86 is
    // below the 0.95 auto-execute threshold — so it can never silently auto-execute.
    const response = runGoldenPath({ ...DEMO_POLICY_CONFIG, killSwitch: false });
    expect(response.status).toBe('needs_approval');
  });

  it('is fully deterministic across runs', () => {
    expect(runGoldenPath()).toEqual(runGoldenPath());
  });
});
