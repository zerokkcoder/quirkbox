const UINT32_RANGE = 0x100000000;

/**
 * Uniform integer in [0, max) from the Web Crypto CSPRNG.
 *
 * Rejection sampling, not modulo: 7776 and 94 are not powers of two, so a bare
 * `value % max` would bias the first values. There is deliberately no fallback
 * to Math.random() — the trust model of this tool depends on a real CSPRNG, so
 * a missing crypto API should fail loudly instead of silently weakening.
 */
export function randomIndex(max: number): number {
  if (!Number.isInteger(max) || max < 1 || max > UINT32_RANGE) {
    throw new RangeError("max must be an integer between 1 and 2^32");
  }

  const limit = Math.floor(UINT32_RANGE / max) * max;
  const buffer = new Uint32Array(1);
  let value = 0;

  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);

  return value % max;
}

export function pickRandom<T>(items: readonly T[]): T {
  if (items.length === 0) {
    throw new RangeError("cannot pick from an empty list");
  }
  return items[randomIndex(items.length)];
}

export function shuffle<T>(items: readonly T[]): T[] {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    const swap = next[i];
    next[i] = next[j];
    next[j] = swap;
  }
  return next;
}
