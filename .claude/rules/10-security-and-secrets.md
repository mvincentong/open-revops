# Rule: security and secrets

This project executes billing actions, so security is a correctness requirement, not a
nice-to-have. See also [`SECURITY.md`](../../SECURITY.md) and
[`docs/threat-model.md`](../../docs/threat-model.md).

## Secrets

- **Never put real secrets on disk in the repo.** No API keys, tokens, passwords, signing
  secrets, or `.env` files in commits. Read all configuration from the environment.
- Document required variables in [`.env.example`](../../.env.example) using **placeholders
  only** (e.g. `<YOUR_API_KEY>`, `xxx`). Use **test/sandbox** credentials for local work.
- When writing docs or tests, describe credential shapes **in words** ("a live-mode
  secret-key prefix") rather than pasting literal token prefixes. This keeps the
  `guard-secrets.sh` hook and the gitleaks scanner from firing on examples.
- `.env` is gitignored; `.claude/hooks/guard-secrets.sh` blocks edits/commits of
  secret-bearing files; CI runs a gitleaks scan. Do not weaken any of these.

## Untrusted input

- Treat **all** external input as untrusted — webhook payloads, search results, model
  output, and user-supplied fields alike.
- **Verify Stripe webhook signatures** before processing an event. Reject unverified
  payloads.
- Validate and narrow types at boundaries; never `eval` or interpolate untrusted strings
  into shells, SQL, or templates.

## The approval gate (do not bypass)

- Irreversible actions are gated behind an explicit human approval step.
- Respect the policy engine and the hard kill-switch
  (`POLICY_REQUIRE_APPROVAL_ALWAYS`). **Do not add code paths that bypass approval**, even
  "temporarily" or behind a debug flag that ships.
- Connector calls that change state must use **idempotency keys** so retries can't
  double-execute.

## Logging and traces

- **Redact** sensitive fields (keys, tokens, PII, full account identifiers) in logs and
  decision traces. Prefer logging stable, non-sensitive ids.
- Audit records are **append-only**. Never delete or mutate history to "fix" a trace.

## If you find a vulnerability

Do **not** open a public issue. Follow the private process in
[`SECURITY.md`](../../SECURITY.md).
