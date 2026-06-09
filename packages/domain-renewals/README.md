# @open-revops/domain-renewals

Renewal-negotiation domain logic.

> **Status: scaffold.** This package is an intentional placeholder. The directory and
> manifest exist so the workspace resolves and CI is green; implementation lands per
> [`ROADMAP.md`](../../ROADMAP.md).

## Purpose

Renewal-negotiation domain logic.

## Public interface

_To be defined._ Other packages depend on this package's published interface, not its
internals. Keep side effects in connectors; domain logic stays pure and testable.

## Scripts

The standardized scripts (`lint`, `typecheck`, `test`, `build`) are wired in as real
code lands; the root commands invoke them via `pnpm -r --if-present`. See
[`CONTRIBUTING.md`](../../CONTRIBUTING.md).
