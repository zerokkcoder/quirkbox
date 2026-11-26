import { describe, expect, it } from "vitest";
import {
  clampAngle,
  normalizeHex,
  parseGradientState,
  parseStops,
  serializeStops,
  stateToParams,
} from "./settings";
import type { GradientState } from "./types";

const sample: GradientState = {
  seed: "航海-2026",
  stops: [
    { id: "a", color: "3e5c9e", position: 0 },
    { id: "b", color: "f4c38f", position: 55 },
    { id: "c", color: "ffffff", position: 100 },
  ],
  type: "conic",
  angle: 210,
  center: "top-right",
  ratio: "16:9",
  showText: true,
};

describe("gradient URL state", () => {
  it("round-trips the full state including Chinese seed", () => {
    const params = stateToParams(sample);
    const search = new URLSearchParams(params as Record<string, string>);
    const restored = parseGradientState(search);

    expect(restored).toEqual(sample);
  });

  it("falls back to seeded palette for malformed stops", () => {
    expect(parseStops("nonsense", "abc").length).toBeGreaterThanOrEqual(2);
    expect(parseStops("zzzzzz@0,ffffff@100", "abc")[0].color).not.toBe("zzzzzz");
  });

  it("normalizes invalid values instead of throwing", () => {
    const parsed = parseGradientState({
      type: "unknown",
      angle: "9999",
      ratio: "1:1",
      center: "nope",
      stops: "zzzzzz@0,ffffff@100",
      text: "yes",
    });

    expect(parsed.type).toBe("linear");
    expect(parsed.angle).toBe(279);
    expect(parsed.ratio).toBe("9:16");
    expect(parsed.center).toBe("center");
    expect(parsed.showText).toBe(false);
    expect(parseStops("zzzzzz@0,ffffff@100", parsed.seed)[0].color).toMatch(/^[0-9a-f]{6}$/);
  });

  it("normalizes color helpers", () => {
    expect(normalizeHex("#ABCDEF")).toBe("abcdef");
    expect(normalizeHex("nope")).toBe("3e5c9e");
    expect(clampAngle(-30)).toBe(330);
    expect(serializeStops(sample.stops)).toBe("3e5c9e@0,f4c38f@55,ffffff@100");
  });
});
