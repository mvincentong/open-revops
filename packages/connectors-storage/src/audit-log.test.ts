import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createFileAuditLog,
  createInMemoryAuditLog,
  type AuditLog,
  type AuditRecord,
} from './audit-log.js';

/**
 * Build an AuditRecord with a caller-supplied (fixed) timestamp. The store must
 * never invent timestamps, so tests always pass them in explicitly.
 */
function record(overrides: Partial<AuditRecord> & Pick<AuditRecord, 'runId'>): AuditRecord {
  return {
    timestamp: '2026-06-09T12:00:00.000Z',
    eventType: 'run_started',
    actor: 'demo_operator',
    ...overrides,
  };
}

// A shared contract suite so the in-memory and file adapters prove identical behavior.
function auditLogContract(name: string, makeLog: () => Promise<AuditLog> | AuditLog): void {
  describe(name, () => {
    it('append → byRun returns that run\'s records in append order', async () => {
      const log = await makeLog();
      const first = record({ runId: 'run_001', eventType: 'run_started' });
      const second = record({
        runId: 'run_001',
        eventType: 'recommendation_made',
        timestamp: '2026-06-09T12:00:01.000Z',
      });

      await log.append(first);
      await log.append(second);

      const records = await log.byRun('run_001');
      expect(records).toEqual([first, second]);
    });

    it('is append-only: earlier records are unchanged after later appends', async () => {
      const log = await makeLog();
      const first = record({ runId: 'run_001', eventType: 'run_started' });
      await log.append(first);

      const afterFirst = await log.byRun('run_001');
      expect(afterFirst).toEqual([first]);

      await log.append(
        record({
          runId: 'run_001',
          eventType: 'action_executed',
          timestamp: '2026-06-09T12:00:05.000Z',
        }),
      );

      const afterSecond = await log.byRun('run_001');
      // The first record is byte-for-byte identical; appends never rewrite history.
      expect(afterSecond[0]).toEqual(first);
      expect(afterSecond).toHaveLength(2);
    });

    it('all() preserves global append order across runs', async () => {
      const log = await makeLog();
      const a = record({ runId: 'run_a', eventType: 'run_started' });
      const b = record({ runId: 'run_b', eventType: 'run_started' });
      const c = record({ runId: 'run_a', eventType: 'recommendation_made' });

      await log.append(a);
      await log.append(b);
      await log.append(c);

      expect(await log.all()).toEqual([a, b, c]);
    });

    it('byRun isolates records across multiple runIds', async () => {
      const log = await makeLog();
      const a1 = record({ runId: 'run_a', eventType: 'run_started' });
      const b1 = record({ runId: 'run_b', eventType: 'run_started' });
      const a2 = record({ runId: 'run_a', eventType: 'approval_requested' });

      await log.append(a1);
      await log.append(b1);
      await log.append(a2);

      expect(await log.byRun('run_a')).toEqual([a1, a2]);
      expect(await log.byRun('run_b')).toEqual([b1]);
      expect(await log.byRun('run_unknown')).toEqual([]);
    });

    it('does not retroactively change stored records when the caller mutates the input', async () => {
      const log = await makeLog();
      const mutable = record({ runId: 'run_001', detail: { note: 'original' } });
      await log.append(mutable);

      // Mutating the caller's object after append must not corrupt the store.
      mutable.actor = 'tampered';
      (mutable.detail as Record<string, unknown>).note = 'tampered';

      const [stored] = await log.byRun('run_001');
      expect(stored?.actor).toBe('demo_operator');
      expect(stored?.detail).toEqual({ note: 'original' });
    });
  });
}

auditLogContract('createInMemoryAuditLog', () => createInMemoryAuditLog());

describe('createFileAuditLog', () => {
  let dir: string;
  let filePath: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'orevops-audit-'));
    filePath = join(dir, 'audit.jsonl');
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  // Run the shared contract against a fresh file per test.
  auditLogContract('file adapter contract', () => createFileAuditLog(filePath));

  it('persists across instances: a fresh log over the same file reads prior records', async () => {
    const writer = createFileAuditLog(filePath);
    const first = record({ runId: 'run_001', eventType: 'run_started' });
    const second = record({
      runId: 'run_001',
      eventType: 'action_executed',
      timestamp: '2026-06-09T12:00:02.000Z',
      result: 'success',
    });
    await writer.append(first);
    await writer.append(second);

    // A brand-new instance pointed at the same file must replay prior records.
    const reader = createFileAuditLog(filePath);
    expect(await reader.byRun('run_001')).toEqual([first, second]);
    expect(await reader.all()).toEqual([first, second]);
  });

  it('writes newline-delimited JSON, one record per line', async () => {
    const log = createFileAuditLog(filePath);
    await log.append(record({ runId: 'run_001', eventType: 'run_started' }));
    await log.append(record({ runId: 'run_001', eventType: 'action_failed' }));

    const raw = await readFile(filePath, 'utf8');
    const lines = raw.split('\n').filter((line) => line.length > 0);
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      expect(() => JSON.parse(line) as unknown).not.toThrow();
    }
  });

  it('is safe to construct repeatedly without wiping existing history (idempotent reset)', async () => {
    const a = createFileAuditLog(filePath);
    await a.append(record({ runId: 'run_001', eventType: 'run_started' }));

    // Constructing a second adapter over the same path must not truncate the file.
    const b = createFileAuditLog(filePath);
    expect(await b.all()).toHaveLength(1);
    await b.append(record({ runId: 'run_001', eventType: 'recommendation_made' }));
    expect(await b.all()).toHaveLength(2);
  });
});
