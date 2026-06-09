# @open-revops/policy-engine

Guardrails, approval gates, confidence thresholds, and the kill-switch.

> **Status: scaffold.** This package is an intentional placeholder. The directory and
> manifest exist so the workspace resolves and CI is green; implementation lands per
> [`ROADMAP.md`](../../ROADMAP.md).

## Purpose

Guardrails, approval gates, confidence thresholds, and the kill-switch.

## Public interface

_To be defined._ Other packages depend on this package's published interface, not its
internals. Contract: docs/policy-rules.md. Never add approval-bypass paths.

## Scripts

The standardized scripts (`lint`, `typecheck`, `test`, `build`) are wired in as real
code lands; the root commands invoke them via `pnpm -r --if-present`. See
[`CONTRIBUTING.md`](../../CONTRIBUTING.md).
