import { hashSeed } from "@/lib/seeds";

export const emojiPatternIds = ["grid", "brick", "wave", "scatter"] as const;
export type EmojiPatternId = (typeof emojiPatternIds)[number];
export const defaultEmojiPattern: EmojiPatternId = "grid";

export function normalizeEmojiPattern(value?: string | null): EmojiPatternId {
  return (emojiPatternIds as readonly string[]).includes(value ?? "")
    ? (value as EmojiPatternId)
    : defaultEmojiPattern;
}

export const emojiColumnOptions = [4, 6, 8] as const;
export type EmojiColumns = (typeof emojiColumnOptions)[number];
export const defaultEmojiColumns: EmojiColumns = 6;

export function normalizeEmojiColumns(value?: number | string | null): EmojiColumns {
  const numeric = typeof value === "string" ? Number(value) : value;

  return typeof numeric === "number" && (emojiColumnOptions as readonly number[]).includes(numeric)
    ? (numeric as EmojiColumns)
    : defaultEmojiColumns;
}

export const emojiToneIds = ["colorful", "mono"] as const;
export type EmojiTone = (typeof emojiToneIds)[number];
export const defaultEmojiTone: EmojiTone = "colorful";

export function normalizeEmojiTone(value?: string | null): EmojiTone {
  return (emojiToneIds as readonly string[]).includes(value ?? "")
    ? (value as EmojiTone)
    : defaultEmojiTone;
}

export const emojiFormatIds = ["png", "jpg"] as const;
export type EmojiFormat = (typeof emojiFormatIds)[number];
export const defaultEmojiFormat: EmojiFormat = "png";

export function normalizeEmojiFormat(value?: string | null): EmojiFormat {
  return (emojiFormatIds as readonly string[]).includes(value ?? "")
    ? (value as EmojiFormat)
    : defaultEmojiFormat;
}

export type EmojiPlacement = { emoji: string; x: number; y: number; size: number; rotation: number };

/** Relative glyph size inside one grid cell, shared by every pattern. */
const emojiSizeRatio = 0.86;
/** Used when the caller hands over an empty pool so indexing never divides by zero. */
const fallbackEmoji = "🙂";

/** Signed value in [-1, 1] derived from a seed string. */
function unitFromSeed(key: string): number {
  return (hashSeed(key) % 1000) / 1000 * 2 - 1;
}

/**
 * Builds the emoji placements for one wallpaper. Pure and deterministic: the same options always
 * produce the same layout because every random value is derived from {@link hashSeed}.
 */
export function buildEmojiLayout(options: {
  emojiPool: string[];
  seed: string;
  width: number;
  height: number;
  columns: number;
  pattern: EmojiPatternId;
}): EmojiPlacement[] {
  const { emojiPool, seed, width, height, columns, pattern } = options;
  const pool = emojiPool.length > 0 ? emojiPool : [fallbackEmoji];
  const cell = width / columns;
  const rows = Math.ceil(height / cell);
  const placements: EmojiPlacement[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const index = row * columns + col;
      const emoji = pool[hashSeed(`${seed}:${index}`) % pool.length];

      let x = col * cell + cell / 2;
      let y = row * cell + cell / 2;
      let size = cell * emojiSizeRatio;
      let rotation = 0;

      if (pattern === "brick") {
        if (row % 2 === 1) {
          x += cell / 2;
        }
      } else if (pattern === "wave") {
        y += Math.sin((row + col * 0.15) * Math.PI / 3) * cell * 0.18;
      } else if (pattern === "scatter") {
        x += unitFromSeed(`${seed}:scatter:${index}:dx`) * cell * 0.14;
        y += unitFromSeed(`${seed}:scatter:${index}:dy`) * cell * 0.14;
        rotation = unitFromSeed(`${seed}:scatter:${index}:rotation`) * (20 * Math.PI / 180);
        size *= 0.85 + (hashSeed(`${seed}:scatter:${index}:scale`) % 1000) / 1000 * 0.3;
      }

      placements.push({ emoji, x, y, size, rotation });
    }
  }

  return placements;
}
