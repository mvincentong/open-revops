# Support

Thanks for using OpenRevOps! This page explains where to get help and what to expect.

## Before you ask

1. Read the [`README`](./README.md) — problem, architecture, and quickstart.
2. Skim the [`docs/`](./docs) folder — architecture, policy rules, connectors, deployment,
   and the demo script.
3. Search [existing issues](https://github.com/mvincentong/open-revops/issues) and
   [discussions](https://github.com/mvincentong/open-revops/discussions) — your question may
   already be answered.

## Where to ask

| I want to…                          | Use                                                        |
| ----------------------------------- | ---------------------------------------------------------- |
| Ask a question / share an idea      | **GitHub Discussions**                                     |
| Report a reproducible bug           | **GitHub Issues** → _Bug report_                           |
| Request a feature                   | **GitHub Issues** → _Feature request_                      |
| Report a security vulnerability     | **Do not open an issue** — see [`SECURITY.md`](./SECURITY.md) |
| Propose a large change              | Open a **Discussion** first, then a PR                     |

Please do not use the issue tracker for general questions — Discussions keeps the tracker
focused on actionable work.

## What to include in a bug report

Good reports get resolved faster. Include:

- What you expected to happen and what actually happened.
- Exact steps to reproduce (commands, scenario id, inputs — synthetic only).
- Versions: OS, Node (`node -v`), pnpm (`pnpm -v`), and the commit SHA.
- Relevant logs or a decision trace — **with secrets and any PII redacted**.

The issue templates under `.github/ISSUE_TEMPLATE/` will prompt you for most of this.

## Response expectations

This is a community-driven open-source project maintained on a best-effort basis. There is
no commercial support SLA. Maintainers triage issues and discussions as time allows;
well-scoped reports and pull requests with tests get attention first. Security reports
follow the timelines in [`SECURITY.md`](./SECURITY.md).

## Contributing back

The best way to get a fix or feature is often to contribute it. See
[`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`AGENTS.md`](./AGENTS.md) to get started, and
look for issues labeled `good first issue` or `help wanted`.
