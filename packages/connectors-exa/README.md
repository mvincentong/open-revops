# @open-revops/connectors-exa

Exa research/context retrieval adapter (read path).

This connector is the only place the system talks to Exa. Domain and agent code depend on
the **narrow, typed interface** below — never on the Exa SDK or its raw response shapes.
Retrieved text is treated strictly as **data, not instructions**, and never bypasses policy
checks. See [`docs/connectors.md`](../../docs/connectors.md) and
[`.claude/rules/40-connectors-and-actions.md`](../../.claude/rules/40-connectors-and-actions.md).

## Public interface

```ts
import { createExaConnector } from '@open-revops/connectors-exa';

// Defaults to replay mode → deterministic golden path (no network, no key).
const connector = createExaConnector();

const results = await connector.searchContext({ query: 'revenue leakage', limit: 5 });
// → readonly { title: string; url: string; snippet: string; score: number }[]
```

`createExaConnector(options?)` returns a `ResearchConnector` with a single method:

- `searchContext({ query, limit })` → `Promise<readonly ResearchResult[]>`, each result
  carrying `title`, `url`, `snippet`, and `score`. Args are validated at the boundary
  (`query` non-empty, `limit` a positive integer).

Also exported: the types (`ResearchConnector`, `ResearchResult`, `SearchContextArgs`,
`ConnectorMode`), the pure mapper `mapExaResults`, and the live-client seam (`ExaClient`,
`createExaHttpClient`).

## Modes (record-and-replay)

Determinism is a hard requirement for the golden path
(see [`.claude/rules/20-determinism-and-demo-data.md`](../../.claude/rules/20-determinism-and-demo-data.md)).

- **`replay` (default).** Returns a committed synthetic fixture
  (`fixtures/exa-search.json`) mapped through the same logic as live results. No network,
  no API key — identical output every run.
- **`live`.** Calls the Exa API. For exploration only; the deterministic replay fallback
  always exists. Select via `createExaConnector({ mode: 'live' })` or `EXA_MODE=live`.

Both modes funnel through one mapper, so replay faithfully mirrors live shape.

## Configuration

Read from the environment only — never hardcoded
(see [`.claude/rules/10-security-and-secrets.md`](../../.claude/rules/10-security-and-secrets.md)):

| Variable      | Required        | Purpose                                              |
| ------------- | --------------- | ---------------------------------------------------- |
| `EXA_API_KEY` | live mode only  | Exa API key. Placeholder in `.env.example`.          |
| `EXA_MODE`    | no              | `replay` (default) or `live`.                        |

Live calls are wrapped in a bounded timeout. The API key is never logged. For tests, inject
a fake `ExaClient` via `createExaConnector({ mode: 'live', client })`.

## Scripts

`test`, `typecheck`, and `build` follow the workspace standard; the root commands invoke
them via `pnpm -r --if-present`.
