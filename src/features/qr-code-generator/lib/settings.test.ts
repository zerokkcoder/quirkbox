import { describe, expect, it } from "vitest";
import {
  decodeText,
  encodeText,
  normalizeDotStyle,
  normalizeHex,
  normalizeLevel,
  normalizeSize,
  parseQrState,
  stateToParams,
  textByteLength,
} from "./settings";
import {
  defaultBackground,
  defaultForeground,
  defaultLevel,
  defaultSize,
  defaultText,
  defaultDotStyle,
} from "./types";

describe("qr code generator settings", () => {
  it("falls back to defaults for an empty URL", () => {
    expect(parseQrState({})).toEqual({
      text: defaultText,
      level: defaultLevel,
      size: defaultSize,
      foreground: defaultForeground,
      background: defaultBackground,
      dots: defaultDotStyle,
      transparent: false,
    });
  });

  it("round-trips text through base64url, including Chinese and emoji", () => {
    for (const text of ["https://starrudder.cc?a=1&b=2", "星舵工坊", "emoji 🚢 ⚓", "混合 mixed 中文 test"]) {
      expect(decodeText(encodeText(text))).toBe(text);
    }
  });

  it("reads and normalizes every supported parameter", () => {
    const encoded = encodeText("https://example.com/path?q=1");
    const state = parseQrState({
      text: encoded,
      ec: "H",
      size: "1024",
      fg: "#ABC",
      bg: "112233",
      dots: "rounded",
      alpha: "1",
    });
    expect(state).toEqual({
      text: "https://example.com/path?q=1",
      level: "H",
      size: 1024,
      foreground: "aabbcc",
      background: "112233",
      dots: "rounded",
      transparent: true,
    });
  });

  it("ignores unknown and out-of-range parameters", () => {
    expect(normalizeLevel("Z")).toBe(defaultLevel);
    expect(normalizeSize("999")).toBe(defaultSize);
    expect(normalizeDotStyle("triangle")).toBe(defaultDotStyle);
    expect(normalizeHex("nope", defaultForeground)).toBe(defaultForeground);
    expect(parseQrState({ legacy: "1", ec: "Q" }).level).toBe("Q");
  });

  it("falls back to the default text for malformed base64url", () => {
    expect(decodeText("%%%not-base64%%%")).toBe(defaultText);
  });

  it("omits default values from the shareable parameters", () => {
    const params = stateToParams(parseQrState({}));
    expect(params.text).toBeUndefined();
    expect(params.ec).toBeUndefined();
    expect(params.size).toBeUndefined();
    expect(params.fg).toBeUndefined();
    expect(params.bg).toBeUndefined();
    expect(params.dots).toBeUndefined();
    expect(params.alpha).toBeUndefined();
  });

  it("counts UTF-8 bytes, not JS code units", () => {
    expect(textByteLength("abc")).toBe(3);
    expect(textByteLength("中")).toBe(3);
    expect(textByteLength("🚢")).toBe(4);
  });
});
