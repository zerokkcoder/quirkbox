import { describe, expect, it } from "vitest";
import {
  hexToRgb,
  normalizeHex,
  normalizeHue,
  oklchToHex,
  rgbToHex,
  rgbToOklch,
  withHash,
} from "@/features/palette-studio/lib/color";

describe("color conversion", () => {
  it("normalizes hex input and falls back on invalid values", () => {
    expect(normalizeHex("#3E5C9E")).toBe("3e5c9e");
    expect(normalizeHex("abc")).toBe("aabbcc");
    expect(normalizeHex("  #FFF ")).toBe("ffffff");
    expect(normalizeHex("nope")).toBe("3e5c9e");
    expect(normalizeHex("12345")).toBe("3e5c9e");
    expect(withHash("3E5C9E")).toBe("#3e5c9e");
  });

  it("round-trips hex through RGB", () => {
    for (const hex of ["000000", "ffffff", "3e5c9e", "ff00ff", "123456"]) {
      expect(rgbToHex(hexToRgb(hex))).toBe(hex);
    }
  });

  it("round-trips sRGB through OKLCH within one byte", () => {
    for (const hex of ["000000", "ffffff", "3e5c9e", "ff00ff", "abcdef"]) {
      const rgb = hexToRgb(hex);
      expect(rgbToHex(hexToRgb(oklchToHex(rgbToOklch(rgb))))).toBe(hex);
    }
  });

  it("keeps gamut-mapped conversion valid for extreme colours", () => {
    for (const hex of ["00ff00", "ffff00", "00ffff", "ff0000"]) {
      expect(oklchToHex(rgbToOklch(hexToRgb(hex)))).toMatch(/^[0-9a-f]{6}$/);
    }
  });

  it("wraps hue into 0-360", () => {
    expect(normalizeHue(-10)).toBe(350);
    expect(normalizeHue(370)).toBe(10);
    expect(normalizeHue(360)).toBe(0);
  });
});
