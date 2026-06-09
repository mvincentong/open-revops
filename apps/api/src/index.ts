/**
 * @open-revops/api — agent orchestration HTTP API (run, approve, audit).
 *
 * Public surface: the Fastify app builder, the orchestration service, the
 * injectable clock, the in-memory Stripe client, and the shared types/contract.
 * Implements the v1 schemas in docs/decision-trace-spec.md.
 */

export { buildServer, type ServerDeps } from './app.js';
export {
  createAgentService,
  type AgentService,
  type ApproveResult,
  type ServiceDeps,
} from './service.js';
export {
  createDefaultClock,
  createFixedClock,
  createSteppingClock,
  type Clock,
} from './clock.js';
export { createInMemoryStripeClient } from './stripe-client.js';
export { computeGoldenCreditAmountCents } from './credit.js';
export type {
  ApiAuditRecord,
  ApprovalDecision,
  ApprovalRequest,
  ApprovalState,
  ApproveResponse,
  AuditResponse,
  RunRequest,
  RunResponse,
  RunState,
  RunStatus,
} from './types.js';
