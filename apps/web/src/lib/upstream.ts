/**
 * Helper for proxying to the live agent API (used only when `AGENT_API_MODE=live`).
 *
 * Wraps the upstream call with a bounded timeout and treats the response as untrusted —
 * the caller passes a parser that narrows the payload to a known contract type.
 */

import { getApiBaseUrl, UPSTREAM_TIMEOUT_MS } from './env';

/** Raised when the upstream agent API is unreachable, times out, or returns a non-2xx status. */
export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

/**
 * POST `body` to `path` on the live agent API, parse/validate the JSON response, and return
 * the narrowed value. Throws {@link UpstreamError} on transport, status, or parse failure.
 */
export async function postUpstream<T>(
  path: string,
  body: unknown,
  parse: (value: unknown) => T,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new UpstreamError(`upstream responded with status ${response.status}`);
    }

    const payload: unknown = await response.json().catch(() => {
      throw new UpstreamError('upstream returned a non-JSON response');
    });

    return parse(payload);
  } catch (cause) {
    if (cause instanceof UpstreamError) throw cause;
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      throw new UpstreamError('upstream request timed out', 504);
    }
    const message = cause instanceof Error ? cause.message : 'upstream request failed';
    throw new UpstreamError(message);
  } finally {
    clearTimeout(timeout);
  }
}
