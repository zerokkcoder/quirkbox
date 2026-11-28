/** Off-main-thread encoding for the two formats that are CPU-bound in JS. */
import { GIFEncoder, applyPalette, quantize } from "gifenc";
import { encodeBmp } from "./encode-bmp";

type WorkerRequest =
  | { id: number; kind: "gif"; width: number; height: number; rgba: ArrayBuffer; quality: number }
  | { id: number; kind: "bmp"; width: number; height: number; rgba: ArrayBuffer };

type WorkerResponse =
  | { id: number; bytes: ArrayBuffer; error?: undefined }
  | { id: number; bytes?: undefined; error: string };

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse, transfer?: Transferable[]): void;
};

scope.onmessage = (event) => {
  const request = event.data;
  const rgba = new Uint8ClampedArray(request.rgba);

  try {
    let bytes: Uint8Array;

    if (request.kind === "bmp") {
      bytes = encodeBmp(request.width, request.height, rgba);
    } else {
      const colors = Math.max(16, Math.min(256, Math.round((request.quality / 100) * 256)));
      const palette = quantize(rgba, colors);
      const indexed = applyPalette(rgba, palette);
      const gif = GIFEncoder();
      gif.writeFrame(indexed, request.width, request.height, { palette, repeat: 0 });
      gif.finish();
      bytes = gif.bytes();
    }

    // Float32Array views can be backed by a larger buffer; copy only the bytes.
    const payload = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
      ? (bytes.buffer as ArrayBuffer)
      : bytes.slice().buffer;
    scope.postMessage({ id: request.id, bytes: payload }, [payload]);
  } catch (error) {
    scope.postMessage({ id: request.id, error: error instanceof Error ? error.message : String(error) });
  }
};
