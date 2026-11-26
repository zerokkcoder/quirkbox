import { utf8Bytes, utf8Decode } from "./utf8";
import {
  defaultBackground,
  defaultDotStyle,
  defaultForeground,
  defaultLevel,
  defaultSize,
  defaultText,
  defaultTransparent,
  dotStyles,
  errorLevels,
  exportSizes,
  type DotStyle,
  type ErrorLevel,
  type ExportSize,
  type QrState,
} from "./types";

/** Text is base64url-encoded so Chinese, emoji and `?`/`&` survive a share URL. */
export function encodeText(text: string): string {
  const binary = utf8Bytes(text)
    .map((byte) => String.fromCharCode(byte))
    .join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeText(encoded: string | undefined): string {
  if (!encoded) return defaultText;
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes: number[] = [];
    for (let i = 0; i < binary.length; i += 1) bytes.push(binary.charCodeAt(i));
    return utf8Decode(bytes) || defaultText;
  } catch {
    return defaultText;
  }
}

export function normalizeLevel(input: string | undefined): ErrorLevel {
  return errorLevels.find((level) => level === input) ?? defaultLevel;
}

export function normalizeDotStyle(input: string | undefined): DotStyle {
  return dotStyles.find((style) => style === input) ?? defaultDotStyle;
}

export function normalizeSize(input: string | undefined): ExportSize {
  const value = Number(input);
  return exportSizes.find((size) => size === value) ?? defaultSize;
}

export function normalizeHex(input: string | undefined | null, fallback: string): string {
  const raw = (input ?? "").trim().replace(/^#/, "");
  const full = raw.length === 3 ? raw.split("").map((char) => char + char).join("") : raw;
  return /^[0-9a-f]{6}$/i.test(full) ? full.toLowerCase() : fallback;
}

function normalizeBoolean(input: string | undefined, fallback: boolean): boolean {
  if (input === undefined) return fallback;
  if (input === "1" || input.toLowerCase() === "true") return true;
  if (input === "0" || input.toLowerCase() === "false") return false;
  return fallback;
}

const baseState: QrState = {
  text: defaultText,
  level: defaultLevel,
  size: defaultSize,
  foreground: defaultForeground,
  background: defaultBackground,
  dots: defaultDotStyle,
  transparent: defaultTransparent,
};

type SearchParams = Record<string, string | string[] | undefined>;

function read(params: SearchParams, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

/** Unknown or legacy parameters are ignored rather than rejected. */
export function parseQrState(params: SearchParams): QrState {
  return {
    text: decodeText(read(params, "text")),
    level: normalizeLevel(read(params, "ec")),
    size: normalizeSize(read(params, "size")),
    foreground: normalizeHex(read(params, "fg"), baseState.foreground),
    background: normalizeHex(read(params, "bg"), baseState.background),
    dots: normalizeDotStyle(read(params, "dots")),
    transparent: normalizeBoolean(read(params, "alpha"), baseState.transparent),
  };
}

/** Only parameters, never uploaded content blobs — safe to put in a shared URL. */
export function stateToParams(state: QrState): Record<string, string | undefined> {
  return {
    text: state.text === defaultText ? undefined : encodeText(state.text),
    ec: state.level === defaultLevel ? undefined : state.level,
    size: state.size === defaultSize ? undefined : String(state.size),
    fg: state.foreground === defaultForeground ? undefined : state.foreground,
    bg: state.background === defaultBackground ? undefined : state.background,
    dots: state.dots === defaultDotStyle ? undefined : state.dots,
    alpha: state.transparent ? "1" : undefined,
  };
}

/** Number of UTF-8 bytes the current text occupies, for the capacity hint. */
export function textByteLength(text: string): number {
  return utf8Bytes(text).length;
}
