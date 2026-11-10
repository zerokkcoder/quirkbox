export const avatarPalettes = [
  {
    id: "cobalt",
    skin: "#e8c3a2",
    hair: "#1e3a8a",
    accent: "#2563eb",
    line: "#172554",
    background: "#dbeafe",
  },
  {
    id: "mint",
    skin: "#ecc6a6",
    hair: "#0f766e",
    accent: "#14b8a6",
    line: "#134e4a",
    background: "#ccfbf1",
  },
  {
    id: "sunset",
    skin: "#e9bb8c",
    hair: "#c2410c",
    accent: "#f97316",
    line: "#7c2d12",
    background: "#ffedd5",
  },
  {
    id: "midnight",
    skin: "#d7b08a",
    hair: "#312e81",
    accent: "#6366f1",
    line: "#1e1b4b",
    background: "#e0e7ff",
  }
] as const;

export type AvatarPaletteId = (typeof avatarPalettes)[number]["id"];

export const avatarBackgrounds = ["grid", "halo", "plain"] as const;
export type AvatarBackground = (typeof avatarBackgrounds)[number];

export function getAvatarPalette(paletteId?: string) {
  return avatarPalettes.find((palette) => palette.id === paletteId) ?? avatarPalettes[0];
}
