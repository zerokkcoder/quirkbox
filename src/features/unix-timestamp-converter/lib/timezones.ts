import { localZoneId, utcZoneId } from "./types";

export type ZoneGroup = {
  /** First IANA path segment, or the local sentinel. */
  label: string;
  zones: string[];
};

type IntlWithSupportedValues = typeof Intl & {
  supportedValuesOf?: (key: string) => string[];
};

/**
 * Fallback only for browsers without Intl.supportedValuesOf. Older browsers
 * still get a usable list instead of zero zones; modern ones get the full ICU
 * set (~400 names).
 */
const fallbackZones: readonly string[] = [
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "America/Anchorage",
  "America/Bogota",
  "America/Chicago",
  "America/Denver",
  "America/Lima",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Phoenix",
  "America/Santiago",
  "America/Sao_Paulo",
  "America/Toronto",
  "America/Vancouver",
  "Asia/Bangkok",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Jakarta",
  "Asia/Jerusalem",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Manila",
  "Asia/Riyadh",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Taipei",
  "Asia/Tehran",
  "Asia/Tokyo",
  "Australia/Adelaide",
  "Australia/Brisbane",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Athens",
  "Europe/Berlin",
  "Europe/Dublin",
  "Europe/Helsinki",
  "Europe/Istanbul",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Moscow",
  "Europe/Paris",
  "Europe/Prague",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Vienna",
  "Europe/Warsaw",
  "Europe/Zurich",
  "Pacific/Auckland",
  "Pacific/Fiji",
  "Pacific/Honolulu",
  utcZoneId,
];

/** The full runtime list, with the local sentinel pinned first and UTC second. */
export function allZoneOptions(): string[] {
  let source: readonly string[] = [];

  try {
    const supported = (Intl as IntlWithSupportedValues).supportedValuesOf?.("timeZone");
    if (supported && supported.length > 0) {
      source = supported;
    }
  } catch {
    // Fall through to the static list.
  }

  if (source.length === 0) {
    source = fallbackZones;
  }

  return [localZoneId, ...new Set([utcZoneId, ...source])];
}

/** Case-insensitive match on the full IANA name, so "tokyo" finds Asia/Tokyo. */
export function filterZones(zones: readonly string[], query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [...zones];
  }
  return zones.filter((zone) => zone.toLowerCase().includes(needle));
}

/** Group by the first IANA path segment; local and UTC stay at the top. */
export function groupZones(zones: readonly string[]): ZoneGroup[] {
  const buckets = new Map<string, string[]>();

  for (const zone of zones) {
    const slash = zone.indexOf("/");
    const area = slash === -1 ? zone : zone.slice(0, slash);
    const bucket = buckets.get(area);
    if (bucket) {
      bucket.push(zone);
    } else {
      buckets.set(area, [zone]);
    }
  }

  const areas = [...buckets.keys()].sort((a, b) => {
    if (a === localZoneId) return -1;
    if (b === localZoneId) return 1;
    if (a === utcZoneId) return -1;
    if (b === utcZoneId) return 1;
    return a.localeCompare(b);
  });

  return areas.map((label) => ({ label, zones: buckets.get(label) ?? [] }));
}

export function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || utcZoneId;
  } catch {
    return utcZoneId;
  }
}

export function resolveZone(zone: string): string {
  return zone === localZoneId ? localTimeZone() : zone;
}

export function zoneOffsetLabel(
  timeZone: string,
  date: Date,
  locale: "en" | "zh-Hant"
): string {
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      timeZone,
      timeZoneName: "shortOffset",
      hour: "2-digit",
    }).formatToParts(date);
    return parts.find((part) => part.type === "timeZoneName")?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}
