import { describe, expect, it } from "vitest";
import { fonts, getGlyph, supportedCharacters } from "./fonts";
import { fallbackChar, fontIds } from "./types";

const requiredCharacters = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?-_'",
  fallbackChar,
];

describe("ascii art fonts", () => {
  it("ships exactly the advertised styles", () => {
    expect(Object.keys(fonts).sort()).toEqual([...fontIds].sort());
  });

  it("has a complete glyph with ink for every required character in every font", () => {
    for (const id of fontIds) {
      for (const char of requiredCharacters) {
        const glyph = getGlyph(id, char);
        expect(glyph.length, `${id}/${char} row count`).toBeGreaterThan(0);
        for (const row of glyph) {
          expect(row.length, `${id}/${char} row width`).toBeGreaterThan(0);
        }
        // A blank glyph renders as invisible output; fonts must fall back to a
        // visible drawing rather than silently dropping the character.
        // (Row widths may differ by design — banner's frame is wider than its
        // body — so no rectangularity assertion here.)
        expect(glyph.some((row) => row.trim().length > 0), `${id}/${char} has ink`).toBe(true);
      }
    }
  });

  it("covers the supported character set hinted to users", () => {
    for (const char of requiredCharacters) {
      expect(supportedCharacters).toContain(char);
    }
  });

  it("falls back to `?` for unknown characters", () => {
    expect(getGlyph("standard", "中")).toEqual(getGlyph("standard", fallbackChar));
  });

  it("derives distinct layouts for each style", () => {
    const signatures = fontIds.map((id) => getGlyph(id, "A").join("/"));
    expect(new Set(signatures).size).toBe(fontIds.length);
  });
});
