import { floorDiv, pow10 } from "./bigint";
import { subMillisecondDigits } from "./units";
import type { InstantView, UnitId } from "./types";

type DisplayLocale = "en" | "zh-Hant";

function pad(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}

/** Fractional digits after the decimal point, trimmed of trailing zeros. */
export function fractionalDigits(view: InstantView): string {
  const digits =
    pad(view.date.getUTCMilliseconds(), 3) + view.subMsNs.toString().padStart(6, "0");
  return digits.replace(/0+$/, "");
}

export function isoString(view: InstantView): string {
  const date = view.date;
  const base = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
    date.getUTCSeconds()
  )}`;
  const fraction = fractionalDigits(view);
  return `${base}${fraction ? `.${fraction}` : ""}Z`;
}

export function utcHuman(view: InstantView): string {
  return `${isoString(view).replace("T", " ").replace(/Z$/, "")} UTC`;
}

export function sqlString(view: InstantView): string {
  const date = view.date;
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
    date.getUTCSeconds()
  )}`;
}

/** toUTCString() is HTTP-date / RFC 1123 (the common "RFC 2822-ish" header form). */
export function rfc1123(view: InstantView): string {
  return view.date.toUTCString();
}

/** Every integer unit is derived from totalNs, never from a lossy Number. */
export function unitValue(view: InstantView, unit: UnitId): bigint {
  switch (unit) {
    case "seconds":
      return floorDiv(view.totalNs, pow10(9));
    case "milliseconds":
      return floorDiv(view.totalNs, pow10(6));
    case "microseconds":
      return floorDiv(view.totalNs, pow10(3));
    case "nanoseconds":
      return view.totalNs;
  }
}

export type ZonedParts = {
  text: string;
  offset: string;
  zoneName: string;
};

/** Formatting is the ONLY place a time zone enters (GLOSSARY: Formatted Date). */
export function formatZoned(
  view: InstantView,
  timeZone: string,
  locale: DisplayLocale
): ZonedParts {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(view.date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const fraction = fractionalDigits(view);
  const text = `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get(
    "minute"
  )}:${get("second")}${fraction ? `.${fraction}` : ""}`;
  return { text, offset: get("timeZoneName"), zoneName: timeZone };
}

type RelativeUnit = "year" | "month" | "day" | "hour" | "minute" | "second";

const relativeBands: readonly { unit: RelativeUnit; ms: number }[] = [
  { unit: "year", ms: 31_536_000_000 },
  { unit: "month", ms: 2_592_000_000 },
  { unit: "day", ms: 86_400_000 },
  { unit: "hour", ms: 3_600_000 },
  { unit: "minute", ms: 60_000 },
  { unit: "second", ms: 1_000 },
];

/** Now is passed in from the client so SSR never renders a moving value. */
export function relativeText(
  view: InstantView,
  nowMs: number,
  locale: DisplayLocale
): string {
  const difference = Number(view.epochMs) - nowMs;
  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
    style: "long",
  });
  for (const band of relativeBands) {
    if (Math.abs(difference) >= band.ms) {
      return formatter.format(Math.round(difference / band.ms), band.unit);
    }
  }
  return formatter.format(0, "second");
}

export function weekday(view: InstantView, locale: DisplayLocale): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "long",
  }).format(view.date);
}

/** ISO 8601 week number (weeks start Monday; week 1 contains the first Thursday). */
export function isoWeek(view: InstantView): number {
  const date = new Date(
    Date.UTC(view.date.getUTCFullYear(), view.date.getUTCMonth(), view.date.getUTCDate())
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export function dayOfYear(view: InstantView): number {
  const start = Date.UTC(view.date.getUTCFullYear(), 0, 1);
  const current = Date.UTC(
    view.date.getUTCFullYear(),
    view.date.getUTCMonth(),
    view.date.getUTCDate()
  );
  return Math.floor((current - start) / 86_400_000) + 1;
}

export type CodeSnippet = { language: string; code: string };

/** Static templates only — nothing here evaluates user input. */
export function codeSnippets(view: InstantView): CodeSnippet[] {
  const seconds = unitValue(view, "seconds").toString();
  const milliseconds = unitValue(view, "milliseconds").toString();
  return [
    {
      language: "JavaScript",
      code: `new Date(${milliseconds}).toISOString()`,
    },
    {
      language: "Python",
      code: `datetime.fromtimestamp(${seconds}, tz=timezone.utc)`,
    },
    { language: "Go", code: `time.Unix(${seconds}, 0).UTC()` },
    { language: "SQL", code: `SELECT TO_TIMESTAMP(${seconds});` },
    { language: "Shell", code: `date -u -d @${seconds}` },
  ];
}
