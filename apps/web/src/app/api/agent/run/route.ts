/**
 * `POST /api/agent/run` — produce a recommendation + decision trace for an account/scenario.
 *
 * In `mock` mode (default) this returns the deterministic `golden_path_v1` response. In
 * `live` mode it proxies to the real agent API. The browser always calls this same route.
 */

import { NextResponse } from 'next/server';

import { getApiMode } from '@/lib/env';
import { mockAgentRun } from '@/lib/mock';
import { postUpstream, UpstreamError } from '@/lib/upstream';
import { parseAgentRunRequest, parseAgentRunResponse, ValidationError } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'request body must be valid JSON' }, { status: 400 });
  }

  let runRequest;
  try {
    runRequest = parseAgentRunRequest(body);
  } catch (cause) {
    if (cause instanceof ValidationError) {
      return NextResponse.json({ error: cause.message }, { status: 400 });
    }
    throw cause;
  }

  if (getApiMode() === 'mock') {
    return NextResponse.json(mockAgentRun(runRequest), { status: 200 });
  }

  try {
    const result = await postUpstream('/api/agent/run', runRequest, parseAgentRunResponse);
    return NextResponse.json(result, { status: 200 });
  } catch (cause) {
    if (cause instanceof UpstreamError) {
      return NextResponse.json({ error: cause.message }, { status: cause.status });
    }
    if (cause instanceof ValidationError) {
      return NextResponse.json({ error: `upstream contract violation: ${cause.message}` }, { status: 502 });
    }
    return NextResponse.json({ error: 'agent run failed' }, { status: 500 });
  }
}
