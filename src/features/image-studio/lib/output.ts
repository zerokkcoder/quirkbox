import { formatExtension } from "./formats";
import type { FormatId } from "./types";

/** `photo.png` → `photo-webp.webp` (or `photo.webp` when the suffix is off). */
export function outputFilename(sourceName: string, format: FormatId, suffix: boolean): string {
  const lastDot = sourceName.lastIndexOf(".");
  const stem = lastDot > 0 ? sourceName.slice(0, lastDot) : sourceName;
  const base = suffix ? `${stem}-${format}` : stem;
  return `${base}.${formatExtension(format)}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
