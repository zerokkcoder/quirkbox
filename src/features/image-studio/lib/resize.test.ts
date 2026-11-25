import { describe, expect, it } from "vitest";
import { calculateSize, icoDimension, normalizeDimension, savingsPercent } from "./resize";

describe("resize helpers", () => {
  it("keeps the source size when no limit is set", () => {
    expect(calculateSize({ width: 1200, height: 800 }, 0, 0)).toEqual({ width: 1200, height: 800 });
  });

  it("fits inside a box without changing the aspect ratio", () => {
    expect(calculateSize({ width: 1200, height: 800 }, 600, 0)).toEqual({ width: 600, height: 400 });
    expect(calculateSize({ width: 1200, height: 800 }, 0, 200)).toEqual({ width: 300, height: 200 });
    expect(calculateSize({ width: 1200, height: 800 }, 300, 300)).toEqual({ width: 300, height: 200 });
  });

  it("never upscales and clamps invalid limits", () => {
    expect(calculateSize({ width: 64, height: 64 }, 1600, 1600)).toEqual({ width: 64, height: 64 });
    expect(normalizeDimension("999999")).toBe(8192);
    expect(normalizeDimension("abc")).toBe(0);
    expect(normalizeDimension(-5)).toBe(0);
  });

  it("encodes the 256 ICO dimension as zero", () => {
    expect(icoDimension(256)).toBe(0);
    expect(icoDimension(64)).toBe(64);
  });

  it("reports savings between zero and one hundred", () => {
    expect(savingsPercent(1000, 250)).toBe(75);
    expect(savingsPercent(100, 200)).toBe(0);
    expect(savingsPercent(0, 0)).toBe(0);
  });
});
