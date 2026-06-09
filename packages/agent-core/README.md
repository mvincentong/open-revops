# @open-revops/agent-core

Planning, decision policy, and the execution graph for the agent loop.

> **Status: scaffold.** This package is an intentional placeholder. The directory and
> manifest exist so the workspace resolves and CI is green; implementation lands per
> [`ROADMAP.md`](../../ROADMAP.md).

## Purpose

Planning, decision policy, and the execution graph for the agent loop.

## Public interface

_To be defined._ Other packages depend on this package's published interface, not its
internals. Decision/policy logic must have unit tests (.claude/rules/30-testing-and-ci.md).

## Scripts

The standardized scripts (`lint`, `typecheck`, `test`, `build`) are wired in as real
code lands; the root commands invoke them via `pnpm -r --if-present`. See
[`CONTRIBUTING.md`](../../CONTRIBUTING.md).
