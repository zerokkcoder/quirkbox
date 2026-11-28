import {
  clampBatch,
  clampLength,
  clampMinPerType,
  clampWordCount,
  defaultState,
  normalizeMode,
  normalizePreset,
  normalizeSeparator,
  presets,
  type GeneratorState,
} from "./types";

export type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function readParam(source: ParamSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

function readBoolean(source: ParamSource, key: string, fallback: boolean): boolean {
  const value = readParam(source, key);
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return fallback;
}

function readNumber(source: ParamSource, key: string, fallback: number): number {
  const value = readParam(source, key);
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Only settings are serialised. A generated secret is deliberately never
 * written to the URL, storage, analytics or a history — see
 * docs/adr/0001-local-csprng-no-persistence.md.
 */
export function parseGeneratorState(source: ParamSource): GeneratorState {
  const preset = normalizePreset(readParam(source, "p"));
  const base: GeneratorState =
    preset === "custom"
      ? { ...defaultState, preset }
      : { preset, ...presets[preset], batch: defaultState.batch };

  return {
    preset,
    mode: normalizeMode(readParam(source, "m"), base.mode),
    length: clampLength(readNumber(source, "len", base.length)),
    uppercase: readBoolean(source, "up", base.uppercase),
    lowercase: readBoolean(source, "low", base.lowercase),
    digits: readBoolean(source, "num", base.digits),
    symbols: readBoolean(source, "sym", base.symbols),
    minPerType: clampMinPerType(readNumber(source, "min", base.minPerType)),
    excludeAmbiguous: readBoolean(source, "noambig", base.excludeAmbiguous),
    customCharset: readParam(source, "set") ?? base.customCharset,
    wordCount: clampWordCount(readNumber(source, "words", base.wordCount)),
    separator: normalizeSeparator(readParam(source, "sep"), base.separator),
    customSeparator: readParam(source, "csep") ?? base.customSeparator,
    capitalize: readBoolean(source, "cap", base.capitalize),
    appendNumber: readBoolean(source, "numb", base.appendNumber),
    batch: clampBatch(readNumber(source, "n", base.batch)),
  };
}

function boolParam(value: boolean, fallback: boolean): string | undefined {
  return value === fallback ? undefined : value ? "1" : "0";
}

function numberParam(value: number, fallback: number): string | undefined {
  return value === fallback ? undefined : String(value);
}

function stringParam(value: string, fallback: string): string | undefined {
  return value === fallback || value === "" ? undefined : value;
}

/**
 * Inverse of parseGeneratorState. Every key is a setting; a secret never has a
 * key here, and settings.test.ts asserts that no output value matches one.
 */
export function stateToParams(state: GeneratorState): Record<string, string | undefined> {
  return {
    p: state.preset === defaultState.preset ? undefined : state.preset,
    m: state.mode === defaultState.mode ? undefined : state.mode,
    len: numberParam(state.length, defaultState.length),
    up: boolParam(state.uppercase, defaultState.uppercase),
    low: boolParam(state.lowercase, defaultState.lowercase),
    num: boolParam(state.digits, defaultState.digits),
    sym: boolParam(state.symbols, defaultState.symbols),
    min: numberParam(state.minPerType, defaultState.minPerType),
    noambig: boolParam(state.excludeAmbiguous, defaultState.excludeAmbiguous),
    set: stringParam(state.customCharset, defaultState.customCharset),
    words: numberParam(state.wordCount, defaultState.wordCount),
    sep: state.separator === defaultState.separator ? undefined : state.separator,
    csep: stringParam(state.customSeparator, defaultState.customSeparator),
    cap: boolParam(state.capitalize, defaultState.capitalize),
    numb: boolParam(state.appendNumber, defaultState.appendNumber),
    n: numberParam(state.batch, defaultState.batch),
  };
}
