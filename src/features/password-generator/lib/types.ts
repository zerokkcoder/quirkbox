export const modeIds = ["password", "passphrase"] as const;
export type ModeId = (typeof modeIds)[number];

export const presetIds = ["account", "strong", "memorable", "pin", "custom"] as const;
export type PresetId = (typeof presetIds)[number];

/** Presets the UI offers as buttons; `custom` is a state, not a choice. */
export const selectablePresetIds = ["account", "strong", "memorable", "pin"] as const;
export type SelectablePresetId = (typeof selectablePresetIds)[number];

export const separatorIds = ["dash", "space", "dot", "none", "custom"] as const;
export type SeparatorId = (typeof separatorIds)[number];

/**
 * Lower bound is 4 because the PIN preset deliberately generates six digits.
 * Ordinary passwords should stay at 12 or more; the entropy hint nudges there.
 */
export const lengthRange = { min: 4, max: 128 } as const;
export const wordCountRange = { min: 4, max: 10 } as const;
export const maxMinPerType = 4;
export const batchRange = { min: 1, max: 10 } as const;

export type GeneratorState = {
  preset: PresetId;
  mode: ModeId;
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
  symbols: boolean;
  minPerType: number;
  excludeAmbiguous: boolean;
  customCharset: string;
  wordCount: number;
  separator: SeparatorId;
  customSeparator: string;
  capitalize: boolean;
  appendNumber: boolean;
  batch: number;
};

/**
 * Parameters carried by a preset. `batch` is excluded on purpose: how many
 * results someone wants is not a property of the scenario they picked.
 */
export type PresetConfig = Omit<GeneratorState, "preset" | "batch">;

export const presets: Record<SelectablePresetId, PresetConfig> = {
  account: {
    mode: "password",
    length: 20,
    uppercase: true,
    lowercase: true,
    digits: true,
    symbols: true,
    minPerType: 0,
    excludeAmbiguous: false,
    customCharset: "",
    wordCount: 6,
    separator: "dash",
    customSeparator: "",
    capitalize: false,
    appendNumber: false,
  },
  strong: {
    mode: "password",
    length: 32,
    uppercase: true,
    lowercase: true,
    digits: true,
    symbols: true,
    minPerType: 0,
    excludeAmbiguous: false,
    customCharset: "",
    wordCount: 8,
    separator: "dash",
    customSeparator: "",
    capitalize: false,
    appendNumber: false,
  },
  memorable: {
    mode: "passphrase",
    length: 20,
    uppercase: true,
    lowercase: true,
    digits: true,
    symbols: true,
    minPerType: 0,
    excludeAmbiguous: false,
    customCharset: "",
    wordCount: 6,
    separator: "dash",
    customSeparator: "",
    capitalize: false,
    appendNumber: false,
  },
  pin: {
    mode: "password",
    length: 6,
    uppercase: false,
    lowercase: false,
    digits: true,
    symbols: false,
    minPerType: 0,
    excludeAmbiguous: false,
    customCharset: "",
    wordCount: 6,
    separator: "dash",
    customSeparator: "",
    capitalize: false,
    appendNumber: false,
  },
};

export const defaultPreset: SelectablePresetId = "account";

export const defaultState: GeneratorState = {
  preset: defaultPreset,
  ...presets[defaultPreset],
  batch: 1,
};

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function clampLength(value: number): number {
  return clampNumber(value, lengthRange.min, lengthRange.max);
}

export function clampWordCount(value: number): number {
  return clampNumber(value, wordCountRange.min, wordCountRange.max);
}

export function clampBatch(value: number): number {
  return clampNumber(value, batchRange.min, batchRange.max);
}

export function clampMinPerType(value: number): number {
  return clampNumber(value, 0, maxMinPerType);
}

function isOneOf<T extends string>(values: readonly T[], value?: string | null): value is T {
  return values.includes((value ?? "") as T);
}

export function normalizeMode(
  value?: string | null,
  fallback: ModeId = defaultState.mode
): ModeId {
  return isOneOf(modeIds, value) ? value : fallback;
}

export function normalizePreset(value?: string | null): PresetId {
  return isOneOf(presetIds, value) ? value : defaultState.preset;
}

export function normalizeSeparator(
  value?: string | null,
  fallback: SeparatorId = defaultState.separator
): SeparatorId {
  return isOneOf(separatorIds, value) ? value : fallback;
}

/** Switching a preset replaces mode and every parameter, but keeps batch size. */
export function applyPreset(state: GeneratorState, preset: SelectablePresetId): GeneratorState {
  return { ...state, ...presets[preset], preset };
}
