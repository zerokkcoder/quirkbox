export const modeIds = ["text", "image"] as const;
export type AsciiMode = (typeof modeIds)[number];
export const defaultMode: AsciiMode = "text";

export const fontIds = ["standard", "big", "slant", "small", "banner", "digital", "isometric2"] as const;
export type FontId = (typeof fontIds)[number];
export const defaultFont: FontId = "standard";

export const alignIds = ["left", "center", "right"] as const;
export type Align = (typeof alignIds)[number];
export const defaultAlign: Align = "left";

export const backgroundIds = ["transparent", "space", "mist"] as const;
export type AsciiBackground = (typeof backgroundIds)[number];
export const defaultBackground: AsciiBackground = "transparent";

/** Dark-to-light ramps; `braille` uses a 2×4 dot cell instead of one char per pixel. */
export const rampIds = ["classic", "blocks", "matrix", "minimal", "braille"] as const;
export type RampId = (typeof rampIds)[number];
export const defaultRamp: RampId = "classic";

export const ditherIds = ["none", "floyd-steinberg"] as const;
export type DitherId = (typeof ditherIds)[number];
export const defaultDither: DitherId = "none";

export const minGap = 0;
export const maxGap = 6;
export const defaultGap = 1;

export const minVGap = 0;
export const maxVGap = 4;
export const defaultVGap = 0;
export const maxTextLength = 40;
export const defaultText = "HELLO";

export const minWidth = 20;
export const maxWidth = 160;
export const defaultWidth = 80;

export const minBrightness = -100;
export const maxBrightness = 100;
export const defaultBrightness = 0;

export const minContrast = 0.5;
export const maxContrast = 2;
export const defaultContrast = 1;

/** Fallback glyph for characters the bundled dot-matrix fonts cannot draw. */
export const fallbackChar = "?";

export type AsciiState = {
  mode: AsciiMode;
  text: string;
  font: FontId;
  gap: number;
  vGap: number;
  flip: boolean;
  align: Align;
  background: AsciiBackground;
  width: number;
  ramp: RampId;
  brightness: number;
  contrast: number;
  invert: boolean;
  dither: DitherId;
};

export const defaultAsciiState: AsciiState = {
  mode: defaultMode,
  text: defaultText,
  font: defaultFont,
  gap: defaultGap,
  vGap: defaultVGap,
  flip: false,
  align: defaultAlign,
  background: defaultBackground,
  width: defaultWidth,
  ramp: defaultRamp,
  brightness: defaultBrightness,
  contrast: defaultContrast,
  invert: false,
  dither: defaultDither,
};

function isOneOf<T extends string>(ids: readonly T[], value?: string | null): value is T {
  return ids.includes((value ?? "") as T);
}

export function normalizeMode(value?: string | null): AsciiMode {
  return isOneOf(modeIds, value) ? value : defaultMode;
}

export function normalizeFont(value?: string | null): FontId {
  return isOneOf(fontIds, value) ? value : defaultFont;
}

export function normalizeAlign(value?: string | null): Align {
  return isOneOf(alignIds, value) ? value : defaultAlign;
}

export function normalizeBackground(value?: string | null): AsciiBackground {
  return isOneOf(backgroundIds, value) ? value : defaultBackground;
}

export function normalizeRamp(value?: string | null): RampId {
  return isOneOf(rampIds, value) ? value : defaultRamp;
}

export function normalizeDither(value?: string | null): DitherId {
  return isOneOf(ditherIds, value) ? value : defaultDither;
}

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

export function normalizeGap(value: number): number {
  return Math.round(clampNumber(value, minGap, maxGap, defaultGap));
}

export function normalizeVGap(value: number): number {
  return Math.round(clampNumber(value, minVGap, maxVGap, defaultVGap));
}

export function normalizeWidth(value: number): number {
  return Math.round(clampNumber(value, minWidth, maxWidth, defaultWidth));
}

export function normalizeBrightness(value: number): number {
  return Math.round(clampNumber(value, minBrightness, maxBrightness, defaultBrightness));
}

export function normalizeContrast(value: number): number {
  const rounded = Math.round(clampNumber(value, minContrast, maxContrast, defaultContrast) * 100) / 100;
  return rounded;
}

export function normalizeBoolean(value?: string | null): boolean {
  return value === "1" || value === "true";
}

/** Clip to the supported length; overlong input is truncated, never rejected. */
export function normalizeText(value: string): string {
  return value.slice(0, maxTextLength);
}
