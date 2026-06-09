/**
 * Clock — the single source of "now" for the service, injected so the golden path
 * stays deterministic (.claude/rules/20-determinism-and-demo-data.md). The audit
 * log and connectors never read the wall clock themselves; they take the timestamp
 * this clock produces.
 */

/** A source of ISO-8601 timestamps. */
export interface Clock {
  /** Returns the current time as an ISO-8601 UTC string. */
  now(): string;
}

/** A clock frozen at a single instant — every `now()` returns the same timestamp. */
export function createFixedClock(iso: string): Clock {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    throw new Error(`createFixedClock: invalid ISO-8601 timestamp "${iso}"`);
  }
  const normalized = new Date(ms).toISOString();
  return {
    now: () => normalized,
  };
}

/**
 * A deterministic monotonic clock: the first `now()` returns `startIso`, and each
 * subsequent call advances by `stepMs`. Useful for ordered, reproducible audit
 * timestamps without touching the wall clock.
 */
export function createSteppingClock(startIso: string, stepMs: number): Clock {
  const start = Date.parse(startIso);
  if (Number.isNaN(start)) {
    throw new Error(`createSteppingClock: invalid ISO-8601 timestamp "${startIso}"`);
  }
  if (!Number.isFinite(stepMs) || stepMs < 0) {
    throw new Error('createSteppingClock: stepMs must be a non-negative finite number');
  }
  let current = start;
  return {
    now(): string {
      const iso = new Date(current).toISOString();
      current += stepMs;
      return iso;
    },
  };
}

/**
 * The default clock for a running server: deterministic and monotonic, seeded from
 * a fixed base so audit timestamps are ordered and reproducible across restarts.
 * Tests inject their own clock.
 */
export function createDefaultClock(): Clock {
  return createSteppingClock('2026-06-09T12:34:50.000Z', 1000);
}
