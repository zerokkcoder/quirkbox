export const unitChoiceIds = [
  "auto",
  "seconds",
  "milliseconds",
  "microseconds",
  "nanoseconds",
] as const;

export type UnitChoice = (typeof unitChoiceIds)[number];
export type UnitId = Exclude<UnitChoice, "auto">;

export const unitIds: readonly UnitId[] = [
  "seconds",
  "milliseconds",
  "microseconds",
  "nanoseconds",
];

export const localZoneId = "local";
export const utcZoneId = "UTC";

export type InputSource = "timestamp" | "date";
export type InputErrorCode = "empty" | "invalid" | "outOfRange";

/** One absolute moment, normalised to nanoseconds. Time zones never live here. */
export type InstantView = {
  /** Milliseconds since the epoch, floored (not truncated) for negative instants. */
  epochMs: bigint;
  /** Nanoseconds inside the millisecond, always in [0, 999999]. */
  subMsNs: bigint;
  /** Total nanoseconds since the epoch — the single source for all integer units. */
  totalNs: bigint;
  /** Unit used to interpret the input, either detected or manually chosen. */
  unit: UnitId;
  /** True when the unit came from magnitude detection rather than the user. */
  detected: boolean;
  source: InputSource;
  /** The pasted integer for timestamp input; null for ISO date input. */
  originalValue: bigint | null;
  /** UTC Date at millisecond precision, only built when within range. */
  date: Date;
};

export type InterpretResult =
  | { ok: true; view: InstantView }
  | { ok: false; code: InputErrorCode };

export type ConverterState = {
  input: string;
  unit: UnitChoice;
  zone: string;
};

export type FormatRow = {
  id: string;
  label: string;
  value: string;
};
