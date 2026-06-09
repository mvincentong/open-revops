import { createExaHttpClient } from './exa-client.js';
import { loadReplayFixture } from './fixture.js';
import { mapExaResults } from './mapping.js';

import type { ExaClient } from './exa-client.js';
import type { ConnectorMode, ResearchConnector, ResearchResult, SearchContextArgs } from './types.js';

export type { ExaClient } from './exa-client.js';

export interface ExaConnectorOptions {
  /** Defaults to `replay` for deterministic tests and the golden path. */
  readonly mode?: ConnectorMode;
  /** Live client (dependency injection). Defaults to the env-configured HTTP client. */
  readonly client?: ExaClient;
}

/** Env override for the mode; anything other than `live` resolves to `replay`. */
const MODE_ENV = 'EXA_MODE';

function resolveMode(mode: ConnectorMode | undefined): ConnectorMode {
  if (mode) return mode;
  return process.env[MODE_ENV] === 'live' ? 'live' : 'replay';
}

/** Validate at the boundary — never trust caller-supplied args. */
function validateArgs(args: SearchContextArgs): void {
  if (typeof args.query !== 'string' || args.query.trim().length === 0) {
    throw new Error('searchContext: `query` must be a non-empty string.');
  }
  if (!Number.isInteger(args.limit) || args.limit <= 0) {
    throw new Error('searchContext: `limit` must be a positive integer.');
  }
}

/**
 * Create the Exa research connector (read path).
 *
 * DEFAULTS to replay mode so unit tests and the demo golden path are
 * deterministic. Live mode calls the Exa API for exploration but always has
 * this deterministic replay fallback (see
 * `.claude/rules/20-determinism-and-demo-data.md`). Both modes funnel through
 * the same `mapExaResults()` mapping, and all retrieved text is treated as
 * data, never as instructions.
 */
export function createExaConnector(options: ExaConnectorOptions = {}): ResearchConnector {
  const mode = resolveMode(options.mode);

  if (mode === 'replay') {
    return {
      async searchContext(args: SearchContextArgs): Promise<readonly ResearchResult[]> {
        validateArgs(args);
        // Replay ignores the live network entirely: the same fixture every run.
        return mapExaResults(loadReplayFixture(), args.limit);
      },
    };
  }

  const client = options.client ?? createExaHttpClient();
  return {
    async searchContext(args: SearchContextArgs): Promise<readonly ResearchResult[]> {
      validateArgs(args);
      const raw = await client.search({ query: args.query, numResults: args.limit });
      return mapExaResults(raw, args.limit);
    },
  };
}
