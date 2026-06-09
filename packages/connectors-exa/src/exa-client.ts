import type { RawExaResponse } from './mapping.js';

/** A search request to the Exa API, in vendor terms. */
export interface ExaSearchRequest {
  readonly query: string;
  readonly numResults: number;
}

/**
 * Minimal seam over the Exa HTTP API. Injecting this interface lets tests
 * supply a fake client and keeps vendor/`fetch` details at the edge. The
 * returned payload is UNTRUSTED and must be narrowed via `mapExaResults()`
 * before any use.
 */
export interface ExaClient {
  search(request: ExaSearchRequest): Promise<RawExaResponse>;
}

export interface ExaHttpClientConfig {
  /** Base URL of the Exa API. */
  readonly baseUrl?: string;
  /** Per-request timeout in milliseconds. */
  readonly timeoutMs?: number;
  /** Injectable `fetch` implementation (defaults to the global). Eases testing. */
  readonly fetch?: typeof fetch;
}

const DEFAULT_BASE_URL = 'https://api.exa.ai';
const DEFAULT_TIMEOUT_MS = 10_000;
const EXA_API_KEY_ENV = 'EXA_API_KEY';

/**
 * Default live Exa client.
 *
 * Reads the API key from the environment ONLY — never hardcoded
 * (see `.claude/rules/10-security-and-secrets.md`) — and wraps the call in a
 * bounded timeout. The key is never logged. Live mode is for exploration; the
 * deterministic golden path uses replay mode.
 */
export function createExaHttpClient(config: ExaHttpClientConfig = {}): ExaClient {
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = config.fetch ?? globalThis.fetch;

  return {
    async search(request: ExaSearchRequest): Promise<RawExaResponse> {
      const apiKey = process.env[EXA_API_KEY_ENV];
      if (!apiKey) {
        throw new Error(
          `${EXA_API_KEY_ENV} is not set. Live Exa mode requires it; use replay mode (the default) for the deterministic golden path.`,
        );
      }
      if (typeof fetchImpl !== 'function') {
        throw new Error('No fetch implementation is available for the Exa client.');
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(`${baseUrl}/search`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            query: request.query,
            numResults: request.numResults,
            contents: { text: true, highlights: true },
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          // Do not echo headers/body — they may carry sensitive context.
          throw new Error(`Exa search request failed with status ${response.status}.`);
        }

        return (await response.json()) as RawExaResponse;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
