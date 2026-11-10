import { describe, expect, it } from "vitest";
import { generateNameSuggestion } from "@/features/random-name/lib/generator";

describe("generateNameSuggestion", () => {
  it("returns the same name for the same seed and filters", () => {
    const filters = { culture: "japanese", gender: "neutral", seed: "abc12345" };

    expect(generateNameSuggestion(filters)).toEqual(generateNameSuggestion(filters));
  });

  it("keeps the requested culture and returns a full name with a speech language code", () => {
    const result = generateNameSuggestion({ culture: "chinese-simplified", gender: "any", seed: "quietfox" });

    expect(result.culture).toBe("chinese-simplified");
    expect(result.fullName.length).toBeGreaterThan(1);
    expect(result.langCode).toBe("zh-CN");
  });

  it("composes family-name-first names for CJK cultures", () => {
    const result = generateNameSuggestion({ culture: "korean", gender: "feminine", seed: "hanwoo" });

    expect(result.gender).toBe("feminine");
    expect(result.fullName).not.toContain(" ");
    expect(result.fullName.length).toBeGreaterThan(1);
  });

  it("falls back to english for an unknown culture", () => {
    const result = generateNameSuggestion({ culture: "klingon", gender: "any", seed: "fallback" });

    expect(result.culture).toBe("english");
    expect(result.langCode).toBe("en-US");
  });
});
