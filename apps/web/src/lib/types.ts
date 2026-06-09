/**
 * Typed API contracts for the Revenue War Room operator UI.
 *
 * These types are a faithful, 1:1 mapping of the locked v1 schemas in
 * `docs/decision-trace-spec.md`. Field names use snake_case deliberately so the
 * payloads match the wire format exactly — do not rename without integration-owner
 * sign-off (the schema is a cross-cutting contract).
 */

/** Run modes accepted by `POST /api/agent/run`. The golden path uses `dry_run`. */
export type RunMode = 'dry_run' | 'live';

/** Lifecycle status of an agent run (decision-trace-spec.md). */
export type RunStatus = 'auto_executed' | 'needs_approval' | 'blocked';

/**
 * The single recommendation action type the MVP supports, plus the alternatives the
 * guardrail matrix may surface. Kept as a closed union so the UI can render known
 * actions safely; unknown strings are still accepted on the `alternatives_considered`
 * list (typed as `string[]`) to stay forward-compatible.
 */
export type ActionType = 'apply_credit' | 'change_plan_tier' | 'invoice_alert_only';

/** Human approval decision (decision-trace-spec.md). */
export type ApprovalDecision = 'approve' | 'deny';

/** `POST /api/agent/run` — request body (v1). */
export interface AgentRunRequest {
  account_id: string;
  scenario_id: string;
  run_mode: RunMode;
}

/** Expected change in a single KPI as a result of the recommended action. */
export interface ExpectedKpiDelta {
  metric: string;
  before: number;
  after: number;
}

/** The agent's chosen action, its confidence, and the KPI it is expected to move. */
export interface Recommendation {
  action_type: ActionType;
  confidence: number;
  expected_kpi_delta: ExpectedKpiDelta;
}

/** `POST /api/agent/run` — response body (v1). */
export interface AgentRunResponse {
  run_id: string;
  status: RunStatus;
  recommendation: Recommendation;
  /** Every action the guardrail matrix permitted — never just the winner. */
  alternatives_considered: string[];
  rationale: string;
}

/** Approval — request payload (v1). */
export interface ApprovalRequest {
  run_id: string;
  approved_by: string;
  decision: ApprovalDecision;
  notes?: string;
}

/** Append-only audit record (v1). */
export interface AuditRecord {
  timestamp: string;
  run_id: string;
  event_type: string;
  actor: string;
  connector: string | null;
  idempotency_key?: string;
  result: string;
}

/**
 * Approval — response body.
 *
 * The spec defines the approval *request* payload and the *audit record* shape but does
 * not lock an approval response envelope. We return a small, deterministic acknowledgement
 * that wraps the resulting append-only audit record so the UI can confirm the gate outcome.
 */
export interface ApprovalResponse {
  run_id: string;
  decision: ApprovalDecision;
  status: 'approved' | 'denied';
  audit: AuditRecord;
}

/** A discriminated result type so callers handle transport/validation failures explicitly. */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
