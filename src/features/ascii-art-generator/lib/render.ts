import { getGlyph, supportedCharacters } from "./fonts";
import { fallbackChar, maxTextLength, normalizeGap, type Align, type FontId } from "./types";

export type AsciiRenderInput = {
  text: string;
  font: FontId;
  gap: number;
  align: Align;
  /** Extra blank rows between glyph rows, like TAAG's vertical spacing. */
  vGap?: number;
  /** Mirror each row horizontally, like TAAG's flip option. */
  flip?: boolean;
};

export type AsciiRenderResult = {
  /** Plain-text lines, right-trimmed so copying never carries dead spaces. */
  lines: string[];
  /** Widest line, including alignment padding. */
  width: number;
  /** True when at least one input character had to fall back to `?`. */
  hasUnsupported: boolean;
  /** Distinct characters that were replaced. */
  unsupported: string[];
  /** Optional per-character CSS colours, present only for colour image output. */
  colors?: string[][];
};

const supportedSet = new Set(supportedCharacters);

/** Map unsupported characters to `?` so every font can draw the whole input. */
export function sanitizeText(text: string): { safe: string; unsupported: string[] } {
  const upper = text.slice(0, maxTextLength).toUpperCase();
  const unsupported: string[] = [];
  let safe = "";

  for (const char of upper) {
    if (char === " " || supportedSet.has(char)) {
      safe += char;
    } else {
      if (!unsupported.includes(char)) unsupported.push(char);
      safe += fallbackChar;
    }
  }

  return { safe, unsupported };
}

export function renderAscii(input: AsciiRenderInput): AsciiRenderResult {
  const { safe, unsupported } = sanitizeText(input.text);
  const gap = " ".repeat(normalizeGap(input.gap));
  const chars = Array.from(safe);

  if (chars.length === 0) {
    return { lines: [], width: 0, hasUnsupported: false, unsupported: [] };
  }

  const glyphs = chars.map((char) => getGlyph(input.font, char));
  const height = Math.max(...glyphs.map((glyph) => glyph.length));
  const rawLines: string[] = [];

  const vGap = Math.max(0, Math.round(input.vGap ?? 0));
  for (let row = 0; row < height; row += 1) {
    const joined = glyphs
      .map((glyph) => glyph[row] ?? " ".repeat(glyph[0]?.length ?? 1))
      .join(gap);
    const line = (input.flip ? Array.from(joined).reverse().join("") : joined).replace(/\s+$/, "");
    rawLines.push(line);
    if (vGap > 0 && row < height - 1) {
      for (let extra = 0; extra < vGap; extra += 1) rawLines.push("");
    }
  }

  const width = Math.max(...rawLines.map((line) => line.length));
  const lines = alignLines(rawLines, width, input.align);

  return {
    lines,
    width,
    hasUnsupported: unsupported.length > 0,
    unsupported,
  };
}

function alignLines(lines: string[], width: number, align: Align): string[] {
  if (align === "left") return lines;
  return lines.map((line) => {
    const pad = width - line.length;
    if (pad <= 0) return line;
    if (align === "center") {
      const left = Math.floor(pad / 2);
      return `${" ".repeat(left)}${line}${" ".repeat(pad - left)}`;
    }
    return `${" ".repeat(pad)}${line}`;
  });
}

export function asciiToText(result: AsciiRenderResult): string {
  return result.lines.join("\n");
}
