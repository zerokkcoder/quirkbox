export const avatarPalettes = [
  {
    id: "bubblegum",
    label: "Bubblegum",
    skin: "#f2c49b",
    hair: "#7c3aed",
    accent: "#ec4899",
    line: "#3b0764",
    background: "#fce7f3",
  },
  {
    id: "mint",
    label: "Mint",
    skin: "#ecc6a6",
    hair: "#0f766e",
    accent: "#14b8a6",
    line: "#134e4a",
    background: "#ccfbf1",
  },
  {
    id: "sunset",
    label: "Sunset",
    skin: "#e9bb8c",
    hair: "#c2410c",
    accent: "#f97316",
    line: "#7c2d12",
    background: "#ffedd5",
  },
  {
    id: "midnight",
    label: "Midnight",
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
