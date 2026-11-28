/** 24-bit BMP with bottom-up BGRA rows, padded to a 4-byte boundary. */
export function encodeBmp(width: number, height: number, rgba: Uint8ClampedArray): Uint8Array {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelsSize = rowSize * height;
  const fileSize = 54 + pixelsSize;
  const bytes = new Uint8Array(fileSize);
  const view = new DataView(bytes.buffer);

  bytes[0] = 0x42; // B
  bytes[1] = 0x4d; // M
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true); // BITMAPINFOHEADER size
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 24, true); // bits per pixel
  view.setUint32(34, pixelsSize, true);

  for (let row = 0; row < height; row += 1) {
    const sourceRow = (height - 1 - row) * width * 4;
    const targetRow = 54 + row * rowSize;
    for (let column = 0; column < width; column += 1) {
      const source = sourceRow + column * 4;
      const target = targetRow + column * 3;
      bytes[target] = rgba[source + 2];
      bytes[target + 1] = rgba[source + 1];
      bytes[target + 2] = rgba[source];
    }
  }

  return bytes;
}
