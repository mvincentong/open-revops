/**
 * Shared types for the agent loop. Internal domain models use camelCase; the
 * external `POST /api/agent/run` contract (v1) uses snake_case to match
 * docs/decision-trace-spec.md exactly. `run.ts` maps between the two.
 */

import type { ActionType, PolicyStatus } from '@open-revops/policy-engine';

/** The single KPI the golden path moves. */
export type LeakageMetric = 'leakage_risk';

/** Normalised usage for one account/scenario — the input to detection. */
export interface UsageSummary {
  readonly accountId: string;
  readonly scenarioId: string;
  readonly metric: 'api_calls';
  readonly totalUnits: number;
  readonly includedUnits: number;
  readonly ratePerUnitCents: number;
  readonly planTier: string;
  readonly eventCount: number;
}

/** Output of the transparent leakage-risk heuristic. */
export interface LeakageDetection {
  readonly metric: LeakageMetric;
  /** Risk score in [0, 1], rounded to two decimals. */
  readonly leakageRisk: number;
  /** Units consumed beyond the plan's included allowance. */
  readonly overageUnits: number;
  /** Overage units relative to the included allowance (the raw signal). */
  readonly overageRatio: number;
}

/** Before/after for a single KPI, as reported in the decision trace. */
export interface ExpectedKpiDelta {
  readonly metric: LeakageMetric;
  readonly before: number;
  readonly after: number;
}

/** The chosen recommendation (internal model). */
export interface Recommendation {
  readonly actionType: ActionType;
  /** Calibrated confidence in [0, 1] handed to the policy engine. */
  readonly confidence: number;
  readonly expectedKpiDelta: ExpectedKpiDelta;
}

/** A recommendation plus the auditable reasoning around it. */
export interface RecommendationOutcome {
  readonly recommendation: Recommendation;
  /** Every alternative the agent weighed (a trace with only the winner is incomplete). */
  readonly alternativesConsidered: readonly string[];
  readonly rationale: string;
}

/** `POST /api/agent/run` response — recommendation block (v1, snake_case). */
export interface ApiRecommendation {
  readonly action_type: ActionType;
  readonly confidence: number;
  readonly expected_kpi_delta: ExpectedKpiDelta;
}

/** `POST /api/agent/run` response (v1) — see docs/decision-trace-spec.md. */
export interface AgentRunResponse {
  readonly run_id: string;
  readonly status: PolicyStatus;
  readonly recommendation: ApiRecommendation;
  readonly alternatives_considered: readonly string[];
  readonly rationale: string;
}
