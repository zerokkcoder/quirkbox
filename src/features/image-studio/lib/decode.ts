import type { SourceFormatId } from "./types";

export type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

/** Strip scripts, handlers and remote references before rasterizing an SVG. */
export function sanitizeSvg(source: string): string {
  return source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject\s*>/gi, "")
    .replace(/\bon[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|xlink:href)\s*=\s*(?:"(?:https?:)?\/\/[^"]*"|'(?:https?:)?\/\/[^']*')/gi, "")
    .replace(/<image\b[^>]*\bhref\s*=\s*(?:"data:[^"]*"|'data:[^']*')[^>]*>/gi, "");
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be decoded"));
    image.src = url;
  });
}

async function decodeViaImage(blob: Blob): Promise<DecodedImage> {
  const url = URL.createObjectURL(blob);
  try {
    const image = await loadImage(url);
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

/** File → drawable bitmap. Every object URL is released by `release()`. */
export async function decodeImage(file: File, sourceFormat: SourceFormatId | null): Promise<DecodedImage> {
  if (sourceFormat === "svg") {
    const text = sanitizeSvg(await file.text());
    const sanitized = new Blob([text], { type: "image/svg+xml;charset=utf-8" });
    return decodeViaImage(sanitized);
  }

  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // ICO and some platform-specific formats fall back to <img>.
    }
  }

  return decodeViaImage(file);
}
