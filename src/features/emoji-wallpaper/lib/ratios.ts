export const wallpaperRatios = {
  "9:16": { width: 2160, height: 3840 },
  "9:19.5": { width: 2160, height: 4680 },
  "9:20": { width: 2160, height: 4800 },
  "16:9": { width: 3840, height: 2160 },
} as const;

export type WallpaperRatioId = keyof typeof wallpaperRatios;

export const wallpaperRatioIds = Object.keys(wallpaperRatios) as WallpaperRatioId[];

export const defaultWallpaperRatio: WallpaperRatioId = "9:16";

export function normalizeWallpaperRatio(value?: string | null): WallpaperRatioId {
  return (wallpaperRatioIds as readonly string[]).includes(value ?? "")
    ? (value as WallpaperRatioId)
    : defaultWallpaperRatio;
}

export function getWallpaperSize(ratio?: string | null) {
  return wallpaperRatios[normalizeWallpaperRatio(ratio)];
}
