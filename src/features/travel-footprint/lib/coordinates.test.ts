import { describe, expect, it } from "vitest";
import {
  formatCoordinates,
  parseCoordinateInput,
  parseCoordinatePair,
  roundCoordinate,
} from "@/features/travel-footprint/lib/coordinates";

describe("parseCoordinateInput", () => {
  it("parses two separate fields", () => {
    expect(parseCoordinateInput("31.2304", "121.4737")).toEqual({
      latitude: 31.2304,
      longitude: 121.4737,
    });
  });

  it("accepts a pasted pair in the latitude field", () => {
    expect(parseCoordinateInput("31.2304, 121.4737", "")).toEqual({
      latitude: 31.2304,
      longitude: 121.4737,
    });
  });

  it("rejects blank, non-numeric and out-of-range values", () => {
    expect(parseCoordinateInput("", "")).toBeNull();
    expect(parseCoordinateInput("31", "")).toBeNull();
    expect(parseCoordinateInput("abc", "121")).toBeNull();
    expect(parseCoordinateInput("91", "121")).toBeNull();
    expect(parseCoordinateInput("31", "181")).toBeNull();
  });
});

describe("parseCoordinatePair", () => {
  it("handles full-width commas and extra whitespace", () => {
    expect(parseCoordinatePair("31.2304，  121.4737")).toEqual({
      latitude: 31.2304,
      longitude: 121.4737,
    });
  });

  it("rejects anything that is not exactly two numbers", () => {
    expect(parseCoordinatePair("31.2304")).toBeNull();
    expect(parseCoordinatePair("31, 121, 9")).toBeNull();
  });
});

describe("formatting helpers", () => {
  it("rounds dragged coordinates", () => {
    expect(roundCoordinate(121.47369999)).toBe(121.4737);
  });

  it("formats a stable lat, lng label", () => {
    expect(formatCoordinates(31.2304, 121.4737)).toBe("31.2304, 121.4737");
  });
});
