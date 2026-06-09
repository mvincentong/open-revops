/**
 * Deterministic `golden_path_v1` mock.
 *
 * This is the single source of truth for the demo's golden path while the real agent API
 * is still being built. The run response is reproduced **exactly** from
 * `docs/decision-trace-spec.md` (the locked v1 contract). No wall-clock time or randomness
 * is used here — identical inputs always yield identical output, per
 * `.claude/rules/20-determinism-and-demo-data.md`.
 */

import type {
  AgentRunRequest,
  AgentRunResponse,
  ApprovalRequest,
  ApprovalResponse,
  AuditRecord,
} from './types';

/** The canonical golden-path run request (decision-trace-spec.md). */
export const GOLDEN_PATH_REQUEST: AgentRunRequest = {
  account_id: 'acct_demo_001',
  scenario_id: 'golden_path_v1',
  run_mode: 'dry_run',
};

/**
 * The canonical golden-path run response, copied verbatim from
 * `docs/decision-trace-spec.md`. Frozen to guarantee the mock cannot be mutated at runtime.
 */
export const GOLDEN_PATH_RUN_RESPONSE: AgentRunResponse = Object.freeze({
  run_id: 'run_001',
  status: 'needs_approval',
  recommendation: Object.freeze({
    action_type: 'apply_credit',
    confidence: 0.86,
    expected_kpi_delta: Object.freeze({
      metric: 'leakage_risk',
      before: 0.14,
      after: 0.05,
    }),
  }),
  alternatives_considered: Object.freeze(['change_plan_tier', 'invoice_alert_only']) as string[],
  rationale:
    'Usage pattern indicates recoverable leakage; credit is the lowest-risk action under policy.',
}) as AgentRunResponse;

/**
 * Fixed timestamp for the deterministic approval audit record. Matches the golden-path
 * fixture in `examples/agent-run/golden-path.json` so the demo and evals agree.
 */
const GOLDEN_PATH_APPROVAL_TIMESTAMP = '2026-06-09T12:34:55Z';

/** Build the deterministic golden-path run response (cloned so callers never mutate the frozen original). */
export function mockAgentRun(_request: AgentRunRequest): AgentRunResponse {
  return structuredClone(GOLDEN_PATH_RUN_RESPONSE);
}

/**
 * Build the deterministic approval acknowledgement for the golden path.
 *
 * The recorded audit event reflects the operator's decision. The timestamp is injected
 * (not read from the wall clock) so the trace is reproducible.
 */
export function mockApproval(request: ApprovalRequest): ApprovalResponse {
  const audit: AuditRecord = {
    timestamp: GOLDEN_PATH_APPROVAL_TIMESTAMP,
    run_id: request.run_id,
    event_type: 'approval_recorded',
    actor: request.approved_by,
    connector: null,
    result: request.decision,
  };

  return {
    run_id: request.run_id,
    decision: request.decision,
    status: request.decision === 'approve' ? 'approved' : 'denied',
    audit,
  };
}
