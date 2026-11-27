import { isometric2Glyphs } from "./isometric2";
import { fallbackChar, fontIds, type FontId } from "./types";

/**
 * Classic 5x7 dot-matrix glyphs, shared by all six styles.
 * "#" = inked cell, "." = empty cell, "/" separates the 7 rows.
 * Keeping one source of truth makes every style deterministic and unit-testable.
 */
const dotMatrix: Record<string, string> = {
  " ": "...../...../...../...../...../...../.....",
  A: ".###./#...#/#...#/#####/#...#/#...#/#...#",
  B: "####./#...#/#...#/####./#...#/#...#/####.",
  C: ".####/#..../#..../#..../#..../#..../.####",
  D: "####./#...#/#...#/#...#/#...#/#...#/####.",
  E: "#####/#..../#..../####./#..../#..../#####",
  F: "#####/#..../#..../####./#..../#..../#....",
  G: ".####/#..../#..../#.###/#...#/#...#/.###.",
  H: "#...#/#...#/#...#/#####/#...#/#...#/#...#",
  I: "#####/..#../..#../..#../..#../..#../#####",
  J: "..###/...#./...#./...#./...#./#..#./.##..",
  K: "#...#/#..#./#.#../##.../#.#../#..#./#...#",
  L: "#..../#..../#..../#..../#..../#..../#####",
  M: "#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#",
  N: "#...#/##..#/##..#/#.#.#/#..##/#..##/#...#",
  O: ".###./#...#/#...#/#...#/#...#/#...#/.###.",
  P: "####./#...#/#...#/####./#..../#..../#....",
  Q: ".###./#...#/#...#/#...#/#.#.#/#..#./.##.#",
  R: "####./#...#/#...#/####./#.#../#..#./#...#",
  S: ".####/#..../#..../.###./....#/....#/####.",
  T: "#####/..#../..#../..#../..#../..#../..#..",
  U: "#...#/#...#/#...#/#...#/#...#/#...#/.###.",
  V: "#...#/#...#/#...#/#...#/#...#/.#.#./..#..",
  W: "#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#",
  X: "#...#/#...#/.#.#./..#../.#.#./#...#/#...#",
  Y: "#...#/#...#/.#.#./..#../..#../..#../..#..",
  Z: "#####/....#/...#./..#../.#.../#..../#####",
  "0": ".###./#...#/#..##/#.#.#/##..#/#...#/.###.",
  "1": "..#../.##../..#../..#../..#../..#../.###.",
  "2": ".###./#...#/....#/...#./..#../.#.../#####",
  "3": "####./....#/....#/.###./....#/....#/####.",
  "4": "...#./..##./.#.#./#..#./#####/...#./...#.",
  "5": "#####/#..../####./....#/....#/#...#/.###.",
  "6": ".###./#..../#..../####./#...#/#...#/.###.",
  "7": "#####/....#/...#./..#../.#.../.#.../.#...",
  "8": ".###./#...#/#...#/.###./#...#/#...#/.###.",
  "9": ".###./#...#/#...#/.####/....#/....#/.###.",
  ".": "...../...../...../...../...../.##../.##..",
  ",": "...../...../...../...../.##../.##../.#...",
  "!": "..#../..#../..#../..#../..#../...../..#..",
  "?": ".###./#...#/....#/...#./..#../...../..#..",
  "-": "...../...../...../#####/...../...../.....",
  "_": "...../...../...../...../...../...../#####",
  "'": "..#../..#../.#.../...../...../...../.....",
  ":": "...../..#../...../...../...../..#../.....",
  ";": "...../..#../...../...../..#../..#../.#...",
  "(": "...#./..#../.#.../.#.../.#.../..#../...#.",
  ")": ".#.../..#../...#./...#./...#./..#../.#...",
  "+": "...../..#../..#../#####/..#../..#../.....",
  "=": "...../...../#####/...../#####/...../.....",
  "*": "...../.#.#./..#../#####/..#../.#.#./.....",
  "/": "....#/....#/...#./..#../.#.../#..../#....",
  "#": ".#.#./.#.#./#####/.#.#./#####/.#.#./.#.#.",
  "@": ".###./#...#/#.###/#.#.#/#.###/#..../.###.",
  '"': ".#..#/.#..#/...../...../...../...../.....",
};

/** `.` -> space; `#` stays a hash. The canonical figlet-ish dot-matrix look. */
function standard(rows: string[]): string[] {
  return rows.map((row) => row.replace(/\./g, " "));
}

/** Double both axes for a heavier, high-impact headline. */
function big(rows: string[]): string[] {
  const lines: string[] = [];
  for (const row of rows) {
    const wide = row.replace(/#/g, "##").replace(/\./g, "  ");
    lines.push(wide, wide);
  }
  return lines;
}

/** Shift each row right to create an italic slant. */
function slant(rows: string[]): string[] {
  return rows.map((row, index) => `${" ".repeat(Math.floor(index / 2))}${row.replace(/\./g, " ")}`);
}

/** Downsample to a compact 3x5 grid for narrow columns. */
function small(rows: string[]): string[] {
  return [0, 1, 3, 5, 6].map((rowIndex) =>
    [0, 2, 4]
      .map((column) => (rows[rowIndex]?.[column] === "#" ? "#" : " "))
      .join("")
  );
}

/** Wrap each glyph in a framed banner cell. */
function banner(rows: string[]): string[] {
  const body = rows.map((row) => `|${row.replace(/\./g, " ")}|`);
  return ["+-------+", ...body, "+-------+"];
}

/** Tall, evenly spaced glyphs that read like a seven-segment display. */
function digital(rows: string[]): string[] {
  const lines: string[] = [];
  for (const row of rows) {
    const scaled = row.replace(/#/g, "@").replace(/\./g, " ");
    lines.push(scaled, scaled);
  }
  return lines;
}

const styles: Record<Exclude<FontId, "isometric2">, (rows: string[]) => string[]> = {
  standard,
  big,
  slant,
  small,
  banner,
  digital,
};

export type FontDefinition = {
  id: FontId;
  glyphs: Record<string, string[]>;
};

function buildFont(id: FontId): FontDefinition {
  if (id === "isometric2") {
    return { id, glyphs: isometric2Glyphs };
  }

  const transform = styles[id];
  const glyphs: Record<string, string[]> = {};
  for (const [char, encoded] of Object.entries(dotMatrix)) {
    glyphs[char] = transform(encoded.split("/"));
  }
  return { id, glyphs };
}

export const fonts: Record<FontId, FontDefinition> = Object.fromEntries(
  fontIds.map((id) => [id, buildFont(id)])
) as Record<FontId, FontDefinition>;

export function getGlyph(font: FontId, char: string): string[] {
  const key = char.toUpperCase();
  const definition = fonts[font] ?? fonts.standard;
  return definition.glyphs[key] ?? definition.glyphs[fallbackChar] ?? ["?"];
}

/** Characters the bundled fonts can draw, for the input hint. */
export const supportedCharacters = Array.from(
  new Set([...Object.keys(dotMatrix), ...Object.keys(isometric2Glyphs)])
).filter((char) => char !== " ");
