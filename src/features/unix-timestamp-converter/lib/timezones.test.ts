import { describe, expect, it } from "vitest";
import {
  allZoneOptions,
  filterZones,
  groupZones,
  localTimeZone,
  resolveZone,
  zoneOffsetLabel,
} from "./timezones";
import { localZoneId, utcZoneId } from "./types";

describe("allZoneOptions", () => {
  it("pins local and UTC first and exposes the full runtime list", () => {
    const zones = allZoneOptions();
    expect(zones[0]).toBe(localZoneId);
    expect(zones[1]).toBe(utcZoneId);
    expect(zones.length).toBeGreaterThan(100);
    expect(zones).toContain("Asia/Tokyo");
    expect(zones).toContain("America/New_York");
    expect(new Set(zones).size).toBe(zones.length);
  });
});

describe("filterZones", () => {
  it("matches city and area names case-insensitively", () => {
    const zones = allZoneOptions();
    expect(filterZones(zones, "tokyo")).toEqual(["Asia/Tokyo"]);
    expect(filterZones(zones, "ASIA/TOKYO")).toEqual(["Asia/Tokyo"]);

    const asia = filterZones(zones, "Asia/");
    expect(asia.length).toBeGreaterThan(10);
    expect(asia.every((zone) => zone.startsWith("Asia/"))).toBe(true);
  });

  it("returns a copy of the full list for a blank query", () => {
    const zones = allZoneOptions();
    expect(filterZones(zones, "   ")).toEqual(zones);
    expect(filterZones(zones, "   ")).not.toBe(zones);
  });

  it("returns nothing when no zone matches", () => {
    expect(filterZones(allZoneOptions(), "Mars/Olympus")).toEqual([]);
  });
});

describe("groupZones", () => {
  it("groups by IANA area with local and UTC first", () => {
    const groups = groupZones(allZoneOptions());
    expect(groups[0].label).toBe(localZoneId);
    expect(groups[1].label).toBe(utcZoneId);

    const asia = groups.find((group) => group.label === "Asia");
    expect(asia?.zones).toContain("Asia/Tokyo");
    expect(asia?.zones).toContain("Asia/Taipei");
    expect(groups.find((group) => group.label === "Europe")?.zones).toContain(
      "Europe/London"
    );
  });

  it("keeps every zone exactly once", () => {
    const zones = allZoneOptions();
    const grouped = groupZones(zones).flatMap((group) => group.zones);
    expect(grouped).toHaveLength(zones.length);
    expect(new Set(grouped).size).toBe(zones.length);
  });
});

describe("resolveZone / localTimeZone", () => {
  it("resolves the local sentinel to an IANA name", () => {
    expect(resolveZone(localZoneId)).toBe(localTimeZone());
    expect(localTimeZone()).not.toBe("");
    expect(resolveZone("Asia/Tokyo")).toBe("Asia/Tokyo");
  });
});

describe("zoneOffsetLabel", () => {
  it("reports the offset for the given instant, not a fixed one", () => {
    const january = new Date("2026-01-15T12:00:00Z");
    const july = new Date("2026-07-15T12:00:00Z");
    expect(zoneOffsetLabel("UTC", january, "en")).toContain("GMT");
    expect(zoneOffsetLabel("America/New_York", january, "en")).not.toBe(
      zoneOffsetLabel("America/New_York", july, "en")
    );
  });
});
