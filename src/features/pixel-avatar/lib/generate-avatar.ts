import { Avatar, Style, type StyleDefinition } from "@dicebear/core";
import identiconDefinition from "@dicebear/styles/identicon.json" with { type: "json" };
import pixelArtDefinition from "@dicebear/styles/pixel-art.json" with { type: "json" };
import pixelbotDefinition from "@dicebear/styles/pixelbot.json" with { type: "json" };
import voxelArtDefinition from "@dicebear/styles/voxel-art.json" with { type: "json" };
import { getAvatarPalette } from "@/features/pixel-avatar/lib/palettes";

export const avatarStyles = ["pixel-art", "pixelbot", "voxel-art", "identicon"] as const;
export type AvatarStyleId = (typeof avatarStyles)[number];
export const defaultAvatarStyle: AvatarStyleId = "pixel-art";

/** Side length of the exported PNG. */
export const avatarExportSize = 512;

type AvatarStyleConfig = {
  id: AvatarStyleId;
  style: Style<StyleDefinition>;
  /**
   * Some styles paint the whole canvas themselves, so the palette has to reach them through
   * `backgroundColor`. The others leave the canvas transparent and we paint it underneath.
   */
  paintsBackground: boolean;
};

const avatarStyleConfigs: AvatarStyleConfig[] = [
  { id: "pixel-art", style: new Style(pixelArtDefinition as StyleDefinition), paintsBackground: false },
  { id: "pixelbot", style: new Style(pixelbotDefinition as StyleDefinition), paintsBackground: true },
  { id: "voxel-art", style: new Style(voxelArtDefinition as StyleDefinition), paintsBackground: true },
  { id: "identicon", style: new Style(identiconDefinition as StyleDefinition), paintsBackground: false },
];

export function normalizeAvatarStyle(input?: string): AvatarStyleId {
  return (avatarStyles as readonly string[]).includes(input ?? "") ? (input as AvatarStyleId) : defaultAvatarStyle;
}

export function getAvatarStyleConfig(styleId?: string) {
  const id = normalizeAvatarStyle(styleId);

  return avatarStyleConfigs.find((config) => config.id === id) ?? avatarStyleConfigs[0];
}

/**
 * Renders the avatar for a seed with DiceBear's own pixel art sets. The output is an SVG data
 * URI and every seed maps to exactly one image, so a shared seed is a shared avatar.
 */
export function generateAvatarDataUri(seed: string, options: { styleId?: string; paletteId?: string } = {}) {
  const config = getAvatarStyleConfig(options.styleId);
  const palette = getAvatarPalette(options.paletteId);
  const avatar = new Avatar(config.style, {
    seed,
    size: avatarExportSize,
    // Randomised ids only matter when several SVGs share one document; keeping them off makes
    // the same seed produce a byte-identical render.
    idRandomization: false,
    ...(config.paintsBackground ? { backgroundColor: [palette.background] } : {}),
  });

  return avatar.toDataUri();
}
