import type { DecodedImage } from "./decode";
import { formatMeta } from "./formats";
import { calculateSize, icoDimension, type Size } from "./resize";
import { icoMaxDimension, type FormatId, type ImageStudioState } from "./types";

export { encodeBmp } from "./encode-bmp";

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

/** One worker per page, lazily created on the first CPU-bound conversion. */
let encodeWorker: Worker | null = null;
let nextRequestId = 1;

type PendingEncode = {
  resolve: (bytes: Uint8Array) => void;
  reject: (error: Error) => void;
};
const pendingEncodes = new Map<number, PendingEncode>();

type WorkerRequest =
  | { id: number; kind: "gif"; width: number; height: number; rgba: ArrayBuffer; quality: number }
  | { id: number; kind: "bmp"; width: number; height: number; rgba: ArrayBuffer };

type WorkerResponse = { id: number; bytes?: ArrayBuffer; error?: string };

function getEncodeWorker(): Worker {
  if (encodeWorker) return encodeWorker;

  const worker = new Worker(new URL("./encode.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    const pending = pendingEncodes.get(response.id);
    if (!pending) return;
    pendingEncodes.delete(response.id);
    if (response.error) {
      pending.reject(new Error(response.error));
    } else if (response.bytes) {
      pending.resolve(new Uint8Array(response.bytes));
    } else {
      pending.reject(new Error("Image encoding worker returned no data"));
    }
  };
  worker.onerror = () => {
    for (const pending of pendingEncodes.values()) {
      pending.reject(new Error("Image encoding worker failed"));
    }
    pendingEncodes.clear();
    encodeWorker = null;
    void worker.terminate();
  };

  encodeWorker = worker;
  return worker;
}

function encodeInWorker(request: WorkerRequest): Promise<Uint8Array> {
  const worker = getEncodeWorker();
  return new Promise((resolve, reject) => {
    pendingEncodes.set(request.id, { resolve, reject });
    worker.postMessage(request, [request.rgba]);
  });
}

function taskRgba(canvas: HTMLCanvasElement): ArrayBuffer {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  return context.getImageData(0, 0, canvas.width, canvas.height).data.buffer as ArrayBuffer;
}

async function encodeGif(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const bytes = await encodeInWorker({
    id: nextRequestId++,
    kind: "gif",
    width: canvas.width,
    height: canvas.height,
    rgba: taskRgba(canvas),
    quality,
  });
  return new Blob([bytes as BlobPart], { type: "image/gif" });
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
    const bytes = await encodeInWorker({
      id: nextRequestId++,
      kind: "bmp",
      width: canvas.width,
      height: canvas.height,
      rgba: taskRgba(canvas),
    });
    return new Blob([bytes as BlobPart], { type: meta.mime });
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
