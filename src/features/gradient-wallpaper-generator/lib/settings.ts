import { createSeed } from "@/lib/seeds";
import { buildPaletteFromSeed } from "./palette";
import {
  defaultAngle,
  defaultGradientRatio,
  defaultGradientType,
  maxColorStops,
  minColorStops,
  normalizeCenterPreset,
  normalizeGradientRatio,
  normalizeGradientType,
  type ColorStop,
  type GradientState,
} from "./types";

export type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function readParam(source: ParamSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) {
    return source.get(key) ?? undefined;
  }

  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

const hexPattern = /^[0-9a-f]{6}$/i;

export function normalizeHex(value?: string | null, fallback = "3e5c9e"): string {
  const raw = (value ?? "").replace(/^#/, "").toLowerCase();
  return hexPattern.test(raw) ? raw : fallback;
}

export function clampAngle(value: number): number {
  if (!Number.isFinite(value)) return defaultAngle;
  return Math.round(((value % 360) + 360) % 360);
}

export function normalizePosition(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.round(Math.max(0, Math.min(100, value))) : fallback;
}

/** `rrggbb@pos,rrggbb@pos` — compact enough to stay well under URL limits. */
export function serializeStops(stops: ColorStop[]): string {
  return stops
    .map((stop) => `${normalizeHex(stop.color)}@${normalizePosition(stop.position, 0)}`)
    .join(",");
}

export function parseStops(raw: string | undefined, seed: string): ColorStop[] {
  if (!raw) return buildPaletteFromSeed(seed);

  const entries = raw.split(",").map((entry) => entry.split("@"));
  if (entries.length < minColorStops || entries.length > maxColorStops) {
    return buildPaletteFromSeed(seed);
  }

  const parsed = entries.map(([color, position], index) => {
    if (!hexPattern.test((color ?? "").replace(/^#/, "")) || position === undefined) {
      return null;
    }

    const numeric = Number(position);
    if (!Number.isFinite(numeric)) return null;

    return {
      // Stop ids are UI keys only; the URL carries colors/positions, not ids.
      // Derive a stable short id from the index so round-trips are identical.
      id: String.fromCharCode(97 + index),
      color: normalizeHex(color),
      position: normalizePosition(numeric, 0),
    } satisfies ColorStop;
  });

  return parsed.every((stop): stop is ColorStop => stop !== null) ? parsed : buildPaletteFromSeed(seed);
}

export function parseGradientState(source: ParamSource): GradientState {
  const seed = readParam(source, "seed") || createSeed(10);
  const showTextRaw = readParam(source, "text");

  return {
    seed,
    stops: parseStops(readParam(source, "stops"), seed),
    type: normalizeGradientType(readParam(source, "type")),
    angle: clampAngle(Number(readParam(source, "angle") ?? defaultAngle)),
    center: normalizeCenterPreset(readParam(source, "center")),
    ratio: normalizeGradientRatio(readParam(source, "ratio")),
    showText: showTextRaw === "1",
  };
}

export function stateToParams(state: GradientState): Record<string, string | undefined> {
  return {
    seed: state.seed,
    stops: serializeStops(state.stops),
    type: state.type === defaultGradientType ? undefined : state.type,
    angle: state.angle === defaultAngle ? undefined : String(state.angle),
    center: state.center === "center" ? undefined : state.center,
    ratio: state.ratio === defaultGradientRatio ? undefined : state.ratio,
    text: state.showText ? "1" : undefined,
  };
}
