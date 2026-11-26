import { describe, expect, it } from "vitest";
import { buildPaletteFromSeed, hslToHex, normalizeHarmony } from "./palette";
import { maxColorStops, minColorStops } from "./types";

describe("gradient palette", () => {
  it("is deterministic for the same seed", () => {
    expect(buildPaletteFromSeed("航海日誌")).toEqual(buildPaletteFromSeed("航海日誌"));
  });

  it("produces different palettes for different seeds", () => {
    expect(buildPaletteFromSeed("alpha")).not.toEqual(buildPaletteFromSeed("beta"));
  });

  it("keeps stop count within 2–5 and positions in range", () => {
    for (let index = 0; index < 40; index += 1) {
      const stops = buildPaletteFromSeed(`seed-${index}`);
      expect(stops.length).toBeGreaterThanOrEqual(minColorStops);
      expect(stops.length).toBeLessThanOrEqual(maxColorStops);
      expect(stops[0].position).toBe(0);
      expect(stops[stops.length - 1].position).toBe(100);
      for (const stop of stops) {
        expect(stop.color).toMatch(/^[0-9a-f]{6}$/);
      }
    }
  });

  it("converts HSL to hex correctly", () => {
    expect(hslToHex(0, 1, 0.5)).toBe("ff0000");
    expect(hslToHex(120, 1, 0.5)).toBe("00ff00");
    expect(hslToHex(240, 1, 0.5)).toBe("0000ff");
  });

  it("falls back for unknown harmony ids", () => {
    expect(normalizeHarmony("triadic")).toBe("triadic");
    expect(normalizeHarmony("unknown")).toBe("analogous");
  });
});
