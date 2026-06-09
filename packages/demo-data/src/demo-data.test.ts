import { describe, it, expect } from 'vitest';

import { createRng } from './rng.js';
import { generateGoldenPath, DEMO_SEED } from './scenario.js';

describe('createRng()', () => {
  it('produces a deterministic sequence for a given seed', () => {
    const a = createRng(DEMO_SEED);
    const b = createRng(DEMO_SEED);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('produces different first values for different seeds', () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });

  it('stays within the [0, 1) range', () => {
    const r = createRng(7);
    for (let i = 0; i < 200; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('generateGoldenPath()', () => {
  it('is fully deterministic for the same seed', () => {
    expect(generateGoldenPath()).toEqual(generateGoldenPath());
  });

  it('produces the spec golden-path and account ids', () => {
    const s = generateGoldenPath();
    expect(s.scenarioId).toBe('golden_path_v1');
    expect(s.account.accountId).toBe('acct_demo_001');
    expect(s.usageEvents.length).toBeGreaterThan(0);
  });

  it('represents recoverable leakage: total usage exceeds plan included units', () => {
    const s = generateGoldenPath();
    const total = s.usageEvents.reduce((sum, e) => sum + e.units, 0);
    expect(total).toBeGreaterThan(s.account.plan.includedUnits);
  });

  it('uses fixed deterministic ISO timestamps, never wall-clock', () => {
    const a = generateGoldenPath();
    const b = generateGoldenPath();
    expect(a.usageEvents.map((e) => e.occurredAt)).toEqual(b.usageEvents.map((e) => e.occurredAt));
    expect(a.usageEvents[0]?.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
