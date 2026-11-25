import { describe, expect, it } from "vitest";
import { encodeBmp, wrapPngInIco } from "./encode";

function view(bytes: Uint8Array) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

describe("binary encoders", () => {
  it("writes a valid 24-bit BMP header", () => {
    const rgba = new Uint8ClampedArray(4 * 4);
    rgba.fill(255);
    const bmp = encodeBmp(2, 2, rgba);
    const data = view(bmp);

    expect(String.fromCharCode(bmp[0], bmp[1])).toBe("BM");
    expect(data.getUint32(14, true)).toBe(40); // BITMAPINFOHEADER
    expect(data.getInt32(18, true)).toBe(2);
    expect(data.getInt32(22, true)).toBe(2);
    expect(data.getUint16(28, true)).toBe(24);
    // 2x2 at 24bpp: each row is 6 bytes, padded to the 4-byte boundary -> 8.
    expect(bmp.length).toBe(54 + 2 * 8);
  });

  it("pads BMP rows to a four-byte boundary", () => {
    const bmp = encodeBmp(1, 2, new Uint8ClampedArray(8));
    expect(bmp.length).toBe(54 + 2 * 4);
  });

  it("wraps a PNG payload in a single-image ICO", () => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47]);
    const ico = wrapPngInIco(png, 64, 32);
    const data = view(ico);

    expect(data.getUint16(2, true)).toBe(1);
    expect(data.getUint16(4, true)).toBe(1);
    expect(ico[6]).toBe(64);
    expect(ico[7]).toBe(32);
    expect(data.getUint32(14, true)).toBe(png.length);
    expect(data.getUint32(18, true)).toBe(22);
    expect(ico.slice(22)).toEqual(png);
  });

  it("stores 256 as zero in the ICO dimension byte", () => {
    const ico = wrapPngInIco(new Uint8Array(1), 256, 256);
    expect(ico[6]).toBe(0);
    expect(ico[7]).toBe(0);
  });
});
