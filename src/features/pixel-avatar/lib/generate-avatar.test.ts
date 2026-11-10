import { describe, expect, it } from "vitest";
import {
  avatarStyles,
  defaultAvatarStyle,
  generateAvatarDataUri,
  normalizeAvatarStyle,
} from "@/features/pixel-avatar/lib/generate-avatar";

describe("pixel avatar generator", () => {
  it("falls back to the default style when the value is unknown", () => {
    expect(normalizeAvatarStyle(undefined)).toBe(defaultAvatarStyle);
    expect(normalizeAvatarStyle("")).toBe(defaultAvatarStyle);
    expect(normalizeAvatarStyle("blobs")).toBe(defaultAvatarStyle);
    expect(normalizeAvatarStyle("pixelbot")).toBe("pixelbot");
    expect(normalizeAvatarStyle("identicon")).toBe("identicon");
  });

  it("renders an SVG data URI for every style", () => {
    for (const styleId of avatarStyles) {
      const uri = generateAvatarDataUri("quirkbox", { styleId });

      expect(uri.startsWith("data:image/svg+xml")).toBe(true);
      expect(decodeURIComponent(uri)).toContain("<svg");
    }
  });

  it("rebuilds the exact same image for the same seed", () => {
    expect(generateAvatarDataUri("quirkbox")).toBe(generateAvatarDataUri("quirkbox"));
  });

  it("varies the image between seeds and styles", () => {
    const base = generateAvatarDataUri("alpha", { styleId: "pixel-art" });

    expect(generateAvatarDataUri("bravo", { styleId: "pixel-art" })).not.toBe(base);
    expect(generateAvatarDataUri("alpha", { styleId: "pixelbot" })).not.toBe(base);
  });

  it("tints the art styles that paint their own background", () => {
    expect(generateAvatarDataUri("quirkbox", { styleId: "pixelbot", paletteId: "mint" })).not.toBe(
      generateAvatarDataUri("quirkbox", { styleId: "pixelbot", paletteId: "rose" })
    );
  });
});
