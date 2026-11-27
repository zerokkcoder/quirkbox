import { describe, expect, it } from "vitest";
import { renderImageAscii, type ImageGrid, type ImageRenderOptions } from "./image-render";

function makeGrid(width: number, height: number, paint: (x: number, y: number) => [number, number, number]): ImageGrid {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = paint(x, y);
      const index = (y * width + x) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255;
    }
  }
  return { width, height, data };
}

const baseOptions: ImageRenderOptions = {
  width: 20,
  ramp: "classic",
  brightness: 0,
  contrast: 1,
  invert: false,
  dither: "none",
};

describe("image to ASCII renderer", () => {
  const black = makeGrid(20, 40, () => [0, 0, 0]);

  it("maps dark pixels to dense characters and keeps the image aspect ratio", () => {
    const result = renderImageAscii(black, baseOptions);
    expect(result.rows).toBe(20);
    expect(result.lines).toHaveLength(20);
    expect(result.lines[0]).toBe("@".repeat(20));
    expect(result.width).toBe(20);
  });

  it("brightens, inverts and adjusts contrast deterministically", () => {
    const bright = renderImageAscii(makeGrid(20, 40, () => [255, 255, 255]), {
      ...baseOptions,
      brightness: 100,
    });
    expect(bright.lines[0]?.trim()).toBe("");

    const inverted = renderImageAscii(black, { ...baseOptions, invert: true });
    expect(inverted.lines[0]?.trim()).toBe("");

    const contrast = renderImageAscii(makeGrid(20, 40, () => [200, 200, 200]), {
      ...baseOptions,
      contrast: 2,
    });
    expect(contrast.lines[0]?.trim()).toBe("");
  });

  it("uses a 2×4 dot cell for braille output", () => {
    const result = renderImageAscii(makeGrid(40, 80, () => [0, 0, 0]), {
      ...baseOptions,
      ramp: "braille",
    });
    expect(result.cellWidth).toBe(2);
    expect(result.cellHeight).toBe(4);
    expect(result.lines[0]).toBe(String.fromCharCode(0x28ff).repeat(20));
  });

  it("always keeps per-cell colours for the image source", () => {
    const red = makeGrid(20, 40, () => [255, 0, 0]);
    const result = renderImageAscii(red, baseOptions);
    expect(result.colors?.[0]?.[0]).toBe("rgb(255,0,0)");
  });

  it("diffuses error when Floyd–Steinberg dithering is enabled", () => {
    const gray = makeGrid(20, 40, () => [128, 128, 128]);
    const plain = renderImageAscii(gray, { ...baseOptions, ramp: "matrix" });
    const dithered = renderImageAscii(gray, {
      ...baseOptions,
      ramp: "matrix",
      dither: "floyd-steinberg",
    });
    expect(new Set(plain.lines[0]).size).toBe(1);
    expect(new Set(dithered.lines[0]).size).toBe(2);
  });

  it("returns an empty result for an invalid pixel buffer", () => {
    expect(renderImageAscii({ width: 0, height: 0, data: new Uint8ClampedArray() }, baseOptions).lines).toEqual([]);
  });
});
