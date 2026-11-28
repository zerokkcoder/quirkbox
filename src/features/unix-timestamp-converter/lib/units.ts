import { bigintAbs, floorDiv, floorMod, pow10 } from "./bigint";
import type { UnitId } from "./types";

const NS_PER_MS = pow10(6);

const toNanoseconds: Record<UnitId, bigint> = {
  seconds: pow10(9),
  milliseconds: pow10(6),
  microseconds: pow10(3),
  nanoseconds: 1n,
};

/**
 * Magnitude bands for automatic unit detection. A 10-digit value is seconds,
 * 13-digit milliseconds, 16-digit microseconds, 19-digit nanoseconds.
 * Short values, negatives and far-future dates can be misread — the UI always
 * shows the detected unit and lets the user override it (Q6).
 */
const magnitudeBands: readonly { unit: UnitId; upper: bigint }[] = [
  { unit: "seconds", upper: pow10(11) },
  { unit: "milliseconds", upper: pow10(14) },
  { unit: "microseconds", upper: pow10(17) },
  { unit: "nanoseconds", upper: pow10(20) },
];

export const maxMagnitude = pow10(20);

/** JS Date can represent +/- 8.64e15 ms. Beyond that we refuse, not approximate. */
export const maxDateMs = 8_640_000_000_000_000n;

export function detectUnit(value: bigint): UnitId | null {
  const magnitude = bigintAbs(value);
  for (const band of magnitudeBands) {
    if (magnitude < band.upper) {
      return band.unit;
    }
  }
  return null;
}

export function totalNanoseconds(value: bigint, unit: UnitId): bigint {
  return value * toNanoseconds[unit];
}

export function splitInstant(totalNs: bigint): {
  epochMs: bigint;
  subMsNs: bigint;
} {
  return {
    epochMs: floorDiv(totalNs, NS_PER_MS),
    subMsNs: floorMod(totalNs, NS_PER_MS),
  };
}

export function isWithinDateRange(epochMs: bigint): boolean {
  return bigintAbs(epochMs) <= maxDateMs;
}

/** Fractional digits after the second, with trailing zeros removed. */
export function subMillisecondDigits(subMsNs: bigint): string {
  return subMsNs.toString().padStart(6, "0").replace(/0+$/, "");
}
