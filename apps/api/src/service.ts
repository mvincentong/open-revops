/**
 * Agent orchestration service — the run/approve/audit logic behind the HTTP layer.
 *
 * The agent loop (docs/architecture.md): ingest → detect → recommend → enforce
 * policy → approve → execute → audit. Decisions come from `@open-revops/agent-core`
 * + `@open-revops/policy-engine`; execution goes through the
 * `@open-revops/connectors-stripe` write path; every step is appended to the
 * `@open-revops/connectors-storage` audit log.
 *
 * THE APPROVAL GATE IS NEVER BYPASSED (.claude/rules/10-security-and-secrets.md):
 * the connector is only ever called after an `approval_recorded` audit entry with
 * a `approve` decision exists for the run, and `applyCredit` itself independently
 * refuses without `approvalRecorded: true`. There is no debug/override path.
 */

import { DEMO_POLICY_CONFIG, runGoldenPath } from '@open-revops/agent-core';
import type { AuditLog, AuditRecord, RunStore } from '@open-revops/connectors-storage';
import {
  APPLY_CREDIT_ACTION,
  applyCredit,
  deriveIdempotencyKey,
  type StripeCreditClient,
} from '@open-revops/connectors-stripe';
import type { PolicyConfig } from '@open-revops/policy-engine';

import type { Clock } from './clock.js';
import { computeGoldenCreditAmountCents } from './credit.js';
import type {
  ApiAuditRecord,
  ApprovalRequest,
  ApproveResponse,
  RunRequest,
  RunResponse,
  RunState,
} from './types.js';

const STRIPE_CONNECTOR = 'stripe';
const DEFAULT_CURRENCY = 'usd';

/** Collaborators the service depends on — all injected so tests stay deterministic. */
export interface ServiceDeps {
  readonly clock: Clock;
  readonly auditLog: AuditLog;
  readonly runStore: RunStore<RunState>;
  readonly stripeClient: StripeCreditClient;
  /** Policy configuration; defaults to the demo config (kill-switch ON). */
  readonly policyConfig?: PolicyConfig;
}

/** Result of an approval attempt, discriminated so the HTTP layer maps status codes. */
export type ApproveResult =
  | { readonly kind: 'ok'; readonly response: ApproveResponse }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'conflict'; readonly message: string }
  | { readonly kind: 'error'; readonly message: string };

/** Map a storage (camelCase) audit record to the external (snake_case) shape. */
function toApiAuditRecord(record: AuditRecord): ApiAuditRecord {
  return {
    timestamp: record.timestamp,
    run_id: record.runId,
    event_type: record.eventType,
    actor: record.actor,
    connector: record.connector ?? null,
    ...(record.idempotencyKey !== undefined ? { idempotency_key: record.idempotencyKey } : {}),
    ...(record.result !== undefined ? { result: record.result } : {}),
  };
}

export interface AgentService {
  run(request: RunRequest): Promise<RunResponse>;
  approve(request: ApprovalRequest): Promise<ApproveResult>;
  getAudit(runId: string): Promise<readonly ApiAuditRecord[] | undefined>;
}

