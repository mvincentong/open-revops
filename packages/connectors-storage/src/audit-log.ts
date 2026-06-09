/**
 * Append-only audit log — the "what happened" half of the audit trail described in
 * docs/decision-trace-spec.md. Records are appended, never edited or deleted (see
 * .claude/rules/10-security-and-secrets.md). Callers supply the timestamp; this module
 * never reads the wall clock, so the golden path stays deterministic
 * (.claude/rules/20-determinism-and-demo-data.md).
 */

import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/** The lifecycle events of one agent run, in the order they typically occur. */
export type AuditEventType =
  | 'run_started'
  | 'recommendation_made'
  | 'approval_requested'
  | 'approval_recorded'
  | 'action_executed'
  | 'action_failed';

/**
 * One append-only audit entry. `timestamp` is an ISO-8601 string supplied BY THE CALLER —
 * this module never calls `Date.now()` or `new Date()`. Keep secrets and PII out of every
 * field; persist stable, non-sensitive ids only.
 */
export interface AuditRecord {
  /** ISO-8601 timestamp, supplied by the caller (never generated here). */
  timestamp: string;
  runId: string;
  eventType: AuditEventType;
  actor: string;
  connector?: string;
  idempotencyKey?: string;
  result?: string;
  detail?: Record<string, unknown>;
}

/**
 * Append-only audit log. There is intentionally NO update or delete method — history is
 * immutable. Reads return records in append order.
 */
export interface AuditLog {
  append(record: AuditRecord): Promise<void>;
  /** Records for one run, in append order. Unknown runIds yield an empty array. */
  byRun(runId: string): Promise<AuditRecord[]>;
  /** Every record, in global append order. */
  all(): Promise<AuditRecord[]>;
}

/**
 * In-memory append-only audit log. Records are deep-cloned on the way in and on the way
 * out, so a caller mutating an object before/after a call can never corrupt stored history.
 */
export function createInMemoryAuditLog(): AuditLog {
  const records: AuditRecord[] = [];

  return {
    async append(record: AuditRecord): Promise<void> {
      records.push(structuredClone(record));
    },
    async byRun(runId: string): Promise<AuditRecord[]> {
      return records.filter((record) => record.runId === runId).map((record) => structuredClone(record));
    },
    async all(): Promise<AuditRecord[]> {
      return records.map((record) => structuredClone(record));
    },
  };
}

/**
 * File-backed append-only audit log. The format is newline-delimited JSON (one
 * `AuditRecord` per line) at `filePath`. Constructing an adapter never truncates the file,
 * so it is safe to create repeatedly over an existing log (idempotent reset). Append order
 * on disk is the source of truth for read order.
 */
export function createFileAuditLog(filePath: string): AuditLog {
  async function readAll(): Promise<AuditRecord[]> {
    let raw: string;
    try {
      raw = await readFile(filePath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
    return raw
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as AuditRecord);
  }

  return {
    async append(record: AuditRecord): Promise<void> {
      await mkdir(dirname(filePath), { recursive: true });
      await appendFile(filePath, `${JSON.stringify(record)}\n`, 'utf8');
    },
    async byRun(runId: string): Promise<AuditRecord[]> {
      const records = await readAll();
      return records.filter((record) => record.runId === runId);
    },
    async all(): Promise<AuditRecord[]> {
      return readAll();
    },
  };
}
