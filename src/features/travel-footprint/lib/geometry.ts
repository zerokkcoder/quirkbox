import type * as GeoJSON from "geojson";
import { boundsOf, haversineDistanceKm, type BoundingBox, type Coordinates } from "./geodesy";
import type { ConnectModeId, FootprintSpot, LineShapeId } from "./types";

export type LngLat = [number, number];

/** Sample count for curved connectors. */
const arcSamples = 48;

/** How far a curved connector bows away from the straight chord. */
const arcCurvature = 0.18;

/**
 * Shifts `to` by whole turns so it is within 180 degrees of `from`. This keeps
 * connectors crossing the antimeridian on the short (Pacific) side instead of
 * drawing a line all the way around the world.
 */
export function unwrapLongitude(from: number, to: number): number {
  let adjusted = to;
  while (adjusted - from > 180) adjusted -= 360;
  while (adjusted - from < -180) adjusted += 360;
  return adjusted;
}

/**
 * Builds a segment between two coordinates that are already in the same
 * unwrapped longitude frame. No further wrapping happens here, so a chain of
 * segments always lands on the same world copy as `fitBoundsForPoints`.
 */
function buildSegment(
  from: Coordinates,
  to: Coordinates,
  shape: LineShapeId,
  samples = arcSamples,
): LngLat[] {
  const x0 = from.longitude;
  const y0 = from.latitude;
  const x2 = to.longitude;
  const y2 = to.latitude;

  if (shape === "straight") return [[x0, y0], [x2, y2]];

  const dx = x2 - x0;
  const dy = y2 - y0;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return [[x0, y0], [x2, y2]];

  const cx = (x0 + x2) / 2 + (-dy / distance) * distance * arcCurvature;
  const cy = (y0 + y2) / 2 + (dx / distance) * distance * arcCurvature;
  const points: LngLat[] = [];
  const segments = Math.max(2, Math.floor(samples));

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const inverse = 1 - t;
    points.push([
      inverse * inverse * x0 + 2 * inverse * t * cx + t * t * x2,
      inverse * inverse * y0 + 2 * inverse * t * cy + t * t * y2,
    ]);
  }

  return points;
}

/** Public helper: one connector, with the destination unwrapped relative to the origin. */
export function buildConnectorCoordinates(
  from: Coordinates,
  to: Coordinates,
  shape: LineShapeId,
  samples = arcSamples,
): LngLat[] {
  return buildSegment(
    from,
    { longitude: unwrapLongitude(from.longitude, to.longitude), latitude: to.latitude },
    shape,
    samples,
  );
}

/**
 * All connectors for the current home/spots/config. Every spot is unwrapped
 * once against home's longitude, so both modes share a single longitude frame
 * that matches the auto-fit bounds — endpoints never drift into a different
 * world copy than their marker.
 */
export function buildConnectors(
  home: FootprintSpot | null,
  spots: FootprintSpot[],
  mode: ConnectModeId,
  shape: LineShapeId,
): LngLat[][] {
  if (!home || spots.length === 0) return [];

  const reference = home.longitude;
  const frame = spots.map((spot) => ({
    longitude: unwrapLongitude(reference, spot.longitude),
    latitude: spot.latitude,
  }));

  if (mode === "star") {
    return frame.map((spot) => buildSegment(home, spot, shape));
  }

  const connectors: LngLat[][] = [];
  let current: Coordinates = { longitude: home.longitude, latitude: home.latitude };

  for (const spot of frame) {
    const coordinates = buildSegment(current, spot, shape);
    connectors.push(coordinates);
    const end = coordinates[coordinates.length - 1];
    current = { longitude: end[0], latitude: end[1] };
  }

  return connectors;
}

/** GeoJSON FeatureCollection consumed by the MapLibre source. */
export function connectorsToGeoJSON(connectors: LngLat[][]): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  return {
    type: "FeatureCollection",
    features: connectors.map((coordinates, index) => ({
      type: "Feature",
      id: index,
      properties: { index },
      geometry: { type: "LineString", coordinates },
    })),
  };
}

/** Distance along the drawn route: sum of spokes in star mode, legs in chain mode. */
export function totalRouteDistanceKm(
  home: FootprintSpot | null,
  spots: FootprintSpot[],
  mode: ConnectModeId,
): number {
  if (!home) return 0;

  if (mode === "star") {
    return spots.reduce((total, spot) => total + haversineDistanceKm(home, spot), 0);
  }

  let total = 0;
  let previous: Coordinates = home;
  for (const spot of spots) {
    total += haversineDistanceKm(previous, spot);
    previous = spot;
  }
  return total;
}

/** The spot furthest from home (as the crow flies), for the summary stats. */
export function findFurthestSpot(
  home: FootprintSpot | null,
  spots: FootprintSpot[],
): { spot: FootprintSpot; km: number } | null {
  if (!home || spots.length === 0) return null;

  let best = { spot: spots[0], km: haversineDistanceKm(home, spots[0]) };
  for (const spot of spots.slice(1)) {
    const km = haversineDistanceKm(home, spot);
    if (km > best.km) best = { spot, km };
  }
  return best;
}

/**
 * Bounds for the auto-fit camera. Longitudes are unwrapped relative to the
 * first point so a Tokyo → San Francisco pair spans the Pacific rather than
 * the whole globe; MapLibre wraps the resulting LngLat values back into range
 * and treats a west > east box as an antimeridian crossing.
 */
export function fitBoundsForPoints(points: Coordinates[]): BoundingBox | null {
  if (points.length === 0) return null;

  const reference = points[0].longitude;
  return boundsOf(
    points.map((point) => ({
      longitude: unwrapLongitude(reference, point.longitude),
      latitude: point.latitude,
    })),
  );
}
