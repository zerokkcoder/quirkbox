/** Integer helpers. Nothing in this feature ever converts a timestamp to Number. */

export function pow10(exponent: number): bigint {
  let result = 1n;
  for (let index = 0; index < exponent; index += 1) {
    result *= 10n;
  }
  return result;
}

export function bigintAbs(value: bigint): bigint {
  return value < 0n ? -value : value;
}

/**
 * BigInt division truncates toward zero: -1n / 1000n === 0n. Displaying
 * 1969-12-31T23:59:59.999Z needs -1, so use floor division everywhere.
 */
export function floorDiv(dividend: bigint, divisor: bigint): bigint {
  if (divisor <= 0n) {
    throw new RangeError("divisor must be a positive bigint");
  }
  const quotient = dividend / divisor;
  const remainder = dividend % divisor;
  return remainder < 0n ? quotient - 1n : quotient;
}

/** Companion of floorDiv: the remainder is always in [0, divisor). */
export function floorMod(dividend: bigint, divisor: bigint): bigint {
  if (divisor <= 0n) {
    throw new RangeError("divisor must be a positive bigint");
  }
  const remainder = dividend % divisor;
  return remainder < 0n ? remainder + divisor : remainder;
}
