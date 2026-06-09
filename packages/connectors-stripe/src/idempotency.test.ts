import { describe, it, expect } from 'vitest';

import { deriveIdempotencyKey } from './idempotency.js';
import { APPLY_CREDIT_ACTION } from './types.js';

describe('deriveIdempotencyKey()', () => {
  it('derives the key from run id + action so retries never double-execute', () => {
    expect(deriveIdempotencyKey('run_123', APPLY_CREDIT_ACTION)).toBe('run_123:apply_credit');
  });

  it('is deterministic — the same inputs always yield the same key', () => {
    const a = deriveIdempotencyKey('run_abc', APPLY_CREDIT_ACTION);
    const b = deriveIdempotencyKey('run_abc', APPLY_CREDIT_ACTION);
    expect(a).toBe(b);
  });

  it('produces distinct keys for distinct runs (no cross-run collision)', () => {
    const first = deriveIdempotencyKey('run_1', APPLY_CREDIT_ACTION);
    const second = deriveIdempotencyKey('run_2', APPLY_CREDIT_ACTION);
    expect(first).not.toBe(second);
  });

  it('rejects an empty run id rather than emitting an unsafe key', () => {
    expect(() => deriveIdempotencyKey('   ', APPLY_CREDIT_ACTION)).toThrow();
  });
});
