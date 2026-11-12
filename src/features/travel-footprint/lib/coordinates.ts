import type { Coordinates } from "./geodesy";

/** Decimal places kept for coordinates entered by hand or produced by dragging. */
export const coordinatePrecision = 4;

function isWithin(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

/** Parses a single numeric field; blank strings are rejected (Number("") would be 0). */
function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Parses a pasted "lat, lng" pair. Accepts commas (ASCII / full-width), spaces
 * and tabs as separators, which covers coordinates copied from most map apps.
 */
export function parseCoordinatePair(text: string): Coordinates | null {
  const parts = text
    .trim()
    .split(/[,，\s]+/)
    .filter((part) => part.length > 0);

  if (parts.length !== 2) return null;

  const latitude = parseNumber(parts[0]);
  const longitude = parseNumber(parts[1]);
  if (latitude === null || longitude === null) return null;
  if (!isWithin(latitude, -90, 90) || !isWithin(longitude, -180, 180)) return null;

  return { latitude, longitude };
}

/**
 * Validates the two coordinate fields. When only the latitude field is filled,
 * a pasted pair such as "31.2304, 121.4737" is accepted as a convenience.
 */
export function parseCoordinateInput(latitudeText: string, longitudeText: string): Coordinates | null {
  if (longitudeText.trim().length === 0) {
    const pair = parseCoordinatePair(latitudeText);
    if (pair) return pair;
  }

  const latitude = parseNumber(latitudeText);
  const longitude = parseNumber(longitudeText);
  if (latitude === null || longitude === null) return null;
  if (!isWithin(latitude, -90, 90) || !isWithin(longitude, -180, 180)) return null;

  return { latitude, longitude };
}

export function roundCoordinate(value: number): number {
  const factor = 10 ** coordinatePrecision;
  return Math.round(value * factor) / factor;
}

/** Stable, human-readable "lat, lng" text used as the default name for map clicks. */
export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(coordinatePrecision)}, ${longitude.toFixed(coordinatePrecision)}`;
}
