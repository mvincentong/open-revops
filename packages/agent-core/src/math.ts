/** Deterministic numeric helpers used by the detection heuristic. */

/** Round to two decimal places. Keeps reported scores stable and trace-friendly. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Clamp `value` into the inclusive range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
