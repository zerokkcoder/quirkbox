export const emojiThemes = {
  space: ["🚀", "🛸", "🪐", "⭐", "🌙", "☄️", "👽", "🌌"],
  nature: ["🌿", "🌸", "🍄", "🌈", "🌊", "🔥", "❄️", "🍃"],
  animals: ["🐶", "🐱", "🦊", "🐼", "🦁", "🐸", "🦋", "🐢"],
  food: ["🍕", "🍔", "🍟", "🍩", "🍦", "🍓", "🍣", "🍰"],
  hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍"],
  symbols: ["✨", "💫", "🌟", "🔆", "⚡", "💠", "🔷", "🔶"],
} as const;

export type EmojiTheme = keyof typeof emojiThemes;

export const emojiThemeIds = Object.keys(emojiThemes) as EmojiTheme[];

export const defaultEmojiTheme: EmojiTheme = "space";

export function normalizeEmojiTheme(value?: string | null): EmojiTheme {
  return (emojiThemeIds as readonly string[]).includes(value ?? "")
    ? (value as EmojiTheme)
    : defaultEmojiTheme;
}

export function getEmojiThemeEmojis(theme?: string | null): string[] {
  return [...emojiThemes[normalizeEmojiTheme(theme)]];
}

/** Upper bound on how many graphemes a custom emoji input keeps. */
export const maxEmojiInputCount = 12;

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** Splits arbitrary text into trimmed emoji grapheme clusters, capped at {@link maxEmojiInputCount}. */
export function splitEmojiInput(text: string): string[] {
  const emojis: string[] = [];

  for (const { segment } of graphemeSegmenter.segment(text)) {
    if (segment.trim().length === 0) {
      continue;
    }

    emojis.push(segment);

    if (emojis.length >= maxEmojiInputCount) {
      break;
    }
  }

  return emojis;
}
