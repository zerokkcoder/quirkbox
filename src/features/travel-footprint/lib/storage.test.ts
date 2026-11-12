import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  parseTravelFootprintState,
  readTravelFootprintState,
  travelFootprintStorageKey,
  writeTravelFootprintState,
} from "@/features/travel-footprint/lib/storage";
import {
  DEFAULT_TRAVEL_FOOTPRINT_STATE,
  type TravelFootprintState,
} from "@/features/travel-footprint/lib/types";

const sampleState: TravelFootprintState = {
  ...DEFAULT_TRAVEL_FOOTPRINT_STATE,
  home: { id: "home", name: "Shanghai", longitude: 121.4737, latitude: 31.2304 },
  spots: [{ id: "s1", name: "Beijing", longitude: 116.4074, latitude: 39.9042 }],
  lineStyle: "dashed",
  lineColor: "coral",
};

describe("travel footprint storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the default empty state when window is undefined", () => {
    vi.stubGlobal("window", undefined);

    expect(readTravelFootprintState()).toEqual(DEFAULT_TRAVEL_FOOTPRINT_STATE);
  });

  it("returns the default empty state when localStorage is missing", () => {
    vi.stubGlobal("window", {});

    expect(readTravelFootprintState()).toEqual(DEFAULT_TRAVEL_FOOTPRINT_STATE);
  });

  it("returns the default empty state when localStorage throws", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
      },
    });

    expect(readTravelFootprintState()).toEqual(DEFAULT_TRAVEL_FOOTPRINT_STATE);
  });

  it("returns the default empty state for malformed JSON", () => {
    window.localStorage.setItem(travelFootprintStorageKey, "{ not json");

    expect(readTravelFootprintState()).toEqual(DEFAULT_TRAVEL_FOOTPRINT_STATE);
  });

  it("returns the default empty state when the payload is not an object", () => {
    window.localStorage.setItem(travelFootprintStorageKey, JSON.stringify(42));

    expect(readTravelFootprintState()).toEqual(DEFAULT_TRAVEL_FOOTPRINT_STATE);
  });

  it("round-trips a valid state", () => {
    writeTravelFootprintState(sampleState);

    expect(readTravelFootprintState()).toEqual(sampleState);
  });

  it("drops individual invalid spots but keeps the good ones", () => {
    const state = parseTravelFootprintState({
      home: { id: "", name: "bad", longitude: 0, latitude: 0 },
      spots: [
        { id: "ok", name: "Fine", longitude: 10, latitude: 20 },
        { id: "bad-lon", name: "Off", longitude: 200, latitude: 0 },
        { id: "nan", name: "NaN", longitude: Number.NaN, latitude: 0 },
        { id: "bad-lat", name: "Off", longitude: 0, latitude: 91 },
        { id: "no-name", longitude: 0, latitude: 0 },
        "not-a-spot",
      ],
      lineStyle: "dashed",
      lineColor: "amber",
    });

    expect(state.home).toBeNull();
    expect(state.spots).toEqual([{ id: "ok", name: "Fine", longitude: 10, latitude: 20 }]);
    expect(state.lineStyle).toBe("dashed");
    expect(state.lineColor).toBe("amber");
  });

  it("discards the whole list when spots is not an array", () => {
    const state = parseTravelFootprintState({ ...sampleState, spots: "nope" });

    expect(state.spots).toEqual([]);
  });

  it("discards an oversized spots list", () => {
    const spots = Array.from({ length: 1001 }, (_, index) => ({
      id: `s${index}`,
      name: "spot",
      longitude: 0,
      latitude: 0,
    }));

    const state = parseTravelFootprintState({ ...sampleState, spots });

    expect(state.spots).toEqual([]);
  });

  it("falls back to default line style and color for unknown enum values", () => {
    const state = parseTravelFootprintState({
      home: null,
      spots: [],
      lineStyle: "neon",
      lineColor: "magenta",
    });

    expect(state.lineStyle).toBe(DEFAULT_TRAVEL_FOOTPRINT_STATE.lineStyle);
    expect(state.lineColor).toBe(DEFAULT_TRAVEL_FOOTPRINT_STATE.lineColor);
  });

  it("normalizes the extended style fields", () => {
    const state = parseTravelFootprintState({
      ...sampleState,
      lineWidth: 42,
      animation: "comet",
      lineShape: "arc",
      connectMode: "chain",
    });

    expect(state).toMatchObject({
      lineWidth: 8,
      animation: "comet",
      lineShape: "arc",
      connectMode: "chain",
    });
  });

  it("fills extended style defaults for a legacy payload", () => {
    const legacy = parseTravelFootprintState({
      home: null,
      spots: [],
      lineStyle: "solid",
      lineColor: "ocean",
    });

    expect(legacy).toEqual(DEFAULT_TRAVEL_FOOTPRINT_STATE);
  });
});
