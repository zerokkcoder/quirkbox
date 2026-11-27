import type { AsciiBackground } from "./types";

/** Solid canvas/preview backgrounds; null means keep the surrounding UI theme. */
export const asciiBackgroundColors: Record<AsciiBackground, string | null> = {
  transparent: null,
  space: "#0f1729",
  mist: "#f5f7fb",
};

/** Foregrounds tuned for legibility on each background (used when no image colour is available). */
export const asciiForegroundColors: Record<AsciiBackground, string> = {
  transparent: "#c99b3f",
  space: "#e8c46a",
  mist: "#7a5b12",
};
