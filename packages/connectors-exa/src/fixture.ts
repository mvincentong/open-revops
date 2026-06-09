import { readFileSync } from 'node:fs';

import type { RawExaResponse } from './mapping.js';

/**
 * Location of the committed, synthetic Exa response used by replay mode.
 *
 * The file is a RECORDED (synthetic) vendor payload — record-and-replay keeps
 * the golden path deterministic (see `.claude/rules/20-determinism-and-demo-data.md`).
 * Resolved relative to this module so it works from both `src/` (tests, run by
 * vitest) and the built `dist/` output, which both sit one level below the
 * package root that holds `fixtures/`.
 */
const FIXTURE_URL = new URL('../fixtures/exa-search.json', import.meta.url);

/**
 * Load and parse the replay fixture. Returns the raw vendor shape; callers map
 * it through `mapExaResults()` exactly as live results are mapped, so replay
 * and live share one code path. Reading from disk each call keeps the result
 * a fresh, deterministic copy with no shared mutable cache.
 */
export function loadReplayFixture(): RawExaResponse {
  const contents = readFileSync(FIXTURE_URL, 'utf8');
  return JSON.parse(contents) as RawExaResponse;
}
