# Deployment

> Scaffold note: the commands below describe the intended developer and deployment
> experience. While packages are placeholders, `pnpm …` scripts exit successfully as
> no-ops.

## Prerequisites

- **Node 22+** (pinned in [`.nvmrc`](../.nvmrc)) — `nvm use` / `fnm use`.
- **pnpm 10+** — `corepack enable`.
- A **Stripe test-mode** account (sandbox keys only) for connector work.

## Local development

```bash
git clone https://github.com/mvincentong/open-revops.git
cd open-revops
corepack enable
nvm use
cp .env.example .env     # fill in TEST/sandbox keys; never commit .env
pnpm install
pnpm demo:seed           # seed deterministic synthetic data
pnpm dev                 # run operator UI + API locally
```

Reset to a clean state anytime with `pnpm demo:reset`.

## Configuration

All configuration is read from the environment. See [`.env.example`](../.env.example) for
the documented variables (use **placeholders**/sandbox values). Key knobs:

- `POLICY_REQUIRE_APPROVAL_ALWAYS` — hard kill-switch; keep `true` for demos.
- `POLICY_AUTO_EXECUTE_CONFIDENCE` — auto-execute threshold for allowed actions.
- `DEMO_SEED` — fixes the synthetic dataset so output is identical every run.

## Cloud (reference shape)

The architecture maps cleanly onto the intended stack, but **self-hosting requires none of
it** — the golden path runs locally on synthetic data.

| Component        | Reference host           | Notes                                   |
| ---------------- | ------------------------ | --------------------------------------- |
| `apps/web`       | Vercel                   | Operator UI + light API routes.         |
| `apps/api`       | AWS (Lambda/ECS) or Vercel | Orchestration + policy checks.        |
| Worker           | AWS queue worker         | Async connector calls, retries.         |
| Event/audit store| Managed DB or local file | Append-only audit log.                  |

### Production checklist

- [ ] Secrets supplied via the platform's secret manager (never in the image or repo).
- [ ] Stripe webhook endpoint configured with a verified signing secret.
- [ ] Least-privilege credentials for each connector.
- [ ] Audit log persisted to durable, append-only storage with retention defined.
- [ ] Kill-switch / approval policy reviewed for the environment.

## CI/CD

CI (`.github/workflows/ci.yml`) runs lint, typecheck, test, and build on every push/PR;
secret scanning, dependency review, and CodeQL run alongside. Tagging `vX.Y.Z` triggers
[`release.yml`](../.github/workflows/release.yml).
