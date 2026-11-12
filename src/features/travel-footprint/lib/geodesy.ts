export type Coordinates = { longitude: number; latitude: number };

export type BoundingBox = { west: number; south: number; east: number; north: number };

/** Mean Earth radius in kilometers (IUGG). */
const earthRadiusKm = 6371.0088;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in kilometers between two coordinates, via the haversine formula. */
export function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLon = Math.sin(dLon / 2);

  const h = sinHalfLat * sinHalfLat + Math.cos(lat1) * Math.cos(lat2) * sinHalfLon * sinHalfLon;

  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Axis-aligned bounding box of the given points, or null when there are none. */
export function boundsOf(points: Coordinates[]): BoundingBox | null {
  if (points.length === 0) {
    return null;
  }

  let west = points[0].longitude;
  let east = points[0].longitude;
  let south = points[0].latitude;
  let north = points[0].latitude;

  for (const point of points) {
    west = Math.min(west, point.longitude);
    east = Math.max(east, point.longitude);
    south = Math.min(south, point.latitude);
    north = Math.max(north, point.latitude);
  }

  return { west, south, east, north };
}

/**
 * Formats a distance in kilometers: sub-100 km values keep a single decimal, larger values are
 * rounded to whole kilometers with the locale's grouping separators.
 */
export function formatDistanceKm(km: number, locale?: string): string {
  const maximumFractionDigits = km < 100 ? 1 : 0;

  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(km);
}
