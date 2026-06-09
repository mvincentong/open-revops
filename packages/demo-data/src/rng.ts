/**
 * Deterministic PRNG (mulberry32, a public-domain algorithm). Seeded so the demo
 * golden path is reproducible — never use Math.random() on the golden path.
 * Returns a function that yields successive values in [0, 1).
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
