import {
  animationIds,
  connectModeIds,
  lineColorIds,
  lineShapeIds,
  lineStyleIds,
  lineWidthRange,
  DEFAULT_TRAVEL_FOOTPRINT_STATE,
  type AnimationId,
  type ConnectModeId,
  type LineColorId,
  type LineShapeId,
  type LineStyleId,
  type TravelFootprintState,
} from "./types";

export type LineStyleOption = {
  id: LineStyleId;
  dashArray: number[] | undefined;
  lineCap: "round" | "butt";
};

/** Dash patterns for the route line. Solid uses no dash array at all. */
export const lineStyleOptions: LineStyleOption[] = [
  { id: "solid", dashArray: undefined, lineCap: "butt" },
  { id: "dashed", dashArray: [4, 3], lineCap: "butt" },
  { id: "dotted", dashArray: [0.5, 2], lineCap: "round" },
];

export type LineColorOption = {
  id: LineColorId;
  hex: string;
};

/**
 * Preset route colors as hex literals: WebGL paint values cannot consume Tailwind's oklch()
 * theme variables, and every value stays legible on both CARTO positron and dark-matter basemaps.
 */
export const lineColorOptions: LineColorOption[] = [
  { id: "ocean", hex: "#2563eb" },
  { id: "coral", hex: "#e11d48" },
  { id: "forest", hex: "#059669" },
  { id: "violet", hex: "#7c3aed" },
  { id: "amber", hex: "#d97706" },
];

/** Looks up a line style, falling back to the first preset instead of throwing. */
export function getLineStyle(id: LineStyleId): LineStyleOption {
  return lineStyleOptions.find((option) => option.id === id) ?? lineStyleOptions[0];
}

/** Looks up a line color, falling back to the first preset instead of throwing. */
export function getLineColor(id: LineColorId): LineColorOption {
  return lineColorOptions.find((option) => option.id === id) ?? lineColorOptions[0];
}

/** Converts a `#rrggbb` literal into its 0-255 channels. Returns black for malformed input. */
export function hexToRgb(hex: string): [number, number, number] {
  const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim());
  if (!match) return [0, 0, 0];
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Clamps a persisted width to the slider's range, including fractional/NaN values. */
export function normalizeLineWidth(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_TRAVEL_FOOTPRINT_STATE.lineWidth;
  }
  const clamped = Math.min(lineWidthRange.max, Math.max(lineWidthRange.min, value));
  return Math.round(clamped / lineWidthRange.step) * lineWidthRange.step;
}

export type ResolvedLineStyle = {
  color: string;
  width: number;
  opacity: number;
  dashArray: [number, number] | undefined;
  lineCap: "round" | "butt";
};

/** One source of truth for both the WebGL layer and the PNG export. */
export function resolveLineStyle(
  state: Pick<TravelFootprintState, "lineStyle" | "lineColor" | "lineWidth">,
): ResolvedLineStyle {
  const style = getLineStyle(state.lineStyle);
  const color = getLineColor(state.lineColor);
  const dash = style.dashArray;

  return {
    color: color.hex,
    width: normalizeLineWidth(state.lineWidth),
    opacity: 0.9,
    dashArray: dash && dash.length === 2 ? [dash[0], dash[1]] : undefined,
    lineCap: style.lineCap,
  };
}

/** Enum guards shared by the ToggleGroup handlers and storage normalization. */
function resolveEnum<T extends string>(value: unknown, ids: readonly T[], fallback: T): T {
  return (ids as readonly unknown[]).includes(value) ? (value as T) : fallback;
}

export function toLineStyleId(value: unknown): LineStyleId | null {
  return (lineStyleIds as readonly unknown[]).includes(value) ? (value as LineStyleId) : null;
}

export function toLineColorId(value: unknown): LineColorId | null {
  return (lineColorIds as readonly unknown[]).includes(value) ? (value as LineColorId) : null;
}

export function toAnimationId(value: unknown): AnimationId | null {
  return (animationIds as readonly unknown[]).includes(value) ? (value as AnimationId) : null;
}

export function toLineShapeId(value: unknown): LineShapeId | null {
  return (lineShapeIds as readonly unknown[]).includes(value) ? (value as LineShapeId) : null;
}

export function toConnectModeId(value: unknown): ConnectModeId | null {
  return (connectModeIds as readonly unknown[]).includes(value) ? (value as ConnectModeId) : null;
}

export function normalizeEnum<K extends "lineStyle" | "lineColor" | "animation" | "lineShape" | "connectMode">(
  key: K,
  value: unknown,
): TravelFootprintState[K] {
  const fallback = DEFAULT_TRAVEL_FOOTPRINT_STATE[key];
  switch (key) {
    case "lineStyle":
      return resolveEnum(value, lineStyleIds, fallback as LineStyleId) as TravelFootprintState[K];
    case "lineColor":
      return resolveEnum(value, lineColorIds, fallback as LineColorId) as TravelFootprintState[K];
    case "animation":
      return resolveEnum(value, animationIds, fallback as AnimationId) as TravelFootprintState[K];
    case "lineShape":
      return resolveEnum(value, lineShapeIds, fallback as LineShapeId) as TravelFootprintState[K];
    default:
      return resolveEnum(value, connectModeIds, fallback as ConnectModeId) as TravelFootprintState[K];
  }
}
