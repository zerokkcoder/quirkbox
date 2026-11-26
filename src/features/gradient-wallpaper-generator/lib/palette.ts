import { hashSeed } from "@/lib/seeds";
import { maxColorStops, minColorStops, type ColorStop } from "./types";

export const harmonyIds = ["analogous", "split", "triadic"] as const;
export type HarmonyId = (typeof harmonyIds)[number];
export const defaultHarmony: HarmonyId = "analogous";

export function normalizeHarmony(value?: string | null): HarmonyId {
  return (harmonyIds as readonly string[]).includes(value ?? "")
    ? (value as HarmonyId)
    : defaultHarmony;
}

/** Hue offsets (degrees) applied to the seed hue for each harmony rule. */
const harmonyOffsets: Record<HarmonyId, readonly number[]> = {
  analogous: [-28, -14, 0, 14, 28],
  split: [0, 150, 210, 30, 180],
  triadic: [0, 120, 240, 60, 180],
};

/** Lightness ladder by index — alternating so stops stay visually distinct. */
const lightnessLadder = [0.34, 0.72, 0.48, 0.86, 0.26];
const saturationLadder = [0.68, 0.58, 0.74, 0.52, 0.62];

function mod(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

/** HSL → hex. h in degrees, s/l in [0,1]. Pure function, no DOM. */
export function hslToHex(h: number, s: number, l: number): string {
  const hue = mod(h, 360) / 360;
  const a = s * Math.min(l, 1 - l);
  const channel = (offset: number) => {
    const k = mod(hue + offset, 1) * 12;
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };

  // Channel offsets: red = hue, green = hue + 8/12, blue = hue + 4/12.
  return `${channel(0)}${channel(-1 / 3)}${channel(1 / 3)}`;
}

/**
 * Deterministic seed → color stops. Same seed always yields the same palette,
 * so a shared link reproduces the exact wallpaper.
 */
export function buildPaletteFromSeed(seed: string): ColorStop[] {
  const baseHue = hashSeed(`${seed}:hue`) % 360;
  const harmony = harmonyIds[hashSeed(`${seed}:harmony`) % harmonyIds.length];
  const count = minColorStops + (hashSeed(`${seed}:count`) % (maxColorStops - minColorStops + 1));
  const offsets = harmonyOffsets[harmony];

  return Array.from({ length: count }, (_, index) => {
    const hue = mod(baseHue + offsets[index] + (hashSeed(`${seed}:jitter:${index}`) % 12) - 6, 360);
    const saturation = saturationLadder[index] + ((hashSeed(`${seed}:sat:${index}`) % 9) - 4) / 100;
    const lightness = lightnessLadder[index] + ((hashSeed(`${seed}:light:${index}`) % 9) - 4) / 100;

    return {
      id: `${seed}-${index}`,
      color: hslToHex(hue, Math.max(0.35, Math.min(0.85, saturation)), Math.max(0.2, Math.min(0.9, lightness))),
      position: count === 1 ? 0 : Math.round((index / (count - 1)) * 100),
    };
  });
}
