import { normalizeHex } from "./color";
import { generatePalette, normalizeCount, normalizeHarmony } from "./harmony";
import {
  presetIds,
  type HarmonyId,
  type PaletteState,
  type PresetId,
} from "./types";

/** Six curated colors per preset: primary, secondary, accent, dark, light, paper. */
type PresetColors = readonly [string, string, string, string, string, string];

export type PalettePreset = {
  id: PresetId;
  seed: string;
  harmony: HarmonyId;
  colors: PresetColors;
};

export const palettePresets: readonly PalettePreset[] = [
  {
    id: "tech",
    seed: "2563eb",
    harmony: "analogous",
    colors: ["2563eb", "0891b2", "22d3ee", "0f172a", "e0f2fe", "f8fafc"],
  },
  {
    id: "business",
    seed: "1e3a8a",
    harmony: "complementary",
    colors: ["1e3a8a", "475569", "b45309", "0f172a", "e2e8f0", "f8fafc"],
  },
  {
    id: "minimal",
    seed: "334155",
    harmony: "mono",
    colors: ["334155", "94a3b8", "cbd5e1", "1e293b", "f1f5f9", "ffffff"],
  },
  {
    id: "geek",
    seed: "22c55e",
    harmony: "analogous",
    colors: ["22c55e", "16a34a", "f59e0b", "0b0f0a", "dcfce7", "f0fdf4"],
  },
  {
    id: "nature",
    seed: "15803d",
    harmony: "analogous",
    colors: ["15803d", "65a30d", "ca8a04", "14532d", "dcfce7", "f7fee7"],
  },
  {
    id: "retro",
    seed: "b45309",
    harmony: "split",
    colors: ["b45309", "d97706", "0f766e", "451a03", "fef3c7", "fffbeb"],
  },
  {
    id: "ecommerce",
    seed: "dc2626",
    harmony: "analogous",
    colors: ["dc2626", "ea580c", "db2777", "450a0a", "fee2e2", "fff7ed"],
  },
  {
    id: "education",
    seed: "4f46e5",
    harmony: "triadic",
    colors: ["4f46e5", "0284c7", "eab308", "1e1b4b", "e0e7ff", "fffbeb"],
  },
  {
    id: "health",
    seed: "0d9488",
    harmony: "analogous",
    colors: ["0d9488", "14b8a6", "0284c7", "134e4a", "ccfbf1", "f0fdfa"],
  },
  {
    id: "luxury",
    seed: "b8860b",
    harmony: "mono",
    colors: ["b8860b", "92400e", "18181b", "09090b", "fef3c7", "fafaf7"],
  },
  {
    id: "playful",
    seed: "ec4899",
    harmony: "triadic",
    colors: ["ec4899", "8b5cf6", "f97316", "831843", "fce7f3", "fff7ed"],
  },
  {
    id: "gaming",
    seed: "7c3aed",
    harmony: "split",
    colors: ["7c3aed", "db2777", "06b6d4", "0b0714", "ede9fe", "f5f3ff"],
  },
];

export function normalizePreset(input: string | undefined | null): PresetId | null {
  return presetIds.find((id) => id === input) ?? null;
}

export function getPreset(id: PresetId | null | undefined): PalettePreset | null {
  return palettePresets.find((preset) => preset.id === id) ?? null;
}

export function presetPalette(id: PresetId | null | undefined, count: number): string[] | null {
  const preset = getPreset(id);

  return preset ? preset.colors.slice(0, normalizeCount(count)) : null;
}

/** Presets supply curated colors; any manual tweak falls back to the generator. */
export function resolvePalette(state: PaletteState): string[] {
  return (
    presetPalette(state.preset, state.count) ??
    generatePalette(state.color, state.harmony, state.count)
  );
}

type SearchParams = Record<string, string | string[] | undefined>;

/** Shared by both route pages so URL state and preset defaults stay in sync. */
export function parsePaletteState(params: SearchParams): PaletteState {
  const read = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value : undefined;
  };
  const preset = normalizePreset(read("preset"));
  const presetDefaults = getPreset(preset);

  return {
    color: normalizeHex(read("color") ?? presetDefaults?.seed),
    harmony: normalizeHarmony(read("harmony") ?? presetDefaults?.harmony),
    count: normalizeCount(read("count")),
    preset: preset ?? undefined,
  };
}
