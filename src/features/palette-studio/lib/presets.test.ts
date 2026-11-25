import { describe, expect, it } from "vitest";
import {
  getPreset,
  normalizePreset,
  parsePaletteState,
  palettePresets,
  presetPalette,
  resolvePalette,
} from "./presets";
import { defaultSeedColor } from "./types";

describe("style presets", () => {
  it("defines 12 unique presets with six valid hex colors each", () => {
    expect(palettePresets).toHaveLength(12);
    expect(new Set(palettePresets.map((preset) => preset.id)).size).toBe(12);

    for (const preset of palettePresets) {
      expect(preset.colors).toHaveLength(6);
      expect(preset.colors.every((hex) => /^[0-9a-f]{6}$/.test(hex))).toBe(true);
    }
  });

  it("normalizes preset ids and ignores unknown ones", () => {
    expect(normalizePreset("tech")).toBe("tech");
    expect(normalizePreset("unknown")).toBeNull();
    expect(normalizePreset(null)).toBeNull();
    expect(getPreset("gaming")).toEqual(expect.objectContaining({ id: "gaming" }));
    expect(getPreset(null)).toBeNull();
  });

  it("returns curated colors sliced to the requested count", () => {
    expect(presetPalette("tech", 3)).toEqual(["2563eb", "0891b2", "22d3ee"]);
    expect(presetPalette("tech", 6)).toHaveLength(6);
    expect(presetPalette("not-a-preset" as never, 5)).toBeNull();
  });

  it("hydrates URL state from preset defaults", () => {
    const state = parsePaletteState({ preset: "tech", count: "4" });

    expect(state).toEqual({
      color: "2563eb",
      harmony: "analogous",
      count: 4,
      preset: "tech",
    });
    expect(resolvePalette(state)).toEqual(["2563eb", "0891b2", "22d3ee", "0f172a"]);
  });

  it("honors explicit color and harmony overrides in the URL", () => {
    const state = parsePaletteState({
      preset: "tech",
      color: "ff0000",
      harmony: "mono",
    });

    expect(state.color).toBe("ff0000");
    expect(state.harmony).toBe("mono");
  });

  it("falls back to the generator when no valid preset is present", () => {
    const state = parsePaletteState({ preset: "unknown" });

    expect(state.preset).toBeUndefined();
    expect(state.color).toBe(defaultSeedColor.replace("#", "").toLowerCase());
    expect(resolvePalette(state)).toHaveLength(5);
  });
});
