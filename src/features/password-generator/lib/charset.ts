export const charPools = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
} as const;

export type CharPoolId = keyof typeof charPools;

/** Characters that look alike when hand-typed: zero/O, one/l/I. */
export const ambiguousChars = "0O1lI";

export type CharsetInput = {
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  customCharset: string;
};

function dedupe(value: string): string {
  return Array.from(new Set(value)).join("");
}

function stripAmbiguous(pool: string): string {
  return Array.from(pool)
    .filter((char) => !ambiguousChars.includes(char))
    .join("");
}

/**
 * Enabled character pools, in a stable order. A custom charset replaces the
 * checkbox pools entirely and is never filtered — the user typed it.
 */
export function enabledPools(input: CharsetInput): string[] {
  if (input.customCharset.length > 0) {
    return [dedupe(input.customCharset)];
  }

  const pools: string[] = [];
  if (input.uppercase) pools.push(charPools.uppercase);
  if (input.lowercase) pools.push(charPools.lowercase);
  if (input.digits) pools.push(charPools.digits);
  if (input.symbols) pools.push(charPools.symbols);

  return input.excludeAmbiguous ? pools.map(stripAmbiguous).filter(Boolean) : pools;
}

/** The pool every position draws from. Empty means the UI must ask for a type. */
export function buildCharset(input: CharsetInput): string {
  return enabledPools(input).join("");
}

export function charsetSize(input: CharsetInput): number {
  return buildCharset(input).length;
}
