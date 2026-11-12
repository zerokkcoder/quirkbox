import { describe, expect, it } from "vitest";
import {
  boundsOf,
  formatDistanceKm,
  haversineDistanceKm,
  type Coordinates,
} from "@/features/travel-footprint/lib/geodesy";

const shanghai: Coordinates = { longitude: 121.4737, latitude: 31.2304 };
const beijing: Coordinates = { longitude: 116.4074, latitude: 39.9042 };

describe("haversineDistanceKm", () => {
  it("measures the Shanghai to Beijing route within a 2% tolerance of 1060 km", () => {
    const km = haversineDistanceKm(shanghai, beijing);

    expect(km).toBeGreaterThan(1060 * 0.98);
    expect(km).toBeLessThan(1060 * 1.02);
  });

  it("returns zero for a point against itself", () => {
    expect(haversineDistanceKm(shanghai, shanghai)).toBe(0);
  });

  it("is symmetric", () => {
    expect(haversineDistanceKm(shanghai, beijing)).toBe(haversineDistanceKm(beijing, shanghai));
  });
});

describe("boundsOf", () => {
  it("returns null for an empty list", () => {
    expect(boundsOf([])).toBeNull();
  });

  it("returns a degenerate box for a single point", () => {
    expect(boundsOf([shanghai])).toEqual({
      west: shanghai.longitude,
      east: shanghai.longitude,
      south: shanghai.latitude,
      north: shanghai.latitude,
    });
  });

  it("spans the extremes of multiple points", () => {
    expect(boundsOf([shanghai, beijing])).toEqual({
      west: beijing.longitude,
      east: shanghai.longitude,
      south: shanghai.latitude,
      north: beijing.latitude,
    });
  });
});

describe("formatDistanceKm", () => {
  it("groups whole kilometers without decimals", () => {
    expect(formatDistanceKm(1060, "en-US")).toBe("1,060");
  });

  it("keeps a single decimal below 100 km", () => {
    expect(formatDistanceKm(42.42, "en-US")).toBe("42.4");
  });
});
