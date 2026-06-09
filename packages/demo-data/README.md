# @open-revops/demo-data

Deterministic synthetic accounts and usage events (seeded).

> **Status: scaffold.** This package is an intentional placeholder. The directory and
> manifest exist so the workspace resolves and CI is green; implementation lands per
> [`ROADMAP.md`](../../ROADMAP.md).

## Purpose

Deterministic synthetic accounts and usage events (seeded).

## Public interface

_To be defined._ Other packages depend on this package's published interface, not its
internals. Synthetic only — no PII, no real billing records. Seed via DEMO_SEED.

## Scripts

The standardized scripts (`lint`, `typecheck`, `test`, `build`) are wired in as real
code lands; the root commands invoke them via `pnpm -r --if-present`. See
[`CONTRIBUTING.md`](../../CONTRIBUTING.md).
