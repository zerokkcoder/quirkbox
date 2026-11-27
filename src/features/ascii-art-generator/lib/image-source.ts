import type { ImageGrid } from "./image-render";

export type ImageSource = {
  grid: ImageGrid;
  name: string;
  width: number;
  height: number;
  /** Object URL owned by the caller; revoke when replacing the image. */
  objectUrl?: string;
};

const maxDimension = 1400;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
    image.src = src;
  });
}

/** Decode a local file entirely in the browser. Nothing is uploaded. */
export async function decodeImageSource(file: File): Promise<ImageSource> {
  if (!file.type.startsWith("image/")) {
    throw new Error("UNSUPPORTED_FILE");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight, 1));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("CANVAS_UNAVAILABLE");
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;

    return {
      grid: { width, height, data: pixels },
      name: file.name,
      width: image.naturalWidth,
      height: image.naturalHeight,
      objectUrl,
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}
