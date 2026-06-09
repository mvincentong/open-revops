/**
 * Fastify app — the HTTP surface for the agent orchestration API. Implements the
 * three v1 endpoints from docs/decision-trace-spec.md exactly:
 *
 *   POST /api/agent/run       run the agent loop, return the recommendation
 *   POST /api/agent/approve   record an approval and (only then) execute
 *   GET  /api/audit/:run_id   return the append-only audit trail
 *
 * All collaborators (clock, storage, Stripe port, policy) are injected via
 * `buildServer(deps)` so the same app runs deterministically in tests (via
 * `inject`) and in `server.ts` with the in-memory defaults.
 *
 * Request bodies/params are validated by JSON schema at the boundary (untrusted
 * input — .claude/rules/10-security-and-secrets.md); `additionalProperties: false`
 * rejects unexpected fields.
 */

import type { AuditLog, RunStore } from '@open-revops/connectors-storage';
import type { StripeCreditClient } from '@open-revops/connectors-stripe';
import type { PolicyConfig } from '@open-revops/policy-engine';
import Fastify, { type FastifyInstance } from 'fastify';

import type { Clock } from './clock.js';
import { createAgentService } from './service.js';
import type { ApprovalRequest, RunRequest, RunState } from './types.js';

/** Everything `buildServer` needs to construct the service. */
export interface ServerDeps {
  readonly clock: Clock;
  readonly auditLog: AuditLog;
  readonly runStore: RunStore<RunState>;
  readonly stripeClient: StripeCreditClient;
  readonly policyConfig?: PolicyConfig;
}

const runBodySchema = {
  type: 'object',
  required: ['account_id', 'scenario_id', 'run_mode'],
  additionalProperties: false,
  properties: {
    account_id: { type: 'string', minLength: 1 },
    scenario_id: { type: 'string', minLength: 1 },
    run_mode: { type: 'string', minLength: 1 },
  },
} as const;

const approveBodySchema = {
  type: 'object',
  required: ['run_id', 'approved_by', 'decision'],
  additionalProperties: false,
  properties: {
    run_id: { type: 'string', minLength: 1 },
    approved_by: { type: 'string', minLength: 1 },
    decision: { type: 'string', enum: ['approve', 'deny'] },
    notes: { type: 'string' },
  },
} as const;

const auditParamsSchema = {
  type: 'object',
  required: ['run_id'],
  additionalProperties: false,
  properties: {
    run_id: { type: 'string', minLength: 1 },
  },
} as const;

/**
 * Build a fully-wired Fastify instance. The caller owns the lifecycle (`listen` /
 * `close`); tests use `inject` and never open a socket.
 */
export function buildServer(deps: ServerDeps): FastifyInstance {
  const app = Fastify({ logger: false });
  const service = createAgentService(deps);

  app.post('/api/agent/run', { schema: { body: runBodySchema } }, async (request, reply) => {
    const body = request.body as RunRequest;
    const response = await service.run(body);
    return reply.code(200).send(response);
  });

  app.post('/api/agent/approve', { schema: { body: approveBodySchema } }, async (request, reply) => {
    const body = request.body as ApprovalRequest;
    const result = await service.approve(body);

    switch (result.kind) {
      case 'ok':
        return reply.code(200).send(result.response);
      case 'not_found':
        return reply.code(404).send({ error: 'run_not_found', run_id: body.run_id });
      case 'conflict':
        return reply.code(409).send({ error: 'run_not_approvable', message: result.message });
      case 'error':
        return reply.code(502).send({ error: 'execution_failed', message: result.message });
      default:
        return assertNever(result);
    }
  });

  app.get('/api/audit/:run_id', { schema: { params: auditParamsSchema } }, async (request, reply) => {
    const { run_id: runId } = request.params as { run_id: string };
    const trail = await service.getAudit(runId);
    if (trail === undefined) {
      return reply.code(404).send({ error: 'run_not_found', run_id: runId });
    }
    return reply.code(200).send({ run_id: runId, audit_log: trail });
  });

  return app;
}

/** Compile-time exhaustiveness guard for the approval result union. */
function assertNever(value: never): never {
  throw new Error(`Unhandled approval result: ${JSON.stringify(value)}`);
}
