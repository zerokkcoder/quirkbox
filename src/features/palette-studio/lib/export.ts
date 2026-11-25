import { withHash } from "./color";
import type { PaletteState } from "./types";

export function cssVariables(palette: string[]) {
  const lines = palette.map((hex, index) => `  --palette-${index + 1}: ${withHash(hex)};`);

  return `:root {\n${lines.join("\n")}\n}`;
}

export function tailwindTheme(palette: string[]) {
  const lines = palette.map(
    (hex, index) => `  --color-palette-${index + 1}: ${withHash(hex)};`
  );

  return `@theme {\n${lines.join("\n")}\n}`;
}

export function paletteJson(state: PaletteState, palette: string[]) {
  return `${JSON.stringify(
    {
      seed: withHash(state.color),
      harmony: state.harmony,
      count: state.count,
      preset: state.preset ?? undefined,
      colors: palette.map(withHash),
    },
    null,
    2
  )}\n`;
}

export function paletteFilename(seed: string) {
  return `starrudder-palette-${seed.replace(/^#/, "").toLowerCase()}.png`;
}
