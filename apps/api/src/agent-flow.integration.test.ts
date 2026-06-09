/**
 * Integration test for the agent orchestration API (golden path).
 *
 * Exercises the full loop through Fastify's `inject` (no real sockets):
 *   POST /api/agent/run → POST /api/agent/approve → execute → GET /api/audit/:run_id
 *
 * The two load-bearing invariants from docs/decision-trace-spec.md and
 * .claude/rules/10-security-and-secrets.md:
 *   1. The run response matches the locked golden shape exactly.
 *   2. The Stripe connector is NEVER called without a recorded approval — there
 *      is no bypass of the approval gate.
 */

import { createInMemoryAuditLog, createInMemoryRunStore } from '@open-revops/connectors-storage';
import type { CreateCreditRequest, StripeCreditClient } from '@open-revops/connectors-stripe';
import type { StripeBalanceTransactionLike } from '@open-revops/connectors-stripe';
import { beforeEach, describe, expect, it } from 'vitest';

import { buildServer } from './app.js';
import { createSteppingClock } from './clock.js';
import type { RunState } from './types.js';

/** A spy implementation of the narrow Stripe port — records every call, no real SDK. */
function spyStripeClient(): { client: StripeCreditClient; calls: CreateCreditRequest[] } {
  const calls: CreateCreditRequest[] = [];
  const client: StripeCreditClient = {
    applyCredit(request: CreateCreditRequest): Promise<StripeBalanceTransactionLike> {
      calls.push(request);
      return Promise.resolve({
        id: `cbtxn_${request.idempotencyKey}`,
        created: 1_717_000_000,
        amount: -request.amountCents,
        currency: request.currency,
      });
    },
  };
  return { client, calls };
}

const RUN_REQUEST = {
  account_id: 'acct_demo_001',
  scenario_id: 'golden_path_v1',
  run_mode: 'dry_run',
} as const;

function makeDeps() {
  const { client, calls } = spyStripeClient();
  return {
    clock: createSteppingClock('2026-06-09T12:34:50.000Z', 1000),
    auditLog: createInMemoryAuditLog(),
    runStore: createInMemoryRunStore<RunState>(),
    stripeClient: client,
    stripeCalls: calls,
  };
}

describe('POST /api/agent/run', () => {
  it('returns the exact golden-path response shape', async () => {
    const deps = makeDeps();
    const server = buildServer(deps);

    const res = await server.inject({
      method: 'POST',
      url: '/api/agent/run',
      payload: RUN_REQUEST,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      run_id: 'run_001',
      status: 'needs_approval',
      recommendation: {
        action_type: 'apply_credit',
        confidence: 0.86,
        expected_kpi_delta: { metric: 'leakage_risk', before: 0.14, after: 0.05 },
      },
      alternatives_considered: ['change_plan_tier', 'invoice_alert_only'],
      rationale:
        'Usage pattern indicates recoverable leakage; a credit is the lowest-risk in-policy action. ' +
        'Confidence 0.86 is below the auto-execute threshold and the action is irreversible, so it ' +
        'routes to human approval.',
    });

    await server.close();
  });

  it('writes run_started and recommendation_made audit records, and does NOT call Stripe', async () => {
    const deps = makeDeps();
    const server = buildServer(deps);

    await server.inject({ method: 'POST', url: '/api/agent/run', payload: RUN_REQUEST });

    const trail = await deps.auditLog.byRun('run_001');
    expect(trail.map((r) => r.eventType)).toEqual(['run_started', 'recommendation_made']);
    // The approval gate has not been crossed — the connector must be untouched.
    expect(deps.stripeCalls).toHaveLength(0);

    await server.close();
  });
});

