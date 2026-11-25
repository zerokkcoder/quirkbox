import {
  formatIds,
  type FormatId,
  type SourceFormatId,
  sourceFormatIds,
} from "./types";

type FormatMeta = {
  mime: string;
  extension: string;
  supportsQuality: boolean;
  noteKey: string;
};

export const formatMeta: Record<FormatId, FormatMeta> = {
  png: { mime: "image/png", extension: "png", supportsQuality: false, noteKey: "lossless" },
  jpeg: { mime: "image/jpeg", extension: "jpg", supportsQuality: true, noteKey: "flatten" },
  webp: { mime: "image/webp", extension: "webp", supportsQuality: true, noteKey: "modern" },
  avif: { mime: "image/avif", extension: "avif", supportsQuality: true, noteKey: "avif" },
  gif: { mime: "image/gif", extension: "gif", supportsQuality: true, noteKey: "staticGif" },
  bmp: { mime: "image/bmp", extension: "bmp", supportsQuality: false, noteKey: "large" },
  ico: { mime: "image/x-icon", extension: "ico", supportsQuality: false, noteKey: "icon" },
};

const mimeToFormat = new Map<string, FormatId | "svg">([
  ["image/png", "png"],
  ["image/jpeg", "jpeg"],
  ["image/jpg", "jpeg"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
  ["image/bmp", "bmp"],
  ["image/x-ms-bmp", "bmp"],
  ["image/x-icon", "ico"],
  ["image/vnd.microsoft.icon", "ico"],
  ["image/svg+xml", "svg"],
]);

const extensionToFormat = new Map<string, SourceFormatId>([
  ["png", "png"],
  ["jpg", "jpeg"],
  ["jpeg", "jpeg"],
  ["webp", "webp"],
  ["avif", "avif"],
  ["gif", "gif"],
  ["bmp", "bmp"],
  ["ico", "ico"],
  ["svg", "svg"],
]);

export function normalizeFormat(input: string | undefined | null): FormatId | null {
  return formatIds.find((id) => id === input) ?? null;
}

export function normalizeSourceFormat(input: string | undefined | null): SourceFormatId | null {
  return sourceFormatIds.find((id) => id === input) ?? null;
}

/** MIME takes priority; the extension is a fallback for oddly-typed files. */
export function detectSourceFormat(file: { type?: string; name?: string }): SourceFormatId | null {
  const mime = (file.type ?? "").toLowerCase().split(";")[0].trim();
  const fromMime = mimeToFormat.get(mime);
  if (fromMime) return fromMime;

  const extension = (file.name ?? "").split(".").pop()?.toLowerCase() ?? "";
  return extensionToFormat.get(extension) ?? null;
}

export function formatExtension(format: FormatId) {
  return formatMeta[format].extension;
}

export function supportsQuality(format: FormatId) {
  return formatMeta[format].supportsQuality;
}

/** Output formats that every modern browser can encode via canvas.toBlob. */
export const nativeOutputFormats: readonly FormatId[] = ["png", "jpeg", "webp"];

/** Probe rather than trust a browser/version whitelist (AVIF varies by release). */
export async function isEncodable(mime: string): Promise<boolean> {
  if (typeof document === "undefined") return false;

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  return new Promise<boolean>((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob?.type === mime && blob.size > 0), mime, 0.8);
    } catch {
      resolve(false);
    }
  });
}

/** AVIF is the only optional native format; ICO/BMP/GIF use our own encoders. */
export async function detectAvailableFormats(): Promise<FormatId[]> {
  const available = [...nativeOutputFormats];
  if (await isEncodable(formatMeta.avif.mime)) available.push("avif");
  available.push("gif", "bmp", "ico");
  return available;
}

/** The target format we preselect when the user has not chosen one yet. */
export function suggestFormat(source: SourceFormatId | null): FormatId {
  if (!source || source === "png" || source === "svg" || source === "gif" || source === "ico") {
    return "webp";
  }
  if (source === "webp") return "jpeg";
  return "webp";
}
