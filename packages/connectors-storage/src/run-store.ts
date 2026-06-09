/**
 * Run store — a small "latest snapshot per run" key/value store for agent run state. Unlike
 * the audit log it is NOT append-only at the API level: `put` overwrites the latest snapshot
 * for a run. The file adapter still persists as an append log and replays it last-write-wins,
 * which keeps writes durable without read-modify-write rewrites.
 */

import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/** Latest-snapshot-per-run store. `T` is the caller's run-state shape. */
export interface RunStore<T = unknown> {
  /** Store the latest snapshot for a run, overwriting any previous snapshot. */
  put(runId: string, snapshot: T): Promise<void>;
  /** The latest snapshot for a run, or `undefined` if the run is unknown. */
  get(runId: string): Promise<T | undefined>;
  /** The latest snapshot for every run, in first-seen order. */
  all(): Promise<Array<{ runId: string; snapshot: T }>>;
}

function toEntries<T>(map: Map<string, T>): Array<{ runId: string; snapshot: T }> {
  return [...map.entries()].map(([runId, snapshot]) => ({ runId, snapshot }));
}

/**
 * In-memory run store. Snapshots are deep-cloned in and out so a caller mutating an object
 * before/after a call can never alter stored state.
 */
export function createInMemoryRunStore<T = unknown>(): RunStore<T> {
  const snapshots = new Map<string, T>();

  return {
    async put(runId: string, snapshot: T): Promise<void> {
      snapshots.set(runId, structuredClone(snapshot));
    },
    async get(runId: string): Promise<T | undefined> {
      const snapshot = snapshots.get(runId);
      return snapshot === undefined ? undefined : structuredClone(snapshot);
    },
    async all(): Promise<Array<{ runId: string; snapshot: T }>> {
      return toEntries(snapshots).map(({ runId, snapshot }) => ({
        runId,
        snapshot: structuredClone(snapshot),
      }));
    },
  };
}

/**
 * File-backed run store. Each `put` appends one JSON line (`{ runId, snapshot }`) to
 * `filePath`; reads replay the log into a map where later writes overwrite earlier ones
 * (last-write-wins). The map preserves the first-seen insertion order of each run.
 * Constructing an adapter never truncates the file, so it is safe to create repeatedly.
 */
export function createFileRunStore<T = unknown>(filePath: string): RunStore<T> {
  async function replay(): Promise<Map<string, T>> {
    const snapshots = new Map<string, T>();
    let raw: string;
    try {
      raw = await readFile(filePath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return snapshots;
      }
      throw error;
    }
    for (const line of raw.split('\n')) {
      if (line.length === 0) {
        continue;
      }
      const entry = JSON.parse(line) as { runId: string; snapshot: T };
      snapshots.set(entry.runId, entry.snapshot);
    }
    return snapshots;
  }

  return {
    async put(runId: string, snapshot: T): Promise<void> {
      await mkdir(dirname(filePath), { recursive: true });
      await appendFile(filePath, `${JSON.stringify({ runId, snapshot })}\n`, 'utf8');
    },
    async get(runId: string): Promise<T | undefined> {
      const snapshots = await replay();
      return snapshots.get(runId);
    },
    async all(): Promise<Array<{ runId: string; snapshot: T }>> {
      return toEntries(await replay());
    },
  };
}
