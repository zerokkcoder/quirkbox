import { describe, expect, it } from "vitest";
import { bigintAbs, floorDiv, floorMod, pow10 } from "./bigint";

describe("pow10 / bigintAbs", () => {
  it("builds powers of ten as bigints", () => {
    expect(pow10(0)).toBe(1n);
    expect(pow10(6)).toBe(1_000_000n);
    expect(pow10(9)).toBe(1_000_000_000n);
  });

  it("takes the absolute value", () => {
    expect(bigintAbs(-5n)).toBe(5n);
    expect(bigintAbs(0n)).toBe(0n);
    expect(bigintAbs(7n)).toBe(7n);
  });
});

describe("floorDiv / floorMod", () => {
  it("uses floor division rather than BigInt's truncation toward zero", () => {
    expect(floorDiv(-1n, 1000n)).toBe(-1n);
    expect(floorDiv(-1000n, 1000n)).toBe(-1n);
    expect(floorDiv(-1001n, 1000n)).toBe(-2n);
    expect(floorDiv(1n, 1000n)).toBe(0n);
    expect(floorDiv(1001n, 1000n)).toBe(1n);
  });

  it("keeps the remainder inside [0, divisor)", () => {
    expect(floorMod(-1n, 1000n)).toBe(999n);
    expect(floorMod(-1_000_001n, 1_000_000n)).toBe(999_999n);
    expect(floorMod(5n, 1000n)).toBe(5n);
  });

  it("rejects non-positive divisors", () => {
    expect(() => floorDiv(1n, 0n)).toThrow(RangeError);
    expect(() => floorMod(1n, -2n)).toThrow(RangeError);
  });
});
