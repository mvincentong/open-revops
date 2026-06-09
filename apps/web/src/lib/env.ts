/**
 * Environment-driven configuration for the agent API backing.
 *
 * The operator UI always talks to the app's own route handlers (`/api/agent/*`). Those
 * handlers decide — based on `AGENT_API_MODE` — whether to serve the deterministic
 * golden-path mock (default, until the real agent API exists) or to proxy to the live
 * agent API at `API_BASE_URL`. Flipping the flag is the only change needed to go live.
 *
 * These values are read server-side only (no secrets are exposed to the client).
 */

export type ApiMode = 'mock' | 'live';

/**
 * Resolve the API mode. Defaults to `mock` so a fresh checkout runs the deterministic
 * golden path with zero configuration. Set `AGENT_API_MODE=live` to proxy to the real API.
 */
export function getApiMode(): ApiMode {
  return process.env.AGENT_API_MODE === 'live' ? 'live' : 'mock';
}

/** Base URL of the live agent API (used only when `AGENT_API_MODE=live`). */
export function getApiBaseUrl(): string {
  return process.env.API_BASE_URL ?? 'http://localhost:8787';
}

/** Per-request timeout (ms) for live upstream calls. */
export const UPSTREAM_TIMEOUT_MS = 10_000;
