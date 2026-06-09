/**
 * Typed API client used by the operator UI (browser-side).
 *
 * The client always calls the app's own route handlers under `/api/agent/*`. Whether those
 * resolve to the deterministic mock or the live agent API is decided server-side by the
 * `AGENT_API_MODE` flag — the UI does not need to know or change.
 *
 * Every call returns an `ApiResult<T>` so callers handle transport and server errors
 * explicitly rather than relying on thrown exceptions.
 */

import type {
  AgentRunRequest,
  AgentRunResponse,
  ApiResult,
  ApprovalRequest,
  ApprovalResponse,
} from './types';

async function postJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        payload && typeof payload === 'object' && 'error' in payload
          ? String((payload as { error: unknown }).error)
          : `Request failed with status ${response.status}`;
      return { ok: false, error: message };
    }

    return { ok: true, data: payload as T };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Network request failed';
    return { ok: false, error: message };
  }
}

/** Trigger an agent run. Maps to `POST /api/agent/run`. */
export function runAgent(request: AgentRunRequest): Promise<ApiResult<AgentRunResponse>> {
  return postJson<AgentRunResponse>('/api/agent/run', request);
}

/** Record an approval decision. Maps to `POST /api/agent/approval`. */
export function submitApproval(request: ApprovalRequest): Promise<ApiResult<ApprovalResponse>> {
  return postJson<ApprovalResponse>('/api/agent/approval', request);
}
