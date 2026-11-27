import {
  defaultAlign,
  defaultAsciiState,
  defaultBackground,
  defaultBrightness,
  defaultContrast,
  defaultDither,
  defaultFont,
  defaultGap,
  defaultMode,
  defaultRamp,
  defaultText,
  defaultVGap,
  defaultWidth,
  normalizeAlign,
  normalizeBackground,
  normalizeBoolean,
  normalizeBrightness,
  normalizeContrast,
  normalizeDither,
  normalizeFont,
  normalizeGap,
  normalizeMode,
  normalizeRamp,
  normalizeText,
  normalizeVGap,
  normalizeWidth,
  type AsciiState,
} from "./types";

export type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function readParam(source: ParamSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

function readNumber(source: ParamSource, key: string): number {
  const raw = readParam(source, key);
  if (raw === undefined) return Number.NaN;
  return Number(raw);
}

/** UTF-8 safe base64url, matching the approach already used by the QR tool. */
export function encodeText(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeText(encoded: string | undefined): string {
  if (!encoded) return defaultText;
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return normalizeText(new TextDecoder().decode(bytes)) || defaultText;
  } catch {
    return defaultText;
  }
}

export function parseAsciiState(source: ParamSource): AsciiState {
  return {
    mode: normalizeMode(readParam(source, "mode")),
    text: decodeText(readParam(source, "text")),
    font: normalizeFont(readParam(source, "font")),
    gap: normalizeGap(readNumber(source, "gap")),
    vGap: normalizeVGap(readNumber(source, "vgap")),
    flip: normalizeBoolean(readParam(source, "flip")),
    align: normalizeAlign(readParam(source, "align")),
    background: normalizeBackground(readParam(source, "bg")),
    width: normalizeWidth(readNumber(source, "width")),
    ramp: normalizeRamp(readParam(source, "ramp")),
    brightness: normalizeBrightness(readNumber(source, "brightness")),
    contrast: normalizeContrast(readNumber(source, "contrast")),
    invert: normalizeBoolean(readParam(source, "invert")),
    dither: normalizeDither(readParam(source, "dither")),
  };
}

/**
 * Defaults are omitted so a fresh visit keeps a clean URL.
 * The uploaded image itself is deliberately never serialised — only settings.
 */
export function stateToParams(state: AsciiState): Record<string, string | undefined> {
  return {
    mode: state.mode === defaultMode ? undefined : state.mode,
    text: state.text === defaultText ? undefined : encodeText(state.text),
    font: state.font === defaultFont ? undefined : state.font,
    gap: state.gap === defaultGap ? undefined : String(state.gap),
    vgap: state.vGap === defaultVGap ? undefined : String(state.vGap),
    flip: state.flip ? "1" : undefined,
    align: state.align === defaultAlign ? undefined : state.align,
    bg: state.background === defaultBackground ? undefined : state.background,
    width: state.width === defaultWidth ? undefined : String(state.width),
    ramp: state.ramp === defaultRamp ? undefined : state.ramp,
    brightness: state.brightness === defaultBrightness ? undefined : String(state.brightness),
    contrast: state.contrast === defaultContrast ? undefined : String(state.contrast),
    invert: state.invert ? "1" : undefined,
    dither: state.dither === defaultDither ? undefined : state.dither,
  };
}

export function isDefaultState(state: AsciiState): boolean {
  return Object.entries(defaultAsciiState).every(
    ([key, value]) => state[key as keyof AsciiState] === value
  );
}
