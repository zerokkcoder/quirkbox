import { icoMaxDimension, maxDimension } from "./types";

export type Size = { width: number; height: number };

function positiveInteger(input: number | undefined): number {
  if (!Number.isFinite(input)) return 0;
  return Math.max(0, Math.min(maxDimension, Math.floor(input ?? 0)));
}

export function normalizeDimension(input: unknown): number {
  const value = typeof input === "string" ? Number(input) : input;
  return positiveInteger(typeof value === "number" ? value : undefined);
}

/**
 * Fit inside the given box, keeping the aspect ratio and never upscaling.
 * A zero limit means "unlimited" on that axis.
 */
export function calculateSize(source: Size, maxWidth: number, maxHeight: number): Size {
  const width = Math.max(1, positiveInteger(source.width));
  const height = Math.max(1, positiveInteger(source.height));
  const limitWidth = positiveInteger(maxWidth);
  const limitHeight = positiveInteger(maxHeight);

  if (!limitWidth && !limitHeight) return { width, height };

  const scale = Math.min(
    1,
    limitWidth ? limitWidth / width : 1,
    limitHeight ? limitHeight / height : 1
  );

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** ICO directory entries store dimensions in a single byte (0 means 256). */
export function icoDimension(value: number): number {
  return value >= icoMaxDimension ? 0 : value;
}

export function savingsPercent(before: number, after: number): number {
  if (before <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - after / before) * 100)));
}
