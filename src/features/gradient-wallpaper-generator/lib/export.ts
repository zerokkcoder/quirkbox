import { paintGradient, paintSampleText } from "./gradient";
import { getGradientWallpaperSize } from "./sizes";
import type { GradientState } from "./types";

export function renderGradientWallpaper(
  canvas: HTMLCanvasElement,
  state: GradientState,
  width: number,
  height: number,
  sampleText: string
): void {
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  paintGradient(ctx, width, height, state);
  if (state.showText) paintSampleText(ctx, width, height, sampleText);
}

/** Full-resolution offscreen render + PNG download. Called from a click handler. */
export function exportGradientWallpaper(state: GradientState, sampleText: string): void {
  if (typeof document === "undefined") return;

  const size = getGradientWallpaperSize(state.ratio);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  paintGradient(ctx, size.width, size.height, state);
  if (state.showText) paintSampleText(ctx, size.width, size.height, sampleText);

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `starrudder-gradient-${state.ratio.replace(/:/g, "x")}-${state.seed}.png`;
  link.click();
}
