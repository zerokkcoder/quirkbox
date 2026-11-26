import { defaultGradientRatio, gradientRatioIds, type GradientRatioId } from "./types";

export const gradientWallpaperSizes: Record<GradientRatioId, { width: number; height: number }> = {
  "9:16": { width: 2160, height: 3840 },
  "9:19.5": { width: 2160, height: 4680 },
  "9:20": { width: 2160, height: 4800 },
  "16:9": { width: 3840, height: 2160 },
  "16:10": { width: 2560, height: 1600 },
  "4:3": { width: 2048, height: 1536 },
};

export function getGradientWallpaperSize(ratio?: string | null) {
  const id = gradientRatioIds.includes(ratio as GradientRatioId)
    ? (ratio as GradientRatioId)
    : defaultGradientRatio;
  return gradientWallpaperSizes[id];
}
