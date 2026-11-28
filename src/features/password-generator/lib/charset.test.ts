import { describe, expect, it } from "vitest";
import { ambiguousChars, buildCharset, charPools, enabledPools } from "./charset";

const allTypes = {
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: false,
  customCharset: "",
};

describe("buildCharset", () => {
  it("concatenates every enabled pool into 94 printable characters", () => {
    expect(buildCharset(allTypes)).toHaveLength(94);
    expect(new Set(Object.values(charPools).join("")).size).toBe(94);
  });

  it("returns an empty string when nothing is enabled", () => {
    expect(
      buildCharset({
        ...allTypes,
        uppercase: false,
        lowercase: false,
        digits: false,
        symbols: false,
      })
    ).toBe("");
  });

  it("drops ambiguous characters from the combined pool", () => {
    const charset = buildCharset({ ...allTypes, excludeAmbiguous: true });
    for (const char of ambiguousChars) {
      expect(charset).not.toContain(char);
    }
  });

  it("uses a custom charset as the only source and dedupes it", () => {
    expect(buildCharset({ ...allTypes, customCharset: "abcabc" })).toBe("abc");
  });

  it("never filters a custom charset", () => {
    expect(buildCharset({ ...allTypes, excludeAmbiguous: true, customCharset: "01lI" })).toBe("01lI");
  });
});

describe("enabledPools", () => {
  it("returns one pool per enabled type", () => {
    expect(enabledPools({ ...allTypes, symbols: false })).toHaveLength(3);
  });

  it("returns a single pool for a custom charset", () => {
    expect(enabledPools({ ...allTypes, customCharset: "xyz" })).toEqual(["xyz"]);
  });
});
