import type { ResearchResult } from './types.js';

/**
 * Vendor (Exa) response shapes — kept at the edge. These describe the raw,
 * UNTRUSTED payload returned by the Exa API or replayed from a fixture. They
 * are intentionally permissive (`unknown` fields); `mapExaResults()` narrows
 * them into internal types and tolerates malformed data without throwing.
 */
export interface RawExaResult {
  readonly title?: unknown;
  readonly url?: unknown;
  readonly score?: unknown;
  readonly text?: unknown;
  readonly summary?: unknown;
  readonly highlights?: unknown;
}

export interface RawExaResponse {
  readonly results?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const asNonEmptyString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const asFiniteNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

/**
 * Collapse runs of whitespace and trim. Snippets are retrieved text, treated
 * as inert data — normalization never interprets or executes the content.
 */
const normalizeText = (value: string): string => value.replace(/\s+/g, ' ').trim();

const firstHighlight = (value: unknown): string | undefined => {
  if (!Array.isArray(value)) return undefined;
  return value.find((h): h is string => typeof h === 'string' && h.length > 0);
};

/** Map one untrusted vendor result into an internal `ResearchResult`. */
function mapResult(raw: Record<string, unknown>): ResearchResult {
  const url = asNonEmptyString(raw.url) ?? '';
  const title = asNonEmptyString(raw.title) ?? url;
  const rawSnippet =
    firstHighlight(raw.highlights) ?? asNonEmptyString(raw.summary) ?? asNonEmptyString(raw.text) ?? '';

  return {
    title,
    url,
    snippet: normalizeText(rawSnippet),
    score: asFiniteNumber(raw.score) ?? 0,
  };
}

/**
 * Map a full vendor Exa response into internal results, sliced to `limit`.
 *
 * Pure and total: never throws on malformed input. Unknown shapes yield an
 * empty list and non-object entries are dropped, so untrusted upstream data
 * cannot crash the read path. Callers treat all output strictly as data.
 */
export function mapExaResults(raw: RawExaResponse, limit: number): ResearchResult[] {
  if (!isRecord(raw) || !Array.isArray(raw.results)) return [];

  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 0;

  return raw.results.filter(isRecord).slice(0, safeLimit).map(mapResult);
}
