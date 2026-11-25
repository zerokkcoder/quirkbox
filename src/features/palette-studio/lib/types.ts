export const harmonyIds = [
  "analogous",
  "complementary",
  "split",
  "triadic",
  "tetradic",
  "mono",
] as const;

export type HarmonyId = (typeof harmonyIds)[number];

export const presetIds = [
  "tech",
  "business",
  "minimal",
  "geek",
  "nature",
  "retro",
  "ecommerce",
  "education",
  "health",
  "luxury",
  "playful",
  "gaming",
] as const;

export type PresetId = (typeof presetIds)[number];

export const defaultSeedColor = "#3E5C9E";
export const defaultHarmony: HarmonyId = "analogous";
export const minSwatchCount = 3;
export const maxSwatchCount = 6;
export const defaultSwatchCount = 5;

export type PaletteState = {
  /** Stored without the leading `#` so it can live directly in the URL. */
  color: string;
  harmony: HarmonyId;
  count: number;
  /** When set, the curated preset colors take precedence over the generator. */
  preset?: PresetId | null;
};
