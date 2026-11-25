import { describe, expect, it } from "vitest";
import {
  needsBackground,
  normalizeBackground,
  normalizeQuality,
  parseImageStudioState,
  stateToParams,
  supportsQuality,
} from "./settings";
import { defaultFormat, defaultQuality } from "./types";

describe("image studio settings", () => {
  it("falls back to defaults for an empty URL", () => {
    const state = parseImageStudioState({});
    expect(state).toEqual({
      format: defaultFormat,
      quality: defaultQuality,
      width: 0,
      height: 0,
      background: "ffffff",
      suffix: true,
    });
  });

  it("reads and normalizes every supported parameter", () => {
    const state = parseImageStudioState({
      format: "jpeg",
      quality: "62",
      width: "800",
      height: "600",
      bg: "#ABC",
      suffix: "0",
    });

    expect(state).toEqual({
      format: "jpeg",
      quality: 62,
      width: 800,
      height: 600,
      background: "aabbcc",
      suffix: false,
    });
  });

  it("ignores unknown parameters such as the retired preset flag", () => {
    const state = parseImageStudioState({ preset: "whiteJpg", format: "png" });
    expect(state.format).toBe("png");
    expect(state).not.toHaveProperty("preset");
  });

  it("clamps out-of-range values instead of throwing", () => {
    expect(normalizeQuality("0")).toBe(1);
    expect(normalizeQuality("999")).toBe(100);
    expect(normalizeQuality("abc")).toBe(defaultQuality);

    const state = parseImageStudioState({ width: "-5", height: "99999" });
    expect(state.width).toBe(0);
    expect(state.height).toBe(8192);
  });

  it("normalizes background input in several notations", () => {
    expect(normalizeBackground("#fff")).toBe("ffffff");
    expect(normalizeBackground("1B2C3D")).toBe("1b2c3d");
    expect(normalizeBackground("not-a-color")).toBe("ffffff");
    expect(normalizeBackground(undefined)).toBe("ffffff");
  });

  it("omits default values from the shareable parameters", () => {
    const params = stateToParams(parseImageStudioState({}));
    expect(params.format).toBe(defaultFormat);
    expect(params.quality).toBe(String(defaultQuality));
    expect(params.width).toBeUndefined();
    expect(params.height).toBeUndefined();
    expect(params.bg).toBeUndefined();
    expect(params.suffix).toBeUndefined();
  });

  it("only offers quality where the encoder honours it", () => {
    expect(supportsQuality("jpeg")).toBe(true);
    expect(supportsQuality("webp")).toBe(true);
    expect(supportsQuality("avif")).toBe(true);
    expect(supportsQuality("gif")).toBe(true);
    expect(supportsQuality("png")).toBe(false);
    expect(supportsQuality("bmp")).toBe(false);
    expect(supportsQuality("ico")).toBe(false);
  });

  it("only asks for a background when alpha cannot be stored", () => {
    expect(needsBackground("jpeg")).toBe(true);
    expect(needsBackground("bmp")).toBe(true);
    expect(needsBackground("gif")).toBe(true);
    expect(needsBackground("png")).toBe(false);
    expect(needsBackground("webp")).toBe(false);
    expect(needsBackground("avif")).toBe(false);
    expect(needsBackground("ico")).toBe(false);
  });
});
