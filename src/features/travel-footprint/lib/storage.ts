import { normalizeEnum, normalizeLineWidth } from "./line-styles";
import {
  DEFAULT_TRAVEL_FOOTPRINT_STATE,
  type FootprintSpot,
  type TravelFootprintState,
} from "./types";

export const travelFootprintStorageKey = "quirkbox:travel-footprint:v1";

/** Guards against pathological payloads; a longer list is treated as corrupt. */
const maxSpots = 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readSpot(value: unknown): FootprintSpot | null {
  if (!isRecord(value)) {
    return null;
  }

  const { id, name, longitude, latitude } = value;

  if (typeof id !== "string" || id.length === 0) {
    return null;
  }

  if (typeof name !== "string") {
    return null;
  }

  if (typeof longitude !== "number" || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return null;
  }

  if (typeof latitude !== "number" || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return null;
  }

  return { id, name, longitude, latitude };
}

/**
 * Normalizes an arbitrary parsed value into a valid state. Bad spots are dropped individually;
 * a non-array or oversized spots list is discarded entirely.
 */
export function parseTravelFootprintState(value: unknown): TravelFootprintState {
  if (!isRecord(value)) {
    return { ...DEFAULT_TRAVEL_FOOTPRINT_STATE, spots: [] };
  }

  const home = value.home == null ? null : readSpot(value.home);

  let spots: FootprintSpot[] = [];
  if (Array.isArray(value.spots) && value.spots.length <= maxSpots) {
    spots = value.spots.map(readSpot).filter((spot): spot is FootprintSpot => spot !== null);
  }

  return {
    home,
    spots,
    lineStyle: normalizeEnum("lineStyle", value.lineStyle),
    lineColor: normalizeEnum("lineColor", value.lineColor),
    lineWidth: normalizeLineWidth(value.lineWidth),
    animation: normalizeEnum("animation", value.animation),
    lineShape: normalizeEnum("lineShape", value.lineShape),
    connectMode: normalizeEnum("connectMode", value.connectMode),
  };
}

/** Reads the persisted state, degrading to the default empty state on any failure. */
export function readTravelFootprintState(): TravelFootprintState {
  if (typeof window === "undefined") {
    return { ...DEFAULT_TRAVEL_FOOTPRINT_STATE, spots: [] };
  }

  try {
    const raw = window.localStorage.getItem(travelFootprintStorageKey);

    if (raw === null) {
      return { ...DEFAULT_TRAVEL_FOOTPRINT_STATE, spots: [] };
    }

    return parseTravelFootprintState(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_TRAVEL_FOOTPRINT_STATE, spots: [] };
  }
}

/** Persists the state, silently ignoring storage that is disabled or over quota. */
export function writeTravelFootprintState(state: TravelFootprintState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(travelFootprintStorageKey, JSON.stringify(state));
  } catch {
    // Persistence is best-effort.
  }
}
