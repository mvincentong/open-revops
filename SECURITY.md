# Security Policy

OpenRevOps executes billing actions on behalf of operators, so we take security seriously.
Thank you for helping keep the project and its users safe.

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions,
or pull requests.**

Instead, use **[GitHub Private Vulnerability Reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)**:

1. Go to the repository's **Security** tab → **Report a vulnerability**.
2. Provide a clear description, affected versions/components, reproduction steps, and impact.

> Maintainers: enable "Private vulnerability reporting" under
> **Settings → Code security and analysis** before publishing the repo. If you need an
> email fallback channel, add a monitored alias here (e.g. `security@<your-domain>`).

Please include, where possible:

- A description of the vulnerability and its impact.
- Steps to reproduce or a proof-of-concept.
- Affected component/package and version or commit SHA.
- Any suggested remediation.

## Our commitments / SLA targets

- **Acknowledge** your report within **3 business days**.
- Provide an initial **assessment** within **10 business days**.
- Keep you informed about remediation progress.
- Credit you in the advisory (unless you prefer to remain anonymous).
- Coordinate a disclosure timeline with you (target: fix released within **90 days**).

## Scope

In scope:

- Code in this repository (agent core, policy engine, connectors, apps).
- Insecure defaults, missing authorization/approval gates, secret leakage, injection,
  webhook signature bypass, audit-trail tampering.

Out of scope:

- Vulnerabilities in third-party services (report to Stripe/Exa/AWS/Vercel directly).
- Issues requiring physical access or a compromised developer machine.
- Findings only reproducible with non-default, intentionally insecure configuration.

## Security expectations for contributors

- **Never commit secrets.** Secrets are read from the environment; `.env` is gitignored and
  CI runs secret scanning (gitleaks). See [`.env.example`](./.env.example).
- **Never commit real customer data or PII.** Demo/test data must be synthetic.
- **Verify webhook signatures** (Stripe) before processing events.
- **Gate irreversible actions** behind the human approval flow; do not add bypass paths.
- **Apply idempotency, timeouts, retries, and rate limits** to external connector calls.
- **Redact sensitive fields** in logs and decision traces.

See [`AGENTS.md`](./AGENTS.md) and [`docs/threat-model.md`](./docs/threat-model.md) for
more detail.

## Supported versions

While the project is pre-1.0, only the latest `main` (and the most recent tagged release,
once releases begin) receives security fixes.

| Version            | Supported          |
| ------------------ | ------------------ |
| `main` (unreleased)| :white_check_mark: |
| < 0.1              | :x:                |
