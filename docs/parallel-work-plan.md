# Parallel Work Plan

This document is the public coordination contract for parallel v0.1 work. It describes
how contributors can split implementation safely across packages. Personal orchestration
state such as tmux pane layouts, agent prompts, pane logs, local worktree maps, and scratch
notes belongs in `.local/` or outside the repository and must not be committed.

The goal for v0.1 is the smallest end-to-end slice that proves the agent loop:

```text
ingest -> detect -> recommend -> enforce policy -> approve -> execute -> audit
```

## Rules

- Keep each workstream scoped to one package or app whenever possible.
- Treat the schemas in `docs/decision-trace-spec.md` as locked integration contracts.
- Treat `docs/policy-rules.md` and `docs/connectors.md` as locked behavioral contracts.
- Do not change cross-cutting request/response, event, audit, or UI data models without
  integration-owner sign-off.
- Keep demo data synthetic, deterministic, and reproducible.
- Do not bypass the approval gate, policy engine, secret scanner, or audit path.
- Open small PRs that land one reviewable slice at a time.

## Recommended Workstreams

| Workstream | Branch name | Primary paths | Depends on | Delivers |
| --- | --- | --- | --- | --- |
| Agent core | `feat/agent-core-v0.1` | `packages/agent-core` | Demo data, policy types | Ingest, detect, recommend pipeline for one scenario |
| Policy engine | `feat/policy-engine-v0.1` | `packages/policy-engine` | Decision-trace spec | Guardrail matrix, thresholds, kill-switch decision procedure |
| Demo data | `feat/demo-data-v0.1` | `packages/demo-data` | Decision-trace spec | Seeded synthetic accounts, usage events, expected golden-path inputs |
| Storage | `feat/storage-v0.1` | `packages/connectors-storage` | Decision-trace spec | Local event store and append-only audit log |
| API | `feat/api-v0.1` | `apps/api` | Agent core, policy, storage | Run, approval, and audit endpoints |
| Web | `feat/web-v0.1` | `apps/web` | API response contract | Operator UI for recommendation, trace, approval, audit, KPI panel |
| Stripe | `feat/stripe-credit-v0.1` | `packages/connectors-stripe` | Policy, storage | One sandbox action with idempotency and receipt |

## Integration Order

1. Lock the v1 API, approval, and audit schemas in `docs/decision-trace-spec.md`.
2. Land `policy-engine` with unit tests for every status path.
3. Land `demo-data` with fixed-seed golden-path fixtures.
4. Land `agent-core` using only public policy and demo-data interfaces.
5. Land `connectors-storage` and wire append-only audit events.
6. Land `apps/api` against local in-memory or file-backed adapters.
7. Land `apps/web` against the API contract.
8. Land `connectors-stripe` behind the approval gate and idempotency key.
9. Run the full golden path three times from a clean reset.

## Worktree Layout

Use separate Git worktrees for parallel implementation so independent agents do not edit
the same working tree:

```text
../open-revops-worktrees/
  agent-core/
  policy-engine/
  demo-data/
  storage/
  api/
  web/
  stripe/
```

The root checkout remains the control workspace for docs, integration review, and final
merge checks. Do not commit worktree orchestration scripts or pane logs unless they are
converted into project-neutral documentation.

## Merge Checklist

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm secrets:scan`
- Golden-path output remains deterministic, or the intentional change is documented and
  approved by the integration owner.
