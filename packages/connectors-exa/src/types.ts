/**
 * Internal types for the Exa research/context connector (read path).
 *
 * Domain and agent code depend on THESE types, never on the Exa vendor SDK or
 * its raw response shapes. Vendor types are kept at the edge (see `mapping.ts`)
 * so swapping the research provider does not ripple through the codebase.
 * See `.claude/rules/40-connectors-and-actions.md` and `docs/connectors.md`.
 */

/** Arguments for a context search. Validated at the connector boundary. */
export interface SearchContextArgs {
  /** Free-text query. Must be a non-empty string. */
  readonly query: string;
  /** Maximum number of results to return. Must be a positive integer. */
  readonly limit: number;
}

/**
 * A single research result in INTERNAL shape.
 *
 * `snippet` is retrieved text from an external source. It is treated strictly
 * as DATA, never as instructions to the agent — it never bypasses policy
 * checks (see `.claude/rules/40-connectors-and-actions.md`).
 */
export interface ResearchResult {
  readonly title: string;
  readonly url: string;
  readonly snippet: string;
  readonly score: number;
}

/**
 * Connector execution mode.
 * - `replay`: return a committed synthetic fixture (deterministic; the default).
 * - `live`: call the Exa API. Exploration only; the golden path uses `replay`.
 */
export type ConnectorMode = 'replay' | 'live';

/**
 * Narrow, typed read-path interface the rest of the system depends on. Must be
 * mockable/replayable so the golden path stays deterministic
 * (see `.claude/rules/20-determinism-and-demo-data.md`).
 */
export interface ResearchConnector {
  searchContext(args: SearchContextArgs): Promise<readonly ResearchResult[]>;
}