describe('POST /api/agent/approve — approve → execute → audit', () => {
  it('executes the credit only after approval and returns the updated state', async () => {
    const deps = makeDeps();
    const server = buildServer(deps);

    await server.inject({ method: 'POST', url: '/api/agent/run', payload: RUN_REQUEST });
    expect(deps.stripeCalls).toHaveLength(0); // still gated before approval

    const res = await server.inject({
      method: 'POST',
      url: '/api/agent/approve',
      payload: {
        run_id: 'run_001',
        approved_by: 'demo_operator',
        decision: 'approve',
        notes: 'Proceed for demo',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.run_id).toBe('run_001');
    expect(body.status).toBe('executed');
    expect(body.decision).toBe('approve');
    expect(body.expected_kpi_delta).toEqual({ metric: 'leakage_risk', before: 0.14, after: 0.05 });
    expect(body.receipt.status).toBe('succeeded');
    expect(body.receipt.provider_id).toContain('cbtxn_');

    // Stripe was called exactly once, with the run-derived idempotency key.
    expect(deps.stripeCalls).toHaveLength(1);
    expect(deps.stripeCalls[0]?.idempotencyKey).toBe('run_001:apply_credit');
    expect(Number.isInteger(deps.stripeCalls[0]?.amountCents)).toBe(true);
    expect(deps.stripeCalls[0]?.amountCents).toBeGreaterThan(0);

    await server.close();
  });

  it('appends approval_recorded then action_executed to the audit trail', async () => {
    const deps = makeDeps();
    const server = buildServer(deps);

    await server.inject({ method: 'POST', url: '/api/agent/run', payload: RUN_REQUEST });
    await server.inject({
      method: 'POST',
      url: '/api/agent/approve',
      payload: { run_id: 'run_001', approved_by: 'demo_operator', decision: 'approve' },
    });

    const trail = await deps.auditLog.byRun('run_001');
    expect(trail.map((r) => r.eventType)).toEqual([
      'run_started',
      'recommendation_made',
      'approval_recorded',
      'action_executed',
    ]);

    const executed = trail.at(-1);
    expect(executed?.connector).toBe('stripe');
    expect(executed?.idempotencyKey).toBe('run_001:apply_credit');
    expect(executed?.result).toBe('success');

    await server.close();
  });
});

describe('POST /api/agent/approve — deny never executes', () => {
  it('returns a denied state and never calls Stripe', async () => {
    const deps = makeDeps();
    const server = buildServer(deps);

    await server.inject({ method: 'POST', url: '/api/agent/run', payload: RUN_REQUEST });

    const res = await server.inject({
      method: 'POST',
      url: '/api/agent/approve',
      payload: { run_id: 'run_001', approved_by: 'demo_operator', decision: 'deny', notes: 'No' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('denied');
    expect(body.decision).toBe('deny');
    expect(body.receipt).toBeUndefined();

    // The gate held: no approval recorded as `approve` → connector never invoked.
    expect(deps.stripeCalls).toHaveLength(0);

    const trail = await deps.auditLog.byRun('run_001');
    expect(trail.map((r) => r.eventType)).toEqual([
      'run_started',
      'recommendation_made',
      'approval_recorded',
    ]);

    await server.close();
  });
});

describe('GET /api/audit/:run_id', () => {
  it('returns the append-only audit trail in spec (snake_case) shape', async () => {
    const deps = makeDeps();
    const server = buildServer(deps);

    await server.inject({ method: 'POST', url: '/api/agent/run', payload: RUN_REQUEST });
    await server.inject({
      method: 'POST',
      url: '/api/agent/approve',
      payload: { run_id: 'run_001', approved_by: 'demo_operator', decision: 'approve' },
    });

    const res = await server.inject({ method: 'GET', url: '/api/audit/run_001' });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.run_id).toBe('run_001');
    expect(body.audit_log.map((r: { event_type: string }) => r.event_type)).toEqual([
      'run_started',
      'recommendation_made',
      'approval_recorded',
      'action_executed',
    ]);

    const first = body.audit_log[0];
    expect(first).toMatchObject({
      run_id: 'run_001',
      event_type: 'run_started',
      actor: expect.any(String),
      timestamp: '2026-06-09T12:34:50.000Z',
    });
    // snake_case external contract — no camelCase leakage from storage.
    expect(first.runId).toBeUndefined();
    expect(first.eventType).toBeUndefined();

    await server.close();
  });

  it('returns 404 for an unknown run', async () => {
    const deps = makeDeps();
    const server = buildServer(deps);

    const res = await server.inject({ method: 'GET', url: '/api/audit/run_999' });
    expect(res.statusCode).toBe(404);

    await server.close();
  });
});

describe('input validation', () => {
  let server: ReturnType<typeof buildServer>;
  beforeEach(() => {
    server = buildServer(makeDeps());
  });

  it('rejects a run request missing required fields with 400', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/agent/run',
      payload: { account_id: 'acct_demo_001' },
    });
    expect(res.statusCode).toBe(400);
    await server.close();
  });

  it('rejects an approve with an invalid decision with 400', async () => {
    await server.inject({ method: 'POST', url: '/api/agent/run', payload: RUN_REQUEST });
    const res = await server.inject({
      method: 'POST',
      url: '/api/agent/approve',
      payload: { run_id: 'run_001', approved_by: 'op', decision: 'maybe' },
    });
    expect(res.statusCode).toBe(400);
    await server.close();
  });
});
