import { describe, expect, it } from "vitest";
import { buildCssGradient, sortedStops, stopToCss } from "./gradient";
import { getGradientWallpaperSize } from "./sizes";
import type { GradientState } from "./types";

const state: GradientState = {
  seed: "test",
  stops: [
    { id: "a", color: "ffffff", position: 100 },
    { id: "b", color: "3e5c9e", position: 0 },
    { id: "c", color: "aabbcc", position: 40 },
  ],
  type: "linear",
  angle: 135,
  center: "center",
  ratio: "9:16",
  showText: false,
};

describe("gradient helpers", () => {
  it("builds linear CSS with sorted stops", () => {
    expect(buildCssGradient(state)).toBe(
      "linear-gradient(135deg, #3e5c9e 0%, #aabbcc 40%, #ffffff 100%)"
    );
  });

  it("builds radial and conic CSS with center", () => {
    expect(buildCssGradient({ ...state, type: "radial", center: "top-left" })).toBe(
      "radial-gradient(circle at 0% 0%, #3e5c9e 0%, #aabbcc 40%, #ffffff 100%)"
    );
    expect(buildCssGradient({ ...state, type: "conic", angle: 0, center: "bottom-right" })).toBe(
      "conic-gradient(from 0deg at 100% 100%, #3e5c9e 0%, #aabbcc 40%, #ffffff 100%)"
    );
  });

  it("formats and sorts stops", () => {
    expect(stopToCss({ id: "x", color: "#abcdef", position: 25 })).toBe("#abcdef 25%");
    expect(sortedStops(state.stops).map((stop) => stop.position)).toEqual([0, 40, 100]);
  });

  it("exposes all six wallpaper sizes", () => {
    expect(getGradientWallpaperSize("9:16")).toEqual({ width: 2160, height: 3840 });
    expect(getGradientWallpaperSize("16:10")).toEqual({ width: 2560, height: 1600 });
    expect(getGradientWallpaperSize("bad")).toEqual({ width: 2160, height: 3840 });
  });
});
