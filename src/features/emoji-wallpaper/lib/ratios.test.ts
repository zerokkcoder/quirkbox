import { describe, expect, it } from "vitest";
import {
  defaultWallpaperRatio,
  getWallpaperSize,
  normalizeWallpaperRatio,
  wallpaperRatioIds,
  wallpaperRatios,
} from "@/features/emoji-wallpaper/lib/ratios";

describe("wallpaper ratios", () => {
  it("keeps every short edge at least 2160px", () => {
    for (const id of wallpaperRatioIds) {
      const { width, height } = wallpaperRatios[id];

      expect(Math.min(width, height)).toBeGreaterThanOrEqual(2160);
    }
  });

  it("matches the declared aspect ratio", () => {
    const expected: Record<string, number> = {
      "9:16": 9 / 16,
      "9:19.5": 9 / 19.5,
      "9:20": 9 / 20,
      "16:9": 16 / 9,
    };

    for (const id of wallpaperRatioIds) {
      const { width, height } = wallpaperRatios[id];

      expect(width / height).toBeCloseTo(expected[id], 6);
    }
  });

  it("falls back to the default ratio for unknown values", () => {
    expect(normalizeWallpaperRatio("21:9")).toBe(defaultWallpaperRatio);
    expect(normalizeWallpaperRatio(undefined)).toBe(defaultWallpaperRatio);
    expect(normalizeWallpaperRatio(null)).toBe(defaultWallpaperRatio);
  });

  it("returns the matching file size for a normalized ratio", () => {
    expect(getWallpaperSize("9:20")).toEqual(wallpaperRatios["9:20"]);
    expect(getWallpaperSize("nonsense")).toEqual(wallpaperRatios[defaultWallpaperRatio]);
  });
});
