/**
 * Lightweight runtime validation for system boundaries.
 *
 * All external input (request bodies from the browser, responses from the upstream agent
 * API) is treated as untrusted and narrowed here before use. Hand-rolled guards keep the
 * dependency surface small; swap for a schema library later if the contract grows.
 */

import type {
  AgentRunRequest,
  AgentRunResponse,
  ApprovalDecision,
  ApprovalRequest,
  ApprovalResponse,
  AuditRecord,
  RunMode,
  RunStatus,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const RUN_MODES: readonly RunMode[] = ['dry_run', 'live'];
const RUN_STATUSES: readonly RunStatus[] = ['auto_executed', 'needs_approval', 'blocked'];

/** Validate and narrow a `POST /api/agent/run` request body. */
export function parseAgentRunRequest(value: unknown): AgentRunRequest {
  if (!isRecord(value)) throw new ValidationError('request body must be a JSON object');

  const { account_id, scenario_id, run_mode } = value;

  if (typeof account_id !== 'string' || account_id.length === 0) {
    throw new ValidationError('account_id is required');
  }
  if (typeof scenario_id !== 'string' || scenario_id.length === 0) {
    throw new ValidationError('scenario_id is required');
  }
  if (typeof run_mode !== 'string' || !RUN_MODES.includes(run_mode as RunMode)) {
    throw new ValidationError(`run_mode must be one of: ${RUN_MODES.join(', ')}`);
  }

  return { account_id, scenario_id, run_mode: run_mode as RunMode };
}

/** Validate and narrow an approval request payload. */
export function parseApprovalRequest(value: unknown): ApprovalRequest {
  if (!isRecord(value)) throw new ValidationError('request body must be a JSON object');

  const { run_id, approved_by, decision, notes } = value;

  if (typeof run_id !== 'string' || run_id.length === 0) {
    throw new ValidationError('run_id is required');
  }
  if (typeof approved_by !== 'string' || approved_by.length === 0) {
    throw new ValidationError('approved_by is required');
  }
  if (decision !== 'approve' && decision !== 'deny') {
    throw new ValidationError("decision must be 'approve' or 'deny'");
  }
  if (notes !== undefined && typeof notes !== 'string') {
    throw new ValidationError('notes must be a string when provided');
  }

  return {
    run_id,
    approved_by,
    decision,
    ...(notes !== undefined ? { notes } : {}),
  };
}

/** Validate and narrow an agent-run response received from the upstream (live) API. */
export function parseAgentRunResponse(value: unknown): AgentRunResponse {
  if (!isRecord(value)) throw new ValidationError('upstream response must be a JSON object');

  const { run_id, status, recommendation, alternatives_considered, rationale } = value;

  if (typeof run_id !== 'string') throw new ValidationError('upstream: run_id missing');
  if (typeof status !== 'string' || !RUN_STATUSES.includes(status as RunStatus)) {
    throw new ValidationError('upstream: invalid status');
  }
  if (typeof rationale !== 'string') throw new ValidationError('upstream: rationale missing');
  if (!Array.isArray(alternatives_considered) || alternatives_considered.some((a) => typeof a !== 'string')) {
    throw new ValidationError('upstream: alternatives_considered must be string[]');
  }
  if (!isRecord(recommendation)) throw new ValidationError('upstream: recommendation missing');

  const { action_type, confidence, expected_kpi_delta } = recommendation;
  if (typeof action_type !== 'string') throw new ValidationError('upstream: action_type missing');
  if (typeof confidence !== 'number') throw new ValidationError('upstream: confidence missing');
  if (!isRecord(expected_kpi_delta)) throw new ValidationError('upstream: expected_kpi_delta missing');

  const { metric, before, after } = expected_kpi_delta;
  if (typeof metric !== 'string') throw new ValidationError('upstream: kpi metric missing');
  if (typeof before !== 'number' || typeof after !== 'number') {
    throw new ValidationError('upstream: kpi before/after must be numbers');
  }

  return {
    run_id,
    status: status as RunStatus,
    recommendation: {
      action_type: action_type as AgentRunResponse['recommendation']['action_type'],
      confidence,
      expected_kpi_delta: { metric, before, after },
    },
    alternatives_considered: alternatives_considered as string[],
    rationale,
  };
}

/**
 * Validate and narrow an approval response received from the upstream (live) API.
 *
 * The spec does not lock an approval response envelope, so this parser is tolerant: it
 * requires `run_id` and `decision`, derives `status` when absent, and synthesises a minimal
 * audit record if the upstream omitted one.
 */
export function parseApprovalResponse(value: unknown): ApprovalResponse {
  if (!isRecord(value)) throw new ValidationError('upstream response must be a JSON object');

  const { run_id, decision, status, audit } = value;

  if (typeof run_id !== 'string') throw new ValidationError('upstream: run_id missing');
  if (decision !== 'approve' && decision !== 'deny') {
    throw new ValidationError('upstream: invalid approval decision');
  }

  const resolvedStatus: ApprovalResponse['status'] =
    status === 'approved' || status === 'denied'
      ? status
      : decision === 'approve'
        ? 'approved'
        : 'denied';

  const resolvedAudit: AuditRecord = isValidAuditRecord(audit)
    ? audit
    : {
        timestamp: '',
        run_id,
        event_type: 'approval_recorded',
        actor: 'unknown',
        connector: null,
        result: decision,
      };

  return {
    run_id,
    decision: decision as ApprovalDecision,
    status: resolvedStatus,
    audit: resolvedAudit,
  };
}

function isValidAuditRecord(value: unknown): value is AuditRecord {
  if (!isRecord(value)) return false;
  return (
    typeof value.timestamp === 'string' &&
    typeof value.run_id === 'string' &&
    typeof value.event_type === 'string' &&
    typeof value.actor === 'string' &&
    (value.connector === null || typeof value.connector === 'string') &&
    typeof value.result === 'string'
  );
}

/** Thrown when boundary input fails validation; mapped to a 400 by route handlers. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
