import { describe, expect, it } from "vitest";
import {
  parseTravelFootprintFile,
  serializeTravelFootprintState,
  travelFootprintFileVersion,
} from "@/features/travel-footprint/lib/data-transfer";
import { DEFAULT_TRAVEL_FOOTPRINT_STATE, type TravelFootprintState } from "@/features/travel-footprint/lib/types";

const state: TravelFootprintState = {
  ...DEFAULT_TRAVEL_FOOTPRINT_STATE,
  home: { id: "h", name: "Home", longitude: 121.4737, latitude: 31.2304 },
  spots: [{ id: "s", name: "Kyoto", longitude: 135.7681, latitude: 35.0116 }],
  lineStyle: "dotted",
  lineColor: "violet",
  lineWidth: 6,
  animation: "comet",
  lineShape: "arc",
  connectMode: "chain",
};

describe("travel footprint data transfer", () => {
  it("round-trips a versioned export", () => {
    const text = serializeTravelFootprintState(state, "2026-01-01T00:00:00.000Z");
    const envelope = JSON.parse(text);

    expect(envelope.app).toBe("quirkbox");
    expect(envelope.tool).toBe("travel-footprint");
    expect(envelope.version).toBe(travelFootprintFileVersion);
    expect(parseTravelFootprintFile(text)).toEqual(state);
  });

  it("accepts a bare state object", () => {
    expect(parseTravelFootprintFile(JSON.stringify(state))).toEqual(state);
  });

  it("rejects malformed or unrelated files", () => {
    expect(parseTravelFootprintFile("not json")).toBeNull();
    expect(parseTravelFootprintFile("42")).toBeNull();
    expect(parseTravelFootprintFile(JSON.stringify({ hello: "world" }))).toBeNull();
    expect(parseTravelFootprintFile(JSON.stringify({ spots: "nope" }))).toBeNull();
  });

  it("normalizes unknown enum values on import", () => {
    const imported = parseTravelFootprintFile(
      JSON.stringify({ ...state, animation: "teleport", lineWidth: 999 }),
    );

    expect(imported?.animation).toBe(DEFAULT_TRAVEL_FOOTPRINT_STATE.animation);
    expect(imported?.lineWidth).toBe(8);
  });
});
