/**
 * Thin client around the Photon geocoder (Komoot). Photon is free, key-less and supports
 * prefix autocompletion, which makes it a good fit for an as-you-type place search.
 *
 * Photon answers with a GeoJSON `FeatureCollection` shaped roughly like:
 *   { geometry: { coordinates: [longitude, latitude] }, properties: { name?, city?, country?, osm_id?, ... } }
 */

export type GeocodingResult = {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
};

/** Normalized error for every failure mode: network, timeout, bad status, bad payload, abort. */
export class GeocodingError extends Error {
  constructor(message = "Place search failed", options?: { cause?: unknown }) {
    super(message, options);
    this.name = "GeocodingError";
  }
}

const photonEndpoint = "https://photon.komoot.io/api/";

/** Photon's default result count is small; five keeps the dropdown tidy. */
const defaultLimit = 5;
const maximumLimit = 20;

/** Upper bound on a single request so a hung connection cannot stall the UI forever. */
const requestTimeoutMs = 8000;

/**
 * Photon only honours a handful of interface languages. Passing an unsupported `lang` would
 * silently reshuffle results, so only these are ever forwarded; anything else is dropped.
 */
const photonLanguages = new Set(["en", "de", "fr", "it"]);
const defaultPhotonLanguage = "en";

/** Longest label we will hand back as a footprint name. */
const maxNameLength = 80;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reads a non-empty, trimmed string property, or null when missing/blank. */
function readString(properties: Record<string, unknown>, key: string): string | null {
  const value = properties[key];

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Builds a short, human-readable label suitable for a footprint tag.
 *
 * Rule: take the first available subject in priority order (name → city → street → state), then
 * append the country when it differs from the subject ("Kyoto, Japan"). Blank parts are skipped,
 * the subject/country pair is de-duplicated case-insensitively, and the result is capped at
 * {@link maxNameLength} characters with an ellipsis. Returns null when nothing usable is present.
 */
function composePlaceName(properties: Record<string, unknown>): string | null {
  const subject =
    readString(properties, "name") ??
    readString(properties, "city") ??
    readString(properties, "street") ??
    readString(properties, "state");

  if (subject === null) {
    return null;
  }

  const segments = [subject];
  const country = readString(properties, "country");

  if (country !== null && country.toLowerCase() !== subject.toLowerCase()) {
    segments.push(country);
  }

  const name = segments.join(", ");

  return name.length > maxNameLength
    ? `${name.slice(0, maxNameLength - 1).trimEnd()}…`
    : name;
}

function isValidLongitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

function isValidLatitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

/** Stable list key: prefer the OSM identity, fall back to the rounded coordinates. */
function composeId(
  properties: Record<string, unknown>,
  longitude: number,
  latitude: number,
): string {
  const osmId = properties.osm_id;

  if (typeof osmId === "number" || typeof osmId === "string") {
    const osmType = typeof properties.osm_type === "string" ? properties.osm_type : null;
    return osmType ? `${osmType}/${osmId}` : String(osmId);
  }

  return `${longitude},${latitude}`;
}

/** Parses a single GeoJSON feature, dropping anything without a usable name or valid coordinates. */
function parseFeature(feature: unknown): GeocodingResult | null {
  if (!isRecord(feature)) {
    return null;
  }

  const geometry = feature.geometry;

  if (!isRecord(geometry)) {
    return null;
  }

  const coordinates = geometry.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  const [longitude, latitude] = coordinates;

  if (!isValidLongitude(longitude) || !isValidLatitude(latitude)) {
    return null;
  }

  const properties = feature.properties;

  if (!isRecord(properties)) {
    return null;
  }

  const name = composePlaceName(properties);

  if (name === null) {
    return null;
  }

  return {
    id: composeId(properties, longitude, latitude),
    name,
    longitude,
    latitude,
  };
}

function parseCollection(payload: unknown): GeocodingResult[] {
  if (!isRecord(payload) || !Array.isArray(payload.features)) {
    throw new GeocodingError("Place search returned an unexpected payload");
  }

  const results: GeocodingResult[] = [];

  for (const feature of payload.features) {
    const parsed = parseFeature(feature);

    if (parsed !== null) {
      results.push(parsed);
    }
  }

  return results;
}

function resolveLimit(limit?: number): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return defaultLimit;
  }

  return Math.min(maximumLimit, Math.max(1, Math.floor(limit)));
}

/** Returns a whitelisted Photon language, the default when unspecified, or null to omit it. */
function resolvePhotonLanguage(lang?: string): string | null {
  if (lang === undefined) {
    return defaultPhotonLanguage;
  }

  const normalized = lang.trim().toLowerCase();
  return photonLanguages.has(normalized) ? normalized : null;
}

/**
 * Searches places via Photon. Resolves to an empty list for a blank query (no request is made)
 * and rejects with a {@link GeocodingError} for every other failure, including a caller abort or
 * the internal timeout. The caller's `signal` and the internal timeout are linked so either can
 * cancel the in-flight request.
 */
export async function searchPlaces(
  query: string,
  options: { signal?: AbortSignal; limit?: number; lang?: string } = {},
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    return [];
  }

  const url = new URL(photonEndpoint);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("limit", String(resolveLimit(options.limit)));

  const language = resolvePhotonLanguage(options.lang);

  if (language !== null) {
    url.searchParams.set("lang", language);
  }

  const controller = new AbortController();
  const externalSignal = options.signal;
  const abortFromExternal = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", abortFromExternal, { once: true });
    }
  }

  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url.toString(), { signal: controller.signal });

    if (!response.ok) {
      throw new GeocodingError(`Place search responded with ${response.status}`);
    }

    const payload: unknown = await response.json();

    return parseCollection(payload);
  } catch (error) {
    if (error instanceof GeocodingError) {
      throw error;
    }

    // Network failures, timeouts and aborts all land here.
    throw new GeocodingError("Place search request failed", { cause: error });
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", abortFromExternal);
  }
}
