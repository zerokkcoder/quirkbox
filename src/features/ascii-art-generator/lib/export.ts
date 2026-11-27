import { asciiBackgroundColors, asciiForegroundColors } from "./palette";
import type { AsciiRenderResult } from "./render";
import type { AsciiBackground } from "./types";

const fontSize = 16;
const lineHeight = 18;
const charWidth = 10;
const padding = 24;
const pixelRatio = 2;

export function canvasSize(result: AsciiRenderResult): { width: number; height: number } {
  const columns = Math.max(result.width, 1);
  const rows = Math.max(result.lines.length, 1);
  return {
    width: (columns * charWidth + padding * 2) * pixelRatio,
    height: (rows * lineHeight + padding * 2) * pixelRatio,
  };
}

/** Paint the art onto a canvas at 2x density for a crisp PNG. */
export function paintAsciiArt(
  canvas: HTMLCanvasElement,
  result: AsciiRenderResult,
  background: AsciiBackground
): void {
  const { width, height } = canvasSize(result);
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.scale(pixelRatio, pixelRatio);
  const cssWidth = width / pixelRatio;
  const cssHeight = height / pixelRatio;
  const fill = asciiBackgroundColors[background];
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, cssWidth, cssHeight);
  }

  ctx.fillStyle = asciiForegroundColors[background];
  ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  ctx.textBaseline = "top";

  result.lines.forEach((line, index) => {
    const rowColors = result.colors?.[index];
    if (!rowColors) {
      ctx.fillText(line, padding, padding + index * lineHeight);
      return;
    }
    for (let column = 0; column < line.length; column += 1) {
      ctx.fillStyle = rowColors[column] ?? asciiForegroundColors[background];
      ctx.fillText(line[column] ?? "", padding + column * charWidth, padding + index * lineHeight);
    }
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG encoding failed"));
    }, "image/png");
  });
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

export function asciiFilename(font: string): string {
  const safeFont = font.replace(/[^a-z0-9-]+/gi, "-").toLowerCase() || "standard";
  return `starrudder-ascii-art-${safeFont}.png`;
}
