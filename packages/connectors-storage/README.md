# @open-revops/connectors-storage

Event store and append-only audit-log adapters.

> **Status: v0.1.** Local persistence behind narrow, typed interfaces: an append-only
> **audit log** and a small **run store**, each with an in-memory default and an optional
> file-backed (JSONL) adapter. Further adapters land per [`ROADMAP.md`](../../ROADMAP.md).

## Purpose

A local persistence layer that the agent loop writes through. The audit log is the
append-only "what happened" record described in
[`docs/decision-trace-spec.md`](../../docs/decision-trace-spec.md); the run store keeps the
latest snapshot of run state. Both are deterministic: callers supply timestamps, and the
modules never read the wall clock or generate randomness (see
[`.claude/rules/20-determinism-and-demo-data.md`](../../.claude/rules/20-determinism-and-demo-data.md)).

## Public interface

Other packages depend on this published interface, not the internals.

```ts
import {
  createInMemoryAuditLog,
  createFileAuditLog,
  createInMemoryRunStore,
  createFileRunStore,
  type AuditRecord,
  type AuditEventType,
  type AuditLog,
  type RunStore,
} from '@open-revops/connectors-storage';
```

### Audit log (append-only)

```ts
interface AuditLog {
  append(record: AuditRecord): Promise<void>;
  byRun(runId: string): Promise<AuditRecord[]>; // append order
  all(): Promise<AuditRecord[]>; // global append order
}

createInMemoryAuditLog(): AuditLog;
createFileAuditLog(filePath: string): AuditLog; // newline-delimited JSON, one record per line
```

`AuditRecord.timestamp` is an ISO-8601 string **supplied by the caller** — the module never
calls `Date.now()`. There is intentionally no update or delete method: history is immutable
(see [`.claude/rules/10-security-and-secrets.md`](../../.claude/rules/10-security-and-secrets.md)).
Keep secrets and PII out of every field; persist stable, non-sensitive ids only.

### Run store (latest snapshot per run)

```ts
interface RunStore<T = unknown> {
  put(runId: string, snapshot: T): Promise<void>; // overwrites latest
  get(runId: string): Promise<T | undefined>;
  all(): Promise<Array<{ runId: string; snapshot: T }>>;
}

createInMemoryRunStore<T>(): RunStore<T>;
createFileRunStore<T>(filePath: string): RunStore<T>;
```

File adapters take their path from the argument (never hardcoded), are safe to construct
repeatedly over an existing file (they never truncate it), and replay their on-disk log on
read so a fresh instance over the same path sees prior writes.

## Scripts

```bash
pnpm --filter @open-revops/connectors-storage test
pnpm --filter @open-revops/connectors-storage typecheck
pnpm --filter @open-revops/connectors-storage build
```

The root commands invoke these via `pnpm -r --if-present`. See
[`CONTRIBUTING.md`](../../CONTRIBUTING.md).
