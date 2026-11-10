export const avatarPalettes = [
  { id: "cobalt", background: "#dbeafe", swatch: "#2563eb" },
  { id: "mint", background: "#ccfbf1", swatch: "#0d9488" },
  { id: "sunset", background: "#ffedd5", swatch: "#ea580c" },
  { id: "midnight", background: "#e0e7ff", swatch: "#4338ca" },
  { id: "rose", background: "#ffe4e6", swatch: "#e11d48" },
  { id: "grape", background: "#f3e8ff", swatch: "#9333ea" },
] as const;

export type AvatarPaletteId = (typeof avatarPalettes)[number]["id"];

export function getAvatarPalette(paletteId?: string) {
  return avatarPalettes.find((palette) => palette.id === paletteId) ?? avatarPalettes[0];
}
