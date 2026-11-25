import { hexToRgb, normalizeHex, normalizeHue, oklchToHex, rgbToOklch } from "./color";
import {
  defaultHarmony,
  defaultSwatchCount,
  harmonyIds,
  maxSwatchCount,
  minSwatchCount,
  type HarmonyId,
} from "./types";

const lightnessSteps = [0.3, 0.42, 0.54, 0.66, 0.78, 0.88];

const hueAnchors: Record<HarmonyId, number[]> = {
  analogous: [0],
  complementary: [0, 180],
  split: [0, 150, 210],
  triadic: [0, 120, 240],
  tetradic: [0, 90, 180, 270],
  mono: [0],
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function normalizeHarmony(input: string | undefined | null): HarmonyId {
  return harmonyIds.find((id) => id === input) ?? defaultHarmony;
}

export function normalizeCount(input: string | number | undefined | null): number {
  const parsed = typeof input === "number" ? input : Number(input);

  if (!Number.isFinite(parsed)) return defaultSwatchCount;

  return Math.round(clamp(parsed, minSwatchCount, maxSwatchCount));
}

function hueOffsetAt(harmony: HarmonyId, index: number, count: number) {
  if (harmony === "mono") return 0;

  if (harmony === "analogous") {
    return (index - (count - 1) / 2) * 14;
  }

  const anchors = hueAnchors[harmony];
  const groups = Math.ceil(count / anchors.length);
  const group = Math.floor(index / anchors.length);
  const spread = (group - (groups - 1) / 2) * 10;

  return anchors[index % anchors.length] + spread;
}

/** Pure, deterministic: the same seed + rule + count always yields the same hex list. */
export function generatePalette(
  seedHex: string,
  harmony: HarmonyId = defaultHarmony,
  count: number = defaultSwatchCount
): string[] {
  const seed = rgbToOklch(hexToRgb(normalizeHex(seedHex)));
  const swatches = normalizeCount(count);

  return Array.from({ length: swatches }, (_, index) => {
    const step = lightnessSteps[Math.floor((index * lightnessSteps.length) / swatches)];
    const saturation = 1 - (Math.min(1, Math.abs(step - 0.54) / 0.4) * 0.35);
    const chromaFactor = harmony === "mono" ? 0.55 : 1;

    return oklchToHex({
      l: clamp(seed.l + (step - 0.54), 0.24, 0.92),
      c: clamp(seed.c * chromaFactor * saturation, 0.008, 0.37),
      h: normalizeHue(seed.h + hueOffsetAt(harmony, index, swatches)),
    });
  });
}
