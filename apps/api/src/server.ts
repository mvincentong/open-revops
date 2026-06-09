/**
 * Server entry point. Wires the in-memory defaults (storage adapters, deterministic
 * clock, in-memory Stripe credit client) and starts listening. Run with
 * `pnpm --filter @open-revops/api dev` or `node dist/server.js`.
 *
 * SECURITY: this demo server exposes the run/approve/audit endpoints WITHOUT
 * authentication or authorization. It is intended for local, single-operator demo
 * use only (synthetic data, in-memory state). Do NOT expose it to a network or
 * untrusted clients without adding authn/z, rate limiting, and a durable,
 * access-controlled audit store first (see docs/threat-model.md).
 */

import { createInMemoryAuditLog, createInMemoryRunStore } from '@open-revops/connectors-storage';

import { buildServer } from './app.js';
import { createDefaultClock } from './clock.js';
import { createInMemoryStripeClient } from './stripe-client.js';
import type { RunState } from './types.js';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3001;

async function main(): Promise<void> {
  const host = process.env.API_HOST ?? DEFAULT_HOST;
  const port = Number.parseInt(process.env.API_PORT ?? String(DEFAULT_PORT), 10);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid API_PORT: "${process.env.API_PORT}"`);
  }

  const clock = createDefaultClock();
  const server = buildServer({
    clock,
    auditLog: createInMemoryAuditLog(),
    runStore: createInMemoryRunStore<RunState>(),
    stripeClient: createInMemoryStripeClient(clock),
  });

  console.warn(
    '[open-revops/api] Starting WITHOUT authentication — local demo use only. ' +
      'Do not expose to a network without adding authn/z and rate limiting.',
  );

  await server.listen({ host, port });
  console.log(`[open-revops/api] listening on http://${host}:${port}`);
}

main().catch((error: unknown) => {
  console.error('[open-revops/api] failed to start:', error);
  process.exitCode = 1;
});
