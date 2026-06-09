# @open-revops/web

Next.js (App Router) operator UI — the **Revenue War Room**. It shows the agent's
recommendation, the human-readable decision trace, the human approval gate, and the KPI
panel for a run.

## Sections

The UI renders four sections from the locked v1 contract in
[`docs/decision-trace-spec.md`](../../docs/decision-trace-spec.md):

1. **Recommendation** — `action_type`, `confidence`, and the `expected_kpi_delta`
   (before → after).
2. **Decision trace** — problem detected → `alternatives_considered` → `rationale`. The v1
   response has no explicit `problem` field, so the problem line is composed from the
   detected KPI and the run's `account_id`.
3. **Approval gate** — Approve / Deny, which POST the approval payload and append an audit
   event. Nothing irreversible executes without a recorded `approve`.
4. **KPI panel** — `leakage_risk` before `0.14` → after `0.05`.

## Data flow

The browser uses a typed client (`src/lib/api-client.ts`) that calls the app's own route
handlers:

- `POST /api/agent/run` → recommendation + decision trace
- `POST /api/agent/approval` → record an approve/deny decision

Those route handlers choose their backing from `AGENT_API_MODE`:

| `AGENT_API_MODE` | Behaviour                                                       |
| ---------------- | --------------------------------------------------------------- |
| `mock` (default) | Return the deterministic `golden_path_v1` response from the spec |
| `live`           | Proxy to the real agent API at `API_BASE_URL`                   |

The mock is reproduced verbatim from `docs/decision-trace-spec.md` and is fully
deterministic (no wall-clock or randomness), per
[`.claude/rules/20-determinism-and-demo-data.md`](../../.claude/rules/20-determinism-and-demo-data.md).
Switching to the real API later is a one-line env change — the UI does not change.

## Scripts

```bash
pnpm --filter @open-revops/web dev        # next dev (http://localhost:3000)
pnpm --filter @open-revops/web build      # next build
pnpm --filter @open-revops/web typecheck  # tsc --noEmit
pnpm --filter @open-revops/web lint        # eslint .
```

These also run from the repo root via `pnpm -r --if-present <script>`.

## Configuration

Copy `.env.example` to `.env.local` to override defaults. No secrets are needed for the
golden-path demo.

## Layout

```text
src/
  app/
    layout.tsx, page.tsx, globals.css
    api/agent/run/route.ts          POST /api/agent/run
    api/agent/approval/route.ts     POST /api/agent/approval
  components/
    WarRoom.tsx                     client orchestrator (run + approval state)
    RecommendationCard.tsx          section 01
    DecisionTrace.tsx               section 02
    ApprovalGate.tsx                section 03
    KpiPanel.tsx                    section 04
    Section.tsx, Badge.tsx          shared UI primitives
  lib/
    types.ts                        v1 contracts (decision-trace-spec.md)
    api-client.ts                   typed browser client
    env.ts                          AGENT_API_MODE / API_BASE_URL resolution
    mock.ts                         deterministic golden_path_v1 mock
    validate.ts                     boundary validation / parsers
    upstream.ts                     live API proxy with timeout
    format.ts                       presentation helpers
```
