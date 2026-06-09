/**
 * Run — compose the full golden-path agent loop and emit the exact
 * `POST /api/agent/run` response (v1) from docs/decision-trace-spec.md:
 *
 *   ingest → detect → recommend → enforce policy (decide)
 *
 * The policy engine is the safety core; we pass the recommendation through
 * `decide()` and report its status verbatim. Never bypass it
 * (see .claude/rules/10-security-and-secrets.md).
 */

import { generateGoldenPath } from '@open-revops/demo-data';
import { DEFAULT_GUARDRAIL_MATRIX, decide, type PolicyConfig } from '@open-revops/policy-engine';

import { detect } from './detect.js';
import { ingest } from './ingest.js';
import { recommend } from './recommend.js';
import type { AgentRunResponse } from './types.js';

/** Fixed run id for the deterministic golden path (examples/agent-run/golden-path.json). */
export const GOLDEN_RUN_ID = 'run_001';

/**
 * Demo policy defaults (docs/policy-rules.md): the hard kill-switch is ON, so
 * every action — including this credit — routes to human approval, and the
 * auto-execute threshold is 0.95.
 */
export const DEMO_POLICY_CONFIG: PolicyConfig = {
  killSwitch: true,
  autoExecuteConfidence: 0.95,
  matrix: DEFAULT_GUARDRAIL_MATRIX,
};

/**
 * Run the golden-path agent loop and return the v1 API response. Deterministic:
 * the same `config` always yields the same response (synthetic, seeded data).
 */
export function runGoldenPath(config: PolicyConfig = DEMO_POLICY_CONFIG): AgentRunResponse {
  const scenario = generateGoldenPath();
  const summary = ingest(scenario);
  const detection = detect(summary);
  const outcome = recommend(detection);

  const decision = decide(
    {
      actionType: outcome.recommendation.actionType,
      confidence: outcome.recommendation.confidence,
    },
    config,
  );

  return {
    run_id: GOLDEN_RUN_ID,
    status: decision.status,
    recommendation: {
      action_type: outcome.recommendation.actionType,
      confidence: outcome.recommendation.confidence,
      expected_kpi_delta: outcome.recommendation.expectedKpiDelta,
    },
    alternatives_considered: outcome.alternativesConsidered,
    rationale: outcome.rationale,
  };
}
