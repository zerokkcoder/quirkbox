import { describe, expect, it } from "vitest";
import { buildMatrix } from "./matrix";
import { contrastRatio, hasLowContrast, luminance } from "./render";
import { matrixToSvg } from "./svg";

const matrix = buildMatrix("https://starrudder.cc", "M");

describe("qr code generator svg and contrast", () => {
  it("serializes a standalone SVG with a quiet zone", () => {
    const svg = matrixToSvg(matrix, {
      foreground: "10182c",
      background: "ffffff",
      dots: "square",
      transparent: false,
    });
    expect(svg).toContain("<svg");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain("<rect");
    expect(svg).toContain("</svg>");
    expect(svg).not.toContain("<image");
  });

  it("uses circles for dots and omits the background rect when transparent", () => {
    const dots = matrixToSvg(matrix, {
      foreground: "000000",
      background: "ffffff",
      dots: "dots",
      transparent: true,
    });
    expect(dots).toContain("<circle");
    expect(dots).not.toContain('<rect width=');
  });

  it("embeds a logo when a data URL is provided", () => {
    const svg = matrixToSvg(matrix, {
      foreground: "000000",
      background: "ffffff",
      dots: "square",
      transparent: false,
      logoDataUrl: "data:image/png;base64,AAAA",
      logoWidth: 100,
      logoHeight: 50,
    });
    expect(svg).toContain("<image");
    expect(svg).toContain("data:image/png;base64,AAAA");
  });

  it("computes WCAG contrast and flags low-contrast pairs", () => {
    expect(contrastRatio("000000", "ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("ffffff", "ffffff")).toBeCloseTo(1, 1);
    expect(luminance("ffffff")).toBeCloseTo(1, 2);
    expect(hasLowContrast("ffffff", "ffffff")).toBe(true);
    expect(hasLowContrast("000000", "ffffff")).toBe(false);
  });
});
