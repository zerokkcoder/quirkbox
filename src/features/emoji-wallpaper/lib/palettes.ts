export const wallpaperPalettes = [
  { id: "cobalt", background: "#eef2ff", swatch: "#1d4ed8" },
  { id: "mint", background: "#ecfdf5", swatch: "#047857" },
  { id: "sunset", background: "#fff7ed", swatch: "#c2410c" },
  { id: "midnight", background: "#e2e8f0", swatch: "#334155" },
  { id: "rose", background: "#fff1f2", swatch: "#be123c" },
  { id: "grape", background: "#f5f3ff", swatch: "#6d28d9" },
] as const;

export type WallpaperPaletteId = (typeof wallpaperPalettes)[number]["id"];

export const defaultWallpaperPaletteId: WallpaperPaletteId = "cobalt";

export function normalizeWallpaperPaletteId(value?: string | null): WallpaperPaletteId {
  return wallpaperPalettes.some((palette) => palette.id === value)
    ? (value as WallpaperPaletteId)
    : defaultWallpaperPaletteId;
}

export function getWallpaperPalette(paletteId?: string | null) {
  return (
    wallpaperPalettes.find((palette) => palette.id === normalizeWallpaperPaletteId(paletteId)) ??
    wallpaperPalettes[0]
  );
}
