# Threat model

OpenRevOps recommends and executes **billing actions**, so the security posture centers on:
not leaking secrets, not acting without authorization, and keeping an honest audit trail.
This is a living document; update it as the system grows. See also
[`SECURITY.md`](../SECURITY.md).

## Assets to protect

- **Credentials** — provider keys/secrets (Stripe, Exa, LLM, storage) and webhook signing
  secrets. These live in the environment, never in the repo.
- **Billing-action integrity** — only approved, in-policy, non-duplicated actions execute.
- **Audit trail** — append-only, tamper-evident record of decisions and actions.
- **Customer data** — there is intentionally **none** in the repo; demo data is synthetic.

## Trust boundaries

```
[operator UI] --HTTPS--> [agent API] --> [policy engine] --> [connectors] --> [Stripe/Exa]
                                   \--> [event store + append-only audit log]
        ^ untrusted user input            ^ untrusted: webhooks, model output, search results
```

Everything crossing a boundary is untrusted until validated: UI input, webhook payloads,
LLM output, and retrieved search text.

## Threats & mitigations

| # | Threat | Mitigation |
|---|--------|-----------|
| T1 | Secret committed to the repo | `.gitignore` for secret paths; `.claude/hooks/guard-secrets.sh` pre-tool guard; gitleaks scan in CI; config from env only |
| T2 | Forged/replayed webhook triggers an action | Verify provider **signatures** before processing; reject on failure; de-dupe on event id |
| T3 | Unauthorized irreversible action | Human **approval gate** + guardrail matrix; `POLICY_REQUIRE_APPROVAL_ALWAYS` kill-switch; no bypass code paths |
| T4 | Duplicate execution on retry | **Idempotency keys** (`run_id + action`) on every state-changing call |
| T5 | Prompt injection via search/context | Treat retrieved text as **data, not instructions**; decisions still pass policy checks |
| T6 | Audit tampering / silent drift | **Append-only** records; deterministic golden path; integration-owner sign-off for output changes |
| T7 | Sensitive data in logs/traces | **Redact** keys/tokens/PII before persistence; log stable non-sensitive ids |
| T8 | Vulnerable / incompatibly-licensed dependency | Dependency review + CodeQL in CI; Dependabot updates; Apache-2.0-compatible licenses only |
| T9 | Over-permissioned CI | Least-privilege `permissions:` per workflow; pinned actions; no secrets needed for the default gate |

## Credential markers (for scanners and reviewers)

Detection guards look for the **shapes** of live credentials — for example a live-mode
secret-key prefix used by Stripe-style keys, a cloud provider access-key id, or a PEM
private-key block header. Documentation and tests should describe these shapes **in words**
(as this paragraph does) rather than embedding literal token prefixes, which keeps the
secret guard and gitleaks from firing on examples while still teaching reviewers what to
watch for. Test/sandbox prefixes and placeholders like `<YOUR_API_KEY>` are safe to use.

## Out of scope (for now)

- Multi-tenant isolation and enterprise auth (not in MVP scope).
- Vulnerabilities in third-party services themselves (report to those vendors).
- Physical/host compromise of a developer machine.
