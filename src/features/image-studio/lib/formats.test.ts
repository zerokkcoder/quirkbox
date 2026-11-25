import { describe, expect, it } from "vitest";
import { detectSourceFormat, formatExtension, normalizeFormat, suggestFormat, supportsQuality } from "./formats";

describe("image formats", () => {
  it("detects formats from MIME with extension fallback", () => {
    expect(detectSourceFormat({ type: "image/png", name: "shot.bin" })).toBe("png");
    expect(detectSourceFormat({ type: "", name: "photo.JPG" })).toBe("jpeg");
    expect(detectSourceFormat({ type: "image/svg+xml", name: "icon.svg" })).toBe("svg");
    expect(detectSourceFormat({ type: "image/vnd.microsoft.icon", name: "fav.ico" })).toBe("ico");
    expect(detectSourceFormat({ type: "application/octet-stream", name: "notes.txt" })).toBeNull();
  });

  it("normalizes output formats and extensions", () => {
    expect(normalizeFormat("webp")).toBe("webp");
    expect(normalizeFormat("SVG")).toBeNull();
    expect(normalizeFormat(undefined)).toBeNull();
    expect(formatExtension("jpeg")).toBe("jpg");
  });

  it("knows which formats have a quality control", () => {
    expect(supportsQuality("jpeg")).toBe(true);
    expect(supportsQuality("webp")).toBe(true);
    expect(supportsQuality("png")).toBe(false);
    expect(supportsQuality("ico")).toBe(false);
  });

  it("suggests a sensible default target", () => {
    expect(suggestFormat(null)).toBe("webp");
    expect(suggestFormat("png")).toBe("webp");
    expect(suggestFormat("svg")).toBe("webp");
    expect(suggestFormat("webp")).toBe("jpeg");
  });
});
