/**
 * Shared types for the agent orchestration API.
 *
 * Internal run state is camelCase-free here on purpose: the fields that cross the
 * HTTP boundary use the exact snake_case names locked in
 * docs/decision-trace-spec.md, so storing them directly keeps the mapping trivial.
 * The one place we map is the audit record: storage uses camelCase
 * (`@open-revops/connectors-storage` `AuditRecord`) and the API exposes snake_case
 * (`ApiAuditRecord`).
 */

import type { AgentRunResponse, ApiRecommendation, ExpectedKpiDelta } from '@open-revops/agent-core';
import type { AuditEventType } from '@open-revops/connectors-storage';
import type { CreditReceipt } from '@open-revops/connectors-stripe';

/** The approval decision a human can record for a run. */
export type ApprovalDecision = 'approve' | 'deny';

/**
 * Lifecycle status of a run as tracked by this service. Superset of the policy
 * engine's `PolicyStatus` (`needs_approval | auto_executed | blocked`) plus the
 * two terminal states this service adds once a human acts (`executed | denied`).
 */
export type RunStatus = 'needs_approval' | 'auto_executed' | 'blocked' | 'executed' | 'denied';

/** `POST /api/agent/run` request body (v1) — docs/decision-trace-spec.md. */
export interface RunRequest {
  readonly account_id: string;
  readonly scenario_id: string;
  readonly run_mode: string;
}

/** Approval request body (v1) — docs/decision-trace-spec.md. */
export interface ApprovalRequest {
  readonly run_id: string;
  readonly approved_by: string;
  readonly decision: ApprovalDecision;
  readonly notes?: string;
}

/** The recorded human approval for a run. */
export interface ApprovalState {
  readonly approved_by: string;
  readonly decision: ApprovalDecision;
  readonly notes?: string;
}

/**
 * Persisted run state (the run store's snapshot type). Holds everything needed to
 * execute the gated action after approval without re-running the agent, including
 * the pre-computed credit magnitude tied to the detected leakage.
 */
export interface RunState {
  readonly run_id: string;
  readonly account_id: string;
  readonly scenario_id: string;
  readonly run_mode: string;
  readonly status: RunStatus;
  readonly recommendation: ApiRecommendation;
  readonly alternatives_considered: readonly string[];
  readonly rationale: string;
  /** Positive credit magnitude in minor units, derived from the detected overage. */
  readonly credit_amount_cents: number;
  readonly approval?: ApprovalState;
  readonly receipt?: CreditReceipt;
}

/** `POST /api/agent/run` response — the exact golden shape from agent-core. */
export type RunResponse = AgentRunResponse;

/** Approval response — the updated run state after the human decision. */
export interface ApproveResponse {
  readonly run_id: string;
  readonly status: RunStatus;
  readonly decision: ApprovalDecision;
  readonly recommendation?: ApiRecommendation;
  readonly receipt?: CreditReceipt;
  readonly expected_kpi_delta?: ExpectedKpiDelta;
}

/**
 * Audit record as exposed over HTTP (snake_case, per docs/decision-trace-spec.md).
 * `connector` is `null` (not omitted) when an event has no connector, matching the
 * locked example in examples/agent-run/golden-path.json.
 */
export interface ApiAuditRecord {
  readonly timestamp: string;
  readonly run_id: string;
  readonly event_type: AuditEventType;
  readonly actor: string;
  readonly connector: string | null;
  readonly idempotency_key?: string;
  readonly result?: string;
}

/** `GET /api/audit/:run_id` response. */
export interface AuditResponse {
  readonly run_id: string;
  readonly audit_log: readonly ApiAuditRecord[];
}
