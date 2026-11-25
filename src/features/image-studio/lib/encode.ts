import type { DecodedImage } from "./decode";
import { formatMeta } from "./formats";
import { calculateSize, icoDimension, type Size } from "./resize";
import { icoMaxDimension, type FormatId, type ImageStudioState } from "./types";

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || (mime !== "image/png" && blob.type !== mime)) {
          reject(new Error(`This browser cannot encode ${mime}`));
          return;
        }
        resolve(blob);
      },
      mime,
      quality
    );
  });
}

function draw(
  decoded: DecodedImage,
  size: Size,
  background: string | null
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");

  if (background) {
    context.fillStyle = `#${background}`;
    context.fillRect(0, 0, size.width, size.height);
  }
  context.drawImage(decoded.source, 0, 0, size.width, size.height);
  return canvas;
}

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

/** Single-image ICO whose payload is a PNG (works in all modern browsers). */
export function wrapPngInIco(png: Uint8Array, width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(22 + png.length);
  const view = new DataView(bytes.buffer);

  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, 1, true); // one image
  bytes[6] = icoDimension(width);
  bytes[7] = icoDimension(height);
  bytes[8] = 0; // palette size
  bytes[9] = 0; // reserved
  view.setUint16(10, 1, true); // planes
  view.setUint16(12, 32, true); // bits per pixel
  view.setUint32(14, png.length, true);
  view.setUint32(18, 22, true);
  bytes.set(png, 22);

  return bytes;
}

function gifColors(quality: number) {
  return Math.max(16, Math.min(256, Math.round((quality / 100) * 256)));
}

async function encodeGif(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");

  const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const palette = quantize(rgba, gifColors(quality));
  const indexed = applyPalette(rgba, palette);
  const gif = GIFEncoder();
  gif.writeFrame(indexed, canvas.width, canvas.height, { palette, repeat: 0 });
  gif.finish();

  return new Blob([gif.bytes() as BlobPart], { type: "image/gif" });
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  format: FormatId,
  quality: number
): Promise<Blob> {
  const meta = formatMeta[format];

  if (format === "gif") return encodeGif(canvas, quality);

  if (format === "ico") {
    if (canvas.width > icoMaxDimension || canvas.height > icoMaxDimension) {
      throw new Error("ICO is limited to 256×256");
    }
    const png = await canvasToBlob(canvas, "image/png");
    const bytes = wrapPngInIco(new Uint8Array(await png.arrayBuffer()), canvas.width, canvas.height);
    return new Blob([bytes as BlobPart], { type: meta.mime });
  }

  if (format === "bmp") {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");
    const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
    return new Blob([encodeBmp(canvas.width, canvas.height, rgba) as BlobPart], { type: meta.mime });
  }

  return canvasToBlob(canvas, meta.mime, meta.supportsQuality ? quality / 100 : undefined);
}

/** One conversion job: decode → size → compose → encode. */
export async function encodeImage(
  decoded: DecodedImage,
  state: ImageStudioState
): Promise<{ blob: Blob; width: number; height: number }> {
  const size = calculateSize(
    { width: decoded.width, height: decoded.height },
    state.width,
    state.height
  );
  const icoSize =
    state.format === "ico"
      ? calculateSize(size, icoMaxDimension, icoMaxDimension)
      : size;

  const needsOpaque = state.format === "jpeg" || state.format === "bmp" || state.format === "gif";
  const canvas = draw(decoded, icoSize, needsOpaque ? state.background : null);

  try {
    const blob = await encodeCanvas(canvas, state.format, state.quality);
    return { blob, width: icoSize.width, height: icoSize.height };
  } finally {
    decoded.release();
  }
}
