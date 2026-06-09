# Project rules

Modular, reviewable rules for working in OpenRevOps. They expand on the operating contract
in [`AGENTS.md`](../../AGENTS.md) — if anything here conflicts with `AGENTS.md`, that file
wins.

These are reference material (linked from [`CLAUDE.md`](../../CLAUDE.md)), not auto-loaded
into every session. Read the one relevant to your task.

| File                              | Topic                                                  |
| --------------------------------- | ------------------------------------------------------ |
| `00-scope-and-non-goals.md`       | What's in/out of the MVP; package boundaries.          |
| `10-security-and-secrets.md`      | Secret handling, untrusted input, the approval gate.   |
| `20-determinism-and-demo-data.md` | Synthetic data, fixed seeds, reproducible golden path. |
| `30-testing-and-ci.md`            | TDD expectations and the merge gate.                   |
| `40-connectors-and-actions.md`    | Connector contract: idempotency, webhooks, retries.    |
