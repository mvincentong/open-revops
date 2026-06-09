# @open-revops/evals

Replay/evaluation harness scoring agent decisions on fixed scenarios.

> **Status: scaffold.** This package is an intentional placeholder. The directory and
> manifest exist so the workspace resolves and CI is green; implementation lands per
> [`ROADMAP.md`](../../ROADMAP.md).

## Purpose

Replay/evaluation harness scoring agent decisions on fixed scenarios.

## Public interface

_To be defined._ Other packages depend on this package's published interface, not its
internals. Encodes golden-path expected outputs; see .claude/rules/20-determinism-and-demo-data.md.

## Scripts

The standardized scripts (`lint`, `typecheck`, `test`, `build`) are wired in as real
code lands; the root commands invoke them via `pnpm -r --if-present`. See
[`CONTRIBUTING.md`](../../CONTRIBUTING.md).
