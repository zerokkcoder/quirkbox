import { pow10 } from "./bigint";
import {
  detectUnit,
  isWithinDateRange,
  splitInstant,
  totalNanoseconds,
} from "./units";
import type {
  InputSource,
  InstantView,
  InterpretResult,
  UnitChoice,
  UnitId,
} from "./types";

const integerPattern = /^-?\d+$/;

/**
 * ISO 8601 / RFC 3339 with an explicit offset ONLY. A wall-clock string without
 * an offset is deliberately rejected: `new Date("2026-01-01")` would parse it
 * as UTC midnight and silently shift the day for negative-offset users (Q13).
 */
const isoPattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:\d{2})$/;

function buildView({
  epochMs,
  subMsNs,
  unit,
  detected,
  source,
  originalValue,
}: {
  epochMs: bigint;
  subMsNs: bigint;
  unit: UnitId;
  detected: boolean;
  source: InputSource;
  originalValue: bigint | null;
}): InterpretResult {
  if (!isWithinDateRange(epochMs)) {
    return { ok: false, code: "outOfRange" };
  }

  const totalNs = epochMs * pow10(6) + subMsNs;
  const view: InstantView = {
    epochMs,
    subMsNs,
    totalNs,
    unit,
    detected,
    source,
    originalValue,
    // epochMs is bounded by maxDateMs, so Number() stays an exact safe integer.
    date: new Date(Number(epochMs)),
  };
  return { ok: true, view };
}

function parseTimestamp(raw: string, unitChoice: UnitChoice): InterpretResult {
  const value = BigInt(raw);
  const detectedUnit = detectUnit(value);
  const unit: UnitId | null =
    unitChoice === "auto" ? detectedUnit : unitChoice;

  if (!unit) {
    return { ok: false, code: "outOfRange" };
  }

  const { epochMs, subMsNs } = splitInstant(totalNanoseconds(value, unit));
  return buildView({
    epochMs,
    subMsNs,
    unit,
    detected: unitChoice === "auto",
    source: "timestamp",
    originalValue: value,
  });
}

function isoGroupsAreSane(match: RegExpExecArray): boolean {
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");
  const offset = match[8];

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return false;
  }

  if (offset !== "Z") {
    const offsetHour = Number(offset.slice(1, 3));
    const offsetMinute = Number(offset.slice(4, 6));
    if (offsetHour > 23 || offsetMinute > 59) {
      return false;
    }
  }

  return true;
}

function parseIsoDate(raw: string, match: RegExpExecArray): InterpretResult {
  if (!isoGroupsAreSane(match)) {
    return { ok: false, code: "invalid" };
  }

  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) {
    return { ok: false, code: "invalid" };
  }

  // JS Date drops sub-millisecond digits; keep the last 6 of the 9 fractional
  // digits so microsecond/nanosecond ISO strings round-trip (Q2).
  const fraction = match[7] ?? "";
  const subMsNs = BigInt((fraction.slice(3) + "000000").slice(0, 6));

  return buildView({
    epochMs: BigInt(parsed),
    subMsNs,
    unit: "seconds",
    detected: false,
    source: "date",
    originalValue: null,
  });
}

/** The single entry point: either an integer timestamp or an offset-bearing ISO date. */
export function interpretInput(
  input: string,
  unitChoice: UnitChoice = "auto"
): InterpretResult {
  const raw = input.trim();

  if (!raw) {
    return { ok: false, code: "empty" };
  }

  if (integerPattern.test(raw)) {
    return parseTimestamp(raw, unitChoice);
  }

  const isoMatch = isoPattern.exec(raw);
  if (isoMatch) {
    return parseIsoDate(raw, isoMatch);
  }

  return { ok: false, code: "invalid" };
}
