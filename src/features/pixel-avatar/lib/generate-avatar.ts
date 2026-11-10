import {
  avatarBackgrounds,
  getAvatarPalette,
  type AvatarBackground,
  type AvatarPaletteId,
} from "@/features/pixel-avatar/lib/palettes";
import { createSeededRandom } from "@/features/pixel-avatar/lib/seeds";

export type PixelAvatarRecipe = {
  paletteId: AvatarPaletteId;
  background: AvatarBackground;
  hairStyle: "flat" | "spike" | "cap";
  eyeStyle: "dot" | "wide" | "sleepy";
  mouthStyle: "smile" | "flat" | "surprised";
  accessory: "none" | "earring" | "patch";
};

export function normalizeAvatarOptions(input: Record<string, string | undefined>) {
  const paletteId = getAvatarPalette(input.palette).id;
  const background = avatarBackgrounds.includes(input.background as AvatarBackground)
    ? (input.background as AvatarBackground)
    : "grid";

  return {
    paletteId,
    background,
  };
}

export function generatePixelAvatarRecipe(
  seed: string,
  options: { paletteId?: string; background?: string }
): PixelAvatarRecipe {
  const normalized = normalizeAvatarOptions(options);
  const rng = createSeededRandom(seed);
  const hairStyle = ["flat", "spike", "cap"][Math.floor(rng() * 3)] as PixelAvatarRecipe["hairStyle"];
  const eyeStyle = ["dot", "wide", "sleepy"][Math.floor(rng() * 3)] as PixelAvatarRecipe["eyeStyle"];
  const mouthStyle = ["smile", "flat", "surprised"][Math.floor(rng() * 3)] as PixelAvatarRecipe["mouthStyle"];
  const accessory = ["none", "earring", "patch"][Math.floor(rng() * 3)] as PixelAvatarRecipe["accessory"];

  return {
    paletteId: normalized.paletteId,
    background: normalized.background,
    hairStyle,
    eyeStyle,
    mouthStyle,
    accessory,
  };
}

export function drawPixelAvatar(
  context: CanvasRenderingContext2D,
  recipe: PixelAvatarRecipe,
  size: number
) {
  const palette = getAvatarPalette(recipe.paletteId);
  const unit = size / 16;

  context.clearRect(0, 0, size, size);

  if (recipe.background === "plain") {
    context.fillStyle = palette.background;
    context.fillRect(0, 0, size, size);
  } else if (recipe.background === "halo") {
    context.fillStyle = palette.background;
    context.fillRect(0, 0, size, size);
    context.fillStyle = `${palette.accent}55`;
    context.beginPath();
    context.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
    context.fill();
  } else {
    context.fillStyle = palette.background;
    context.fillRect(0, 0, size, size);
    context.strokeStyle = `${palette.line}22`;
    for (let offset = 0; offset <= size; offset += unit) {
      context.beginPath();
      context.moveTo(offset, 0);
      context.lineTo(offset, size);
      context.stroke();
      context.beginPath();
      context.moveTo(0, offset);
      context.lineTo(size, offset);
      context.stroke();
    }
  }

  context.fillStyle = palette.skin;
  context.fillRect(unit * 4, unit * 4, unit * 8, unit * 8);

  context.fillStyle = palette.hair;
  if (recipe.hairStyle === "cap") {
    context.fillRect(unit * 3, unit * 3, unit * 10, unit * 3);
  } else if (recipe.hairStyle === "spike") {
    context.fillRect(unit * 4, unit * 3, unit * 8, unit * 2);
    context.fillRect(unit * 5, unit * 2, unit, unit);
    context.fillRect(unit * 7, unit * 1, unit, unit);
    context.fillRect(unit * 9, unit * 2, unit, unit);
  } else {
    context.fillRect(unit * 4, unit * 3, unit * 8, unit * 2);
  }

  context.fillStyle = palette.line;
  if (recipe.eyeStyle === "wide") {
    context.fillRect(unit * 5, unit * 7, unit * 2, unit);
    context.fillRect(unit * 9, unit * 7, unit * 2, unit);
  } else if (recipe.eyeStyle === "sleepy") {
    context.fillRect(unit * 5, unit * 7, unit * 2, unit / 2);
    context.fillRect(unit * 9, unit * 7, unit * 2, unit / 2);
  } else {
    context.fillRect(unit * 6, unit * 7, unit, unit);
    context.fillRect(unit * 10, unit * 7, unit, unit);
  }

  if (recipe.mouthStyle === "smile") {
    context.fillRect(unit * 6, unit * 10, unit * 4, unit / 2);
    context.fillRect(unit * 5, unit * 9.5, unit, unit / 2);
    context.fillRect(unit * 10, unit * 9.5, unit, unit / 2);
  } else if (recipe.mouthStyle === "surprised") {
    context.fillRect(unit * 7, unit * 9.5, unit * 2, unit);
  } else {
    context.fillRect(unit * 6, unit * 10, unit * 4, unit / 2);
  }

  context.fillStyle = palette.accent;
  if (recipe.accessory === "earring") {
    context.fillRect(unit * 11.5, unit * 9, unit / 2, unit * 2);
  } else if (recipe.accessory === "patch") {
    context.fillRect(unit * 4.5, unit * 8.5, unit, unit);
  }

  context.strokeStyle = palette.line;
  context.lineWidth = Math.max(2, unit / 1.5);
  context.strokeRect(unit * 4, unit * 4, unit * 8, unit * 8);
}
