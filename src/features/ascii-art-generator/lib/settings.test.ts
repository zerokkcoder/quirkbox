import { describe, expect, it } from "vitest";
import {
  decodeText,
  encodeText,
  isDefaultState,
  parseAsciiState,
  stateToParams,
} from "./settings";
import { defaultAsciiState, maxTextLength } from "./types";

describe("ascii art URL state", () => {
  it("round-trips UTF-8 text through base64url", () => {
    const text = "Hi 星舵 🚢?";
    expect(decodeText(encodeText(text))).toBe(text);
  });

  it("falls back to default text for invalid or missing encodings", () => {
    expect(decodeText(undefined)).toBe("HELLO");
    expect(decodeText("!!!not-base64!!!")).toBe("HELLO");
  });

  it("omits defaults from share params", () => {
    expect(stateToParams(defaultAsciiState)).toEqual({});
    expect(isDefaultState(defaultAsciiState)).toBe(true);
  });

  it("round-trips a full text state through query params", () => {
    const state = {
      ...defaultAsciiState,
      text: "StarRudder",
      font: "slant" as const,
      gap: 2,
      vGap: 3,
      flip: true,
      align: "center" as const,
      background: "space" as const,
    };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(stateToParams(state))) {
      if (value !== undefined) params.set(key, value);
    }
    expect(parseAsciiState(params)).toEqual(state);
  });

  it("round-trips image settings without serialising the image itself", () => {
    const state = {
      ...defaultAsciiState,
      mode: "image" as const,
      width: 120,
      ramp: "braille" as const,
      brightness: -35,
      contrast: 1.4,
      invert: true,
      dither: "floyd-steinberg" as const,
    };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(stateToParams(state))) {
      if (value !== undefined) params.set(key, value);
    }
    expect(params.has("image")).toBe(false);
    expect(parseAsciiState(params)).toEqual(state);
  });

  it("accepts the record form of search params", () => {
    expect(parseAsciiState({ font: "big", gap: "3", align: ["right"] })).toMatchObject({
      font: "big",
      gap: 3,
      align: "right",
    });
  });

  it("clamps invalid values instead of throwing", () => {
    const state = parseAsciiState({
      font: "unknown",
      gap: "99",
      align: "sideways",
      bg: "red",
      width: "999",
      ramp: "nope",
      brightness: "999",
      contrast: "9",
      dither: "none-at-all",
      text: encodeText("A".repeat(maxTextLength + 5)),
    });
    expect(state.font).toBe("standard");
    expect(state.gap).toBe(6);
    expect(state.align).toBe("left");
    expect(state.background).toBe("transparent");
    expect(state.width).toBe(160);
    expect(state.ramp).toBe("classic");
    expect(state.brightness).toBe(100);
    expect(state.contrast).toBe(2);
    expect(state.dither).toBe("none");
    expect(state.text).toHaveLength(maxTextLength);
  });
});
