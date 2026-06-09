# @open-revops/api

Agent API and orchestration — run, approval, and audit endpoints.

> **Status: v0.1.** Implements the agent loop over the deterministic golden path
> behind the three v1 endpoints in [`docs/decision-trace-spec.md`](../../docs/decision-trace-spec.md).
> Built on [Fastify](https://fastify.dev) with injectable, in-memory defaults.

## Purpose

The HTTP orchestration layer for the agent loop
(`ingest → detect → recommend → enforce policy → approve → execute → audit`). It
composes `@open-revops/agent-core`, `@open-revops/policy-engine`,
`@open-revops/connectors-storage`, and `@open-revops/connectors-stripe`. The policy
engine and approval gate are never bypassed
(see [`.claude/rules/10-security-and-secrets.md`](../../.claude/rules/10-security-and-secrets.md)).

## Endpoints

| Method + path           | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `POST /api/agent/run`   | Run the agent loop. Writes `run_started` + `recommendation_made` audit records, persists run state, and returns the v1 run response (`needs_approval`). |
| `POST /api/agent/approve` | Record an `approval_recorded` audit entry. On `approve`, execute the credit via the Stripe connector (idempotency key `run_id:apply_credit`) and append `action_executed`. On `deny`, return a denied state and execute nothing. |
| `GET /api/audit/:run_id` | Return the append-only audit trail for a run (snake_case, per the spec). `404` for unknown runs. |

Request bodies are validated by JSON schema at the boundary; unexpected fields are rejected.

## Public interface

```ts
import {
  buildServer,            // (deps) => FastifyInstance — inject clock/storage/Stripe/policy
  createAgentService,     // the run/approve/audit orchestration, framework-agnostic
  createFixedClock,
  createSteppingClock,    // deterministic, injectable clocks
  createInMemoryStripeClient, // default write-path adapter (no SDK, no secret)
  type RunState,
} from '@open-revops/api';
```

## The approval gate

Irreversible actions execute **only** after an `approval_recorded` (`approve`) entry
exists for the run. The Stripe connector independently refuses without
`approvalRecorded: true`, and `deny`/`blocked` runs never reach the connector. There
is no debug or override path.

## Determinism

The run loop uses seeded synthetic data (`@open-revops/demo-data`) and an injected
clock, so the golden path is reproducible. Tests inject a stepping clock; the default
server uses a deterministic stepping clock seeded from a fixed base
(see [`.claude/rules/20-determinism-and-demo-data.md`](../../.claude/rules/20-determinism-and-demo-data.md)).

## Security

> The default server (`pnpm --filter @open-revops/api dev`) exposes these endpoints
> **without authentication** and keeps state **in memory**. It is for local,
> single-operator demo use only. Do not expose it to a network without adding
> authn/z, rate limiting, and a durable, access-controlled audit store first
> (see [`docs/threat-model.md`](../../docs/threat-model.md)).

## Scripts

```bash
pnpm --filter @open-revops/api dev        # build + start the server (in-memory defaults)
pnpm --filter @open-revops/api lint
pnpm --filter @open-revops/api typecheck
pnpm --filter @open-revops/api test
pnpm --filter @open-revops/api build
```

The root commands invoke these via `pnpm -r --if-present`. See
[`CONTRIBUTING.md`](../../CONTRIBUTING.md).
