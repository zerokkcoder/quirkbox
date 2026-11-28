import { describe, expect, it } from "vitest";
import { WORDLIST, WORDLIST_SIZE } from "./wordlist";

describe("EFF wordlist", () => {
  it("contains exactly 7776 words", () => {
    expect(WORDLIST).toHaveLength(7776);
    expect(WORDLIST_SIZE).toBe(7776);
  });

  it("has no dice numbers and no empty entries", () => {
    for (const word of WORDLIST) {
      expect(word).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it("has no duplicates", () => {
    expect(new Set(WORDLIST).size).toBe(WORDLIST.length);
  });
});