/** Build the agent orchestration service from its injected collaborators. */
export function createAgentService(deps: ServiceDeps): AgentService {
  const { clock, auditLog, runStore, stripeClient } = deps;
  const policyConfig = deps.policyConfig ?? DEMO_POLICY_CONFIG;

  function buildApproveResponse(state: RunState): ApproveResponse {
    if (state.status === 'denied') {
      return { run_id: state.run_id, status: 'denied', decision: 'deny' };
    }
    return {
      run_id: state.run_id,
      status: state.status,
      decision: state.approval?.decision ?? 'approve',
      recommendation: state.recommendation,
      receipt: state.receipt,
      expected_kpi_delta: state.recommendation.expected_kpi_delta,
    };
  }

  async function run(request: RunRequest): Promise<RunResponse> {
    // The agent loop runs on the deterministic golden path; the policy engine
    // (kill-switch ON by default) routes the irreversible credit to approval.
    const response = runGoldenPath(policyConfig);
    const runId = response.run_id;

    await auditLog.append({
      timestamp: clock.now(),
      runId,
      eventType: 'run_started',
      actor: 'agent',
      detail: {
        account_id: request.account_id,
        scenario_id: request.scenario_id,
        run_mode: request.run_mode,
      },
    });

    await auditLog.append({
      timestamp: clock.now(),
      runId,
      eventType: 'recommendation_made',
      actor: 'agent',
      result: response.status,
    });

    const state: RunState = {
      run_id: runId,
      account_id: request.account_id,
      scenario_id: request.scenario_id,
      run_mode: request.run_mode,
      status: response.status,
      recommendation: response.recommendation,
      alternatives_considered: response.alternatives_considered,
      rationale: response.rationale,
      credit_amount_cents: computeGoldenCreditAmountCents(),
    };
    await runStore.put(runId, state);

    return response;
  }

  async function approve(request: ApprovalRequest): Promise<ApproveResult> {
    const state = await runStore.get(request.run_id);
    if (!state) {
      return { kind: 'not_found' };
    }

    // Idempotent at the service level: a run that already reached a terminal state
    // is not re-executed or re-denied; return its current state unchanged.
    if (state.status === 'executed' || state.status === 'denied') {
      return { kind: 'ok', response: buildApproveResponse(state) };
    }

    // Append the approval to the immutable audit trail FIRST. This is the recorded
    // approval the gate relies on — execution below depends on it existing.
    await auditLog.append({
      timestamp: clock.now(),
      runId: state.run_id,
      eventType: 'approval_recorded',
      actor: request.approved_by,
      result: request.decision,
      ...(request.notes !== undefined ? { detail: { notes: request.notes } } : {}),
    });

    if (request.decision === 'deny') {
      const denied: RunState = {
        ...state,
        status: 'denied',
        approval: { approved_by: request.approved_by, decision: 'deny', notes: request.notes },
      };
      await runStore.put(denied.run_id, denied);
      return { kind: 'ok', response: buildApproveResponse(denied) };
    }

    // decision === 'approve'. Blocked actions never execute, even with approval
    // (docs/policy-rules.md) — they exist to make dangerous operations unreachable.
    if (state.status === 'blocked') {
      return { kind: 'conflict', message: 'Run is blocked by policy and cannot be executed.' };
    }

    const idempotencyKey = deriveIdempotencyKey(state.run_id, APPLY_CREDIT_ACTION);
    const approvedState: RunState = {
      ...state,
      approval: { approved_by: request.approved_by, decision: 'approve', notes: request.notes },
    };

    try {
      const receipt = await applyCredit(
        {
          runId: state.run_id,
          accountId: state.account_id,
          amountCents: state.credit_amount_cents,
          approvalRecorded: true, // safe: an approval_recorded entry now exists
          currency: DEFAULT_CURRENCY,
        },
        { client: stripeClient },
      );

      await auditLog.append({
        timestamp: clock.now(),
        runId: state.run_id,
        eventType: 'action_executed',
        actor: request.approved_by,
        connector: STRIPE_CONNECTOR,
        idempotencyKey,
        result: 'success',
        detail: { provider_id: receipt.provider_id },
      });

      const executed: RunState = { ...approvedState, status: 'executed', receipt };
      await runStore.put(executed.run_id, executed);
      return { kind: 'ok', response: buildApproveResponse(executed) };
    } catch (error) {
      await auditLog.append({
        timestamp: clock.now(),
        runId: state.run_id,
        eventType: 'action_failed',
        actor: request.approved_by,
        connector: STRIPE_CONNECTOR,
        idempotencyKey,
        result: 'failed',
        detail: { error: error instanceof Error ? error.name : 'unknown_error' },
      });
      // Persist the approved-but-not-executed state; history is preserved, and a
      // retry is safe because the idempotency key is stable.
      await runStore.put(approvedState.run_id, approvedState);
      return { kind: 'error', message: 'Action execution failed.' };
    }
  }

  async function getAudit(runId: string): Promise<readonly ApiAuditRecord[] | undefined> {
    const state = await runStore.get(runId);
    if (!state) {
      return undefined;
    }
    const records = await auditLog.byRun(runId);
    return records.map(toApiAuditRecord);
  }

  return { run, approve, getAudit };
}
