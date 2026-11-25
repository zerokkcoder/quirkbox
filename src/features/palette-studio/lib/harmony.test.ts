import { describe, expect, it } from "vitest";
import { generatePalette, normalizeCount, normalizeHarmony } from "@/features/palette-studio/lib/harmony";
import { hexToRgb, rgbToOklch } from "@/features/palette-studio/lib/color";
import { defaultHarmony, harmonyIds } from "@/features/palette-studio/lib/types";

describe("palette harmony", () => {
  it("normalizes harmony and count inputs", () => {
    expect(normalizeHarmony(undefined)).toBe(defaultHarmony);
    expect(normalizeHarmony("unstable")).toBe(defaultHarmony);
    expect(normalizeHarmony("triadic")).toBe("triadic");

    expect(normalizeCount(undefined)).toBe(5);
    expect(normalizeCount("4")).toBe(4);
    expect(normalizeCount(2)).toBe(3);
    expect(normalizeCount(99)).toBe(6);
    expect(normalizeCount("nonsense")).toBe(5);
  });

  it("generates the requested number of valid hex colours for every rule", () => {
    for (const harmony of harmonyIds) {
      for (const count of [3, 4, 5, 6]) {
        const palette = generatePalette("3E5C9E", harmony, count);

        expect(palette).toHaveLength(count);
        for (const hex of palette) {
          expect(hex).toMatch(/^[0-9a-f]{6}$/);
        }
      }
    }
  });

  it("is deterministic and responds to the seed", () => {
    const first = generatePalette("3e5c9e", "analogous", 5);

    expect(generatePalette("3E5C9E", "analogous", 5)).toEqual(first);
    expect(generatePalette("ff00ff", "analogous", 5)).not.toEqual(first);
    expect(generatePalette("3e5c9e", "complementary", 5)).not.toEqual(first);
  });

  it("keeps monochrome palettes on a single hue", () => {
    const hues = generatePalette("3e5c9e", "mono", 6).map(
      (hex) => rgbToOklch(hexToRgb(hex)).h
    );

    expect(Math.max(...hues) - Math.min(...hues)).toBeLessThan(12);
  });

  it("spreads complementary palettes across opposing hues", () => {
    const hues = generatePalette("3e5c9e", "complementary", 6).map(
      (hex) => rgbToOklch(hexToRgb(hex)).h
    );
    const spread = Math.max(...hues) - Math.min(...hues);

    expect(spread).toBeGreaterThan(120);
  });

  it("survives achromatic and saturated seeds", () => {
    for (const seed of ["000000", "ffffff", "00ff00"]) {
      const palette = generatePalette(seed, "tetradic", 6);

      expect(palette.every((hex) => /^[0-9a-f]{6}$/.test(hex))).toBe(true);
      expect(new Set(palette).size).toBeGreaterThan(1);
    }
  });
});
