import { createRng } from './rng.js';

export interface PricingPlan {
  readonly tier: string;
  readonly ratePerUnitCents: number;
  readonly includedUnits: number;
}

export interface Account {
  readonly accountId: string;
  readonly name: string;
  readonly plan: PricingPlan;
}

export interface UsageEvent {
  readonly eventId: string;
  readonly accountId: string;
  readonly metric: 'api_calls';
  readonly units: number;
  readonly occurredAt: string; // ISO-8601, deterministic (never wall-clock)
}

export interface Scenario {
  readonly scenarioId: string;
  readonly account: Account;
  readonly usageEvents: readonly UsageEvent[];
}

/** Fixed seed for the reproducible golden path. */
export const DEMO_SEED = 42;

const GOLDEN_PLAN: PricingPlan = {
  tier: 'growth',
  ratePerUnitCents: 5,
  includedUnits: 10_000,
};

// Fixed base date — injected, never wall-clock. Usage spans GOLDEN_DAYS from here.
const GOLDEN_BASE_DATE_MS = Date.parse('2026-05-01T00:00:00.000Z');
const DAY_MS = 86_400_000;
const GOLDEN_DAYS = 30;

/**
 * Build the deterministic `golden_path_v1` scenario: one account on a metered
 * plan whose total usage overruns the included units — i.e. recoverable leakage.
 * Same seed → identical accounts, events, and totals on every run.
 */
export function generateGoldenPath(seed: number = DEMO_SEED): Scenario {
  const rng = createRng(seed);
  const accountId = 'acct_demo_001';
  const usageEvents: UsageEvent[] = [];

  for (let day = 0; day < GOLDEN_DAYS; day += 1) {
    // Seeded daily volume ~480–599 calls/day → 30-day total always exceeds 10k included.
    const units = 480 + Math.floor(rng() * 120);
    usageEvents.push({
      eventId: `evt_${String(day + 1).padStart(3, '0')}`,
      accountId,
      metric: 'api_calls',
      units,
      occurredAt: new Date(GOLDEN_BASE_DATE_MS + day * DAY_MS).toISOString(),
    });
  }

  return {
    scenarioId: 'golden_path_v1',
    account: { accountId, name: 'Northwind Synthetics (demo)', plan: GOLDEN_PLAN },
    usageEvents,
  };
}
