/**
 * `POST /api/agent/approval` — record a human approve/deny decision for a run.
 *
 * No irreversible action executes without a stored `approve` event for the run id
 * (decision-trace-spec.md). In `mock` mode this returns a deterministic acknowledgement; in
 * `live` mode it proxies the decision to the real agent API.
 */

import { NextResponse } from 'next/server';

import { getApiMode } from '@/lib/env';
import { mockApproval } from '@/lib/mock';
import { postUpstream, UpstreamError } from '@/lib/upstream';
import { parseApprovalRequest, parseApprovalResponse, ValidationError } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'request body must be valid JSON' }, { status: 400 });
  }

  let approvalRequest;
  try {
    approvalRequest = parseApprovalRequest(body);
  } catch (cause) {
    if (cause instanceof ValidationError) {
      return NextResponse.json({ error: cause.message }, { status: 400 });
    }
    throw cause;
  }

  if (getApiMode() === 'mock') {
    return NextResponse.json(mockApproval(approvalRequest), { status: 200 });
  }

  try {
    const result = await postUpstream('/api/agent/approval', approvalRequest, parseApprovalResponse);
    return NextResponse.json(result, { status: 200 });
  } catch (cause) {
    if (cause instanceof UpstreamError) {
      return NextResponse.json({ error: cause.message }, { status: cause.status });
    }
    if (cause instanceof ValidationError) {
      return NextResponse.json({ error: `upstream contract violation: ${cause.message}` }, { status: 502 });
    }
    return NextResponse.json({ error: 'approval failed' }, { status: 500 });
  }
}
