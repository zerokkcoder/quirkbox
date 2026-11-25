import { normalizeFormat } from "./formats";
import { normalizeDimension } from "./resize";
import {
  defaultBackground,
  defaultFormat,
  defaultQuality,
  defaultSuffix,
  type FormatId,
  type ImageStudioState,
} from "./types";

/** Formats where a quality slider actually changes the bytes. */
const qualityFormats = new Set<FormatId>(["jpeg", "webp", "avif", "gif"]);

/** Formats that cannot store alpha, so transparency has to be flattened onto a color. */
const matteFormats = new Set<FormatId>(["jpeg", "bmp", "gif"]);

/**
 * The UI greys out controls that do nothing for the current format, so the
 * interface explains itself instead of relying on help text.
 */
export function supportsQuality(format: FormatId): boolean {
  return qualityFormats.has(format);
}

export function needsBackground(format: FormatId): boolean {
  return matteFormats.has(format);
}

export function normalizeQuality(input: unknown, fallback = defaultQuality): number {
  const value = typeof input === "string" ? Number(input) : input;
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(1, Math.round(value)));
}

export function normalizeBackground(input: string | undefined | null): string {
  const raw = (input ?? "").trim().replace(/^#/, "");
  const full = raw.length === 3 ? raw.split("").map((char) => char + char).join("") : raw;
  return /^[0-9a-f]{6}$/i.test(full) ? full.toLowerCase() : defaultBackground;
}

function normalizeSuffix(input: string | undefined): boolean {
  if (input === "0" || input?.toLowerCase() === "false") return false;
  if (input === "1" || input?.toLowerCase() === "true") return true;
  return defaultSuffix;
}

const baseState: ImageStudioState = {
  format: defaultFormat,
  quality: defaultQuality,
  width: 0,
  height: 0,
  background: defaultBackground,
  suffix: defaultSuffix,
};

type SearchParams = Record<string, string | string[] | undefined>;

function read(params: SearchParams, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

/** Unknown or legacy parameters are ignored rather than rejected. */
export function parseImageStudioState(params: SearchParams): ImageStudioState {
  return {
    format: normalizeFormat(read(params, "format")) ?? baseState.format,
    quality: normalizeQuality(read(params, "quality") ?? baseState.quality),
    width: normalizeDimension(read(params, "width") ?? baseState.width),
    height: normalizeDimension(read(params, "height") ?? baseState.height),
    background: normalizeBackground(read(params, "bg") ?? baseState.background),
    suffix:
      read(params, "suffix") === undefined
        ? baseState.suffix
        : normalizeSuffix(read(params, "suffix")),
  };
}

/** Only parameters, never image bytes — safe to put in a shared URL. */
export function stateToParams(state: ImageStudioState): Record<string, string | undefined> {
  return {
    format: state.format,
    quality: String(state.quality),
    width: state.width ? String(state.width) : undefined,
    height: state.height ? String(state.height) : undefined,
    bg: state.background === defaultBackground ? undefined : state.background,
    suffix: state.suffix ? undefined : "0",
  };
}
