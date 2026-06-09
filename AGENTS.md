# AGENTS.md — Contribution policy for AI agents and humans

This file is the canonical operating contract for **both AI coding agents and human
contributors** working in this repository. It is intentionally written to be read by
agent harnesses (Claude Code, ECC, Superpowers, Codex, Cursor, etc.). If anything here
conflicts with a tool's default behavior, **this file wins**.

> TL;DR: stay in scope, keep the demo deterministic and synthetic, never commit secrets or
> real customer data, only reuse license-compatible material, and pass every guardrail
> before merge.

---

## Scope and non-goals

**In scope (MVP):**

- The agent loop: ingest → detect → recommend → approve → execute → audit.
- One trigger type, one recommendation type, one Stripe (sandbox) action, one approval
  gate, one KPI panel — kept narrow on purpose.
- Modular connectors (Stripe, Exa, storage) and a policy/guardrail engine.
- Deterministic synthetic demo data and a replay/eval harness.

**Non-goals (do not build):**

- Multi-tenant admin / complex role hierarchies.
- Full ERP or revenue-recognition coverage.
- Multiple unrelated agent workflows.
- Anything that requires proprietary benchmark data to function.

When in doubt about scope, open a discussion/issue before writing code.

## Package ownership and interface contracts

- Respect package boundaries. Read a package's `README.md` and public interface **before**
  editing it. Do not reach across package internals; depend on published interfaces.
- Lock cross-cutting contracts (API request/response, event/audit schema, UI data model)
  **before** parallel work. Changing a locked schema requires sign-off from the integration
  owner (see `.github/CODEOWNERS`).
- Cross-cutting config (`.github/`, root tooling, CI) is owned centrally — coordinate
  before changing it.

## Allowed sources and licenses

- Reuse **only** from license-compatible open-source material (permissive licenses
  compatible with **Apache-2.0**: MIT, BSD, ISC, Apache-2.0).
- Keep required copyright headers and notices when adapting code; add the attribution to
  the PR description and, where appropriate, to `NOTICE`.
- **If a license is unclear or incompatible (GPL/AGPL/SSPL/“source-available”/unknown), do
  not use the content** until clarified by a maintainer.

## Prohibited copying

Never copy into this repository:

- Proprietary code or docs from private repositories or internal systems.
- Long verbatim content from vendor docs, reports, blogs, or books.
- Competitor product copy, screenshots, or marketing claims as-is.
- Dataset rows containing PII, financial-account data, or real billing records.
- Code under incompatible or unclear licenses for an Apache-2.0 project.

## Security and data handling

- **No secrets, ever.** No API keys, tokens, passwords, signing secrets, or `.env` files in
  commits. Read configuration from the environment. See [`SECURITY.md`](./SECURITY.md).
- **No real customer data.** Demo and test data must be **synthetic and reproducible**
  (fixed seed). No PII, no real billing records.
- Treat all external input as untrusted. Verify Stripe webhook signatures. Apply rate
  limits, timeouts, retries, and idempotency keys to connector calls.
- **Irreversible actions are gated** behind explicit human approval; respect the policy
  engine and the kill-switch (`POLICY_REQUIRE_APPROVAL_ALWAYS`). Do not add code paths that
  bypass the approval gate.
- Redact sensitive fields in logs and decision traces.

## Auditability requirements

- Every agent action must produce a human-readable **decision trace** (problem detected →
  alternatives considered → chosen action + rationale + confidence) and an append-only
  **audit record**. See [`docs/decision-trace-spec.md`](./docs/decision-trace-spec.md).
- Do not make demo output non-deterministic. If a change alters expected golden-path
  outputs, call it out explicitly and get integration-owner sign-off.

## Testing and CI requirements

- **TDD where practical:** write a failing test first, make it pass, refactor.
- Required before merge:
  1. Lint + format pass.
  2. Type checks pass.
  3. Unit tests pass (decision/policy logic in particular).
  4. Integration test passes for any connector you touched (Stripe sandbox).
  5. Secret scan passes — no keys/tokens/passwords.
  6. License/dependency audit passes.
- Keep `main` runnable end-to-end at all times. Put risky changes behind a flag.

## Attribution and PR checklist

Before opening a PR, confirm:

- [ ] Change stays within declared scope and package ownership.
- [ ] No secrets, credentials, or real customer/PII data added.
- [ ] Demo data remains synthetic and reproducible.
- [ ] Decision-trace / audit behavior preserved (or changes documented).
- [ ] Reused code is license-compatible and attributed in the PR description.
- [ ] Docs updated to reflect behavior changes.
- [ ] All CI guardrails pass locally (`pnpm lint && pnpm typecheck && pnpm test`).

---

### For agent harnesses specifically

- Prefer small, reviewable diffs. Explain _why_, not just _what_, in PR descriptions.
- Do not disable, weaken, or bypass CI checks, the secret scanner, or the approval gate to
  make something pass.
- Do not exfiltrate repository contents to third-party services beyond what a task requires.
- If you are unsure whether an action is reversible or in-scope, **stop and ask** rather
  than guessing.
