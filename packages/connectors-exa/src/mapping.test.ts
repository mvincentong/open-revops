import { describe, it, expect } from 'vitest';

import { mapExaResults, type RawExaResponse } from './mapping.js';

describe('mapExaResults — vendor Exa response → internal types', () => {
  it('maps a vendor result into a ResearchResult (title/url/snippet/score)', () => {
    const raw: RawExaResponse = {
      results: [
        {
          title: 'Usage-based pricing 101',
          url: 'https://example.test/a',
          score: 0.91,
          text: '  Outcome based   billing\n explained. ',
        },
      ],
    };

    expect(mapExaResults(raw, 10)).toEqual([
      {
        title: 'Usage-based pricing 101',
        url: 'https://example.test/a',
        snippet: 'Outcome based billing explained.',
        score: 0.91,
      },
    ]);
  });

  it('prefers the first highlight over the full text for the snippet', () => {
    const raw: RawExaResponse = {
      results: [{ title: 't', url: 'https://u.test', score: 0.5, text: 'long body', highlights: ['key highlight'] }],
    };

    const [r] = mapExaResults(raw, 10);
    expect(r?.snippet).toBe('key highlight');
  });

  it('defaults a missing score to 0 and a missing title to the url', () => {
    const raw: RawExaResponse = { results: [{ url: 'https://example.test/x' }] };

    expect(mapExaResults(raw, 10)).toEqual([
      { title: 'https://example.test/x', url: 'https://example.test/x', snippet: '', score: 0 },
    ]);
  });

  it('respects the limit by slicing results', () => {
    const raw: RawExaResponse = {
      results: [{ url: 'https://a.test' }, { url: 'https://b.test' }, { url: 'https://c.test' }],
    };

    expect(mapExaResults(raw, 2)).toHaveLength(2);
  });

  it('treats untrusted/garbage input as data and never throws (returns [])', () => {
    expect(mapExaResults({} as RawExaResponse, 5)).toEqual([]);
    expect(mapExaResults({ results: 'nope' } as unknown as RawExaResponse, 5)).toEqual([]);
    expect(mapExaResults(null as unknown as RawExaResponse, 5)).toEqual([]);
  });

  it('drops non-object result entries instead of trusting them', () => {
    const raw = { results: [null, 42, 'x', { url: 'https://ok.test' }] } as unknown as RawExaResponse;

    expect(mapExaResults(raw, 10)).toEqual([
      { title: 'https://ok.test', url: 'https://ok.test', snippet: '', score: 0 },
    ]);
  });

  it('ignores a non-finite score and falls back to 0', () => {
    const raw = {
      results: [{ url: 'https://n.test', score: Number.POSITIVE_INFINITY }],
    } as unknown as RawExaResponse;

    expect(mapExaResults(raw, 10)[0]?.score).toBe(0);
  });
});
