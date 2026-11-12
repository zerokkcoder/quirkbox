import { describe, expect, it } from "vitest";
import {
  buildConnectorCoordinates,
  buildConnectors,
  connectorsToGeoJSON,
  findFurthestSpot,
  fitBoundsForPoints,
  totalRouteDistanceKm,
  unwrapLongitude,
} from "@/features/travel-footprint/lib/geometry";
import type { FootprintSpot } from "@/features/travel-footprint/lib/types";

const home: FootprintSpot = { id: "h", name: "Home", longitude: 121.4737, latitude: 31.2304 };
const beijing: FootprintSpot = { id: "b", name: "Beijing", longitude: 116.4074, latitude: 39.9042 };
const tokyo: FootprintSpot = { id: "t", name: "Tokyo", longitude: 139.6917, latitude: 35.6895 };

describe("unwrapLongitude", () => {
  it("keeps nearby longitudes untouched", () => {
    expect(unwrapLongitude(120, 139)).toBe(139);
  });

  it("takes the short path across the antimeridian", () => {
    expect(unwrapLongitude(170, -170)).toBe(190);
    expect(unwrapLongitude(-170, 170)).toBe(-190);
  });
});

describe("buildConnectorCoordinates", () => {
  it("returns two unwrapped endpoints for a straight line", () => {
    expect(buildConnectorCoordinates(home, beijing, "straight")).toEqual([
      [121.4737, 31.2304],
      [116.4074, 39.9042],
    ]);
  });

  it("samples a curved line and preserves its endpoints", () => {
    const coordinates = buildConnectorCoordinates(home, beijing, "arc", 8);
    expect(coordinates).toHaveLength(9);
    expect(coordinates[0]).toEqual([121.4737, 31.2304]);
    expect(coordinates[8]).toEqual([116.4074, 39.9042]);
    expect(coordinates[4][1]).not.toBe((31.2304 + 39.9042) / 2);
  });
});

describe("buildConnectors", () => {
  it("returns nothing without a home", () => {
    expect(buildConnectors(null, [beijing], "star", "straight")).toEqual([]);
  });

  it("draws one spoke per spot in star mode", () => {
    expect(buildConnectors(home, [beijing, tokyo], "star", "straight")).toHaveLength(2);
  });

  it("joins spots in order in chain mode", () => {
    const connectors = buildConnectors(home, [beijing, tokyo], "chain", "straight");
    expect(connectors).toHaveLength(2);
    expect(connectors[0][1]).toEqual([116.4074, 39.9042]);
    expect(connectors[1][0]).toEqual([116.4074, 39.9042]);
    expect(connectors[1][1]).toEqual([139.6917, 35.6895]);
  });

  it("keeps chain endpoints in one unwrapped frame across the antimeridian", () => {
    const pacificHome: FootprintSpot = { id: "h", name: "H", longitude: 170, latitude: 10 };
    const east: FootprintSpot = { id: "e", name: "E", longitude: -170, latitude: 20 };
    const west: FootprintSpot = { id: "w", name: "W", longitude: 160, latitude: 30 };
    const connectors = buildConnectors(pacificHome, [east, west], "chain", "straight");

    expect(connectors[0][1]).toEqual([190, 20]);
    expect(connectors[1][0]).toEqual([190, 20]);
    expect(connectors[1][1]).toEqual([160, 30]);
  });

  it("produces valid GeoJSON features", () => {
    const data = connectorsToGeoJSON(buildConnectors(home, [beijing], "star", "arc"));
    expect(data.type).toBe("FeatureCollection");
    expect(data.features[0].geometry.type).toBe("LineString");
  });
});

describe("route statistics", () => {
  it("sums spokes in star mode and legs in chain mode", () => {
    const star = totalRouteDistanceKm(home, [beijing, tokyo], "star");
    const chain = totalRouteDistanceKm(home, [beijing, tokyo], "chain");
    expect(star).toBeGreaterThan(0);
    expect(chain).toBeGreaterThan(0);
    expect(star).not.toBeCloseTo(chain, 0);
  });

  it("returns zero without a home", () => {
    expect(totalRouteDistanceKm(null, [beijing], "star")).toBe(0);
  });

  it("finds the spot furthest from home", () => {
    const furthest = findFurthestSpot(home, [beijing, tokyo]);
    expect(furthest?.spot.id).toBe("t");
    expect(furthest?.km).toBeGreaterThan(0);
  });
});

describe("fitBoundsForPoints", () => {
  it("returns null for no points", () => {
    expect(fitBoundsForPoints([])).toBeNull();
  });

  it("unwraps a Pacific crossing into a narrow box", () => {
    const bounds = fitBoundsForPoints([
      { longitude: 170, latitude: 35 },
      { longitude: -170, latitude: 40 },
    ]);
    expect(bounds).toEqual({ west: 170, east: 190, south: 35, north: 40 });
  });
});
