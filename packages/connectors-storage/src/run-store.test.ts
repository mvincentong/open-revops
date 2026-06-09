import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createFileRunStore,
  createInMemoryRunStore,
  type RunStore,
} from './run-store.js';

interface RunSnapshot {
  status: string;
  step: number;
}

// Shared contract so the in-memory and file adapters prove identical behavior.
function runStoreContract(
  name: string,
  makeStore: () => Promise<RunStore<RunSnapshot>> | RunStore<RunSnapshot>,
): void {
  describe(name, () => {
    it('put then get returns the stored snapshot', async () => {
      const store = await makeStore();
      await store.put('run_001', { status: 'needs_approval', step: 1 });
      expect(await store.get('run_001')).toEqual({ status: 'needs_approval', step: 1 });
    });

    it('get returns undefined for an unknown runId', async () => {
      const store = await makeStore();
      expect(await store.get('missing')).toBeUndefined();
    });

    it('put overwrites the latest snapshot for a runId', async () => {
      const store = await makeStore();
      await store.put('run_001', { status: 'needs_approval', step: 1 });
      await store.put('run_001', { status: 'approved', step: 2 });

      expect(await store.get('run_001')).toEqual({ status: 'approved', step: 2 });
      // Only the latest snapshot is exposed — one entry per runId.
      const all = await store.all();
      expect(all).toHaveLength(1);
      expect(all[0]).toEqual({ runId: 'run_001', snapshot: { status: 'approved', step: 2 } });
    });

    it('all() returns the latest snapshot per runId in first-seen order', async () => {
      const store = await makeStore();
      await store.put('run_a', { status: 'started', step: 1 });
      await store.put('run_b', { status: 'started', step: 1 });
      await store.put('run_a', { status: 'approved', step: 2 });

      expect(await store.all()).toEqual([
        { runId: 'run_a', snapshot: { status: 'approved', step: 2 } },
        { runId: 'run_b', snapshot: { status: 'started', step: 1 } },
      ]);
    });

    it('does not retroactively change a stored snapshot when the caller mutates the input', async () => {
      const store = await makeStore();
      const snapshot: RunSnapshot = { status: 'started', step: 1 };
      await store.put('run_001', snapshot);

      snapshot.status = 'tampered';
      snapshot.step = 99;

      expect(await store.get('run_001')).toEqual({ status: 'started', step: 1 });
    });
  });
}

runStoreContract('createInMemoryRunStore', () => createInMemoryRunStore<RunSnapshot>());

describe('createFileRunStore', () => {
  let dir: string;
  let filePath: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'orevops-run-'));
    filePath = join(dir, 'runs.jsonl');
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  runStoreContract('file adapter contract', () => createFileRunStore<RunSnapshot>(filePath));

  it('persists across instances: a fresh store over the same file reads prior snapshots', async () => {
    const writer = createFileRunStore<RunSnapshot>(filePath);
    await writer.put('run_001', { status: 'needs_approval', step: 1 });
    await writer.put('run_001', { status: 'approved', step: 2 });

    const reader = createFileRunStore<RunSnapshot>(filePath);
    expect(await reader.get('run_001')).toEqual({ status: 'approved', step: 2 });
    expect(await reader.all()).toEqual([
      { runId: 'run_001', snapshot: { status: 'approved', step: 2 } },
    ]);
  });

  it('is safe to construct repeatedly without wiping existing state (idempotent reset)', async () => {
    const a = createFileRunStore<RunSnapshot>(filePath);
    await a.put('run_001', { status: 'started', step: 1 });

    const b = createFileRunStore<RunSnapshot>(filePath);
    expect(await b.get('run_001')).toEqual({ status: 'started', step: 1 });
  });
});
